# Quantitative Research & Architecture Summary
*Personal Indian Stock Intelligence Dashboard (NSE & BSE)*
*Phase 1: Research, Validation Design & Technical Scaffold*

---

## Executive Overview

This document synthesizes the comprehensive quantitative ML research, data engineering specifications, and system architecture for a personal Indian stock intelligence web dashboard. 

The primary mandate of Phase 1 is **scientific defensibility, total prevention of look-ahead leakage, empirical feature importance (no arbitrary hand-weighting), and rigorous walk-forward validation**.

---

## 1. Recommended Data-Source Stack

| Data Domain | Primary Source | Secondary / Fallback | Update Frequency | Cost |
|---|---|---|---|---|
| **Historical Price (OHLCV)** | **NSE Official BhavCopy Archives** (authoritative daily CSVs from 1994–present) | `yfinance` (`.NS` / `.BO` tickers with backward adjustment verification) | Daily post-market (16:30 IST) | **Free** |
| **Intraday & Live Quotes** | **Zerodha Kite Connect WebSocket** (if user holds account) OR **Upstox WebSocket API** | `yfinance` 1-minute polled intervals (cached with 60s TTL) | Real-time / 1-min polling during 09:15–15:30 IST | **Free** (Upstox free with demat; Kite Rs 500/mo optional) |
| **Security Master & ISINs** | **NSE Equity Master CSV** + **BSE Security Master CSV** | `nselib` Python package | Daily morning refresh | **Free** |
| **Corporate Actions (Splits, Dividends)** | **NSE Corporate Actions Archive CSV** | BSE Corporate Actions Portal | Daily | **Free** |
| **Fundamental Data (Point-in-Time)** | **BSE XBRL Corporate Filing Portal** (ingested at announcement date) | Quarterly financial extracts with strict 45-day reporting lag buffer | Quarterly | **Free** |
| **Live News & Announcements** | **BSE/NSE Official Announcements RSS Feeds** | Economic Times & Business Standard RSS | Every 5 minutes (overnight & intraday) | **Free** |
| **Historical News Corpus** | **GDELT Project 2.0** (filtered on Indian financial entities & themes) | Archival RSS stream (captured continuously from Day 1) | Historical batch / Daily | **Free** |
| **Global & Macro Variables** | **Yahoo Finance** (S&P 500, Nasdaq, DXY, Brent Crude, US 10Y, India VIX, NIFTY Bank) | Federal Reserve FRED API + RBI Bulletins | Daily pre-market (08:30 IST) | **Free** |

---

## 2. Alternatives and Fallbacks

* **If Screener.in is used**: Screener.in does NOT offer an official API and is **NOT point-in-time safe** for historical backtesting (ratios use current prices against historical restated EPS). Screener.in may only be used for **displaying current fundamental metrics in the UI**, never for training ML feature vectors.
* **If yfinance fails or blocks requests**: Fall back directly to NSE BhavCopy archives for historical bars, and Twelve Data (800 free req/day) for recent daily quotes.
* **If live WebSocket feeds are unavailable**: Fall back to lightweight polled quotes via Next.js server-side caching with a 60-second stale-while-revalidate policy.

---

## 3. Recommended Feature Groups (Strictly Lagged $T-1$)

Features must be empirically validated rather than hand-weighted:

1. **Price Dynamics & Momentum**: Log returns (1D, 5D, 21D, 63D), Realized Volatility (20D, 60D), Normalized ATR ($\frac{\text{ATR}_{14}}{\text{Price}}$), RSI (14D), MACD Histogram (12, 26, 9), Bollinger Band Width & Position.
2. **Market & Sector Relative Alpha**: 5-day and 21-day excess return relative to NIFTY 50, sector-relative return, rolling 60-day beta.
3. **Volume Anomaly**: Volume ratio vs 20-day moving average ($\frac{V_t}{\text{SMA}_{20}(V)}$), On-Balance Volume (OBV) rate of change.
4. **Global & Macro Context**: Overnight S&P 500 return, USD/INR daily change, Brent Crude % change, India VIX level, RBI/Fed event day indicator.
5. **Point-in-Time Fundamentals (for 1M & 3M horizons)**: Trailing P/E rank, P/B ratio, ROE, Debt/Equity, YoY revenue and EPS growth, promoter holding % change, pledged share %.
6. **NLP News Sentiment & Overnight Events**: FinBERT sentiment polarity score $[-1, 1]$, overnight post-close article count, event severity score, news novelty score.

---

## 4. Recommended Model Architecture

