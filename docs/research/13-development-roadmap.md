# 13 — Development Roadmap for Review

*NSE/BSE Stock Intelligence Project · Draft implementation plan · 12 Nov 2026*

## Goal and Operating Boundary

Build a personal stock-research dashboard that tests whether information available at a defined time can rank liquid NSE/BSE equities by **risk-adjusted, net-of-cost forward opportunity** across explicitly stated holding periods. It may show forecasts, scenario ranges, risks and evidence-backed candidate/watch/avoid states. It does not promise profit, place orders or turn the official NSE MCP into a training feed.

The north-star evaluation is not “did the price go up tomorrow?” It is whether a preregistered candidate-selection rule beats simple market/factor/no-trade baselines in untouched chronological data after realistic costs, with acceptable drawdown, tail risk, calibration, liquidity and stability. A strategy that fails this bar should remain a research result, not a recommendation.

### Project state at plan creation

- Next.js 16 / React dashboard scaffold exists; Python code consists mostly of interfaces/skeletons.
- `ml/data/pipeline.py`, `ml/validation/walk_forward.py` and `ml/signals/signal_engine.py` do not yet implement the planned pipeline/validator/engine.
- No live licensed market-data adapter, point-in-time result event table, real prediction history or model training pipeline exists yet.
- Prior research docs 01–11 define useful requirements but contain unresolved source-rights and design inconsistencies listed in [12-market-data-and-strategy-research.md](./12-market-data-and-strategy-research.md).

## Phase Overview

| Phase | Name | Exit gate |
|---|---|---|
| 0 | Scope, source rights and specification reconciliation | The use cases and permitted data sources are written down; contradictions in validation/signal formulas are resolved. |
| 1 | Data adapters, security master and point-in-time storage | One permitted daily data path can reproducibly load an auditable historical sample with timestamps and corporate actions. |
| 2 | Daily feature and outcome foundation | Features and labels are reproducible, point-in-time safe, and include the real tradable price/time and cost model. |
| 3 | Strategy research and earnings-event study | Preregistered baselines/hypotheses have chronological, cost-aware research reports; no selected model has seen final holdout. |
| 4 | Forecasting, calibration and candidate scoring | An OOS-validated model/policy beats relevant baselines or is explicitly kept in research-only status. |
| 5 | Shadow operation and outcome learning | Daily data/predictions resolve reliably; drift, missing-data and model-performance monitors work without order execution. |
| 6 | Dashboard, user workflow and deployment | UI presents dated evidence and uncertainty honestly, with source attribution, stale-data states and safe operation. |
| 7 | Optional intraday or execution expansion | Separate data license, exact feed and cost/fill study justify the feature; broker integration requires a new review. |

## Phase 0 — Scope, Data Rights and Specification Reconciliation

### 0.1 Choose the first tradable use case

- **0.1.a** Start with liquid cash-equity swing/overnight research using daily closes and next-session executable prices. Use 1-session, 5-session and 21-session labels. Keep 63-session quality/value work as a parallel later track.
- **0.1.b** Keep intraday (minutes/hours) out of initial production scope. It needs licensed intraday bars/order data, explicit spread/impact/fill simulation, and a separate validation plan. The official NSE MCP is delayed and has no order book.
- **0.1.c** Define whether outputs are only for the owner’s personal research or may be distributed/sold. Do not launch a paid recommendation/data product until data licensing and applicable regulatory obligations have been reviewed.

**Deliverable:** `docs/research/decision-records/000-scope.md` (or approved edits to this document).

### 0.2 Confirm permitted data sources before coding ingestion

- **0.2.a** Create a source entitlement table for quote display, storage/retention, historical backtest, automated decision calculations, model training, derived signals and redistribution.
- **0.2.b** Ask NSE/NSE Data or a licensed provider in writing whether the desired personal, internal, automated signal/model-training use is allowed and under what agreement/fees. NSE MCP terms currently prohibit training/fine-tuning and commercial exploitation. The NSE data policies separately define non-display use.
- **0.2.c** Evaluate current provider/broker options (official historical EOD, official/counterparty corporate filings, broker APIs, commercial vendors). Record historical depth, live delay, request limits, exchange coverage, actions/adjustments, point-in-time financials, timestamps, uptime and cost.
- **0.2.d** Use the community MCP only as a provider wrapper candidate. Verify IndianAPI service terms, pricing/rate limits, endpoint provenance and sample records; do not treat its MIT code license as a market-data license.
- **0.2.e** Specify a fallback and stale-data threshold. Every data object must include source, source timestamp, retrieval time, session date, currency, adjustment status and quality flags.

