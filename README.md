# PACE — AI Running Coach

A mobile-first web app for runners that combines training plan management, daily intelligence, nutrition tracking, and an AI coach into one place.

**Live URL:** https://pace-wheat.vercel.app
**Repo:** https://github.com/ttluu2-1807/pace
**Stack:** Next.js 16 · Supabase · Claude AI · Tailwind CSS · Vercel

---

## What it does

### Daily Brief
The home screen. Every day shows:
- Readiness banner (green/amber/red) based on weekly check-in scores
- Today's planned session with coaching notes explaining why that workout
- Pre-run fuelling recommendation based on workout type and distance
- Action buttons that change based on context (Log Session / Plan a Run / Log Past Session)
- Running icons on day blocks showing which days have workouts scheduled
- Weekly calendar strip with activity/completion indicators
- Tomorrow preview footer

### Training Tab
- Active training plan with phase progress bar (Base → Build → Peak → Taper)
- Weekly volume chart — planned vs actual km per week across the plan
- Week-by-week session list with navigation
- Pause / Complete / Reactivate plan controls
- Plan history showing all past plans
- Create new plan modal (5K / 10K / Half Marathon / Marathon / General Fitness)

### Nutrition Tab
- Daily macro targets (carbs, protein, fat, calories) with progress bars
- Targets adjust based on workout day vs rest day
- Micronutrient tracking (iron, magnesium, sodium, calcium, vitamin D, potassium)
- Food log with running totals
- Search food via OpenFoodFacts database
- Manual food entry with Save to My Foods — saved foods appear at the top of every future search
- Pre-run and post-run fuelling flags

### Analytics Tab
- Weekly check-in form (sleep, energy, soreness, mood, motivation)
- Readiness score history
- Volume and load tracking

### Injury Tab
- Report new injuries with body region, severity, onset type
- Active injury tracking with risk scoring
- Injury-aware daily intelligence (modifies workout recommendations)

### AI Coach
- Floating coach button on every screen
- Context-aware: knows your plan phase, recent workouts, nutrition, injuries
- Powered by Claude (Anthropic)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, server components, server actions) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Claude via Anthropic API |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Icons | Lucide React + React Feather |
| Charts | Recharts |
| State | Zustand |
| Hosting | Vercel |

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/ttluu2-1807/pace.git
cd pace

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

# Run database migrations (see SUPABASE_SETUP.md)

# Start dev server
npm run dev
```

Open http://localhost:3000

---

## Deploying Updates

After any code change:

```bash
cd "/Users/tinluu/Downloads/Duc App/pace"
npx vercel --prod
```

Deploys in ~1 minute. Live at https://pace-wheat.vercel.app

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

---

## Database Migrations

Run in order via Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — core tables (profiles, workouts, training_plans, injuries, weekly_checkins)
2. `supabase/migrations/002_nutrition_food_items.sql` — food item logging
3. `supabase/migrations/003_custom_foods.sql` — saved personal food library
4. `supabase/migrations/004_plan_status.sql` — plan lifecycle status (active/paused/completed/archived)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, onboarding
│   ├── (main)/          # Protected app routes
│   │   ├── dashboard/   # Daily Brief
│   │   ├── training/    # Training plan
│   │   ├── nutrition/   # Food & macro tracking
│   │   ├── analytics/   # Check-ins & scores
│   │   ├── injury/      # Injury management
│   │   └── profile/     # User preferences
│   └── api/
│       ├── food-search/ # OpenFoodFacts proxy
│       └── coach/       # Claude AI endpoint
├── components/
│   ├── dashboard/       # Daily Brief components
│   ├── training/        # Plan & chart components
│   ├── nutrition/       # Food log modal
│   ├── injury/          # Injury components
│   ├── coach/           # AI coach panel
│   ├── layout/          # Nav, sidebar, header
│   └── shared/          # Shared modals
└── lib/
    ├── types/           # TypeScript interfaces
    ├── db.ts            # All Supabase queries
    ├── daily-intelligence.ts     # Alert & coaching engine
    ├── nutrition-intelligence.ts # Fuelling & readiness
    ├── schedule-generator.ts     # Training plan builder
    ├── injury-intelligence.ts    # Risk scoring
    └── claude.ts        # AI coach integration
```
