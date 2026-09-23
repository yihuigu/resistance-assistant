import { getSpyCount } from './config'
import type { Variant } from './types'

/**
 * Enumerate all possible spy assignments: every k-subset of player indices
 * [0..playerCount-1], where k is the spy count for that player count.
 */
export function enumerateSpyAssignments(
  playerCount: number,
  variant: Variant,
): number[][] {
  const k = getSpyCount(variant, playerCount)
  const assignments: number[][] = []
  const current: number[] = []

  function backtrack(start: number): void {
    if (current.length === k) {
      assignments.push([...current])
      return
    }
    for (let i = start; i < playerCount; i++) {
      current.push(i)
      backtrack(i + 1)
      current.pop()
    }
  }

  backtrack(0)
  return assignments
}
