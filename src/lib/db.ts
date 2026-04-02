// ============================================================
// PACE — Server-side Supabase data fetching/mutation functions
// All functions use the server Supabase client and run server-side only.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type {
  UserProfile,
  TrainingPlan,
  Workout,
  NutritionDay,
  NutritionFoodItem,
  Injury,
  CustomFood,
} from "@/lib/types";

// Utility: format a Date as YYYY-MM-DD (local date)
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ----------------------------------------------------------------
// Weekly Check-in type (not yet in types/index.ts)
// ----------------------------------------------------------------
export interface WeeklyCheckin {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD
  sleep_score?: number;
  hrv_score?: number;
  energy_level?: number;
  motivation_level?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ================================================================
// Profile
// ================================================================

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function upsertProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("profiles")
    .upsert({ ...data, id: userId, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as UserProfile;
}

// ================================================================
// Training Plans
// ================================================================

export async function getActiveTrainingPlan(
  userId: string
): Promise<TrainingPlan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return data as TrainingPlan;
}

export async function getAllTrainingPlans(
  userId: string
): Promise<TrainingPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as TrainingPlan[];
}

export async function updatePlanStatus(
  planId: string,
  status: import("@/lib/types").PlanStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const active = status === "active";
  const { error } = await supabase
    .from("training_plans")
    .update({ status, active })
    .eq("id", planId);

  if (error) return { error: error.message };
  return {};
}

