# Panther Trolley Tracker

Interactive demo that:

* draws an **approximate campus route** with **8 labeled stops**
* simulates a **“live” bus** looping the route (~18 min by default)
* **parses schedule text** (Mon–Thu, Fri) and shows **next two arrivals per stop**

This README is for **running the code you pasted above** (the v0.4 component using Tailwind + shadcn/ui + lucide-react).

---

## 1) Quick start (project already set up)

If your repo already has **Next.js (or Vite) + Tailwind + shadcn/ui** installed and the `@/components/ui/*` paths exist:

```bash
# install deps
npm install

# dev server
npm run dev
```

Then open the app (usually [http://localhost:3000](http://localhost:3000) for Next.js, [http://localhost:5173](http://localhost:5173) for Vite).

> Entry: put the provided component in **Next.js** `app/page.tsx` (or `app/page.jsx`) **or** in **Vite** `src/App.jsx`. See file placement notes below.

---

## 2) Fresh setup (if you don’t have a project yet)

### Option A — Next.js (recommended with shadcn/ui)

```bash
npx create-next-app@latest trolley-tracker
cd trolley-tracker
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react
```

Set up Tailwind (add to `tailwind.config.js` and globals):

* `tailwind.config.js` → add content globs for your app files:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
```

* `app/globals.css` (or `styles/globals.css`) → include Tailwind layers:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Install **shadcn/ui** and add the needed components:

```bash
npx shadcn@latest init
# then add the components used by the code:
npx shadcn@latest add button card badge switch input tabs
```

Create **`components/ui`** (shadcn will do this) and ensure your project resolves `@/components/ui/*` (Next.js does by default).

Now copy the pasted code into `app/page.tsx` (or `app/page.jsx`) and run:

```bash
npm run dev
```

### Option B — Vite + React (if you prefer Vite)

```bash
npm create vite@latest trolley-tracker -- --template react
cd trolley-tracker
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react
```

Configure Tailwind like above, and add an alias for `@` so `@/components/ui/*` works.

* `vite.config.ts` (or `.js`):

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

* `jsconfig.json` (or `tsconfig.json`) for editor tooling:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Add **shadcn/ui** to Vite project (community guides work fine). Minimal path:

* create `src/components/ui` and copy shadcn versions of:

  * `button`, `card`, `badge`, `switch`, `input`, `tabs`
* or replace those imports with your own components.

Place the pasted component in `src/App.jsx`, adjust imports if you didn’t use shadcn, and run:

```bash
npm run dev
```

---

## 3) File placement & imports

* **Next.js**: put the component in `app/page.tsx` (or `app/(routes)/tracker/page.tsx` and route accordingly). Keep the imports:

  * `@/components/ui/card`, `@/components/ui/button`, `@/components/ui/badge`, `@/components/ui/switch`, `@/components/ui/input`, `@/components/ui/tabs`
  * `lucide-react` icons
* **Vite**: put it in `src/App.jsx` and ensure:

  * alias `@` → `src`
  * `src/components/ui/*` exists (shadcn or your equivalents)

---

## 4) What’s implemented (v0.4)

* **Map-like route**: SVG polyline (`ROUTE_POINTS`) tracing the official loop shape (approximate), with **8 numbered stops** (`STOPS`).
* **Live loop**: a simulated bus dot advances along the path (default loop ≈ **18 min**, tweak `LOOP_MIN`).
* **Schedule parsing**: text blocks (`RAW_MON_THU`, `RAW_FRI`) → parsed grid → **next two times per stop**.
* **UI**: Tabs for **Live / Schedule / Info**, badges, and cards. Survey + campus info shown statically.

---

## 5) How to customize

* **Update schedule**: replace the `RAW_MON_THU` / `RAW_FRI` strings with new tab-separated rows; non-time tokens are ignored.
* **Change loop speed**: edit `LOOP_MIN` (minutes per full lap).
* **Refine map**: adjust `ROUTE_POINTS` to better match campus; stop labels/positions in `STOPS`.
* **Campus & survey**: edit `CAMPUS` and `SURVEY` constants.

---

## 6) Roadmap (MVP)

* **Notifications**: watch a stop with a chosen lead time (e.g., 5 min).
* **Signal-aware ETAs**: degrade gracefully on weak/missing GPS using headways + last sighting.
* **Data adapter**: plug in real GPS / dispatcher feed.
* **A11y polish**: focus outlines, aria-labels, high-contrast mode.

---

## 7) Scripts

Common scripts (these come from your package manager template):

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run production build (Next.js)
```

---

## 8) Dependencies

* React 18+
* **Tailwind CSS**
* **shadcn/ui** components: `button`, `card`, `badge`, `switch`, `input`, `tabs`
* **lucide-react** (icons)

If you aren’t using shadcn/ui, replace those imports with your own components or plain HTML.

---

## 9) Notes

* The geometry is **approximate**; plug in GIS/lat-long when available.
* Time parsing assumes 12→1 wraps to **PM** unless otherwise specified.
* The demo “GPS accuracy” control is visual only in this prototype.
