export interface Player {
  index: number
  name: string
}

export interface SetupEvent {
  type: 'setup'
  playerNames: string[]
}

export interface TeamProposedEvent {
  type: 'teamProposed'
  round: number
  proposalNumber: number
  leaderIndex: number
  teamPlayerIndices: number[]
}

export interface VoteEvent {
  type: 'vote'
  round: number
  proposalNumber: number
  /** Per-player approve/reject, indexed by player index. */
  votes: (Approve | Reject)[]
}

export interface MissionResultEvent {
  type: 'missionResult'
  round: number
  teamPlayerIndices: number[]
  /** Number of fail cards played by the team. */
  failCount: number
}

export interface SettingsEvent {
  type: 'settings'
  spyFailProbability: number
  voteWeight: number
}

export type Approve = 'approve'
export type Reject = 'reject'

export type GameEvent =
  | SetupEvent
  | TeamProposedEvent
  | VoteEvent
  | MissionResultEvent
  | SettingsEvent

/** Spy counts per player count, and mission fail thresholds per round (1-indexed). */
export interface Variant {
  /** Maps player count (5-10) to the number of spies in that game. */
  spyCounts: Record<number, number>
  /**
   * Maps player count (5-10) to the number of fail cards required for each
   * mission to fail, indexed by round - 1 (length 5).
   */
  missionFailThresholds: Record<number, number[]>
}

export interface EngineConfig {
  /** Probability that a spy on a mission team plays a fail card. */
  spyFailProbability: number
  /** Multiplier applied to vote evidence (0 = votes have no effect). */
  voteWeight: number
  /** Rules tables keyed by variant name. */
  variants: Record<string, Variant>
  /** Name of the active variant in `variants`. */
  activeVariant: string
}

export interface ProbabilityResult {
  /** Posterior probability of being a spy, indexed by player index. */
  spyProbabilities: number[]
  /** Posterior probability of each enumerated spy assignment (internal). */
  assignmentPosteriors: number[]
  /** The assignments corresponding to `assignmentPosteriors`. */
  assignments: number[][]
}
