# Engineering Notes

## Runtime behavior

- The app prefers live ETAs when feed data is fresh, then switches to schedule-based estimates once data is stale or missing.
- Staleness defaults to `45s` via `VITE_LIVE_STALE_MS`.
- Service state is driven by status payloads (`on`, `limited`, `off`) with a default fallback of `on`.

## Local-first development

- Mock data under `data/mock/` is maintained as a complete local path for live ETAs, service status, and stop schedules.
- `VITE_USE_MOCK_FEED` can force mock mode, but the app also falls back automatically when live endpoints are absent or unreachable.
- `scripts/verify-mock-data.js` validates required stops and payload shape to keep the local path reliable.

## UX and reliability decisions

- Selected stop and alert lead time are persisted in local storage (`trolley.prefs.v2`) for continuity.
- Geolocation selects the nearest stop when permission is granted, with manual override always available.
- Alerts use browser notifications when allowed and in-app banners when notifications are denied/unsupported.
- The map is wrapped with an error boundary to preserve the rest of the experience if rendering fails.

## Supporting artifacts

- `scripts/gen-print.js` turns current mock feeds into printable service-board artifacts in `public/print/`.
- These artifacts provide a low-friction QA and stakeholder snapshot without requiring a running frontend session.
