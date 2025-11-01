# Hishab — PRD, Architecture & Build Plan (Local, Dark, Minimal)

**Status:** Draft v1 • **Owner:** You • **Scope:** Personal, runs fully offline/local (desktop browser) • **Style:** Minimal, dark, sleek • **Charts:** Apache ECharts (Minimal Responsive Theme) • **Animations:** Framer Motion **+ GSAP** (both core libraries)

---

## 1) Product Requirements Document (PRD)

### 1.1 Problem & Goals

- Track personal finances across accounts (bank, bKash, cash) with **zero external dependencies**.
- Input transactions fast, view budgets, savings, trends, and net worth over time.
- Must work **offline**; data stored **locally** (browser IndexedDB) with optional password‑based encryption.

### 1.2 Users & Non-Goals

- **Users:** Single local user (you). No auth/SSO needed for MVP.
- **Non-goals:** Real-time sync, cloud backups, bank API importing (future), multi-user/collaboration.

### 1.3 Success Criteria (MVP)

- Create **accounts**, **categories**, **budgets**, **transactions**, **transfers**, **savings goals**.
- **Month view** with budget vs. actual per category; flag over/under budget.
- **Dashboards**: net worth over time, cash flow (income vs. expense), category trends.
- **History**: navigate any month; export/import data to JSON; CSV export for transactions.
- **Performance:** p95 page interactions < 150ms; initial load < 2s on average desktop.

### 1.4 Key User Flows

1. **Add transaction** (income/expense/transfer)

- Choose date, account, category, amount (৳), notes, optional tags.
- Save; balances and budget utilization update immediately.

2. **Budgeting**

- Set **monthly budget** per category; see **remaining/over** indicators; quick edit inline.

3. **Savings goals**

- Define goal name, target amount, target date; show progress and forecast.

4. **Reports/Dashboards**

- Net worth line; monthly cash flow bars; category sunburst/top‑N; budget burn donut.

5. **Data mgmt**

- Backup/Restore JSON; Export CSV; Optional **Set master password** → encrypt at rest.

### 1.5 Constraints

- **Runs locally in a browser** (desktop). No server, no internet required.
- Single currency **BDT (৳)**; timezone **Asia/Dhaka**.

---

## 2) Tech Stack (Selected)

### 2.1 Frontend/App

- **Framework:** React 18 + **TypeScript**, **Vite**
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **State:** **Zustand** (simple local state) + context for theming
- **Data (Local‑first):** **Dexie** (IndexedDB) w/ typed tables
- **Validation & Forms:** React Hook Form + Zod
- **Routing:** TanStack Router (file‑based) or React Router
- **Charts:** **Apache ECharts** (Apache‑2.0) — **minimal, responsive theme** (custom). *Alt:* Highcharts if you explicitly prefer it later.
- **Animations:** **Framer Motion + GSAP** — Framer for page/component transitions; GSAP for advanced sequences (Timeline/Flip) and micro‑interactions; respects reduced‑motion.
- **Dates/Numbers:** Day.js; Intl.NumberFormat for BDT
- **PWA:** Workbox service worker for offline caching
- **Testing:** Vitest + Testing Library + **Playwright** (e2e offline)
- **Tooling:** ESLint, Prettier, Husky + lint‑staged

### 2.2 Packaging/Run Modes

- **PWA (recommended)**: static build served locally (e.g., `vite preview` or any static server). Works fully offline after first load.
- **Desktop wrapper (optional future):** Tauri/Electron if you want a native app and file‑system backups.

### 2.3 Detailed Tech Stack — Versions, Rationale & Setup

#### 2.3.1 Language & Framework

- **React 18 + TypeScript (strict)** — predictable DX, concurrent features; TS enables safe domain modeling.
- **Vite (ESBuild dev, Rollup prod)** — extremely fast HMR; easy code-splitting for heavy chart modules.
- **Why not Next.js/Astro?** No router‑server need; app is 100% local, so SPA + PWA is leaner and simpler.

#### 2.3.2 UI Layer

