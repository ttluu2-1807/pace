"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertNutritionDay, addFoodItem, deleteFoodItem, saveCustomFood, getCustomFoods, deleteCustomFood } from "@/lib/db";
import type { CustomFood } from "@/lib/types";

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function logNutrition(
  userId: string,
  date: Date,
  data: {
    total_calories?: number;
    carbs_g?: number;
    protein_g?: number;
    fat_g?: number;
    pre_run_fuelled: boolean;
    post_run_recovery: boolean;
  }
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    await upsertNutritionDay(userId, date, {
      ...data,
      source: "manual",
    });
    revalidatePath("/nutrition");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to log nutrition",
    };
  }
}

export async function addFoodItemAction(
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
  try {
    await getAuthenticatedUserId();
    const result = await addFoodItem(userId, item);
    if (result.error) return result;
    revalidatePath("/nutrition");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to add food item",
    };
  }
}

export async function deleteFoodItemAction(
  userId: string,
  itemId: string
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    const result = await deleteFoodItem(userId, itemId);
    if (result.error) return result;
    revalidatePath("/nutrition");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete food item",
    };
  }
}

export async function getCustomFoodsAction(
  userId: string
): Promise<CustomFood[]> {
  try {
    await getAuthenticatedUserId();
    return await getCustomFoods(userId);
  } catch {
    return [];
  }
}

export async function saveCustomFoodAction(
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
    default_serving_g?: number;
  }
): Promise<{ id?: string; error?: string }> {
  try {
    await getAuthenticatedUserId();
    return await saveCustomFood(userId, food);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save food",
    };
  }
}

export async function deleteCustomFoodAction(
  userId: string,
  foodId: string
): Promise<{ error?: string }> {
  try {
    await getAuthenticatedUserId();
    return await deleteCustomFood(userId, foodId);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete saved food",
    };
  }
}
