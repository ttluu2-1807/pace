-- Custom foods library: stores per-100g nutritional data for user-saved foods
CREATE TABLE IF NOT EXISTS custom_foods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  calories_per_100g integer NOT NULL DEFAULT 0,
  carbs_per_100g decimal(6,1) NOT NULL DEFAULT 0,
  protein_per_100g decimal(6,1) NOT NULL DEFAULT 0,
  fat_per_100g decimal(6,1) NOT NULL DEFAULT 0,
  iron_mg_per_100g decimal(6,2),
  magnesium_mg_per_100g decimal(6,1),
  sodium_mg_per_100g decimal(6,1),
  calcium_mg_per_100g decimal(6,1),
  vitamin_d_mcg_per_100g decimal(6,2),
  potassium_mg_per_100g decimal(6,1),
  default_serving_g integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom foods"
  ON custom_foods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS custom_foods_user_id_idx ON custom_foods(user_id);