Do NOT use a single monolithic model for all horizons:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ HORIZON 1: 1 Trading Day (1D)                                                  │
│ - Architecture: LightGBM Classifier (Direction) + LightGBM Regressor (Log-Ret)│
│ - Quantiles: Pinball loss regression at tau=0.10, 0.50, 0.90 + MAPIE Conformal │
│ - Key Features: 1D momentum, overnight S&P 500, post-close news sentiment, VIX │
├────────────────────────────────────────────────────────────────────────────────┤
│ HORIZON 2: 1 Trading Week (5T)                                                 │
│ - Architecture: LightGBM + CatBoost Ensemble                                   │
│ - Key Features: 5D momentum, sector relative strength, volume accumulation     │
├────────────────────────────────────────────────────────────────────────────────┤
│ HORIZON 3 & 4: 1 Month (21T) & 3 Months (63T)                                  │
│ - Architecture: LightGBM / Ridge Regularized Linear Ensemble                   │
│ - Key Features: PIT fundamentals (ROE, EPS growth, Debt/Equity), 63D momentum  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Methodological Conclusion on Reinforcement Learning (RL)

> **CONCLUSION: REJECT REINFORCEMENT LEARNING FOR PHASE 1.**

* **Sample Deficit**: A 20-year daily history of an NSE stock yields only ~5,000 data points. Deep RL algorithms (PPO, SAC, DQN) require $10^5$ to $10^6$ transitions for stable convergence in noisy environments.
* **Problem Mismatch**: The project goal is a **probabilistic prediction and intelligence dashboard**, not an autonomous execution broker. Supervised gradient boosting directly minimizes calibration error and forecast loss.
* **Validation Hazard**: RL policies cannot be validated using purged cross-validation; standard backtests suffer from catastrophic path-memorization and reward hacking.
* **Defensible Alternative**: Supervised LightGBM with Conformal Quantile Regression and Platt-calibrated probabilities.

---

## 6. Recommended Validation Strategy (Zero-Leakage)

1. **Expanding-Window Walk-Forward Cross-Validation**:
   * Minimum initial training window: 3 years (~756 trading sessions).
   * Validation fold: 6 months (~126 sessions), stepping forward by 3 months.
   * Holdout Test Period: Final 12 months untouched until complete methodology freeze.
2. **Purging & Embargo**:
   * **Purge period**: Equal to horizon $h$ (1D=2T, 1W=5T, 1M=21T, 3M=63T) to eliminate overlapping forward labels.
   * **Embargo period**: 5T to 21T after validation folds to eliminate feature autocorrelation bleed.
3. **Strict Nested Cross-Validation**: Hyperparameters tuned only on inner folds; feature scalers fitted strictly on training slices inside `Pipeline`.

---

## 7. Recommended Confidence Methodology

Never show arbitrary numbers like "Confidence: 85%". The score represents statistically meaningful reliability:

$$\text{ConfidenceScore} = \text{clip}\left(100 \times \left(0.40 \cdot \mathcal{C}_{\text{prob}} + 0.35 \cdot (1 - \mathcal{U}_{\text{epistemic}}) + 0.25 \cdot \mathcal{A}_{\text{regime}}\right), 25, 92\right)$$

* **Calibrated Probability ($\mathcal{C}_{\text{prob}}$)**: Distance of Platt-scaled probability from 0.50 ($2 \times |P_{\text{gain}} - 0.50|$).
* **Epistemic Certainty ($1 - \mathcal{U}_{\text{epistemic}}$)**: Agreement across model ensemble members.
* **Regime Accuracy ($\mathcal{A}_{\text{regime}}$)**: Historical model hit-rate under the prevailing volatility/trend regime.
* **Display Range**: Clipped between 25 (minimum baseline) and 92 (no false certainty in financial markets).

---

## 8. Recommended BUY / HOLD / SELL Methodology

The signal engine is decoupled from the forecaster and based on percentile scores recalculated weekly:

* **Score Formula**: Combines cross-sectional return z-score, $P_{\text{gain}}$, CVaR tail risk, and uncertainty penalty.
* **BUY**: Signal score $\ge 75\text{th}$ percentile **AND** Risk/Reward Ratio $\ge 1.5$.
* **HOLD**: Signal score between $35\text{th}$ and $74\text{th}$ percentile OR fails Risk/Reward gate.
* **SELL**: Signal score $< 35\text{th}$ percentile OR elevated downside tail risk ($Q_{10}$ breakdown).
* **Explanations**: 3–4 bullet points generated from i18n keys based on dominant SHAP feature contributions and observed market facts.

---

## 9. Recommended Risk-Level Methodology

