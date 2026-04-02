@AGENTS.md

# PACE — Claude Code Context

## What this project is

PACE is a mobile-first AI running coach web app. It helps runners manage training plans, track nutrition, monitor injuries, and get daily coaching intelligence — all in one place.

**Live:** https://pace-wheat.vercel.app
**Repo:** https://github.com/ttluu2-1807/pace
**Local dev:** http://localhost:3000 (run `npm run dev`)

---

## Deployment rule

After every batch of code changes, run:
```bash
cd "/Users/tinluu/Downloads/Duc App/pace" && npx vercel --prod
```
Always tell the user when this has been done and confirm the live URL.

---

## Stack

- **Next.js 16** — App Router, server components, server actions (`"use server"`)
- **Supabase** — Postgres DB + Auth. All queries in `src/lib/db.ts`
- **Claude AI** — AI coach via `src/lib/claude.ts` and `/api/coach` route
- **Tailwind CSS v4** + shadcn/ui components
- **React Feather** — icons (e.g. Activity icon for workout indicators)
- **Recharts** — weekly volume chart on Training tab
- **Zustand** — client state (`src/lib/stores/user-store.ts`)

---

## Architecture rules

- Pages are **async server components** — data fetched server-side
- Mutations use **server actions** in `actions.ts` files co-located with pages
- Client interactivity is isolated to modal components marked `"use client"`
- `searchParams` is a Promise in Next.js 15+ — always `await searchParams`
- All Supabase calls go through `src/lib/db.ts` — never query Supabase directly in components

---

## Key files

| File | Purpose |
|---|---|
| `src/lib/db.ts` | All database queries and mutations |
| `src/lib/types/index.ts` | All TypeScript types |
| `src/lib/daily-intelligence.ts` | Alert engine — 16 rules for coaching notes and workout adjustments |
| `src/lib/nutrition-intelligence.ts` | Readiness scoring, fuelling plans, workout "why" text |
| `src/lib/schedule-generator.ts` | Generates full workout schedule from plan config |
| `src/lib/injury-intelligence.ts` | Injury risk scoring |
| `src/lib/claude.ts` | Claude API wrapper + CoachContext type |
| `src/app/(main)/dashboard/page.tsx` | Daily Brief — main hub, most complex page |
| `src/app/(main)/training/page.tsx` | Training tab with volume chart and plan history |
| `src/components/nutrition/LogNutritionModal.tsx` | Food logging with saved foods |
| `src/components/dashboard/DaySelector.tsx` | Day strip with running icons |
| `src/components/dashboard/WeeklyCalendar.tsx` | 7-day calendar strip |

---

## Database migrations

Run in order via Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_nutrition_food_items.sql`
3. `supabase/migrations/003_custom_foods.sql` — custom_foods table
4. `supabase/migrations/004_plan_status.sql` — adds status column to training_plans

---

## Workout types

`easy | long | tempo | interval | strides | hill-repeats | cross-training | recovery-walk | rest`

## Training phases

`base | build | peak | taper | recovery`

## Plan status values

`active | paused | completed | archived`

---

## Current feature state (as of last update)

### Implemented
- User onboarding (profile setup)
- Training plan creation with auto-generated schedule
- Multi-plan support: pause, complete, reactivate plans; plan history view
- Daily Brief with readiness banner, alerts, session card, fuelling cards
- Daily intelligence engine (16 rules) driving alerts and workout adjustments
- Day selector with running icons (react-feather Activity) for scheduled runs
- Weekly calendar strip with activity icons
- Session logging (actual duration, distance, HR, notes)
- Workout modification and rest day conversion
- Nutrition tracking: search (OpenFoodFacts), manual entry, macro/micro progress bars
- Save to My Foods: saved foods appear in search results filtered by query
- Weekly volume chart (planned vs actual km) on Training tab
- Injury reporting, severity tracking, risk scoring
- Weekly check-in form (readiness scores)
- AI coach panel (Claude-powered, context-aware)
- Mobile-first responsive layout with bottom nav
- Vercel deployment with auto-deploy workflow

### Pending / known gaps
- Supabase auth redirect URLs need adding for production (see SUPABASE_SETUP.md)
- `plan_id` not stored on workouts table — volume chart uses date-range inference
- No Garmin/Strava/Apple Health integration yet
- No push notifications
- No offline support
