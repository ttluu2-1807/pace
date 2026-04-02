"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addFoodItemAction,
  deleteFoodItemAction,
  logNutrition,
  getCustomFoodsAction,
  saveCustomFoodAction,
  deleteCustomFoodAction,
} from "@/app/(main)/nutrition/actions";
import type { NutritionFoodItem, CustomFood } from "@/lib/types";
import type { FoodSearchResult } from "@/app/api/food-search/route";
import { Bookmark, Check, Trash2 } from "react-feather";

interface Props {
  userId: string;
  date: Date;
  initialFoodItems?: NutritionFoodItem[];
}

// ----------------------------------------------------------------
// Small helper: scale a per-100g value to an arbitrary quantity
// ----------------------------------------------------------------
function scale(per100g: number | null, quantityG: number): number | null {
  if (per100g === null) return null;
  return Math.round((per100g * quantityG) / 100);
}
function scaleFloat(per100g: number | null, quantityG: number): number | null {
  if (per100g === null) return null;
  return Math.round(((per100g * quantityG) / 100) * 10) / 10;
}

// Convert a saved CustomFood into a FoodSearchResult for display
function customFoodToResult(cf: CustomFood): FoodSearchResult {
  return {
    id: `custom-${cf.id}`,
    name: cf.food_name,
    brand: "My Foods",
    servingSizeG: cf.default_serving_g,
    per100g: {
      calories: cf.calories_per_100g,
      carbs_g: cf.carbs_per_100g,
      protein_g: cf.protein_per_100g,
      fat_g: cf.fat_per_100g,
      iron_mg: cf.iron_mg_per_100g ?? null,
      magnesium_mg: cf.magnesium_mg_per_100g ?? null,
      sodium_mg: cf.sodium_mg_per_100g ?? null,
      calcium_mg: cf.calcium_mg_per_100g ?? null,
      vitamin_d_mcg: cf.vitamin_d_mcg_per_100g ?? null,
      potassium_mg: cf.potassium_mg_per_100g ?? null,
    },
  };
}

// ----------------------------------------------------------------
// Spinner
// ----------------------------------------------------------------
function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
    </div>
  );
}

