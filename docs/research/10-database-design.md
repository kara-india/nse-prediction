# 10 — Database Design & Schema Specification
*Personal Indian Stock Intelligence Dashboard · Supabase (PostgreSQL 15+) Schema*

---

## 1. Schema Overview

The storage architecture is designed to enforce:
1. **Point-in-Time Data Integrity**: Every fundamental, announcement, and news event stores explicit publication timestamps to prevent look-ahead bias.
2. **Auditability of Predictions**: Every generated prediction is immutable, versioned by `model_id` and `model_version`, and linked to a hash of the input feature vector.
3. **Automated Outcome Resolution**: Actual closing prices and returns are joined with past predictions to track live calibration, Brier score, and directional hit rates over time.

---

## 2. Entity Relationship Diagram (Conceptual)

```
┌───────────────────┐        ┌───────────────────────┐
│   stock_universe  │◄───────│      ohlcv_daily      │
└─────────┬─────────┘        └───────────────────────┘
          │
          │                  ┌───────────────────────┐
          ├─────────────────►│ fundamental_snapshots │ (Point-in-time)
          │                  └───────────────────────┘
          │
          │                  ┌───────────────────────┐
          ├─────────────────►│     news_articles     │
          │                  └───────────────────────┘
          │
          │                  ┌───────────────────────┐
          ├─────────────────►│   model_predictions   │
          │                  └───────────┬───────────┘
          │                              │
          │                              ▼
          │                  ┌───────────────────────┐
          │                  │  prediction_outcomes  │
          │                  └───────────────────────┘
          │
          │                  ┌───────────────────────┐
          ├─────────────────►│   signals_and_levels  │
          │                  └───────────────────────┘
          │
          ▼
┌───────────────────┐
│  user_watchlist   │
└───────────────────┘
```

---

## 3. Detailed DDL Specifications

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. STOCK UNIVERSE & SECURITY MASTER
-- ============================================================================
CREATE TABLE stock_universe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(30) NOT NULL,
    exchange VARCHAR(10) NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
    company_name VARCHAR(255) NOT NULL,
    isin VARCHAR(12) NOT NULL, -- Canonical cross-exchange identifier
    sector VARCHAR(100),
    industry VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_delisted BOOLEAN DEFAULT FALSE,
    listed_date DATE,
    delisted_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_symbol_exchange UNIQUE (symbol, exchange),
    CONSTRAINT uq_isin_exchange UNIQUE (isin, exchange)
);

CREATE INDEX idx_stock_universe_isin ON stock_universe (isin);
CREATE INDEX idx_stock_universe_sector ON stock_universe (sector);

-- ============================================================================
-- 2. DAILY OHLCV & ADJUSTED PRICES
-- ============================================================================
CREATE TABLE ohlcv_daily (
    id BIGSERIAL PRIMARY KEY,
    stock_id UUID NOT NULL REFERENCES stock_universe(id) ON DELETE CASCADE,
    trading_date DATE NOT NULL,
    open NUMERIC(12, 4) NOT NULL,
    high NUMERIC(12, 4) NOT NULL,
    low NUMERIC(12, 4) NOT NULL,
    close NUMERIC(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    turnover NUMERIC(18, 2),
    adjusted_close NUMERIC(12, 4), -- Backward-adjusted for splits/dividends
    cumulative_adj_factor NUMERIC(10, 6) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_stock_date UNIQUE (stock_id, trading_date)
);

CREATE INDEX idx_ohlcv_date_stock ON ohlcv_daily (trading_date, stock_id);

-- ============================================================================
-- 3. POINT-IN-TIME FUNDAMENTAL SNAPSHOTS
-- ============================================================================
CREATE TABLE fundamental_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stock_universe(id) ON DELETE CASCADE,
    period_end_date DATE NOT NULL, -- Quarter end (e.g. 2024-03-31)
    filing_datetime_ist TIMESTAMPTZ NOT NULL, -- Exact time results filed with exchange
    period_type VARCHAR(10) CHECK (period_type IN ('QUARTERLY', 'ANNUAL')),
    pe_ratio_ttm NUMERIC(10, 2),
    pb_ratio NUMERIC(10, 2),
    ev_ebitda NUMERIC(10, 2),
    roe_ttm NUMERIC(8, 4),
    roce_ttm NUMERIC(8, 4),
    debt_to_equity NUMERIC(8, 4),
    revenue_growth_yoy NUMERIC(8, 4),
    eps_growth_yoy NUMERIC(8, 4),
    promoter_holding_pct NUMERIC(6, 2),
    pledged_shares_pct NUMERIC(6, 2),
    data_source VARCHAR(50) DEFAULT 'BSE_XBRL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_fund_snapshot UNIQUE (stock_id, period_end_date, period_type)
);

