import './ui.css'

export interface PlayerCardProps {
  name: string
  spyProbability: number
}

export function PlayerCard({ name, spyProbability }: PlayerCardProps) {
  const clamped = Math.min(1, Math.max(0, spyProbability))
  return (
    <div className="player-card">
      <div className="player-card__name">{name}</div>
      <div className="player-card__bar-section">
        <div className="player-card__bar-track">
          <div
            className="player-card__bar"
            style={{ width: `${clamped * 100}%` }}
          />
        </div>
        <span className="player-card__percent">
          {Math.round(clamped * 100)}%
        </span>
      </div>
      <div className="player-card__label">
        Estimated spy probability (not a fact)
      </div>
    </div>
  )
}
