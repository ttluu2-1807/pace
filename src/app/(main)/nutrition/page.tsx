import { createClient } from "@/lib/supabase/server";
import {
  getNutritionDay,
  getFoodItemsForDay,
  getProfile,
  getTodaysWorkout,
} from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LogNutritionModal } from "@/components/nutrition/LogNutritionModal";
import { deleteFoodItemAction } from "@/app/(main)/nutrition/actions";
import type { NutritionFoodItem } from "@/lib/types";

// ----------------------------------------------------------------
// Micronutrient target configuration
// ----------------------------------------------------------------
interface MicroTarget {
  label: string;
  key: keyof Pick<
    {
      iron_mg: number;
      magnesium_mg: number;
      sodium_mg: number;
      calcium_mg: number;
      vitamin_d_mcg: number;
      potassium_mg: number;
    },
    | "iron_mg"
    | "magnesium_mg"
    | "sodium_mg"
    | "calcium_mg"
    | "vitamin_d_mcg"
    | "potassium_mg"
  >;
  targetMale: number;
  targetFemale: number;
  targetOther: number;
  unit: string;
  note: string;
}

const MICRO_TARGETS: MicroTarget[] = [
  {
    label: "Iron",
    key: "iron_mg",
    targetMale: 8,
    targetFemale: 18,
    targetOther: 11,
    unit: "mg",
    note: "Critical for oxygen transport — runners lose iron through foot-strike haemolysis",
  },
  {
    label: "Magnesium",
    key: "magnesium_mg",
    targetMale: 420,
    targetFemale: 320,
    targetOther: 370,
    unit: "mg",
    note: "Helps prevent muscle cramps and supports sleep quality",
  },
  {
    label: "Sodium",
    key: "sodium_mg",
    targetMale: 1500,
    targetFemale: 1500,
    targetOther: 1500,
    unit: "mg",
    note: "Essential for hydration — especially important on long run days",
  },
  {
    label: "Calcium",
    key: "calcium_mg",
    targetMale: 1000,
    targetFemale: 1000,
    targetOther: 1000,
    unit: "mg",
    note: "Bone density — key for stress fracture prevention",
  },
  {
    label: "Vitamin D",
    key: "vitamin_d_mcg",
    targetMale: 15,
    targetFemale: 15,
    targetOther: 15,
    unit: "mcg",
    note: "Supports bone health and immune function — most runners are deficient",
  },
  {
    label: "Potassium",
    key: "potassium_mg",
    targetMale: 3500,
    targetFemale: 3500,
    targetOther: 3500,
    unit: "mg",
    note: "Electrolyte balance and muscle function",
  },
];

