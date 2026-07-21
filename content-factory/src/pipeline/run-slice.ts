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
import { JobStateMachine } from '../state/machine.js'
import { estimateVideoCost, type CostEstimate } from '../cost/estimate.js'
import { renderCapabilityMatrix } from '../providers/registry.js'
import { demoBrief, demoScript, DEMO_VIDEO_ID } from './demo.js'
import { stableHash } from '../state/machine.js'
import type { Alignment, Timeline } from '../schemas/index.js'

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

export interface SliceOptions {
  outRoot?: string
  channelSlug?: string
  now?: () => string
  mockCost?: boolean
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
 * MVP vertikaler Slice: Profile → Brief → Skript → (Mock-)TTS → echtes Alignment
 * → Timeline → Untertitel → QC → Production Package. Kein bezahltes Generieren,
 * kein Render (ffmpeg-Worker separat). Deterministisch & wiederholbar.
 */
export async function runSlice(opts: SliceOptions = {}): Promise<SliceResult> {
  const outRoot = opts.outRoot ?? VIDEOS_DIR
  const slug = opts.channelSlug ?? 'hidden-rush'
  const now = opts.now ?? (() => new Date().toISOString())
  const files: string[] = []

  const channel = loadChannelProfile(slug)
  const script = demoScript
  const brief = demoBrief
  const videoId = DEMO_VIDEO_ID
  const jobs = new JobStateMachine(videoId)

  const dir = (sub: string) => join(outRoot, videoId, sub)
  for (const sub of ['', 'research', 'script', 'audio', 'storyboard', 'captions', 'qc', 'renders']) {
    mkdirSync(dir(sub), { recursive: true })
  }

  // Brief + Skript
  writeJson(join(dir(''), 'brief.json'), brief, files)
  writeJson(join(dir('script'), 'voiceover.segments.json'), script, files)

  // Quellen/Claims (keine erfundenen Quellen — reale, bekannte Studie)
  writeJson(
    join(dir('research'), 'claims.json'),
    [
      {
        claim_id: 'C1',
        text: 'People overestimate how much others notice them (spotlight effect).',
        source_id: 'S1',
      },
    ],
    files,
  )
  writeJson(
    join(dir('research'), 'sources.json'),
    [
      {
        source_id: 'S1',
        title:
          'Gilovich, Medvec & Savitsky (2000): The spotlight effect in social judgment',
        type: 'peer-reviewed psychology study',
        note: 'Referenz für C1; vor Produktion gegen Primärquelle verifizieren.',
      },
    ],
    files,
  )

  // Kosten-Gate (Mock → 0)
  const cost = estimateVideoCost({
    script,
    sceneCount: script.segments.length,
    i2vClips: 0,
    durationMs: brief.target_duration_sec * 1000,
    budgetUsd: channel.budget_usd_per_video,
    mock: opts.mockCost ?? true,
  })

  // Audio (Mock-TTS) — reales WAV
  const audioInHash = stableHash({ script, voice: channel.tts.voice_id })
  jobs.start('audio', audioInHash)
  const tts = new MockTTSProvider()
  const wavPath = join(dir('audio'), 'voiceover.wav')
  const ttsResult = await tts.synthesize(script, wavPath)
  files.push(wavPath)
  jobs.succeed('audio', stableHash({ dur: ttsResult.audio_duration_ms }))

  // reale Dauer AUS dem Audio bestimmen (ffprobe-äquivalent)
  const audioDurationMs = readWavDurationMs(wavPath)

  // Alignment
  jobs.start('alignment', stableHash({ audioDurationMs }))
  const aligner = new ProviderMarksAlignmentProvider()
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
  jobs.start('timeline', stableHash({ align: alignment.min_confidence, n: alignment.segments.length }))
  const timeline = buildTimeline({ script, alignment, channel })
  writeJson(join(dir('storyboard'), 'timeline.json'), timeline, files)
  jobs.succeed('timeline', stableHash({ scenes: timeline.scenes.length }))

  // Untertitel (aus demselben Alignment)
  jobs.start('subtitles')
  const cues = buildCues(alignment)
  writeText(join(dir('captions'), 'subtitles.srt'), toSrt(cues), files)
  writeText(join(dir('captions'), 'subtitles.vtt'), toVtt(cues), files)
  jobs.succeed('subtitles')

  // QC (Timing + Konfidenz)
  jobs.start('qc')
  const qc = qcTimeline(timeline, { alignmentMinConfidence: alignment.min_confidence })
  writeJson(join(dir('qc'), 'media-qc.json'), qc, files)
  if (qc.ok) jobs.succeed('qc')
  else jobs.fail('qc', qc.issues.filter((i) => i.level === 'error').map((i) => i.code).join(','))

  // Render: bewusst nicht ausgeführt (ffmpeg/Remotion-Worker separat) — ehrlich markiert
  writeText(
    join(dir('renders'), 'RENDER_PLAN.md'),
    `# Render Plan (nicht ausgeführt)\n\nRenderProvider 'remotion-ffmpeg' ist 'configurable': ffmpeg/ffprobe + Worker nötig.\nEingabe steht bereit: storyboard/timeline.json + audio/voiceover.wav + captions/subtitles.srt.\n`,
    files,
  )

  // Manifest
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
