import { createHash } from 'node:crypto'

/**
 * Explizite Job-State-Machine (Master-Prompt): Retry, Timeout, Fehlergrund,
 * Attempt-Zähler, Input-/Output-Hash. Idempotent & wiederaufnehmbar.
 * Freigabe-Gates werden technisch erzwungen (keine falschen Erfolgszustände).
 */

export const STAGES = [
  'idea',
  'research',
  'brief',
  'script',
  'audio',
  'alignment',
  'timeline',
  'subtitles',
  'storyboard',
  'assets',
  'render',
  'qc',
  'packaging',
  'publish',
  'analytics',
] as const
export type Stage = (typeof STAGES)[number]

export type JobStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'blocked'

export const GATES = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'] as const
export type Gate = (typeof GATES)[number]

/** Welches Gate muss VOR einer Stufe freigegeben sein (kostenpflichtige/riskante Schritte). */
export const STAGE_REQUIRES_GATE: Partial<Record<Stage, Gate>> = {
  assets: 'G5', // Storyboard + Kostenplan vor Batch-Generierung
  render: 'G6', // Preview/QC vor Final
  publish: 'G7', // Titel/Thumbnail/Metadaten vor Veröffentlichung
}

/** Rekursiv stabile Serialisierung (Keys sortiert) — deterministisch für Hashing. */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null'
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']'
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

export function stableHash(input: unknown): string {
  return createHash('sha256').update(stableStringify(input)).digest('hex').slice(0, 16)
}

export interface GateApproval {
  gate: Gate
  approved: boolean
  actor: string
  at: string
  artifact_version: string
  comment?: string
}

export interface StageRecord {
  stage: Stage
  status: JobStatus
  attempt: number
  max_attempts: number
  input_hash?: string
  output_hash?: string
  error?: string
}

export class JobStateMachine {
  readonly video_id: string
  private stages = new Map<Stage, StageRecord>()
  private gates = new Map<Gate, GateApproval>()

  constructor(video_id: string, maxAttempts = 3) {
    this.video_id = video_id
    for (const s of STAGES) {
      this.stages.set(s, { stage: s, status: 'pending', attempt: 0, max_attempts: maxAttempts })
    }
  }

  record(stage: Stage): StageRecord {
    return this.stages.get(stage)!
  }

  approveGate(g: GateApproval): void {
    this.gates.set(g.gate, g)
  }

  isGateApproved(gate: Gate): boolean {
    return this.gates.get(gate)?.approved === true
  }

  /** Wirft, wenn das erforderliche Gate fehlt — technische Durchsetzung. */
  assertGate(stage: Stage): void {
    const required = STAGE_REQUIRES_GATE[stage]
    if (required && !this.isGateApproved(required)) {
      throw new Error(
        `Stufe "${stage}" blockiert: Gate ${required} nicht freigegeben (Human-in-the-loop).`,
      )
    }
  }

  start(stage: Stage, inputHash?: string): StageRecord {
    this.assertGate(stage)
    const r = this.record(stage)
    r.status = 'running'
    r.attempt += 1
    r.input_hash = inputHash
    r.error = undefined
    return r
  }

  succeed(stage: Stage, outputHash?: string): StageRecord {
    const r = this.record(stage)
    r.status = 'succeeded'
    r.output_hash = outputHash
    return r
  }

  fail(stage: Stage, error: string): StageRecord {
    const r = this.record(stage)
    r.status = r.attempt >= r.max_attempts ? 'failed' : 'pending'
    r.error = error
    return r
  }

  canRetry(stage: Stage): boolean {
    const r = this.record(stage)
    return r.status !== 'succeeded' && r.attempt < r.max_attempts
  }

  /** Resume: bereits erfolgreiche Stufe mit gleichem Input-Hash NICHT erneut ausführen. */
  shouldSkip(stage: Stage, inputHash: string): boolean {
    const r = this.record(stage)
    return r.status === 'succeeded' && r.input_hash === inputHash
  }

  snapshot(): { video_id: string; stages: StageRecord[]; gates: GateApproval[] } {
    return {
      video_id: this.video_id,
      stages: [...this.stages.values()].map((r) => ({ ...r })),
      gates: [...this.gates.values()].map((g) => ({ ...g })),
    }
  }
}