export async function createTrainingPlan(
  userId: string,
  data: Partial<TrainingPlan>
): Promise<TrainingPlan> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("training_plans")
    .insert({ ...data, user_id: userId, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as TrainingPlan;
}

// ================================================================
// Workouts
// ================================================================

export async function getWorkoutsForWeek(
  userId: string,
  weekStart: Date
): Promise<Workout[]> {
  const supabase = await createClient();
  const start = toDateString(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const endStr = toDateString(end);

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", endStr)
    .order("date", { ascending: true });

  if (error) return [];
  return (data ?? []) as Workout[];
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Workout;
}

export async function updateWorkout(
  id: string,
  data: Partial<Workout>
): Promise<Workout> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("workouts")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as Workout;
}

export async function getTodaysWorkout(
  userId: string,
  date: Date = new Date()
): Promise<Workout | null> {
  const supabase = await createClient();
  const dateStr = toDateString(date);

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .single();

  if (error || !data) return null;
  return data as Workout;
}

// ================================================================
// Nutrition
// ================================================================

export async function getNutritionDay(
  userId: string,
  date: Date
): Promise<NutritionDay | null> {
  const supabase = await createClient();
  const dateStr = toDateString(date);

  const { data, error } = await supabase
    .from("nutrition_days")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .single();

  if (error || !data) return null;
  return data as NutritionDay;
}

export async function upsertNutritionDay(
  userId: string,
  date: Date,
  data: Partial<NutritionDay>
): Promise<NutritionDay> {
  const supabase = await createClient();
  const dateStr = toDateString(date);

  const { data: result, error } = await supabase
    .from("nutrition_days")
    .upsert({ ...data, user_id: userId, date: dateStr })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as NutritionDay;
}

// ================================================================
// Injuries
// ================================================================

export async function getInjuries(userId: string): Promise<Injury[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("injuries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as Injury[];
}

export async function createInjury(
  userId: string,
  data: Partial<Injury>
): Promise<Injury> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("injuries")
    .insert({
      ...data,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as Injury;
}

export async function updateInjury(
  id: string,
  data: Partial<Injury>
): Promise<Injury> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("injuries")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as Injury;
}

// ================================================================
// Weekly Check-ins
// ================================================================

export async function getWeeklyCheckin(
  userId: string,
  weekStart: Date
): Promise<WeeklyCheckin | null> {
  const supabase = await createClient();
  const weekStartStr = toDateString(weekStart);

  const { data, error } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStartStr)
    .single();

  if (error || !data) return null;
  return data as WeeklyCheckin;
}

export async function upsertWeeklyCheckin(
  userId: string,
  weekStart: Date,
  data: Partial<WeeklyCheckin>
): Promise<WeeklyCheckin> {
  const supabase = await createClient();
  const weekStartStr = toDateString(weekStart);

  const { data: result, error } = await supabase
    .from("weekly_checkins")
    .upsert({
      ...data,
      user_id: userId,
      week_start: weekStartStr,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result as WeeklyCheckin;
}

// ----------------------------------------------------------------
// Aliases — convenience wrappers used by the intelligence engine
// to keep call-sites consistent across the dashboard.
// These delegate to the implementations above; no duplication.
// ----------------------------------------------------------------

export async function getWorkoutForDate(
  userId: string,
  date: Date
): Promise<Workout | null> {
  return getTodaysWorkout(userId, date);
}

export async function getNutritionDayForDate(
  userId: string,
  date: Date
): Promise<NutritionDay | null> {
  return getNutritionDay(userId, date);
}

// ================================================================
// Nutrition Food Items
// ================================================================

export async function addFoodItem(
  userId: string,
  item: {
    date: Date;
    food_name: string;
    quantity_g: number;
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    iron_mg?: number;
    magnesium_mg?: number;
    sodium_mg?: number;
    calcium_mg?: number;
    vitamin_d_mcg?: number;
    potassium_mg?: number;
    source?: string;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const dateStr = toDateString(item.date);

  const { error: insertError } = await supabase
    .from("nutrition_food_items")
    .insert({
      user_id: userId,
      date: dateStr,
      food_name: item.food_name,
      quantity_g: item.quantity_g,
      calories: item.calories,
      carbs_g: item.carbs_g,
      protein_g: item.protein_g,
      fat_g: item.fat_g,
      iron_mg: item.iron_mg ?? null,
      magnesium_mg: item.magnesium_mg ?? null,
      sodium_mg: item.sodium_mg ?? null,
      calcium_mg: item.calcium_mg ?? null,
      vitamin_d_mcg: item.vitamin_d_mcg ?? null,
      potassium_mg: item.potassium_mg ?? null,
      source: item.source ?? "openfoodfacts",
    });

  if (insertError) return { error: insertError.message };

  // Re-aggregate all food items for the day and upsert nutrition_days
  try {
    await _aggregateAndUpsertNutritionDay(userId, item.date);
  } catch {
    // Non-fatal: aggregation failure should not block the item insert
  }

  return {};
}

export async function getFoodItemsForDay(
  userId: string,
  date: Date
): Promise<NutritionFoodItem[]> {
  const supabase = await createClient();
  const dateStr = toDateString(date);

  const { data, error } = await supabase
    .from("nutrition_food_items")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as NutritionFoodItem[];
}

export async function deleteFoodItem(
  userId: string,
  itemId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Fetch the item first so we know its date for re-aggregation
  const { data: item, error: fetchError } = await supabase
    .from("nutrition_food_items")
    .select("date")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !item) return { error: "Item not found" };

  const { error: deleteError } = await supabase
    .from("nutrition_food_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  // Re-aggregate remaining items for that day
  try {
    const itemDate = new Date(item.date);
    await _aggregateAndUpsertNutritionDay(userId, itemDate);
  } catch {
    // Non-fatal
  }

  return {};
}

// ================================================================
// Coach Context
// ================================================================

export async function getCoachContext(userId: string): Promise<import("@/lib/claude").CoachContext> {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = toDateString(today);

  // Monday of current week
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = toDateString(weekStart);
  const weekEndStr = toDateString(today);

  // 14 days ago for recent workouts
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const fourteenDaysAgoStr = toDateString(fourteenDaysAgo);

  const [profile, activeInjuries, activePlan, recentWorkoutsRaw, todayWorkout, weekNutritionRows] =
    await Promise.all([
      getProfile(userId),
      (async () => {
        const { data } = await supabase
          .from("injuries")
          .select("body_region,condition,severity,status")
          .eq("user_id", userId)
          .in("status", ["current", "recovering"]);
        return (data ?? []) as Array<{ body_region: string; condition: string; severity: string; status: string }>;
      })(),
      getActiveTrainingPlan(userId),
      (async () => {
        const { data } = await supabase
          .from("workouts")
          .select("date,type,title,completed,actual_distance_km,actual_duration_minutes,notes")
          .eq("user_id", userId)
          .gte("date", fourteenDaysAgoStr)
          .lte("date", todayStr)
          .order("date", { ascending: false })
          .limit(14);
        return (data ?? []) as Array<{
          date: string;
          type: string;
          title: string;
          completed: boolean;
          actual_distance_km: number | null;
          actual_duration_minutes: number | null;
          notes: string | null;
        }>;
      })(),
      getTodaysWorkout(userId, today),
      (async () => {
        const { data } = await supabase
          .from("nutrition_days")
          .select("carbs_g,protein_g,total_calories")
          .eq("user_id", userId)
          .gte("date", weekStartStr)
          .lte("date", weekEndStr);
        return (data ?? []) as Array<{ carbs_g: number | null; protein_g: number | null; total_calories: number | null }>;
      })(),
    ]);

  // Compute weekly nutrition averages
  let thisWeekNutrition: import("@/lib/claude").CoachContext["thisWeekNutrition"] = null;
  if (weekNutritionRows.length > 0) {
    const daysLogged = weekNutritionRows.length;
    const avgCarbs = Math.round(weekNutritionRows.reduce((s, r) => s + (r.carbs_g ?? 0), 0) / daysLogged);
    const avgProtein = Math.round(weekNutritionRows.reduce((s, r) => s + (r.protein_g ?? 0), 0) / daysLogged);
    const avgCalories = Math.round(weekNutritionRows.reduce((s, r) => s + (r.total_calories ?? 0), 0) / daysLogged);
    thisWeekNutrition = { avg_carbs_g: avgCarbs, avg_protein_g: avgProtein, avg_calories: avgCalories, days_logged: daysLogged };
  }

  return {
    profile: {
      name: profile?.name ?? null,
      age: profile?.age ?? null,
      sex: profile?.sex ?? null,
      weight_kg: profile?.weight_kg ?? null,
      height_cm: profile?.height_cm ?? null,
      weekly_run_frequency: profile?.weekly_run_frequency ?? 3,
      longest_recent_run_km: profile?.longest_recent_run_km ?? 0,
      primary_goal: profile?.primary_goal ?? "health",
      coaching_voice: profile?.coaching_voice ?? "balanced",
    },
    activeInjuries,
    currentPlan: activePlan
      ? {
          name: activePlan.name,
          race_type: activePlan.race_type ?? null,
          race_date: activePlan.race_date ?? null,
          current_phase: activePlan.current_phase,
          current_week: activePlan.current_week,
          total_weeks: activePlan.total_weeks,
          weekly_volume_km: activePlan.weekly_volume_km,
        }
      : null,
    recentWorkouts: recentWorkoutsRaw,
    todayWorkout: todayWorkout
      ? {
          type: todayWorkout.type,
          title: todayWorkout.title,
          distance_km: todayWorkout.distance_km ?? null,
          duration_minutes: todayWorkout.duration_minutes,
          completed: todayWorkout.completed,
        }
      : null,
    thisWeekNutrition,
  };
}

// Internal helper: sum all food items for a day and upsert nutrition_days
async function _aggregateAndUpsertNutritionDay(
  userId: string,
  date: Date
): Promise<void> {
  const supabase = await createClient();
  const dateStr = toDateString(date);

  const { data: items } = await supabase
    .from("nutrition_food_items")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateStr);

  const rows = (items ?? []) as NutritionFoodItem[];

  function sumNullable(key: keyof NutritionFoodItem): number | null {
    const values = rows
      .map((r) => r[key])
      .filter((v): v is number => v != null && typeof v === "number");
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0)
      : null;
  }

  const totalCalories = rows.reduce((s, r) => s + (r.calories ?? 0), 0);
  const totalCarbs = rows.reduce((s, r) => s + (r.carbs_g ?? 0), 0);
  const totalProtein = rows.reduce((s, r) => s + (r.protein_g ?? 0), 0);
  const totalFat = rows.reduce((s, r) => s + (r.fat_g ?? 0), 0);

  await supabase.from("nutrition_days").upsert(
    {
      user_id: userId,
      date: dateStr,
      total_calories: totalCalories,
      carbs_g: totalCarbs,
      protein_g: totalProtein,
      fat_g: totalFat,
      iron_mg: sumNullable("iron_mg"),
      magnesium_mg: sumNullable("magnesium_mg"),
      sodium_mg: sumNullable("sodium_mg"),
      calcium_mg: sumNullable("calcium_mg"),
      vitamin_d_mcg: sumNullable("vitamin_d_mcg"),
      potassium_mg: sumNullable("potassium_mg"),
    },
    { onConflict: "user_id,date" }
  );
}

// ================================================================
// Weekly Volume — for training overview chart
// ================================================================

export interface WeekVolume {
  week: number;
  plannedKm: number;
  actualKm: number;
}

export async function getWeeklyVolumes(
  userId: string,
  planCreatedAt: string,
  totalWeeks: number
): Promise<WeekVolume[]> {
  const supabase = await createClient();

  // Plan starts on the Monday of the week it was created
  const planCreated = new Date(planCreatedAt);
  const dayOfWeek = planCreated.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const planStart = new Date(planCreated);
  planStart.setDate(planCreated.getDate() + diffToMonday);
  planStart.setHours(0, 0, 0, 0);

  const planEnd = new Date(planStart);
  planEnd.setDate(planStart.getDate() + totalWeeks * 7 - 1);

  const startStr = toDateString(planStart);
  const endStr = toDateString(planEnd);

  const { data, error } = await supabase
    .from("workouts")
    .select("date, distance_km, actual_distance_km, completed, type")
    .eq("user_id", userId)
    .gte("date", startStr)
    .lte("date", endStr)
    .neq("type", "rest");

  if (error || !data) return [];

  // Group by plan week number
  const volumeMap = new Map<number, { planned: number; actual: number }>();

  for (const w of data) {
    const workoutDate = new Date(w.date + "T00:00:00");
    const msFromStart = workoutDate.getTime() - planStart.getTime();
    const weekNum = Math.floor(msFromStart / (7 * 24 * 60 * 60 * 1000)) + 1;

    if (weekNum < 1 || weekNum > totalWeeks) continue;

    if (!volumeMap.has(weekNum)) {
      volumeMap.set(weekNum, { planned: 0, actual: 0 });
    }
    const entry = volumeMap.get(weekNum)!;
    entry.planned += w.distance_km ?? 0;
    if (w.completed) {
      entry.actual += w.actual_distance_km ?? w.distance_km ?? 0;
    }
  }

  // Build result array for all weeks up to the current one
  const today = new Date();
  const msFromPlanStart = today.getTime() - planStart.getTime();
  const currentPlanWeek = Math.min(
    Math.floor(msFromPlanStart / (7 * 24 * 60 * 60 * 1000)) + 1,
    totalWeeks
  );

  const result: WeekVolume[] = [];
  for (let w = 1; w <= currentPlanWeek; w++) {
    const entry = volumeMap.get(w) ?? { planned: 0, actual: 0 };
    result.push({
      week: w,
      plannedKm: Math.round(entry.planned * 10) / 10,
      actualKm: Math.round(entry.actual * 10) / 10,
    });
  }

  return result;
}

// ================================================================
// Custom Foods
// ================================================================

export async function getCustomFoods(userId: string): Promise<CustomFood[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_foods")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as CustomFood[];
}

export async function saveCustomFood(
  userId: string,
  food: {
    food_name: string;
    calories_per_100g: number;
    carbs_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    iron_mg_per_100g?: number;
    magnesium_mg_per_100g?: number;
    sodium_mg_per_100g?: number;
    calcium_mg_per_100g?: number;
    vitamin_d_mcg_per_100g?: number;
    potassium_mg_per_100g?: number;
    default_serving_g?: number;
  }
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_foods")
    .insert({
      user_id: userId,
      food_name: food.food_name,
      calories_per_100g: food.calories_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      protein_per_100g: food.protein_per_100g,
      fat_per_100g: food.fat_per_100g,
      iron_mg_per_100g: food.iron_mg_per_100g ?? null,
      magnesium_mg_per_100g: food.magnesium_mg_per_100g ?? null,
      sodium_mg_per_100g: food.sodium_mg_per_100g ?? null,
      calcium_mg_per_100g: food.calcium_mg_per_100g ?? null,
      vitamin_d_mcg_per_100g: food.vitamin_d_mcg_per_100g ?? null,
      potassium_mg_per_100g: food.potassium_mg_per_100g ?? null,
      default_serving_g: food.default_serving_g ?? 100,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function deleteCustomFood(
  userId: string,
  foodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_foods")
    .delete()
    .eq("id", foodId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return {};
}