**Exit gate:** written source approval/terms cover the planned research use; choose one canonical source per domain plus a fallback. If no affordable permitted model-training source exists, pause model training and limit the product to manually sourced/appropriately licensed informational research.

### 0.3 Freeze methodological definitions

- **0.3.a** Choose initial universe and scope: liquid NSE names by point-in-time membership/turnover, include suspended/delisted securities for historical tests; define BSE linkage by ISIN.
- **0.3.b** Define decision timestamp and execution convention for each signal. A signal after close may enter no earlier than next session’s executable open or an explicitly modeled limit fill.
- **0.3.c** Resolve target definition, missing/zero-volume trading sessions, adjusted vs raw series, dividend treatment, corporate-action timing and market calendar.
- **0.3.d** Define costs: brokerage, STT, exchange charges, GST, stamp duty, DP charges if applicable, spread, slippage, impact, taxes/holding treatment where relevant, and conservative cost scenarios. Version dated schedules rather than hard-code current rates into old backtests.
- **0.3.e** Reconcile horizon-specific purge/embargo logic, fold sizes, nested tuning and holdout policy.
- **0.3.f** Resolve the stop-loss “higher/tighter vs lower/more conservative” contradiction and replace fixed composite-signal weights with fold-contained, empirically selected mappings or no score.
- **0.3.g** Establish a hypothesis registry: each test gets a rationale, exact formula, universe, cutoff, horizon, benchmark, cost assumptions, expected failure mode and status before looking at final holdout.

**Deliverable:** reviewed source policy, data dictionary, cost schedule, target/validation specification and hypotheses register.

## Phase 1 — Data Adapters, Security Master and Point-in-Time Store

### 1.1 Build canonical data access boundary

- **1.1.a** Add typed provider interfaces in Python (daily bars, live snapshot, security master, corporate actions, filings/events, fundamentals, calendar).
- **1.1.b** Implement one licensed daily-bars adapter; add separate live/provider adapters only if their terms permit app use. Keep MCP out of the model-inference dependency.
- **1.1.c** Add retry/backoff, rate-limit awareness, pagination/chunking, request/response metadata, idempotency and provider/source health reporting.
- **1.1.d** Never expose provider API keys in Next.js client bundles. Store secrets in local/GitHub/Vercel secrets as appropriate; exclude them from logs, artifacts and Git history.

### 1.2 Universe and identifiers

- **1.2.a** Build security master with stable instrument ID/ISIN, NSE symbol, BSE code, company name, series, listing/delisting/suspension dates, industry/sector, source and valid-time ranges.
- **1.2.b** Preserve ticker changes and reused symbols as history; never join long histories only by current ticker.
- **1.2.c** Build point-in-time eligible-universe snapshots with investability/liquidity rules and historical index/sector constituent memberships where data is available.

### 1.3 Historical prices and actions

- **1.3.a** Backfill a pilot of 20–50 liquid stocks and index benchmarks; validate dates, duplicates, nulls, OHLC invariants, volume units, timezone, source timestamps and corporate actions.
- **1.3.b** Expand only after the pilot reconciles with an independent source and all anomalies have an explicit disposition.
- **1.3.c** Store raw prices immutably. Store corporate actions and adjustment factors separately, with source/revision timestamps; derive total-return adjusted bars deterministically.
- **1.3.d** Keep prices in at least raw and adjusted views. Clearly mark NSE MCP raw history as not corporate-action adjusted if it is ever used for allowed manual research.

**Exit gate:** repeatable backfill and a daily incremental run produce identical records when replayed; data provenance and unresolved-error report are saved.

## Phase 2 — Point-in-Time Features, Targets and Cost Model

### 2.1 Build daily features

- **2.1.a** Implement returns, volatility, ATR, volume/turnover/liquidity, gap, market/sector residual returns and regime descriptors from adjusted/raw input as defined in Phase 0.
- **2.1.b** Add point-in-time fundamentals only after original filing values, publication times, revisions/restatements and period type can be captured. Use filing availability time, never quarter-end as release time.
- **2.1.c** Add news/event indicators after source licensing, deduplication, entity resolution and timestamp policy are implemented. Treat LLM output as an untrusted extracted feature with source text, confidence and validation, not an observed fact.
- **2.1.d** Create lag and feature availability contracts by prediction cutoff; build data-quality assertions to detect future dates, adjusted-price backfill leakage and ticker/security mismatches.

### 2.2 Define labels and executable outcomes

