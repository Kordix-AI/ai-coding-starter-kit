/**
 * Messbare Schwellen — macht QC- und Budget-Gates objektiv durchsetzbar
 * (statt „niedrige Konfidenz" ohne Zahl). Werte sind Defaults; ein Channel
 * Profile / Video Manifest darf sie überschreiben.
 */

export interface QcPolicy {
  /** Alignment-Konfidenz darunter → QC-Fehler (keine stille Freigabe). */
  minAlignmentConfidence: number
  /** erlaubte Endzeit-Drift in Frames (Master-Prompt: max. 1 Frame). */
  maxEndDriftFrames: number
  /** Anteil fehlender/abweichender Wörter im Alignment, der noch toleriert wird. */
  maxWordDropRatio: number
  /** Pause länger als das → Warnung (mögliches Audio-Artefakt / abgeschnittenes Ende). */
  longPauseWarnMs: number
}

export const DEFAULT_QC_POLICY: QcPolicy = {
  minAlignmentConfidence: 0.6,
  maxEndDriftFrames: 1,
  maxWordDropRatio: 0.02,
  longPauseWarnMs: 1500,
}

export interface BudgetPolicy {
  /** harte Obergrenze je Video (USD). Überschreitung → Hard Stop, keine Auto-Generierung. */
  maxUsdPerVideo: number
  /** Warnschwelle als Anteil des Budgets (z. B. 0.8 = bei 80 % warnen). */
  warnRatio: number
  /** maximale automatische Asset-Neugenerierungen ohne erneute Freigabe. */
  maxAssetRegens: number
  /** ob Budgetüberschreitung die Pipeline hart stoppt. */
  hardStop: boolean
}

export const DEFAULT_BUDGET_POLICY: BudgetPolicy = {
  maxUsdPerVideo: 8,
  warnRatio: 0.8,
  maxAssetRegens: 2,
  hardStop: true,
}

/** Quellenqualität für Claims (Master-Prompt: riskante Nischen = strengere Regeln). */
export const CLAIM_TRUST_LEVELS = ['primary', 'secondary', 'weak', 'unverified'] as const
export type ClaimTrustLevel = (typeof CLAIM_TRUST_LEVELS)[number]
