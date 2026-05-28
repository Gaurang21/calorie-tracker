# Calorie Tracker

A mobile-first personal calorie, macro, water, and activity tracker with eight AI-powered features.
React + Vite + Tailwind on the frontend, Supabase for auth + data, self-hosted Ollama (Llama 3.2) for text AI, Gemini 1.5 Flash for photo analysis.

Multi-user — each person signs up with their own account and sees only their data, enforced by Postgres row-level security.

---

## Features

### Core
- Email / password auth with optional Google OAuth, full session persistence
- 4-step onboarding (name, body metrics, activity level, goal + pace)
- Dashboard: calorie ring, macro progress, water, net calories, streak counter
- Daily log with breakfast / lunch / dinner / snacks sections
- Five ways to log food: manual entry, AI natural-language ("describe it"), barcode (Open Food Facts), photo upload (Gemini), meal templates
- Activity log with MET-based auto-calculation for 7 common activities
- Water tracking with quick-add buttons (250 / 500 / 750 ml)
- Trends page — weight history with 7-day moving average, calories vs target, macro distribution, net calories, goal projection
- Profile with BMR / TDEE / BMI / Body fat (Navy method) and weight history
- Apple Health `export.xml` import (body mass + active energy + steps)
- Settings: dark mode, units, macro percentages, water goal, AI feature toggles, data export/import as JSON, account deletion
- PWA: installable on iOS / Android, offline app shell, standalone display

### AI (via Ollama on Oracle Cloud)
1. **Natural-language food logging** — "I had oatmeal with banana and coffee" → parsed items with editable macros
2. **Weekly summary** — auto-cached 3–5 sentence recap on Monday or on demand
3. **Ask Anything chat** at `/ai-chat` — questions about your own data, 30-day rolling context, starter prompts
4. **Smart meal suggestions** — 3 meals that fit your remaining calories and macro gaps
5. **Food swap suggestions** — Swap? button on each food log entry → 3 better alternatives
6. **Daily insight card** — one rotating insight per day, dismissible
7. **Goal pacing coach** — colour-coded weekly pace + 1-2 sentence tip
8. **Workout & recovery suggestions** — after logging activity or after 3 days of no activity

Every AI feature degrades gracefully — if Ollama is unreachable the rest of the app keeps working.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 with CSS variables for theming |
| Charts | Recharts |
| Auth & DB | Supabase (free tier) |
| Food DB | Open Food Facts API (free, no key) |
| Barcode | `html5-qrcode` |
| Photo AI | Gemini 1.5 Flash (currently stubbed in `src/services/geminiService.js`) |
| Text AI | Pluggable — Groq (hosted) or Ollama (self-hosted). Switch with `VITE_AI_PROVIDER=groq\|ollama`. |
| Routing | React Router v6 |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Hosting | Vercel (auto-deploys on push to `main`) |

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/Gaurang21/calorie-tracker.git
cd calorie-tracker
npm install
cp .env.example .env
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then in the SQL editor run, in order:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_ai_features.sql`

Copy your Project URL and anon key from **Settings → API** into `.env`.

In **Authentication → Providers** enable Email/Password. Optional: Google OAuth.

### 3. Pick an AI provider (optional, but needed for all AI features)

Two backends are supported. Both implement the same 8 feature functions. Switch with **one env var**.

**Option A — Groq (recommended, free, hosted):**
- Sign up at [console.groq.com](https://console.groq.com), create an API key
- In `.env`:
  ```
  VITE_AI_PROVIDER=groq
  VITE_GROQ_API_KEY=gsk_...
  ```
- Done. Restart `npm run dev`.

**Option B — Ollama (self-hosted on Oracle Cloud):**
- Provision an ARM A1.Flex VM (4 OCPU / 24 GB RAM — Oracle free forever tier)
- Install Ollama, pull `llama3.2` and `llama3.2:1b`
- Put Nginx in front with API-key header auth + SSL
- In `.env`:
  ```
  VITE_AI_PROVIDER=ollama
  VITE_OLLAMA_URL=https://<your-public-ip>
  VITE_OLLAMA_API_KEY=<your-key>
  ```
- Full step-by-step in the section below.

The app runs fine without either — AI features just show "AI features unavailable" until you wire one up.

### 4. Run

```bash
npm run dev         # http://localhost:5173
npm run build       # production bundle
npm run test        # vitest (unit + component)
npm run test:e2e    # playwright (E2E against dev server with VITE_E2E=1)
npm run test:all    # build + unit + E2E — the pre-commit gate
```

---

## Full setup guide

### Supabase (≈15 min)

1. Create account at [supabase.com](https://supabase.com), then **New Project** → name `calorie-tracker`, pick a region near you.
2. After provisioning, go to **Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. **Authentication → Providers**:
   - Email: enabled. Turn off "Confirm email" while developing.
   - Google (optional): create OAuth credentials in Google Cloud, paste client ID + secret.
4. **SQL Editor → New query** → paste contents of `supabase/migrations/0001_initial_schema.sql`, **Run**. Repeat for `0002_ai_features.sql`.
5. Verify in **Table Editor** that you have all 8 tables: `profiles`, `weight_log`, `food_log`, `activity_log`, `water_log`, `user_foods`, `meal_templates`, `ai_summaries`. All should show RLS enabled.

### Oracle Cloud + Ollama (≈45 min)

#### Create the VM
1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (requires a card for ID, no charges on free tier).
2. **Compute → Instances → Create Instance**:
   - Image: Ubuntu 22.04
   - Shape: `VM.Standard.A1.Flex` (Ampere ARM), 4 OCPUs / 24 GB RAM
   - Boot volume: 50 GB
   - Public IPv4: yes
   - Paste your SSH public key (`~/.ssh/id_ed25519.pub`)
3. Note the **Public IP** once it's running.

#### Install Ollama and Nginx
```bash
ssh ubuntu@<public-ip>

curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
ollama pull llama3.2:1b
sudo systemctl enable ollama
sudo systemctl restart ollama

# Generate an API key — save it
openssl rand -hex 32

sudo apt update && sudo apt install -y nginx

# Self-signed cert for the IP
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ollama.key \
  -out /etc/ssl/certs/ollama.crt \
  -subj "/CN=<public-ip>"
```

#### Nginx config
Create `/etc/nginx/sites-available/ollama` with (replace `YOUR_KEY` and `<public-ip>`):
```nginx
server {
    listen 443 ssl;
    server_name <public-ip>;

    ssl_certificate     /etc/ssl/certs/ollama.crt;
    ssl_certificate_key /etc/ssl/private/ollama.key;

    location /api/ {
        if ($http_x_api_key != "YOUR_KEY") {
            return 401 '{"error":"Unauthorized"}';
        }
        proxy_pass         http://127.0.0.1:11434/api/;
        proxy_set_header   Host $host;
        proxy_read_timeout 120s;
        proxy_buffering    off;
    }
}
```
Enable:
```bash
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

#### Open port 443
1. On the VM:
   ```bash
   sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
   sudo apt install -y iptables-persistent
   sudo netfilter-persistent save
   ```
2. In Oracle Console → **Networking → Virtual Cloud Networks → your VCN → Security Lists → Default**, add ingress rule: source `0.0.0.0/0`, TCP, port `443`.

#### Verify from your laptop
```bash
curl -k https://<public-ip>/api/tags -H "X-API-Key: YOUR_KEY"
# should list the installed models
```

### Gemini (optional, for photo analysis)

