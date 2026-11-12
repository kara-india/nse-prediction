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
| **Publicly accessible / free tiers (use rights vary)** | yfinance, NSE/BSE downloads, nselib, nsepython, Alpha Vantage, FMP. Public access or a free tier does not establish rights for model training, automated trading calculations, retention or redistribution. |
| **Paid** | Kite Connect (Rs 500/mo), Upstox Pro, Angel One SmartAPI, EODHD (-80/mo), Twelve Data (+/mo), TrueData |

---

### Master Comparison Table

| Source | NSE | BSE | Daily History Depth | Intraday | Fundamentals | News | Free Tier | Stability | Legal/ToS Concern | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|
| yfinance | .NS | .BO | ~20 yrs | 1m-1d (60d window) | Partial | No | Yes | Medium (scrape) | Unofficial access; verify current terms | Research candidate only after terms/quality review; fragile for production |
| NSEpy | No | No | N/A | N/A | No | No | N/A | Broken Apr 2023 | N/A | DEPRECATED - do not use |
| NSE Official BhavCopy | Yes (authoritative) | No | Exchange archive depth varies by product | Paid feed | No | No | Public downloads / subscription products | High | Confirm terms for storage, automated calculations and model training | Candidate source only after written use-rights review |
| BSE Official | No | Yes (authoritative) | Full history | No free API | No | No | CSV downloads | High | Official | Use for BSE history & corp actions |
| Alpha Vantage | Unreliable | Unreliable | ~20 yrs | Yes | US-centric | Yes | 25 req/day | Low for India | API ToS OK | NOT recommended for India |
| Twelve Data | Yes | Yes | Provider-dependent | 1m-4h | No | No | Current plan-dependent | Provider-dependent | Vendor terms apply | Candidate backup; verify Indian coverage and model/derived-use rights |
| OpenBB | Via providers | Via providers | Provider-dependent | Yes | Aggregated | Yes | Open-source | Provider-dependent | Provider ToS apply | Research UI; unstable as pipeline |
| Jugaad Trader | Yes | Yes | ~10 yrs (BhavCopy) | Yes | No | No | Yes | Community | Unofficial scrape | Bulk BhavCopy ingestion |
| Kite Connect | Yes | No | 2000 candles/req | 1m-day | No | No | Rs 500/mo | High | Official broker API | BEST for live dashboard + intraday |
| Angel SmartAPI | Yes | Yes | ~1 yr intraday | Yes | No | No | Free w/ demat | Medium-High | Official broker | Free alternative to Kite |
| Upstox API | Yes | Yes | ~2 yrs intraday | Yes | No | No | Free w/ demat | Medium-High | Official broker | Free alternative; WebSocket |
| EODHD | Yes | Yes | Provider-dependent | 1m historical | Yes (financials) | Yes | Trial/free tier varies | Provider-dependent | Vendor terms apply | Paid candidate; verify Indian coverage, PIT policy and model/derived-use rights |
| FMP | Partial | Partial | Varies | No | Strong | No | Current plan-dependent | Medium India | Vendor terms apply | Verify per-ticker coverage, PIT history and model/derived-use rights |
| Quandl/Nasdaq Data Link | No | No | N/A | N/A | No | No | N/A | N/A | N/A | No India coverage |

---

### Usage Segmentation

| Use Case | Recommended Sources |
|---|---|
| ML historical training (price) | Licensed historical EOD feed or source with written rights for backtesting/model training; yfinance/provider alternatives also require terms and quality review |
| ML historical training (fundamentals) | BSE XBRL quarterly filings (point-in-time) or EODHD |
| Live dashboard (real-time) | Kite Connect WebSocket or Upstox WebSocket |
| Intraday ML features | Kite Connect (1m candles), Upstox, TrueData |
| Corporate actions | NSE/BSE official files or licensed provider after use-rights confirmation; keep raw records and derive versioned adjustments |

### Official NSE MCP (research update, Nov 2026)

NSE now publishes two official MCP endpoints: `nse-bhavcopy` for EOD/history and `cm-market` for near-real-time cash-market snapshots. NSE’s page describes roughly five years of EOD data, 1–3 minute delayed quotes and no tick/order-book data. The MCP terms explicitly limit use to informational/learning purposes and do not grant rights to commercially exploit the data or train/fine-tune models or algorithms. Do not use the MCP as the automated model-training or signal feed under the current terms. See [12-market-data-and-strategy-research.md](./12-market-data-and-strategy-research.md) for endpoint capabilities and data-rights findings.

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
ML Training (price)        -> A licensed/approved historical source; verify model-training rights before use
ML Training (fundamentals) -> BSE XBRL quarterly filings (point-in-time snapshot)
                              or EODHD fundamentals (verify restatement)
Live Dashboard             -> Kite Connect WebSocket or Upstox WebSocket
Corporate Actions          -> Permitted NSE/BSE files or licensed source; derive versioned adjustments
Ticker Universe            -> NSE Equity Master CSV (daily cron)
Anti-survivorship          -> Historical security-master/archive source with permitted use; include delisted names
`

Sources: nseindia.com | bseindia.com | kite.trade | eodhd.com | screener.in | pypi.org/project/nselib | pypi.org/project/jugaad-data | Sep 2026
