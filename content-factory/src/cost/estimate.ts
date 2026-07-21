import type { VoiceoverScript } from '../schemas/index.js'

/**
 * Kostenschätzung vor jeder kostenpflichtigen Stufe (Master-Prompt Kosten-Gate).
 * Werte sind konservative Platzhalter-Tarife; echte Tarife kommen später aus
 * der Provider-Config. Dry-Run/Mock kostet 0.
 */
export interface CostRates {
  tts_usd_per_1k_chars: number
  image_usd_per_still: number
  i2v_usd_per_clip: number
  render_usd_per_minute: number
}

export const DEFAULT_RATES: CostRates = {
  tts_usd_per_1k_chars: 0.3,
  image_usd_per_still: 0.04,
  i2v_usd_per_clip: 0.5,
  render_usd_per_minute: 0.02,
}

export interface CostLineItem {
  stage: string
  detail: string
  usd: number
}

export interface CostEstimate {
  items: CostLineItem[]
  total_usd: number
  within_budget: boolean
  budget_usd: number
}

export function estimateScriptChars(script: VoiceoverScript): number {
  return script.segments.reduce((n, s) => n + s.text.length, 0)
}

export function estimateVideoCost(input: {
  script: VoiceoverScript
  sceneCount: number
  i2vClips: number
  durationMs: number
  budgetUsd: number
  rates?: CostRates
  mock?: boolean
}): CostEstimate {
  const rates = input.rates ?? DEFAULT_RATES
  if (input.mock) {
    return { items: [], total_usd: 0, within_budget: true, budget_usd: input.budgetUsd }
  }
  const chars = estimateScriptChars(input.script)
  const minutes = input.durationMs / 60_000
  const items: CostLineItem[] = [
    { stage: 'tts', detail: `${chars} chars`, usd: (chars / 1000) * rates.tts_usd_per_1k_chars },
    {
      stage: 'assets',
      detail: `${input.sceneCount} stills`,
      usd: input.sceneCount * rates.image_usd_per_still,
    },
    { stage: 'assets', detail: `${input.i2vClips} i2v`, usd: input.i2vClips * rates.i2v_usd_per_clip },
    {
      stage: 'render',
      detail: `${minutes.toFixed(1)} min`,
      usd: minutes * rates.render_usd_per_minute,
    },
  ]
  const total = Math.round(items.reduce((s, i) => s + i.usd, 0) * 100) / 100
  return {
    items,
    total_usd: total,
    within_budget: total <= input.budgetUsd,
    budget_usd: input.budgetUsd,
  }
}
