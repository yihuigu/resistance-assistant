# Plan: Resistance Deduction Assistant (static SPA)

## Goal
A single-page web app where one host records game events and sees live posterior probabilities of each player being a Spy.

## Decisions
- Variant: Base Resistance (5-10 players) in v1. Engine is variant-pluggable so Avalon roles (Merlin/Assassin/Percival/Morgana and knowledge events) can be added later without redesign.
- Usage: Single host device; no accounts, no backend.
- Stack: React + TypeScript + Vite, pure static build. Game state persisted to localStorage; no server. Deployment out of scope.
- Inference: Exact Bayesian enumeration over all possible spy assignments (max C(10,4)=210 assignments). Posterior computed as a pure fold over the full event list, so any event edit/undo recomputes from scratch (no incremental state).

## Event model
1. Setup: player names (5-10), spy count + mission fail thresholds from a standard rules table (config data).
2. Round events: team proposal -> per-player approve/reject vote -> mission result (success/fail, count of fail cards).
3. Out of scope: plot cards, multi-device sync, Avalon UI.

## Likelihood model (heuristic, user-tunable)
- Mission outcomes: each spy on the team fails the mission with configurable per-spy fail probability (default 0.85); Resistance members always pass; mission fails iff fail-card count >= round threshold.
- Votes: treated as weak evidence via an adjustable "vote weight" slider (default low), since votes are noisy signals.
- All probabilities labeled in the UI as estimates, not facts.

## UI (3 areas)
- Player cards: spy-probability bars per player, sorted by suspicion.
- Round tracker: current round number, proposal/vote number, vote history, mission results so far.
- Event log + settings: full timeline with undo/edit; sliders for spy fail probability and vote weight; reset/new game button.

## File layout
- src/engine/: types.ts (events, game state), config.ts (variant rules table, Avalon hook points), enumerate.ts (spy-set enumeration), infer.ts (Bayesian fold)
- src/ui/: App, SetupScreen, GameBoard, PlayerCard, EventLog, SettingsPanel
- tests/ (Vitest): empty events -> uniform priors; a failed 3-player mission raises those players' posteriors; vote weight 0 disables vote evidence; undo restores the previous posterior; enumeration counts match combinations.

## Delegation
Implement via controller tasks: submit_and_wait(repo="resistance-assistant", ...). The worker session sees only the prompt, so every implementation task prompt must be fully self-contained. Work may proceed in phases (scaffold -> engine + tests -> UI) on this repo.

## Validation
Worker must run and report results of: `tsc --noEmit`, `vitest run`, and `npm run build`.

## Risks
- Likelihood parameters are subjective heuristics; mitigated by user-tunable weights and explicit "estimate" labeling.
- Avalon extension must not leak into v1 UI; keep variant config as data only.

## Open questions
None - all key decisions resolved. Out of scope: Avalon roles UI, plot cards, multi-device use, deployment.
