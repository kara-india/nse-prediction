# 08 — Signal & Risk Engine Specification
*NSE/BSE Indian Equities Intelligence Dashboard · Phase 1 Architecture*

---

## D. BUY / HOLD / SELL Signal Methodology

### 1. Architectural Philosophy: Decoupling Forecast from Decision
A fundamental quantitative principle is the strict separation between:
1. **The Probabilistic Forecast**: What the market distribution is expected to do (E[r], P(r > 0), Q10, Q90).
2. **The Decision Engine (Signal)**: What action the user should consider taking given their risk profile and market regime.

Hard-coding arbitrary thresholds (e.g., "BUY if expected return > 2%") fails across different volatility regimes: in high-VIX environments a 2% forecast may be pure noise, while in low-volatility regimes 1.5% may represent a high-conviction statistical edge.

### 2. Signal Generation Formula
The signal engine evaluates a composite score derived from calibrated model outputs:

SignalScore = w1 * Z(E[r]) + w2 * (P_gain - 0.5) - w3 * (CVaR_10 / ATR_norm) - w4 * UncertaintyPenalty + RegimeAdjustment

Where:
* Z(E[r]): Cross-sectional z-score of expected return against all universe stocks on date t.
* P_gain: Calibrated probability of positive return (P(R > 0) in [0, 1]).
* CVaR_10: Expected shortfall at 10% lower tail (from quantile regression).
* ATR_norm: 14-day Average True Range divided by current price.
* UncertaintyPenalty: sigma_ensemble / Median(sigma_ensemble) (epistemic risk penalty).
* RegimeAdjustment: +0.05 in trending bull regimes, -0.05 in high-volatility/bear regimes.

### 3. Adaptive Threshold Mapping
Signals are mapped dynamically based on rolling cross-sectional percentiles, recalculated weekly:

| Signal Score Percentile | Signal | Execution Stance |
|---|---|---|
| **>= 75th percentile** | **BUY** | Favorable expected return, positive skew, acceptable risk/reward |
| **35th - 74th percentile** | **HOLD** | Insufficient statistical edge to initiate new position |
| **< 35th percentile** | **SELL** | Negative expected alpha, elevated tail risk, or momentum breakdown |

---

## E. Entry, Stop-Loss & Target Price Levels

Do NOT use arbitrary fixed percentages (e.g., "stop loss = 5%"). Levels must be derived from market volatility (ATR) and predicted quantiles.

### 1. Entry Range
For a **BUY** signal at current price P_t:
Entry_low = P_t * (1 - 0.5 * ATR_pct)
Entry_high = P_t * (1 + 0.2 * ATR_pct)
Where ATR_pct = ATR_14 / P_t. This defines a disciplined accumulation band.

### 2. Stop-Loss Derivation: Hybrid Method
The stop loss combines a volatility-based boundary with a distribution tail boundary:
* **ATR-based stop**: Stop_ATR = P_t - (k * ATR_14), where k in [1.5, 2.5] calibrated empirically.
* **Model Quantile stop**: Stop_Quantile = P_t * (1 + Q10(r)), where Q10(r) is the predicted 10th-percentile return.
* **Composite Stop Loss**:
StopLoss = max(Stop_ATR, Stop_Quantile)
*(Taking the tighter level to protect capital, subject to a minimum buffer of 1.2 * ATR to prevent noise stop-outs).*

### 3. Target Level & Risk/Reward Gate
* **Upside Target**:
Target = P_t * (1 + Q90(r))
* **Risk/Reward Ratio (RR)**:
RR = (Target - P_t) / (P_t - StopLoss)
* **Mandatory Quality Gate**:
If RR < 1.5, a nominal BUY signal is automatically downgraded to **HOLD**.

---

## F. Statistically Defensible Confidence Rating

Never display an arbitrary "Confidence: 87%". The confidence metric must represent true statistical reliability.

### 1. Three-Pillar Confidence Architecture
RawConfidence = 0.40 * C_prob + 0.35 * (1 - U_epistemic) + 0.25 * A_regime

1. **Calibrated Probability Distance (C_prob)**:
   * How far is P_gain from 0.50 (random coin flip)?
   * C_prob = 2 * |P_calibrated - 0.50| in [0, 1].
   * Probabilities must be calibrated using **Isotonic Regression** (for large sample sizes) or **Platt Scaling** (logistic sigmoid).
2. **Epistemic Certainty (1 - U_epistemic)**:
   * Disagreement across ensemble members (e.g. standard deviation of predictions across LightGBM, CatBoost, and Linear models).
   * High disagreement directly penalizes confidence.
3. **Regime-Specific Historical Accuracy (A_regime)**:
   * Historical out-of-sample directional hit rate of the model under the current market regime (e.g., India VIX > 20 vs VIX < 15).

### 2. Layman Presentation (0–100 Scale)
DisplayConfidence = clip(round(RawConfidence * 100), 25, 92)
* **Floor at 25**: In financial markets, even poor setups have a baseline probability.
* **Ceiling at 92**: Prevents misleading claims of near-certainty in inherently stochastic equity markets.

---

## G. "What Happened Yesterday" Analysis Engine

### 1. Objective Attribution Breakdown
The dashboard must decompose yesterday's price action into verifiable quantitative components:

Delta P_stock = beta * Delta P_NIFTY + Delta P_sector_excess + Delta P_idiosyncratic

* **Factor 1: Market Contribution**: Contribution from broad index move (beta_60D * NIFTY return).
* **Factor 2: Sector Contribution**: Sector index performance vs NIFTY.
* **Factor 3: Volume Confirmation**: Yesterday's volume as a multiple of 20-day average (V_t / SMA_20(V)).
* **Factor 4: Post-Market News & Announcements**: Exchange disclosures or news published after 15:30 IST.

### 2. Causal Disclaimer & Wording Rules
To maintain rigorous scientific standards, explanations must avoid unfalsifiable causal claims:
* Avoid: "Reliance rose 3% because crude oil prices dropped."
* Use: "Reliance (+3.0%) outperformed NIFTY (+0.8%) by 2.2%. Observed factors: Volume was 1.8x 20-day average, and sector peers gained +1.9%. Crude oil dropped -2.1% overnight (potential macro tailwind)."

---
*Sources: Lopez de Prado (2018), Conformal Prediction (Angelopoulos & Bates 2022), Expected Shortfall & Risk Parity Literature.*