- **2.2.a** Define forward returns on 1/5/21/63 trading sessions from an actual decision price to a feasible exit price; keep close-to-close model target separate from trade simulation.
- **2.2.b** Compute market/sector excess return, direction, quantile outcomes, adverse/favorable excursion and signal expiry using point-in-time universe membership.
- **2.2.c** Deduct cost scenarios at entry and exit; add conservative fills, spreads, liquidity capacity and gap/price-band handling. Include “no trade” and index/factor baselines.
- **2.2.d** Build test assertions that changing data after date `t` cannot alter features/predictions at `t`.

**Exit gate:** one stock/date feature snapshot can be rebuilt byte-for-byte from source records, with no future data and an auditable target/cost calculation.

## Phase 3 — Strategy Research and Earnings Event Study

### 3.1 Establish minimum benchmarks

- **3.1.a** Baselines: NIFTY/sector buy-and-hold, cash/no-trade, historical mean, simple momentum, simple reversal and simple quality/value ranks where data permits.
- **3.1.b** Use an expanding chronological training window and outer walk-forward folds; purge label overlap by actual sessions/horizon and embargo according to the feature/label design. Keep a final chronological holdout locked until methodology freeze.
- **3.1.c** Report gross and net results: rank IC, calibration/Brier/log loss for probabilistic outputs, interval coverage, average/median trade return, hit rate, turnover, max drawdown, tail loss, exposure, costs and capacity. Use confidence intervals and per-fold/per-regime stability.

### 3.2 Test return-predictor candidates

- **3.2.a** Cross-sectional momentum/residual strength for 5–63 sessions.
- **3.2.b** Short-term reversal/dip candidates conditioned on liquidity, market/sector trend and fundamental/news risk.
- **3.2.c** Point-in-time quality/value/profitability/investment measures on longer horizons.
- **3.2.d** Market breadth/VIX/regime filters and sector rotation as candidate modifiers.
- **3.2.e** Use ablations and feature-group tests on training/validation folds only; log every attempted configuration to reduce data snooping.

### 3.3 Build earnings-event dataset and event study

- **3.3.a** Ingest scheduled board meeting/result dates and actual result filings. Store the original document, publication timestamp, retrieved timestamp, revision/correction state, result period and exchange source.
- **3.3.b** Parse standalone vs consolidated results and restated/corrected filings; validate units, quarter/year labels and corporate identity. Use official XBRL/iXBRL where accessible and licensed; retain document references and parser version.
- **3.3.c** Compute pre-result features (prior seasonal financial trend, known disclosures, licensed consensus snapshots or own estimate, price/volume run-up) as-of each intended cutoff.
- **3.3.d** Compute after-result surprise, guidance/event-text features and initial market reaction only after announcement. Define first tradable entry based on exact publication time and market calendar.
- **3.3.e** Run event-study windows, controls, placebo tests and costed strategy simulations from Research §3.4. Separate pre-announcement prediction, immediate response and PEAD hypotheses.
- **3.3.f** Add “quiet reaction” as a prespecified feature threshold (abnormal turnover and/or abnormal return), test it against alternatives and record enough events to estimate uncertainty. Do not assume a quiet result means tomorrow’s move.

**Exit gate:** strategy report names the best and worst folds, all costs and sensitivity results. Any apparent edge must survive realistic costs and an untouched period; otherwise mark it rejected/uncertain.

## Phase 4 — Forecasting, Calibration and Candidate Scoring

### 4.1 Train simple-to-complex models

- **4.1.a** Baseline linear/ridge and simple factor rankings first; then compare LightGBM/CatBoost or other tabular methods in fold-contained pipelines.
- **4.1.b** Train separate horizon/event heads only where there is enough sample support. Avoid one model conflating 1-day, multiweek and event-specific targets.
- **4.1.c** Train return distribution/quantile outputs and probability models; calibrate on prior validation data only. Maintain immutable model/data/feature versions and training cutoffs.
- **4.1.d** Add a feature group only if point-in-time availability is proven and its incremental benefit is consistent across folds after the chosen objective/cost model.

### 4.2 Convert forecast to an action state

- **4.2.a** Start with ranked watchlists/expected net excess-return bands plus explicit “insufficient edge / data stale / event risk / avoid” states.
- **4.2.b** If a BUY/HOLD/SELL layer is justified, tune its mapping on training/inner folds and evaluate unchanged on outer folds. Do not use arbitrary fixed weights, percentile cutoffs or a confidence percentage unsupported by calibration.
- **4.2.c** Add volatility- and risk-budget-based position-size scenarios only with explicit user inputs and separately validated risk rules; never imply a model stop price is a guaranteed fill.
- **4.2.d** Present feature attribution as association/contribution to this model output, not causal explanation.

**Exit gate:** release only if it improves on named baselines in the locked evaluation, is stable enough for the stated scope, has calibrated uncertainty and passes the data/operational gates. Otherwise display as experimental or do not show a recommendation label.

