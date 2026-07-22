import { describe, it, expect } from 'vitest'
import { scoreNiche, verdictFor, rankNiches, DEFAULT_DECISION_CRITERIA } from '../src/niche/scoring.js'
import { decideChannel, buildFirst10Plan } from '../src/niche/decide.js'
import { demoFounder, demoScorecards, demoProfileHints } from '../src/niche/demo.js'
import { NICHE_DIMENSIONS, NicheScorecard, type NicheDimension, type ScoredDimension } from '../src/schemas/niche.js'

function fullDims(score: number): Record<NicheDimension, ScoredDimension> {
  return Object.fromEntries(
    NICHE_DIMENSIONS.map((d) => [d, { score, rationale: 'test' }]),
  ) as Record<NicheDimension, ScoredDimension>
}

describe('niche scoring', () => {
  it('gewichteter Score liegt im Bereich 1–5', () => {
    for (const card of demoScorecards) {
      const s = scoreNiche(card)
      expect(s).toBeGreaterThanOrEqual(1)
      expect(s).toBeLessThanOrEqual(5)
    }
  })

  it('perfekte Bewertung → 5.0 → scale', () => {
    const card = NicheScorecard.parse({
      candidate: { candidate_id: 'x', name: 'X', description: '...', sub_niches: [], content_risk_class: 'low' },
      dimensions: fullDims(5),
    })
    const s = scoreNiche(card)
    expect(s).toBeCloseTo(5, 5)
    expect(verdictFor(card, s)).toBe('scale')
  })

  it('wirft bei unvollständiger Scorecard (keine stille Teilbewertung)', () => {
    const partial = { candidate: demoScorecards[0]!.candidate, dimensions: { demand: { score: 4, rationale: 'x' } } } as unknown as NicheScorecard
    expect(() => scoreNiche(partial)).toThrow(/fehlende Dimensionen/)
  })

  it('Hard-Kill: kritische Dimension < 2 → kill, unabhängig vom Score', () => {
    const dims = fullDims(5)
    dims.legal_safety = { score: 1, rationale: 'rechtlich hochriskant' }
    const card = NicheScorecard.parse({
      candidate: { candidate_id: 'risky', name: 'Risky', description: '...', sub_niches: [], content_risk_class: 'high' },
      dimensions: dims,
    })
    expect(verdictFor(card, scoreNiche(card))).toBe('kill')
  })

  it('rankt absteigend nach gewichtetem Score', () => {
    const ranked = rankNiches(demoScorecards)
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i]!.weighted_score).toBeGreaterThanOrEqual(ranked[i + 1]!.weighted_score)
    }
    expect(ranked.length).toBe(3)
  })
})

describe('channel decision', () => {
  it('erzeugt eine valide Entscheidung mit Test-Plan und Channel-Seed', () => {
    const decision = decideChannel({
      founder: demoFounder,
      scorecards: demoScorecards,
      profileHints: demoProfileHints,
    })
    expect(decision.first_10_plan).toHaveLength(10)
    expect(decision.kill_pivot_scale.kill_if.length).toBeGreaterThan(0)
    expect(decision.channel_profile_seed.channel_id).toBe(decision.chosen.candidate_id)
    // Gewinner = höchster Score
    const top = rankNiches(demoScorecards)[0]!
    expect(decision.chosen.candidate_id).toBe(top.candidate_id)
  })

  it('Test-Plan hat 8 long_form + 2 short', () => {
    const plan = buildFirst10Plan(demoScorecards[0]!.candidate)
    expect(plan.filter((p) => p.format === 'long_form')).toHaveLength(8)
    expect(plan.filter((p) => p.format === 'short')).toHaveLength(2)
  })
})