- **Tailwind CSS** — tokenized, utility‑first; dark theme via `class` strategy.
- **shadcn/ui (Radix primitives)** — accessible components (Dialog, Drawer, Tooltip) with Tailwind variants.
- **Icons:** `lucide-react` (thin, consistent line icons, tree‑shakeable).
- **Fonts:** Local Inter/SF fallback to keep fully offline (include `.woff2` in `public/`).

#### 2.3.3 State & Data

- **Zustand** — tiny, ergonomic store with middleware; no boilerplate.
- **Dexie (IndexedDB)** — typed tables + indexes; perfect for offline, durable storage.
- **Persistence:** Prefer writing through repositories (e.g., `TxRepo`) so UI is decoupled from Dexie.
- **Optional Encryption:** WebCrypto **AES‑GCM** with key from PBKDF2/Argon2; enable via Settings.

#### 2.3.4 Routing

- **TanStack Router** — file‑based, data‑aware, great for SPA; alt: React Router.

#### 2.3.5 Forms & Validation

- **React Hook Form + Zod** — performant forms; schema‑first validation; reusable `FormField` components.

#### 2.3.6 Charts

- **Apache ECharts** — permissive (Apache‑2.0), rich visuals, responsive, offline‑friendly.
- **Why ECharts vs Highcharts?** Highcharts is powerful but requires a paid license for commercial use; for a personal project you may be fine, but ECharts avoids licensing concerns while staying local‑first.
- **Bundle control:** lazy‑import chart modules; create a themed wrapper to standardize colors/labels.

#### 2.3.6a Minimal Responsive Theme (ECharts)

- Goals: crisp typography, low‑ink visuals, responsive at 320–1440px, no 3D effects.
- Implement a reusable theme and wrapper once:

```ts
// charts/theme.ts
export const minimalTheme = {
  color: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6'],
  textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: '#e6edf3' },
  axisLine: { lineStyle: { color: '#1f2937' } },
  axisLabel: { color: '#94a3b8' },
  splitLine: { lineStyle: { color: '#111827' } },
  tooltip: { backgroundColor: '#0f1520', borderColor: '#1f2937', textStyle: { color: '#e6edf3' } },
  grid: { left: 16, right: 12, top: 16, bottom: 16, containLabel: true }
};
```

```tsx
// components/charts/useSize.tsx
import { useRef, useLayoutEffect, useState } from 'react';
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}
```

Use `useSize` to drive chart `resize()` for true responsiveness.

#### 2.3.7 Motion

- **Framer Motion** — route transitions, list stagger, hover/tap micro‑interactions.
- **GSAP (optional)** — use only for timeline/scrub effects; keep default on Framer for simplicity.
- **Respect reduced motion:** check `window.matchMedia('(prefers-reduced-motion)')`.

#### 2.3.7a GSAP Integration Patterns

- **Use GSAP** for complex sequences (timelines), **FLIP** list reorders (transactions table, budgets grid), and SVG morphs.
- **Interop with Framer Motion:** Let Framer handle mount/unmount & layout; run GSAP in `useLayoutEffect` on refs.

```tsx
import gsap from 'gsap';
import Flip from 'gsap/Flip';
gsap.registerPlugin(Flip);

useLayoutEffect(() => {
  const state = Flip.getState('.tx-row');
  // update React state that changes list order...
  Flip.from(state, { duration: 0.4, ease: 'power2.out', absolute: true });
}, [sortKey, sortDir]);
```

- **Reduced motion:** Feature‑flag animations when `matchMedia('(prefers-reduced-motion)')` is true.

#### 2.3.8 PWA/Offline

- **Workbox** — Precache app shell; runtime caching for `*.woff2`, images, and JSON backups.
- **Installable:** Manifest with icons, dark theme color; offline page fallback.

#### 2.3.9 Testing & Quality

- **Vitest** (+ jsdom), **@testing-library/react**, **Playwright** for E2E (including offline flow).
- **ESLint** (typescript, react‑hooks), **Prettier**, **lint‑staged** + **Husky**.
- **Lighthouse** budgets in CI.

#### 2.3.10 Build/Tooling Extras

- **Path aliases:** `@/*` via `vite-tsconfig-paths`.
- **SVGR:** inline SVGs as React components (`vite-plugin-svgr`).
- **PWA:** `vite-plugin-pwa` with custom Workbox config.

