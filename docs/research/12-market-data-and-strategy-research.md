# 12 — Market Data, Earnings Events and Strategy Research

*NSE/BSE Stock Intelligence Project · Research note and decision brief · 12 Nov 2026*

## Executive Findings

1. **NSE now exposes official MCP servers.** The `nse-bhavcopy` endpoint provides daily data and historical tools; `cm-market` provides NSE cash-market snapshots. I initialized the official MCP endpoint and called `tools/list` and a live quote tool during this research. The official product page describes five years of end-of-day data for more than 3,500 listed equities, 1–3 minute delayed near-real-time quotes, and no tick-by-tick/order-book data. Individual history requests are chunked (up to three months for stock history on the Bhavcopy server).
2. **Do not use the official MCP as the model-training feed.** NSE’s own MCP page limits use to information/learning, excludes commercial purposes, and explicitly says access grants no right to train or fine-tune models or algorithms. The NSE Data Sharing & Usage Policy separately places algorithmic/non-display and data redistribution under specific agreements. A strategy that consumes market data in automated decision calculations must have a permitted source and written rights confirmed before it is built for that use.
3. **The community `Live-NSE-BSE-MCP` project is an MCP adapter, not an exchange feed.** Its README says it calls IndianAPI, requires an IndianAPI key, and describes a beta server. It can help test a conversational data workflow, but it should not be treated as an authoritative source, licensed data entitlement, or a historical point-in-time data system without provider due diligence.
4. **Earnings are worth researching, but the useful trade is not simply “results tomorrow.”** Indian evidence includes pre-announcement price movement, earnings surprise effects and possible post-announcement drift, but papers differ by sample, period, measure and conclusion. Build separate pre-result and post-result hypotheses, timestamp every disclosure, and test them after costs.
5. **Intraday should not be the first strategy track.** SEBI’s study of individual cash-equity intraday traders found 71% made net losses in FY23; costs materially worsened losses. A 2025 NSE order-imbalance study reports that apparent strategy returns disappeared after costs. The official NSE MCP has delayed snapshots and no order book, so it does not support robust tick/order-imbalance research.
6. **The present repository is an architecture scaffold, not an operating model.** Ingestion, feature generation, walk-forward validation and signal generation are incomplete skeletons. Several current research assumptions need reconciliation before implementation, including use rights, fixed signal weights, stop-loss logic and horizon-specific purge/embargo settings.

## 1. What the Project Is Trying to Build

The local project and research set define a personal NSE/BSE stock intelligence dashboard with multi-horizon return distributions, calibrated probabilities, risk levels, explanations and a BUY/HOLD/SELL-style decision layer. The stated focus is scientific validation and prevention of look-ahead leakage. The implementation plan proposes daily/hourly jobs, precomputed predictions and a Next.js UI; the Python data/model work remains largely unimplemented.

The user’s stated practical objective adds a requirement that the research plan should make explicit: prioritize **net-of-cost candidate ranking and abstention** over a raw “tomorrow’s price” forecast. Each strategy must state the eligible universe, time the information became available, the first tradable price, holding horizon, costs, capacity/liquidity limits and the conditions under which the system does nothing.

An informational model output is not evidence that a strategy will make money. The roadmap therefore treats all signal concepts below as hypotheses to falsify, not recommendations to trade.

## 2. NSE MCP and the Community MCP Repository

### 2.1 Official NSE MCP: verified capabilities and limits

The NSE MCP landing page documents two custom servers:

| Endpoint / connector | Role | Relevant capabilities | Constraints |
|---|---|---|---|
| `https://mcp.nseindia.in/bhavcopy/cm/mcp` (`nse-bhavcopy`) | End-of-day and historical cash-market data | Stock OHLCV history, close by date, bulk quotes, breadth, top movers/volume, corporate actions, index history/performance, moving averages, symbol lookup | About 5 years of EOD history; per-call history is chunked; raw prices are not adjusted for splits/bonus; no published model-training permission |
| `https://mcp.nseindia.in/cmmkt/mcp` (`cm-market`) | NSE cash-market snapshots | Specific equity quotes, live indices, gainers/losers, equity lists, freshness/status | NSE describes near-real-time delay of 1–3 minutes; no tick-by-tick or order-book data; freshness can lag and must be checked |

Research verification on 12 Nov 2026: the Bhavcopy endpoint accepted MCP protocol initialization and returned 20 tools from `tools/list`; the CM-market endpoint returned 15 tools. A call to `cm_get_stock_quote` for RELIANCE returned a quote with `updatedAt` and a separate exchange timestamp; `cm_get_data_status` reported a five-minute crawl interval and 15-minute cache TTL. That confirms the service is callable and gives useful timestamps, but **does not establish service-level guarantees, permission for automated strategy use, or historical completeness**.