## Phase 5 — Daily Shadow Operation and Outcome Learning

### 5.1 Reliable scheduled pipeline

- **5.1.a** Run after-close ingestion only when final source data is available; run pre-open/event refresh separately if licensed and timestamp-safe.
- **5.1.b** Add idempotent jobs, replay/backfill controls, monitoring, alerting, source freshness checks, partial-run detection and rollback to the last good model/data version.
- **5.1.c** Persist prediction inputs/feature hash, outputs, model version, source timestamps and decision policy version before observing outcomes.

### 5.2 Resolve and monitor predictions

- **5.2.a** Resolve outcomes on target trading sessions, including holiday handling and delistings; record the actual exit/fill convention and missing-price reason.
- **5.2.b** Track calibration, rank IC, coverage, net strategy metrics, costs, drawdown and distribution drift by horizon/regime/universe.
- **5.2.c** Maintain a human thesis/decision journal separately from immutable model prediction records. Postmortems inform future preregistered experiments, not retroactive changes to the evaluation set.
- **5.2.d** Add explicit kill/disable conditions for stale data, schema changes, unusually high volatility, calibration drift, and data-source failure. Default to “no recommendation.”

**Exit gate:** paper/shadow operation covers a prespecified number of live events/sessions and demonstrates operational integrity; do not infer strategy efficacy from a short profitable streak.

## Phase 6 — Dashboard and Deployment

### 6.1 User-facing product

- **6.1.a** Build search/watchlist and dated market summary from the selected allowed data source.
- **6.1.b** Show as-of time, source, delay, adjustment status, horizon, expected return/range, calibrated probability, tail risk, costs and reasons for abstention.
- **6.1.c** Add earnings calendar and event timeline with scheduled date vs actual filing timestamp, before/after distinction and filing links.
- **6.1.d** Add candidate rankings/alerts only after Phase 4 release gates. Keep “why it ranked” evidence and limitations accessible.
- **6.1.e** Store only permitted data; secure provider keys; rate-limit requests; cache only as allowed by provider agreement.

### 6.2 Operational delivery

- **6.2.a** Keep Python training/backtest/batch jobs outside short-lived Next.js request handlers; serve precomputed outputs through the existing web architecture.
- **6.2.b** Add CI for data/model schema checks, documentation and deterministic offline fixtures. Do not use real provider keys or unauthorized data in CI.
- **6.2.c** Run a documented deployment checklist and alerting path before public access.

## Phase 7 — Intraday or Execution Expansion (Optional, Separate Approval)

- **7.a** Confirm licensed low-latency bars/trades/order-book source and use rights for automated calculations; official NSE MCP is not sufficient.
- **7.b** Specify survivorship-free intraday universe, timestamp synchronization, auction/price-band, spreads, latency, queue/partial fills, market impact, STT/brokerage/GST and slippage.
- **7.c** Compare opening gap, volume surprise, event reaction and order-flow hypotheses against passive/daily alternatives with realistic fills and cost-break-even analysis.
- **7.d** Only if a separate evidence gate is met, scope broker connectivity, authentication, risk limits, incident handling and regulatory review. Automated orders are outside this roadmap’s current scope.

## Cross-Cutting Acceptance Criteria

- Data sources and use rights are recorded and permitted for the exact operation performed.
- Every feature and event carries an availability timestamp; prediction cutoffs are enforced in code.
- No survivorship/look-ahead leakage in the claim’s stated universe and period.
- Corporate actions, symbol history, suspensions/delistings and market calendar are handled.
- Every result reports performance net of realistic costs with cost sensitivity and capacity.
- Selection/tuning occurs only within earlier folds; the final holdout is used once after freeze.
- Probabilities, intervals and signal labels are calibrated and described accurately; uncertainty and abstention are visible.
- Failed data checks or missing/stale inputs yield no recommendation, not silent fallback to fabricated/current values.
- Strategy hypotheses and attempted configurations are logged; there is no post-hoc cherry-picking of the best result.
- The app does not place orders or imply guaranteed returns.

## Suggested First Engineering Slice

After Phase 0 review, implement **Phase 1.1 + a 20–50-stock pilot of Phase 1.2/1.3**, not the whole universe. It gives a concrete data path and quality report before expensive feature/model work. Then establish one costed daily benchmark and one event-study cohort before selecting a model architecture. The NSE MCP may be used to manually inspect a few prices/breadth values and help validate an allowed data source, but it is not an alternative for training data under its published terms.

---
*Review status: draft. Strategy candidates are research hypotheses, not investment advice or promises of profitability.*
