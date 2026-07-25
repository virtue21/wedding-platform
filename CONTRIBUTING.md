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

Environment variables (Settings → Environment Variables) apply per
environment. Anything the app needs must be ticked for **Preview** as
well as **Production**, or UAT will fail with missing-key errors.

## Database caveat — read this

Both environments currently point at the **same Supabase project**.
Branching isolates *code*, not *data*: a test RSVP made on UAT lands in
the real guest list, and a migration run for UAT changes production.

Until a separate Supabase project exists for UAT:

- Prefer a dedicated test wedding/account for UAT work.
- Treat schema migrations as production changes regardless of branch.
- Don't test destructive flows (deleting slides, removing guests) against
  real couples' records.
