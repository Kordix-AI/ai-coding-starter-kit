import { describe, it, expect } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runProduction } from '../src/pipeline/run-slice.js'
import { loadChannelProfile } from '../src/channels/load.js'
import { demoBrief, demoScript } from '../src/pipeline/demo.js'

const FIXED_NOW = () => '2026-07-22T09:00:00.000Z'

describe('runProduction — ein Production Package pro Video, kanal-getrieben', () => {
  it('läuft für einen ANDEREN Kanal (quiet-history, stickman) sauber durch', async () => {
    const channel = loadChannelProfile('quiet-history')
    const out = mkdtempSync(join(tmpdir(), 'cf-prod-'))
    const r = await runProduction({
      channel,
      brief: { ...demoBrief, channel_id: 'quiet-history' },
      script: { ...demoScript, channel_id: 'quiet-history' },
      outRoot: out,
      now: FIXED_NOW,
    })
    expect(r.qc.ok).toBe(true)
    expect(r.scene_count).toBe(8)
    // stickman-Preset des Kanals greift
    expect(r.timeline.scenes[0]!.visual_template).toBe('stickman_character')
    expect(r.timeline.fps).toBe(30) // quiet-history fps aus dem Profil
  })
})
