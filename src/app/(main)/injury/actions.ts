"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createInjury, updateInjury } from "@/lib/db";
import type {
  BodyRegion,
  InjurySeverity,
  InjuryStatus,
  OnsetType,
} from "@/lib/types";

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function reportInjury(data: {
  body_region: BodyRegion;
  condition: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  onset_type: OnsetType;
  notes?: string;
}): Promise<{ error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    await createInjury(userId, data);
    revalidatePath("/injury");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to report injury",
    };
  }
}

export async function changeInjuryStatus(
  injuryId: string,
  status: InjuryStatus
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    await updateInjury(injuryId, { status });
    revalidatePath("/injury");
    return {};
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to update injury status",
    };
  }
}
