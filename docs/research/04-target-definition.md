# 04 — Target Variable Definition
*Indian Stock Intelligence Dashboard · Sep 2026*

## A. Why Log Returns (Not Raw Price)

| Property | Raw Price | Log Return |
|---|---|---|
| Stationarity | Non-stationary | Near-stationary |
| Time-additivity | No | Yes: r1+r2+...=rN |
| Scale-invariant across stocks | No | Yes |
| Approximately normal | No | Yes (CLT, daily) |
| Suitable for regression loss | No | Yes |

Decision: Use LOG RETURN as primary regression target. Raw price prediction is NOT recommended.

## B. Calendar Day vs Trading Day Convention

| Convention | Rule | Recommended? |
|---|---|---|
| Trading days (sessions) | 1W=5T, 1M=21T, 3M=63T | YES - avoids holiday gaps |
| Calendar days | Fixed 7/30/90 days | NO - introduces variable session counts |

Rule: All horizons defined in TRADING SESSIONS. NSE trades ~249-252 sessions/year.

## C. Horizon-to-Session Mapping

| Horizon | Calendar Days | Trading Sessions | Notes |
|---|---|---|---|
| 1D | ~1-3 calendar days | 1T | Next trading session |
| 1W | ~7 calendar days | 5T | Nearest valid date ~7 days out |
| 1M | ~30 calendar days | 21T | Nearest valid date ~30 days out |
| 3M | ~90 calendar days | 63T | Nearest valid date ~90 days out |

## D. Target Schema

For each horizon h in {1T, 5T, 21T, 63T}, computed at observation time t:

`
target_log_return_h    = log(Close_{t+h} / Close_t)
target_direction_h     = 1 if target_log_return_h > 0, else 0
target_excess_return_h = target_log_return_h - log(NIFTY50_{t+h} / NIFTY50_t)
target_q10_h           = 10th-percentile (quantile regression, pinball loss tau=0.10)
target_q90_h           = 90th-percentile (quantile regression, pinball loss tau=0.90)
`

Model outputs map to:
- target_direction_h -> binary classification (BCE loss)
- target_log_return_h -> regression (MSE / Huber loss)
- target_excess_return_h -> alpha signal vs NIFTY 50 total return index
- target_q10_h, target_q90_h -> quantile regression heads

CRITICAL: Targets are FORWARD-LOOKING and must be masked during validation to prevent leakage.

## E. What NOT to Predict Directly

| Target | Status | Reason |
|---|---|---|
| Raw close price | AVOID | Non-stationary; model learns level not dynamics |
| Volatility alone | SECONDARY | Useful auxiliary output; not primary target |
| Distribution parameters (mu, sigma) | ADVANCED | NGBoost; defer to Phase 2 |
| Probability of positive return | YES | Equivalent to target_direction_h via Platt scaling |

## F. Dashboard Display Mapping

From model targets to user-facing display:

`
Expected Range:          [Close_t * (1 + target_q10_h), Close_t * (1 + target_q90_h)]
Central Estimate:        Close_t * (1 + exp(target_log_return_h))
Probability of Gain:     calibrated P(target_direction_h = 1)
Expected Volatility:     sqrt(Var[log returns]) over horizon h
`

Example display:
`
Expected Range: Rs 1,820 - Rs 1,875
Central Estimate: Rs 1,848
Probability of Gain: 67%
Probability of exceeding +5%: 28%
Expected Volatility: 2.3%
`

## G. Baseline Benchmarks (Required for Comparison)

| Baseline | 1D | 1W | 1M | 3M |
|---|---|---|---|---|
| Naive (repeat yesterday's return) | Required | Required | Required | Required |
| Historical mean return | Required | Required | Required | Required |
| Market return (NIFTY) | Required | Required | Required | Required |

The production model must beat ALL baselines on direction accuracy AND Brier score on the holdout set.

Sources: Lopez de Prado Advances in Financial Machine Learning (2018) | Quantile regression literature | NSE trading calendar
