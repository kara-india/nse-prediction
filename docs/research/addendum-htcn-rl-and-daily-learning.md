# ADDENDUM — IMPLEMENTATION PLAN CHECKPOINT, HTCN/RL RESEARCH, AND SAFE DAILY LEARNING

Append this section to the end of the NSE Prediction master directive. It supplements the existing phase roadmap; it does not override the data-rights, research-first, compliance, localhost UI verification, or no-live-trading gates.

## A. IMMEDIATE TASK: PUBLISH THE IMPLEMENTATION PLAN TO GITHUB

Before beginning any implementation, immediately persist the current agreed implementation plan and research decisions to:

Repository: `kara-india/nse-prediction`
Default branch: `main`

1. Inspect the current branch, working tree, latest commit and existing docs to avoid overwriting user work.
2. Create/update a canonical `docs/IMPLEMENTATION_PLAN.md` containing the approved phases, objectives, dependencies, parallel workstreams, deliverables, acceptance/exit gates, regulatory/data-entitlement gates, deployment gates and next-session restart instructions.
3. Add `docs/NEXT_SESSION.md` with:
   - last completed phase and status;
   - exact next task: start/review Phase 0;
   - files/docs to read first;
   - decisions already made and unresolved questions;
   - commands/tests already run and results;
   - tasks explicitly not yet authorised.
4. Update `README.md` with a short project status and links to these two documents. Do not replace useful existing content.
5. Ensure the plan reflects that the immediate build target is the fixture-backed dashboard, while public recommendations, real-data use, model training, paper/live trading remain gated as defined in the master directive.
6. Commit and push these documentation-only changes to `main` now, unless repository protection or a failing precondition prevents it. Use a focused commit such as `docs: publish implementation roadmap and next-session checkpoint`.
7. Do not force-push, rewrite history, commit secrets, or include local datasets, credentials, keys, or generated model artefacts. Preserve unrelated modifications.
8. Verify the pushed commit and confirm the files are visible on GitHub. Report the commit SHA and links.
9. If direct push is blocked by branch protection or permissions, create a branch and draft PR instead. Do not claim success until GitHub confirms it.

This immediate documentation checkpoint is authorised. It is not permission to start all development phases, deploy to production, or enable any trading automation.

## B. RESEARCH TRACK: HIERARCHICAL TEMPORAL CONVOLUTIONAL NETWORKS (HTCN) + REINFORCEMENT LEARNING

The long-term research question is whether a hierarchical/multi-scale Temporal Convolutional Network encoder combined with a suitable sequential decision model can add robust, net-of-cost value to the NSE platform.

Do not assume that HTCN + RL is superior to LightGBM/CatBoost, linear models, or supervised TCNs. Do not implement it in production merely because example repositories exist. First run a documented feasibility and literature/repository review.

### B1. Verify the candidate repositories

Inspect these repositories directly, read their source code, tests, dependencies, commit history, licences and limitations. Do not rely on their READMEs alone:

- `https://github.com/Shambhavi500/AlphaTrader-RL`
- `https://github.com/taleblou/TemporalConvolutionalNetworks-Price-Prediction`
- `https://github.com/BerriAI/self-improving-agent`

For each, produce a short technical evaluation covering:
- what actually works and what is only claimed;
- data provenance, market coverage and dates;
- leakage/survivorship/corporate-action handling;
- model architecture and training code;
- action/observation/reward design, if applicable;
- costs, slippage, fills, liquidity and risk constraints;
- tests and reproducibility;
- licence compatibility and dependency/security risks;
- components that can be reused, adapted, or should be rejected.

Treat AlphaTrader-RL as a candidate Gymnasium environment/reference, not an already validated strategy. Treat the taleblou TCN as an architectural example, not evidence of predictive edge; audit the unusually high fit metrics for leakage, target construction and split methodology. Treat self-improving-agent as an approval-controlled code proposal/PR mechanism, not a daily model-training system or permission for unattended source-code mutation.

### B2. Compare model families before selecting one

Research and compare, at minimum:
1. Existing project baselines: naive/seasonal, linear/regularised, LightGBM and CatBoost.
2. Supervised causal TCN.
3. Multi-scale/hierarchical TCN encoder (short, medium and longer lookback pathways).
4. TCN encoder plus supervised prediction heads (direction, return distribution/quantiles, volatility).
5. TCN encoder plus RL policy (only after a valid environment and evidence justify it).

Define “hierarchical” precisely. A candidate design may use causal dilated convolutions or separate temporal branches with distinct receptive fields (for example short/medium/long lookbacks), then fuse representations. The specific windows, dilation schedule, normalisation and receptive fields must be selected inside training/validation only, not by inspecting the final holdout.