---

### 2.4 Packages & Why

| Area       | Packages                                                                                                                 | Why                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Core       | `react`, `react-dom`, `typescript`, `vite`                                                                               | SPA foundation with TS safety                                |
| UI         | `tailwindcss`, `@radix-ui/react-*`, `class-variance-authority`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot` | Accessible, themeable primitives & utilities                 |
| Routing    | `@tanstack/react-router`                                                                                                 | Modern router with data APIs                                 |
| State      | `zustand`                                                                                                                | Minimal, ergonomic state                                     |
| Data       | `dexie`                                                                                                                  | IndexedDB with typed tables and indexes                      |
| Forms      | `react-hook-form`, `zod`                                                                                                 | High‑perf forms + schema validation                          |
| Dates/Intl | `dayjs`                                                                                                                  | Lightweight date utils                                       |
| Charts     | `echarts`                                                                                                                | Beautiful charts, Apache‑2.0                                 |
| Motion     | `framer-motion`, `gsap`                                                                                                  | Declarative transitions + advanced sequences (Flip/Timeline) |
| PWA        | `vite-plugin-pwa`, `workbox-window`                                                                                      | Offline, precache, update flow                               |
| Tooling    | `eslint`, `@typescript-eslint/*`, `prettier`, `husky`, `lint-staged`                                                     | Code quality & hooks                                         |
| Tests      | `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `playwright`             | Unit + E2E tests                                             |

> Optional: `vite-plugin-svgr`, `vite-tsconfig-paths`, `@radix-ui/react-icons` (if desired), `argon2-browser` for key derivation.

---

### 2.5 Config Snippets (Opinionated)

``** (partial)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2023", "DOM"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "types": ["vite/client"]
  }
}
```

``** (core)**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Hishab',
        short_name: 'Hishab',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: { runtimeCaching: [] }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts']
        }
      }
    }
  }
});
```

``** (dark/minimal)**

```ts
import type { Config } from 'tailwindcss';
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',
        surface: '#0f1520',
        muted: '#1a2230',
        text: '#e6edf3',
        accent: '#60a5fa',
        warn: '#f59e0b'
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' }
    }
  },
  plugins: []
} satisfies Config;
```

**Global CSS tokens (**``**)**

```css
:root { --bg:#0b0f14; --surface:#0f1520; --muted:#1a2230; --text:#e6edf3; --accent:#60a5fa; --warn:#f59e0b; }
html,body,#root{height:100%}
body{background:var(--bg); color:var(--text)}
```

---

### 2.6 ECharts + Framer Wrappers

``** skeleton**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';

echarts.use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export function ChartCard({ option, height = 260 }: { option: any; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const inst = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    inst.setOption(option, { notMerge: true, lazyUpdate: true });
    const resize = () => inst.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); inst.dispose(); };
  }, [option]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="rounded-2xl p-4 bg-surface shadow">
      <div ref={ref} style={{ height }} />
    </motion.div>
  );
}
```

**Page transition layout**

```tsx
<motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
  {/* route content */}
</motion.main>
```

---

### 2.7 Workbox Runtime Caching (snippet)

```ts
// sw.ts (if using custom SW)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(({ request }) => request.destination === 'font', new CacheFirst({ cacheName: 'fonts' }));
registerRoute(({ request }) => request.destination === 'image', new StaleWhileRevalidate({ cacheName: 'images' }));
```

---

### 2.8 Testing Setup

**Vitest**: jsdom environment, `setupTests.ts` registering `@testing-library/jest-dom`. **Playwright**: one spec runs with `--offline` to validate PWA behavior; fixtures create seed data in Dexie.

---

### 2.9 Git Hooks & Scripts (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:ui": "vitest",
    "e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier -w ."
  },
  "lint-staged": { "**/*.{ts,tsx,css,md}": ["eslint --fix", "prettier -w"] }
}
```

---

### 2.10 Performance Budgets & Practices

- **Target:** < 300KB gz initial JS (post‑gzip) for app shell; charts are lazy‑loaded.
- **Code‑split** charts and rarely used routes; prefer Canvas renderer for ECharts.
- **Avoid extraneous deps**; keep icon imports per‑icon; use local fonts.

