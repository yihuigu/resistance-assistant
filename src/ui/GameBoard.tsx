import type { Approve, Player, Reject } from '../engine/types'
import './ui.css'

export interface RoundVoteRecord {
  round: number
  proposalNumber: number
  /** Per-player approve/reject, indexed by player index. */
  votes: (Approve | Reject)[]
}

export interface MissionResultRecord {
  round: number
  success: boolean
  failCount: number
}

export interface GameBoardProps {
  round: number
  proposalNumber: number
  players: Player[]
  /** Number of fail cards needed for the mission to fail. */
  requiredFailCount: number
  /** Expected team size for the round. */
  teamSize: number
  voteHistory: RoundVoteRecord[]
  missionResults: MissionResultRecord[]
}

const TOTAL_ROUNDS = 5

function voteLabel(vote: Approve | Reject): string {
  return vote === 'approve' ? 'Approve' : 'Reject'
}

export function GameBoard({
  round,
  proposalNumber,
  players,
  requiredFailCount,
  teamSize,
  voteHistory,
  missionResults,
}: GameBoardProps) {
  const resultFor = (roundNumber: number) =>
    missionResults.find((result) => result.round === roundNumber)

  return (
    <section className="game-board">
      <div className="game-board__header">
        <h2 className="game-board__title">Round {round} of {TOTAL_ROUNDS}</h2>
        <div className="game-board__meta">
          <span className="game-board__proposal">
            Proposal {proposalNumber}
          </span>
          <span className="game-board__threshold">
            Team of {teamSize}
          </span>
          {requiredFailCount > 1 && (
            <span className="game-board__threshold game-board__threshold--special">
              {requiredFailCount} fails required
            </span>
          )}
        </div>
      </div>

      <ol className="game-board__rounds">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => i + 1).map(
          (roundNumber) => {
            const result = resultFor(roundNumber)
            const stateClass = result
              ? result.success
                ? 'game-board__round--success'
                : 'game-board__round--fail'
              : roundNumber === round
                ? 'game-board__round--current'
                : ''
            return (
              <li
                key={roundNumber}
                className={`game-board__round ${stateClass}`.trim()}
              >
                <span className="game-board__round-number">
                  Round {roundNumber}
                </span>
                <span className="game-board__round-status">
                  {result
                    ? result.success
                      ? 'Success'
                      : `Fail (${result.failCount} fail card${result.failCount === 1 ? '' : 's'})`
                    : roundNumber === round
                      ? `In progress — Team of ${teamSize}`
                      : 'Pending'}
                </span>
              </li>
            )
          },
        )}
      </ol>

      <div className="game-board__section">
        <h3 className="game-board__section-title">Vote history</h3>
        {voteHistory.length === 0 ? (
          <p className="game-board__empty">No votes yet this game.</p>
        ) : (
          <ul className="game-board__votes">
            {voteHistory.map((record) => (
              <li
                key={`${record.round}-${record.proposalNumber}`}
                className="game-board__vote-row"
              >
                <span className="game-board__vote-label">
                  R{record.round} · Proposal {record.proposalNumber}
                </span>
                <ul className="game-board__vote-players">
                  {players.map((player) => {
                    const vote = record.votes[player.index]
                    return (
                      <li
                        key={player.index}
                        className={`game-board__vote-player ${
                          vote === 'approve'
                            ? 'game-board__vote-player--approve'
                            : 'game-board__vote-player--reject'
                        }`}
                        title={`${player.name}: ${vote ? voteLabel(vote) : 'No vote'}`}
                      >
                        {player.name}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="game-board__section">
        <h3 className="game-board__section-title">Mission results</h3>
        {missionResults.length === 0 ? (
          <p className="game-board__empty">No missions completed yet.</p>
        ) : (
          <ul className="game-board__results">
            {missionResults.map((result) => (
              <li
                key={result.round}
                className={`game-board__result ${
                  result.success
                    ? 'game-board__result--success'
                    : 'game-board__result--fail'
                }`}
              >
                <span className="game-board__result-round">
                  Round {result.round}
                </span>
                <span className="game-board__result-outcome">
                  {result.success ? 'Success' : 'Fail'} — {result.failCount}{' '}
                  fail card{result.failCount === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
