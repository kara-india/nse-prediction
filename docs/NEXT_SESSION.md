# Next Session Checkpoint

Date: 2026-11-23
Repository: https://github.com/kara-india/nse-prediction
Current default branch: main

## Current state

- Existing repository is an early scaffold with a substantial research documentation set.
- `docs/IMPLEMENTATION_PLAN.md` is the canonical implementation roadmap.
- `docs/research/addendum-htcn-rl-and-daily-learning.md` adds the HTCN/RL feasibility workstream, candidate repo audit, daily Day B → Day B+1 evaluation lifecycle, immutable memory/ledgers and approval-controlled self-improvement governance.
- `docs/research/14-global-market-regime-features.md` defines timestamped US/Asia/GIFT Nifty/India market-context inputs, separate opening/intraday/close forecasts, freshness checks and walk-forward validation.
- `docs/market-briefs/2026-11-23-pre-market.md` records the 05:03 IST case study. It is research context, not a calibrated model forecast.
- `src/types/market-context.ts` defines typed, timestamped market-observation, entitlement, snapshot and forecast contracts. `Prediction` and `Signal` now optionally link to a market-context snapshot.
- No model training, trading automation, broker integration or production deployment has been authorised by this checkpoint.

## First task

Begin Phase 0:
1. Read `docs/IMPLEMENTATION_PLAN.md`, `RESEARCH_SUMMARY.md`, `AGENTS.md` and every file in `docs/research/`.
2. Read `docs/research/addendum-htcn-rl-and-daily-learning.md` and `docs/research/14-global-market-regime-features.md`.
3. Review the 23 Nov 2026 market brief as a case study in timestamped multi-source cues; do not hard-code its bias or reuse it as a training observation.
4. Review the new market-context types in src/types/market-context.ts and audit provider/service interfaces for entitlement- and freshness-aware integration. These are contracts only; no provider has been approved and no ingestion/model behaviour exists yet. The market-cue feature groups require Phase 0 source-rights review before data ingestion or model use.
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

An isolated TypeScript strict compile of the new market-context contract passed. A full repository build/test, provider integration, model training, and UI localhost verification were not run. No production deployment was performed.

## Next-session completion output

Report the Phase 0 artifacts, sources and dates checked, unresolved issues, exit-gate result and the exact next authorised task.
