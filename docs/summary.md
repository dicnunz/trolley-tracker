# Phase 1 Notes

## Tradeoffs & Assumptions

- Manual Vite + React scaffold because `npm create vite` failed with a 403 in the execution environment; created equivalent files by hand.
- npm registry access is blocked in this environment, so no `package-lock.json` could be generated. Run `npm install` in a networked environment to create it.
- The data layer reads `USE_MOCK_FEED` or `VITE_USE_MOCK_FEED`. In Vite builds only the `VITE_`-prefixed variable is exposed, so `.env.local` should define both when running outside Vite tooling.
- Mock feed JSON files (`data/mock/*.json`) carry simple progress + ETA payloads that approximate the live API shape. They keep the SVG route animation while avoiding external services.
- `npm run e2e` and `npm run lighthouse` started as placeholders in Phase 1; real test suites and CI wiring arrived in Phase 3.
- Live schedule parsing still uses the raw text blocks embedded in `App.jsx`, matching the prototype behavior while the data layer exposes a simpler JSON-based helper for stop-specific lookups.
- Live ETA freshness defaults to 45 seconds. When the feed is older or empty we switch to the published schedule and label it “Schedule estimate.” Tweak `VITE_LIVE_STALE_MS` if the feed cadence changes.
- Stop coordinates are approximate campus values so geolocation can pick a sensible default. They can be swapped for official GIS data without touching the map API.
- Browser notifications fall back to in-app timers when permissions are denied or unsupported; only stop + alert preferences are persisted in localStorage per the privacy requirement.

## Next Steps (Phase 2 Preview)

- Flesh out automated tests (unit/e2e) and replace placeholder scripts with real checks.
- Expand the data layer to normalise external API payloads and reconcile with the schedule parser.
- Add telemetry wiring behind the optional `VITE_TELEMETRY_URL` flag.

# Phase 3 Notes

## Tradeoffs & Assumptions

- Added lightweight telemetry that prints event counters to the console and optionally POSTs to `VITE_TELEMETRY_URL`. Network
  failures are swallowed so alerts and fallback logic never regress if the endpoint is offline.
- Exposed a minimal `window.__trolleyTestHooks` surface (only when `window.__TROLLEY_TEST_MODE` is set) to drive Playwright
  scenarios such as toggling service state or simulating live feed errors. Production builds ignore the hooks entirely.
- GitHub Actions installs Playwright browsers on the fly; local runs still require installing `@playwright/test` and
  `@lhci/cli` in a networked environment because this sandbox cannot reach npm.
- Dependency caching in CI is disabled until a `package-lock.json` can be generated in a networked environment; once
  available, re-enable caching for faster installs.

## Automated Checks

- Vitest covers ETA formatting edge cases, live→schedule fallback behaviour, and the stale-live guard.
- Playwright verifies the nearest-stop badge, alert arming, alert disablement while service is off, and the automatic switch to
  schedule estimates when live data fails.
- CI (Node 20) now runs linting, unit tests, build, Playwright E2E, and Lighthouse CI; the workflow posts Lighthouse scores back
  to pull requests.

## Performance

- Initial JavaScript bundle (gzip): 55.39 kB (`dist/assets/index-Dn7TWXl1.js`).
- Lighthouse (mobile): run `npm run lighthouse` after installing `@lhci/cli`; the CI workflow will capture and comment the
  scores once dependencies are available.