Photo analysis is currently stubbed with mock data so the UI is fully testable. To enable real AI:
1. Get a free key at [aistudio.google.com](https://aistudio.google.com).
2. Paste it in **Settings → Photo analysis (Gemini)**. It's stored per-user in Supabase.
3. Replace the body of `analyzeFoodPhoto()` in `src/services/geminiService.js` with the real Gemini 1.5 Flash call. No other file needs changes.

### Local `.env`

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_OLLAMA_URL=https://<oracle-public-ip>
VITE_OLLAMA_API_KEY=<key from openssl rand -hex 32>
```

Restart `npm run dev` after editing `.env`.

If you used a self-signed cert, visit `https://<public-ip>/api/tags` in your browser once and accept the warning — the in-app Test Connection button will then work.

### Vercel deployment (≈10 min)

1. [vercel.com](https://vercel.com) → New Project → import the repo. Framework auto-detected as Vite.
2. **Settings → Environment Variables** → add all four: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OLLAMA_URL`, `VITE_OLLAMA_API_KEY`.
3. Deploy. Copy the production URL.
4. In **Supabase → Authentication → URL Configuration**, set:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**` and `http://localhost:5173/**`

Pushes to `main` auto-deploy.

---

## Project structure

```
src/
├── lib/
│   ├── supabase.js              Supabase client (real or fake based on VITE_E2E)
│   └── supabaseFake.js          localStorage-backed fake for E2E tests
├── contexts/
│   └── AuthContext.jsx
├── services/
│   ├── aiService.js             Provider router (picks ollama or groq)
│   ├── ollamaService.js         Ollama implementation; mocks in E2E mode
│   ├── groqService.js           Groq implementation; mocks in E2E mode
│   ├── geminiService.js         Photo analysis (currently stubbed)
│   └── openFoodFacts.js         Barcode lookup
├── hooks/
│   ├── useProfile.js
│   ├── useFoodLog.js  useActivityLog.js  useWaterLog.js  useStreak.js
│   ├── useDailyTargets.js       BMR/TDEE/macros derived per render
│   └── useOllama.js             Connection check + feature flags
├── components/
│   ├── layout/                  AppShell, Sidebar, BottomNav
│   ├── auth/ProtectedRoute.jsx
│   ├── common/                  Modal, CalorieRing, ProgressBar
│   ├── log/                     FoodLogSection, AddFoodModal, all 5 tabs
│   ├── activity/                ActivityLogSection
│   └── ai/                      6 AI cards + FoodSwapSheet
├── pages/
│   ├── Login / Signup / ResetPassword / Onboarding
│   ├── Dashboard / Log / Trends / Profile / Settings
│   └── AIChat.jsx
├── utils/
│   ├── calculations.js          BMR, TDEE, BMI, MET, body fat, macros
│   └── appleHealthParser.js
└── tests/setup.js

supabase/migrations/
├── 0001_initial_schema.sql
└── 0002_ai_features.sql

e2e/                             37 Playwright specs
screenshots/                     Standalone Playwright spec for capturing all pages
```

---

## Testing

```bash
npm run test         # 66 unit + component tests
npm run test:e2e     # 37 E2E tests (spins up a dev server with VITE_E2E=1)
npm run test:all     # build + unit + E2E — the full pre-commit gate
```

E2E tests run against a `localStorage`-backed Supabase fake (`src/lib/supabaseFake.js`) and per-feature Ollama mocks — no real backend needed. All AI service functions and feature-component flows have coverage.

Capture screenshots of every page with seeded data:
```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test --config=screenshots/playwright.shots.config.js
# outputs to screenshots/out/
```

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| Dashboard stuck on spinner | Check `.env`; restart `npm run dev` after edits |
| "AI features unavailable" on every card | Settings → AI → re-paste URL + key + Test connection. Self-signed cert? Visit `https://<ip>/api/tags` in browser once. |
| Ollama responses 10+ seconds | Normal on 4-core ARM. Edit `MODEL` in `src/services/ollamaService.js` to `'llama3.2:1b'` |
| Vercel build fails | All four `VITE_*` env vars must be set; verify `npm run build` works locally first |
| Oracle "out of capacity" | A1.Flex free shapes get used up; try a different region or retry |
| Supabase auth links go to localhost in production | Add the Vercel URL + `/**` to **Auth → URL Configuration** |
| Tests fail with "browser not found" | `npx playwright install chromium` |

---

## Git workflow

- `main` is the deploy branch — every push auto-deploys to Vercel
- All feature work happens on `feature/<name>` branches
- Pre-commit gate: `npm run test:all` must pass before merging
- Commit messages: short imperative summary, 1–2 lines max

Detailed rules in [CLAUDE.md](./CLAUDE.md) (used by Claude Code agents working on this repo).

---

## License

MIT.