The official page states that the data is for informational/learning use, is not intended for real-time trading, investment advice or commercial products, and that MCP access does not grant rights to commercially exploit the data or train/fine-tune models or algorithms. It also warns that old prices are not adjusted for splits or bonus issues. Treat the MCP as a manual research/learning interface unless NSE confirms a permitted use in writing. Do not ingest its output into model training, automated BUY/SELL calculations or a public/commercial product based on the current stated terms.

### 2.2 `GirishKumarDV/Live-NSE-BSE-MCP`

The repository’s own README says it is powered by IndianAPI. It requires an IndianAPI key, defaults to `https://stock.indianapi.in/`, and offers an MCP server/client wrapper around provider endpoints for quotes, company data, screeners, historical stats, analyst recommendations, forecasts, mutual funds and commodities. The repository metadata identifies the project as MIT licensed and beta, with its latest reported push in 2025. The license on the wrapper covers its code; it does not grant rights to the data supplied by IndianAPI or prove the data is sourced directly from NSE/BSE.

**Assessment:** useful as a prototype interface after checking IndianAPI’s current endpoint coverage, rate limits, historical depth, timestamp semantics, adjusted-price policy, survivorship history, point-in-time fundamentals, licensing and service terms. It is not the preferred canonical storage/ETL layer. The project’s own README says the package is not published on PyPI and recommends a source install. Before depending on it, independently verify representative outputs against a licensed exchange/broker source and review dependency/security posture. Do not send API keys to browser code, logs or Git.

### 2.3 Data-source decision for the project

| Need | Candidate path | Recommendation |
|---|---|---|
| Human market lookup / learning | Official NSE MCP | Use manually where the connector terms permit; disclose as-of timestamps and warnings. |
| Historical supervised training | Licensed historical EOD/corporate-action provider, or exchange data with written training/derived-use permissions | Select only after a written use-rights review. Current NSE MCP terms prohibit using its data to train models. |
| Personal live quote in the app | Broker API or a licensed vendor API | Verify the broker/vendor terms allow the specific app, retention and calculations. The MCP’s delay and terms make it unsuitable as the automated signal feed. |
| Exchange announcements and financial results | Exchange corporate-filings portals/RSS where permitted, or the licensed corporate-data feed | Store announcement and retrieval timestamps; confirm historical access and reuse rights. The paid NSE corporate-data page lists an EOD announcement product at ₹500,000/year, so investigate lower-cost permitted alternatives before budgeting. |
| BSE coverage | BSE data/filings feed or licensed vendor | NSE MCP is NSE-only; use BSE data only after separate coverage and license review. |

The NSE Data Sharing & Usage Policy says subscriber agreements specify usage, transmission, handling and redistribution; algorithmic/non-display use has its own policy and fees, including derived values for internal analysis. The implementation must not infer reuse rights merely because an exchange page can be opened or data can be queried without an API key. Budget and source selection remain open decisions in Phase 0 of the roadmap.

## 3. Earnings Announcement Research and Proposed Strategy Tests

### 3.1 Separate two different strategies

**A. Pre-announcement earnings surprise / earnings nowcast**

Question: Using information available *before* the filing, can the system estimate the probability and magnitude that reported earnings will beat a clearly defined benchmark, and does the market underreact enough to cover costs?

Possible point-in-time features: same-quarter-prior-year and prior-quarter revenue/EPS/PAT/margin trends; analyst consensus snapshots if licensed and timestamped; management guidance and revisions; exchange disclosures and board-meeting schedule; prior earnings surprise and response; sector/market returns; known commodity, FX or rate exposures; operating metrics disclosed before the result; and price/volume run-up before the event. Every feature needs an availability timestamp. “The quarter ended” is not “the results were public.” Avoid current restated ratios and hindsight labels.

**B. Post-announcement reaction / drift**

Question: After a result is publicly available and the first executable price is observable, does the initial market reaction under- or over-react, conditional on the standardized earnings surprise, guidance/news, abnormal volume, price gap, liquidity and market/sector regime?

