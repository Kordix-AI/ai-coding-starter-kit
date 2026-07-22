import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadChannelProfile } from '../src/channels/load.js'
import { MockTTSProvider } from '../src/providers/tts/mock.js'
import { ProviderMarksAlignmentProvider } from '../src/providers/alignment/mock.js'
import { readWavDurationMs } from '../src/audio/wav.js'
import { buildTimeline } from '../src/timeline/build-timeline.js'
import { qcTimeline } from '../src/timeline/qc.js'
import { JobStateMachine, stagesToInvalidate } from '../src/state/machine.js'
import { demoScript } from '../src/pipeline/demo.js'
import type { Alignment } from '../src/schemas/index.js'

async function alignFor(channelFps: unknown): Promise<Alignment> {
  const wav = join(tmpdir(), `cf-preset-${process.pid}-${Math.floor(Number(channelFps))}.wav`)
  const tts = await new MockTTSProvider().synthesize(demoScript, wav)
  return new ProviderMarksAlignmentProvider().align({
    script: demoScript,
    audioPath: wav,
    audioDurationMs: readWavDurationMs(wav),
    providerMarks: tts.provider_marks,
  })
}

describe('visual preset (Stil aus dem Channel Profile, nicht global)', () => {
  it('Hidden Rush = cinematic_editorial @ 24 fps → Hook nutzt premium_i2v mit Video-Prompt', async () => {
    const channel = loadChannelProfile('hidden-rush')
    expect(channel.visual_preset).toBe('cinematic_editorial')
    expect(channel.fps).toBe(24)
    const alignment = await alignFor(channel.fps)
    const timeline = buildTimeline({ script: demoScript, alignment, channel })
    const hook = timeline.scenes[0]!
    expect(hook.narrative_function).toBe('hook')
    expect(hook.visual_template).toBe('premium_i2v')
    expect(hook.video_prompt).toBeTruthy()
  })

  it('Quiet History = stickman_minimal → Hook nutzt stickman_character (kein I2V)', async () => {
    const channel = loadChannelProfile('quiet-history')
    expect(channel.visual_preset).toBe('stickman_minimal')
    const alignment = await alignFor(channel.fps)
    const timeline = buildTimeline({ script: demoScript, alignment, channel })
    expect(timeline.scenes[0]!.visual_template).toBe('stickman_character')
    expect(timeline.scenes[0]!.video_prompt).toBeNull()
  })
})

describe('QC-Policy — Schwellen sind Zahlen', () => {
  it('strengere Drift-Toleranz kann greifen; Default (1 Frame) besteht', async () => {
    const channel = loadChannelProfile('hidden-rush')
    const alignment = await alignFor(channel.fps)
    const timeline = buildTimeline({ script: demoScript, alignment, channel })
    expect(qcTimeline(timeline, { alignmentMinConfidence: alignment.min_confidence }).ok).toBe(true)
  })
})

describe('Änderungs-/Invalidierungsmatrix', () => {
  it('Skript-Änderung invalidiert Audio→Untertitel & Downstream', () => {
    const s = stagesToInvalidate('script')
    expect(s).toEqual(
      expect.arrayContaining(['audio', 'alignment', 'timeline', 'subtitles', 'render']),
    )
  })

  it('Titel-Änderung invalidiert nur Packaging', () => {
    expect(stagesToInvalidate('title')).toEqual(['packaging'])
  })

  it('invalidate() setzt betroffene Stufen zurück und lässt Gate verfallen', () => {
    const j = new JobStateMachine('v1')
    j.approveGate({ gate: 'G5', approved: true, actor: 'user:stefan', at: 't', artifact_version: '1' })
    j.start('assets')
    j.succeed('assets', 'h')
    expect(j.isGateApproved('G5')).toBe(true)
    j.invalidate('image_prompt') // betrifft assets (Gate G5)
    expect(j.record('assets').status).toBe('pending')
    expect(j.record('assets').output_hash).toBeUndefined()
    expect(j.isGateApproved('G5')).toBe(false) // Freigabe verfällt
  })
})
