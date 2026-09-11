# Growth Mentor

Working personal growth app: vision → measurable goals → weekly scorecards, plus a structured mentor, milestone hierarchy, daily evidence, seven-domain audits and one-action diagnostics.

## Run locally

Use Node 22+ and pnpm 10.17.1. Run `pnpm install`, `vercel link` to the **waismyecom/growth-mentor** project, then `vercel env pull .env.local` and `pnpm dev`.

Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- SESSION_SECRET (server only, random secret)

Supabase project: `ogtqixrndribfnjubkfm`. Apply migrations with `supabase link --project-ref ogtqixrndribfnjubkfm` then `supabase db push`. Never run a database reset against production.

## Validate and deploy

`pnpm typecheck` and `pnpm build`. With a running local server, run `TEST_URL=http://localhost:3000 pnpm test:core` and `TEST_URL=http://localhost:3000 pnpm test:mentor`. These checks create separate, test-only visitor workspaces in the configured database and retain those records for inspection.

Commit and push to `main`; Vercel automatically deploys from Git. Do not deploy local files with Vercel CLI. Production: https://growth-mentor-blush.vercel.app

## Behavior and limits

- No login wall: each browser gets a signed HttpOnly visitor cookie and editable sample goals. Clearing cookies loses access to that workspace; account login/recovery is not implemented.
- Every query is scoped by the server; direct anonymous table access is denied by RLS. Service-role credentials never enter client bundles.
- Weekly goal ratings are subjective 1–10 assessments. Evidence audits separately calculate commitment adherence from logged quantities. Missing domains have no score; zero logged progress against a commitment scores zero.
- Audits freeze evidence and commitment snapshots. An explicit refresh of the selected week recalculates it.
- The mentor is a deterministic, structured workflow, not an external AI model. It requires numeric targets and deadlines, records pushback/reasoning, and creates linked milestones transactionally. Health targets do not use blanket 10× prescriptions.
- Double-click uses four guided questions, a user-confirmed working hypothesis and one measurable action. It does not diagnose people or claim to discover hidden facts.
- Stakes are voluntary reminders, never automatic transactions. No notifications, payments or human coaching are part of this release.

See `docs/PRD.md`, `docs/MENTOR_SPEC.md`, and `docs/TASKS.md` for requirements and delivery evidence.