Measure the event’s exact exchange publication timestamp, whether it was during market hours or after close, the next tradable open, abnormal return relative to an appropriate market/sector benchmark, gap, abnormal turnover/volume, intraday range/realized volatility if licensed data exists, and subsequent CAR over fixed horizons such as 1, 2, 5, 10 and 21 trading sessions. “No activity” must be operationally defined (e.g. low abnormal turnover or muted absolute abnormal return relative to a pre-event distribution) and tested as one feature. It is not itself evidence of a pending move. A stale or illiquid quote, a release after close, a price already moved before release, or a concurrent announcement can all create a false “quiet result” setup.

Do not blend pre-event forecasts with post-event outcomes in one model. At each prediction cutoff, include only information then observable. Model actual response from the next valid tradable price, not from a calendar-day close that was unavailable at the signal time.

### 3.2 What the literature says—and does not say

| Evidence | Finding relevant to this project | Limitation / implication |
|---|---|---|
| Kundu & Banerjee (2021), 67 Indian large-cap firms, 33 quarters, 2010–2018 | Reports that revenue/core earnings were anticipated before announcements and that better-than-prior-period reporters had higher pre-announcement returns; post-announcement prices adjusted, with drops among non-performers. | It tests a defined historical large-cap sample and a particular earnings benchmark. This is a reason to test pre-event information and leakage/timing controls, not a current trading guarantee. |
| Sen (2009), actively traded BSE stocks, 2001–2006 | Reports post-earnings drift after controlling for common risk factors and transaction costs. | Older BSE sample; universe, data and cost structure differ from the current NSE market. |
| Gupta & Dhusia (2021), NSE listed firms | Reports a different conclusion, emphasizing efficiency around earnings and no excessive earnings-announcement returns in its sample. | The mixed results make sample period, sector, size, surprise definition and event-time methodology central research choices. |
| Fink (2021 review of PEAD literature) | Reviews evidence for drift and multiple proposed explanations, including risk, trading frictions and behavioral mechanisms. | Review spans markets; it does not establish an India-specific exploitable edge after current costs. |

This literature supports an **India-specific replication and extension**. It does not support assuming PEAD survives current transaction charges, market impact, disclosure timing and today’s participants.

### 3.3 Other strategy families to compare

These are research tracks ordered by fit with available daily data, not preset signals.

1. **Cross-sectional momentum / relative strength (weekly to monthly).** Rank liquid stocks on point-in-time residual momentum versus NIFTY and sector benchmarks, excluding or separately studying the most recent short-term reversal window. Compare monthly/weekly rebalance rules and market/sector regimes. Indian factor research finds momentum among tested anomalies, but each implementation needs current holdout testing.
2. **Value, profitability and investment quality (monthly to quarterly).** Test point-in-time valuation, profitability/quality, balance-sheet risk and investment/growth metrics. An Indian study using July 2001–June 2019 reports significant size, value, profitability, investment and momentum effects, with substantial risk-adjusted results for size and value. This is a long historical sample, not a guarantee of persistence or an endorsement of current fixed weights.
3. **Liquidity-conditioned momentum versus reversal.** A 2023 BSE study reports intermediate/long-term momentum overall, stronger short/intermediate/long-term momentum among the most liquid stocks, and short/intermediate reversals among the most illiquid portfolios that do not persist. Test liquidity conditioning explicitly and apply realistic turnover, spread, impact and capacity limits; do not generalize the effect to every stock.
4. **Dip-buying / mean reversion after a controlled drawdown.** Define a dip relative to the stock’s own volatility and market/sector residual return, and distinguish a pullback in an intact trend from a structural break, bad filing, liquidity shock or market-wide drawdown. Compare pure reversal, reversal-plus-quality, and pullback-in-uptrend variants against momentum and “do nothing” baselines. Use downside-tail risk and gap-through-stop assumptions.
5. **Post-result continuation versus reversal.** Test the earnings surprise and the *observed* response jointly. Compare reactions with similar surprise magnitude but different prior run-up, liquidity, market regime and surprise direction. Include competing hypotheses because a positive result can still be a negative surprise relative to expectations.
6. **Market breadth and regime filters.** Use advance/decline, constituent breadth above moving averages, sector leadership, India VIX and index trend only if the chosen licensed source and historical membership data support point-in-time calculations. Treat the filter as a candidate for out-of-sample uplift, not a hand-set “risk-on” oracle.
7. **Intraday order-flow / opening-gap research (defer).** Research would need licensed timestamped intraday bars at minimum and order-book/trade data for genuine order imbalance. A 2025 India study finds apparent order-imbalance strategy returns disappear after transaction costs. NSE MCP has no order book and 1–3 minute delay; do not build a scalp/short-horizon execution model on it.

### 3.4 Event-study design for the earnings track

