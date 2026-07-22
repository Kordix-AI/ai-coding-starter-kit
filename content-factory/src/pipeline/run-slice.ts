import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { loadChannelProfile } from '../channels/load.js'
import { MockTTSProvider } from '../providers/tts/mock.js'
import { ProviderMarksAlignmentProvider } from '../providers/alignment/mock.js'
import { readWavDurationMs } from '../audio/wav.js'
import { buildTimeline } from '../timeline/build-timeline.js'
import { qcTimeline, type QcReport } from '../timeline/qc.js'
import { buildCues, toSrt, toVtt } from '../subtitles/index.js'
import { JobStateMachine, stableHash } from '../state/machine.js'
import { estimateVideoCost, type CostEstimate } from '../cost/estimate.js'
import { renderCapabilityMatrix } from '../providers/registry.js'
import { demoBrief, demoScript } from './demo.js'
import type { Alignment, Timeline, ChannelProfile, VideoBrief, VoiceoverScript } from '../schemas/index.js'
import type { TTSProvider, AlignmentProvider } from '../providers/interfaces.js'

const VIDEOS_DIR = fileURLToPath(new URL('../../videos/', import.meta.url))

export interface SliceResult {
  video_id: string
  out_dir: string
  audio_duration_ms: number
  scene_count: number
  timeline: Timeline
  alignment: Alignment
  qc: QcReport
  cost: CostEstimate
  jobs: ReturnType<JobStateMachine['snapshot']>
  files: string[]
}

export interface ProductionInput {
  channel: ChannelProfile
  brief: VideoBrief
  script: VoiceoverScript
  outRoot?: string
  now?: () => string
  mockCost?: boolean
  /** Provider-Injektion (Default: sichere Mocks). Echt: Higgsfield + Worker-Alignment. */
  tts?: TTSProvider
  aligner?: AlignmentProvider
}

function writeJson(path: string, obj: unknown, files: string[]): void {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n')
  files.push(path)
}
function writeText(path: string, text: string, files: string[]): void {
  writeFileSync(path, text)
  files.push(path)
}

/**
 * Ebene 2 — EIN kontrolliertes Production Package pro Video.
 * Profile → Brief → Skript → TTS → echtes Alignment → Timeline → Untertitel → QC.
 * Provider sind injizierbar; Default = sichere Mocks (kein bezahltes Generieren, kein Render).
 */
