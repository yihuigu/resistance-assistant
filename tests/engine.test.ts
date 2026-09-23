import { describe, expect, it } from 'vitest'
import { infer } from '../src/engine/infer'
import { enumerateSpyAssignments } from '../src/engine/enumerate'
import { defaultConfig } from '../src/engine/config'
import type { GameEvent } from '../src/engine/types'

function setup(playerCount: number): GameEvent {
  return {
    type: 'setup',
    playerNames: Array.from({ length: playerCount }, (_, i) => `Player ${i + 1}`),
  }
}

describe('infer', () => {
  it('returns uniform priors when there are no gameplay events', () => {
    const result = infer([setup(5)], defaultConfig)
    expect(result.spyProbabilities).toHaveLength(5)
    for (const p of result.spyProbabilities) {
      expect(p).toBeCloseTo(2 / 5, 12)
    }
    expect(result.assignmentPosteriors).toHaveLength(10)
    for (const p of result.assignmentPosteriors) {
      expect(p).toBeCloseTo(1 / 10, 12)
    }
  })

  it('a failed 3-player mission with p=1 raises exactly those players posteriors', () => {
    const config = { ...defaultConfig, spyFailProbability: 1 }
    const events: GameEvent[] = [
      setup(5),
      { type: 'missionResult', round: 1, teamPlayerIndices: [0, 1, 2], failCount: 2 },
    ]
    const result = infer(events, config)
    // With p=1, posterior concentrates on assignments with exactly 2 of the 3
    // team members being spies: the three team players share 2/3 each.
    for (const i of [0, 1, 2]) {
      expect(result.spyProbabilities[i]).toBeCloseTo(2 / 3, 12)
    }
    for (const i of [3, 4]) {
      expect(result.spyProbabilities[i]).toBe(0)
    }
  })

  it('vote weight 0 leaves posteriors unchanged after votes', () => {
    const config = { ...defaultConfig, voteWeight: 0 }
    const before = infer([setup(5)], config)
    const after = infer(
      [
        setup(5),
        {
          type: 'vote',
          round: 1,
          proposalNumber: 1,
          votes: ['reject', 'reject', 'approve', 'approve', 'approve'],
        },
      ],
      config,
    )
    expect(after.spyProbabilities).toEqual(before.spyProbabilities)
  })

  it('undo (removing the last event) restores the previous posterior exactly', () => {
    const events: GameEvent[] = [
      setup(5),
      {
        type: 'vote',
        round: 1,
        proposalNumber: 1,
        votes: ['approve', 'reject', 'approve', 'approve', 'reject'],
      },
      { type: 'missionResult', round: 1, teamPlayerIndices: [0, 1], failCount: 1 },
      {
        type: 'vote',
        round: 2,
        proposalNumber: 1,
        votes: ['approve', 'approve', 'reject', 'approve', 'approve'],
      },
    ]
    const withUndo = infer(events.slice(0, -1), defaultConfig)
    const previous = infer(
      [events[0], events[1], events[2]],
      defaultConfig,
    )
    expect(withUndo.spyProbabilities).toEqual(previous.spyProbabilities)
    expect(withUndo.assignmentPosteriors).toEqual(previous.assignmentPosteriors)
  })

  it('setup event with fewer than 5 or more than 10 players throws', () => {
    expect(() => infer([setup(4)], defaultConfig)).toThrow()
    expect(() => infer([setup(11)], defaultConfig)).toThrow()
  })
})

describe('enumerate', () => {
  it('enumeration counts match C(n,k) for n=5..10', () => {
    const expected: Record<number, number> = { 5: 10, 6: 15, 7: 35, 8: 56, 9: 84, 10: 210 }
    for (const n of [5, 6, 7, 8, 9, 10]) {
      const assignments = enumerateSpyAssignments(n, defaultConfig.variants.base)
      expect(assignments).toHaveLength(expected[n])
      // All assignments are unique k-subsets.
      const unique = new Set(assignments.map((a) => a.join(',')))
      expect(unique.size).toBe(expected[n])
      for (const a of assignments) {
        expect(a).toHaveLength(defaultConfig.variants.base.spyCounts[n])
      }
    }
  })
})
