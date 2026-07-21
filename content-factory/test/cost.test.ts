import { describe, it, expect } from 'vitest'
import { estimateVideoCost } from '../src/cost/estimate.js'
import { demoScript } from '../src/pipeline/demo.js'

describe('cost estimate', () => {
  it('Mock/Dry-Run kostet 0 und bleibt im Budget', () => {
    const c = estimateVideoCost({
      script: demoScript,
      sceneCount: 8,
      i2vClips: 1,
      durationMs: 75_000,
      budgetUsd: 8,
      mock: true,
    })
    expect(c.total_usd).toBe(0)
    expect(c.within_budget).toBe(true)
  })

  it('reale Schätzung summiert Positionen und prüft das Budget', () => {
    const c = estimateVideoCost({
      script: demoScript,
      sceneCount: 8,
      i2vClips: 1,
      durationMs: 75_000,
      budgetUsd: 8,
    })
    expect(c.total_usd).toBeGreaterThan(0)
    expect(c.items.length).toBe(4)
    expect(c.within_budget).toBe(true)
  })

  it('markiert Budgetüberschreitung', () => {
    const c = estimateVideoCost({
      script: demoScript,
      sceneCount: 40,
      i2vClips: 20,
      durationMs: 600_000,
      budgetUsd: 1,
    })
    expect(c.within_budget).toBe(false)
  })
})
