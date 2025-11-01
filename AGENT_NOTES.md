# Agent Notes — Hishab Project

**Location:** `/mnt/u/work/projects/hishab`
**Stack:** React 18 + TypeScript, Vite, Tailwind (shadcn/ui), Zustand, Dexie, Apache ECharts, Framer Motion/GSAP, Vite PWA plugin.

## Current State (2025-02)
- Fully scaffolded SPA with sidebar/topbar shell and themed dark UI.
- Dexie database configured (`src/data/db.ts`) with repositories, seeding, and backup/import services.
- Zustand store (`src/store/app-store.ts`) hydrates data, handles errors, and exposes actions for transactions, budgets, goals, etc.
- Feature pages:
  - Dashboard: ECharts visualizations, stats, month switcher.
  - Transactions: New transaction dialog (React Hook Form + Zod), table view.
  - Budgets: Monthly overview, copy previous month, edit sheet.
  - Goals: Goal creation dialog, progress cards.
  - Reports: Multi-tab charts (net worth, cash flow, categories, budget burn).
  - Data Studio: JSON export/import, IndexedDB usage, encryption placeholder.
  - Settings: Preferences persisted to `localStorage`, account/category forms, labs roadmap.
- PWA enabled via `vite-plugin-pwa`; service worker registers in `src/main.tsx`.
- Tests: basic utility suite under `src/lib/__tests__`; Vitest config uses Node environment (Tinypool on Node 22 still flaky).

## Known Issues / Follow-ups
- Bundle size exceeds 500 kB due to ECharts; consider dynamic import/manual chunks.
- Vitest workers crash on Node 22 (tinypool bug). Use Node 20 or install `jsdom` once registry access is available.
- Encryption flow is still a placeholder.
- Replace `public/vite.svg` icons in manifest.

## How to Run
```bash
pnpm install      # ensure dependencies (Node 20+ recommended)
pnpm dev          # start local server at http://localhost:5173
```
If prefetched data becomes inconsistent, open DevTools > Application > IndexedDB and delete the `hishab` database, then reload.

## Build & Distribution
```bash
pnpm build        # type-check + production bundle + PWA assets
pnpm preview      # serve dist/ locally on port 4173
```

## Key Entry Points
- Routing: `src/app/router.tsx`
- Layout: `src/app/shell/`
- Store selectors: `src/store/selectors.ts`
- Data backup: `src/data/services/data-service.ts`
- Charts wrapper: `src/components/charts/echart.tsx`

Keep this file updated with major changes or TODOs so future sessions resume smoothly.
