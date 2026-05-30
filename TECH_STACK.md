# Tech Stack

The complete set of technologies, libraries, services, and conventions used in the Calorie Tracker app. Share this with any agent or developer so new code matches the existing patterns.

---

## Language & build

| Concern | Choice |
|---|---|
| Language | **TypeScript** (strict mode, `.ts` / `.tsx`) |
| Build tool | **Vite 5** (`@vitejs/plugin-react`) |
| Module system | ES modules (`"type": "module"` in `package.json`) |
| Node runtime | Node >= 18 |
| Path alias | `@/*` → `src/*` (configured in `vite.config.ts` and `tsconfig.json`) |

Scripts (`package.json`):
- `npm run dev` — Vite dev server on `http://localhost:5173`
- `npm run build` — production build to `dist/`
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — Vitest unit/component tests
- `npm run test:e2e` — Playwright E2E
- `npm run test:all` — typecheck + build + unit + E2E (the **mandatory pre-commit gate**)

---

## UI framework

| Concern | Choice |
|---|---|
| View library | **React 18** (`react`, `react-dom`) |
| Router | **React Router v6** (`react-router-dom`) — declarative `<Routes>` / `<Route>` |
| Auth gating | Custom `<ProtectedRoute>` wrapper in `src/components/auth/ProtectedRoute.tsx` |

Routing pattern lives in `src/App.tsx`. Layout shell with `<Outlet>` is in `src/components/layout/AppShell.tsx`.

---

## Design system & styling

| Concern | Choice |
|---|---|
| CSS framework | **Tailwind CSS 3** (`darkMode: 'class'`) |
| Tailwind plugin | `tailwindcss-animate` |
| Component library | **shadcn/ui** primitives in `src/components/ui/*` — wrappers over Radix |
| Variant API | **class-variance-authority** (`cva`) for typed variants |
| Class merging | **clsx** + **tailwind-merge**, exposed as `cn()` in `src/lib/utils.ts` |
| Radix primitives | `react-dialog`, `react-tabs`, `react-select`, `react-switch`, `react-checkbox`, `react-label`, `react-progress`, `react-slot` |
| Icons | `lucide-react` |
| Charts | `recharts` (used in `Trends.tsx`) |
| Fonts | DM Sans / Nunito (system fallback) — Tailwind `fontFamily.sans` |
| Theming | CSS variables (`--brand`, `--surface`, `--text`, `--border`, `--danger`, etc.) for both light and dark modes, with `darkMode: 'class'` toggled on `<html>` |

**Authoring rules:**
- All new UI must use the shadcn primitives from `@/components/ui/*` (Button, Card, Input, Label, Textarea, Select, Dialog, Tabs, Switch, Checkbox) — no raw `<input className="input">`, no `btn-primary` classes.
- Variant patterns: `<Button variant="default|secondary|ghost|destructive|link" size="default|sm|lg|icon">`.
- For dynamic theming use CSS variables via inline `style`, not Tailwind color classes.
- The `Card` primitive supports `variant="warm"` for the hero/calorie-ring style.

---

## State, data, and side effects

| Concern | Choice |
|---|---|
| Global state | React **Context** (only for auth — `src/contexts/AuthContext.tsx`) |
| Local state | React `useState` / `useReducer` |
| Async data | Plain `useEffect` + Supabase queries (no React Query / SWR) |
| Custom hooks | `src/hooks/use*.ts` for each data domain |

**Custom hooks:** `useProfile`, `useFoodLog(date)`, `useActivityLog(date)`, `useWaterLog(date)`, `useDailyTargets(profile)`, `useStreak`, `useOllama` (feature flags).

---

## Backend: Supabase

| Concern | Choice |
|---|---|
| Database / Auth / Realtime / Storage | **Supabase** (`@supabase/supabase-js`) |
| Client | `src/lib/supabase.ts` — exports `supabase: SupabaseClient` |
| E2E fake | `src/lib/supabaseFake.ts` — swapped in when `VITE_E2E=1` so tests need no network |
| Auth methods | Email + password, Google OAuth, password reset |
| Session handling | `persistSession`, `autoRefreshToken`, `detectSessionInUrl` all on |

