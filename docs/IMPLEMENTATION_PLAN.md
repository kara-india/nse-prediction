# NSE Prediction — Implementation Plan

Repository: https://github.com/kara-india/nse-prediction
Status: Research-first implementation plan published; no production trading or deployment authorised.
Last updated: 2026-11-13

## Product goal

Build an evidence-led NSE equity intelligence platform. The first product milestone is a premium minimalist dashboard with an earnings-results calendar, candidate research pages and grounded AI explanations. The long-term destination is a validated recommendation engine, then paper trading, and only much later broker-connected automation.

## Maturity gates

1. Intelligence dashboard with synthetic/fixture data until source entitlements are verified.
2. Validated recommendations backed by point-in-time data, walk-forward evidence and net-of-cost results.
3. Paper trading with realistic execution, portfolio/risk controls and immutable audit records.
4. Broker automation only after current SEBI/exchange/broker and legal approvals.

## Roadmap

| Phase | Scope | Exit gate |
|---|---|---|
| 0 | Repository/research audit; competitor teardown; data entitlements; regulatory review; reconcile contradictions | Approved architecture, data-source status matrix, competitor matrix, documented open issues |
| 1 | White/ivory and muted-gold Next.js dashboard; upcoming/weekly/past results; filters; stock detail; research-preview panel; optional Gemini explainer | Codex runs localhost; verifies flows using fixtures; writes `docs/ui-localhost-verification.md`; production deployment remains separately gated |
| 2 | Point-in-time earnings events and filing revisions; provenance and reconciliation | Historical event records have identifiers, actual filing timestamps, source provenance and revision lineage |
| 3 | Pre- and post-announcement event studies, including PEAD and low-activity hypotheses | Prespecified experiments, placebo tests, cost model, multiple-testing controls and falsifiable conclusions |
| 4 | Baselines, supervised models, probability calibration, quantile/uncertainty estimates and chronological validation | OOS and untouched-holdout evidence vs baselines; no leakage; net-of-cost results |
| 5 | Independent momentum, breakout, pullback, reversal, sector and regime strategy research; later HTCN/RL feasibility | Strategy-specific acceptance or documented rejection |
| 6 | Immutable recommendation service, risk gates, grounded Gemini explanations | Every recommendation links to a stored model result and valid data/model versions; abstention works |
| 7 | Paper trading, realistic fills, partial fills, costs, limits, monitoring and rollback | Stable paper execution and complete audit trail |
| 8 | Broker integration and automation | Separate legal, broker, exchange, security and operational sign-off |

## Non-negotiable engineering controls

- Verify source entitlements separately for display, storage, backtesting, training, derived signals, redistribution and commercial use.
- Features use only information available at decision time. Preserve filing timestamps and actual first tradable prices.
- Store point-in-time snapshots and immutable predictions/outcomes with reproducible hashes and model versions.
- Include delisted stocks, historical universe membership, corporate actions, realistic spreads, costs, slippage, liquidity and capacity.
- Use trading-session calendars and label-horizon-derived purge/embargo; never hard-code one split gap for all horizons.
- Compare to simple baselines; prevent final-holdout reuse and parameter/data snooping.
- Do not use RL or HTCN until its research gate is passed. Do not equate daily outcome resolution with safe source-code mutation.
- AI is an explainer only; it cannot invent financial facts or override the decision engine.
- Public-facing stock-specific recommendations need an Indian regulatory classification/legal review, including Research Analyst requirements. Broker order automation needs a separate current SEBI/NSE/broker review.
- No autonomous live orders, no code self-modification in production, and no strategy promotion without review.

## Parallel work protocol

Use up to three independent agents by default (a fourth may be added if capacity permits):
1. Repository/architecture audit (read-only).
2. Quant research and PEAD experiment design.
3. Data entitlement, provider and regulatory review.
4. Optional product/competitor teardown.

Each agent owns separate outputs. The orchestrator owns shared contracts, decisions, integration, test gates and final docs. Do not allow concurrent agents to edit the same files. Reconcile disagreements with evidence before phase sign-off.

After every phase, update the relevant research docs, `RESEARCH_SUMMARY.md`, `AGENTS.md`, `README.md` and `docs/phase-N-status.md`, as applicable. Commit the phase deliverables and status report.

## Deployment gate

Vercel configuration and preview preparation may be done when appropriate. Do not deploy to production until Codex has run the UI locally, tested the calendar, filters, stock detail, research-preview and AI explainer (if included) using fixtures, fixed the issues, and written `docs/ui-localhost-verification.md`. Production deployment needs explicit approval after that report.

## Immediate next task

Start Phase 0. Read all existing research docs and the HTCN/RL addendum. Produce evidence-backed audits and resolve contradictions. Do not begin ML implementation or broker integration.
