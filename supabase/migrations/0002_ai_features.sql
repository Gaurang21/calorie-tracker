-- AI feature schema additions.

-- Cached AI summaries / pacing messages
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  summary TEXT NOT NULL,
  kind TEXT DEFAULT 'weekly' CHECK (kind IN ('weekly', 'pacing', 'insight')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start, kind)
);
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own summaries" ON ai_summaries;
CREATE POLICY "Users can only access their own summaries"
  ON ai_summaries FOR ALL USING (auth.uid() = user_id);

-- Profile additions for Ollama configuration + feature toggles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ollama_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ollama_api_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_features_enabled JSONB DEFAULT '{
  "weekly_summary": true,
  "ask_anything": true,
  "meal_suggestions": true,
  "food_swap": true,
  "daily_insights": true,
  "goal_pacing": true,
  "workout_suggestions": true
}'::jsonb;
