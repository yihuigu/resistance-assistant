import type { GameEvent } from '../engine/types'
import './ui.css'

export interface EventLogProps {
  events: GameEvent[]
  onUndo: () => void
}

function describeEvent(event: GameEvent): string {
  switch (event.type) {
    case 'setup':
      return `Game started with ${event.playerNames.length} players: ${event.playerNames.join(', ')}`
    case 'teamProposed':
      return `Round ${event.round}, proposal ${event.proposalNumber}: leader ${event.leaderIndex + 1} proposed team [${event.teamPlayerIndices.map((i) => i + 1).join(', ')}]`
    case 'vote':
      return `Round ${event.round}, proposal ${event.proposalNumber}: vote recorded (${event.votes.filter((v) => v === 'approve').length} approve, ${event.votes.filter((v) => v === 'reject').length} reject)`
    case 'missionResult':
      return `Round ${event.round} mission result: ${event.failCount} fail card${event.failCount === 1 ? '' : 's'} played by [${event.teamPlayerIndices.map((i) => i + 1).join(', ')}]`
    case 'settings':
      return `Settings updated: spy fail probability ${event.spyFailProbability}, vote weight ${event.voteWeight}`
  }
}

function eventClass(event: GameEvent): string {
  switch (event.type) {
    case 'setup':
      return 'event-log__entry--setup'
    case 'teamProposed':
      return 'event-log__entry--proposal'
    case 'vote':
      return 'event-log__entry--vote'
    case 'missionResult':
      return 'event-log__entry--result'
    case 'settings':
      return 'event-log__entry--settings'
  }
}

export function EventLog({ events, onUndo }: EventLogProps) {
  return (
    <section className="event-log">
      <div className="event-log__header">
        <h2 className="event-log__title">Event log</h2>
        <button
          className="event-log__undo"
          type="button"
          onClick={onUndo}
          disabled={events.length === 0}
        >
          Undo last event
        </button>
      </div>
      {events.length === 0 ? (
        <p className="event-log__empty">No events yet.</p>
      ) : (
        <ol className="event-log__list">
          {events.map((event, index) => (
            <li key={index} className={`event-log__entry ${eventClass(event)}`.trim()}>
              <span className="event-log__index">{index + 1}</span>
              <span className="event-log__text">{describeEvent(event)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
