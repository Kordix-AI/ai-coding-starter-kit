import { readWavDurationMs } from '../../audio/wav.js'
import type { VoiceoverScript } from '../../schemas/index.js'
import type { TTSProvider, TtsResult, ProviderMeta } from '../interfaces.js'

/**
 * Realer Higgsfield-TTS-Adapter — encodet den TATSÄCHLICH beobachteten Contract
 * (Option-1-Experiment, seed_audio / ByteDance Seed Audio 1.0):
 *
 *   - Eingabe: model 'seed_audio', voice_type 'preset'|'element', voice_id, prompt
 *   - Kosten: get_cost-Preflight (beobachtet: 4.8 credits für ~700 Zeichen / 45.96 s)
 *   - Ausgabe: WAV 24 kHz + durationSec + waveform-URL
 *   - WICHTIG: KEINE Wort-/Satz-Zeitmarken → provides_word_timing = false
 *     ⇒ Timeline erfordert Forced Alignment (siehe alignment/route.ts).
 *
 * Laufzeit-Transport wird injiziert: der Produktions-Worker nutzt die Higgsfield
 * HTTP-API (HIGGSFIELD_API_KEY). Der MCP-Server ist eine Agent-Zeit-Fähigkeit und
 * kein Worker-Runtime-Client — daher Dependency Injection statt harter Kopplung.
 */

export interface HiggsfieldTtsSubmitResult {
  audio_url: string
  duration_sec: number
  format: string
  sample_rate: number
  job_id: string
}

export interface HiggsfieldTtsConfig {
  voiceId: string
  voiceType?: 'preset' | 'element'
  model?: string
  /** Reicht den Text ein, pollt bis fertig und liefert die Audio-URL zurück. */
  submit?: (req: { model: string; prompt: string; voice_id: string; voice_type: string }) => Promise<HiggsfieldTtsSubmitResult>
  /** Lädt die Audio-URL nach outPath (Worker-Egress mit erlaubtem Host). */
  download?: (url: string, outPath: string) => Promise<void>
}

/** seed_audio liefert keine Marks — bewusst leer. */
const SEED_AUDIO_PROVIDES_WORD_TIMING = false

function scriptToPrompt(script: VoiceoverScript): string {
  return script.segments.map((s) => s.text.trim()).join(' ')
}

export class HiggsfieldTTSProvider implements TTSProvider {
  readonly meta: ProviderMeta
  private readonly cfg: HiggsfieldTtsConfig

  constructor(cfg: HiggsfieldTtsConfig) {
    this.cfg = cfg
    const configured = Boolean(cfg.submit && cfg.download)
    this.meta = {
      name: 'higgsfield-seed-audio',
      role: 'tts',
      status: configured ? 'available' : 'configurable',
      notes: configured
        ? 'seed_audio (24 kHz WAV). Liefert KEINE Wort-Marks → Forced Alignment nötig.'
        : 'Transport nicht injiziert (HIGGSFIELD_API_KEY / Worker-HTTP-Client fehlt).',
    }
  }

  async synthesize(script: VoiceoverScript, outPath: string): Promise<TtsResult> {
    const { submit, download, voiceId, voiceType = 'preset', model = 'seed_audio' } = this.cfg
    if (!submit || !download) {
      throw new Error(
        'HiggsfieldTTSProvider: configurable — kein Transport injiziert. ' +
          'Worker braucht Higgsfield HTTP-Client + HIGGSFIELD_API_KEY (Egress erlaubt).',
      )
    }
    const res = await submit({ model, prompt: scriptToPrompt(script), voice_id: voiceId, voice_type: voiceType })
    await download(res.audio_url, outPath)
    // reale Dauer AUS dem heruntergeladenen Audio (ffprobe-äquivalent), nicht aus der API-Zahl
    const audioDurationMs = readWavDurationMs(outPath)
    return {
      audio_path: outPath,
      audio_duration_ms: audioDurationMs,
      provider_marks: [], // seed_audio: keine Marks
      provides_word_timing: SEED_AUDIO_PROVIDES_WORD_TIMING,
      provenance: { provider: this.meta.name, voice_id: voiceId, cost_usd: 0 },
    }
  }
}
