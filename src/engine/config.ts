import type { EngineConfig, Variant } from './types'

/**
 * Standard Resistance rules table for 5-10 players.
 *
 * Spies per player count:
 * - 5p: 2, 6p: 2, 7p: 3, 8p: 3, 9p: 3, 10p: 4
 *
 * Mission team sizes per round (1-indexed rounds 1-5):
 * - 5p:  [2, 3, 2, 3, 3]
 * - 6p:  [2, 3, 4, 3, 4]
 * - 7p:  [2, 3, 3, 4, 4]
 * - 8p:  [3, 4, 4, 5, 5]
 * - 9p:  [3, 4, 4, 5, 5]
 * - 10p: [3, 4, 4, 5, 5]
 *
 * Fail cards required for a mission to fail: 1 for every mission, except
 * round 4 in games of 7+ players, which requires 2:
 * - 5-6p: [1, 1, 1, 1, 1]
 * - 7-10p: [1, 1, 1, 2, 1]
 */
const base: Variant = {
  spyCounts: { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 },
  teamSizes: {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  },
  requiredFailCards: {
    5: [1, 1, 1, 1, 1],
    6: [1, 1, 1, 1, 1],
    7: [1, 1, 1, 2, 1],
    8: [1, 1, 1, 2, 1],
    9: [1, 1, 1, 2, 1],
    10: [1, 1, 1, 2, 1],
  },
}

/**
 * Variant registry. `base` is the standard game; future variants (e.g. Avalon)
 * can be added here as data-only entries without touching the engine.
 */
const variants: Record<string, Variant> = {
  base,
  // Future variants hook: add named Variant entries here.
}

export const defaultConfig: EngineConfig = {
  spyFailProbability: 0.85,
  voteWeight: 0.3,
  variants,
  activeVariant: 'base',
}

export function getActiveVariant(config: EngineConfig): Variant {
  const variant = config.variants[config.activeVariant]
  if (!variant) {
    throw new Error(`Unknown variant: ${config.activeVariant}`)
  }
  return variant
}

export function getSpyCount(variant: Variant, playerCount: number): number {
  const count = variant.spyCounts[playerCount]
  if (count === undefined) {
    throw new Error(`No spy count defined for ${playerCount} players`)
  }
  return count
}

export function getTeamSize(
  variant: Variant,
  playerCount: number,
  round: number,
): number {
  const sizes = variant.teamSizes[playerCount]
  if (!sizes || round < 1 || round > sizes.length) {
    throw new Error(
      `No team size defined for ${playerCount} players, round ${round}`,
    )
  }
  return sizes[round - 1]
}

export function getRequiredFailCards(
  variant: Variant,
  playerCount: number,
  round: number,
): number {
  const required = variant.requiredFailCards[playerCount]
  if (!required || round < 1 || round > required.length) {
    throw new Error(
      `No required fail cards defined for ${playerCount} players, round ${round}`,
    )
  }
  return required[round - 1]
}

