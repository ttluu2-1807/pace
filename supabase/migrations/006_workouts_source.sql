-- Migration 006: Add source column to workouts
-- Tracks whether a workout was logged manually or synced from Strava etc.

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual', 'strava', 'garmin', 'apple-health'));
