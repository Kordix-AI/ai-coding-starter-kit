import { describe, it, expect } from 'vitest'
import { JobStateMachine } from '../src/state/machine.js'

describe('JobStateMachine — Gates technisch erzwungen', () => {
  it('blockiert assets ohne G5-Freigabe', () => {
    const j = new JobStateMachine('v1')
    expect(() => j.start('assets')).toThrow(/G5/)
  })

  it('lässt assets nach G5-Freigabe zu', () => {
    const j = new JobStateMachine('v1')
    j.approveGate({
      gate: 'G5',
      approved: true,
      actor: 'user:stefan',
      at: '2026-07-21T00:00:00Z',
      artifact_version: '1',
    })
    expect(() => j.start('assets')).not.toThrow()
    expect(j.record('assets').status).toBe('running')
  })

  it('blockiert publish ohne G7', () => {
    const j = new JobStateMachine('v1')
    expect(() => j.start('publish')).toThrow(/G7/)
  })
})

describe('JobStateMachine — Retry & Resume', () => {
  it('erschöpft Retries erst nach max_attempts', () => {
    const j = new JobStateMachine('v1', 3)
    j.start('research', 'h1')
    j.fail('research', 'boom')
    expect(j.record('research').status).toBe('pending')
    expect(j.canRetry('research')).toBe(true)
    j.start('research', 'h1')
    j.fail('research', 'boom')
    j.start('research', 'h1')
    j.fail('research', 'boom')
    expect(j.record('research').attempt).toBe(3)
    expect(j.record('research').status).toBe('failed')
    expect(j.canRetry('research')).toBe(false)
  })

  it('überspringt erfolgreiche Stufe bei gleichem Input-Hash (idempotent)', () => {
    const j = new JobStateMachine('v1')
    j.start('script', 'hA')
    j.succeed('script', 'out')
    expect(j.shouldSkip('script', 'hA')).toBe(true)
    expect(j.shouldSkip('script', 'hB')).toBe(false)
  })
})
