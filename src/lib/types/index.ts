// ============================================================
// PACE — Core TypeScript Types
// Derived from PRD v1.0
// ============================================================

// --- User & Profile ---

export type DepthPreference = "simple" | "balanced" | "full";
export type PrimaryGoal = "health" | "race" | "weight" | "return-from-injury";
export type CoachingVoice = "encouraging" | "clinical" | "direct" | "balanced";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: "male" | "female" | "other";
  weight_kg: number;
  height_cm: number;
  weekly_run_frequency: number;
  longest_recent_run_km: number;
  primary_goal: PrimaryGoal;
  depth_preference: DepthPreference;
  coaching_voice: CoachingVoice;
  onboarding_phase: 1 | 2 | 3;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

// --- Training ---

export type WorkoutType =
  | "easy"
  | "long"
  | "tempo"
  | "interval"
  | "strides"
  | "hill-repeats"
  | "cross-training"
  | "recovery-walk"
  | "rest";

export type TrainingPhase =
  | "base"
  | "build"
  | "peak"
  | "taper"
  | "recovery";

export type EffortZone = 1 | 2 | 3 | 4 | 5;

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  type: WorkoutType;
  title: string;
  description: string;
  duration_minutes: number;
  distance_km?: number;
  target_zone?: EffortZone;
  target_rpe?: number;
  completed: boolean;
  actual_duration_minutes?: number;
  actual_distance_km?: number;
  actual_avg_hr?: number;
  notes?: string;
  created_at: string;
}

export type PlanStatus = "active" | "paused" | "completed" | "archived";

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  race_type?: "5k" | "10k" | "half-marathon" | "marathon" | "general";
  race_date?: string;
  current_phase: TrainingPhase;
  current_week: number;
  total_weeks: number;
  weekly_volume_km: number;
  acwr?: number;
  active: boolean;
  status?: PlanStatus;
  created_at: string;
}

// --- Nutrition ---

export interface NutritionDay {
  id: string;
  user_id: string;
  date: string;
  total_calories?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  carb_target_g?: number;
  protein_target_g?: number;
  pre_run_fuelled: boolean;
  post_run_recovery: boolean;
  energy_availability?: number;
  source: "manual" | "mfp" | "cronometer" | "ai-inference";
  // Micronutrient aggregates
  iron_mg?: number;
  magnesium_mg?: number;
  sodium_mg?: number;
  calcium_mg?: number;
  vitamin_d_mcg?: number;
  potassium_mg?: number;
}

export interface NutritionFoodItem {
  id: string;
  user_id: string;
  date: string;
  food_name: string;
  quantity_g: number;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  iron_mg?: number | null;
  magnesium_mg?: number | null;
  sodium_mg?: number | null;
  calcium_mg?: number | null;
  vitamin_d_mcg?: number | null;
  potassium_mg?: number | null;
  source: "openfoodfacts" | "ai-estimate" | "manual";
  created_at: string;
}

export interface MealRecommendation {
  timing: "pre-run" | "during-run" | "post-run" | "general";
  description: string;
  carbs_g: number;
  protein_g?: number;
  examples: string[];
}

// --- Injury & Recovery ---

export type BodyRegion =
  | "foot-ankle"
  | "lower-leg"
  | "knee"
  | "hip-glute"
  | "lower-back"
  | "upper-body"
  | "other";

export type InjurySeverity = "monitoring" | "mild" | "moderate" | "severe";
export type InjuryStatus = "current" | "recovering" | "historical";
export type OnsetType = "gradual" | "acute" | "post-surgery";

export interface Injury {
  id: string;
  user_id: string;
  body_region: BodyRegion;
  condition: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  onset_type: OnsetType;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface InjuryRiskScore {
  level: RiskLevel;
  score: number;
  factors: string[];
  recommendation: string;
}

// --- Daily Brief ---

export interface DailyBrief {
  date: string;
  greeting: string;
  workout_recommendation: Workout;
  why_today: string;
  fuel_plan: MealRecommendation[];
  injury_note?: string;
  recovery_context?: string;
  weekly_context?: string;
}

// --- Custom Foods ---

export interface CustomFood {
  id: string;
  user_id: string;
  food_name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  iron_mg_per_100g?: number | null;
  magnesium_mg_per_100g?: number | null;
  sodium_mg_per_100g?: number | null;
  calcium_mg_per_100g?: number | null;
  vitamin_d_mcg_per_100g?: number | null;
  potassium_mg_per_100g?: number | null;
  default_serving_g: number;
  created_at: string;
}

// --- Integrations ---

export type IntegrationType =
  | "apple-health"
  | "garmin"
  | "strava"
  | "whoop"
  | "oura"
  | "mfp"
  | "cronometer";

export interface Integration {
  id: string;
  user_id: string;
  type: IntegrationType;
  connected: boolean;
  last_synced?: string;
  status: "active" | "error" | "disconnected";
}

// --- Gamification ---

export interface Streak {
  type: "active-days" | "fuelled-sessions" | "easy-runs";
  current: number;
  longest: number;
  shield_available: boolean;
}

export interface WeeklyScore {
  score: number;
  trend: "improving" | "stable" | "declining";
  components: {
    sleep: number;
    hrv: number;
    nutrition: number;
    load: number;
  };
}
