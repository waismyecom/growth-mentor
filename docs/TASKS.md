# Delivery sprints

## Sprint 0 — provisioning and schema
- [x] Clone into the Mac mini's Documents/My app folder; set Git identity.
- [x] Read every existing docs file and added feature brief; confirm the plan.
- [x] Write missing architecture/data model/task documents and schema migration.
- [x] Authenticate GitHub push and link the correct provisioned Vercel project.
- [x] Pull Supabase environment, inspect existing schema, apply migration, verify permissions.

## Sprint 1 — complete PRD job
- [x] Implement scoped visitor workspace and editable transactional seed.
- [x] Vision editing; goal create/edit/archive/delete, all four pillars.
- [x] Complete weekly rating form, atomic save, reflection and history.
- [x] Average, prior-week trend and pillar breakdown derived from persisted entries.
- [x] Verify exact PRD success scenario in a real browser, including refresh and a second isolated visitor.
- [x] Typecheck/build; commit and push; verify resulting Git deployment.

## Sprint 2 — mentor and execution
- [x] Persist structured mentor interview, metric/deadline pushback and hierarchical milestones.
- [x] Daily commitments/evidence, seven-domain objective audit with snapshots and two lowest domains.
- [x] Persist multi-turn diagnostic ending in exactly one corrective action.
- [x] Rewards, voluntary stakes, days remaining, quarterly progress and daily alignment.
- [x] Verify create/edit/reload and failure states; test zero/missing evidence and historical stability.
- [x] Typecheck/build; commit and push; verify deployment.

## Sprint 3 — acceptance
- [ ] Run complete vision → goal → evidence → audit → diagnostic → corrective action flow against real Supabase.
- [ ] Check mobile layout, keyboard access, validation, empty states, server errors and cross-workspace denial.
- [ ] Re-run PRD manual scorecard scenario, proving its independent averages and history.
- [ ] Commit/push fixes and verify production persistence. Document remaining account-security limitations accurately.

## Current provisioning evidence

On 2026-09-11 the only connected Vercel team was `waismahbub71-aiab`. Linking `growth-mentor` created an empty project; GitHub linking failed for lack of repository access. Development env pull returned only Vercel OIDC; production env listing was empty. `git push --dry-run origin main` failed because GitHub credentials were unavailable. No Supabase migrations existed in the original repository. No migration has been applied, and no working deployment is claimed.

2026-09-11 update: local Vercel login corrected to waismyecom, Supabase project ogtqixrndribfnjubkfm linked, migrations 001 and 002 applied. Server key and session secret configured in all Vercel environments. Sprint 1 browser acceptance and core API isolation/atomicity checks passed; production build passed.

Sprint 2: migration 003 applied. Both production build and mentor integration test passed. Browser verified pushback, accepted revision and milestone submission. Live AI provider is not configured; the shipping coach uses explicitly labeled structured rules.