**Tables used:** `profiles`, `food_log`, `activity_log`, `water_log`, `weight_log`, `user_foods`, `meal_templates`, `ai_summaries`.

**Auth redirect config** (Supabase dashboard → Auth → URL Configuration):
- Site URL: production Vercel URL
- Redirect URLs: `https://<app>.vercel.app/**`, `http://localhost:5173/**`

---

## AI: provider-agnostic service layer

All text AI goes through **`src/services/aiService.ts`**, which is a thin re-export router. The active backend is chosen at build time with `VITE_AI_PROVIDER=ollama|groq` (default: `ollama`).

| Provider | File | Purpose |
|---|---|---|
| **Ollama** | `src/services/ollamaService.ts` | Self-hosted Llama 3.2 on Oracle VPS (Nginx → Ollama). Auth via custom `VITE_OLLAMA_API_KEY` header. |
| **Groq** | `src/services/groqService.ts` | Hosted, OpenAI-compatible chat completions. Default model `llama-3.1-8b-instant`. |
| **Gemini** | `src/services/geminiService.ts` | **Photo analysis only.** Reads `gemini_api_key` from the user's profile. |
| **Open Food Facts** | `src/services/openFoodFacts.ts` | Free barcode → product lookup, no API key. |

**Both AI providers must export the same 8 feature functions + `testConnection`:**
1. `parseNaturalLanguageFood`
2. `generateWeeklySummary`
3. `answerDataQuestion`
4. `suggestMeals`
5. `suggestFoodSwap`
6. `generateDailyInsight`
7. `generateGoalPacingMessage`
8. `generateWorkoutSuggestion`

Each service short-circuits to a deterministic stub when `VITE_E2E === '1'` so tests never hit a real endpoint.

**Component rules:**
- No component imports `ollamaService` or `groqService` directly — always go through `aiService.ts`.
- Photo features go through `geminiService.ts` only.
- Every AI feature must degrade gracefully on failure (`"AI features unavailable — check your server connection"`) and core logging/profile/charts must never block on AI being down.
- Each AI feature is gated by a flag from `useOllama().enabled('<feature_flag>')`.

---

## Other integrations

| Concern | Library |
|---|---|
| Barcode scanning (camera) | **html5-qrcode** |
| Apple Health import | Custom XML parser in `src/utils/appleHealthParser.ts` |

---

## Date / time

**Always use the helpers in `src/utils/date.ts`** for any user-facing date logic. Never call `new Date().toISOString().slice(0, 10)` — that returns UTC and shifts the day for users outside UTC.

Exports:
- `todayLocalISO()` → `YYYY-MM-DD` in the user's timezone
- `localISO(d)` → format any `Date` as local `YYYY-MM-DD`
- `daysAgoLocalISO(n)`
- `mondayOfLocal(date?)`

---

## Testing

