# Next Session Checkpoint

Date: 2026-11-13
Repository: https://github.com/kara-india/nse-prediction
Current default branch: main

## Current state

- Existing repository is an early scaffold with a substantial research documentation set.
- `docs/IMPLEMENTATION_PLAN.md` is the canonical implementation roadmap.
- `docs/research/addendum-htcn-rl-and-daily-learning.md` adds the HTCN/RL feasibility workstream, candidate repo audit, daily Day B → Day B+1 evaluation lifecycle, immutable memory/ledgers and approval-controlled self-improvement governance.
- No model training, trading automation, broker integration or production deployment has been authorised by this checkpoint.

## First task

Begin Phase 0:
1. Read `docs/IMPLEMENTATION_PLAN.md`, `RESEARCH_SUMMARY.md`, `AGENTS.md` and every file in `docs/research/`.
2. Read `docs/research/addendum-htcn-rl-and-daily-learning.md`.
3. Audit the current implementation and reconcile contradictions (notably stop-loss direction, purge/embargo and provider entitlements).
4. Run the independent research workstreams defined in the plan.
5. Create Phase 0 deliverables and `docs/phase-0-status.md`.
6. Stop at the Phase 0 exit gate before building data ingestion or models.

## Important gates

- Use synthetic/fixture data for the first dashboard until provider rights are verified.
- Review current Indian Research Analyst requirements before making stock-specific recommendations publicly available.
- Review current SEBI/NSE/broker algo requirements before any API order transmission.
- Research HTCN/RL; do not assume it is better than simpler models.
- Daily outcome resolution may update immutable outcome/memory records and diagnostics, but must not silently rewrite source code or promote unvalidated weights.
- Do not deploy to production until Codex has tested the complete UI on localhost and written `docs/ui-localhost-verification.md`.

## Commands / test status

No repository build, model-training job, or UI localhost verification was performed as part of publishing this planning checkpoint.

## Next-session completion output

Report the Phase 0 artifacts, sources and dates checked, unresolved issues, exit-gate result and the exact next authorised task.
