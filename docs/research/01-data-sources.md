# 01 — Indian Stock Market Data Sources
*Research for ML-based NSE/BSE Intelligence Dashboard · Sep 2026*

---

## A. Data Source Evaluation

### Classification

| Category | Sources |
|---|---|
| **Officially supported APIs** | Kite Connect, Upstox, Angel One SmartAPI, NSE Data & Analytics (paid), BSE official downloads |
| **Technically accessible (unofficial)** | yfinance, nsepython, nselib, jugaad-data, OpenBB, EODHD, Twelve Data, FMP |
| **Deprecated / broken** | NSEpy (broken since Apr 2023), Quandl (no India coverage), Alpha Vantage (unreliable for India) |
| **Free (with limits)** | yfinance, NSE/BSE CSV downloads, nselib, nsepython, Alpha Vantage (25 rpm), FMP (250 req/day) |
| **Paid** | Kite Connect (Rs 500/mo), Upstox Pro, Angel One SmartAPI, EODHD (-80/mo), Twelve Data (+/mo), TrueData |

---

### Master Comparison Table

| Source | NSE | BSE | Daily History Depth | Intraday | Fundamentals | News | Free Tier | Stability | Legal/ToS Concern | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|
| yfinance | .NS | .BO | ~20 yrs | 1m-1d (60d window) | Partial | No | Yes | Medium (scrape) | Unofficial scrape | Good for ML training; fragile for prod |
| NSEpy | No | No | N/A | N/A | No | No | N/A | Broken Apr 2023 | N/A | DEPRECATED - do not use |
| NSE Official BhavCopy | Yes (authoritative) | No | Full exchange history | Paid feed | No | No | CSV bulk only | High | Official CSV OK | Use BhavCopy for training |
| BSE Official | No | Yes (authoritative) | Full history | No free API | No | No | CSV downloads | High | Official | Use for BSE history & corp actions |
| Alpha Vantage | Unreliable | Unreliable | ~20 yrs | Yes | US-centric | Yes | 25 req/day | Low for India | API ToS OK | NOT recommended for India |
| Twelve Data | Yes | Yes | 20+ yrs | 1m-4h | No | No | 800 req/day | High | Commercial OK | Good OHLCV backup |
| OpenBB | Via providers | Via providers | Provider-dependent | Yes | Aggregated | Yes | Open-source | Provider-dependent | Provider ToS apply | Research UI; unstable as pipeline |
| Jugaad Trader | Yes | Yes | ~10 yrs (BhavCopy) | Yes | No | No | Yes | Community | Unofficial scrape | Bulk BhavCopy ingestion |
| Kite Connect | Yes | No | 2000 candles/req | 1m-day | No | No | Rs 500/mo | High | Official broker API | BEST for live dashboard + intraday |
| Angel SmartAPI | Yes | Yes | ~1 yr intraday | Yes | No | No | Free w/ demat | Medium-High | Official broker | Free alternative to Kite |
| Upstox API | Yes | Yes | ~2 yrs intraday | Yes | No | No | Free w/ demat | Medium-High | Official broker | Free alternative; WebSocket |
| EODHD | Yes | Yes | 20+ yrs | 1m historical | Yes (financials) | Yes | 20 req/day free | High | Commercial OK | BEST paid: adjusted OHLCV + fundamentals |
| FMP | Partial | Partial | Varies | No | Strong | No | 250 req/day | Medium India | Commercial OK | Verify per-ticker coverage first |
| Quandl/Nasdaq Data Link | No | No | N/A | N/A | No | No | N/A | N/A | N/A | No India coverage |

---

### Usage Segmentation

| Use Case | Recommended Sources |
|---|---|
| ML historical training (price) | NSE BhavCopy CSVs + yfinance (.NS/.BO) + EODHD |
| ML historical training (fundamentals) | BSE XBRL quarterly filings (point-in-time) or EODHD |
| Live dashboard (real-time) | Kite Connect WebSocket or Upstox WebSocket |
| Intraday ML features | Kite Connect (1m candles), Upstox, TrueData |
| Corporate actions | NSE/BSE official CSVs -> EODHD for adjusted series |

---

## B. Screener.in

### API & Access Summary

| Attribute | Detail |
|---|---|
| Official API | None |
| Unofficial access | Internal JSON endpoints via browser DevTools; HTML scraping |
| Auth required | Yes - login required (free account sufficient) |
| Rate limits | UNRESOLVED - not published; community recommends >=200ms between requests |
| ToS / scraping | Grey area; no explicit prohibition; do not hammer |

