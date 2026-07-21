import { z } from 'zod'

/** Video-Brief (Stufe B) — Zuschauer-Versprechen + dominante Spannung. */
export const VideoBrief = z.object({
  video_id: z.string(),
  channel_id: z.string(),
  title_working: z.string(),
  viewer_promise: z.string(),
  dominant_question: z.string(),
  target_duration_sec: z.number().positive(),
  retention_beats: z.array(z.string()).default([]),
  open_loops: z.array(z.string()).default([]),
  angle: z.string(),
  brief_version: z.string(),
})
export type VideoBrief = z.infer<typeof VideoBrief>