| Layer | Tool | Location |
|---|---|---|
| Unit + component | **Vitest 2** + jsdom | `*.test.ts` / `*.test.tsx` next to source |
| Testing utilities | `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | global setup: `src/tests/setup.ts` |
| E2E | **Playwright** | `e2e/*.spec.js` |

**E2E conventions:**
- Playwright starts its own dev server: `VITE_E2E=1 npm run dev`
- That env flag swaps Supabase for `supabaseFake` and makes every AI service return canned stubs — no real backend needed
- shadcn `Select` is queried by `role: 'combobox'` (click trigger, then pick `role: 'option'`)
- shadcn `Button` active state is asserted by the brand shadow class, e.g. `toHaveClass(/shadow-\[0_6px_18px/)`

**Required spec coverage:** auth, onboarding, dashboard, food-log, activity-log, water, barcode, photo-upload, trends, profile, settings, ai-nlp-logging, ai-weekly-summary, ai-chat, ai-meal-suggestions, ai-food-swap, ai-settings.

---

## Hosting & deployment

| Concern | Choice |
|---|---|
| Hosting | **Vercel** (auto-detected as Vite) |
| Build command | `npm run build` |
| Output directory | `dist` |
| SPA routing | `vercel.json` rewrites all non-API paths to `/index.html` (so `/profile` refresh works) |
| Deploy trigger | Every push to `main` |
| AI host (Ollama) | **Oracle Cloud VPS** running Nginx → Ollama 24/7 |

---

## Environment variables

All client-side env vars must be prefixed `VITE_`. Maintain placeholders in `.env.example`. Never commit `.env`.

```
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# AI provider switch
VITE_AI_PROVIDER=ollama   # or 'groq'

# Ollama (self-hosted)
VITE_OLLAMA_URL=
VITE_OLLAMA_API_KEY=

# Groq (hosted)
VITE_GROQ_API_KEY=
VITE_GROQ_URL=https://api.groq.com/openai/v1   # optional
VITE_GROQ_MODEL=llama-3.1-8b-instant            # optional
```

All required keys must also be set in **Vercel → Settings → Environment Variables** for production.

---

## File / folder conventions

```
src/
  components/
    ai/          ← AI-feature UI cards (gated by useOllama flag)
    auth/        ← ProtectedRoute, login forms
    activity/
    log/         ← FoodLogSection, AddFoodModal, NLPFoodTab, BarcodeScannerTab, PhotoUploadTab, ManualEntryTab, MealTemplatesTab
    dashboard/
    layout/      ← AppShell, Sidebar, BottomNav
    common/      ← shared visual (CalorieRing, ProgressBar)
    charts/
    ui/          ← shadcn primitives — DO NOT modify, extend, or duplicate
  contexts/      ← React Context providers (auth only)
  hooks/         ← Domain custom hooks (useFoodLog, useProfile, etc.)
  lib/           ← supabase client, supabaseFake, utils (cn)
  pages/         ← Routed page components (Dashboard, Log, Trends, Profile, Settings, AIChat, Login, Signup, Onboarding, ResetPassword)
  services/      ← External integrations (aiService, ollamaService, groqService, geminiService, openFoodFacts)
  types/         ← Shared TS types (db.ts for Supabase rows, ai.ts for AI payloads)
  utils/         ← Pure helpers (calculations.ts, date.ts, appleHealthParser.ts)
  tests/setup.ts ← Vitest global setup
e2e/             ← Playwright specs + helpers.js
```

---

## Code rules (must follow)

1. **Strict TypeScript** — no `any` unless absolutely necessary; reuse the types in `src/types/db.ts` and `src/types/ai.ts`.
2. **shadcn-only UI** — never re-add raw HTML form controls or legacy `.btn-*` / `.card-*` classes.
3. **Provider-agnostic AI** — components must import from `aiService.ts`, never from `ollamaService` / `groqService` directly.
4. **Local-time dates** — always use `src/utils/date.ts`; never `toISOString().slice(0, 10)`.
5. **Feature flags for AI** — new AI features need an entry in the `ai_features_enabled` default in `useProfile.ts` and a toggle row in `Settings.tsx`.
6. **Pre-commit gate** — `npm run test:all` (typecheck + build + Vitest + Playwright) must pass before every commit. No exceptions.
7. **Graceful AI degradation** — wrap every AI call in try/catch and surface the standard error message; never break the core app when AI is unreachable.
8. **E2E stubs** — any new AI function must also return a deterministic stub when `import.meta.env.VITE_E2E === '1'`.

---

## Versioned summary (as of this writing)

```
react              18.3.1
react-router-dom    6.26.2
typescript           6.0.3
vite                 5.4.8
vitest               2.1.2
@playwright/test    1.56.1
tailwindcss          3.4.13
@supabase/supabase-js 2.45.4
recharts             2.12.7
lucide-react         1.17.0
html5-qrcode         2.3.8

Radix primitives: dialog, tabs, select, switch, checkbox, label, progress, slot
class-variance-authority 0.7.1 · clsx 2.1.1 · tailwind-merge 3.6.0 · tailwindcss-animate 1.0.7
```
