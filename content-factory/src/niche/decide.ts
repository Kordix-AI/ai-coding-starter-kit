import { ChannelDecision } from '../schemas/niche.js'
import type {
  FounderProfile,
  NicheScorecard,
  NicheCandidate,
  DecisionCriteria,
  TestVideoPlan,
} from '../schemas/niche.js'
import {
  DIMENSION_WEIGHTS,
  DEFAULT_DECISION_CRITERIA,
  scoreNiche,
  verdictFor,
  rankNiches,
} from './scoring.js'

export interface ProfileHint {
  output_language?: string
  visual_preset?: 'cinematic_editorial' | 'stickman_minimal' | 'flat_2d'
  target_duration_sec?: number
  target_wpm?: number
}

/** Erzeugt einen deterministischen Test-Plan für die ersten 10 Videos. */
export function buildFirst10Plan(candidate: NicheCandidate): TestVideoPlan[] {
  const angles = [
    'Kern-Frage der Nische, breitester Einstieg',
    'kontraintuitive Wahrheit',
    'konkrete Fallstudie / Beispiel',
    'häufiger Denkfehler entlarven',
    'Schritt-für-Schritt-Mechanismus',
    'Mythos vs. Beleg',
    'emotionale Geschichte mit Payoff',
    'Vergleich zweier Optionen',
    'Was fast alle falsch machen',
    'Zusammenfassung + nächster Schritt (Serie öffnen)',
  ]
  const subs = candidate.sub_niches.length ? candidate.sub_niches : [candidate.name]
  return angles.map((hypothesis, i) => ({
    index: i + 1,
    hypothesis,
    working_title: `${candidate.name}: ${subs[i % subs.length]} — Test ${i + 1}`,
    format: i < 8 ? 'long_form' : 'short',
  }))
}

export function decideChannel(input: {
  founder: FounderProfile
  scorecards: NicheScorecard[]
  criteria?: DecisionCriteria
  profileHints?: Record<string, ProfileHint>
  decisionVersion?: string
}): ChannelDecision {
  const criteria = input.criteria ?? DEFAULT_DECISION_CRITERIA
  const weights = DIMENSION_WEIGHTS
  const ranked = rankNiches(input.scorecards, weights, criteria)
  const top = ranked[0]
  if (!top) throw new Error('decideChannel: keine Scorecards übergeben.')

  const winner = input.scorecards.find((c) => c.candidate.candidate_id === top.candidate_id)!
  const weighted = scoreNiche(winner, weights)
  const verdict = verdictFor(winner, weighted, criteria)
  const hint = input.profileHints?.[winner.candidate.candidate_id] ?? {}

  return ChannelDecision.parse({
    founder: input.founder.name,
    chosen: winner.candidate,
    weighted_score: weighted,
    verdict,
    rationale:
      verdict === 'kill'
        ? `Bester Kandidat, aber Verdict=kill (Score ${weighted} / Kill-Dimension zu niedrig).`
        : `Höchster gewichteter Score (${weighted}); Verdict=${verdict}. Passt zu Skills & Constraints des Gründers.`,
    runner_ups: ranked.slice(1).map((r) => ({
      candidate_id: r.candidate_id,
      weighted_score: r.weighted_score,
      verdict: r.verdict,
    })),
    first_10_plan: buildFirst10Plan(winner.candidate),
    kill_pivot_scale: {
      kill_if: [
        'nach 10 Videos median Average View Duration < 30 %',
        'eine Hard-Kill-Dimension (legal_safety/credibility_fit) fällt unter 2',
        'kein Video erreicht > 1.000 Impressions in 28 Tagen',
      ],
      pivot_if: [
        'Retention > 40 % aber CTR < 3 % → Titel/Thumbnail iterieren',
        'CTR > 5 % aber Retention < 30 % → Hook/Skript-Struktur ändern',
      ],
      scale_if: [
        '≥ 2 Videos über Median-Retention UND CTR > 5 % → Kadenz erhöhen',
        'positiver Deckungsbeitrag je Video über 3 Videos in Folge',
      ],
    },
    channel_profile_seed: {
      channel_id: winner.candidate.candidate_id,
      name: winner.candidate.name,
      niche: winner.candidate.name,
      output_language: hint.output_language ?? 'en',
      content_risk_class: winner.candidate.content_risk_class,
      visual_preset: hint.visual_preset ?? 'cinematic_editorial',
      target_duration_sec: hint.target_duration_sec ?? 600,
      target_wpm: hint.target_wpm ?? 140,
    },
    decision_version: input.decisionVersion ?? '1.0.0',
  })
}
