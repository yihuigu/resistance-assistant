import { useState } from 'react'
import './ui.css'

const MIN_PLAYERS = 5
const MAX_PLAYERS = 10

export interface SetupScreenProps {
  onStart: (playerNames: string[]) => void
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MIN_PLAYERS }, () => ''),
  )

  const namedPlayers = names.filter((name) => name.trim().length > 0)
  const canStart = namedPlayers.length >= MIN_PLAYERS

  const setName = (index: number, value: string) => {
    setNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  const addPlayer = () => {
    setNames((prev) => (prev.length >= MAX_PLAYERS ? prev : [...prev, '']))
  }

  const removePlayer = (index: number) => {
    setNames((prev) =>
      prev.length <= MIN_PLAYERS ? prev : prev.filter((_, i) => i !== index),
    )
  }

  const startGame = () => {
    if (canStart) {
      onStart(namedPlayers)
    }
  }

  return (
    <section className="setup-screen">
      <h2 className="setup-screen__title">Game setup</h2>
      <p className="setup-screen__hint">
        Enter 5 to 10 player names. {namedPlayers.length} named,{' '}
        {names.length}/{MAX_PLAYERS} slots used.
      </p>
      <ul className="setup-screen__players">
        {names.map((name, index) => (
          <li key={index} className="setup-screen__player-row">
            <input
              className="setup-screen__input"
              type="text"
              value={name}
              placeholder={`Player ${index + 1} name`}
              aria-label={`Player ${index + 1} name`}
              onChange={(event) => setName(index, event.target.value)}
            />
            <button
              className="setup-screen__remove"
              type="button"
              onClick={() => removePlayer(index)}
              disabled={names.length <= MIN_PLAYERS}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="setup-screen__actions">
        <button
          className="setup-screen__add"
          type="button"
          onClick={addPlayer}
          disabled={names.length >= MAX_PLAYERS}
        >
          Add player
        </button>
        <button
          className="setup-screen__start"
          type="button"
          onClick={startGame}
          disabled={!canStart}
        >
          Start game
        </button>
      </div>
    </section>
  )
}
