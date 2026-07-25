# Setting up a separate Supabase project for UAT

Right now UAT and production share one Supabase project. Branching protects
users from broken *code*, but not from destructive *data* changes — a bad
delete or an untested migration on UAT hits the live database immediately.

This gives UAT its own database, auth users, and storage.

**Cost:** free. Supabase allows 2 active projects on the free plan.

**Time:** ~45–60 minutes, mostly waiting for the project to provision.

---

## Before you start

Two things to be aware of, because they bite later:

- **Free projects pause after 1 week of inactivity.** UAT will sleep between
  testing sessions. Waking it is one click in the dashboard, but a paused
  project throws connection errors that look like application bugs. If UAT
  suddenly can't reach the database, check this first.
- **Every future migration must be run twice** — once per project. Skipping
  one is how environments drift and "works on UAT" stops meaning anything.

---

## 1. Create the project

1. supabase.com/dashboard → **New project**
2. Name: `nemiplanner-uat`
3. Same region as production (lower surprise in behaviour)
4. Generate a strong database password and save it in your password manager
5. Wait for provisioning (~2 minutes)

## 2. Replay the schema

In the new project: **SQL Editor** → New query.

Run each file from `supabase/migrations/` **in numerical order**, one at a
time, confirming each succeeds before the next. Order matters — later
migrations depend on tables earlier ones create.

```
001_initial_schema.sql
002_gift_claims_guest_link.sql
003_subcategories_photos_notes.sql
004_venue_state_registry_currency.sql
005_fix_subcategory_rls.sql
006_payment_methods_storage.sql
007_notes_photos_rsvp_settings.sql
008_story_slides.sql
009_plans_subscriptions.sql
010_subscription_statuses.sql
011_audit_logs.sql
012_drive_folder.sql
013_story_images_flag.sql
014_registry_images_bucket.sql
```

What these give you, so you can spot a missed one:

| Migration | Creates |
|---|---|
| 001 | Core tables: weddings, guests, categories, registry, tables |
| 006 | `cover-images` + `cash-receipts` buckets |
| 007 | `wedding-moments` bucket, notes, RSVP settings |
| 008 | `story-images` bucket, story slides |
| 009 | plans + subscriptions, **and seeds the four plans** |
| 011 | audit_logs |
| 012 | Drive folder columns on weddings |
| 013 | `has_story_images` on plans |
| 014 | `registry-images` bucket |

## 3. Verify

In the new project, check:

- **Table Editor** — `plans` has 4 rows (Ember, Classic, Grand, Prestige).
  If empty, 009 didn't run.
- **Storage** — five buckets: `cover-images`, `cash-receipts`,
  `wedding-moments`, `story-images`, `registry-images`. All public.
- **Authentication → Providers** — enable Email, and match production's
  "Confirm email" setting.
- **Authentication → URL Configuration** — set Site URL to
  `https://uat.nemiplanner.xyz` and add `https://uat.nemiplanner.xyz/auth/callback`
  to Redirect URLs. Without this, signup confirmation and password reset
  on UAT will bounce people to production.

## 4. Point UAT at it

Supabase project → **Settings → API**. Copy:

- Project URL
- `anon` public key
- `service_role` key (secret — server-side only)

In Vercel → Settings → Environment Variables, add each of these a second
time scoped to **Preview only**, with the UAT project's values:

| Variable | Preview value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | UAT project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | UAT anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | UAT service role key |

Make sure the existing production copies are scoped to **Production only**,
not "Production and Preview" — otherwise they'll conflict.

Then **redeploy `uat`** (Deployments → the `uat` row → ⋯ → Redeploy). Env
var changes only apply to new builds.

## 5. Confirm the split

On `uat.nemiplanner.xyz`:

1. Sign up a fresh couple account — it should **not** already exist, proving
   you're on a different auth store.
2. Check production's superadmin dashboard — the new account should **not**
   appear there.

If the new account shows up in production, Preview is still using the
production keys — recheck step 4.

---

## Ongoing: running migrations

For every new migration from now on:

1. Write it in `supabase/migrations/`
2. Run it in **UAT** first, test the feature on `uat.nemiplanner.xyz`
3. Merge `uat` → `main`
4. Run the same migration in **production** immediately after

Running it in production *before* merging is the safer order if the
migration is additive (new column, new table), since old code ignores new
columns. For destructive changes (dropping or renaming), deploy the code
first, then migrate.
