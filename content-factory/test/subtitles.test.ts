import { describe, it, expect } from 'vitest'
import { buildCues, toSrt, toVtt, msToSrtTimestamp, msToVttTimestamp } from '../src/subtitles/index.js'
import type { Alignment } from '../src/schemas/index.js'

const alignment: Alignment = {
  video_id: 'v1',
  audio_duration_ms: 8000,
  source: 'provider_marks',
  min_confidence: 0.99,
  words: [],
  segments: [
    {
      segment_id: 'VO001',
      text: 'Hello world.',
      start_ms: 150,
      end_ms: 3661,
      words: [],
      confidence: 0.99,
    },
    {
      segment_id: 'VO002',
      text: 'Second line.',
      start_ms: 3921,
      end_ms: 7800,
      words: [],
      confidence: 0.99,
    },
  ],
}

describe('subtitles', () => {
  it('formatiert SRT- und VTT-Zeitstempel korrekt', () => {
    expect(msToSrtTimestamp(3661)).toBe('00:00:03,661')
    expect(msToVttTimestamp(3661)).toBe('00:00:03.661')
    expect(msToSrtTimestamp(3_600_000 + 61_000 + 61)).toBe('01:01:01,061')
  })

  it('leitet Cues aus denselben Alignment-Segmenten ab', () => {
    const cues = buildCues(alignment)
    expect(cues).toHaveLength(2)
    expect(cues[0]!.start_ms).toBe(150)
    expect(cues[0]!.end_ms).toBe(3661)
    expect(cues[1]!.text).toBe('Second line.')
  })

  it('erzeugt gültiges SRT und VTT aus derselben Quelle', () => {
    const cues = buildCues(alignment)
    const srt = toSrt(cues)
    const vtt = toVtt(cues)
    expect(srt.startsWith('1\n00:00:00,150 --> 00:00:03,661\nHello world.')).toBe(true)
    expect(vtt.startsWith('WEBVTT')).toBe(true)
    expect(vtt).toContain('00:00:00.150 --> 00:00:03.661')
  })
})
