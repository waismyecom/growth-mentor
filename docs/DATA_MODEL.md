# Data model

Migration: `supabase/migrations/202609110001_growth_mentor.sql`.

Additional migrations implement transactional initialization, scorecard saving, mentor plan conversion, audit grading, timezone boundaries and missing-domain handling.

All business records belong to a workspace. Composite foreign keys prevent cross-workspace references. Anonymous/authenticated clients receive no table grants or policies; the server mediates access using its visitor workspace context. Migration runs in one transaction and must be recorded/applied once by Supabase migrations.

- **workspaces**: visitor identity, timezone, created timestamp.
- **visions**: one editable ten-year anchor per workspace.
- **goals**: title, pillar, long/short term, life domain, horizon, parent, baseline, target, unit, direction, deadline, status, reward and voluntary stake.
- **weekly_scorecards**: workspace + ISO-week Monday unique; reflection.
- **scorecard_entries**: one immutable goal-id snapshot per card with title/pillar snapshot, rating 1–10 and note. Original goal can be deleted without deleting history.
- **commitments**: domain, optional goal, activity, numeric daily and weekly targets, unit, archive flag.
- **mentor_interviews**: persisted proposal, challenge feedback and revise/ready/converted status.
- **activity_logs**: one nonnegative evidence quantity per commitment per local date plus note.
- **weekly_audits**: one per week; seven domain scores and their evidence/commitment snapshots stored in entries. Audit grading is separate from subjective PRD scorecards.
- **audit_entries**: unique domain per audit, 0–10 score, evidence snapshot. Complete seven-domain saves are a server transaction invariant.
- **diagnostics**: domain, persisted interview turns, hypothesis, exactly one corrective action and deadline when completed.

The server validates workspace ownership, strict date/ISO-week boundaries, all active goals present in scorecard submissions, same-workspace/horizon-valid parent edges, finite metric values, and payload sizes. Atomic scorecard and audit saving should use scoped database RPCs, not successive browser writes. Seed insertion must also be transactional and idempotent by workspace.

Deleting a goal detaches its child goals and commitments; historical scorecard snapshots remain. Deleting a commitment deletes associated activity logs, so archive is the normal UI action once evidence exists. The schema supplies archive/status fields to preserve those logs.
