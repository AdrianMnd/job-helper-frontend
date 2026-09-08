# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # tsc typecheck + vite build
npm run test         # Unit tests (Vitest + Testing Library), single run
npm run test:e2e     # Playwright e2e
```

There is no lint script or ESLint config in this repo.

Single test file / single test:

```bash
npx vitest run src/components/StatusTimeline.test.tsx
npx vitest run -t "nombre del test"
npx playwright test e2e/core-flows.spec.ts
```

Unit tests live next to the source file as `*.test.tsx`/`*.test.ts` (e.g. `src/lib/api.ts` → `src/lib/api.test.ts`). Test descriptions and assertions in this codebase are written in Spanish — match that style in new tests.

`npm run test:e2e` needs a sibling checkout of `job-helper-backend` at `../job-helper-backend` (see `playwright.config.ts`) — it starts both the backend (port 3001) and this frontend (port 5173) as webServers. The backend is started with `E2E_MOCK_GEMINI=true`, which substitutes real Gemini calls with a fixed response so the suite doesn't depend on the external API.

## Architecture

This is the frontend of a job-application-tracking assistant. It talks to a separate Express/PostgreSQL backend (`job-helper-backend`) via `VITE_API_URL` (set in `.env`, copy from `.env.example`).

**Auth**: `AuthContext` (`src/context/AuthContext.tsx`) holds a JWT in `localStorage` under the key `token` and exposes `login`/`register`/`logout`. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) reads `useAuth().token` and renders `<Navigate to="/login">` when absent, otherwise an `<Outlet>`. All authenticated pages are nested under `ProtectedRoute` → `Layout` in `App.tsx`'s route tree.

**API client**: every network call goes through `apiFetch<T>(path, options)` in `src/lib/api.ts`, which prefixes `VITE_API_URL`, attaches `Authorization: Bearer <token>` from `localStorage` automatically, and throws on non-2xx responses with the backend's error message. Don't call `fetch` directly for JSON endpoints — use `apiFetch`. (The one exception is multipart uploads, e.g. image/PDF extraction in `NewApplicationDialog.tsx`, which builds its own `fetch` call with `FormData` since `apiFetch` always sets `Content-Type: application/json`.)

**Status model**: `src/lib/statuses.ts` is the single source of truth for the six application states (`SAVED → APPLIED → INTERVIEW → OFFER`, plus `REJECTED`/`WITHDRAWN`) and their display label/color. `getStatusMeta(value)` is used everywhere a status needs to be rendered (Kanban columns, `StatusTimeline`, metrics) instead of hardcoding labels/colors per component, and falls back gracefully for a status value the frontend doesn't recognize yet.

**Domain pages** (`src/pages/`), each owning its own data fetching via `apiFetch` and local `useState`/`useEffect` (no global state library / no React Query):
- `KanbanBoard` — drag-and-drop board using `@dnd-kit/core`; columns are one per `STATUSES` entry, dropping a card `PATCH`es its status.
- `ApplicationDetail` — the largest page; owns CV/cover-letter generation (calls the backend's Gemini-backed `/generate` endpoint), the version history, the diff comparison (via `CvDiff.tsx` using the `diff` package), Word/PDF export, the "Apply" dialog flow, and status history.
- `JobSearch` — Adzuna-backed job search with Gemini query translation; search state persists to `sessionStorage` across reloads.
- `Metrics` — conversion funnel + average time-per-stage, rendered with Recharts.
- `Profile` — skills editor; suggestions come from the static list in `src/lib/commonSkills.ts` (deliberately not an API call).

**UI components**: `src/components/ui/` is shadcn/ui, but built on **Base UI**, not Radix — composition uses the `render` prop (e.g. `<DialogTrigger render={<Button/>}>`) instead of Radix's `asChild`. Keep that in mind when adding new shadcn components (`npx shadcn@latest add <name>`) or writing tests against them: `DialogContent`/`SheetContent`/etc. render into a portal appended to `document.body`, not into the container `render()` returns — query with `screen`/`document`, not the RTL `container`.

**PWA / installed-app behavior**: `useDoubleBackToExit` (`src/hooks/useDoubleBackToExit.ts`) implements "press back twice to exit" but only takes effect when running in standalone/TWA mode (`display-mode: standalone` or `navigator.standalone`) — in a normal browser tab, back navigation is left alone. `vite-plugin-pwa` (configured in `vite.config.ts`) handles the manifest and service worker.

**Deployment**: Vercel. `vercel.json` rewrites all non-static paths to `index.html` so React Router routes work on direct load/refresh (e.g. `/applications/:id`).
