# growth-mentor — Product Requirements

## Problem
People default to incremental, safe goal-setting. Without a 10-year vision anchoring daily decisions, weekly effort scatters across urgent-but-unimportant work. A personal growth mentor or coach fixes this — but costs thousands and needs scheduled human sessions.

growth-mentor replaces that coach with a structured system: you define a 10-year vision, break it into long-term and short-term goals across Health, Soft Skills, Education, and Career, then run a weekly scorecard that measures real progress against those goals.

## Target user
The builder and their students — individuals committed to exponential (10x) growth who want a self-driven system, not a human coach.

## Core objects
- **Vision** — a single 10-year aspirational anchor (one active per user).
- **Goal** — long-term (1–10 yr) or short-term (this quarter) goal, tagged by pillar: Health, Soft Skills, Education, Career.
- **WeeklyScorecard** — one per ISO week; holds a self-rated score per active goal + reflection note.
- **ScorecardEntry** — individual score line inside a scorecard (goal_id, score 1–10, note).

## MVP (v1) checklist
- [ ] Create / edit a 10-year vision statement
- [ ] CRUD long-term & short-term goals across 4 pillars
- [ ] Generate a weekly scorecard listing all active goals with 1–10 self-rating + note per goal
- [ ] View scorecard history (past weeks)
- [ ] Scorecard summary: average score, trend vs last week, pillar breakdown
- [ ] Demo seed data visible without login

## Non-goals (v1)
- Human review / coaching check-ins
- AI-driven goal suggestions or chat coaching
- Notifications / reminders / email
- Multi-user collaboration or sharing
- Authentication & per-user data isolation (later sprint)

## Success criteria
A user opens the app without logging in, sees a demo vision with goals across all 4 pillars, creates their own vision, adds a short-term goal under "Health", opens this week's scorecard, rates every active goal 1–10, saves, and sees the updated weekly average + pillar breakdown reflected on screen — all persisted to the database and visible after refresh.