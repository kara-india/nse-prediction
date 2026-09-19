# 03 — Feature Engineering
*Indian Stock Intelligence Dashboard · Sep 2026*

## Lookahead Rule
All features computed from T-1 data for predictions at T. Use .shift(1) on daily values before feeding to model.

## A. Technical Features

| Feature | 1D | 1W | 1M | 3M | Lookahead Risk | Notes |
|---|---|---|---|---|---|---|
| Log return 1D | STRONG | YES | WEAK | NO | Low if shifted | Primary momentum feature; normalize cross-sectionally |
| Log return 5D | YES | STRONG | YES | WEAK | Low | Overlapping windows inflate autocorrelation |
| Log return 21D | WEAK | YES | STRONG | YES | Low | Strong in mean-reversion regimes |
| Log return 63D | NO | WEAK | YES | STRONG | Low | 3M momentum documented in cross-sectional equity research |
| RSI (14D) | STRONG | YES | WEAK | NO | MEDIUM | Compute with close T-1; uses EMA internally |
| MACD (12/26/9) | YES | STRONG | YES | WEAK | MEDIUM | Histogram > raw MACD; signal line lag reduces risk |
| BB Width | WEAK | YES | STRONG | YES | Low | Volatility regime proxy; wide bands = mean-reversion tendency |
| BB Position (% within band) | STRONG | YES | WEAK | NO | Low | Overbought/oversold; combine with RSI |
| ATR/Price (14D normalized) | YES | STRONG | YES | WEAK | Low | Critical for stop derivation and position sizing |
| Volume Ratio (today/20D avg) | STRONG | YES | WEAK | NO | MEDIUM | Use prior-day ratio; high ratio + price move = confirmation |
| OBV | YES | STRONG | YES | WEAK | Low if shifted | Rate-of-change of OBV more useful than level |
| Distance from 52W High/Low | WEAK | YES | STRONG | STRONG | Low | Strong cross-sectional signal; 52W low = capitulation proxy |
| Beta (60D vs NIFTY) | NO | WEAK | YES | STRONG | Low | High-beta stocks amplify index moves |
| Realized Vol 20D | YES | STRONG | YES | WEAK | Low | Use log-variance for normality |
| Realized Vol 60D | NO | WEAK | YES | STRONG | Low | Ratio 20D/60D signals vol compression/expansion |
| Market-relative return (alpha) | STRONG | STRONG | YES | YES | Low | Subtract NIFTY return; reduces factor noise |
| Sector-relative return | YES | STRONG | YES | YES | Low | Intra-sector alpha; requires NSE sector index mapping |
| Gap (open vs prev close) | STRONG | WEAK | NO | NO | HIGH same-day | USE T-1 GAP ONLY - same-day gap = lookahead in daily bars |

## B. Macro/Global Features

Sources: VECM/Granger causality studies (mdpi.com, ectap.ro, repec.org); FII flow mechanism research.

| Feature | Documented Evidence | Frequency | Availability (IST) | Multicollinearity Risk |
|---|---|---|---|---|
| S&P 500 return (prev session) | STRONG - leads NIFTY via FII sentiment | Daily | Pre-open ~09:00 | HIGH - corr w/ Nikkei/HSI |
| Nikkei 225 return | MODERATE - Asia-Pacific risk proxy | Daily | ~09:00 partial | HIGH |
| Hang Seng return | MODERATE - EM peer / China exposure | Daily | ~11:00 partial | HIGH |
| DXY change | STRONG - rising DXY = FII outflows from EMs | Daily | Pre-open | HIGH - inverse of USD/INR |
| USD/INR change | STRONG - direct FII flow and import cost mechanism | Daily | Pre-open | HIGH - corr w/ DXY |
| Crude Brent change | STRONG - India as net importer; margin impact | Daily | Pre-open | Medium |
| Gold change | WEAK - flight-to-safety proxy only | Daily | Pre-open | Medium |
| US 10Y yield change | MODERATE - EM valuation multiples | Daily | Post-US-close | Medium |
| India VIX | STRONG - domestic fear gauge; predicts near-term vol | Daily | Use prev close | Low |
| NIFTY 50 return | STRONG - systematic factor for all stocks | Daily | T-1 close | Medium (varies by beta) |
| NIFTY sector index return | STRONG for 1D/1W | Daily | T-1 close | HIGH - corr w/ NIFTY |
| RBI policy event (dummy) | MODERATE for volatility, weak for direction | Event | Calendar-known | Low |
| Fed policy event (dummy) | MODERATE - USD/global liquidity effect | Event | Calendar-known | Low |

Multicollinearity mitigation: Apply VIF selection or PCA on S&P/Nikkei/Hang Seng cluster. Retain DXY OR USD/INR, not both.

## C. Fundamental Features (Point-in-Time)

### Indian Publication Lag - SEBI LODR Regulation 33
| Quarter | SEBI Deadline | Practical Lag |
|---|---|---|
| Q1/Q2/Q3 | 45 days after quarter end | Typically 20-45 days |
| Q4/Annual (audited) | 60 days after financial year end | Typically 30-60 days |

Point-in-time rule: Use BSE/NSE exchange FILING TIMESTAMPS, not quarter-end dates. Add 5-day buffer. Never use data with published_at > prediction_date.

UNRESOLVED: Forward P/E availability for all NSE stocks depends on data provider. Use trailing TTM P/E as safe default.

### Fundamentals - Horizon Table

| Fundamental | Include? | 1D | 1W | 1M | 3M | Notes |
|---|---|---|---|---|---|---|
| Trailing P/E (TTM) | YES | NO | WEAK | YES | YES | Cross-sectional rank > absolute value |
| Forward P/E | UNRESOLVED | NO | NO | YES | YES | Consensus availability varies by provider |
| P/B ratio | YES | NO | WEAK | YES | YES | Strong for value factor; pair with ROE |
| ROE (TTM) | YES | NO | NO | YES | STRONG | Quality factor; beware leverage inflation |
| ROCE | YES | NO | NO | WEAK | YES | More robust than ROE for capital-intensive sectors |
| Debt/Equity | YES | NO | NO | YES | YES | Risk factor; critical for stress-regime signals |
| Revenue growth YoY | YES | NO | NO | YES | YES | Lag 1 quarter for point-in-time safety |
| EPS growth YoY | YES | NO | WEAK | YES | STRONG | Primary fundamental momentum signal |
| EBITDA margin | YES | NO | NO | YES | YES | Margin trend as regime signal |
| FCF yield | YES | NO | NO | WEAK | YES | Poor data availability for small caps |
| Earnings surprise % | STRONG | STRONG | YES | WEAK | NO | Post-earnings drift (PEAD) documented |
| Promoter holding % | YES | NO | NO | WEAK | YES | Disclosed quarterly |
| Change in promoter holding | YES | NO | WEAK | YES | YES | Increase = bullish; pledge increase = bearish |
| Pledged shares % | YES | NO | NO | YES | YES | High pledge + high D/E = forced-selling risk |
| Institutional holding change | YES | NO | WEAK | YES | YES | Quarterly flow proxy |

Sources: SEBI LODR Regulation 33, mdpi.com, ectap.ro, repec.org, NSE studies on PEAD