### Available Data
- Valuation: P/E, P/B, EV/EBITDA, Div Yield, Market Cap
- Profitability: ROE, ROCE, PAT Margin, OPM
- Balance sheet: Debt/Equity, Current Ratio, Total Assets
- P&L: Revenue, EBITDA, PAT (10-15 yr history)
- Cash flow: CFO, Capex, Free Cash Flow
- Shareholding: Promoter %, FII %, DII %, Public % (quarterly)
- Quarterly results: Revenue, PAT, EPS per quarter

### CRITICAL: Point-in-Time Safety Assessment

**Screener.in is NOT point-in-time safe for ML backtesting.**

| Issue | Detail |
|---|---|
| Ratio restating | P/E, P/B shown use current price against historical EPS |
| Financial restatements | Historical earnings restated without version control |
| No as-of-date API | Cannot query "what was ROE as known on 2020-01-01" |
| 5/10-yr averages | Cannot be used as ML features without look-ahead bias |

### Alternatives for Point-in-Time Fundamentals

| Source | Point-in-Time Safe | Notes |
|---|---|---|
| Build your own pipeline | Yes | Snapshot BSE/NSE quarterly results at announcement date |
| BSE XBRL filings | Yes (with effort) | All quarterly results with exact filing date |
| EODHD | Partial | Quarterly snapshots; verify restatement policy |
| Refinitiv / Bloomberg | Yes | Enterprise-grade; expensive |

**Actionable**: Build a pipeline that ingests quarterly results from BSE/NSE announcements at announcement date and snapshots them. Never use today's restated Screener.in figures for historical ML features.

---

## C. Corporate Actions Data

| Source | Splits | Dividends | Bonus | Rights | Delistings | Free | Adjusted OHLCV |
|---|---|---|---|---|---|---|---|
| NSE official CSV | Yes | Yes | Yes | Yes | Yes | Yes | Raw only |
| BSE official | Yes | Yes | Yes | Yes | Yes | Yes | Raw only |
| yfinance | Yes | Yes | No | No | No | Yes | Auto-adjusted |
| EODHD | Yes | Yes | Yes | Yes | Partial | Paid | Yes |
| Kite Connect | Yes | Yes | Yes | No | No | Paid | Continuous adjusted |

### Price Adjustment: Backward Adjustment (recommended for ML)

`
Factor (dividend) = (Price_ex_date - Dividend) / Price_ex_date
Factor (split/bonus) = 1 / Split_Ratio
Adjusted_Close[t < ex_date] = Raw_Close[t] * cumulative_factor
`

Warning: Forward-adjusted prices shift with every new corporate action. Store a versioned adjustment factor log.

---

## D. Stock Universe & Ticker Mapping

| Source | NSE | BSE | ISIN | Sector | Free | Update |
|---|---|---|---|---|---|---|
| NSE Equity Master CSV | Yes | No | Yes | Yes (4-tier) | Yes | Daily |
| BSE Security Master CSV | No | Yes | Yes | Yes | Yes | Daily |
| nselib / nsepython | Yes | No | Yes | Yes | Yes | On-demand |
| EODHD Exchange Symbols | Yes | Yes | Yes | Yes | Paid | Daily |

- Use ISIN as canonical key to link NSE symbol <-> BSE scrip code
- Prefer NSE for price data; BSE for corporate announcement timing
- For survivorship bias: reconstruct tradeable universe per date from NSE BhavCopy daily archive replay

---

## Quick-Reference Recommended Stack

`
ML Training (price)        -> NSE BhavCopy CSVs + yfinance fallback
ML Training (fundamentals) -> BSE XBRL quarterly filings (point-in-time snapshot)
                              or EODHD fundamentals (verify restatement)
Live Dashboard             -> Kite Connect WebSocket or Upstox WebSocket
Corporate Actions          -> NSE/BSE official CSVs -> EODHD for pre-adjusted
Ticker Universe            -> NSE Equity Master CSV (daily cron)
Anti-survivorship          -> NSE BhavCopy daily archive replay
`

Sources: nseindia.com | bseindia.com | kite.trade | eodhd.com | screener.in | pypi.org/project/nselib | pypi.org/project/jugaad-data | Sep 2026
