"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  let error;
  try {
    ({ error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    }));
  } catch {
    return redirect(`/signup?error=${encodeURIComponent("Cannot connect to authentication service. Please check your Supabase credentials in .env.local.")}`);
  }

  if (error) {
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch {
    return redirect(`/login?error=${encodeURIComponent("Cannot connect to authentication service. Please check your Supabase credentials in .env.local.")}`);
  }

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const profileData = {
    id: user.id,
    email: user.email ?? "",
    name: formData.get("name") as string,
    age: parseInt(formData.get("age") as string, 10),
    sex: formData.get("sex") as "male" | "female" | "other",
    weight_kg: parseFloat(formData.get("weight_kg") as string),
    height_cm: parseFloat(formData.get("height_cm") as string),
    weekly_run_frequency: parseInt(
      formData.get("weekly_run_frequency") as string,
      10
    ),
    longest_recent_run_km: parseFloat(
      formData.get("longest_recent_run_km") as string
    ),
    primary_goal: formData.get("primary_goal") as
      | "health"
      | "race"
      | "weight"
      | "return-from-injury",
    depth_preference: formData.get("depth_preference") as
      | "simple"
      | "balanced"
      | "full",
    coaching_voice: formData.get("coaching_voice") as
      | "encouraging"
      | "clinical"
      | "direct"
      | "balanced",
    onboarding_phase: 2 as const,
    is_pro: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(profileData);

  if (error) {
    return redirect(
      `/onboarding?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateProfilePreferences(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const updates: Record<string, string> = {};
  const depthPref = formData.get("depth_preference");
  const coachingVoice = formData.get("coaching_voice");

  if (depthPref) updates.depth_preference = depthPref as string;
  if (coachingVoice) updates.coaching_voice = coachingVoice as string;

  if (Object.keys(updates).length > 0) {
    await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  revalidatePath("/profile");
}
