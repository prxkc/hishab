# Hishab — Offline Personal Finance Cockpit

Local-first budgeting, ledger, and reporting app that runs entirely in your browser. Built following the `hishab_prd_architecture_build_plan_local_dark_minimal.md` blueprint with a minimal dark UI, motion-enhanced dashboards, and Apache ECharts visualisations.

## Highlights

- 📊 **Interactive dashboards**: Net worth trends, cash flow, top categories, and budget burn visualised with Apache ECharts. Framer Motion + GSAP animate key UI elements.
- 💾 **Offline-first data**: Dexie-powered IndexedDB persistence with repository layer, optional seed data, JSON import/export, and PWA auto updates.
- 🧮 **Finance toolkit**: Transactions (income, expense, transfer) with category/account lookups, envelope budgets per month, and savings goal tracking.
- 🧱 **Modern stack**: React 18 + TypeScript, Vite, Tailwind CSS with shadcn/ui, Zustand store, React Hook Form + Zod, Vitest, and Playwright scaffolding.
- 🧭 **Local control**: Everything runs locally, no servers required. Manifest + service worker generated via `vite-plugin-pwa`.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>. Initial load seeds sample accounts, categories, and budgets to explore the workflows.

### Scripts

| Command                   | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                | Start Vite dev server                                                |
| `pnpm build`              | Type-check and build production bundle (PWA assets included)         |
| `pnpm preview`            | Preview production build                                             |
| `pnpm lint`               | Run ESLint over `src`                                                |
| `pnpm test`               | Run Vitest unit suite (requires Node 20 or `jsdom`; see notes below) |
| `pnpm test:e2e`           | Playwright placeholder (configure before running)                    |
| `pnpm playwright:install` | (On demand) Download Playwright browsers when you need E2E tests     |

> **Notes:**
>
> - Browser binaries are skipped during dependency install to keep `pnpm install` fast. Run `pnpm playwright:install` once before executing Playwright tests.
> - On Node 22 the Vitest pool (tinypool) may crash. If that happens, temporarily downgrade to Node 20 or install `jsdom` and rerun.

## Project Structure

```
src/
  app/            # Layout shell, router, providers, theme handling
  components/     # shadcn/ui wrappers, shared UI pieces, charts wrapper
  data/           # Dexie instance, repositories, seed + backup services
  domain/         # Typed domain models & constants
  hooks/          # Toast helper (from shadcn)
  lib/            # Utilities, id helpers, styles
  pages/          # Route-level screens (dashboard, transactions, budgets, goals, reports, data, settings)
  store/          # Zustand app store & selectors
  styles/         # Tailwind globals + theme tokens
```

## Key Features

- **Zustand Store**: `src/store/app-store.ts` hydrates accounts, categories, budgets, transactions, goals, and snapshots. Actions mutate Dexie via repositories and refresh UI state.
- **Dexie Persistence**: `src/data/db.ts` defines tables with indexes. Repositories in `src/data/repositories/` encapsulate CRUD logic, spent recalculation, and transactional balance updates.
- **Charts**: `src/components/charts/echart.tsx` lazily imports ECharts with a custom minimal dark theme and resizes responsively.
- **Motion**: Framer Motion animates stat/goal cards; GSAP powers the topbar offline badge entrance.
- **PWA**: `vite-plugin-pwa` generates manifest + service worker. `registerSW` runs in `src/main.tsx` and caches static assets. Update the icons in `public/` for production.

## Data Management

- **Seed**: On first launch the seed populates example accounts, categories, and budgets (`src/data/seed.ts`).
- **Backups**: Data Studio page lets you export/import JSON using `exportToJson` / `importFromJson` services (`src/data/services/data-service.ts`).
- **Budgets**: Inline controls and sheet editor allow monthly allocations, copy-from-previous, and progress tracking.
- **Goals**: Savings goals capture target/date and live allocation progress.

## Testing

- Unit tests: `src/lib/__tests__/utils.test.ts` covers utility helpers. Extend with additional suites as you flesh out features.
- E2E scaffolding: Playwright config (`playwright.config.ts`) is ready; add specs under `tests/e2e/`.

## Theming & Accessibility

- Tailwind configured with CSS variables for light and dark tokens (`tailwind.config.ts`, `src/styles/globals.css`).
- Theme toggler persists preference in localStorage.
- shadcn/ui components ensure good default A11y.

## Next Steps

- Implement secure encryption-at-rest flow outlined in the PRD.
- Expand Vitest suites to cover store actions and Dexie repositories.
- Add offline-first Playwright smoke tests once UI flows stabilise.
- Replace manifest icons with project branding.
- Address bundle size by code-splitting charts or using `manualChunks` if deploying to constrained environments.

---

Crafted with 🖤 to stay on top of finances without leaving your device.
