import { writeSilentWav } from '../../audio/wav.js'
import type { VoiceoverScript } from '../../schemas/index.js'
import type { TTSProvider, TtsResult, TtsWordMark, ProviderMeta } from '../interfaces.js'

/**
 * Sicherer Mock-TTS (kein bezahltes Generieren, keine externen Calls).
 * Erzeugt ein reales, stilles WAV mit deterministischer Dauer UND
 * dazu exakt passende Wort-Zeitmarken — simuliert einen TTS-Provider,
 * der verlässliches Timing liefert. So testet der ganze Pfad
 * Skript → echtes Audio → Alignment → Timeline deterministisch.
 */

export interface MockTtsOptions {
  msPerChar?: number
  minWordMs?: number
  interWordGapMs?: number
  interSegmentPauseMs?: number
  leadSilenceMs?: number
  tailSilenceMs?: number
}

const DEFAULTS: Required<MockTtsOptions> = {
  msPerChar: 55,
  minWordMs: 180,
  interWordGapMs: 70,
  interSegmentPauseMs: 260,
  leadSilenceMs: 150,
  tailSilenceMs: 200,
}

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

export class MockTTSProvider implements TTSProvider {
  readonly meta: ProviderMeta = {
    name: 'mock-tts',
    role: 'tts',
    status: 'available',
    notes: 'Deterministischer Mock; erzeugt stilles WAV + exakte Provider-Marks. Kein Netzwerk, keine Kosten.',
  }

  private readonly opts: Required<MockTtsOptions>

  constructor(opts: MockTtsOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts }
  }

  async synthesize(script: VoiceoverScript, outPath: string): Promise<TtsResult> {
    const o = this.opts
    const marks: TtsWordMark[] = []
    let cursor = o.leadSilenceMs

    script.segments.forEach((seg, segIdx) => {
      if (segIdx > 0) cursor += o.interSegmentPauseMs
      const words = tokenize(seg.text)
      words.forEach((w, wIdx) => {
        if (wIdx > 0) cursor += o.interWordGapMs
        const dur = Math.max(o.minWordMs, Math.round(o.msPerChar * w.length))
        const start = cursor
        const end = cursor + dur
        marks.push({ text: w, start_ms: start, end_ms: end, segment_id: seg.segment_id })
        cursor = end
      })
    })

    const lastEnd = marks.length ? marks[marks.length - 1]!.end_ms : 0
    const targetDurationMs = lastEnd + o.tailSilenceMs

    // reales WAV schreiben → Dauer wird anschließend AUS dem Audio gelesen
    const audioDurationMs = writeSilentWav(outPath, targetDurationMs)

    return {
      audio_path: outPath,
      audio_duration_ms: audioDurationMs,
      provider_marks: marks,
      provides_word_timing: true,
      provenance: { provider: this.meta.name, voice_id: 'mock-voice', cost_usd: 0 },
    }
  }
}
