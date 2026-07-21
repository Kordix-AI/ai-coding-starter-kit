import { z } from 'zod'
import { Millis, Confidence } from './common.js'

/**
 * Alignment — die einzige Wahrheit über Zeit, abgeleitet aus dem REALEN Audio.
 * Quelle ist entweder verlässliches TTS-Provider-Timing oder Forced Alignment.
 */

export const WordMark = z
  .object({
    text: z.string(),
    start_ms: Millis,
    end_ms: Millis,
    confidence: Confidence,
  })
  .refine((w) => w.end_ms >= w.start_ms, {
    message: 'WordMark: end_ms muss >= start_ms sein',
  })
export type WordMark = z.infer<typeof WordMark>

export const SegmentAlignment = z
  .object({
    segment_id: z.string(),
    text: z.string(),
    start_ms: Millis,
    end_ms: Millis,
    words: z.array(WordMark),
    confidence: Confidence,
  })
  .refine((s) => s.end_ms >= s.start_ms, {
    message: 'SegmentAlignment: end_ms muss >= start_ms sein',
  })
export type SegmentAlignment = z.infer<typeof SegmentAlignment>

export const AlignmentSource = z.enum(['provider_marks', 'forced_alignment'])
export type AlignmentSource = z.infer<typeof AlignmentSource>

export const Alignment = z.object({
  video_id: z.string(),
  audio_duration_ms: Millis,
  source: AlignmentSource,
  words: z.array(WordMark),
  segments: z.array(SegmentAlignment).min(1),
  // niedrigste Konfidenz über alle Wörter — steuert das QC-Gate
  min_confidence: Confidence,
})
export type Alignment = z.infer<typeof Alignment>
