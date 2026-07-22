import { FounderProfile, NicheScorecard } from '../schemas/niche.js'
import type { ScoredDimension, NicheDimension } from '../schemas/niche.js'
import type { ProfileHint } from './decide.js'

/** Deterministischer Ebene-2-Demo-Datensatz (Stefan / Kordix). */

export const demoFounder = FounderProfile.parse({
  name: 'Stefan Billich',
  skills: ['GMP qualification', 'pharma compliance', 'AI/LLM solutions', 'technical writing'],
  interests: ['psychology & human behavior', 'pharma quality', 'AI productivity'],
  unfair_advantages: ['GMP specialist authority', 'builds AI tools (QualiPilot)'],
  time_budget_hours_per_week: 8,
  risk_tolerance: 'medium',
  monetization_goals: ['AdSense', 'lead-gen to QualiPilot', 'digital products'],
  hard_constraints: ['keine individuelle medizinische Beratung', 'faceless (keine Gesichtskamera)'],
})

const d = (score: number, rationale: string, evidence?: string): ScoredDimension => ({
  score: score as ScoredDimension['score'],
  rationale,
  ...(evidence ? { evidence } : {}),
})

function card(
  candidate: NicheScorecard['candidate'],
  dims: Record<NicheDimension, ScoredDimension>,
): NicheScorecard {
  return NicheScorecard.parse({ candidate, dimensions: dims })
}

export const demoScorecards: NicheScorecard[] = [
  card(
    {
      candidate_id: 'hidden-rush',
      name: 'Hidden Rush (Psychology)',
      description: 'Faceless documentary psychology, hidden motivations behind behavior.',
      sub_niches: ['cognitive biases', 'motivation', 'social psychology'],
      content_risk_class: 'medium',
    },
    {
      demand: d(4, 'große, aktive Psychologie-Zuschauerschaft auf YouTube'),
      competition_gap: d(3, 'viel Konkurrenz, aber Premium-faceless-Doku-Ton ist unterbesetzt'),
      novelty: d(4, 'ruhiger, intelligenter Winkel hebt sich vom Hype ab'),
      emotional_tension: d(5, 'Psychologie = eingebaute Neugier/Spannung'),
      thumbnail_potential: d(4, 'ein Symbol + Gesicht-abgewandt trägt gut'),
      retention_potential: d(4, 'Open-Loop-Format hält'),
      credibility_fit: d(3, 'starkes Interesse, aber nicht Kern-Fachautorität'),
      production_ease: d(4, 'faceless, gut automatisierbar mit der Factory'),
      monetization_fit: d(3, 'vor allem AdSense; Produktbrücke schwächer'),
      audience_purchasing_power: d(3, 'breit, gemischte Kaufkraft'),
      evergreen_ratio: d(5, 'Psychologie ist stark evergreen'),
      legal_safety: d(3, 'Mental-Health-Nähe → Sorgfalt/Quellenregeln nötig'),
      channel_fit: d(5, 'klar abgegrenzte eigene Marke (Hidden Rush)'),
    },
  ),
  card(
    {
      candidate_id: 'gmp-explainer',
      name: 'GMP / Pharma Compliance Explainers',
      description: 'Faceless erklärt GMP, CSV, Part 11, Validation — B2B-Autorität.',
      sub_niches: ['CSV', 'data integrity', 'validation'],
      content_risk_class: 'medium',
    },
    {
      demand: d(2, 'kleines, aber hochspezifisches B2B-Publikum'),
      competition_gap: d(5, 'kaum hochwertiger faceless GMP-Content'),
      novelty: d(5, 'unbesetzte Lücke'),
      emotional_tension: d(2, 'trockenes Thema, wenig Drama'),
      thumbnail_potential: d(2, 'schwer klickstark zu bebildern'),
      retention_potential: d(3, 'nur bei klarer Struktur'),
      credibility_fit: d(5, 'Stefans Kern-Fachautorität — unfairer Vorteil'),
      production_ease: d(3, 'braucht mehr Faktenprüfung'),
      monetization_fit: d(5, 'direkte Lead-Gen zu QualiPilot'),
      audience_purchasing_power: d(5, 'Pharma-Budgets, hohe Kaufkraft'),
      evergreen_ratio: d(5, 'Regularien ändern sich langsam'),
      legal_safety: d(4, 'nur aktuelle offizielle Quellen zitieren'),
      channel_fit: d(4, 'eigener B2B-Kanal, klar getrennt'),
    },
  ),
  card(
    {
      candidate_id: 'ai-productivity',
      name: 'AI Productivity',
      description: 'AI-Tools & Workflows für Wissensarbeiter.',
      sub_niches: ['AI tools', 'automation'],
      content_risk_class: 'low',
    },
    {
      demand: d(5, 'riesige aktuelle Nachfrage'),
      competition_gap: d(1, 'extrem gesättigt'),
      novelty: d(2, 'schwer, sich abzuheben'),
      emotional_tension: d(3, 'FOMO treibt an'),
      thumbnail_potential: d(4, 'Tool-Logos/Vorher-Nachher ziehen'),
      retention_potential: d(2, 'Tutorial-Publikum springt schnell ab'),
      credibility_fit: d(3, 'Stefan baut AI, aber Kanalfokus unklar'),
      production_ease: d(3, 'Tools veralten schnell, viel Update-Aufwand'),
      monetization_fit: d(3, 'Affiliate/AdSense, mittel'),
      audience_purchasing_power: d(3, 'gemischt'),
      evergreen_ratio: d(2, 'starker Trend-Verfall'),
      legal_safety: d(5, 'geringes Risiko'),
      channel_fit: d(3, 'Gefahr der Themenvermischung'),
    },
  ),
]

export const demoProfileHints: Record<string, ProfileHint> = {
  'hidden-rush': { output_language: 'en', visual_preset: 'cinematic_editorial', target_duration_sec: 600, target_wpm: 138 },
  'gmp-explainer': { output_language: 'en', visual_preset: 'flat_2d', target_duration_sec: 480, target_wpm: 135 },
  'ai-productivity': { output_language: 'en', visual_preset: 'stickman_minimal', target_duration_sec: 420, target_wpm: 150 },
}