---

### 2.11 Accessibility Defaults

- Radix primitives supply ARIA; ensure focus rings visible on dark backgrounds.
- Keyboard shortcuts documented; all actions reachable without a mouse.
- `prefers-reduced-motion` reduces transitions.

---

### 2.12 Optional Desktop (Tauri)

- If needed later: Tauri + Rust backend wrapper for native menus and file‑system backups (AES‑GCM encryption on backup files).

---

## 3) Architecture Overview

**Shape:** Local‑first **monolith (SPA)** with layered modules.

```
[UI (React + Tailwind + shadcn)]
    ↕ animations (Framer Motion)
[Feature modules: Accounts | Budgets | Transactions | Reports | Settings]
    ↕
[App Services (domain logic): BudgetEngine, ReportsEngine, EncryptionService]
    ↕
[Data Access (Dexie repositories): AccountsRepo, TxRepo, BudgetsRepo, GoalsRepo]
    ↕
[IndexedDB (encrypted optional)]
```

- **Encryption at rest (optional):** WebCrypto AES‑GCM with key derived via PBKDF2/argon2 from a master password.
- **Offline‑first cache:** Service worker precaches app shell and assets via Workbox; data lives in IndexedDB.
- **Theming:** Dark by default; minimal tokenized palette.

---

## 4) Data Model

### 4.1 Entities

- **Account** `{ id, name, type: ('bank'|'bkash'|'cash'|'other'), openingBalance, createdAt }`
- **Category** `{ id, name, type: ('income'|'expense'), color?, parentId? }`
- **Budget** `{ id, month: 'YYYY-MM', categoryId, amount }`
- **Transaction** `{ id, date, type: ('income'|'expense'|'transfer'), accountId, amount, categoryId?, notes?, tags?:string[] }`
- **Transfer** (modeled as Transaction with `type:'transfer'` and `{fromAccountId,toAccountId}`)
- **SavingsGoal** `{ id, name, targetAmount, targetDate?, currentAllocated }`
- **Setting** `{ key, value }` e.g., currency='BDT', timezone='Asia/Dhaka', encryptionEnabled\:boolean
- **Snapshot** `{ id, month:'YYYY-MM', netWorth, totals:{income,expense}, byCategory:[...] }` (materialized for speed)

**Derived:** Account balances = openingBalance + Σ transactions (income − expense ± transfers).

### 4.2 Integrity Rules

- A **transfer** updates two accounts atomically.
- A **budget** is unique by `(month, categoryId)`.
- A **transaction** `type:'income'|'expense'` must have `categoryId` of matching type.

### 4.3 Indexes (Dexie)

- `Transaction`: by `date`, by `categoryId`, by `accountId`, and compound `[date+categoryId]` for queries.
- `Budget`: by `month`, `categoryId`.
- `Account`: by `name`.

---

## 5) Core Features & Screens

1. **Dashboard**

   - Cards: Net worth (ECharts line), This month income/expense (bar), Top 5 categories (pie/sunburst), Budget burn (donut).
   - Subtle entrance/hover animations; chart transitions on month change.

2. **Transactions**

   - Table with search/filter/sort; quick add drawer (Ctrl+Enter to save).
   - Import CSV (columns: date, type, account, category, amount, notes, tags); Export CSV; Bulk edit/delete; Keyboard shortcuts.

3. **Budgets**

   - Monthly grid: category rows with budget, spent, remaining, % used (progress bar).
   - Inline edit; quick create from last month; copy forward.

4. **Accounts**

   - List of accounts with balances and sparkline; add/edit; archive.

5. **Savings goals**

   - Card list with progress bars; optional forecast to target date.

6. **Reports**

   - Time‑range selector; charts for cash flow, category trends, net worth, balance over time.

7. **Settings**

   - Currency (fixed BDT display), timezone (Asia/Dhaka), theme (dark), data backup/restore, **enable encryption**.

---

## 6) UX—Design System & Motion

### 6.1 Visual Language (Dark Minimal)