Compare on identical point-in-time inputs, universe, dates, trading calendar, targets, costs and walk-forward folds. Report whether added complexity produces statistically and economically meaningful incremental value. If not, retain the simpler model.

### B3. Keep prediction and decision-making distinct

The daily prediction task and the trading policy are different problems:

- **Forecasting layer:** Estimate future return distribution, direction probability, volatility and uncertainty from information available at decision time.
- **Decision layer:** Select portfolio action/position subject to risk, costs, liquidity, exposure and execution constraints.

A supervised model can generate a probability forecast without RL. RL must not be used as a synonym for model retraining or prediction correction.

Research whether contextual bandits, supervised policy learning, model-predictive control or simple deterministic decision rules are better first steps than PPO/SAC. Recommend RL only if sequential action effects, transaction costs, portfolio state and delayed rewards make it necessary.

### B4. Specify the Day B → Day B+1 learning lifecycle

Design (but do not yet enable unattended training) the following auditable daily loop, using the Indian exchange trading calendar and Asia/Kolkata timestamps:

**At decision cutoff on Day B**
1. Freeze a point-in-time feature snapshot and its hash.
2. Record data provenance, freshness and entitlement eligibility.
3. Generate and persist the model forecast and/or policy action.
4. Record model version, policy version, code commit, training-data cutoff, feature schema version, random seed, prediction timestamp, instrument, intended holding horizon, action, size, risk limits and rationale.
5. Store the forecast distribution and uncertainty, not only a BUY/SELL label.
6. Record the exact hypothetical execution rule and first eligible execution price convention.

**On Day B+1, after the required market data is complete**
1. Resolve Day B predictions against actual data using the predeclared horizon and executable-price convention.
2. Calculate gross and net outcomes, benchmark-relative outcomes, forecast errors, calibration, drawdown contribution, turnover and cost/slippage estimates.
3. Record whether the outcome is fully observable. Do not train on incomplete labels.
4. Append an immutable transition/evaluation record; never silently rewrite previous predictions or outcomes.
5. Update rolling performance and regime diagnostics across multiple horizons.
6. Distinguish a model forecast error from execution error, data error and regime shift.

For multi-day predictions, resolve only when the declared label horizon has elapsed. A Day B+1 close must not be treated as the final outcome of a 5-, 21- or 63-session forecast.

### B5. Memory design: separate four things

Do not put everything into one mutable JSON file or a single RL replay buffer. Design separately:

1. **Prediction ledger:** immutable point-in-time predictions and feature hashes.
2. **Outcome ledger:** immutable resolved outcomes, execution assumptions and actual prices.
3. **Research/memory store:** strategy hypotheses, regimes, failure cases, experiment results, lessons and references. Every lesson must link to evidence and a date range.
4. **Model artefact registry:** model/policy weights, hyperparameters, training-data cutoff, code commit, evaluation report, environment version, feature schema and promotion status.

If experience replay is used, prevent leakage across time boundaries and keep a clear distinction between replay samples, chronological validation and untouched holdout data. Replay data must never allow a transition from a future period to influence an earlier evaluation.

### B6. Reward and environment research requirements

Before implementing an RL environment, specify:
- state/observation using only information available at that time;
- action space (including position sizing or target exposure);
- realistic portfolio state (cash, holdings, exposure, risk and costs);
- reward function and why each component is economically justified;
- treatment of transaction costs, bid/ask spread, slippage, market impact, taxes/fees, partial fills, gaps, halts, price bands and liquidity;
- corporate actions, delistings and unavailable instruments;
- long-only vs shorting constraints and borrow availability;
- risk constraints, turnover penalty and drawdown handling;
- episode boundaries, resets, deterministic seeds and environment versioning.

Avoid reward hacking. Report return, volatility, Sharpe/Sortino, max drawdown, tail loss, turnover, exposure, capacity and net expectancy separately. Do not optimise a single reward number.

### B7. Daily learning must not mean daily code rewriting

The system may automatically:
- resolve completed predictions;
- append immutable learning records;
- update performance dashboards;
- run scheduled diagnostics;
- produce candidate retraining runs when data and label thresholds are met;
- compare a challenger against the champion;
- prepare a structured improvement proposal.

It must NOT automatically modify source code, feature definitions, reward functions, strategy rules, risk limits or production configuration based on one day's result.

Code changes require a separate reviewed experiment, tests, documented rationale, human approval and a branch/PR. Model-weight updates are also gated: a challenger must pass chronological walk-forward and holdout safeguards, calibration, robustness, cost-aware backtests and paper-trading criteria before promotion. Maintain rollback to the last accepted champion.

Never use the final holdout repeatedly for tuning. Use nested walk-forward validation for research; retain a final untouched test period for the final model/strategy assessment.

