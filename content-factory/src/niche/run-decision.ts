import { fileURLToPath } from 'node:url'
import { rankNiches } from './scoring.js'
import { decideChannel } from './decide.js'
import { demoFounder, demoScorecards, demoProfileHints } from './demo.js'

/**
 * CLI: fährt die Ebene-2-Nischenentscheidung auf dem Demo-Datensatz.
 * Zeigt Ranking (mit Verdict) + gewählten Kanal + Test-Plan-Kopf.
 */
export function runDecisionDemo() {
  const ranked = rankNiches(demoScorecards)
  const decision = decideChannel({
    founder: demoFounder,
    scorecards: demoScorecards,
    profileHints: demoProfileHints,
    decisionVersion: '1.0.0',
  })
  return { ranked, decision }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const { ranked, decision } = runDecisionDemo()
  console.log('=== Niche Ranking (gewichtet 1–5) ===')
  for (const r of ranked) {
    console.log(`${r.weighted_score.toFixed(2)}  ${r.verdict.padEnd(6)}  ${r.name}`)
  }
  console.log('\n=== Entscheidung ===')
  console.log(`Gewählt:   ${decision.chosen.name}  (${decision.verdict}, ${decision.weighted_score})`)
  console.log(`Rationale: ${decision.rationale}`)
  console.log(`Seed:      preset=${decision.channel_profile_seed.visual_preset}, lang=${decision.channel_profile_seed.output_language}, ${decision.channel_profile_seed.target_duration_sec}s @ ${decision.channel_profile_seed.target_wpm} wpm`)
  console.log(`Test-Plan: ${decision.first_10_plan.length} Videos, #1 = "${decision.first_10_plan[0]!.working_title}"`)
  console.log('\nKill/Pivot/Scale:')
  console.log('  KILL  :', decision.kill_pivot_scale.kill_if[0])
  console.log('  PIVOT :', decision.kill_pivot_scale.pivot_if[0])
  console.log('  SCALE :', decision.kill_pivot_scale.scale_if[0])
}
