-- Migration 005: Strava integration
-- Stores OAuth tokens and sync state for connected Strava accounts

CREATE TABLE IF NOT EXISTS strava_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strava_athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  athlete_name TEXT,
  athlete_firstname TEXT,
  athlete_profile_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(strava_athlete_id)
);

-- RLS
ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own strava connection"
  ON strava_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava connection"
  ON strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strava connection"
  ON strava_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava connection"
  ON strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Track which Strava activities have been synced to avoid duplicates
CREATE TABLE IF NOT EXISTS strava_synced_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strava_activity_id BIGINT NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, strava_activity_id)
);

ALTER TABLE strava_synced_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own synced activities"
  ON strava_synced_activities FOR ALL
  USING (auth.uid() = user_id);