// ----------------------------------------------------------------
// FoodResultRow — shows one search result with an Add button
// ----------------------------------------------------------------
function FoodResultRow({
  result,
  isSaved,
  onAdd,
  onDeleteSaved,
}: {
  result: FoodSearchResult;
  isSaved?: boolean;
  onAdd: (result: FoodSearchResult, quantityG: number) => void;
  onDeleteSaved?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [qty, setQty] = useState(result.servingSizeG);

  const scaled = {
    calories: scale(result.per100g.calories, qty) ?? 0,
    carbs_g: scaleFloat(result.per100g.carbs_g, qty) ?? 0,
    protein_g: scaleFloat(result.per100g.protein_g, qty) ?? 0,
    fat_g: scaleFloat(result.per100g.fat_g, qty) ?? 0,
  };

  return (
    <div className="rounded-md border p-3 text-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium truncate">{result.name}</p>
            {isSaved && (
              <Check size={12} className="text-primary shrink-0" strokeWidth={2.5} />
            )}
          </div>
          {result.brand && (
            <p className="text-xs text-muted-foreground truncate">{result.brand}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {scaled.calories} kcal &middot; C {scaled.carbs_g}g &middot; P{" "}
            {scaled.protein_g}g &middot; F {scaled.fat_g}g
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isSaved && onDeleteSaved && (
            <button
              onClick={onDeleteSaved}
              className="p-1 text-muted-foreground hover:text-destructive"
              aria-label="Remove from My Foods"
            >
              <Trash2 size={13} />
            </button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Cancel" : "Add"}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="flex items-center gap-2 pt-1">
          <Label htmlFor={`qty-${result.id}`} className="shrink-0 text-xs">
            Quantity (g)
          </Label>
          <Input
            id={`qty-${result.id}`}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="h-8 w-24 text-sm"
          />
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              onAdd(result, qty);
              setExpanded(false);
            }}
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Main modal
// ----------------------------------------------------------------
export function LogNutritionModal({
  userId,
  date,
  initialFoodItems = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"search" | "manual">("search");

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom (saved) foods
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [isSavingFood, setIsSavingFood] = useState(false);

  // Food log (local optimistic copy)
  const [foodItems, setFoodItems] = useState<NutritionFoodItem[]>(initialFoodItems);

  // Pending transitions
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Manual entry state
  const formRef = useRef<HTMLFormElement>(null);
  const [saveToMyFoods, setSaveToMyFoods] = useState(false);

  // Load common foods on mount / open
  useEffect(() => {
    if (open && query === "") {
      setIsSearching(true);
      fetch("/api/food-search")
        .then((r) => r.json())
        .then((data: FoodSearchResult[]) => {
          setSearchResults(data);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }
  }, [open, query]);

  // Load custom foods when modal opens
  useEffect(() => {
    if (open) {
      getCustomFoodsAction(userId).then(setCustomFoods);
    }
  }, [open, userId]);

  // Sync food items when modal opens
  useEffect(() => {
    if (open) {
      setFoodItems(initialFoodItems);
    }
  }, [open, initialFoodItems]);

  // Debounced search
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setIsSearching(true);
      fetch("/api/food-search")
        .then((r) => r.json())
        .then((data: FoodSearchResult[]) => setSearchResults(data))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
      return;
    }
    debounceRef.current = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/food-search?q=${encodeURIComponent(val.trim())}`)
        .then((r) => r.json())
        .then((data: FoodSearchResult[]) => setSearchResults(data))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);
  }, []);

  function handleAddFood(result: FoodSearchResult, quantityG: number) {
    const ratio = quantityG / 100;
    const item: Omit<NutritionFoodItem, "id" | "user_id" | "created_at"> = {
      date: date.toISOString().slice(0, 10),
      food_name: result.name,
      quantity_g: quantityG,
      calories: Math.round(result.per100g.calories * ratio),
      carbs_g: Math.round(result.per100g.carbs_g * ratio * 10) / 10,
      protein_g: Math.round(result.per100g.protein_g * ratio * 10) / 10,
      fat_g: Math.round(result.per100g.fat_g * ratio * 10) / 10,
      iron_mg:
        result.per100g.iron_mg != null
          ? Math.round(result.per100g.iron_mg * ratio * 10) / 10
          : null,
      magnesium_mg:
        result.per100g.magnesium_mg != null
          ? Math.round(result.per100g.magnesium_mg * ratio * 10) / 10
          : null,
      sodium_mg:
        result.per100g.sodium_mg != null
          ? Math.round(result.per100g.sodium_mg * ratio * 10) / 10
          : null,
      calcium_mg:
        result.per100g.calcium_mg != null
          ? Math.round(result.per100g.calcium_mg * ratio * 10) / 10
          : null,
      vitamin_d_mcg:
        result.per100g.vitamin_d_mcg != null
          ? Math.round(result.per100g.vitamin_d_mcg * ratio * 10) / 10
          : null,
      potassium_mg:
        result.per100g.potassium_mg != null
          ? Math.round(result.per100g.potassium_mg * ratio * 10) / 10
          : null,
      source: "openfoodfacts",
    };

    startTransition(async () => {
      const result2 = await addFoodItemAction(userId, {
        date,
        food_name: item.food_name,
        quantity_g: item.quantity_g,
        calories: item.calories,
        carbs_g: item.carbs_g,
        protein_g: item.protein_g,
        fat_g: item.fat_g,
        iron_mg: item.iron_mg ?? undefined,
        magnesium_mg: item.magnesium_mg ?? undefined,
        sodium_mg: item.sodium_mg ?? undefined,
        calcium_mg: item.calcium_mg ?? undefined,
        vitamin_d_mcg: item.vitamin_d_mcg ?? undefined,
        potassium_mg: item.potassium_mg ?? undefined,
        source: item.source,
      });
      if (result2.error) {
        setError(result2.error);
      } else {
        setError(null);
        setFoodItems((prev) => [
          ...prev,
          {
            ...item,
            id: `tmp-${Date.now()}`,
            user_id: userId,
            created_at: new Date().toISOString(),
            source: "openfoodfacts" as const,
          },
        ]);
      }
    });
  }

  function handleDeleteFood(itemId: string) {
    startTransition(async () => {
      const result = await deleteFoodItemAction(userId, itemId);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setFoodItems((prev) => prev.filter((f) => f.id !== itemId));
      }
    });
  }

  function handleDeleteCustomFood(foodId: string) {
    startTransition(async () => {
      // Extract real UUID from id prefixed with "custom-"
      const realId = foodId.replace("custom-", "");
      await deleteCustomFoodAction(userId, realId);
      setCustomFoods((prev) => prev.filter((f) => f.id !== realId));
    });
  }

  function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const foodName = (fd.get("food_name") as string)?.trim() || "Manual entry";
    const quantity_g = Number(fd.get("quantity_g") || 100);
    const calories = Number(fd.get("total_calories") || 0);
    const carbs_g = Number(fd.get("carbs_g") || 0);
    const protein_g = Number(fd.get("protein_g") || 0);
    const fat_g = Number(fd.get("fat_g") || 0);
    const iron_mg = fd.get("iron_mg") ? Number(fd.get("iron_mg")) : undefined;
    const magnesium_mg = fd.get("magnesium_mg")
      ? Number(fd.get("magnesium_mg"))
      : undefined;
    const sodium_mg = fd.get("sodium_mg")
      ? Number(fd.get("sodium_mg"))
      : undefined;
    const calcium_mg = fd.get("calcium_mg")
      ? Number(fd.get("calcium_mg"))
      : undefined;
    const vitamin_d_mcg = fd.get("vitamin_d_mcg")
      ? Number(fd.get("vitamin_d_mcg"))
      : undefined;
    const pre_run_fuelled = fd.get("pre_run_fuelled") === "on";
    const post_run_recovery = fd.get("post_run_recovery") === "on";

    startTransition(async () => {
      // Add as a food item
      const addResult = await addFoodItemAction(userId, {
        date,
        food_name: foodName,
        quantity_g,
        calories,
        carbs_g,
        protein_g,
        fat_g,
        iron_mg,
        magnesium_mg,
        sodium_mg,
        calcium_mg,
        vitamin_d_mcg,
        source: "manual",
      });

      // Also upsert session fuelling flags
      await logNutrition(userId, date, {
        total_calories: calories,
        carbs_g,
        protein_g,
        fat_g,
        pre_run_fuelled,
        post_run_recovery,
      });

      // Save to My Foods if toggled — store as per-100g values
      if (saveToMyFoods && quantity_g > 0) {
        setIsSavingFood(true);
        const ratio = 100 / quantity_g;
        const saved = await saveCustomFoodAction(userId, {
          food_name: foodName,
          calories_per_100g: Math.round(calories * ratio),
          carbs_per_100g: Math.round(carbs_g * ratio * 10) / 10,
          protein_per_100g: Math.round(protein_g * ratio * 10) / 10,
          fat_per_100g: Math.round(fat_g * ratio * 10) / 10,
          iron_mg_per_100g: iron_mg != null ? Math.round(iron_mg * ratio * 100) / 100 : undefined,
          magnesium_mg_per_100g: magnesium_mg != null ? Math.round(magnesium_mg * ratio * 10) / 10 : undefined,
          sodium_mg_per_100g: sodium_mg != null ? Math.round(sodium_mg * ratio * 10) / 10 : undefined,
          calcium_mg_per_100g: calcium_mg != null ? Math.round(calcium_mg * ratio * 10) / 10 : undefined,
          vitamin_d_mcg_per_100g: vitamin_d_mcg != null ? Math.round(vitamin_d_mcg * ratio * 100) / 100 : undefined,
          default_serving_g: quantity_g,
        });
        if (!saved.error) {
          // Refresh custom foods list
          getCustomFoodsAction(userId).then(setCustomFoods);
        }
        setIsSavingFood(false);
      }

      if (addResult.error) {
        setError(addResult.error);
      } else {
        setError(null);
        formRef.current?.reset();
        setSaveToMyFoods(false);
        setFoodItems((prev) => [
          ...prev,
          {
            id: `tmp-${Date.now()}`,
            user_id: userId,
            date: date.toISOString().slice(0, 10),
            food_name: foodName,
            quantity_g,
            calories,
            carbs_g,
            protein_g,
            fat_g,
            iron_mg: iron_mg ?? null,
            magnesium_mg: magnesium_mg ?? null,
            sodium_mg: sodium_mg ?? null,
            calcium_mg: calcium_mg ?? null,
            vitamin_d_mcg: vitamin_d_mcg ?? null,
            potassium_mg: null,
            source: "manual",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    });
  }

  // Totals
  const totals = foodItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0),
      carbs_g: acc.carbs_g + (item.carbs_g ?? 0),
      protein_g: acc.protein_g + (item.protein_g ?? 0),
      fat_g: acc.fat_g + (item.fat_g ?? 0),
    }),
    { calories: 0, carbs_g: 0, protein_g: 0, fat_g: 0 }
  );

  const customFoodResults = customFoods.map(customFoodToResult);
  const customFoodIds = new Set(customFoodResults.map((r) => r.id));

  // When searching, filter saved foods by name match so they appear at the top
  const visibleCustomFoods = query
    ? customFoodResults.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase())
      )
    : customFoodResults;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Add Food</Button>} />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Food</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-md bg-muted p-1 mb-2">
          <button
            className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
              tab === "search"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("search")}
          >
            Search Food
          </button>
          <button
            className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
              tab === "manual"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("manual")}
          >
            Manual Entry
          </button>
        </div>

        {/* ---- SEARCH TAB ---- */}
        {tab === "search" && (
          <div className="space-y-3">
            <Input
              placeholder="Search foods, e.g. banana, chicken, oats..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              autoFocus
            />

            {/* My saved foods — always shown, filtered by query when searching */}
            {visibleCustomFoods.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Bookmark size={11} />
                  My Foods
                </p>
                <div className="space-y-1.5">
                  {visibleCustomFoods.map((r) => (
                    <FoodResultRow
                      key={r.id}
                      result={r}
                      isSaved
                      onAdd={handleAddFood}
                      onDeleteSaved={() => handleDeleteCustomFood(r.id)}
                    />
                  ))}
                </div>
                {/* Only show the divider when no query — search results provide their own context */}
                {!query && (
                  <div className="border-t border-border pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Common Foods</p>
                  </div>
                )}
              </div>
            )}

            {isSearching ? (
              <Spinner />
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {searchResults.filter((r) => !customFoodIds.has(r.id)).length === 0 && visibleCustomFoods.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No results found. Try a different search term.
                  </p>
                ) : (
                  searchResults
                    .filter((r) => !customFoodIds.has(r.id))
                    .map((r) => (
                      <FoodResultRow
                        key={r.id}
                        result={r}
                        onAdd={handleAddFood}
                      />
                    ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- MANUAL TAB ---- */}
        {tab === "manual" && (
          <form ref={formRef} onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="food_name">Food name</Label>
              <Input
                id="food_name"
                name="food_name"
                placeholder="e.g. Homemade pasta"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quantity_g">Quantity (g)</Label>
                <Input
                  id="quantity_g"
                  name="quantity_g"
                  type="number"
                  min={1}
                  placeholder="100"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="total_calories">Calories (kcal)</Label>
                <Input
                  id="total_calories"
                  name="total_calories"
                  type="number"
                  min={0}
                  placeholder="e.g. 400"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="carbs_g">Carbs (g)</Label>
                <Input
                  id="carbs_g"
                  name="carbs_g"
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="protein_g">Protein (g)</Label>
                <Input
                  id="protein_g"
                  name="protein_g"
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fat_g">Fat (g)</Label>
                <Input
                  id="fat_g"
                  name="fat_g"
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>

            <p className="text-xs font-medium text-muted-foreground pt-1">
              Micronutrients (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="iron_mg" className="text-xs">
                  Iron (mg)
                </Label>
                <Input
                  id="iron_mg"
                  name="iron_mg"
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="magnesium_mg" className="text-xs">
                  Magnesium (mg)
                </Label>
                <Input
                  id="magnesium_mg"
                  name="magnesium_mg"
                  type="number"
                  min={0}
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sodium_mg" className="text-xs">
                  Sodium (mg)
                </Label>
                <Input
                  id="sodium_mg"
                  name="sodium_mg"
                  type="number"
                  min={0}
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="calcium_mg" className="text-xs">
                  Calcium (mg)
                </Label>
                <Input
                  id="calcium_mg"
                  name="calcium_mg"
                  type="number"
                  min={0}
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vitamin_d_mcg" className="text-xs">
                  Vitamin D (mcg)
                </Label>
                <Input
                  id="vitamin_d_mcg"
                  name="vitamin_d_mcg"
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Label className="text-sm font-medium">Session Fuelling</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="pre_run_fuelled"
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  Pre-run fuelled
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="post_run_recovery"
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  Post-run recovery nutrition taken
                </label>
              </div>
            </div>

            {/* Save to My Foods toggle */}
            <div className="rounded-lg border border-input bg-muted/30 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bookmark size={14} className={saveToMyFoods ? "text-primary" : "text-muted-foreground"} />
                <div>
                  <p className="text-sm font-medium">Save to My Foods</p>
                  <p className="text-xs text-muted-foreground">Quickly re-add this food next time</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={saveToMyFoods}
                onClick={() => setSaveToMyFoods((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
                  saveToMyFoods ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    saveToMyFoods ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isPending || isSavingFood} className="w-full">
              {isPending || isSavingFood ? "Saving..." : "Add Food Item"}
            </Button>
          </form>
        )}

        {/* ---- TODAY'S LOG ---- */}
        {foodItems.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Today&apos;s log</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.food_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity_g}g &middot; {item.calories} kcal &middot; C{" "}
                      {item.carbs_g}g &middot; P {item.protein_g}g &middot; F{" "}
                      {item.fat_g}g
                    </p>
                  </div>
                  <button
                    className="ml-2 shrink-0 text-destructive hover:text-destructive/80 text-xs font-medium"
                    onClick={() => handleDeleteFood(item.id)}
                    disabled={isPending}
                    aria-label={`Remove ${item.food_name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Running totals */}
            <div className="rounded-md bg-muted px-3 py-2 text-sm space-y-1">
              <p className="font-medium">Running total</p>
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                <div>
                  <p className="font-medium">{Math.round(totals.calories)}</p>
                  <p className="text-muted-foreground">kcal</p>
                </div>
                <div>
                  <p className="font-medium">{Math.round(totals.carbs_g * 10) / 10}g</p>
                  <p className="text-muted-foreground">carbs</p>
                </div>
                <div>
                  <p className="font-medium">
                    {Math.round(totals.protein_g * 10) / 10}g
                  </p>
                  <p className="text-muted-foreground">protein</p>
                </div>
                <div>
                  <p className="font-medium">{Math.round(totals.fat_g * 10) / 10}g</p>
                  <p className="text-muted-foreground">fat</p>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
