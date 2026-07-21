import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { selectAlignmentStrategy, alignAuto } from '../src/providers/alignment/route.js'
import { MockTTSProvider } from '../src/providers/tts/mock.js'
import { demoScript } from '../src/pipeline/demo.js'
import type { TtsResult } from '../src/providers/interfaces.js'

/** Reales seed_audio-Ergebnis (Option-1-Experiment): Audio, aber KEINE Marks. */
const realSeedAudioResult: TtsResult = {
  audio_path: '/tmp/real.wav',
  audio_duration_ms: 45960,
  provider_marks: [],
  provides_word_timing: false,
  provenance: { provider: 'higgsfield-seed-audio', voice_id: 'Cillian', cost_usd: 0 },
}

describe('alignment routing (Option-1-Befund)', () => {
  it('reale TTS ohne Marks → forced_alignment', () => {
    expect(selectAlignmentStrategy(realSeedAudioResult)).toBe('forced_alignment')
  })

  it('Mock-TTS mit Marks → provider_marks', async () => {
    const wav = join(tmpdir(), `cf-route-${process.pid}.wav`)
    const tts = await new MockTTSProvider().synthesize(demoScript, wav)
    expect(selectAlignmentStrategy(tts)).toBe('provider_marks')
  })

  it('forced_alignment ist not_configured → schlägt LAUT fehl (kein stiller Erfolg)', async () => {
    await expect(
      alignAuto({ script: demoScript, tts: realSeedAudioResult, audioPath: '/tmp/real.wav' }),
    ).rejects.toThrow(/not_configured|Forced/i)
  })

  it('Mock-Pfad liefert ein valides Alignment über den Router', async () => {
    const wav = join(tmpdir(), `cf-route2-${process.pid}.wav`)
    const tts = await new MockTTSProvider().synthesize(demoScript, wav)
    const { strategy, alignment } = await alignAuto({ script: demoScript, tts, audioPath: wav })
    expect(strategy).toBe('provider_marks')
    expect(alignment.segments.length).toBe(demoScript.segments.length)
    expect(alignment.audio_duration_ms).toBe(tts.audio_duration_ms)
  })
})
