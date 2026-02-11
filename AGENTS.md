# AGENTS.md

## Project goal
Build a Next.js (App Router) + TypeScript web app that demonstrates the benefits of matching theory (Deferred Acceptance) for new-grad placement in large companies by comparing:
- Baseline placement (simple company-optimization style rule)
- DA (new-grad-proposing deferred acceptance)

The app must be interactive and explain results visually.

## Non-goals
- No backend database for MVP.
- No authentication.
- No heavy academic exposition; prioritize "experience first".

## Tech constraints
- Use TypeScript everywhere.
- Prefer pure functions for algorithms.
- Keep algorithms deterministic with a seed.
- UI: Tailwind. Use accessible components.

## Repo commands
- `npm run lint` must pass.
- `npm run test` (if present) must pass.

## Coding style
- Small modules, clear naming.
- Add docstrings/comments to algorithm code (why, not how).
- Handle edge cases (no feasible departments, capacity mismatch).

## Output expectations
- Every PR-sized change includes:
  - Updated types
  - Unit tests for algorithms (DA, baseline, blocking pairs)
  - Screenshots (optional) or a short description of UI changes