CREATE INDEX idx_fund_filing ON fundamental_snapshots (stock_id, filing_datetime_ist);

-- ============================================================================
-- 4. NEWS ARTICLES & CAUSAL ATTRIBUTION
-- ============================================================================
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID REFERENCES stock_universe(id) ON DELETE SET NULL,
    source VARCHAR(100) NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    url TEXT NOT NULL,
    published_at_utc TIMESTAMPTZ NOT NULL,
    retrieved_at_utc TIMESTAMPTZ DEFAULT NOW(),
    publication_window VARCHAR(20) CHECK (publication_window IN ('OVERNIGHT', 'INTRADAY', 'PRE_OPEN', 'WEEKEND')),
    assigned_trading_date DATE NOT NULL,
    company_sentiment NUMERIC(4, 3) CHECK (company_sentiment BETWEEN -1.0 AND 1.0),
    event_type VARCHAR(50),
    event_severity NUMERIC(3, 2) CHECK (event_severity BETWEEN 0.0 AND 1.0),
    is_exchange_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_trading_date ON news_articles (assigned_trading_date, stock_id);
CREATE INDEX idx_news_published ON news_articles (published_at_utc);

-- ============================================================================
-- 5. MODEL PREDICTIONS (IMMUTABLE LOG)
-- ============================================================================
CREATE TABLE model_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stock_universe(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL, -- Date prediction was made
    horizon VARCHAR(5) NOT NULL CHECK (horizon IN ('1D', '1W', '1M', '3M')),
    target_date DATE NOT NULL,     -- Specific future trading date target
    current_price NUMERIC(12, 4) NOT NULL,
    expected_log_return NUMERIC(8, 5) NOT NULL,
    central_estimate_price NUMERIC(12, 4) NOT NULL,
    range_q10_price NUMERIC(12, 4) NOT NULL,
    range_q90_price NUMERIC(12, 4) NOT NULL,
    prob_positive NUMERIC(5, 4) NOT NULL CHECK (prob_positive BETWEEN 0.0 AND 1.0),
    expected_volatility NUMERIC(6, 4),
    features_hash VARCHAR(64) NOT NULL,
    model_id VARCHAR(50) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_prediction UNIQUE (stock_id, prediction_date, horizon, model_version)
);

CREATE INDEX idx_pred_target ON model_predictions (target_date, stock_id);

-- ============================================================================
-- 6. PREDICTION OUTCOMES & ACCURACY AUDIT
-- ============================================================================
CREATE TABLE prediction_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES model_predictions(id) ON DELETE CASCADE,
    actual_close NUMERIC(12, 4) NOT NULL,
    actual_log_return NUMERIC(8, 5) NOT NULL,
    actual_direction INT NOT NULL CHECK (actual_direction IN (-1, 0, 1)),
    return_error NUMERIC(8, 5) NOT NULL, -- (expected - actual)
    direction_correct BOOLEAN NOT NULL,
    within_q10_q90 BOOLEAN NOT NULL,
    brier_score NUMERIC(6, 5) NOT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_outcome UNIQUE (prediction_id)
);

-- ============================================================================
-- 7. DAILY MODEL SIGNALS & TRADING LEVELS
-- ============================================================================
CREATE TABLE signals_and_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stock_universe(id) ON DELETE CASCADE,
    signal_date DATE NOT NULL,
    signal VARCHAR(10) NOT NULL CHECK (signal IN ('BUY', 'HOLD', 'SELL')),
    confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    entry_low NUMERIC(12, 4) NOT NULL,
    entry_high NUMERIC(12, 4) NOT NULL,
    stop_loss NUMERIC(12, 4) NOT NULL,
    target_price NUMERIC(12, 4) NOT NULL,
    risk_reward_ratio NUMERIC(6, 2) NOT NULL,
    explanation_keys JSONB NOT NULL,   -- Array of i18n keys for explanations
    explanation_params JSONB NOT NULL, -- Dynamic values for i18n interpolation
    model_version VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_stock_signal_date UNIQUE (stock_id, signal_date, model_version)
);

-- ============================================================================
-- 8. USER WATCHLIST
-- ============================================================================
CREATE TABLE user_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stock_universe(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_stock UNIQUE (stock_id)
);
```

---
*Sources: Supabase PostgreSQL Documentation (supabase.com/docs), PostgreSQL 15 Manual.*
