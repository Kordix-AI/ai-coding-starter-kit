import { z } from 'zod'
import { ContentRiskClass } from './common.js'

/**
 * Ebene 2 — Nischenwahl & Validierung (Stefans Review #2).
 * Strukturiertes Interview → gewichtetes Scoring → Entscheidung mit
 * Kill/Pivot/Scale-Kriterien und Test-Plan für die ersten 10 Videos.
 * Keine erfundenen Kennzahlen: jede Bewertung braucht eine Begründung.
 */

/** Intake: Fähigkeiten, Interessen, Constraints des Gründers. */
export const FounderProfile = z.object({
  name: z.string(),
  skills: z.array(z.string()).min(1),
  interests: z.array(z.string()).min(1),
  unfair_advantages: z.array(z.string()).default([]),
  time_budget_hours_per_week: z.number().positive(),
  risk_tolerance: z.enum(['low', 'medium', 'high']),
  monetization_goals: z.array(z.string()).default([]),
  hard_constraints: z.array(z.string()).default([]), // z.B. "keine medizinische Beratung"
})
export type FounderProfile = z.infer<typeof FounderProfile>

/** Die 13 Bewertungsdimensionen (Master-Prompt Stufe A + Review #2). 1–5, Begründung Pflicht. */
export const NICHE_DIMENSIONS = [
  'demand',
  'competition_gap', // hoch = wenig/schwache Konkurrenz (Chance)
  'novelty',
  'emotional_tension',
  'thumbnail_potential',
  'retention_potential',
  'credibility_fit', // passt zu Skills/Autorität des Gründers
  'production_ease', // hoch = geringer Aufwand / gut automatisierbar
  'monetization_fit',
  'audience_purchasing_power',
  'evergreen_ratio', // hoch = mehr Evergreen, weniger Trend-Verfall
  'legal_safety', // hoch = geringes rechtliches/fachliches Risiko
  'channel_fit',
] as const
export type NicheDimension = (typeof NICHE_DIMENSIONS)[number]

export const ScoredDimension = z.object({
  score: z.number().int().min(1).max(5),
  rationale: z.string().min(3), // keine erfundenen Kennzahlen → Begründung erzwungen
  evidence: z.string().optional(), // Quelle/Methode, falls vorhanden
})
export type ScoredDimension = z.infer<typeof ScoredDimension>

export const NicheCandidate = z.object({
  candidate_id: z.string(),
  name: z.string(),
  description: z.string(),
  sub_niches: z.array(z.string()).default([]),
  content_risk_class: ContentRiskClass,
})
export type NicheCandidate = z.infer<typeof NicheCandidate>

export const NicheScorecard = z.object({
  candidate: NicheCandidate,
  dimensions: z.record(z.enum(NICHE_DIMENSIONS), ScoredDimension),
})
export type NicheScorecard = z.infer<typeof NicheScorecard>

export const NicheVerdict = z.enum(['scale', 'test', 'pivot', 'kill'])
export type NicheVerdict = z.infer<typeof NicheVerdict>

/** Explizite Schwellen — objektiv, nicht „aus dem Bauch". */
export const DecisionCriteria = z.object({
  scale_min: z.number(), // gewichteter Score ≥ → skalieren
  test_min: z.number(), // ≥ → testen (erste 10 Videos)
  pivot_min: z.number(), // ≥ → anpassen, sonst kill
  hard_kill_dimensions: z.array(z.enum(NICHE_DIMENSIONS)).default(['legal_safety', 'credibility_fit']),
  hard_kill_below: z.number().int().min(1).max(5).default(2), // eine Kill-Dimension darunter → kill
})
export type DecisionCriteria = z.infer<typeof DecisionCriteria>

export const TestVideoPlan = z.object({
  index: z.number().int().positive(),
  hypothesis: z.string(),
  working_title: z.string(),
  format: z.enum(['long_form', 'short']),
})

export const ChannelDecision = z.object({
  founder: z.string(),
  chosen: NicheCandidate,
  weighted_score: z.number(),
  verdict: NicheVerdict,
  rationale: z.string(),
  runner_ups: z.array(z.object({ candidate_id: z.string(), weighted_score: z.number(), verdict: NicheVerdict })).default([]),
  first_10_plan: z.array(TestVideoPlan),
  kill_pivot_scale: z.object({
    kill_if: z.array(z.string()),
    pivot_if: z.array(z.string()),
    scale_if: z.array(z.string()),
  }),
  // Seed für ein vollständiges Channel Profile (Brücke Ebene 2 → Channel-System)
  channel_profile_seed: z.object({
    channel_id: z.string(),
    name: z.string(),
    niche: z.string(),
    output_language: z.string(),
    content_risk_class: ContentRiskClass,
    visual_preset: z.enum(['cinematic_editorial', 'stickman_minimal', 'flat_2d']),
    target_duration_sec: z.number().positive(),
    target_wpm: z.number().positive(),
  }),
  decision_version: z.string(),
})
export type ChannelDecision = z.infer<typeof ChannelDecision>
export type TestVideoPlan = z.infer<typeof TestVideoPlan>
