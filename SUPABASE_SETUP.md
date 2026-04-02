# Supabase Setup — PACE

## Existing Project

**Project URL:** https://waflhizgfcsjhztduakj.supabase.co
**Region:** (check Supabase dashboard)

Credentials are stored in `.env.local` (local) and in Vercel environment variables (production).

---

## Running Migrations

All migrations live in `supabase/migrations/`. Run them in order via the Supabase SQL Editor:

**Supabase → SQL Editor → New query → paste → Run**

### 001_initial_schema.sql
Core tables:
- `profiles` — user profile (age, weight, goals, coaching preferences)
- `training_plans` — plan metadata (race type, phase, week, total weeks)
- `workouts` — individual workout records (planned + actual data)
- `injuries` — injury history and current status
- `weekly_checkins` — readiness self-assessment scores

### 002_nutrition_food_items.sql
- `nutrition_food_items` — individual food log entries per day
- `nutrition_days` — aggregated daily macro/micronutrient totals

### 003_custom_foods.sql
- `custom_foods` — user's personal saved food library (per-100g values)
- RLS policy: users can only access their own saved foods

### 004_plan_status.sql
- Adds `status` column to `training_plans`
- Values: `active` | `paused` | `completed` | `archived`
- Syncs with existing `active` boolean

---

## Auth Configuration

For the live app to work, add the production URL to Supabase:

1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://pace-wheat.vercel.app`
3. **Redirect URLs:** `https://pace-wheat.vercel.app/**`
4. Save

---

## Row Level Security

All tables have RLS enabled. Each table has a policy ensuring users can only read/write their own data via `auth.uid() = user_id`.

---

## Local Development Setup

```bash
# 1. Copy env file
cp .env.example .env.local

# 2. Fill in your values
NEXT_PUBLIC_SUPABASE_URL=https://waflhizgfcsjhztduakj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
ANTHROPIC_API_KEY=<your anthropic key>

# 3. Run migrations in Supabase SQL Editor (in order)

# 4. Start dev server
npm run dev
```

---

## Key Tables Reference

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | User settings | weight_kg, weekly_run_frequency, primary_goal |
| `training_plans` | Plan metadata | race_type, current_phase, current_week, total_weeks, status |
| `workouts` | All workouts | date, type, completed, actual_distance_km, actual_duration_minutes |
| `nutrition_food_items` | Food log | food_name, quantity_g, calories, carbs_g, protein_g, fat_g |
| `nutrition_days` | Daily totals | total_calories, carbs_g, protein_g, pre_run_fuelled |
| `custom_foods` | Saved foods | food_name, calories_per_100g, carbs_per_100g, default_serving_g |
| `injuries` | Injury tracking | body_region, severity, status, onset_type |
| `weekly_checkins` | Readiness scores | sleep_score, energy_level, motivation_level |
