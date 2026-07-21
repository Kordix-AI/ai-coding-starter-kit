import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeSilentWav, readWavDurationMs } from '../src/audio/wav.js'

describe('wav', () => {
  it('schreibt und liest die Dauer verlustfrei (roundtrip)', () => {
    const path = join(tmpdir(), `cf-wav-${process.pid}.wav`)
    const written = writeSilentWav(path, 5234)
    const read = readWavDurationMs(path)
    expect(written).toBe(read)
    // Sample-Rundung: max 1 ms Abweichung zur Zielvorgabe
    expect(Math.abs(read - 5234)).toBeLessThanOrEqual(1)
  })

  it('wirft bei ungültigem WAV', () => {
    expect(() => readWavDurationMs(Buffer.from('not a wav'))).toThrow()
  })
})