export async function runProduction(input: ProductionInput): Promise<SliceResult> {
  const { channel, brief, script } = input
  const outRoot = input.outRoot ?? VIDEOS_DIR
  const now = input.now ?? (() => new Date().toISOString())
  const tts = input.tts ?? new MockTTSProvider()
  const aligner = input.aligner ?? new ProviderMarksAlignmentProvider()
  const videoId = brief.video_id
  const files: string[] = []
  const jobs = new JobStateMachine(videoId)

  const dir = (sub: string) => join(outRoot, videoId, sub)
  for (const sub of ['', 'research', 'script', 'audio', 'storyboard', 'captions', 'qc', 'renders']) {
    mkdirSync(dir(sub), { recursive: true })
  }

  writeJson(join(dir(''), 'brief.json'), brief, files)
  writeJson(join(dir('script'), 'voiceover.segments.json'), script, files)

  // Claims/Quellen (keine erfundenen Quellen)
  const claimIds = [...new Set(script.segments.flatMap((s) => s.claim_ids))]
  writeJson(
    join(dir('research'), 'claims.json'),
    claimIds.map((id) => ({ claim_id: id, status: 'needs_source', trust_level: 'unverified' })),
    files,
  )

  // Kosten-Gate
  const cost = estimateVideoCost({
    script,
    sceneCount: script.segments.length,
    i2vClips: 0,
    durationMs: brief.target_duration_sec * 1000,
    budgetUsd: channel.budget_usd_per_video,
    mock: input.mockCost ?? true,
  })

  // Audio
  jobs.start('audio', stableHash({ script, voice: channel.tts.voice_id }))
  const wavPath = join(dir('audio'), 'voiceover.wav')
  const ttsResult = await tts.synthesize(script, wavPath)
  files.push(wavPath)
  jobs.succeed('audio', stableHash({ dur: ttsResult.audio_duration_ms }))

  const audioDurationMs = readWavDurationMs(wavPath)

  // Alignment
  jobs.start('alignment', stableHash({ audioDurationMs }))
  const alignment = await aligner.align({
    script,
    audioPath: wavPath,
    audioDurationMs,
    providerMarks: ttsResult.provider_marks,
  })
  writeJson(join(dir('audio'), 'alignment.words.json'), alignment.words, files)
  writeJson(join(dir('audio'), 'alignment.segments.json'), alignment.segments, files)
  jobs.succeed('alignment', stableHash({ w: alignment.words.length }))

  // Timeline
  jobs.start('timeline', stableHash({ conf: alignment.min_confidence, n: alignment.segments.length }))
  const timeline = buildTimeline({ script, alignment, channel })
  writeJson(join(dir('storyboard'), 'timeline.json'), timeline, files)
  jobs.succeed('timeline', stableHash({ scenes: timeline.scenes.length }))

  // Untertitel
  jobs.start('subtitles')
  const cues = buildCues(alignment)
  writeText(join(dir('captions'), 'subtitles.srt'), toSrt(cues), files)
  writeText(join(dir('captions'), 'subtitles.vtt'), toVtt(cues), files)
  jobs.succeed('subtitles')

  // QC
  jobs.start('qc')
  const qc = qcTimeline(timeline, { alignmentMinConfidence: alignment.min_confidence })
  writeJson(join(dir('qc'), 'media-qc.json'), qc, files)
  if (qc.ok) jobs.succeed('qc')
  else jobs.fail('qc', qc.issues.filter((i) => i.level === 'error').map((i) => i.code).join(','))

  writeText(
    join(dir('renders'), 'RENDER_PLAN.md'),
    `# Render Plan (nicht ausgeführt)\n\nRenderProvider 'remotion-ffmpeg' ist 'configurable': ffmpeg/ffprobe + Worker nötig.\nEingabe steht bereit: storyboard/timeline.json + audio/voiceover.wav + captions/subtitles.srt.\n`,
    files,
  )

  writeJson(
    join(dir(''), 'manifest.json'),
    {
      video_id: videoId,
      channel_id: channel.channel_id,
      slug: videoId,
      created_at: now(),
      current_stage: qc.ok ? 'qc_passed' : 'qc_failed',
      artifacts: {
        brief: { path: 'brief.json', version: brief.brief_version, status: 'ready' },
        script: { path: 'script/voiceover.segments.json', version: script.script_version, status: 'ready' },
        audio: { path: 'audio/voiceover.wav', version: '1', status: 'ready' },
        timeline: { path: 'storyboard/timeline.json', version: '1', status: 'ready' },
        subtitles_srt: { path: 'captions/subtitles.srt', version: '1', status: 'ready' },
        qc: { path: 'qc/media-qc.json', version: '1', status: qc.ok ? 'ready' : 'failed' },
      },
    },
    files,
  )

  return {
    video_id: videoId,
    out_dir: join(outRoot, videoId),
    audio_duration_ms: audioDurationMs,
    scene_count: timeline.scenes.length,
    timeline,
    alignment,
    qc,
    cost,
    jobs: jobs.snapshot(),
    files,
  }
}

export interface SliceOptions {
  outRoot?: string
  channelSlug?: string
  now?: () => string
  mockCost?: boolean
}

/** Demo-Wrapper: Hidden-Rush-Spotlight-Slice über runProduction. */
export async function runSlice(opts: SliceOptions = {}): Promise<SliceResult> {
  const channel = loadChannelProfile(opts.channelSlug ?? 'hidden-rush')
  return runProduction({
    channel,
    brief: demoBrief,
    script: demoScript,
    outRoot: opts.outRoot,
    now: opts.now,
    mockCost: opts.mockCost,
  })
}

// CLI-Entry
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  runSlice()
    .then((r) => {
      console.log('\n=== Capability Matrix ===')
      console.log(renderCapabilityMatrix())
      console.log('\n=== Slice Result ===')
      console.log(`video_id:        ${r.video_id}`)
      console.log(`audio_duration:  ${r.audio_duration_ms} ms`)
      console.log(`scenes:          ${r.scene_count}`)
      console.log(`QC ok:           ${r.qc.ok}  (issues: ${r.qc.issues.length})`)
      console.log(`cost (mock):     $${r.cost.total_usd} / budget $${r.cost.budget_usd}`)
      console.log(`out_dir:         ${r.out_dir}`)
      console.log(`files written:   ${r.files.length}`)
      if (!r.qc.ok) process.exitCode = 1
    })
    .catch((e) => {
      console.error(e)
      process.exitCode = 1
    })
}
