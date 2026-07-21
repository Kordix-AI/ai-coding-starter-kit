import type { Alignment } from '../schemas/index.js'

/**
 * Szenengrenzen aus semantischen Einheiten UND echten Audio-Grenzen.
 * MVP: eine Szene je VO-Segment. Grenzen liegen an Segmentanfängen →
 * Wörter werden nie über Szenen zerschnitten (Akzeptanzkriterium).
 * Die erste Grenze ist 0 (Szene 1 beginnt bei 0 ms), die letzte ist die
 * reale Audio-Dauer (letzte Szene deckt Rest-Audio ab).
 */
export function computeBoundaries(alignment: Alignment): number[] {
  const segs = alignment.segments
  const boundaries: number[] = [0]
  for (let i = 1; i < segs.length; i++) {
    boundaries.push(segs[i]!.start_ms)
  }
  boundaries.push(alignment.audio_duration_ms)
  return boundaries
}
