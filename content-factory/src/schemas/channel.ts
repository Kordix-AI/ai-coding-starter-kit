import { z } from 'zod'
import { ContentRiskClass } from './common.js'

/**
 * Channel Profile — strikt getrennte, versionierte Konfiguration pro Kanal.
 * Master-Prompt: "Inhalte, Daten, Stil, Zielgruppe und Analytics verschiedener
 * Kanäle dürfen nicht unkontrolliert vermischt werden."
 * Ein zweites Profil muss OHNE Kerncode-Änderung ladbar sein (DoD).
 */

export const CharacterRef = z.object({
  character_id: z.string(),
  name: z.string(),
  proportions: z.string(),
  clothing: z.string(),
  face_details: z.string(),
  reference_asset_ids: z.array(z.string()).default([]),
  seed: z.number().int().optional(),
})

export const VisualStyleBible = z.object({
  palette: z.array(z.string()).min(1),
  line_width: z.string(),
  backgrounds: z.string(),
  typography: z.string(),
  safe_areas: z.string(),
  negative_prompts: z.array(z.string()).default([]),
  characters: z.array(CharacterRef).default([]),
})

export const TtsConfig = z.object({
  voice_id: z.string(),
  voice_instructions: z.string(),
  // Aussprachelexikon: Wort -> phonetische/gewünschte Aussprache
  pronunciation_lexicon: z.record(z.string(), z.string()).default({}),
})

export const ChannelProfile = z.object({
  channel_id: z.string(),
  name: z.string(),
  niche: z.string(),
  sub_niches: z.array(z.string()).default([]),

  target_audience: z.string(),
  audience_problems: z.array(z.string()).default([]),
  audience_desires: z.array(z.string()).default([]),

  output_language: z.string(), // z.B. 'en'
  ui_language: z.string(), // Review-/Dashboard-Sprache, z.B. 'de'

  value_proposition: z.string(),
  positioning: z.string(),

  tone: z.string(),
  pacing: z.string(),
  humor_level: z.enum(['none', 'low', 'medium', 'high']),
  emotional_intensity: z.enum(['low', 'medium', 'high']),

  allowed_topics: z.array(z.string()).default([]),
  excluded_topics: z.array(z.string()).default([]),

  content_risk_class: ContentRiskClass,
  required_source_types: z.array(z.string()).default([]),
  fact_check_rules: z.array(z.string()).default([]),

  formats: z.object({
    long_form: z.boolean().default(true),
    short: z.boolean().default(false),
    compilation: z.boolean().default(false),
  }),

  // Timing-Defaults — Grundlage der Zielwortzahl (aber NIE der finalen Timeline)
  target_duration_sec: z.number().positive(),
  target_wpm: z.number().positive(), // Hidden Rush: ~130–145
  aspect_ratio: z.enum(['16:9', '9:16', '1:1']),
  fps: z.number().int().positive(),

  hook_style: z.string(),
  narrative_framework: z.string(),
  cta_rules: z.array(z.string()).default([]),

  // verbindliches Visual-System des Kanals — steuert die Template-Auswahl.
  // Hidden Rush = cinematic_editorial (2.5D, Hero-Frame-first, selektiv I2V);
  // stickman_minimal = eigenes kostengünstiges Preset (nicht global erzwungen).
  visual_preset: z.enum(['cinematic_editorial', 'stickman_minimal', 'flat_2d']),

  visual_style_bible: VisualStyleBible,
  tts: TtsConfig,

  music_sfx_rules: z.array(z.string()).default([]),
  thumbnail_system: z.string(),
  publishing_rules: z.array(z.string()).default([]),
  analytics_goals: z.array(z.string()).default([]),
  experiment_rules: z.array(z.string()).default([]),

  // Budget-Guardrails pro Video (Kosten-Gate)
  budget_usd_per_video: z.number().positive(),
  budget_minutes_per_video: z.number().positive(),

  profile_version: z.string(),
})

export type ChannelProfile = z.infer<typeof ChannelProfile>
export type CharacterRef = z.infer<typeof CharacterRef>
export type VisualStyleBible = z.infer<typeof VisualStyleBible>