* **Entry Range**: $[\text{Price} \times (1 - 0.5 \times \text{ATR}_{\text{pct}}), \; \text{Price} \times (1 + 0.2 \times \text{ATR}_{\text{pct}})]$.
* **Stop Loss (Hybrid)**: $\text{StopLoss} = \max(\text{Price} - 2 \times \text{ATR}_{14}, \; \text{Price} \times (1 + Q_{10}))$. Volatility-adaptive, never a fixed 5%.
* **Upside Target**: $\text{Price} \times (1 + Q_{90})$.
* **Gate**: Requires $\frac{\text{Target} - \text{Price}}{\text{Price} - \text{StopLoss}} \ge 1.5$.

---

## 10. Vercel Architecture

* **Frontend & BFF**: Next.js 14 App Router, Tailwind CSS, TypeScript, React Server Components.
* **API Routes**: Serve precomputed predictions and watchlists from Supabase.
* **ML Workloads**: Decoupled from Vercel serverless. Executed via **scheduled Python batch runner** (Local Cron or GitHub Actions at 16:45 IST post-close).

---

## 11. Database Architecture (Supabase / PostgreSQL)

Complete schema designed across 8 normalized tables:
* `stock_universe` (ISIN canonical mapping, sector, delisting tracking)
* `ohlcv_daily` (adjusted and unadjusted prices, volume, turnover)
* `fundamental_snapshots` (point-in-time filing timestamps, financial ratios)
* `news_articles` (UTC timestamps, publication window, FinBERT scores)
* `model_predictions` (immutable prediction log, feature hashes, horizons)
* `prediction_outcomes` (automated resolution, Brier score, directional correctness)
* `signals_and_levels` (daily BUY/HOLD/SELL, entry, stop loss, target, i18n keys)
* `user_watchlist` (user-selected tickers, custom alert thresholds)

---

## 12. Estimated Engineering Complexity

| Component | Complexity | Timeline Estimate |
|---|---|---|
| Ingestion & Security Master Pipeline | Moderate | 2–3 days |
| PIT Feature Engineering Pipeline | Moderate | 3–4 days |
| Walk-Forward LightGBM Engine & MAPIE | High | 4–5 days |
| Signal Engine & Risk Bounds | Low-Moderate | 2 days |
| Supabase Integration & Prediction Auditing | Moderate | 2 days |
| Next.js Responsive UI & Charts | Moderate | 3–4 days |
| Total MVP Timeline (Phase 2 & 3) | | **16–20 days** |

---

## 13. Major Technical Risks & Mitigations

1. **Target Overlap Leakage**: 1W/1M targets create serial autocorrelation. *Mitigation: Implement PurgedKFold with embargo.*
2. **Restatement Bias in Fundamentals**: Companies revise quarterly results in subsequent audits. *Mitigation: Use strictly initial filing timestamps with a 5-day post-announcement buffer.*
3. **Vercel Serverless Timeouts**: Training or complex inference timing out in 15s. *Mitigation: Zero ML inference on user requests; all predictions are precomputed post-market and stored in PostgreSQL.*

---

## 14. Data / Licensing / ToS Risks

* **yfinance / Unofficial Scrapers**: Potential IP throttling or HTML structure changes. *Mitigation: Use primary official NSE BhavCopy CSV archives for training data; use yfinance as secondary cache.*
* **Screener.in Scraped Data**: ToS prohibits commercial bulk scraping. *Mitigation: Strictly for personal research; use open BSE XBRL filings for core fundamental snapshots.*

---

## 15. What Can Be Built With Zero-Cost Data (Phase 1 & 2)

* Complete 10+ year historical daily price dataset from official NSE BhavCopy archives.
* Full point-in-time technical and macro feature pipelines.
* Multi-horizon LightGBM probabilistic forecasting models.
* Conformal prediction intervals and calibrated probability scores.
* Live RSS news ingestion and FinBERT sentiment scoring.
* Complete Next.js dashboard hosted on Vercel Hobby tier connected to Supabase free tier.

---

## 16. What Will Eventually Require Paid Infrastructure (Future Phase 3)

* **Tick-level real-time streaming**: NSE Level 2/3 market depth (requires authorized data vendor like TrueData / GlobalDatafeeds at Rs 2,000–5,000/mo).
* **Consensus Analyst Estimates**: Real-time forward P/E and EPS consensus revisions (Refinitiv / Bloomberg / FactSet).
* **High-Frequency Machine-Readable News**: Low-latency news feeds (Dow Jones / Reuters News Feed).

---
*All detailed research documents are cataloged in [docs/research/00-index.md](docs/research/00-index.md).*
