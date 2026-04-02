-- Food items logged per day (replaces single-entry nutrition_days approach)
create table if not exists public.nutrition_food_items (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  date            date not null,
  food_name       text not null,
  quantity_g      numeric not null default 100,
  calories        numeric default 0,
  carbs_g         numeric default 0,
  protein_g       numeric default 0,
  fat_g           numeric default 0,
  -- Micronutrients
  iron_mg         numeric,
  magnesium_mg    numeric,
  sodium_mg       numeric,
  calcium_mg      numeric,
  vitamin_d_mcg   numeric,
  potassium_mg    numeric,
  source          text default 'openfoodfacts' check (source in ('openfoodfacts', 'ai-estimate', 'manual')),
  created_at      timestamptz default now()
);

alter table public.nutrition_food_items enable row level security;
create policy "Users can manage own food items" on public.nutrition_food_items for all using (auth.uid() = user_id);

-- Also add micronutrient aggregate columns to nutrition_days
alter table public.nutrition_days
  add column if not exists iron_mg numeric,
  add column if not exists magnesium_mg numeric,
  add column if not exists sodium_mg numeric,
  add column if not exists calcium_mg numeric,
  add column if not exists vitamin_d_mcg numeric,
  add column if not exists potassium_mg numeric;
