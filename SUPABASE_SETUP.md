# Supabase Setup — PACE

## Step 1: Create a Supabase project
1. Go to https://supabase.com → Sign in → New project
2. Choose a name, password, and region → Create project (takes ~1 min)

## Step 2: Get your credentials
1. In your project: **Settings → API**
2. Copy **Project URL** and **anon public** key

## Step 3: Add credentials to `.env.local`
Open `pace/.env.local` and replace the placeholder values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 4: Run the database migration
1. In your Supabase project: **SQL Editor → New query**
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

## Step 5: Restart the dev server
```bash
cd pace
npm run dev
```

You can now create an account at http://localhost:3000/signup
