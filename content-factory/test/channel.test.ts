import { describe, it, expect } from 'vitest'
import { loadChannelProfile } from '../src/channels/load.js'
import { ChannelProfile } from '../src/schemas/index.js'

describe('channel profiles', () => {
  it('lädt das Hidden-Rush-Profil und validiert es', () => {
    const p = loadChannelProfile('hidden-rush')
    expect(p.channel_id).toBe('hidden-rush')
    expect(p.output_language).toBe('en')
    expect(p.content_risk_class).toBe('medium')
    expect(p.visual_preset).toBe('cinematic_editorial')
    expect(p.fps).toBe(24)
    expect(p.visual_style_bible.characters[0]?.character_id).toBe('HR-FIGURE')
  })

  it('lädt ein ZWEITES Profil ohne Kerncode-Änderung (nur neue JSON-Datei)', () => {
    const a = loadChannelProfile('hidden-rush')
    const b = loadChannelProfile('quiet-history')
    // Kanaltrennung: unterschiedliche Identität, Nische, Palette, Stimme, Budget
    expect(a.channel_id).not.toBe(b.channel_id)
    expect(a.niche).not.toBe(b.niche)
    expect(a.tts.voice_id).not.toBe(b.tts.voice_id)
    expect(a.visual_style_bible.palette).not.toEqual(b.visual_style_bible.palette)
    expect(a.budget_usd_per_video).not.toBe(b.budget_usd_per_video)
  })

  it('weist ein ungültiges Profil zurück (fehlende Pflichtfelder)', () => {
    expect(() => ChannelProfile.parse({ channel_id: 'x' })).toThrow()
  })
})
