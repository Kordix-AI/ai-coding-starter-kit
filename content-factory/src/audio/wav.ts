import { writeFileSync, readFileSync } from 'node:fs'

/**
 * Pure-TS WAV-Utility. Ersetzt im Mock/Local-Pfad ffprobe für die Dauer-Messung.
 * Der reale Worker nutzt ffprobe (siehe ARCHITECTURE.md, RenderProvider/Worker).
 */

export interface WavSpec {
  sampleRate: number
  channels: number
  bitsPerSample: number
}

export const DEFAULT_WAV: WavSpec = { sampleRate: 16000, channels: 1, bitsPerSample: 16 }

/** Schreibt ein stilles PCM-WAV der gewünschten Dauer und liefert die tatsächliche Dauer (ms) zurück. */
export function writeSilentWav(path: string, durationMs: number, spec: WavSpec = DEFAULT_WAV): number {
  const { sampleRate, channels, bitsPerSample } = spec
  const bytesPerSample = bitsPerSample / 8
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const dataSize = numSamples * channels * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28)
  buffer.writeUInt16LE(channels * bytesPerSample, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  writeFileSync(path, buffer)
  return readWavDurationMs(buffer)
}

/** Liest die reale Audio-Dauer (ganzzahlige ms) aus dem WAV-Header — die "echte" Dauer. */
export function readWavDurationMs(src: string | Buffer): number {
  const buf = typeof src === 'string' ? readFileSync(src) : src
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('readWavDurationMs: kein gültiges WAV (RIFF/WAVE fehlt)')
  }
  let offset = 12
  let sampleRate = 0
  let channels = 0
  let bitsPerSample = 0
  let dataSize = -1
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4)
    const size = buf.readUInt32LE(offset + 4)
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(offset + 10)
      sampleRate = buf.readUInt32LE(offset + 12)
      bitsPerSample = buf.readUInt16LE(offset + 22)
    } else if (id === 'data') {
      dataSize = size
    }
    offset += 8 + size + (size % 2) // Chunks sind wort-aligned
  }
  if (sampleRate === 0 || dataSize < 0) {
    throw new Error('readWavDurationMs: fmt/data chunk fehlt')
  }
  const bytesPerFrame = channels * (bitsPerSample / 8)
  const numFrames = dataSize / bytesPerFrame
  return Math.round((numFrames / sampleRate) * 1000)
}
