# 11 — Phase 2 MVP Implementation Plan
*Personal Indian Stock Intelligence Dashboard · Step-by-Step Engineering Blueprint*

> **Roadmap status:** This was the Phase 1 scaffold plan. Use [13-development-roadmap.md](./13-development-roadmap.md) as the current implementation plan; it adds data-rights gates and the earnings-event research track. Do not start the old BhavCopy/yfinance ingestion steps until Phase 0 confirms permitted use and source terms.

---

## 1. Phased Roadmap Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: RESEARCH & ARCHITECTURE SCAFFOLD [CURRENT PHASE - COMPLETE]          │
│ - Zero-leakage data pipelines designed                                         │
│ - Model & validation methodologies selected (LightGBM + Conformal)            │
│ - Next.js App Router + TypeScript interfaces created                          │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: INGESTION, FEATURE PIPELINE & MODEL ENGINE [NEXT PHASE]               │
│ - Step 1: BhavCopy ingestion & ISIN universe mapping                           │
│ - Step 2: Historical feature pipeline with purged walk-forward splits          │
│ - Step 3: Model training (1D, 1W, 1M, 3M) & calibration testing               │
│ - Step 4: Signal & stop loss engine implementation                             │
│ - Step 5: News RSS ingestion & FinBERT sentiment scoring                       │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: DASHBOARD UI, API ROUTES & VERCEL DEPLOYMENT                          │
│ - Interactive stock search & watchlist management                              │
│ - Prediction cards with calibrated intervals & probability of gain             │
│ - Signal display with i18n English/Hindi 4-bullet explanations                 │
│ - Daily automated cron ingestion via GitHub Actions                            │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 2 Step-by-Step Execution Sequence

### Step 1: Security Master & Historical Price Backfill
* **Objective**: Populate `stock_universe` and 5–10 years of `ohlcv_daily` for NIFTY 50 / NIFTY 500 stocks.
* **Scripts**:
  * `scripts/seed_universe.py`: Download NSE Equity Master CSV, extract Symbols, ISINs, and Industry classifications.
  * `scripts/backfill_prices.py`: Fetch historical daily OHLCV via `yfinance` (`.NS` tickers) with automated backward adjustment factors.
* **Verification**: Verify zero future data or forward adjustments in raw price rows; verify ISIN mappings.

### Step 2: Point-in-Time Feature Construction
* **Objective**: Implement `ml/features/feature_pipeline.py`.
* **Sub-tasks**:
  * Technical indicators (Returns, RSI, MACD, ATR, Bollinger, Realized Vol, Alpha vs NIFTY) using strict `shift(1)`.
  * Macro variables (S&P 500 lagged, USD/INR, Brent Crude, India VIX).
  * Fundamental snapshot joining using filing timestamp buffer ($T + 5\text{ days}$).
* **Verification**: Unit tests asserting that no feature at row $t$ changes if data after date $t$ is modified.

### Step 3: Walk-Forward Model Training & Calibration
* **Objective**: Train LightGBM regressors and classifiers for horizons 1D, 1W, 1M, 3M.
* **Sub-tasks**:
  * Implement `WalkForwardValidator` in `ml/validation/walk_forward.py`.
  * Set purge periods: 1D (2 days), 1W (5 days), 1M (21 days), 3M (63 days).
  * Quantile regression ($\alpha = 0.10, 0.50, 0.90$) with MAPIE conformal wrappers.
  * Platt scaling / Isotonic regression for probability calibration ($P_{\text{gain}}$).
* **Verification**: Verify out-of-sample Brier score $< 0.25$, Directional Accuracy $> 53\%$ (statistically significant over naive baseline), and Conformal Coverage $\approx 80\%$ on test folds.

### Step 4: Signal & Risk Level Engine
* **Objective**: Implement `SignalEngine` in `ml/signals/signal_engine.py`.
* **Sub-tasks**:
  * Composite scoring based on expected return z-score, CVaR, calibrated probability, and regime adjustment.
  * ATR and quantile-based stop-loss derivation: $\text{StopLoss} = \max(\text{Stop}_{\text{ATR}}, \text{Stop}_{\text{Quantile}})$.
  * Minimum Risk/Reward filter ($RR \ge 1.5$ gate for BUY signals).
  * Generate structured i18n keys for explanations.

### Step 5: News Pipeline & Daily Learning Loop
* **Objective**: Set up daily post-close ingestion at 16:45 IST.
* **Sub-tasks**:
  * Poll BSE/NSE corporate announcements RSS.
  * Run FinBERT sentiment analysis on overnight headlines.
  * Record daily predictions and resolve past predictions against actual closing prices.

---

## 3. Deliverables Checklist for Next Phase

| Area | Deliverable File | Success Criteria |
|---|---|---|
| **Data** | `scripts/seed_universe.py` | Complete NSE/BSE security master in DB |
| **Data** | `scripts/backfill_prices.py` | 5+ years of clean adjusted OHLCV |
| **Features** | `ml/features/technical.py` | 18 technical indicators, strictly shifted |
| **Features** | `ml/features/macro.py` | Lagged global/macro features joined |
| **Model** | `ml/models/forecaster.py` | Trained LightGBM multi-horizon models |
| **Validation**| `ml/validation/walk_forward.py` | Automated purged walk-forward report |
| **Signals** | `ml/signals/signal_engine.py` | BUY/HOLD/SELL signals with risk levels |
| **Evaluation**| `scripts/resolve_predictions.py`| Automated daily Brier & directional accuracy tracking |

---
*Next Phase Prompt Target: "Implement Step 1 & Step 2 of Phase 2 MVP Plan: Universe Seeding and Feature Pipeline."*