// ----------------------------------------------------------------
// Inline delete button (server action wrapper)
// ----------------------------------------------------------------
async function DeleteFoodButton({
  userId,
  itemId,
  foodName,
}: {
  userId: string;
  itemId: string;
  foodName: string;
}) {
  async function handleDelete() {
    "use server";
    await deleteFoodItemAction(userId, itemId);
  }
  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="text-xs font-medium text-destructive hover:text-destructive/80"
        aria-label={`Remove ${foodName}`}
      >
        Remove
      </button>
    </form>
  );
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------
export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date();

  // Parallel fetches
  const [nutritionDay, foodItems, profile, todaysWorkout] = await Promise.all([
    getNutritionDay(user.id, today),
    getFoodItemsForDay(user.id, today),
    getProfile(user.id),
    getTodaysWorkout(user.id, today),
  ]);

  // ----------------------------------------------------------------
  // Macro targets — derived from user profile when available
  // ----------------------------------------------------------------
  const weightKg = profile?.weight_kg ?? 70;
  const isRestDay =
    !todaysWorkout || todaysWorkout.type === "rest" || todaysWorkout.type === "recovery-walk";

  const carbTargetPerKg = isRestDay ? 4 : 6; // mid-point of range
  const carbTarget =
    nutritionDay?.carb_target_g ?? Math.round(weightKg * carbTargetPerKg);
  const proteinTarget =
    nutritionDay?.protein_target_g ?? Math.round(weightKg * 1.6);
  const fatTarget = Math.round(weightKg * 1);
  const caloriesTarget =
    Math.round(carbTarget * 4 + proteinTarget * 4 + fatTarget * 9);

  const carbs = nutritionDay?.carbs_g ?? 0;
  const protein = nutritionDay?.protein_g ?? 0;
  const fat = nutritionDay?.fat_g ?? 0;
  const calories = nutritionDay?.total_calories ?? 0;

  const macros = [
    { label: "Carbs", current: carbs, target: carbTarget, unit: "g" },
    { label: "Protein", current: protein, target: proteinTarget, unit: "g" },
    { label: "Fat", current: fat, target: fatTarget, unit: "g" },
    {
      label: "Calories",
      current: calories,
      target: caloriesTarget,
      unit: "kcal",
    },
  ];

  const isEmpty = !nutritionDay && foodItems.length === 0;

  // ----------------------------------------------------------------
  // Micronutrient values
  // ----------------------------------------------------------------
  const sex = profile?.sex ?? "other";

  function getMicroActual(key: MicroTarget["key"]): number {
    const val = nutritionDay?.[key];
    return typeof val === "number" ? val : 0;
  }

  function getMicroTarget(m: MicroTarget): number {
    if (sex === "male") return m.targetMale;
    if (sex === "female") return m.targetFemale;
    return m.targetOther;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
          <p className="text-muted-foreground text-sm">
            Fuel for today&apos;s training
          </p>
        </div>
        <LogNutritionModal
          userId={user.id}
          date={today}
          initialFoodItems={foodItems}
        />
      </div>

      {/* ============================================================
          Section 1 — Macro Progress
          ============================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Macro Targets
            </CardTitle>
            {nutritionDay ? (
              <Badge variant="secondary">
                {nutritionDay.pre_run_fuelled && nutritionDay.post_run_recovery
                  ? "Pre + Post Fuelled"
                  : nutritionDay.pre_run_fuelled
                  ? "Pre-Run Fuelled"
                  : nutritionDay.post_run_recovery
                  ? "Post-Run Done"
                  : "Logged"}
              </Badge>
            ) : (
              <Badge variant="outline">No data yet</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEmpty && (
            <p className="text-sm text-muted-foreground pb-1">
              No nutrition logged today. Targets based on your profile
              ({weightKg}kg,{" "}
              {isRestDay ? "rest day" : "training day"}).
            </p>
          )}
          {macros.map((macro) => (
            <div key={macro.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{macro.label}</span>
                <span className="text-muted-foreground">
                  {macro.current} / {macro.target} {macro.unit}
                </span>
              </div>
              <Progress
                value={
                  macro.target > 0
                    ? Math.min((macro.current / macro.target) * 100, 100)
                    : 0
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ============================================================
          Section 2 — Micronutrients for Runners
          ============================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Micronutrients for Runners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MICRO_TARGETS.map((m) => {
            const actual = getMicroActual(m.key);
            const target = getMicroTarget(m);
            const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
            const isZero = actual === 0;
            return (
              <div key={m.key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{m.label}</span>
                    {isZero && (
                      <span className="text-xs text-amber-500 font-medium">
                        none logged
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {actual} / {target} {m.unit}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{m.note}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ============================================================
          Section 3 — Today's Food Log
          ============================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Today&apos;s Food Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {foodItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No food logged yet. Use &ldquo;Add Food&rdquo; to search or enter
              items manually.
            </p>
          ) : (
            <div className="space-y-2">
              {foodItems.map((item: NutritionFoodItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity_g}g &middot; {item.calories} kcal
                      &middot; C {item.carbs_g}g &middot; P {item.protein_g}
                      g &middot; F {item.fat_g}g
                    </p>
                  </div>
                  <DeleteFoodButton
                    userId={user.id}
                    itemId={item.id}
                    foodName={item.food_name}
                  />
                </div>
              ))}

              {/* Day total */}
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <p className="font-medium mb-1">Day total</p>
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
                  <div>
                    <p className="font-medium">{Math.round(calories)}</p>
                    <p className="text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <p className="font-medium">{Math.round((carbs ?? 0) * 10) / 10}g</p>
                    <p className="text-muted-foreground">carbs</p>
                  </div>
                  <div>
                    <p className="font-medium">
                      {Math.round((protein ?? 0) * 10) / 10}g
                    </p>
                    <p className="text-muted-foreground">protein</p>
                  </div>
                  <div>
                    <p className="font-medium">{Math.round((fat ?? 0) * 10) / 10}g</p>
                    <p className="text-muted-foreground">fat</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================
          Section 4 — Session Fuelling (unchanged)
          ============================================================ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Session Fuelling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm">Pre-Run</h4>
              <p className="text-sm text-muted-foreground">
                Banana + oats — aim for 60g carbs 1-2 hours before
              </p>
            </div>
            {nutritionDay && (
              <Badge
                variant={nutritionDay.pre_run_fuelled ? "default" : "outline"}
                className="ml-2 shrink-0"
              >
                {nutritionDay.pre_run_fuelled ? "Done" : "Pending"}
              </Badge>
            )}
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm">During Run</h4>
            <p className="text-sm text-muted-foreground">
              Water only (run under 60 min) or gels for longer efforts
            </p>
          </div>
          <Separator />
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm">Post-Run Recovery</h4>
              <p className="text-sm text-muted-foreground">
                20-40g protein + 1-1.2g/kg carbs within 30 minutes
              </p>
            </div>
            {nutritionDay && (
              <Badge
                variant={
                  nutritionDay.post_run_recovery ? "default" : "outline"
                }
                className="ml-2 shrink-0"
              >
                {nutritionDay.post_run_recovery ? "Done" : "Pending"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