## C. SELF-IMPROVEMENT WORKFLOW: PROPOSE → TEST → REVIEW → APPROVE → MERGE

Evaluate `BerriAI/self-improving-agent` for whether its approval-controlled proposal and draft-PR workflow is useful for *code improvement proposals*. Do not assume compatibility with the current Codex runtime: inspect its current package, APIs, security model and integration requirements first.

If suitable, use it only for:
1. proposing a minimal, traceable code diff after a reproducible failure or well-supported research finding;
2. running unit, integration, leakage, backtest and regression tests;
3. opening a draft PR with evidence, metrics, risks and rollback notes;
4. requesting explicit human review and approval.

Require least-privilege GitHub permissions scoped to this repository. Keep tokens in secrets/environment configuration; never expose them to browser code, logs, model prompts or committed files. Do not let an agent merge its own changes or push directly to production. No unattended production code mutation.

A daily evaluation job can create a report or draft proposal; it must never decide that a code change is safe simply because one rolling metric fell below a threshold.

## D. CODEX SKILL TO CREATE AFTER THE RESEARCH GATE

If the feasibility review supports the approach, create a repository-local skill at the Codex-supported project skill location:

`.agents/skills/nse-daily-learning/SKILL.md`

Use valid YAML frontmatter with `name` and a concise trigger description. Keep the skill concise; place detailed schemas, runbooks and experimental protocols in linked `references/` files.

The skill should instruct Codex how to:
- run daily prediction resolution and diagnostics;
- validate data freshness and entitlement status;
- check completed label horizons;
- update immutable ledgers and research memory;
- run eligible candidate retraining and model comparison;
- generate a learning report;
- prepare code-change proposals/PRs only when justified;
- stop safely when data is missing, stale, non-entitled or labels are incomplete.

Validate the skill folder with the currently supported Codex skill validation method. Confirm that Codex discovers it. Do not assume `.codex/skills/` is the correct repository location; verify the current Codex documentation and use `.agents/skills/` unless the installed runtime documents a different supported path.

## E. SCHEDULED JOB DESIGN — NOT LIVE EXECUTION

Design a post-market workflow with configurable IST schedule, but do not enable it until data entitlements and operational gates are approved.

Suggested stages:
1. Fetch/reconcile permitted market data after the official session is complete.
2. Run data-quality and stale-data checks.
3. Resolve eligible historical forecasts.
4. Append outcome and memory records.
5. Run monitoring and drift diagnostics.
6. Optionally train a challenger only when minimum data/label thresholds are met.
7. Evaluate challenger against champion using predeclared chronological tests.
8. Publish a report and alert; never place broker orders.

Use GitHub Actions or another suitable scheduler only after testing timezone, exchange holidays, retries, idempotency, duplicate-run protection, secrets, logs and failure notifications. Do not assume a fixed 4:00 PM IST run is safe for all market segments or holidays; schedule relative to exchange session completion and data availability.

## F. REQUIRED RESEARCH DELIVERABLES

Create and maintain:
- `docs/research/htcn-rl-feasibility.md`
- `docs/research/htcn-architecture-comparison.md`
- `docs/research/rl-environment-spec.md`
- `docs/research/daily-learning-loop.md`
- `docs/research/model-memory-and-registry.md`
- `docs/research/self-improvement-governance.md`
- `docs/experiments/README.md`
- `docs/operations/daily-learning-runbook.md`

Each report must distinguish verified repository facts, external research, design proposals and unresolved questions, with source links and dates checked.

## G. EXIT GATES

Do not implement HTCN/RL until:
1. data rights for all training and inference sources are confirmed;
2. the point-in-time dataset and leakage tests exist;
3. a simple baseline is implemented and evaluated;
4. the RL environment specification and cost model are independently reviewed;
5. a reproducible benchmark protocol is approved.

Do not run automated daily model updates until:
1. prediction and outcome ledgers are implemented and tested;
2. label-horizon resolution is correct;
3. the exchange calendar, idempotency and data-quality controls are tested;
4. champion/challenger promotion and rollback exist;
5. the process is paper-only and cannot transmit broker orders.

Do not permit autonomous code changes or live broker execution under this addendum. Those require separate explicit approval and the existing regulatory/operational gates.

## H. STOP POINT FOR THIS SESSION

After completing Section A (publish the plan and next-session checkpoint), continue only with the Phase 0 research tasks already authorised by the master prompt. Add the HTCN/RL track to the roadmap as a later gated research workstream. Do not install heavy ML dependencies, train networks, enable scheduled jobs, deploy production, or connect broker APIs in this session.

At the end, report the commit SHA and links for the published plan/checkpoint, list the research items added, and identify the exact next task for the next Codex session.
