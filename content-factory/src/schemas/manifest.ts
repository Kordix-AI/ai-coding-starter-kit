import { z } from 'zod'

/** manifest.json — verknüpft alle Artefakte per Version, Hash und Status. */
export const ArtifactRef = z.object({
  path: z.string(),
  version: z.string(),
  hash: z.string().optional(),
  status: z.enum(['pending', 'ready', 'failed']).default('pending'),
})

export const Manifest = z.object({
  video_id: z.string(),
  channel_id: z.string(),
  slug: z.string(),
  created_at: z.string(),
  current_stage: z.string(),
  artifacts: z.record(z.string(), ArtifactRef).default({}),
})
export type Manifest = z.infer<typeof Manifest>
export type ArtifactRef = z.infer<typeof ArtifactRef>
