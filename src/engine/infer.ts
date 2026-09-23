import { enumerateSpyAssignments } from './enumerate'
import { getActiveVariant } from './config'
import type {
  EngineConfig,
  GameEvent,
  MissionResultEvent,
  ProbabilityResult,
  VoteEvent,
} from './types'

/**
 * Likelihood model (heuristic, user-tunable):
 *
 * MissionResult: each spy on the team plays a fail card independently with
 * probability p (config.spyFailProbability); Resistance members always pass.
 * Given an assignment, the team composition determines how many spies are on
 * the team (s), and the probability of observing exactly `failCount` fails is
 * the binomial term C(s, failCount) * p^failCount * (1-p)^(s-failCount).
 * Assignments for which the observation is impossible (more fails observed
 * than there are spies on the team) get likelihood 0; the fold falls back to
 * a uniform posterior if every assignment is ruled out by inconsistent data.
 * The combinatorial weighting across assignments arises naturally from the
 * uniform prior over all C(n, k) assignments, so the fold is an exact
 * Bayesian enumeration.
 *
 * VoteEvent: treated as weak evidence. Spies are slightly more likely to
 * reject than approve (they want missions to fail), so each "reject" vote
 * contributes a small factor against the voter being a spy and each "approve"
 * vote a small factor in favor. The factors are raised to a power scaled by
 * config.voteWeight (0 = votes have no effect), keeping the model simple and
 * tunable.
 */

const MIN_PLAYERS = 5
const MAX_PLAYERS = 10

function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return result
}

function missionLikelihood(
  event: MissionResultEvent,
  assignment: ReadonlySet<number>,
  config: EngineConfig,
): number {
  const spiesOnTeam = event.teamPlayerIndices.filter((p) => assignment.has(p)).length
  const p = config.spyFailProbability
  const k = event.failCount
  if (k > spiesOnTeam) return 0
  return (
    binomialCoefficient(spiesOnTeam, k) *
    Math.pow(p, k) *
    Math.pow(1 - p, spiesOnTeam - k)
  )
}

function voteLikelihood(
  event: VoteEvent,
  assignment: ReadonlySet<number>,
  config: EngineConfig,
): number {
  const w = config.voteWeight
  if (w <= 0) return 1

  let likelihood = 1
  event.votes.forEach((vote, playerIndex) => {
    const isSpy = assignment.has(playerIndex)
    // Spies are slightly more likely to reject than approve.
    const factor = vote === 'reject' ? (isSpy ? 0.6 : 1.1) : isSpy ? 1.1 : 0.9
    // Scale the effect by voteWeight: w = 1 gives the raw factor, w = 0
    // neutralizes the evidence entirely.
    likelihood *= Math.pow(factor, Math.min(w, 2))
  })
  return likelihood
}

export function infer(events: GameEvent[], config: EngineConfig): ProbabilityResult {
  const variant = getActiveVariant(config)

  const setup = events.find((e) => e.type === 'setup')
  if (!setup) {
    throw new Error('Cannot infer without a setup event')
  }
  const playerCount = setup.playerNames.length
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(
      `Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}, got ${playerCount}`,
    )
  }

  const assignments = enumerateSpyAssignments(playerCount, variant)
  const weights = assignments.map(() => 1)

  for (const event of events) {
    if (event.type === 'setup' || event.type === 'settings' || event.type === 'teamProposed') {
      // Setup carries the player count; settings and team proposals carry no
      // direct evidence in the base model.
      continue
    }
    assignments.forEach((assignment, i) => {
      const assignmentSet = new Set(assignment)
      if (event.type === 'missionResult') {
        weights[i] *= missionLikelihood(event, assignmentSet, config)
      } else if (event.type === 'vote') {
        weights[i] *= voteLikelihood(event, assignmentSet, config)
      }
    })
  }

  const total = weights.reduce((a, b) => a + b, 0)
  const posteriors =
    total > 0 ? weights.map((w) => w / total) : weights.map(() => 1 / weights.length)

  const spyProbabilities = new Array<number>(playerCount).fill(0)
  assignments.forEach((assignment, i) => {
    assignment.forEach((playerIndex) => {
      spyProbabilities[playerIndex] += posteriors[i]
    })
  })

  return {
    spyProbabilities,
    assignmentPosteriors: posteriors,
    assignments,
  }
}
