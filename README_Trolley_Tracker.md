# Panther Trolley Tracker — Prototype

## Run locally
```bash
npm install
npm run dev
```
- Requires React + Tailwind + shadcn/ui (or swap icons/components with plain HTML).
- Entry file: `trolley_tracker_prototype_v_0_5.jsx`

## What’s implemented
- Campus-shaped route polyline with 8 labeled stops.
- Demo “live” bus moving on a loop (~18 min).
- Schedule parser showing next two times per stop (Mon–Thu, Fri).

## What to add next (MVP)
- **Notifications**: watch a stop + lead time (e.g., 5 min).
- **ETA model**: if GPS missing, estimate using headway & last sighting.
- **Data adapter**: plug in real GPS or dispatch feed when available.
- **A11y**: keyboard focus outlines, aria-labels for icons, high-contrast mode.

## Data sources
- Schedule blocks are in the code (swap RAW_MON_THU / RAW_FRI strings).
- Survey stats and charts were generated from your XLSX responses.
