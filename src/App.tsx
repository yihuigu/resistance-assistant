import { useEffect, useMemo, useState } from 'react'
import {
  defaultConfig,
  getActiveVariant,
  getRequiredFailCards,
  getTeamSize,
} from './engine/config'
import { infer } from './engine/infer'
import type {
  Approve,
  EngineConfig,
  GameEvent,
  MissionResultEvent,
  Player,
  Reject,
  SetupEvent,
  TeamProposedEvent,
  VoteEvent,
} from './engine/types'
import { EventLog } from './ui/EventLog'
import { GameBoard } from './ui/GameBoard'
import type { MissionResultRecord, RoundVoteRecord } from './ui/GameBoard'
import { PlayerCard } from './ui/PlayerCard'
import { SettingsPanel } from './ui/SettingsPanel'
import { SetupScreen } from './ui/SetupScreen'
import './ui/ui.css'

const TOTAL_ROUNDS = 5
const STORAGE_KEY = 'resistance-assistant-state'

interface AppSettings {
  spyFailProbability: number
  voteWeight: number
}

const defaultSettings: AppSettings = {
  spyFailProbability: defaultConfig.spyFailProbability,
  voteWeight: defaultConfig.voteWeight,
}

const EVENT_TYPES = new Set([
  'setup',
  'teamProposed',
  'vote',
  'missionResult',
  'settings',
])

function isValidEvent(event: unknown): event is GameEvent {
  if (typeof event !== 'object' || event === null) return false
  const candidate = event as Record<string, unknown>
  if (typeof candidate.type !== 'string' || !EVENT_TYPES.has(candidate.type)) {
    return false
  }
  if (candidate.type === 'setup') {
    return (
      Array.isArray(candidate.playerNames) &&
      candidate.playerNames.every((name) => typeof name === 'string')
    )
  }
  return true
}

function isValidSettings(settings: unknown): settings is AppSettings {
  if (typeof settings !== 'object' || settings === null) return false
  const candidate = settings as Record<string, unknown>
  return (
    typeof candidate.spyFailProbability === 'number' &&
    Number.isFinite(candidate.spyFailProbability) &&
    typeof candidate.voteWeight === 'number' &&
    Number.isFinite(candidate.voteWeight)
  )
}

function loadPersistedState(): { events: GameEvent[]; settings: AppSettings } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { events: [], settings: defaultSettings }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { events: [], settings: defaultSettings }
    }
    const candidate = parsed as Record<string, unknown>
    if (
      Array.isArray(candidate.events) &&
      candidate.events.every(isValidEvent) &&
      isValidSettings(candidate.settings)
    ) {
      return {
        events: candidate.events as GameEvent[],
        settings: candidate.settings,
      }
    }
    return { events: [], settings: defaultSettings }
  } catch {
    return { events: [], settings: defaultSettings }
  }
}

type Phase = 'proposal' | 'vote' | 'result'

interface ProposalFormProps {
  players: Player[]
  round: number
  proposalNumber: number
  teamSize: number
  onPropose: (leaderIndex: number, teamPlayerIndices: number[]) => void
}

