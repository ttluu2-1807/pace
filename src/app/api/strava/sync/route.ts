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
      return NextResponse.json({ error: "Token refresh failed" }, { status: 401 })
    }
  }

  // Fetch activities since last sync (or last 365 days if first sync)
  const isFirstSync = !connection.last_synced_at
  const afterDate = connection.last_synced_at
    ? new Date(connection.last_synced_at)
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const afterTimestamp = Math.floor(afterDate.getTime() / 1000)

  let activities
  try {
    activities = await fetchStravaActivities(accessToken, afterTimestamp, 100)
  } catch (err) {
    console.error("[Strava sync] Activity fetch failed:", err)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 502 })
  }

  // Filter to runs only
  const RUN_SPORT_TYPES = new Set(["Run", "TrailRun", "VirtualRun", "Treadmill"])
  const runs = activities.filter(
    (a) => RUN_SPORT_TYPES.has(a.sport_type) || RUN_SPORT_TYPES.has(a.type)
  )

  // Fetch already-synced activity IDs to avoid duplicates
  const { data: alreadySynced } = await supabase
    .from("strava_synced_activities")
    .select("strava_activity_id")
    .eq("user_id", user.id)

  const syncedIds = new Set((alreadySynced ?? []).map((r) => r.strava_activity_id))

  // Fetch active plan — fallback to active=true if status column not yet migrated
  const { data: activePlan } = await supabase
    .from("training_plans")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle()

  let imported = 0
  let matched = 0  // planned workouts updated with Strava actuals
  let skipped = 0

  for (const activity of runs) {
    if (syncedIds.has(activity.id)) {
      skipped++
      continue
    }

    const activityDate = activity.start_date.split("T")[0]
    const distanceKm = Math.round((activity.distance / 1000) * 100) / 100
    const durationMinutes = Math.round(activity.moving_time / 60)

    // ── KEY IMPROVEMENT: match against a planned workout on this date ──
    // Look for an incomplete planned workout on the same date
    const { data: plannedWorkout } = await supabase
      .from("workouts")
      .select("id, type, title, plan_id")
      .eq("user_id", user.id)
      .eq("date", activityDate)
      .eq("completed", false)
      .eq("source", "manual")
      .maybeSingle()

    if (plannedWorkout) {
      // Update the planned workout with Strava actuals — mark it done
      const { error: updateError } = await supabase
        .from("workouts")
        .update({
          completed: true,
          actual_distance_km: distanceKm,
          actual_duration_minutes: durationMinutes,
          actual_avg_hr: activity.average_heartrate ?? null,
          notes: `Completed via Strava · ${distanceKm}km in ${durationMinutes} min`,
          source: "strava",
        })
        .eq("id", plannedWorkout.id)

      if (!updateError) {
        await supabase.from("strava_synced_activities").upsert({
          user_id: user.id,
          strava_activity_id: activity.id,
          workout_id: plannedWorkout.id,
        })
        matched++
        continue
      }
    }

    // No planned workout — check if we already have a Strava import for this date
    const { data: existingStrava } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", activityDate)
      .eq("source", "strava")
      .maybeSingle()

    if (existingStrava) {
      await supabase.from("strava_synced_activities").upsert({
        user_id: user.id,
        strava_activity_id: activity.id,
        workout_id: existingStrava.id,
      })
      skipped++
      continue
    }

    // No planned workout and no existing import — create new workout
    const planId =
      activePlan &&
      activityDate >= activePlan.start_date &&
      activityDate <= (activePlan.end_date ?? "9999-12-31")
        ? activePlan.id
        : null

    const workout = stravaActivityToWorkout(activity, user.id, planId ?? undefined)

    const { data: newWorkout, error: workoutError } = await supabase
      .from("workouts")
      .insert(workout)
      .select("id")
      .single()

    if (workoutError) {
      console.error("[Strava sync] Insert workout failed:", workoutError)
      continue
    }

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
    matched,  // planned workouts completed via Strava
    skipped,
    total: runs.length,
    totalActivities: activities.length,
    isFirstSync,
    activityTypes: [...new Set(activities.map((a) => a.sport_type || a.type))],
  })
}
