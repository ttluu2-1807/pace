"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTrainingPlan, getProfile, updatePlanStatus, getActiveTrainingPlan } from "@/lib/db";
import { generateTrainingSchedule } from "@/lib/schedule-generator";

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function createPlan(data: {
  name: string;
  race_type?: "5k" | "10k" | "half-marathon" | "marathon" | "general";
  race_date?: string;
  total_weeks: number;
}): Promise<{ error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();

    // Pause existing active plan (don't delete — keep history)
    const supabase = await createClient();
    await supabase
      .from("training_plans")
      .update({ active: false, status: "paused" })
      .eq("user_id", userId)
      .eq("active", true);

    // Create the new plan
    const plan = await createTrainingPlan(userId, {
      ...data,
      current_phase: "base",
      current_week: 1,
      weekly_volume_km: 0,
      active: true,
      status: "active",
    });

    // Fetch user profile to get weekly_run_frequency
    const profile = await getProfile(userId);
    const weeklyFrequency = profile?.weekly_run_frequency ?? 3;

    // Generate the full schedule and bulk-insert
    const workouts = generateTrainingSchedule(plan, weeklyFrequency);

    if (workouts.length > 0) {
      const { error: insertError } = await supabase
        .from("workouts")
        .insert(workouts);
      if (insertError) throw new Error(insertError.message);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create plan" };
  }

  redirect("/training");
}

export async function pausePlanAction(planId: string): Promise<{ error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    const plan = await getActiveTrainingPlan(userId);
    if (!plan || plan.id !== planId) return { error: "Plan not found" };
    return await updatePlanStatus(planId, "paused");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to pause plan" };
  }
}

export async function completePlanAction(planId: string): Promise<{ error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    const plan = await getActiveTrainingPlan(userId);
    if (!plan || plan.id !== planId) return { error: "Plan not found" };
    return await updatePlanStatus(planId, "completed");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete plan" };
  }
}

export async function reactivatePlanAction(planId: string): Promise<{ error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    // Deactivate current active plan first
    const supabase = await createClient();
    await supabase
      .from("training_plans")
      .update({ active: false, status: "paused" })
      .eq("user_id", userId)
      .eq("active", true)
      .neq("id", planId);
    return await updatePlanStatus(planId, "active");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reactivate plan" };
  }
}
