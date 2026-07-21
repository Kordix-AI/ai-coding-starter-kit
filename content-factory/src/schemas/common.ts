import { z } from 'zod'

/**
 * Gemeinsame Primitive für alle Übergabeartefakte.
 * Zeit wird IMMER in ganzzahligen Millisekunden geführt (Master-Prompt: kanonische Timeline).
 */

export const Millis = z.number().int().nonnegative()
export const Fps = z.number().int().positive()
export const Confidence = z.number().min(0).max(1)

export const ContentRiskClass = z.enum(['low', 'medium', 'high'])
export type ContentRiskClass = z.infer<typeof ContentRiskClass>

export const VisualTemplate = z.enum([
  'stickman_character',
  'two_character_interaction',
  'symbolic_metaphor',
  'object_closeup',
  'minimal_diagram',
  'environment_wide',
  'editor_typography',
  'still_parallax',
  'premium_i2v',
])
export type VisualTemplate = z.infer<typeof VisualTemplate>

export const NarrativeFunction = z.enum([
  'hook',
  'setup',
  'tension',
  'turn',
  'payoff',
  'cta',
  'transition',
])
export type NarrativeFunction = z.infer<typeof NarrativeFunction>

/** Provenienz-Block — an JEDES generierte Ergebnis anhängbar (Master-Prompt Prinzip #6). */
export const Provenance = z.object({
  provider: z.string(),
  model: z.string().optional(),
  model_version: z.string().optional(),
  prompt_version: z.string().optional(),
  seed: z.number().int().optional(),
  reference_asset_ids: z.array(z.string()).default([]),
  source_claim_ids: z.array(z.string()).default([]),
  created_at: z.string(), // ISO-8601, vom Aufrufer gestempelt (deterministische Tests: injizierbar)
  cost_usd: z.number().nonnegative().default(0),
  input_hash: z.string().optional(),
  output_hash: z.string().optional(),
})
export type Provenance = z.infer<typeof Provenance>
