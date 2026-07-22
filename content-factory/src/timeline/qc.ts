import type { Timeline } from '../schemas/index.js'
import { DEFAULT_QC_POLICY, type QcPolicy } from '../policy.js'

export interface QcIssue {
  level: 'error' | 'warning'
  code: string
  message: string
}
export interface QcReport {
  ok: boolean
  issues: QcIssue[]
}

export interface QcOptions {
  /** Alignment-Konfidenz; unter der Schwelle → sichtbarer QC-Fehler (keine stille Freigabe). */
  alignmentMinConfidence?: number
  /** überschreibt einzelne Default-Schwellen (policy.ts). */
  policy?: Partial<QcPolicy>
}

export function frameMs(fps: number): number {
  return Math.round(1000 / fps)
}

/**
 * Automatische Timing-QC (Master-Prompt Akzeptanzkriterien Timing).
 * Prüft Start, Lücken/Überlappungen, Clip-Länge, Endzeit-Drift, Konfidenz.
 */
export function qcTimeline(timeline: Timeline, opts: QcOptions = {}): QcReport {
  const issues: QcIssue[] = []
  const { scenes, audio_duration_ms, fps } = timeline
  const policy: QcPolicy = { ...DEFAULT_QC_POLICY, ...opts.policy }
  const f = frameMs(fps)
  const driftTolerance = f * policy.maxEndDriftFrames
  const threshold = policy.minAlignmentConfidence

  if (scenes.length === 0) {
    issues.push({ level: 'error', code: 'NO_SCENES', message: 'Timeline hat keine Szenen.' })
    return { ok: false, issues }
  }

  // Szene 1 beginnt bei 0 ms
  if (scenes[0]!.start_ms !== 0) {
    issues.push({
      level: 'error',
      code: 'START_NOT_ZERO',
      message: `Erste Szene startet bei ${scenes[0]!.start_ms} ms statt 0.`,
    })
  }

  // pro Szene: Länge > 0 und duration == end-start
  for (const s of scenes) {
    if (s.duration_ms <= 0) {
      issues.push({
        level: 'error',
        code: 'ZERO_OR_NEGATIVE',
        message: `${s.scene_id}: duration_ms=${s.duration_ms} (muss > 0 sein).`,
      })
    }
    if (s.duration_ms !== s.end_ms - s.start_ms) {
      issues.push({
        level: 'error',
        code: 'DURATION_MISMATCH',
        message: `${s.scene_id}: duration_ms stimmt nicht mit end-start überein.`,
      })
    }
  }

  // lückenlos & überlappungsfrei
  for (let i = 0; i < scenes.length - 1; i++) {
    const cur = scenes[i]!
    const next = scenes[i + 1]!
    if (cur.end_ms !== next.start_ms) {
      const kind = cur.end_ms < next.start_ms ? 'Lücke' : 'Überlappung'
      issues.push({
        level: 'error',
        code: 'GAP_OR_OVERLAP',
        message: `${kind} zwischen ${cur.scene_id} (endet ${cur.end_ms}) und ${next.scene_id} (startet ${next.start_ms}).`,
      })
    }
  }

  // letzte Szene endet innerhalb max. eines Frames zur echten Audio-Dauer
  const lastEnd = scenes[scenes.length - 1]!.end_ms
  const endDrift = Math.abs(audio_duration_ms - lastEnd)
  if (endDrift > driftTolerance) {
    issues.push({
      level: 'error',
      code: 'END_DRIFT',
      message: `Endzeit weicht ${endDrift} ms von der Audio-Dauer ab (max. ${driftTolerance} ms = ${policy.maxEndDriftFrames} Frame(s)).`,
    })
  }

  // Drift der Summe
  const sum = scenes.reduce((acc, s) => acc + s.duration_ms, 0)
  if (Math.abs(sum - audio_duration_ms) > f) {
    issues.push({
      level: 'error',
      code: 'SUM_DRIFT',
      message: `Summe der Szenendauern (${sum}) weicht von der Audio-Dauer (${audio_duration_ms}) ab.`,
    })
  }

  // niedrige Alignment-Konfidenz → sichtbarer Fehler
  if (opts.alignmentMinConfidence !== undefined && opts.alignmentMinConfidence < threshold) {
    issues.push({
      level: 'error',
      code: 'LOW_CONFIDENCE',
      message: `Alignment-Konfidenz ${opts.alignmentMinConfidence} < Schwelle ${threshold}.`,
    })
  }

  return { ok: issues.every((i) => i.level !== 'error'), issues }
}
