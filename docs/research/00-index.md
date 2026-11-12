# Research Documentation Index
*Personal Indian Stock Intelligence Dashboard · Phase 1 Quantitative Architecture*

| Document | File Name | Topics Covered | Status |
|---|---|---|---|
| **01** | [01-data-sources.md](./01-data-sources.md) | NSE/BSE Market Data Sources, Screener.in Analysis, Corporate Actions, Symbol Master | ✅ Complete |
| **02** | [02-news-sources.md](./02-news-sources.md) | Historical News (GDELT), Live RSS Feeds, NLP Sentiment (FinBERT), Causal Timestamp Pipeline | ✅ Complete |
| **03** | [03-feature-engineering.md](./03-feature-engineering.md) | Technical Indicators, Macro/Global Features, Point-in-Time Fundamentals | ✅ Complete |
| **04** | [04-target-definition.md](./04-target-definition.md) | Log Returns vs Raw Price, Trading Calendar Horizons, Quantile Targets (Q10, Q90) | ✅ Complete |
| **05** | [05-model-comparison.md](./05-model-comparison.md) | Evaluation of 12 Model Architectures across 1D/1W/1M/3M, LightGBM Selection | ✅ Complete |
| **06** | [06-validation-and-leakage.md](./06-validation-and-leakage.md) | Purged Walk-Forward Cross-Validation, 12 Leakage Sources, Survivorship Bias, No Hand-Weighting | ✅ Complete |
| **07** | [07-reinforcement-learning-assessment.md](./07-reinforcement-learning-assessment.md) | In-depth Methodological Assessment of RL vs Supervised Learning (Definitive Rejection for Phase 1) | ✅ Complete |
| **08** | [08-signal-and-risk-engine.md](./08-signal-and-risk-engine.md) | BUY/HOLD/SELL Decision Engine, Hybrid ATR/Quantile Stops, Calibrated Confidence, Yesterday Analysis | ✅ Complete |
| **09** | [09-vercel-architecture.md](./09-vercel-architecture.md) | Vercel Limits, Decoupled Topology, Scheduled Jobs, Zero-Cost Deployment Stack | ✅ Complete |
| **10** | [10-database-design.md](./10-database-design.md) | Complete PostgreSQL/Supabase DDL Schema with Point-in-Time and Auditing Support | ✅ Complete |
| **11** | [11-mvp-implementation-plan.md](./11-mvp-implementation-plan.md) | Original Phase 2 MVP plan (superseded by document 13 pending data-rights gate) | Archived plan |
| **12** | [12-market-data-and-strategy-research.md](./12-market-data-and-strategy-research.md) | Official NSE MCP, third-party MCP assessment, data rights, earnings-event research, factor hypotheses and research gaps | ✅ Research draft for review |
| **13** | [13-development-roadmap.md](./13-development-roadmap.md) | Reviewable phased plan from licensing and data foundations through event research, validation, shadow operation and dashboard | ✅ Draft for review |

---
*Executive Summary available in [RESEARCH_SUMMARY.md](../../RESEARCH_SUMMARY.md).*
