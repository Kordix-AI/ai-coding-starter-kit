import type { VoiceoverScript, Alignment, Timeline } from '../schemas/index.js'

/**
 * Provider-Unabhängigkeit (Master-Prompt Prinzip #4): Adapter statt harter Kopplung.
 * Jede Rolle ist ein Interface; Implementierungen sind austauschbar (Mock/Local/echt).
 */

export type ProviderRole =
  | 'research'
  | 'llm'
  | 'tts'
  | 'alignment'
  | 'image'
  | 'video'
  | 'thumbnail'
  | 'render'
  | 'storage'
  | 'publish'
  | 'analytics'

export type CapabilityStatus = 'available' | 'configurable' | 'not_configured'

export interface ProviderMeta {
  name: string
  role: ProviderRole
  status: CapabilityStatus
  /** ehrlicher Hinweis, was für 'configurable'/'not_configured' fehlt */
  notes?: string
}

// --- TTS ---------------------------------------------------------------
export interface TtsWordMark {
  text: string
  start_ms: number
  end_ms: number
  segment_id: string
}

export interface TtsResult {
  audio_path: string
  audio_duration_ms: number
  /** Provider-Zeitmarken, falls verlässlich geliefert; sonst leer → Forced Alignment */
  provider_marks: TtsWordMark[]
  provides_word_timing: boolean
  provenance: { provider: string; voice_id: string; cost_usd: number }
}

export interface TTSProvider {
  readonly meta: ProviderMeta
  synthesize(script: VoiceoverScript, outPath: string): Promise<TtsResult>
}

// --- Alignment ---------------------------------------------------------
export interface AlignmentProvider {
  readonly meta: ProviderMeta
  /** Baut das Alignment aus Provider-Marks ODER via Forced Alignment gegen das reale Audio. */
  align(input: {
    script: VoiceoverScript
    audioPath: string
    audioDurationMs: number
    providerMarks: TtsWordMark[]
  }): Promise<Alignment>
}

// --- Render (Worker: Remotion/FFmpeg) ----------------------------------
export interface RenderResult {
  video_path: string
  duration_ms: number
  width: number
  height: number
  fps: number
  cost_usd: number
}

export interface RenderProvider {
  readonly meta: ProviderMeta
  renderPreview(input: { timeline: Timeline; audioPath: string; outPath: string }): Promise<RenderResult>
}

// --- Weitere Rollen (Contracts; MVP: nur Meta/Slot) --------------------
export interface ResearchProvider {
  readonly meta: ProviderMeta
}
export interface LLMProvider {
  readonly meta: ProviderMeta
}
export interface ImageProvider {
  readonly meta: ProviderMeta
}
export interface VideoProvider {
  readonly meta: ProviderMeta
}
export interface ThumbnailProvider {
  readonly meta: ProviderMeta
}
export interface StorageProvider {
  readonly meta: ProviderMeta
}
export interface PublishProvider {
  readonly meta: ProviderMeta
}
export interface AnalyticsProvider {
  readonly meta: ProviderMeta
}
