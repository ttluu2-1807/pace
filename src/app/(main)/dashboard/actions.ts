"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateWorkout, createTrainingPlan } from "@/lib/db";
import type { Workout } from "@/lib/types";

// Utility: format today as YYYY-MM-DD
function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function logWorkoutSession(
  workoutId: string,
  data: {
    actual_duration_minutes?: number;
    actual_distance_km?: number;
    actual_avg_hr?: number;
    notes?: string;
  }
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    await updateWorkout(workoutId, {
      ...data,
      completed: true,
    });
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log session" };
  }
}

export async function modifyWorkout(
  workoutId: string,
  data: {
    title?: string;
    description?: string;
    duration_minutes?: number;
    distance_km?: number;
  }
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    await updateWorkout(workoutId, data);
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to modify workout" };
  }
}

export async function markRestDay(workoutId: string): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    await updateWorkout(workoutId, {
      completed: true,
      notes: "rest day",
    });
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to mark rest day" };
  }
}

export async function createWorkout(
  userId: string,
  data: Partial<Workout>
): Promise<{ id?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: result, error } = await supabase
      .from("workouts")
      .insert({
        ...data,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard");
    return { id: result?.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create workout" };
  }
}

/**
 * Creates an unplanned workout for today and immediately logs it as completed.
 * Used by SessionLogModal when no workout exists for today.
 */
export async function createAndLogWorkout(
  userId: string,
  logData: {
    actual_duration_minutes?: number;
    actual_distance_km?: number;
    actual_avg_hr?: number;
    notes?: string;
  }
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    const supabase = await createClient();
    const today = todayDateString();

    const { data: created, error: createError } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        date: today,
        type: "easy",
        title: "Unplanned Run",
        description: "",
        duration_minutes: logData.actual_duration_minutes ?? 0,
        completed: false,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError || !created) {
      throw new Error(createError?.message ?? "Failed to create workout");
    }

    await updateWorkout(created.id, {
      ...logData,
      completed: true,
    });

    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log session" };
  }
}
