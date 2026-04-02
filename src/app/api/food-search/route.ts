import { type NextRequest } from "next/server";

export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string;
  servingSizeG: number;
  per100g: {
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    iron_mg: number | null;
    magnesium_mg: number | null;
    sodium_mg: number | null;
    calcium_mg: number | null;
    vitamin_d_mcg: number | null;
    potassium_mg: number | null;
  };
}

// Hardcoded common foods for runners used as fallback
const COMMON_FOODS: FoodSearchResult[] = [
  {
    id: "common-banana",
    name: "Banana (medium)",
    brand: "",
    servingSizeG: 118,
    per100g: {
      calories: 89,
      carbs_g: 23,
      protein_g: 1,
      fat_g: 0,
      iron_mg: 0.3,
      magnesium_mg: 27,
      sodium_mg: null,
      calcium_mg: null,
      vitamin_d_mcg: null,
      potassium_mg: 358,
    },
  },
  {
    id: "common-oats",
    name: "Porridge / Oats (dry)",
    brand: "",
    servingSizeG: 100,
    per100g: {
      calories: 389,
      carbs_g: 66,
      protein_g: 17,
      fat_g: 7,
      iron_mg: 4.7,
      magnesium_mg: 177,
      sodium_mg: null,
      calcium_mg: null,
      vitamin_d_mcg: null,
      potassium_mg: null,
    },
  },
  {
    id: "common-white-rice",
    name: "White Rice (cooked)",
    brand: "",
    servingSizeG: 100,
    per100g: {
      calories: 130,
      carbs_g: 28,
      protein_g: 2.7,
      fat_g: 0.3,
      iron_mg: null,
      magnesium_mg: null,
      sodium_mg: null,
      calcium_mg: null,
      vitamin_d_mcg: null,
      potassium_mg: null,
    },
  },
  {
    id: "common-chicken-breast",
    name: "Chicken Breast",
    brand: "",
    servingSizeG: 100,
    per100g: {
      calories: 165,
      carbs_g: 0,
      protein_g: 31,
      fat_g: 3.6,
      iron_mg: 1,
      magnesium_mg: null,
      sodium_mg: null,
      calcium_mg: null,
      vitamin_d_mcg: null,
      potassium_mg: null,
    },
  },
  {
    id: "common-wholemeal-bread",
    name: "Wholemeal Bread (1 slice)",
    brand: "",
    servingSizeG: 40,
    per100g: {
      calories: 230,
      carbs_g: 42.5,
      protein_g: 10,
      fat_g: 2.5,
      iron_mg: 3,
      magnesium_mg: null,
      sodium_mg: null,
      calcium_mg: null,
      vitamin_d_mcg: null,
      potassium_mg: null,
    },
  },
  {
    id: "common-egg",
    name: "Eggs (1 large)",
    brand: "",
    servingSizeG: 50,
    per100g: {
      calories: 154,
      carbs_g: 1.2,
      protein_g: 12,
      fat_g: 10,
      iron_mg: 1.8,
      magnesium_mg: null,
      sodium_mg: null,
      calcium_mg: null,
      vitamin_d_mcg: 2.2,
      potassium_mg: null,
    },
  },
  {
    id: "common-chocolate-milk",
    name: "Chocolate Milk (250ml)",
    brand: "",
    servingSizeG: 250,
    per100g: {
      calories: 76,
      carbs_g: 10.4,
      protein_g: 3.2,
      fat_g: 2,
      iron_mg: null,
      magnesium_mg: null,
      sodium_mg: null,
      calcium_mg: 120,
      vitamin_d_mcg: null,
      potassium_mg: null,
    },
  },
  {
    id: "common-greek-yoghurt",
    name: "Greek Yoghurt",
    brand: "",
    servingSizeG: 100,
    per100g: {
      calories: 97,
      carbs_g: 4,
      protein_g: 9,
      fat_g: 5,
      iron_mg: null,
      magnesium_mg: null,
      sodium_mg: null,
      calcium_mg: 110,
      vitamin_d_mcg: null,
      potassium_mg: null,
    },
  },
];

function parseServingSize(servingSizeStr: string | undefined): number {
  if (!servingSizeStr) return 100;
  // Try to extract a number in grams, e.g. "100g", "100 g", "100 ml"
  const match = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
  if (match) return parseFloat(match[1]);
  // Try to extract any leading number
  const numMatch = servingSizeStr.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) return parseFloat(numMatch[1]);
  return 100;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeNum(val: unknown): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeNumOrNull(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return Response.json(COMMON_FOODS);
  }

  try {
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", q);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "10");
    url.searchParams.set(
      "fields",
      "product_name,brands,nutriments,serving_size,code"
    );

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "PaceApp/1.0 (nutrition tracker)" },
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
      return Response.json(COMMON_FOODS);
    }

    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products: any[] = json?.products ?? [];

    const results: FoodSearchResult[] = products
      .filter(
        (p) =>
          p.product_name &&
          p.product_name.trim() !== "" &&
          p.nutriments &&
          Object.keys(p.nutriments).length > 0
      )
      .map((p) => {
        const n = p.nutriments;
        return {
          id: p.code ?? String(Math.random()),
          name: p.product_name.trim(),
          brand: p.brands ? p.brands.split(",")[0].trim() : "",
          servingSizeG: parseServingSize(p.serving_size),
          per100g: {
            calories: safeNum(
              n["energy-kcal_100g"] ?? n["energy-kcal"] ?? n["energy_100g"]
            ),
            carbs_g: safeNum(n["carbohydrates_100g"] ?? n["carbohydrates"]),
            protein_g: safeNum(n["proteins_100g"] ?? n["proteins"]),
            fat_g: safeNum(n["fat_100g"] ?? n["fat"]),
            iron_mg: safeNumOrNull(n["iron_100g"] != null ? n["iron_100g"] * 1000 : null),
            magnesium_mg: safeNumOrNull(
              n["magnesium_100g"] != null ? n["magnesium_100g"] * 1000 : null
            ),
            sodium_mg: safeNumOrNull(
              n["sodium_100g"] != null ? n["sodium_100g"] * 1000 : null
            ),
            calcium_mg: safeNumOrNull(
              n["calcium_100g"] != null ? n["calcium_100g"] * 1000 : null
            ),
            vitamin_d_mcg: safeNumOrNull(
              n["vitamin-d_100g"] != null ? n["vitamin-d_100g"] * 1000000 : null
            ),
            potassium_mg: safeNumOrNull(
              n["potassium_100g"] != null ? n["potassium_100g"] * 1000 : null
            ),
          },
        };
      })
      .slice(0, 8);

    if (results.length === 0) {
      return Response.json(COMMON_FOODS);
    }

    return Response.json(results);
  } catch {
    return Response.json(COMMON_FOODS);
  }
}
