import { z } from 'zod'
import { Millis, Fps, Confidence, VisualTemplate, NarrativeFunction } from './common.js'

/**
 * Kanonische Timeline (Master-Prompt). Ganzzahlige Millisekunden.
 * Aus DIESER Datei werden Timeline, Untertitel, Asset-Plan und Renderdaten
 * abgeleitet — es gibt keine zweite Timing-Quelle.
 */

export const TimelineWord = z.object({
  text: z.string(),
  start_ms: Millis,
  end_ms: Millis,
  confidence: Confidence,
})

export const SceneStatus = z.enum([
  'planned',
  'anchor',
  'generating',
  'ready',
  'failed',
])

export const Scene = z.object({
  scene_id: z.string(), // 'S001'
  start_ms: Millis,
  end_ms: Millis,
  duration_ms: Millis,
  vo_segment_ids: z.array(z.string()),
  vo_text: z.string(),
  words: z.array(TimelineWord),
  narrative_function: NarrativeFunction,
  visual_template: VisualTemplate,
  visual_description: z.string(),
  image_prompt: z.string(),
  video_prompt: z.string().nullable().default(null),
  reference_asset_ids: z.array(z.string()).default([]),
  motion: z.string(),
  camera: z.string(),
  on_screen_text: z.string().nullable().default(null),
  sfx: z.array(z.string()).default([]),
  music_state: z.string(),
  transition_out: z.string(),
  source_claim_ids: z.array(z.string()).default([]),
  asset_id: z.string().nullable().default(null),
  status: SceneStatus.default('planned'),
})
export type Scene = z.infer<typeof Scene>

export const Timeline = z.object({
  video_id: z.string(),
  audio_duration_ms: Millis,
  fps: Fps,
  alignment_source: z.enum(['provider_marks', 'forced_alignment']),
  scenes: z.array(Scene).min(1),
})
export type Timeline = z.infer<typeof Timeline>