For a result event `e` of stock `i`:

1. Build a versioned event record from official filing/announcement data: issuer identifiers, result period, announcement category, filing timestamp, retrieval timestamp, attached filing, correction/supersession links and source.
2. Resolve the event’s first tradable session and observation price from the exchange calendar. Pre-market, during-market and after-close filings have different first executable prices.
3. Define standardized unexpected earnings (SUE) using point-in-time consensus if available; otherwise define and validate an explicitly simpler seasonal/model forecast (for example, same quarter prior year). Do not call quarter-over-quarter growth “surprise” without adjusting for seasonality and expectations.
4. Estimate abnormal returns against NIFTY/sector/index risk factors using only a pre-event estimation window; report event-window CAR and post-event CAR at prespecified horizons. Use event-date/issuer clustering where appropriate and include delisted firms.
5. Test pre-event windows separately from post-event windows. A pre-event return association may reflect legitimate public predictors, anticipation, or leakage; the model must use only data timestamped as public by the cut-off and the write-up must not frame unexplained price movement as causation.
6. Compare positive/negative SUE, high/low magnitude, guidance tone, prior run-up, volume/volatility response, size/liquidity, sector, market regime and event-time bucket. Include placebo event dates, alternative benchmarks and sensitivity to outliers.
7. Convert the event study into a realistic strategy simulation only after documenting entry price/time, exit/holding rules, costs, slippage, price-band/auction restrictions, liquidity participation cap, corporate actions and missed/partial fills.

## 4. Current Project Audit: Improvements Needed

The following items should be resolved before implementation because they affect every reported result:

1. **Data rights and intended use:** Existing docs describe freely downloadable NSE data and automated ML signals. Add an explicit source entitlement matrix, with separate rights for viewing, storage, historical backtest, model training, derived signals, internal non-display calculations and redistribution. Current NSE MCP terms prohibit model training; do not select it for training.
2. **Forecast vs portfolio decision:** Model direction accuracy and Brier score do not prove net profitability. Include predicted net return/utility, costs, turnover, drawdown, tail loss, capacity and a no-trade baseline in acceptance criteria. Keep forecaster, signal mapping and any user portfolio sizing separate.
3. **Fixed signal weights conflict with “no hand weighting.”** The research currently writes a composite score with hand-assigned `w1...w4` and fixed percentile thresholds. Estimate candidate mappings only on training/inner folds and select using outer OOS performance, calibration, stability and cost-aware portfolio metrics; otherwise expose forecasts without a BUY/SELL label.
4. **Stop-loss specification is internally contradictory.** The `max(ATR_stop, quantile_stop)` formula chooses the higher/tighter stop if both are below current price, while nearby prose calls for the lower/more conservative stop. Settle the intended loss boundary, minimum ATR buffer, gap-through-stop treatment and invalid-input behavior before implementing.
5. **Purging/embargo settings vary by doc and scaffold.** `walk_forward.py` defaults to a 5-day purge/10-day embargo, while research varies by horizon (1/5/21/63-day labels). Use the trading-session calendar and horizon/label overlap to derive one canonical implementation; document whether the final 12-month holdout is untouched.
6. **Price adjustment and point-in-time corporate actions:** MCP tool output is raw and explicitly warns about split/bonus distortions. Store raw prices and versioned corporate-action factors; validate total-return/adjusted targets without back-adjustment leakage.
7. **Survivorship and historical membership:** A current NIFTY list is not the past investable universe. Build an ISIN history including delisted securities and historical index/sector membership, or label results as a current-universe study and limit claims.
8. **Probability/confidence calibration:** A weighted “confidence score” is not probability of profit. Use out-of-fold probability calibration, interval coverage, reliability diagrams/Brier scores by horizon/regime, and clear uncertainty labels. Remove floor/ceiling percentages unless their meaning and calibration are validated.
9. **Quarter results data model:** Existing `fundamental_snapshots` has period end and filing timestamp but does not represent event corrections, announcement categories, publication vs retrieval time, event session, or version history. Add these before building PEAD.
10. **Current model choices are proposals, not evidence.** LightGBM/MAPIE selection and thresholds require validation against simple baselines, cost-aware strategy performance and current regimes. No hard-coded success target such as 53% accuracy should stand alone as a release criterion.

## 5. Research Decision Matrix

