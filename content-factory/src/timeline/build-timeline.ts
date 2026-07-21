import { Timeline } from '../schemas/index.js'
import type {
  Alignment,
  VoiceoverScript,
  ChannelProfile,
  Scene,
  VisualTemplate,
  NarrativeFunction,
} from '../schemas/index.js'
import { computeBoundaries } from './scene-split.js'

/** Standard-Zuordnung Erzählfunktion → visuelles Template (kostenbewusst, Stickman-first). */
const TEMPLATE_BY_FUNCTION: Record<NarrativeFunction, VisualTemplate> = {
  hook: 'stickman_character',
  setup: 'stickman_character',
  tension: 'two_character_interaction',
  turn: 'symbolic_metaphor',
  payoff: 'stickman_character',
  cta: 'editor_typography',
  transition: 'symbolic_metaphor',
}

const MUSIC_BY_FUNCTION: Record<NarrativeFunction, string> = {
  hook: 'tension_low',
  setup: 'bed_low',
  tension: 'tension_mid',
  turn: 'tension_high',
  payoff: 'resolve',
  cta: 'bed_low',
  transition: 'bed_low',
}

function sceneId(idx: number): string {
  return `S${String(idx + 1).padStart(3, '0')}`
}

function composeImagePrompt(
  channel: ChannelProfile,
  template: VisualTemplate,
  voText: string,
): string {
  const negatives = channel.visual_style_bible.negative_prompts.join(', ')
  const palette = channel.visual_style_bible.palette.join(' / ')
  const snippet = voText.length > 90 ? `${voText.slice(0, 90)}…` : voText
  return [
    `${template} scene, ${channel.niche} style`,
    `palette ${palette}, ${channel.visual_style_bible.line_width}`,
    `depicts: ${snippet}`,
    negatives ? `avoid: ${negatives}` : '',
  ]
    .filter(Boolean)
    .join(' | ')
}

/**
 * Erzeugt die kanonische Timeline aus REALEM Alignment.
 * Invarianten (durch Konstruktion garantiert, per QC verifiziert):
 * - Szene 1 startet bei 0 ms
 * - Szenen sind lückenlos und überlappungsfrei
 * - letzte Szene endet exakt bei audio_duration_ms
 */
export function buildTimeline(input: {
  script: VoiceoverScript
  alignment: Alignment
  channel: ChannelProfile
}): Timeline {
  const { script, alignment, channel } = input
  const boundaries = computeBoundaries(alignment)

  const scenes: Scene[] = alignment.segments.map((seg, idx) => {
    const start = boundaries[idx]!
    const end = boundaries[idx + 1]!
    const scriptSeg = script.segments.find((s) => s.segment_id === seg.segment_id)
    const fn: NarrativeFunction = scriptSeg?.narrative_function ?? 'setup'
    const template = TEMPLATE_BY_FUNCTION[fn]
    const words = alignment.words
      .filter((w) => w.start_ms >= start && w.start_ms < end)
      .map((w) => ({ text: w.text, start_ms: w.start_ms, end_ms: w.end_ms, confidence: w.confidence }))

    return {
      scene_id: sceneId(idx),
      start_ms: start,
      end_ms: end,
      duration_ms: end - start,
      vo_segment_ids: [seg.segment_id],
      vo_text: seg.text,
      words,
      narrative_function: fn,
      visual_template: template,
      visual_description: `${template} — ${fn}`,
      image_prompt: composeImagePrompt(channel, template, seg.text),
      video_prompt: null,
      reference_asset_ids: [],
      motion: 'slow_push_in',
      camera: 'medium_wide',
      on_screen_text: null,
      sfx: [],
      music_state: MUSIC_BY_FUNCTION[fn],
      transition_out: 'cut',
      source_claim_ids: scriptSeg?.claim_ids ?? [],
      asset_id: null,
      status: 'planned',
    }
  })

  return Timeline.parse({
    video_id: script.video_id,
    audio_duration_ms: alignment.audio_duration_ms,
    fps: channel.fps,
    alignment_source: alignment.source,
    scenes,
  })
}
