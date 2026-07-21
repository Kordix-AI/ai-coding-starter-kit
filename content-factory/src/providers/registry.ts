import type { ProviderMeta, ProviderRole, CapabilityStatus } from './interfaces.js'

/**
 * Capability Registry — der ehrliche Ist-Zustand der Fähigkeiten (Master-Prompt:
 * "markiere die Integration ehrlich als 'not configured'").
 * Spiegelt die Phase-0-Discovery wider. Wird beim Slice-Lauf geloggt.
 */
export const CAPABILITY_REGISTRY: ProviderMeta[] = [
  { name: 'firecrawl', role: 'research', status: 'available', notes: 'Web-Suche/Scrape/Extract via MCP.' },
  { name: 'claude', role: 'llm', status: 'available', notes: '@anthropic-ai/sdk (im OS-Repo etabliert).' },
  { name: 'mock-tts', role: 'tts', status: 'available', notes: 'MVP-Mock mit Marks.' },
  { name: 'higgsfield-seed-audio', role: 'tts', status: 'configurable', notes: 'VERIFIZIERT: seed_audio 24kHz WAV, KEINE Wort-Marks. Worker-HTTP-Client nötig.' },
  { name: 'provider-marks', role: 'alignment', status: 'available', notes: 'Nutzt TTS-Marks (falls Provider sie liefert).' },
  { name: 'forced-alignment', role: 'alignment', status: 'not_configured', notes: 'PFLICHT für seed_audio: WhisperX/faster-whisper Worker (Wort-Timestamps).' },
  { name: 'higgsfield-image', role: 'image', status: 'available', notes: 'generate_image via MCP (Kosten-Gate).' },
  { name: 'higgsfield-i2v', role: 'video', status: 'available', notes: 'generate_video (I2V) via MCP (Kosten-Gate, selektiv).' },
  { name: 'canva', role: 'thumbnail', status: 'available', notes: 'Thumbnails/Designvorlagen via MCP.' },
  { name: 'remotion-ffmpeg', role: 'render', status: 'configurable', notes: 'Worker nötig; ffmpeg/ffprobe in dieser Session NICHT installiert.' },
  { name: 'supabase-storage', role: 'storage', status: 'available', notes: 'Media/Metadaten via Supabase (MCP + SDK).' },
  { name: 'youtube', role: 'publish', status: 'not_configured', notes: 'YouTube Data API — Zugang/OAuth nötig (Blueprint Phase 3).' },
  { name: 'youtube-analytics', role: 'analytics', status: 'not_configured', notes: 'YouTube Analytics API — Zugang nötig (Blueprint Phase 4).' },
]

export function capabilitiesByStatus(status: CapabilityStatus): ProviderMeta[] {
  return CAPABILITY_REGISTRY.filter((c) => c.status === status)
}

export function capabilityFor(role: ProviderRole): ProviderMeta | undefined {
  return CAPABILITY_REGISTRY.find((c) => c.role === role && c.status !== 'not_configured')
}

export function renderCapabilityMatrix(): string {
  const order: CapabilityStatus[] = ['available', 'configurable', 'not_configured']
  const icon: Record<CapabilityStatus, string> = {
    available: '✅',
    configurable: '🟡',
    not_configured: '🔴',
  }
  return order
    .map((s) =>
      capabilitiesByStatus(s)
        .map((c) => `${icon[s]} ${c.role.padEnd(10)} ${c.name.padEnd(18)} ${c.notes ?? ''}`)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n')
}
