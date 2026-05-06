// Strava API client for PACE
// Handles OAuth token exchange, refresh, and activity fetching

export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number // unix timestamp
  athlete: {
    id: number
    firstname: string
    lastname: string
    profile: string
  }
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string // ISO 8601
  distance: number // metres
  moving_time: number // seconds
  elapsed_time: number // seconds
  total_elevation_gain: number
  average_speed: number // m/s
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  suffer_score?: number
  trainer: boolean
  manual: boolean
}

const STRAVA_API_BASE = "https://www.strava.com/api/v3"
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"

export function getStravaAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all",
  })
  return `https://www.strava.com/oauth/authorize?${params.toString()}`
}

export async function exchangeStravaCode(
  code: string
): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Strava token exchange failed: ${err}`)
  }
  return res.json()
}

export async function refreshStravaToken(
  refreshToken: string
): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Strava token refresh failed: ${err}`)
  }
  return res.json()
}

export async function fetchStravaActivities(
  accessToken: string,
  afterTimestamp?: number, // unix timestamp — fetch only activities after this date
  perPage = 50
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: String(perPage),
    ...(afterTimestamp ? { after: String(afterTimestamp) } : {}),
  })

  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Strava activities fetch failed: ${err}`)
  }
  return res.json()
}

// Classify a Strava run into a PACE workout type
// Must match workouts.type CHECK constraint: easy|long|tempo|interval|strides|hill-repeats|cross-training|recovery-walk|rest
export function classifyStravaRun(
  activity: StravaActivity
): "easy" | "long" | "tempo" | "interval" {
  const distanceKm = activity.distance / 1000
  const avgPaceMinPerKm =
    activity.moving_time > 0 && activity.distance > 0
      ? activity.moving_time / 60 / (activity.distance / 1000)
      : 6

  // Long run: over 14km
  if (distanceKm >= 14) return "long"

  // Interval: short and very fast (under 4:30/km)
  if (avgPaceMinPerKm < 4.5 && distanceKm < 10) return "interval"

  // Tempo: sustained fast pace (under 5:00/km) and 5km+
  if (avgPaceMinPerKm < 5.0 && distanceKm >= 5) return "tempo"

  return "easy"
}

// Convert a Strava activity to a PACE-compatible workout object
export function stravaActivityToWorkout(
  activity: StravaActivity,
  userId: string,
  planId?: string
) {
  const runType = classifyStravaRun(activity)
  const distanceKm = Math.round((activity.distance / 1000) * 100) / 100
  const durationMinutes = Math.round(activity.moving_time / 60)

  const typeLabels: Record<string, string> = {
    easy: "Easy Run",
    long: "Long Run",
    tempo: "Tempo Run",
    intervals: "Interval Session",
    race: "Race",
  }

  return {
    user_id: userId,
    plan_id: planId ?? null,
    date: activity.start_date.split("T")[0], // YYYY-MM-DD
    type: runType,
    title: activity.name || typeLabels[runType],
    distance_km: distanceKm,
    duration_minutes: durationMinutes,
    completed: true,
    actual_distance_km: distanceKm,
    actual_duration_minutes: durationMinutes,
    actual_avg_hr: activity.average_heartrate ?? null,
    notes: `Synced from Strava · ${distanceKm}km in ${durationMinutes} min`,
    source: "strava",
  }
}
