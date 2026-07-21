import { Alignment } from '../../schemas/index.js'
import type {
  AlignmentProvider,
  ProviderMeta,
  TtsWordMark,
} from '../interfaces.js'
import type { VoiceoverScript } from '../../schemas/index.js'

const PROVIDER_MARK_CONFIDENCE = 0.99

/**
 * Baut das Alignment aus verlässlichen TTS-Provider-Marks.
 * Die audio_duration_ms kommt AUS dem realen Audio (ffprobe-äquivalent),
 * nicht aus den Marks (Master-Prompt Prinzip #2).
 */
export class ProviderMarksAlignmentProvider implements AlignmentProvider {
  readonly meta: ProviderMeta = {
    name: 'provider-marks',
    role: 'alignment',
    status: 'available',
    notes: 'Übernimmt verlässliche TTS-Zeitmarken; keine Kosten.',
  }

  async align(input: {
    script: VoiceoverScript
    audioPath: string
    audioDurationMs: number
    providerMarks: TtsWordMark[]
  }): Promise<Alignment> {
    const { script, audioDurationMs, providerMarks } = input
    if (providerMarks.length === 0) {
      throw new Error(
        'ProviderMarksAlignmentProvider: keine Provider-Marks vorhanden → Forced Alignment nötig (nicht konfiguriert).',
      )
    }

    const words = providerMarks.map((m) => ({
      text: m.text,
      start_ms: m.start_ms,
      end_ms: m.end_ms,
      confidence: PROVIDER_MARK_CONFIDENCE,
    }))

    const segments = script.segments.map((seg) => {
      const segMarks = providerMarks.filter((m) => m.segment_id === seg.segment_id)
      const segWords = segMarks.map((m) => ({
        text: m.text,
        start_ms: m.start_ms,
        end_ms: m.end_ms,
        confidence: PROVIDER_MARK_CONFIDENCE,
      }))
      const start = segWords.length ? segWords[0]!.start_ms : 0
      const end = segWords.length ? segWords[segWords.length - 1]!.end_ms : 0
      return {
        segment_id: seg.segment_id,
        text: seg.text,
        start_ms: start,
        end_ms: end,
        words: segWords,
        confidence: PROVIDER_MARK_CONFIDENCE,
      }
    })

    const minConfidence = words.reduce((m, w) => Math.min(m, w.confidence), 1)

    return Alignment.parse({
      video_id: script.video_id,
      audio_duration_ms: audioDurationMs,
      source: 'provider_marks',
      words,
      segments,
      min_confidence: minConfidence,
    })
  }
}

/**
 * Forced-Alignment-Fallback (WhisperX / aeneas im Python-Worker).
 * Contract vorhanden, aber im MVP ehrlich als 'not_configured' markiert.
 */
export class ForcedAlignmentProvider implements AlignmentProvider {
  readonly meta: ProviderMeta = {
    name: 'forced-alignment',
    role: 'alignment',
    status: 'not_configured',
    notes: 'Benötigt Python-Worker (WhisperX/aeneas). Interface bereit, Implementierung folgt.',
  }

  async align(): Promise<Alignment> {
    throw new Error(
      'ForcedAlignmentProvider: not_configured — Python-Worker (WhisperX/aeneas) erforderlich.',
    )
  }
}
