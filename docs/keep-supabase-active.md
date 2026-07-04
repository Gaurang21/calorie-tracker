# Keep a Supabase project from pausing (free tier)

Supabase pauses free-tier projects after **7 days of inactivity**. This sets up a
GitHub Actions cron job that pings the project every 5 days so it never pauses.
No servers, no cost, works for any project with a GitHub repo.

---

## 1. Add the workflow file

Create `.github/workflows/keep-supabase-active.yml` in your repo:

```yaml
name: Keep Supabase active

on:
  schedule:
    # Every 5 days at 08:00 UTC (comfortably inside the 7-day pause window)
    - cron: '0 8 */5 * *'
  workflow_dispatch: # lets you run it manually from the Actions tab

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase REST API
        env:
          SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          # Safe diagnostics — prints lengths only, never the secret values.
          echo "URL secret length:      ${#SUPABASE_URL}"
          echo "Anon key secret length: ${#SUPABASE_ANON_KEY}"
          if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
            echo "A secret is EMPTY. Check that both are Repository secrets (not Environment secrets) and the names match exactly."
            exit 1
          fi
          # Query a real table with the anon key. RLS returns an empty set
          # (still HTTP 200) for unauthenticated requests, which is all we
          # need — it exercises PostgREST + Postgres and registers activity.
          STATUS=$(curl -s -o /tmp/resp.txt -w "%{http_code}" \
            "$SUPABASE_URL/rest/v1/TABLE_NAME?select=id&limit=1" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY")
          echo "Supabase responded with HTTP $STATUS"
          echo "Response body: $(head -c 400 /tmp/resp.txt)"
          if [ "$STATUS" -lt 200 ] || [ "$STATUS" -ge 300 ]; then
            echo "Non-2xx response — see body above for the reason."
            exit 1
          fi
          echo "Supabase is awake."
```

**Change `TABLE_NAME`** to any table that exists in your project's `public` schema
(e.g. `profiles`). If the column `id` doesn't exist, use `select=*` instead.

> Secret names above (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) match a Vite
> app's convention. Rename them to whatever you like — just keep the workflow
> references and the GitHub secret names identical.

---

## 2. Add the two repository secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**.

Add exactly these two (they must be **Repository secrets**, *not* Environment secrets —
a job with no `environment:` key cannot read Environment secrets, and they'll arrive
blank):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Base project URL, e.g. `https://abcdefgh.supabase.co` — **no trailing slash, no `/rest/v1`** |
| `VITE_SUPABASE_ANON_KEY` | The **`anon` `public`** key from Supabase → Project Settings → API |

When pasting: the **Name** field only accepts letters/numbers/underscores; the long
key goes in the **Secret (value)** field below it. Watch for a stray space or newline.

---

## 3. Run it once to verify

**Actions tab → Keep Supabase active → Run workflow** (branch `main`).

A healthy run prints:

```
URL secret length:      40
Anon key secret length: 208
Supabase responded with HTTP 200
Response body: []
Supabase is awake.
```

An empty `[]` body is correct — Row Level Security hides rows from the anonymous key,
but the request still reached Postgres (HTTP 200), which is what resets the pause timer.

After this, it runs automatically every 5 days. Done.

---

## Troubleshooting (read the output top-to-bottom)

| Symptom | Cause | Fix |
|---|---|---|
| `Anon key secret length: 0` (or URL length 0) | Secret is empty | It was saved as an **Environment** secret, or the name has a typo. Recreate as a **Repository** secret with the exact name. |
| Key length looks ~10+ chars short of the real key | Truncated paste | Re-copy the whole `anon` key and re-paste into the secret. |
| `401 {"message":"Invalid API key","hint":"Only the service_role API key can be used for this endpoint."}` | You pinged the privileged REST **root** (`/rest/v1/`) | Point at a real table: `/rest/v1/TABLE_NAME?select=id&limit=1` (already done above). |
| `401 {"message":"Invalid API key"}` (no service_role hint) | Wrong/stale key, or JWT secret was rotated | Copy the current `anon` key from Project Settings → API. |
| `401 No API key found in request` | apikey header is empty | Same as the empty-secret case above. |
| `404` on the table query | Table doesn't exist in `public` | Change `TABLE_NAME` to a table you actually have. |
| Project shows **"Paused"** in the dashboard | It already sat idle >7 days | Click **Restore** once in the dashboard; the cron keeps it awake afterward. |

### Why a cron and not something else?
- A Vercel/Netlify SPA only makes Supabase calls when a **user** visits — no visitors for a week = pause. GitHub Actions cron runs regardless of traffic.
- Pinging every **5 days** leaves a 2-day safety margin under the 7-day limit (in case GitHub delays a scheduled run, which it occasionally does under load).
- The ping hits an actual table (PostgREST → Postgres), so it counts as genuine database activity, not just an edge/CDN hit.

### Verifying the anon key locally (optional)
The `anon` key is public by design (it ships in your client bundle), so it's safe to
test directly:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  "https://YOUR_REF.supabase.co/rest/v1/TABLE_NAME?select=id&limit=1" \
  -H "apikey: YOUR_ANON_KEY" -H "Authorization: Bearer YOUR_ANON_KEY"
```

`HTTP 200` locally but `401` in Actions ⇒ the problem is purely how the secret was
entered in GitHub. Never store the `service_role` key or JWT secret in a public repo's
secrets unless you truly need them — the `anon` key is enough for a keep-alive.
