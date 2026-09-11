# Architecture

Next.js App Router, TypeScript, Supabase Postgres, Vercel deployments triggered by GitHub pushes. No local-storage or in-memory substitute for persistence.

## Scope and reconciliation

The PRD's four pillars (Health, Soft Skills, Education, Career) and manually rated weekly goal scorecards remain available. The added mentor specification extends this with seven life domains and a separate evidence-derived weekly audit. Manual goal ratings must never be presented as objective audit scores.

The homepage is the working application. A random, signed, HttpOnly visitor cookie identifies a private demo workspace without a login wall. The server creates editable demo records once. Server-only Supabase service credentials access records with an explicit workspace filter on every query and mutation; the browser receives no service credential. RLS denies direct anonymous access. Anonymous access is limited to unclaimed demo workspaces. The sign-in extension verifies Supabase users on the server, restores their owned workspace or atomically claims the unclaimed visitor workspace on first sign-in. Claimed workspaces can never be accessed using only a visitor cookie. Supabase handles email-based account recovery through a new sign-in link. Public email delivery requires a configured SMTP provider.

## Core workflow

1. Resolve visitor workspace; transactionally initialize a vision and four pillar goals.
2. Edit vision; create, update, archive or delete goals.
3. Open the ISO-week scorecard, rate each active goal and add notes; atomically save a complete entry set. Preserve goal title/pillar snapshots so past scorecards survive goal deletion.
4. Re-read stored results to display weekly average, previous-week trend, pillar breakdown and history. Refresh must reproduce saved results.

## Mentor extension

Goals have optional baseline, numeric target, unit, direction, deadline and a parent milestone. Enforce parent scope and descending horizons (10-year → 3-year → annual → quarterly). An interview challenges missing metrics/deadlines and asks for evidence behind conservative targets. A blanket 10x threshold is a coaching prompt, not a medical recommendation or fabricated industry benchmark. Health targets remain user-defined and should not prescribe daily strenuous exercise or calorie restriction.

Track seven domains independently: Health, Relationships, Love, Work, Money, Fun, Personal Growth. Non-negotiables specify measurable weekly commitments. Dated evidence logs drive audit scores: round(10 × min(actual / commitment, 1)); inverse metrics need explicit direction and zero-safe handling. Missing evidence is reported explicitly. Show coverage alongside scores; highlight the two lowest scored domains with deterministic tie ordering. Freeze audit evidence and commitment snapshots when saved; do not silently rewrite history after targets change.

Double-click diagnostics persist each question/answer and distinguish proposed hypotheses from facts. Collect concrete examples, probe why/how and avoidance, then save exactly one measurable corrective action with a deadline. Provide this structured workflow without AI; if a provider is configured later, constrain and validate its output against the same contract and label the source.

Annual/quarterly milestone rewards and voluntary stakes are saved as text. The app never executes a consequence. Dashboard combines local-calendar days remaining, quarterly completion and daily non-negotiable alignment; show 'No commitments' rather than inventing an on-track state.

## Deployment prerequisites

The connected Vercel account must have repository write/admin access and a GitHub integration. Pull development variables using `vercel env pull .env.local`; configure equivalent production variables. Require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and a server-only SESSION_SECRET. Apply the committed SQL migration through the intended Supabase project before implementing dependent screens. Never use another app's database implicitly.
