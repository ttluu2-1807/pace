import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  fetchStravaActivities,
  refreshStravaToken,
  stravaActivityToWorkout,
} from "@/lib/strava"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Load stored Strava connection
  const { data: connection, error: connError } = await supabase
    .from("strava_connections")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (connError || !connection) {
    return NextResponse.json({ error: "No Strava connection" }, { status: 404 })
  }

  // Refresh token if expired
  let accessToken = connection.access_token
  if (new Date(connection.expires_at) <= new Date()) {
    try {
      const refreshed = await refreshStravaToken(connection.refresh_token)
      accessToken = refreshed.access_token

      await supabase
        .from("strava_connections")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
    } catch (err) {
      console.error("[Strava sync] Token refresh failed:", err)
      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      )
    }
  }

  // Fetch activities since last sync (or last 90 days if first sync)
  const afterDate = connection.last_synced_at
    ? new Date(connection.last_synced_at)
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const afterTimestamp = Math.floor(afterDate.getTime() / 1000)

  let activities
  try {
    activities = await fetchStravaActivities(accessToken, afterTimestamp, 100)
  } catch (err) {
    console.error("[Strava sync] Activity fetch failed:", err)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 502 }
    )
  }

  // Filter to runs only
  const runs = activities.filter(
    (a) =>
      a.type === "Run" ||
      a.type === "TrailRun" ||
      a.sport_type === "Run" ||
      a.sport_type === "TrailRun"
  )

  // Fetch already-synced activity IDs to avoid duplicates
  const { data: alreadySynced } = await supabase
    .from("strava_synced_activities")
    .select("strava_activity_id")
    .eq("user_id", user.id)

  const syncedIds = new Set(
    (alreadySynced ?? []).map((r) => r.strava_activity_id)
  )

  // Fetch active plan (to associate workouts if date falls within plan)
  const { data: activePlan } = await supabase
    .from("training_plans")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  let imported = 0
  let skipped = 0

  for (const activity of runs) {
    if (syncedIds.has(activity.id)) {
      skipped++
      continue
    }

    // Check if a workout already exists on this date (manually logged)
    const activityDate = activity.start_date.split("T")[0]
    const { data: existing } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", activityDate)
      .eq("source", "strava")
      .maybeSingle()

    if (existing) {
      // Already have a Strava workout for this day — mark as synced and skip
      await supabase.from("strava_synced_activities").upsert({
        user_id: user.id,
        strava_activity_id: activity.id,
        workout_id: existing.id,
      })
      skipped++
      continue
    }

    // Determine if activity falls within active plan date range
    const planId =
      activePlan &&
      activityDate >= activePlan.start_date &&
      activityDate <= (activePlan.end_date ?? "9999-12-31")
        ? activePlan.id
        : null

    const workout = stravaActivityToWorkout(activity, user.id, planId ?? undefined)

    // Insert workout
    const { data: newWorkout, error: workoutError } = await supabase
      .from("workouts")
      .insert(workout)
      .select("id")
      .single()

    if (workoutError) {
      console.error("[Strava sync] Insert workout failed:", workoutError)
      continue
    }

    // Record synced activity
    await supabase.from("strava_synced_activities").insert({
      user_id: user.id,
      strava_activity_id: activity.id,
      workout_id: newWorkout.id,
    })

    imported++
  }

  // Update last_synced_at
  await supabase
    .from("strava_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", user.id)

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    total: runs.length,
  })
}
