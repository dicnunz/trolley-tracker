# Panther Trolley Tracker

Panther Trolley Tracker is a focused transit UI for campus riders: live vehicle positions, stop-level arrival times, and schedule fallback when live data is stale.

The app is built with React + Vite and includes a seeded mock feed so anyone can run it locally without external services.

## What it does

- Tracks trolley position on a route map.
- Shows upcoming arrivals per stop.
- Falls back to schedule estimates when live ETAs are unavailable.
- Supports "notify me in X minutes" arrival alerts.
- Surfaces service status and incident notices.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

By default, the app can run entirely from local mock JSON in `data/mock/`.

## Optional environment setup

If you want to pin explicit behavior, copy the sample environment file:

```bash
cp ENV.sample .env.local
```

Environment variables:

- `VITE_USE_MOCK_FEED` / `USE_MOCK_FEED` (`true`/`false`): force mock mode.
- `VITE_LIVE_FEED_URL`: live ETA endpoint.
- `VITE_STATUS_URL`: service status endpoint.
- `VITE_SCHEDULE_JSON`: schedule payload endpoint.
- `VITE_TELEMETRY_URL`: optional telemetry endpoint.
- `VITE_LIVE_STALE_MS`: staleness cutoff for switching to schedule fallback (default `45000`).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local app. |
| `npm run build` | Create production build. |
| `npm run preview` | Serve production build locally. |
| `npm run lint` | Lint React source files. |
| `npm run test` | Run Vitest in watch mode. |
| `npm run test:ci` | Run Vitest once for CI/local checks. |
| `npm run verify:mocks` | Validate mock feed shape and required stops. |
| `npm run gen:print` | Generate printable service-board assets from current mock data. |
| `npm run check` | Run lint, tests, build, and mock validation. |

## Mock data and printable assets

- Mock feeds live in `data/mock/live-etas.json`, `data/mock/status.json`, and `data/mock/schedule.json`.
- `npm run gen:print` writes:
  - `public/print/service-board.md`
  - `public/print/service-board.json`

These files are useful for quick QA snapshots, operational handoff, or static embeds.

## Project notes

Implementation decisions and assumptions are documented in [`docs/summary.md`](./docs/summary.md).
