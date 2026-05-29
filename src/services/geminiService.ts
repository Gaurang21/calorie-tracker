// TODO: Gemini API integration — will be added later.
// Replace this stub with an actual Gemini 1.5 Flash API call that reads
// `gemini_api_key` from the user's profile in Supabase.

export interface PhotoAnalysisResult {
  foods: string[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'low' | 'medium' | 'high';
}

const MOCK_RESPONSES: PhotoAnalysisResult[] = [
  {
    foods: ['Grilled chicken breast', 'Brown rice', 'Steamed broccoli'],
    totalCalories: 520,
    protein: 48,
    carbs: 52,
    fat: 9,
    confidence: 'medium',
  },
  {
    foods: ['Caesar salad', 'Croutons', 'Parmesan'],
    totalCalories: 380,
    protein: 14,
    carbs: 22,
    fat: 28,
    confidence: 'medium',
  },
  {
    foods: ['Avocado toast', 'Poached egg', 'Cherry tomatoes'],
    totalCalories: 410,
    protein: 18,
    carbs: 34,
    fat: 24,
    confidence: 'high',
  },
];

export async function analyzeFoodPhoto(_imageBase64: string): Promise<PhotoAnalysisResult> {
  await new Promise((r) => setTimeout(r, 1500));
  const idx = Math.floor(Math.random() * MOCK_RESPONSES.length);
  return MOCK_RESPONSES[idx]!;
}
