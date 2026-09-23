import './ui.css'

export interface SettingsPanelProps {
  spyFailProbability: number
  voteWeight: number
  onChange: (settings: { spyFailProbability: number; voteWeight: number }) => void
  onReset: () => void
}

export function SettingsPanel({
  spyFailProbability,
  voteWeight,
  onChange,
  onReset,
}: SettingsPanelProps) {
  return (
    <section className="settings-panel">
      <h2 className="settings-panel__title">Settings</h2>
      <div className="settings-panel__row">
        <label
          className="settings-panel__label"
          htmlFor="settings-panel-spy-fail"
        >
          Spy fail probability
        </label>
        <input
          id="settings-panel-spy-fail"
          className="settings-panel__slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={spyFailProbability}
          onChange={(event) =>
            onChange({
              spyFailProbability: Number(event.target.value),
              voteWeight,
            })
          }
        />
        <span className="settings-panel__value">
          {spyFailProbability.toFixed(2)}
        </span>
      </div>
      <div className="settings-panel__row">
        <label className="settings-panel__label" htmlFor="settings-panel-vote-weight">
          Vote weight
        </label>
        <input
          id="settings-panel-vote-weight"
          className="settings-panel__slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={voteWeight}
          onChange={(event) =>
            onChange({
              spyFailProbability,
              voteWeight: Number(event.target.value),
            })
          }
        />
        <span className="settings-panel__value">{voteWeight.toFixed(2)}</span>
      </div>
      <div className="settings-panel__actions">
        <button
          className="settings-panel__reset"
          type="button"
          onClick={onReset}
        >
          New game
        </button>
      </div>
    </section>
  )
}
