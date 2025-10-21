# Panther Trolley Tracker

Vite + React prototype that keeps the original campus-shaped SVG route, stop schedule parser, and survey context from the early demo. The codebase now includes a mock-friendly data layer and standard tooling so you can run and test the project without additional setup questions.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting started

```bash
npm install
cp ENV.sample .env.local   # update values or flip USE_MOCK_FEED=true for seeded data
npm run dev
```

The dev server runs on [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production bundle locally. |
| `npm run lint` | Run ESLint over `src/`. |
| `npm run format` | Format the repo with Prettier. |
| `npm run test` | Execute unit tests with Vitest. |
| `npm run e2e` | Placeholder command for future end-to-end tests. |
| `npm run lighthouse` | Reminder command for running Lighthouse against the built app. |
| `npm run gen:print` | Stub script for generating printable assets. |

## Environment variables

Copy `ENV.sample` to `.env.local` and update as needed.

- `VITE_LIVE_FEED_URL` – optional URL returning the live vehicle feed.
- `VITE_STATUS_URL` – optional URL for the status/alerts feed.
- `VITE_SCHEDULE_JSON` – optional URL to a schedule JSON payload.
- `USE_MOCK_FEED` – set to `true` to load the seeded JSON mocks (default `false`).
- `VITE_TELEMETRY_URL` – optional analytics endpoint.

> Vite exposes variables prefixed with `VITE_` to the browser. The `USE_MOCK_FEED` flag is mirrored in the data layer to support both styles.

## Project structure

```
├── AGENTS.md
├── ENV.sample
├── README.md
├── docs/
├── data/
│   └── mock/
├── public/
│   └── print/
├── scripts/
└── src/
```

- `src/App.jsx` hosts the main UI.
- `src/lib/data.js` loads live or mock data.
- `data/mock/` contains seeded JSON feeds for local development.
- `docs/summary.md` is where tradeoffs and assumptions are logged.

## Printing assets

`npm run gen:print` currently logs a placeholder message. Replace the script once real templates exist.

## Testing

The project includes Vitest and ESLint. Add test files beside components (e.g., `Component.test.jsx`) to expand coverage.

