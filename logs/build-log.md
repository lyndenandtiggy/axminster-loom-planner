# Axminster Loom Planner — Build Log

**Date:** 2026-04-08  
**Builder:** Claude Code (claude-sonnet-4-6)

---

## STEP 1 — Project & Tooling Check

- Next.js 16.2.2 (Turbopack) with React 19.2.4
- Existing root `app/` directory removed; all code placed under `src/`
- tsconfig.json updated: `@/*` path alias now resolves to `./src/*`
- Supabase JS client installed: `@supabase/supabase-js ^2.102.1`
- Read Next.js docs at `node_modules/next/dist/docs/` before writing any code
  - Confirmed: App Router, route handlers via `route.ts`, server components default, `use client` for interactive components

---

## STEP 2 — GitHub Repo

- Remote already configured: `https://github.com/lyndenandtiggy/axminster-loom-planner.git`
- No changes needed

---

## STEP 3 — Supabase

- Created project `axminster-loom-planner` (ref: `mrxgrkdsvvfmpdkeufmz`) under org `rmxpnvftrnimgpueiyvq` (West Europe / London)
- **Note:** IPv6 connection prevented `supabase db push` from working; used Supabase Management API (`https://api.supabase.com/v1/projects/mrxgrkdsvvfmpdkeufmz/database/query`) with service token from system keychain
- SQL migrations successfully applied (all 4 tables: `jobs`, `looms`, `runs`, `run_items`)
- `.env.local` written with URL and keys
- Migration file saved at `supabase/migrations/20260408000001_initial_schema.sql`

---

## STEP 4 — Vercel

- Project auto-detected and linked: `lyndenandtiggys-projects/axminster-loom-planner`
- Environment variables added to Vercel production:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Production deploy: https://axminster-loom-planner.vercel.app

---

## STEP 5 — Application Built

### Files created:

**Types:**
- `src/types/index.ts` — TypeScript interfaces for Job, Loom, Run, RunItem, WidthAllocation, RunScore

**Supabase client:**
- `src/lib/supabase.ts` — Browser client + server client (service role)

**Planning logic:**
- `src/lib/planning/width.ts` — `calculateWidthAllocation()`
- `src/lib/planning/pairing.ts` — `canPair()`, `findBestPairing()`
- `src/lib/planning/changeover.ts` — `estimateSmartCreelChangeover()`, `estimateTraditionalChangeover()`, `classifyChangeover()`
- `src/lib/planning/scoring.ts` — `scoreRun()`

**API Routes:**
- `src/app/api/jobs/route.ts` — GET/POST jobs
- `src/app/api/looms/route.ts` — GET/POST looms
- `src/app/api/runs/route.ts` — GET/POST runs (with join to run_items + jobs)

**App pages:**
- `src/app/layout.tsx` — Root layout with Inter font, dark background
- `src/app/globals.css` — Global CSS with design tokens
- `src/app/page.tsx` — Renders PinLock component
- `src/app/dashboard/page.tsx` — 3-panel dashboard (client component, auth-guarded)

**Components:**
- `src/components/PinLock.tsx` — Full-screen PIN entry (PIN: 1755), number pad, shake animation
- `src/components/JobCard.tsx` — Job card with status badge, priority colour coding
- `src/components/LoomCard.tsx` — Loom card with specs
- `src/components/RunBlock.tsx` — Visual run block with proportional width bars
- `src/components/LoomLane.tsx` — Single loom lane with all its runs
- `src/components/LoomBoard.tsx` — Center panel with all loom lanes + add loom form
- `src/components/JobsPanel.tsx` — Left panel with job list, filters, create form
- `src/components/DetailsPanel.tsx` — Right panel: job details, pairing analysis, run scoring

### UI Design System:
- Background: `#0a0a0f` (very dark navy-black)
- Card: `#12121a`
- Border: `#1e1e2e`
- Accent: `#6366f1` (indigo)
- Text primary: `#e2e8f0`
- Text secondary: `#64748b`
- Success: `#10b981`, Warning: `#f59e0b`, Danger: `#ef4444`
- Font: Inter (via `next/font/google`)

---

## STEP 6 — Quality Gate

- `npm run lint` — Clean (0 errors, 0 warnings after fixes)
- `npx tsc --noEmit` — Clean (0 errors)
- `npm run build` — Clean (Turbopack, compiled successfully in ~1954ms)

---

## STEP 7 — Delivery

- Git commit: `feat: complete Axminster Loom Planner build`
- Pushed to: `https://github.com/lyndenandtiggy/axminster-loom-planner`
- Vercel production: **https://axminster-loom-planner.vercel.app**
- Vercel deployment ID: `dpl_7xpbsuzXeeEfd1HiVLBUE7DMj8Ps`

---

## Issues & Workarounds

1. **IPv6 connection to Supabase DB:** `supabase db push` failed with "no route to host" (IPv6 only). Resolved by using the Supabase Management REST API to run SQL migrations directly.
2. **Root `app/` vs `src/app/` conflict:** Initial project had root `app/` directory. Removed it and placed all code in `src/app/` per the spec.
3. **Stale `.next/dev/types`:** Old `.next` cache referenced deleted root `app/` files. Cleared `.next` directory and reran TypeScript check.
