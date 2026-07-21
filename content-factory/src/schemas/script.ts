import { z } from 'zod'
import { NarrativeFunction } from './common.js'

/**
 * Voiceover-Skript (Stufe C).
 * Segment-IDs sind die Klammer zwischen Skript, Audio, Alignment und Timeline.
 * Plan-Timestamps sind AUSDRÜCKLICH vorläufig — die finale Timeline entsteht
 * erst aus dem realen Audio (Master-Prompt Prinzip #2).
 */
export const VoiceoverSegment = z.object({
  segment_id: z.string(), // z.B. 'VO001'
  text: z.string().min(1),
  narrative_function: NarrativeFunction,
  // vorläufige, geschätzte Sprechzeit — NUR zur Planung / Kostenschätzung
  planned_duration_ms: z.number().int().nonnegative(),
  // Claim-IDs verknüpfen Aussagen mit internen Quellenreferenzen
  claim_ids: z.array(z.string()).default([]),
})
export type VoiceoverSegment = z.infer<typeof VoiceoverSegment>

export const VoiceoverScript = z.object({
  video_id: z.string(),
  channel_id: z.string(),
  language: z.string(),
  target_wpm: z.number().positive(),
  segments: z.array(VoiceoverSegment).min(1),
  timestamps_are_provisional: z.literal(true),
  script_version: z.string(),
})
export type VoiceoverScript = z.infer<typeof VoiceoverScript>
