-- Calorie Tracker initial schema. Run in Supabase SQL editor.

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  sex TEXT CHECK (sex IN ('male', 'female')),
  date_of_birth DATE,
  height_cm NUMERIC,
  activity_level TEXT CHECK (activity_level IN (
    'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
  )),
  goal_weight_kg NUMERIC,
  goal_pace TEXT CHECK (goal_pace IN (
    'lose_1kg', 'lose_0_5kg', 'maintain', 'gain_0_5kg', 'gain_1kg'
  )),
  units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  dark_mode BOOLEAN DEFAULT false,
  daily_calorie_override INTEGER,
  macro_protein_pct INTEGER DEFAULT 30,
  macro_carbs_pct INTEGER DEFAULT 40,
  macro_fat_pct INTEGER DEFAULT 30,
  water_target_ml INTEGER DEFAULT 2500,
  gemini_api_key TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;
CREATE POLICY "Users can only access their own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- Weight log
CREATE TABLE IF NOT EXISTS weight_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own weight log" ON weight_log;
CREATE POLICY "Users can only access their own weight log"
  ON weight_log FOR ALL USING (auth.uid() = user_id);

-- Food log
CREATE TABLE IF NOT EXISTS food_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  serving_size TEXT,
  source TEXT CHECK (source IN ('manual', 'barcode', 'photo_ai', 'template')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own food log" ON food_log;
CREATE POLICY "Users can only access their own food log"
  ON food_log FOR ALL USING (auth.uid() = user_id);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  activity_type TEXT NOT NULL,
  duration_mins INTEGER,
  calories_burned INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own activity log" ON activity_log;
CREATE POLICY "Users can only access their own activity log"
  ON activity_log FOR ALL USING (auth.uid() = user_id);

-- Water log
CREATE TABLE IF NOT EXISTS water_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own water log" ON water_log;
CREATE POLICY "Users can only access their own water log"
  ON water_log FOR ALL USING (auth.uid() = user_id);

-- User foods
CREATE TABLE IF NOT EXISTS user_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  serving_size TEXT,
  times_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own food database" ON user_foods;
CREATE POLICY "Users can only access their own food database"
  ON user_foods FOR ALL USING (auth.uid() = user_id);

-- Meal templates
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  foods JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own meal templates" ON meal_templates;
CREATE POLICY "Users can only access their own meal templates"
  ON meal_templates FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS food_log_user_date_idx ON food_log(user_id, date);
CREATE INDEX IF NOT EXISTS activity_log_user_date_idx ON activity_log(user_id, date);
CREATE INDEX IF NOT EXISTS weight_log_user_date_idx ON weight_log(user_id, date);
CREATE INDEX IF NOT EXISTS user_foods_user_idx ON user_foods(user_id, times_used DESC);