| Rank | Hypothesis / workstream | Horizon | Data needed | Decision |
|---:|---|---|---|---|
| 0 | Permitted data sources and reproducible historical bars | All | Licensed OHLCV, actions, universe, timestamps | Blocker; resolve before model training |
| 1 | Market/sector residual momentum and trend-conditioned dips | 5–63 sessions | Point-in-time daily OHLCV, historical universe, liquidity, benchmark/sector indices | First broad strategy research after data baseline |
| 2 | Earnings surprise forecast and post-result reaction/PEAD | Pre-event, next session to 21 sessions | Exchange result timestamps/files, point-in-time financials, expectations or model forecast, price/volume | Parallel event-study track after event dataset exists |
| 3 | Quality/value/low-risk cross-sectional rankings | 21–63 sessions | Point-in-time filings and prices | Add after point-in-time fundamental source works |
| 4 | Daily signal engine, risk levels, probability calibration | 1–63 sessions | Validated out-of-fold forecasts and cost estimates | Do after at least one strategy has evidence |
| 5 | Intraday order flow and execution | Minutes-hours | Licensed intraday/order book, precise costs and fills | Defer; current MCP insufficient |

## 6. Primary Sources and Further Reading

### NSE / SEBI / source documentation

- [NSE MCP product page and terms](https://www.nseindia.com/nse-mcp) — servers, stated coverage, delays, no order book, unadjusted history warning and current MCP restrictions.
- [NSE Data Sharing & Usage Policy](https://www.nseindia.com/static/market-data/nse-data-policy) — market-data subscriptions, permitted use, handling, redistribution and agreements.
- [NSE non-display usage policy](https://nsearchives.nseindia.com/web/sites/default/files/inline-files/Non_Display_Policy.pdf) — definition of automated data use supporting trading decisions.
- [NSE paid EOD/historical data](https://betanseapi.nseindia.com/static/market-data/eod-historical-data-subscription) and [paid corporate data](https://betanseapi.nseindia.com/static/market-data/corporate-data-subscription) — official subscription routes and listed corporate EOD-announcement product.
- [NSE corporate filings](https://www.nseindia.com/companies-listing/corporate-filings-application?id=allAnnouncements) — announcements, board meetings, financial results, corporate actions and shareholding patterns. Exchange page warns uploaded content is company-supplied and not verified by the exchange.
- [SEBI study: analysis of intraday trading by individuals in equity cash](https://www.sebi.gov.in/reports-and-statistics/research/jul-2024/study-analysis-of-intraday-trading-by-individuals-in-equity-cash-segment_84946.html) — FY19/FY22/FY23 individual-trader outcomes and costs.

### Strategy and event research

- [Kundu & Banerjee (2021), Predictability of earnings and its impact on stock returns: Evidence from India](https://doi.org/10.1080/23322039.2021.1898112) — 67 large-cap Indian stocks, 2010–2018; pre-announcement earnings predictability and return behaviour.
- [Sen (2009), Earnings surprise and sophisticated investor preferences in India](https://doi.org/10.1016/j.jcae.2008.11.001) — BSE evidence on earnings surprise and drift, 2001–2006.
- [Gupta & Dhusia (2021), Post-Earning Announcement Drift and Value-Glamour Anomalies in NSE Listed Firms](https://doi.org/10.13164/trends.2021.37.27) — an alternate Indian sample/conclusion, useful for replication and evidence of mixed findings.
- [Fink (2021), A review of the Post-Earnings-Announcement Drift](https://doi.org/10.1016/j.jbef.2020.100446) — review of mechanisms and mixed international literature.
- [Pandey (2020), Equity Market Anomalies, VIX and Asset Pricing: Trading Strategies for India](https://doi.org/10.1177/0019466220951978) — India factor evidence for July 2001–June 2019.
- [Chui et al. (2023), Momentum, reversals and liquidity: Indian evidence](https://doi.org/10.1016/j.pacfin.2023.102193) — BSE sample 2000–2021; liquid-stock momentum and non-persistent reversals among illiquid portfolios.
- [Jindal, Bajpai & Yadav (2025), Order Imbalances and Market Efficiency: Evidence from a Pure Order-Driven Market](https://www.ubplj.org/index.php/jpm/article/view/2235) — NSE hourly order imbalance and transaction-cost sensitivity.

### Third-party MCP

- [Live-NSE-BSE-MCP README](https://github.com/GirishKumarDV/Live-NSE-BSE-MCP) and [server implementation](https://github.com/GirishKumarDV/Live-NSE-BSE-MCP/blob/main/ise_mcp/server.py) — community MCP is an IndianAPI client; validate provider rights, freshness, functionality and data quality independently.

---
*Research note, not investment advice. All strategies require independent out-of-sample replication and permitted data rights before use.*
