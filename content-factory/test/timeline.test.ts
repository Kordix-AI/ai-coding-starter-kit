import { describe, it, expect, beforeAll } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MockTTSProvider } from '../src/providers/tts/mock.js'
import { ProviderMarksAlignmentProvider } from '../src/providers/alignment/mock.js'
import { readWavDurationMs } from '../src/audio/wav.js'
import { buildTimeline } from '../src/timeline/build-timeline.js'
import { qcTimeline, frameMs } from '../src/timeline/qc.js'
import { loadChannelProfile } from '../src/channels/load.js'
import { demoScript } from '../src/pipeline/demo.js'
import type { Alignment, Timeline, ChannelProfile } from '../src/schemas/index.js'

let alignment: Alignment
let timeline: Timeline
let channel: ChannelProfile
let audioDurationMs: number

beforeAll(async () => {
  channel = loadChannelProfile('hidden-rush')
  const wav = join(tmpdir(), `cf-timeline-${process.pid}.wav`)
  const tts = await new MockTTSProvider().synthesize(demoScript, wav)
  audioDurationMs = readWavDurationMs(wav)
  alignment = await new ProviderMarksAlignmentProvider().align({
    script: demoScript,
    audioPath: wav,
    audioDurationMs,
    providerMarks: tts.provider_marks,
  })
  timeline = buildTimeline({ script: demoScript, alignment, channel })
})

describe('buildTimeline — Timing-Akzeptanzkriterien', () => {
  it('erste Szene beginnt bei 0 ms', () => {
    expect(timeline.scenes[0]!.start_ms).toBe(0)
  })

  it('lückenlos und überlappungsfrei', () => {
    for (let i = 0; i < timeline.scenes.length - 1; i++) {
      expect(timeline.scenes[i]!.end_ms).toBe(timeline.scenes[i + 1]!.start_ms)
    }
  })

  it('kein null- oder negativ-langer Clip', () => {
    for (const s of timeline.scenes) {
      expect(s.duration_ms).toBeGreaterThan(0)
      expect(s.duration_ms).toBe(s.end_ms - s.start_ms)
    }
  })

  it('letzte Szene endet innerhalb eines Frames zur echten Audio-Dauer', () => {
    const lastEnd = timeline.scenes[timeline.scenes.length - 1]!.end_ms
    expect(Math.abs(audioDurationMs - lastEnd)).toBeLessThanOrEqual(frameMs(timeline.fps))
  })

  it('eine Szene pro Segment, keine Wörter verloren oder dupliziert', () => {
    expect(timeline.scenes.length).toBe(demoScript.segments.length)
    const wordsInScenes = timeline.scenes.reduce((n, s) => n + s.words.length, 0)
    expect(wordsInScenes).toBe(alignment.words.length)
  })

  it('QC besteht sauber', () => {
    const qc = qcTimeline(timeline, { alignmentMinConfidence: alignment.min_confidence })
    expect(qc.ok).toBe(true)
    expect(qc.issues).toHaveLength(0)
  })
})

describe('QC — erkennt kaputte Timelines', () => {
  it('meldet eine Lücke zwischen Szenen', () => {
    const broken = structuredClone(timeline)
    broken.scenes[0]!.end_ms -= 500
    broken.scenes[0]!.duration_ms -= 500
    const qc = qcTimeline(broken)
    expect(qc.ok).toBe(false)
    expect(qc.issues.some((i) => i.code === 'GAP_OR_OVERLAP')).toBe(true)
  })

  it('meldet niedrige Alignment-Konfidenz statt stiller Freigabe', () => {
    const qc = qcTimeline(timeline, { alignmentMinConfidence: 0.2 })
    expect(qc.ok).toBe(false)
    expect(qc.issues.some((i) => i.code === 'LOW_CONFIDENCE')).toBe(true)
  })
})