- **Colors:** Near‑black backgrounds, muted slate surfaces, high‑contrast white/neutral text; accent color for success/warning/over‑budget.
- **Typography:** Inter or SF; 12/14/16/20/24 scale; clear hierarchy.
- **Density:** Compact tables; generous whitespace on dashboards.

### 6.2 Components

- shadcn/ui primitives (Button, Card, Dialog, Drawer, Dropdown, Tabs, Tooltip, Toasts)
- ECharts themes: minimal gridlines, subtle gradients, tasteful label density.

### 6.3 Motion Guidelines

- **Framer Motion + GSAP** page transitions (200–300ms), subtle springs on cards, staggered list reveals; GSAP timelines for choreographed sequences.
- Reduce motion preference respected (`prefers-reduced-motion`).
- Avoid parallax/over‑animation; keep 60fps.

---

## 7) Non‑Functional Requirements

- **Performance:** p95 interactions < 150ms; initial bundle < 300KB gzipped target (code‑split charts)
- **Reliability:** IndexedDB storage with simple integrity checks and snapshots per month.
- **Security/Privacy:** Optional encryption at rest; no network calls; no telemetry by default.
- **Accessibility:** Keyboard navigable, focus states, contrast AA in dark theme.
- **Backup/Recovery:** JSON export/import; monthly auto‑snapshot inside IndexedDB.

---

## 8) Acceptance Criteria (MVP excerpts)

**A1 — Add Expense**

- Given app is installed/open, when I open *Add Transaction*, choose **expense**, pick **account**, **category (expense)**, set **amount > 0**, and save → then **account balance decreases** and **budget spent increases**.

**A2 — Budget Overrun Flag**

- When total expense in a category for current month > budget amount → show **Over budget** chip (warning accent) and include in **Overruns** list on Dashboard.

**A3 — Transfer Atomicity**

- Saving a transfer from **A** to **B** decreases **A** and increases **B** by the same amount in a single operation; if any step fails, balances remain unchanged.

**A4 — Month Navigation**

- Switching month updates all dashboard widgets and tables within 150ms, with animated transitions.

**A5 — Offline Operation**

- App works with **no internet**; closing/reopening retains all data; PWA installable.

**A6 — Backup & Restore**

- Export full dataset to JSON; import restores exact state (idempotent) with conflict options (replace/merge).

---

## 9) Test Plan (MVP)

- **Unit (Vitest):** BudgetEngine (totals, overruns), ReportsEngine (aggregations), EncryptionService (round‑trip).
- **Component:** Forms (validation with Zod), Tables, Chart wrappers.
- **E2E (Playwright):** Add income/expense/transfer; budget copy forward; backup/restore; PWA offline.
- **Perf:** Lighthouse CI budget; interaction timing via Web Vitals.

---

## 10) Project Structure

```
/ hishab
  ├─ src/
  │  ├─ app/ (routes, providers)
  │  ├─ components/ (ui, charts, forms)
  │  ├─ features/
  │  │   ├─ accounts/
  │  │   ├─ budgets/
  │  │   ├─ transactions/
  │  │   ├─ reports/
  │  │   └─ settings/
  │  ├─ domain/ (types, services: BudgetEngine, ReportsEngine)
  │  ├─ data/ (dexie db, repositories)
  │  ├─ styles/ (tailwind, theme tokens)
  │  └─ utils/ (format, dates, crypto)
  ├─ public/ (icons, manifest.json, sw.js)
  ├─ tests/ (e2e)
  └─ package.json
```

---

## 11) Initial Schema (TypeScript types)

```ts
// domain/types.ts
export type AccountType = 'bank'|'bkash'|'cash'|'other';
export interface Account { id: string; name: string; type: AccountType; openingBalance: number; createdAt: string; }
export type CategoryType = 'income'|'expense';
export interface Category { id: string; name: string; type: CategoryType; color?: string; parentId?: string; }
export interface Budget { id: string; month: string; categoryId: string; amount: number; }
export type TxType = 'income'|'expense'|'transfer';
export interface Transaction { id: string; date: string; type: TxType; accountId: string; amount: number; categoryId?: string; notes?: string; tags?: string[]; fromAccountId?: string; toAccountId?: string; }
export interface SavingsGoal { id: string; name: string; targetAmount: number; targetDate?: string; currentAllocated: number; }
export interface Snapshot { id: string; month: string; netWorth: number; totals: { income: number; expense: number; }; byCategory: Array<{categoryId:string; amount:number}>; }
```

