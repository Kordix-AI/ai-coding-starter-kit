import type { TtsResult, AlignmentProvider } from '../interfaces.js'
import { ProviderMarksAlignmentProvider, ForcedAlignmentProvider } from './mock.js'
import type { Alignment, VoiceoverScript } from '../../schemas/index.js'

export type AlignmentStrategy = 'provider_marks' | 'forced_alignment'

/**
 * Vom Option-1-Experiment bewiesene Routing-Logik:
 * verlässliche TTS-Marks → provider_marks; sonst (z. B. seed_audio) → forced_alignment.
 * Nie eine Timeline aus geschätzter Sprechzeit bauen (Prinzip #2).
 */
export function selectAlignmentStrategy(tts: TtsResult): AlignmentStrategy {
  return tts.provides_word_timing && tts.provider_marks.length > 0
    ? 'provider_marks'
    : 'forced_alignment'
}

export interface AlignAutoDeps {
  providerMarks?: AlignmentProvider
  forced?: AlignmentProvider
}

/**
 * Wählt den Alignment-Provider anhand der TTS-Fähigkeit. Ist Forced Alignment
 * nötig aber not_configured, schlägt es LAUT fehl (kein falscher Erfolgszustand).
 */
export async function alignAuto(
  input: { script: VoiceoverScript; tts: TtsResult; audioPath: string },
  deps: AlignAutoDeps = {},
): Promise<{ strategy: AlignmentStrategy; alignment: Alignment }> {
  const strategy = selectAlignmentStrategy(input.tts)
  const provider =
    strategy === 'provider_marks'
      ? (deps.providerMarks ?? new ProviderMarksAlignmentProvider())
      : (deps.forced ?? new ForcedAlignmentProvider())
  const alignment = await provider.align({
    script: input.script,
    audioPath: input.audioPath,
    audioDurationMs: input.tts.audio_duration_ms,
    providerMarks: input.tts.provider_marks,
  })
  return { strategy, alignment }
}
