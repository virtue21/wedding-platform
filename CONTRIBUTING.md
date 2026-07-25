# Branching & Release

## Branches

| Branch | Environment | URL |
|---|---|---|
| `main` | Production | https://nemiplanner.xyz |
| `uat`  | Testing | Vercel preview URL for the branch |

**Nothing goes straight to `main`.** Build on `uat`, verify on the preview
URL, then merge to `main` to release.

## Day-to-day

```bash
# start work
git checkout uat && git pull

# ...make changes, commit...
git push                      # deploys to the UAT preview URL

# once verified on UAT, release:
git checkout main && git pull
git merge uat
git push                      # deploys to nemiplanner.xyz
git checkout uat              # go back to working on uat
```

## Hotfixes

For something broken in production, fix on `main` directly, then bring
`uat` back in line so it doesn't drift:

```bash
git checkout main && git pull
# ...fix, commit...
git push
git checkout uat && git merge main && git push
```

## Vercel setup (one-time)

Project → Settings → Git:

- **Production Branch**: `main`
- Leave preview deployments enabled — `uat` gets its own stable URL.

## Environment variables

Vercel scopes variables per environment: add the **same name twice**, once
ticked for Production (live value) and once for Preview (test value).
Every variable the app reads must exist in **both**, or UAT builds fine
and then fails at runtime with missing-key errors.

Must differ between Production and Preview:

| Variable | Production | Preview (UAT) |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | `sk_live_…` | `sk_test_…` |
| `PAYSTACK_CALLBACK_BASE_URL` | `https://nemiplanner.xyz` | UAT URL |
| `NEXT_PUBLIC_APP_URL` | `https://nemiplanner.xyz` | UAT URL |
| `NEXT_PUBLIC_BASE_URL` | `https://nemiplanner.xyz` | UAT URL |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | live token | separate project, or blank |
| `SUPERADMIN_PASSWORD` | live value | a different value |

Safe to share: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`,
`GOOGLE_SERVICE_ACCOUNT_KEY`, `SUPERADMIN_EMAIL`,
`SUPERADMIN_SESSION_SECRET`.

**Why the URL variables matter:** if UAT inherits the production values, a
test payment redirects into the live app and activates a real
subscription, and password-reset/payment emails sent from UAT link
recipients to production. Getting these wrong is worse than having no
UAT at all.

Use the branch's stable alias for the UAT URLs — the
`…-git-uat-…vercel.app` one, not a per-deployment URL, which changes on
every push.

## Database caveat — read this

Both environments currently point at the **same Supabase project**.
Branching isolates *code*, not *data*: a test RSVP made on UAT lands in
the real guest list, and a migration run for UAT changes production.

Until a separate Supabase project exists for UAT:

- Prefer a dedicated test wedding/account for UAT work.
- Treat schema migrations as production changes regardless of branch.
- Don't test destructive flows (deleting slides, removing guests) against
  real couples' records.