---

## 12) Dexie Setup (sketch)

```ts
// data/db.ts
import Dexie, { Table } from 'dexie';
import { Account, Category, Budget, Transaction, SavingsGoal, Snapshot } from '@/domain/types';

export class HishabDB extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  transactions!: Table<Transaction, string>;
  goals!: Table<SavingsGoal, string>;
  snapshots!: Table<Snapshot, string>;
  constructor() {
    super('hishab');
    this.version(1).stores({
      accounts: 'id, name, type',
      categories: 'id, name, type, parentId',
      budgets: 'id, month, categoryId',
      transactions: 'id, date, categoryId, accountId, [date+categoryId]',
      goals: 'id, targetDate',
      snapshots: 'id, month'
    });
  }
}
export const db = new HishabDB();
```

---

## 13) Motion & Chart Implementation Notes

- Wrap charts with a `<ChartCard>` that animates mount/unmount (Framer Motion `AnimatePresence`).
- Defer heavy chart code with dynamic import and code‑split ECharts.
- Animate number counters for KPIs; use reduced‑motion guard.

---

## 14) Seed Data

- **Accounts:** Bank, bKash, Cash (opening balances).
- **Expense Categories:** Food, Transport, Bills, Rent, Education, Health, Shopping, Entertainment, Gifts, Fees.
- **Income Categories:** Salary, Bonus, Interest, Gift, Other.
- **Budgets:** Create monthly budgets for each expense category.

---

## 15) Stories Backlog (MVP)

1. App shell + routing + dark theme
2. Dexie DB + repositories + seed script
3. Accounts CRUD + balance calc
4. Categories CRUD (income/expense)
5. Budgets: month grid + copy from last month
6. Transactions CRUD + transfer flow + keyboard shortcuts
7. Dashboard v1 (net worth, cash flow, top categories, budget burn)
8. Reports page (range picker + charts)
9. Backup/Restore JSON + CSV export
10. Optional encryption at rest
11. PWA install + offline precache
12. E2E tests + perf budgets

---

## 16) Build & Run

```bash
# create project
pnpm create vite hishab --template react-ts
cd hishab
pnpm add tailwindcss postcss autoprefixer @radix-ui/react-icons class-variance-authority clsx tailwind-merge @tanstack/react-router
pnpm add @radix-ui/react-slot lucide-react zod react-hook-form
pnpm add dexie zustand dayjs
pnpm add echarts
pnpm add framer-motion
pnpm add gsap
pnpm add -D eslint prettier vite-plugin-pwa workbox-window vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom playwright husky lint-staged

# init tailwind
npx tailwindcss init -p
# configure PWA plugin or add custom Workbox SW

pnpm dev   # run locally
pnpm build # production build
```

---

## 17) Risks & Mitigations

- **IndexedDB limits/backup:** Provide visible backup reminders; export JSON routinely.
- **Chart bundle size:** Code‑split ECharts; lazy‑load charts.
- **Animation perf:** Keep motion minimal on low‑end devices; respect reduced‑motion.

---

## 18) Roadmap (Post‑MVP Ideas)

- Rule‑based auto‑categorization; quick entry shortcuts.
- Recurring transactions; calendar view.
- Desktop wrapper (Tauri) with encrypted file backups.
- Optional bank import via manual CSV templates.

---

## 19) Definition of Done (per story)

- Code + tests written; accessibility checks; no ESLint errors; Lighthouse pass; UX reviewed; data migrations (if any) safe.

---

### Appendix A — Budget & Reports Math (brief)

- **Budget remaining** = `budget.amount - Σ(expenses in month & category)`
- **Net worth** = Σ(account balances)
- **Cash flow (month)** = Σ(income) − Σ(expense)

### Appendix B — Encryption Sketch

- On enabling encryption: prompt for password → derive key (PBKDF2/argon2, 200k+ iters) → encrypt payloads before writes; store salt & iv alongside records; keep key only in memory.

