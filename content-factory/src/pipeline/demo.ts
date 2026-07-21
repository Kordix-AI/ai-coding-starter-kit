import { VideoBrief, VoiceoverScript } from '../schemas/index.js'

/**
 * Deterministischer Demo-Slice (Hidden Rush, ~75s) — "The Spotlight Effect".
 * Ersetzt im MVP den LLMProvider (Brief/Skript). Echt: Claude generiert diese
 * Artefakte, hier hand-authored für einen reproduzierbaren Test-Pfad.
 */

export const DEMO_VIDEO_ID = 'hr-demo-spotlight'

export const demoBrief = VideoBrief.parse({
  video_id: DEMO_VIDEO_ID,
  channel_id: 'hidden-rush',
  title_working: 'The Audience That Isn’t Watching',
  viewer_promise: 'Understand why you feel watched — and why you mostly aren’t.',
  dominant_question: 'Why do we overestimate how much others notice us?',
  target_duration_sec: 75,
  retention_beats: ['unsettling cold open', 'name the effect', 'the shirt study', 'applied release'],
  open_loops: ['who is actually watching you?'],
  angle: 'the spotlight effect as quiet relief, not self-help hype',
  brief_version: '1.0.0',
})

export const demoScript = VoiceoverScript.parse({
  video_id: DEMO_VIDEO_ID,
  channel_id: 'hidden-rush',
  language: 'en',
  target_wpm: 138,
  timestamps_are_provisional: true,
  script_version: '1.0.0',
  segments: [
    {
      segment_id: 'VO001',
      text: 'You walk into a room and feel every eye land on you.',
      narrative_function: 'hook',
      planned_duration_ms: 3200,
      claim_ids: [],
    },
    {
      segment_id: 'VO002',
      text: 'Here is the quiet truth. Almost no one is watching you as closely as you think.',
      narrative_function: 'setup',
      planned_duration_ms: 4600,
      claim_ids: [],
    },
    {
      segment_id: 'VO003',
      text: 'Psychologists call it the spotlight effect, the sense that our actions are noticed far more than they really are.',
      narrative_function: 'tension',
      planned_duration_ms: 6200,
      claim_ids: ['C1'],
    },
    {
      segment_id: 'VO004',
      text: 'In one study, students wore an embarrassing shirt and guessed that nearly half the room would notice. The real number was closer to a fifth.',
      narrative_function: 'turn',
      planned_duration_ms: 7800,
      claim_ids: ['C1'],
    },
    {
      segment_id: 'VO005',
      text: 'The mind places you at the center of a stage that, for everyone else, does not exist.',
      narrative_function: 'payoff',
      planned_duration_ms: 5200,
      claim_ids: [],
    },
    {
      segment_id: 'VO006',
      text: 'Each person is the star of their own spotlight, far too busy in it to study yours.',
      narrative_function: 'setup',
      planned_duration_ms: 5000,
      claim_ids: [],
    },
    {
      segment_id: 'VO007',
      text: 'Which means the fear that freezes you is built on an audience that is not looking.',
      narrative_function: 'payoff',
      planned_duration_ms: 5000,
      claim_ids: [],
    },
    {
      segment_id: 'VO008',
      text: 'Notice the spotlight the next time it falls. Then step through it anyway.',
      narrative_function: 'cta',
      planned_duration_ms: 4200,
      claim_ids: [],
    },
  ],
})
