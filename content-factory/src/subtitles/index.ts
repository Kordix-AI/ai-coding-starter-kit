import type { Alignment } from '../schemas/index.js'

/**
 * Untertitel entstehen aus DEMSELBEN Alignment wie die Timeline
 * (Master-Prompt Akzeptanzkriterium). Keine zweite Zeitquelle.
 */

export interface Cue {
  index: number
  start_ms: number
  end_ms: number
  text: string
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

function splitMs(ms: number): { h: number; m: number; s: number; msPart: number } {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  const msPart = ms % 1000
  return { h, m, s, msPart }
}

export function msToSrtTimestamp(ms: number): string {
  const { h, m, s, msPart } = splitMs(ms)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msPart, 3)}`
}

export function msToVttTimestamp(ms: number): string {
  const { h, m, s, msPart } = splitMs(ms)
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(msPart, 3)}`
}

/** Ein Cue pro VO-Segment, mit den echten Segmentgrenzen aus dem Alignment. */
export function buildCues(alignment: Alignment): Cue[] {
  return alignment.segments.map((seg, i) => ({
    index: i + 1,
    start_ms: seg.start_ms,
    end_ms: seg.end_ms,
    text: seg.text.trim(),
  }))
}

export function toSrt(cues: Cue[]): string {
  return (
    cues
      .map(
        (c) =>
          `${c.index}\n${msToSrtTimestamp(c.start_ms)} --> ${msToSrtTimestamp(c.end_ms)}\n${c.text}`,
      )
      .join('\n\n') + '\n'
  )
}

export function toVtt(cues: Cue[]): string {
  return (
    'WEBVTT\n\n' +
    cues
      .map(
        (c) =>
          `${c.index}\n${msToVttTimestamp(c.start_ms)} --> ${msToVttTimestamp(c.end_ms)}\n${c.text}`,
      )
      .join('\n\n') +
    '\n'
  )
}
