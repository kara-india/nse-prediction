# 09 — Vercel Architecture & Deployment Topology
*Personal Indian Stock Intelligence Dashboard · Phase 1 Architecture*

---

## 1. Vercel Platform Realities & Constraints

Hosting an ML-driven stock intelligence dashboard on Vercel requires strict separation of concerns between client rendering, serverless orchestration, and heavy ML batch compute:

| Dimension | Vercel Serverless (Node.js) | Vercel Edge Runtime | Heavy ML Training / Batch Inference |
|---|---|---|---|
| **Max Execution Duration** | 15s (Hobby), 300s (Pro with config) | 30s | Hours (Walk-forward retraining) |
| **Max Memory** | 1024 MB (Hobby), 3008 MB (Pro) | 128 MB | 8 GB - 32 GB (DataFrames, LightGBM) |
| **Package Constraints** | Node.js standard libraries, npm packages | Strict V8 isolate, no native Node C++ addons | Python, PyTorch, LightGBM, Pandas, Scikit-learn |
| **Cold Start** | ~200ms - 500ms | ~0ms - 50ms | N/A (Warm worker or container) |
| **Role in Architecture** | UI Data BFF (Backend-for-Frontend), User Watchlist APIs, Cache Proxy | Lightweight edge routing, geo-auth, static asset delivery | Offline / daily scheduled cron jobs, feature store pipeline |

> **Architectural Verdict**:
> NEVER run heavy ML training, large pandas feature engineering, or multi-horizon backtesting directly inside Vercel Serverless Functions. Vercel is strictly for the **Next.js frontend, API routing, and serving precomputed predictions from Supabase/PostgreSQL**.

---

## 2. Decoupled Service Topology

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                      USER BROWSER                       │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                      HTTPS (Next.js App)
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │              VERCEL SERVERLESS PLATFORM                 │
                  │                                                         │
                  │  ┌───────────────────────┐   ┌───────────────────────┐  │
                  │  │   Next.js App Router  │   │  Edge / Node API      │  │
                  │  │   - Stock Search      │   │  - /api/stocks/[id]   │  │
                  │  │   - Watchlist UI      │   │  - /api/predictions   │  │
                  │  │   - Interactive Chart │   │  - /api/signals       │  │
                  │  │   - i18n (EN / HI)    │   │  - /api/news/overnight│  │
                  │  └───────────────────────┘   └───────────┬───────────┘  │
                  └──────────────────────────────────────────┼──────────────┘
                                                             │
                                             PostgREST / Supabase Client
                                                             │
                                                             ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE (MANAGED POSTGRESQL + PGVECTOR)                        │
│                                                                                           │
│  - stock_universe        - ohlcv_daily               - news_articles                      │
│  - model_predictions     - actual_outcomes           - model_performance_eval             │
│  - signals_and_levels    - user_watchlist            - feature_snapshots                  │
└────────────────────────────────────────────▲──────────────────────────────────────────────┘
                                             │
                                   Direct SQL / REST Ingestion
                                             │
┌────────────────────────────────────────────┴──────────────────────────────────────────────┐
│                    EXTERNAL PYTHON ML & DATA ENGINE (ZERO-COST STACK)                     │
│                                                                                           │
│  Execution Environments (Choose One):                                                     │
│  1. Local Scheduled Runner (Developer Laptop / Mini PC cron) [Recommended Phase 1]       │
│  2. GitHub Actions (Free 2,000 min/mo runner for scheduled daily jobs)                   │
│  3. Modal.com / Render / Cloud Run (Free credit tier for Python microservices)            │
│                                                                                           │
│  Scheduled Daily Tasks (16:30 IST / Post-Close):                                          │
│  1. Ingest approved/ licensed EOD data + corporate actions                                │
│  2. Fetch Overnight & Post-Close RSS / Exchange Announcements                             │
│  3. Run Point-in-Time Feature Engineering Pipeline                                        │
│  4. Execute Pre-trained LightGBM Models (1D, 1W, 1M, 3M)                                  │
│  5. Run Signal Engine (Risk/Reward, Stops, Targets, Confidence)                           │
│  6. Write New Predictions & Resolve Prior Predictions to Supabase                         │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Scheduled Daily Execution Architecture

Indian markets operate on **Asia/Kolkata** time:
* **09:00 - 09:15 IST**: Pre-market open
* **09:15 - 15:30 IST**: Normal market session
* **15:30 - 16:00 IST**: Closing price calculations and provisional BhavCopy release
* **16:30 - 18:00 IST**: Final NSE BhavCopy and daily corporate announcements published

### Daily Timeline:
1. **16:45 IST**: GitHub Action or Local Cron triggers daily batch script (`scripts/ingest_daily.py`).
2. **Step 1 - Data Sync**: Fetch from the approved provider, update `ohlcv_daily`; do not assume public MCP or file access permits model use.
3. **Step 2 - News Aggregation**: Poll exchange announcements (BSE/NSE) and financial RSS feeds published between previous close (15:30 IST $T-1$) and today's close (15:30 IST $T$).
4. **Step 3 - Feature Build**: Compute rolling indicators, lagged macro variables, and NLP sentiment scores strictly up to date $T$.
5. **Step 4 - Inference**: Generate multi-horizon predictions ($T+1, T+5, T+21, T+63$) and risk levels.
6. **Step 5 - Prediction Resolution**: Check prior predictions where target date $= T$, calculate prediction error, directional hit/miss, and update calibration statistics.
7. **Step 6 - Upsert to Supabase**: Write all records to PostgreSQL tables.
8. **08:30 IST (Next Day)**: Fast lightweight morning cron checks for overnight news between 15:30 IST and 08:30 IST to generate the "Overnight News / What to watch today" card.

---

## 4. Cost Breakdown (Personal Deployment)

| Component | Provider | Tier | Monthly Cost |
|---|---|---|---|
| **Frontend & API Gateway** | Vercel | Hobby Plan | **$0.00** |
| **Database & Cache** | Supabase | Free Tier (500MB DB, 2 projects) | **$0.00** |
| **Daily Batch / ML Inference** | Local Cron / GitHub Actions | Free (2,000 free runner minutes) | **$0.00** |
| **Market Data (Historical)** | Exchange/provider source with rights for storage, backtesting and model training | **TBD — confirm terms and pricing before implementation** | **TBD** |
| **Live Intraday Quotes** | Licensed vendor or broker source, if intraday scope is approved | Terms and costs TBD | **TBD** |
| **Total Phase 1 Cost** | Market-data rights unresolved | | **TBD / month** |

The official NSE MCP is available for informational/learning use, but NSE’s published MCP terms do not grant rights to train models or commercially exploit the data. Do not use it as the automated inference/training feed unless NSE confirms the planned use in writing. The previous zero-cost market-data estimate is not validated for this project’s automated strategy research; see [12-market-data-and-strategy-research.md](./12-market-data-and-strategy-research.md).

---
*Sources: Vercel Documentation (vercel.com/docs), Supabase Pricing (supabase.com/pricing), GitHub Actions limits.*
