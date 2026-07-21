import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runSlice } from '../src/pipeline/run-slice.js'
import { stableHash, frameMs } from '../src/index.js'

const FIXED_NOW = () => '2026-07-21T09:00:00.000Z'

describe('integration — Skript → Audio → Alignment → Timeline → SRT', () => {
  it('produziert ein valides Production Package mit bestandenem QC', async () => {
    const out = mkdtempSync(join(tmpdir(), 'cf-slice-'))
    const r = await runSlice({ outRoot: out, now: FIXED_NOW })

    expect(r.qc.ok).toBe(true)
    expect(r.scene_count).toBe(8)
    expect(r.audio_duration_ms).toBeGreaterThan(30_000)

    // Endzeit ≤ 1 Frame zur Audio-Dauer
    const lastEnd = r.timeline.scenes[r.timeline.scenes.length - 1]!.end_ms
    expect(Math.abs(r.audio_duration_ms - lastEnd)).toBeLessThanOrEqual(frameMs(r.timeline.fps))

    // Artefakte auf Platte vorhanden
    const base = join(out, r.video_id)
    expect(existsSync(join(base, 'manifest.json'))).toBe(true)
    expect(existsSync(join(base, 'audio', 'voiceover.wav'))).toBe(true)
    expect(existsSync(join(base, 'storyboard', 'timeline.json'))).toBe(true)
    expect(existsSync(join(base, 'captions', 'subtitles.srt'))).toBe(true)

    // Untertitel stammen aus demselben Alignment (erste Cue = Hook)
    const srt = readFileSync(join(base, 'captions', 'subtitles.srt'), 'utf8')
    expect(srt.startsWith('1\n00:00:00')).toBe(true)
    expect(srt).toContain('every eye land on you')
  })

  it('ist reproduzierbar: zwei Läufe ergeben identische Timeline & Audio-Dauer', async () => {
    const a = await runSlice({ outRoot: mkdtempSync(join(tmpdir(), 'cf-a-')), now: FIXED_NOW })
    const b = await runSlice({ outRoot: mkdtempSync(join(tmpdir(), 'cf-b-')), now: FIXED_NOW })
    expect(a.audio_duration_ms).toBe(b.audio_duration_ms)
    expect(stableHash(a.timeline)).toBe(stableHash(b.timeline))
  })
})
