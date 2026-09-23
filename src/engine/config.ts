import type { EngineConfig, Variant } from './types'

/**
 * Standard Resistance rules table for 5-10 players.
 *
 * Mission fail thresholds per round (1-indexed rounds 1-5):
 * - 5p:  [2, 3, 2, 3, 3]
 * - 6p:  [2, 3, 4, 3, 3]
 * - 7p:  [2, 3, 3, 4, 3]  (4th mission requires only 2 fails)
 * - 8p:  [2, 4, 3, 4, 3]  (4th mission requires only 2 fails)
 * - 9p:  [2, 4, 3, 4, 3]  (4th mission requires only 2 fails)
 * - 10p: [2, 4, 3, 4, 3]  (4th mission requires only 2 fails)
 */
const base: Variant = {
  spyCounts: { 5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 4 },
  missionFailThresholds: {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 3],
    7: [2, 3, 3, 4, 3],
    8: [2, 4, 3, 4, 3],
    9: [2, 4, 3, 4, 3],
    10: [2, 4, 3, 4, 3],
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

export function getMissionFailThreshold(
  variant: Variant,
  playerCount: number,
  round: number,
): number {
  const thresholds = variant.missionFailThresholds[playerCount]
  if (!thresholds || round < 1 || round > thresholds.length) {
    throw new Error(
      `No mission fail threshold defined for ${playerCount} players, round ${round}`,
    )
  }
  return thresholds[round - 1]
}
