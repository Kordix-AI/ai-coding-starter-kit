/**
 * Strukturiertes Nischen-Interview (Ebene 2, Start). Als Daten definiert, damit
 * Dashboard oder LLM es fahren können — spiegelt das OS-Interview-Muster
 * (/write-spec, PROJ-9 Demand Validation).
 */

export interface InterviewQuestion {
  id: string
  prompt: string
  kind: 'text' | 'list' | 'single' | 'number'
  options?: string[]
  maps_to: string // Feld im FounderProfile / Scorecard
}

export interface InterviewSection {
  key: string
  title: string
  questions: InterviewQuestion[]
}

export const NICHE_INTERVIEW: InterviewSection[] = [
  {
    key: 'you',
    title: 'Fähigkeiten & unfairer Vorteil',
    questions: [
      { id: 'skills', prompt: 'Welche Fähigkeiten/Fachgebiete beherrschst du wirklich gut?', kind: 'list', maps_to: 'skills' },
      { id: 'interests', prompt: 'Über welche Themen kannst du 100+ Videos machen, ohne auszubrennen?', kind: 'list', maps_to: 'interests' },
      { id: 'advantages', prompt: 'Welchen unfairen Vorteil hast du (Zugang, Erfahrung, Autorität)?', kind: 'list', maps_to: 'unfair_advantages' },
    ],
  },
  {
    key: 'constraints',
    title: 'Realität & Grenzen',
    questions: [
      { id: 'time', prompt: 'Wie viele Stunden/Woche realistisch für Content?', kind: 'number', maps_to: 'time_budget_hours_per_week' },
      { id: 'risk', prompt: 'Risikobereitschaft für riskante/regulierte Themen?', kind: 'single', options: ['low', 'medium', 'high'], maps_to: 'risk_tolerance' },
      { id: 'hard', prompt: 'Harte Ausschlüsse (z. B. keine med. Beratung, keine Gesichtskamera)?', kind: 'list', maps_to: 'hard_constraints' },
    ],
  },
  {
    key: 'money',
    title: 'Monetarisierung',
    questions: [
      { id: 'monet', prompt: 'Wie soll der Kanal Geld verdienen (AdSense, Produkt, Lead-Gen, Sponsoring)?', kind: 'list', maps_to: 'monetization_goals' },
    ],
  },
  {
    key: 'candidates',
    title: 'Nischen-Kandidaten',
    questions: [
      { id: 'candidates', prompt: 'Nenne 2–4 konkrete Nischen-Kandidaten (je Name + Kurzbeschreibung).', kind: 'list', maps_to: 'candidates' },
    ],
  },
]

/** Die 13 Dimensionen, die pro Kandidat begründet bewertet werden (für die UI). */
export const SCORING_PROMPTS: Record<string, string> = {
  demand: 'Gibt es belegbare Suchnachfrage / bestehendes Publikum?',
  competition_gap: 'Wie schwach/lückenhaft ist die Konkurrenz (hoch = gute Lücke)?',
  novelty: 'Wie frisch ist der Winkel vs. Gesehenem?',
  emotional_tension: 'Wie stark die emotionale Spannung/Neugier?',
  thumbnail_potential: 'Lässt sich ein klares, klickstarkes Thumbnail bauen?',
  retention_potential: 'Hält das Format Zuschauer (Open Loops, Payoff)?',
  credibility_fit: 'Deckt sich mit deinen Skills/Autorität?',
  production_ease: 'Geringer Aufwand / gut automatisierbar (hoch = leicht)?',
  monetization_fit: 'Passt zu deinen Erlöszielen?',
  audience_purchasing_power: 'Hat die Zielgruppe Kaufkraft?',
  evergreen_ratio: 'Mehr Evergreen als Trend (hoch = beständiger)?',
  legal_safety: 'Geringes rechtliches/fachliches Risiko (hoch = sicher)?',
  channel_fit: 'Passt sauber als eigener Kanal (keine Themenmischung)?',
}