function ProposalForm({
  players,
  round,
  proposalNumber,
  teamSize,
  onPropose,
}: ProposalFormProps) {
  const [leaderIndex, setLeaderIndex] = useState(players[0]?.index ?? 0)
  const [team, setTeam] = useState<number[]>(players[0] ? [players[0].index] : [])

  const toggleMember = (index: number) =>
    setTeam((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )

  const canConfirm = team.length === teamSize

  const propose = () => {
    if (canConfirm) {
      onPropose(leaderIndex, team)
    }
  }

  return (
    <section className="game-board" style={{ marginTop: '1rem' }}>
      <div className="game-board__section">
        <h3 className="game-board__section-title">
          Round {round} · Proposal {proposalNumber} — select {teamSize}{' '}
          member{teamSize === 1 ? '' : 's'}
        </h3>
        <div className="settings-panel__row">
          <label
            className="settings-panel__label"
            htmlFor="flow-leader-select"
          >
            Leader
          </label>
          <select
            id="flow-leader-select"
            className="setup-screen__input"
            value={leaderIndex}
            onChange={(event) => setLeaderIndex(Number(event.target.value))}
          >
            {players.map((player) => (
              <option key={player.index} value={player.index}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
        <ul className="setup-screen__players">
          {players.map((player) => (
            <li key={player.index} className="setup-screen__player-row">
              <label className="event-log__text">
                <input
                  type="checkbox"
                  checked={team.includes(player.index)}
                  onChange={() => toggleMember(player.index)}
                />{' '}
                {player.name}
              </label>
            </li>
          ))}
        </ul>
        <div className="setup-screen__actions">
          <button
            className="setup-screen__start"
            type="button"
            onClick={propose}
            disabled={!canConfirm}
          >
            Record proposal ({team.length}/{teamSize} on team)
          </button>
        </div>
      </div>
    </section>
  )
}

interface VoteFormProps {
  players: Player[]
  round: number
  proposalNumber: number
  onVote: (votes: (Approve | Reject)[]) => void
}

function VoteForm({ players, round, proposalNumber, onVote }: VoteFormProps) {
  const [votes, setVotes] = useState<(Approve | Reject)[]>(() =>
    players.map(() => 'approve'),
  )

  const toggleVote = (index: number) =>
    setVotes((prev) =>
      prev.map((vote, i) =>
        i === index ? (vote === 'approve' ? 'reject' : 'approve') : vote,
      ),
    )

  return (
    <section className="game-board" style={{ marginTop: '1rem' }}>
      <div className="game-board__section">
        <h3 className="game-board__section-title">
          Round {round} · Proposal {proposalNumber} — record votes
        </h3>
        <ul className="setup-screen__players">
          {players.map((player) => (
            <li key={player.index} className="setup-screen__player-row">
              <span className="event-log__text">{player.name}</span>
              <button
                className={`setup-screen__remove ${
                  votes[player.index] === 'approve'
                    ? 'game-board__vote-player--approve'
                    : 'game-board__vote-player--reject'
                }`}
                type="button"
                onClick={() => toggleVote(player.index)}
              >
                {votes[player.index] === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </li>
          ))}
        </ul>
        <div className="setup-screen__actions">
          <button
            className="setup-screen__start"
            type="button"
            onClick={() => onVote(votes)}
          >
            Record vote
          </button>
        </div>
      </div>
    </section>
  )
}

interface ResultFormProps {
  players: Player[]
  round: number
  teamPlayerIndices: number[]
  requiredFailCount: number
  onResult: (failCount: number) => void
}

function ResultForm({
  players,
  round,
  teamPlayerIndices,
  requiredFailCount,
  onResult,
}: ResultFormProps) {
  const [failCount, setFailCount] = useState(0)
  const success = failCount < requiredFailCount
  const teamNames = teamPlayerIndices.map((index) => players[index]?.name ?? '?')

  return (
    <section className="game-board" style={{ marginTop: '1rem' }}>
      <div className="game-board__section">
        <h3 className="game-board__section-title">
          Round {round} — record mission result
        </h3>
        <p className="game-board__empty">
          Team: {teamNames.join(', ')} — {requiredFailCount} fail
          {requiredFailCount === 1 ? '' : 's'} to fail.
        </p>
        <div className="settings-panel__row">
          <label className="settings-panel__label" htmlFor="flow-fail-count">
            Fail cards
          </label>
          <select
            id="flow-fail-count"
            className="setup-screen__input"
            value={failCount}
            onChange={(event) => setFailCount(Number(event.target.value))}
          >
            {Array.from({ length: teamPlayerIndices.length + 1 }, (_, i) => i).map(
              (count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ),
            )}
          </select>
          <span className="settings-panel__value">
            {success ? 'Success' : `Fail (${failCount})`}
          </span>
        </div>
        <div className="setup-screen__actions">
          <button
            className="setup-screen__start"
            type="button"
            onClick={() => onResult(failCount)}
          >
            Record result
          </button>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [initialState] = useState(loadPersistedState)
  const [events, setEvents] = useState<GameEvent[]>(initialState.events)
  const [settings, setSettings] = useState<AppSettings>(initialState.settings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ events, settings }))
    } catch {
      // Storage may be unavailable (private mode); the app works without it.
    }
  }, [events, settings])

  const config: EngineConfig = useMemo(
    () => ({
      ...defaultConfig,
      spyFailProbability: settings.spyFailProbability,
      voteWeight: settings.voteWeight,
      activeVariant: 'base',
    }),
    [settings],
  )

  const variant = useMemo(() => getActiveVariant(config), [config])

  const setupEvent = useMemo(
    () => events.find((event): event is SetupEvent => event.type === 'setup'),
    [events],
  )

  const players: Player[] = useMemo(
    () =>
      setupEvent
        ? setupEvent.playerNames.map((name, index) => ({ index, name }))
        : [],
    [setupEvent],
  )

  const posterior = useMemo(() => {
    if (!setupEvent) return null
    try {
      return infer(events, config)
    } catch {
      return null
    }
  }, [events, config, setupEvent])

  const teamProposedEvents = useMemo(
    () =>
      events.filter((event): event is TeamProposedEvent => event.type === 'teamProposed'),
    [events],
  )

  const missionResultEvents = useMemo(
    () =>
      events.filter((event): event is MissionResultEvent => event.type === 'missionResult'),
    [events],
  )

  const voteHistory: RoundVoteRecord[] = useMemo(
    () =>
      events
        .filter((event): event is VoteEvent => event.type === 'vote')
        .map(({ round, proposalNumber, votes }) => ({ round, proposalNumber, votes })),
    [events],
  )

  const missionResults: MissionResultRecord[] = useMemo(
    () =>
      missionResultEvents.map((event) => ({
        round: event.round,
        success:
          event.failCount < getRequiredFailCards(variant, players.length, event.round),
        failCount: event.failCount,
      })),
    [missionResultEvents, variant, players.length],
  )

  const currentRound = Math.min(missionResultEvents.length + 1, TOTAL_ROUNDS)
  const gameOver = missionResultEvents.length >= TOTAL_ROUNDS

  const requiredFailCount = useMemo(
    () => getRequiredFailCards(variant, players.length, currentRound),
    [variant, players.length, currentRound],
  )

  const teamSize = useMemo(
    () => getTeamSize(variant, players.length, currentRound),
    [variant, players.length, currentRound],
  )

  const lastEvent = events[events.length - 1]
  const phase: Phase = useMemo(() => {
    if (lastEvent && lastEvent.type === 'teamProposed') return 'vote'
    if (lastEvent && lastEvent.type === 'vote') {
      const proposal = teamProposedEvents.find(
        (event) =>
          event.round === lastEvent.round &&
          event.proposalNumber === lastEvent.proposalNumber,
      )
      const approves = lastEvent.votes.filter((vote) => vote === 'approve').length
      const majority = approves * 2 > lastEvent.votes.length
      return proposal && majority ? 'result' : 'proposal'
    }
    return 'proposal'
  }, [lastEvent, teamProposedEvents])

  const proposalNumber =
    phase === 'proposal' || teamProposedEvents.length === 0
      ? teamProposedEvents.length + 1
      : teamProposedEvents[teamProposedEvents.length - 1].proposalNumber

  const sortedPlayers = useMemo(() => {
    return players
      .map((player) => ({
        ...player,
        spyProbability: posterior ? posterior.spyProbabilities[player.index] : 0,
      }))
      .sort((a, b) => b.spyProbability - a.spyProbability)
  }, [players, posterior])

  const startGame = (playerNames: string[]) => {
    setEvents([{ type: 'setup', playerNames }])
    setSettings(defaultSettings)
  }

  const pushEvent = (event: GameEvent) => setEvents((prev) => [...prev, event])

  const undo = () => setEvents((prev) => prev.slice(0, -1))

  const updateSettings = (next: AppSettings) => setSettings(next)

  const resetGame = () => {
    setEvents([])
    setSettings(defaultSettings)
  }

  if (!setupEvent) {
    return (
      <main className="setup-screen">
        <h1 className="setup-screen__title">Resistance Assistant</h1>
        <SetupScreen onStart={startGame} />
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem' }}>
      <h1 className="setup-screen__title">Resistance Assistant</h1>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', alignItems: 'start' }}>
        <div>
          <GameBoard
            round={currentRound}
            proposalNumber={proposalNumber}
            players={players}
            requiredFailCount={requiredFailCount}
            teamSize={teamSize}
            voteHistory={voteHistory}
            missionResults={missionResults}
          />
          {gameOver ? (
            <section className="game-board" style={{ marginTop: '1rem' }}>
              <div className="game-board__section">
                <h3 className="game-board__section-title">Game over</h3>
                <p className="game-board__empty">
                  All 5 missions played. Use "New game" to start over.
                </p>
              </div>
            </section>
          ) : phase === 'proposal' ? (
            <ProposalForm
              key={`${currentRound}-proposal-${proposalNumber}`}
              players={players}
              round={currentRound}
              proposalNumber={proposalNumber}
              teamSize={teamSize}
              onPropose={(leaderIndex, teamPlayerIndices) =>
                pushEvent({
                  type: 'teamProposed',
                  round: currentRound,
                  proposalNumber,
                  leaderIndex,
                  teamPlayerIndices,
                })
              }
            />
          ) : phase === 'vote' ? (
            <VoteForm
              key={`${currentRound}-vote-${proposalNumber}`}
              players={players}
              round={currentRound}
              proposalNumber={proposalNumber}
              onVote={(votes) =>
                pushEvent({
                  type: 'vote',
                  round: currentRound,
                  proposalNumber,
                  votes,
                })
              }
            />
          ) : (
            <ResultForm
              key={`${currentRound}-result-${proposalNumber}`}
              players={players}
              round={currentRound}
              teamPlayerIndices={
                teamProposedEvents[teamProposedEvents.length - 1].teamPlayerIndices
              }
              requiredFailCount={requiredFailCount}
              onResult={(failCount) =>
                pushEvent({
                  type: 'missionResult',
                  round: currentRound,
                  teamPlayerIndices:
                    teamProposedEvents[teamProposedEvents.length - 1].teamPlayerIndices,
                  failCount,
                })
              }
            />
          )}
        </div>
        <div>
          {sortedPlayers.map((player) => (
            <PlayerCard
              key={player.index}
              name={player.name}
              spyProbability={player.spyProbability}
            />
          ))}
        </div>
        <div>
          <EventLog events={events} onUndo={undo} />
          <SettingsPanel
            spyFailProbability={settings.spyFailProbability}
            voteWeight={settings.voteWeight}
            onChange={updateSettings}
            onReset={resetGame}
          />
        </div>
      </div>
    </main>
  )
}
