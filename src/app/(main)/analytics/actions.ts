"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertWeeklyCheckin } from "@/lib/db";

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function saveWeeklyCheckin(
  weekStart: Date,
  data: {
    sleep_score?: number;
    energy_level?: number;
    motivation_level?: number;
    hrv_score?: number;
    notes?: string;
  }
): Promise<{ error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    await upsertWeeklyCheckin(userId, weekStart, data);
    revalidatePath("/analytics");
    return {};
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to save weekly check-in",
    };
  }
}
