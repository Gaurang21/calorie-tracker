# CLAUDE.md — Agent Instructions for Calorie Tracker App

Rules Claude Code (and any other agent) must follow when working on this repo.

---

## 1. Mandatory pre-commit checklist

Before committing **any** code change, run all three of the following in order. All three must pass — never commit if any step fails.

```bash
npm run build       # Step 1 — zero errors
npm run test        # Step 2 — Vitest unit + component
npm run test:e2e    # Step 3 — Playwright E2E
```

Or as one command: `npm run test:all`.

If any step fails: fix the issue, re-run all three from the top, only commit once everything is clean.

---

## 2. Testing structure

### Unit & integration — Vitest
- Test files live alongside source as `*.test.js` / `*.test.jsx`
- Global setup: `src/tests/setup.js` (registers `jest-dom` matchers, polyfills `ResizeObserver` etc.)
- Required coverage:
  - `src/utils/calculations.test.js` — BMR/TDEE/BMI/MET/body fat/macros
  - `src/utils/appleHealthParser.test.js` — XML parsing, dedup
  - `src/components/auth/ProtectedRoute.test.jsx`
  - `src/components/log/ManualEntryTab.test.jsx`
  - `src/components/log/AddFoodModal.test.jsx`
  - `src/components/dashboard/Dashboard.test.jsx`
  - `src/services/ollamaService.test.js` — all 8 service functions + `testConnection`
  - `src/hooks/useOllama.test.js`

### E2E — Playwright
- Specs in `e2e/`
- Dev server is started by Playwright with `VITE_E2E=1` so Supabase and Ollama are replaced by fakes (no real backend needed)
- Required coverage:
  - `auth`, `onboarding`, `dashboard`, `food-log`, `activity-log`, `water`, `barcode`, `photo-upload`, `trends`, `profile`, `settings`
  - `ai-nlp-logging`, `ai-weekly-summary`, `ai-chat`, `ai-meal-suggestions`, `ai-food-swap`, `ai-settings`

### Test mocking rules
- **All Ollama calls must be mockable.** Never make real network calls in tests.
- Unit tests: `vi.mock('../services/ollamaService', () => ({ ... }))`
- E2E tests: the service detects `VITE_E2E=1` at import time and returns per-feature stub responses. No further setup needed.

```js
vi.mock('../services/ollamaService', () => ({
  parseNaturalLanguageFood: vi.fn().mockResolvedValue({ items: [] }),
  generateWeeklySummary: vi.fn().mockResolvedValue('Mock summary'),
  // etc.
}));
```

---

## 3. Git workflow

### Branching
- `main` is the deploy branch — every push to it auto-deploys to Vercel
- All feature work happens on `feature/<name>` branches off `main`
- Branch names: lowercase, hyphenated, descriptive — `feature/barcode-scanner`, `feature/ai-integration`

### Commit messages
- Short imperative summary, 50 chars or less
- Optional second line of context
- No bullet points, no long paragraphs

Good:
```
Add manual food entry with calorie and macro fields
Add Recharts weight history with 7-day moving average
Fix net calories not updating after activity deletion
```

Bad: `fixes`, `WIP`, multi-paragraph messages.

### Merging
After all three pre-commit checks pass on the feature branch:
```bash
git checkout main
git pull origin main
git merge feature/<name>
git push origin main
git branch -d feature/<name>
```

> Never push directly to `main` after the initial scaffold. Never merge a branch with failing tests.

---

## 4. Environment variables

```bash
# .env  (never commit)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OLLAMA_URL=https://your-oracle-ip-or-domain
VITE_OLLAMA_API_KEY=your-secret-api-key
```

Maintain `.env.example` with placeholders. `.gitignore` must contain `.env`, `.env.local`, `node_modules/`, `dist/`, `playwright-report/`, `test-results/`.

All four `VITE_*` variables must be set in **Vercel Dashboard → Settings → Environment Variables** for production deploys.

---

## 5. AI infrastructure

```
Vercel (React app) → HTTPS + API key → Oracle VPS (Nginx) → Ollama → Llama 3.2
                                                                   → Gemini (photo only)
```

### Service layer rules
- All text-based AI calls go through `src/services/ollamaService.js` only
- Photo analysis stays in `src/services/geminiService.js` only
- No component may call Ollama or Gemini directly
- Every AI feature must degrade gracefully when Ollama is unreachable — show "AI features unavailable — check your server connection" and keep core app functional
- Core logging, charts, profile, and auth must never block on AI being down

### Adding a new AI feature
1. Add an exported function in `src/services/ollamaService.js`, including an `IS_E2E` early-return with a realistic stub for tests
2. Add a unit test mocking `fetch`
3. Add a component under `src/components/ai/`
4. Wire into the relevant page; gate on `useOllama().enabled('<feature_flag>')`
5. Add a feature flag entry to the default in `useProfile.js` and to the Settings AI section
6. Add an E2E spec under `e2e/ai-<feature>.spec.js`
7. Run `npm run test:all` before committing

---

## 6. Supabase auth redirect URLs

After deploying to Vercel, update **Authentication → URL Configuration** in Supabase:
```
Site URL:          https://your-app.vercel.app
Redirect URLs:     https://your-app.vercel.app/**
                   http://localhost:5173/**
```

Required for email confirmation links and OAuth.

---

## 7. Vercel deployment

- Auto-detected as Vite
- Build command: `npm run build`
- Output directory: `dist`
- Set all four `VITE_*` env vars in the dashboard
- Every push to `main` triggers a production deployment
- Agent's responsibility: ensure `npm run build` and `npm run test:all` pass locally before pushing — never break `main`

---

## 8. Quick reference card

```
Before every commit:
  npm run test:all      (build + vitest + playwright)

AI service files:
  src/services/ollamaService.js   ← text AI (NLP, chat, insights)
  src/services/geminiService.js   ← photo analysis only

Environment variables needed:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_OLLAMA_URL
  VITE_OLLAMA_API_KEY

Vercel auto-deploys on every push to main.
Oracle VPS runs Ollama 24/7, shared by all users.
```
