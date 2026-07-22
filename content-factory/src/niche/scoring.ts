import {
  NICHE_DIMENSIONS,
  type NicheDimension,
  type NicheScorecard,
  type NicheVerdict,
  type DecisionCriteria,
} from '../schemas/niche.js'

/** Gewichte (summieren zu 1.0) — tunbar; Default gewichtet Solo-Gründer-Realität. */
export const DIMENSION_WEIGHTS: Record<NicheDimension, number> = {
  demand: 0.14,
  competition_gap: 0.1,
  novelty: 0.06,
  emotional_tension: 0.07,
  thumbnail_potential: 0.06,
  retention_potential: 0.09,
  credibility_fit: 0.1,
  production_ease: 0.1,
  monetization_fit: 0.1,
  audience_purchasing_power: 0.06,
  evergreen_ratio: 0.05,
  legal_safety: 0.04,
  channel_fit: 0.03,
}

export const DEFAULT_DECISION_CRITERIA: DecisionCriteria = {
  scale_min: 4.0,
  test_min: 3.2,
  pivot_min: 2.6,
  hard_kill_dimensions: ['legal_safety', 'credibility_fit'],
  hard_kill_below: 2,
}

/** Stellt sicher, dass ALLE Dimensionen bewertet sind (keine stille Teilbewertung). */
function assertComplete(card: NicheScorecard): void {
  const missing = NICHE_DIMENSIONS.filter((d) => !(d in card.dimensions))
  if (missing.length) {
    throw new Error(`NicheScorecard "${card.candidate.candidate_id}": fehlende Dimensionen: ${missing.join(', ')}`)
  }
}

/** Gewichteter Score im Bereich 1–5. */
export function scoreNiche(card: NicheScorecard, weights = DIMENSION_WEIGHTS): number {
  assertComplete(card)
  let total = 0
  for (const dim of NICHE_DIMENSIONS) {
    total += weights[dim] * card.dimensions[dim]!.score
  }
  return Math.round(total * 100) / 100
}

export function verdictFor(
  card: NicheScorecard,
  weighted: number,
  criteria: DecisionCriteria = DEFAULT_DECISION_CRITERIA,
): NicheVerdict {
  // Hard-Kill: eine kritische Dimension zu niedrig → sofort kill
  for (const dim of criteria.hard_kill_dimensions) {
    if (card.dimensions[dim]!.score < criteria.hard_kill_below) return 'kill'
  }
  if (weighted >= criteria.scale_min) return 'scale'
  if (weighted >= criteria.test_min) return 'test'
  if (weighted >= criteria.pivot_min) return 'pivot'
  return 'kill'
}

export interface RankedNiche {
  candidate_id: string
  name: string
  weighted_score: number
  verdict: NicheVerdict
}

export function rankNiches(
  cards: NicheScorecard[],
  weights = DIMENSION_WEIGHTS,
  criteria = DEFAULT_DECISION_CRITERIA,
): RankedNiche[] {
  return cards
    .map((card) => {
      const weighted = scoreNiche(card, weights)
      return {
        candidate_id: card.candidate.candidate_id,
        name: card.candidate.name,
        weighted_score: weighted,
        verdict: verdictFor(card, weighted, criteria),
      }
    })
    .sort((a, b) => b.weighted_score - a.weighted_score)
}
