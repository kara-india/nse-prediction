# Global Market Regime and Overnight-Cue Specification

**Project:** NSE Prediction (NSE-first; BSE later)  
**Status:** Research specification — not implemented, not a trading signal  
**Created:** 2026-11-23  
**Purpose:** Define how global risk sentiment, overnight news, GIFT Nifty, Asian markets and Indian market internals should condition stock-level forecasts and recommendations.

## 1. Design decision

Market direction must be an explicit context layer in the NSE engine. It must not be a fixed bullish/bearish switch and must not be represented as arbitrary hand-assigned score points.

The engine should distinguish:

1. **Opening-gap forecast:** probability and distribution of the Nifty opening gap relative to the previous NSE cash close.
2. **Intraday market-regime estimate:** market direction and risk state after observable NSE session data becomes available.
3. **Close-to-close forecast:** probability/distribution for the Nifty close relative to the previous cash close.
4. **Stock-specific conditional forecast:** expected stock return after accounting for market, sector, event and stock-specific information.

A positive global cue can improve the opening estimate without proving that the full Indian session will close positive. A stock-specific catalyst can outperform the index even during a weak market; a positive market can also fail to lift a stock with negative relative strength.

The engine must produce separate calibrated outputs for the relevant horizons. Do not label an opening-gap forecast as a full-session forecast.

## 2. Feature groups to research and capture

Every observation must include provider/source, source timestamp, retrieval timestamp, market timezone, session status, freshness in seconds, entitlement status and data-quality flags.

### A. United States / overnight risk

- S&P 500 cash close and session return.
- S&P 500 futures return, level and timestamp at Indian pre-market cutoffs.
- Nasdaq Composite / Nasdaq 100 cash close and futures return.
- Dow Jones and Russell 2000 cash/futures returns.
- CBOE VIX close, change, percentile and (where licensed) term structure.
- US 10-year Treasury yield and change; relevant real-yield measure if available.
- DXY / broad US dollar index.
- US macro releases, Fed communications, rate expectations and high-impact scheduled events.
- Material US company/sector events (especially semiconductors, cloud, AI infrastructure, banks and energy) only where the transmission channel to Indian sectors is documented.

Do not conflate US cash-index returns with futures returns. Use the last completed cash session for cash features and timestamped futures observations for futures features.

### B. Asian market risk and confirmation

- Nikkei 225 and TOPIX.
- KOSPI and KOSDAQ.
- Taiwan Weighted Index.
- Hang Seng and Hang Seng Tech.
- Shanghai Composite / CSI 300.
- ASX 200 and other regional indices only if they add validated explanatory value.

Store each market's last official close and current session return separately. Include local holidays, opening status, currency and timestamp. Before the Asian market opens, the prior close is a lagged feature, not a current-session move.

### C. Commodities and currency

- Brent and WTI crude: level, percentage change, volatility and timestamp.
- USD/INR spot and, where permitted, relevant offshore/forward proxy.
- Gold and copper; add other commodities only for a documented sector exposure.
- Relevant freight, gas, coal or agricultural prices only where company/sector exposure is explicit.

Do not assume crude moving down is uniformly positive: it can help oil importers while hurting upstream producers. Interact commodity moves with company/sector exposure.

### D. Indian index and derivatives context

- Nifty 50 cash previous close, returns over 1/5/20 sessions and key realised volatility.
- GIFT Nifty futures: contract/expiry, last price, settlement/previous close, absolute and percentage futures change, basis versus Nifty cash, day range, volume/open interest where authorised, timestamp and session.
- Nifty futures basis and roll/expiry effects.
- Bank Nifty, Nifty Financial Services and relevant sector index returns/futures.
- India VIX level, change and historical percentile.
- Nifty/sector breadth: advancers/decliners, percentage above key averages, new highs/lows and breadth thrust measures.
- FII/FPI and DII cash flows, with the actual reporting date and whether values are provisional/final.
- NSE pre-open indications once the pre-open session begins.

Do not use a GIFT Nifty value without checking its official timestamp, contract expiry, session and cash/futures basis. A futures premium/discount is not the same as the contract's daily return. Reject stale or impossible weekend timestamps.

### E. Indian market confirmation after 09:15

Once authorised intraday data is available, add:
- Opening gap relative to previous cash close.
- First 5/15/30-minute range and opening-range expansion.
- Nifty and sector index VWAP distance/slope.
- Advance/decline and sector breadth changes.
- Index and constituent volume relative to time-of-day seasonal norms.
- Bank/IT/energy/financial sector leadership and dispersion.
- India VIX intraday movement.
- Gap fill/hold behaviour and price acceptance above/below opening range.
- Intraday market/sector beta and stock residual return.

Do not calculate VWAP, opening range, intraday relative volume or current-session breadth from pre-market data. Their availability timestamp must follow the actual session.

### F. News and event context

Classify and timestamp:
- Monetary policy and inflation releases.
- Geopolitical, sanctions, trade and export-control developments.
- Large technology/AI investment funding and accounting/credit concerns.
- Sovereign or regulator market-stabilisation measures.
- Material commodity supply events.
- Large corporate results or guidance that affect Indian sector peers.

News records require publication time, first-seen/retrieval time, publisher, entity mapping, event class, novelty, estimated relevance to India, sentiment/uncertainty, corroboration count and source-quality status.

A headline's sentiment is not itself a causal stock-price feature. Store the facts and evaluate predictive value empirically. Separate confirmed announcements from investigation/allegation, rumour, proposal and policy preparation.

## 3. Model outputs and decision flow

Implement these as separate model targets before combining them:

| Model | Target | Cutoff |
|---|---|---|
| Opening gap | Nifty open vs previous cash close: return distribution and up/flat/down probability | Fixed pre-open cutoff, e.g. 08:45/09:00 IST, with each input timestamped |
| Intraday regime | Nifty returns over defined forward windows (e.g. next 30m, 60m, session close) and risk regime | Recomputed only at permitted intraday checkpoints |
| Session close | Nifty close-to-close return distribution and positive-close probability | Pre-open and optionally separate intraday forecast origins |
| Sector regime | Sector relative return and risk/dispersion | Same cutoffs as the relevant model |
| Stock conditional model | Stock excess return vs market/sector for stated horizon | Uses the market regime/features known at the stock prediction cutoff |

Output at minimum:
- Regime label: risk_on / balanced / risk_off / transition / unknown (labels calibrated and operationally defined).
- Probability of positive market return for an explicit horizon.
- Expected return and calibrated quantile interval.
- Market volatility/risk estimate.
- Confidence/calibration metadata and training sample size.
- Source freshness and missing-feature warnings.
- Dominant observable contributors, with no causal claims unsupported by evidence.

## 4. How market context affects stock recommendations

Treat market context as:
1. A predictor in the stock's conditional return model.
2. A conditioning variable for validation and calibration (bull/bear/high-volatility/transition).
3. A risk/exposure constraint input.
4. An explanation item in the recommendation UI.

Do not simply add a fixed number of bullish points to every stock when US futures are green. Avoid a single arbitrary weighted score. Estimate interactions such as:
- Stock beta × expected market return.
- Sector return × stock sector exposure.
- GIFT basis / Nifty opening gap × stock gap behaviour.
- Market breadth × stock relative strength.
- India VIX × volatility forecast / stop distance.
- Crude/FX changes × documented company/sector exposure.
- News novelty × pre-event run-up and actual filing/event time.

Use training-fold-only feature selection and nested chronological validation. SHAP/permutation/ablation can explain incremental effects, but none should be selected on the final holdout.

A weak-market regime should not automatically suppress every positive idiosyncratic setup. It should affect the required expected edge, position risk/exposure and probability calibration only where the historical evidence supports that relationship.

## 5. Decision protocol for the live session

A. **Pre-open snapshot:** create a frozen market-context snapshot with explicit cutoff and feature freshness. Do not combine asynchronous quotes as though they were simultaneous.

B. **At NSE pre-open:** ingest pre-open indications if the provider terms allow it. Keep pre-open indicative price separate from continuous-market execution prices.

C. **After market open:** wait until each intraday feature's defined availability window. Recompute breadth, VWAP, opening range and sector leadership only when observable.

D. **During session:** update risk regime at scheduled checkpoints only if reliable data is available; use idempotent jobs and persist each snapshot.

E. **Post-close:** resolve the forecasts whose horizons have matured, calculate benchmark-relative and net-of-cost results where execution assumptions are defined, and store immutable outcomes.

If the data is stale, contradictory, incomplete or not entitled for its intended use, set the affected feature to missing with a reason. Do not substitute a stale quote silently. If the market model is not validated, display context as descriptive information and do not use it to create an actionable recommendation.

## 6. Validation protocol

- Define each prediction origin and target in Indian trading sessions, not calendar-day offsets.
- Use point-in-time US futures/FX/commodity snapshots, Indian exchange timestamps and market-session calendars.
- Avoid using US cash close when it was not yet observable at the Indian prediction cutoff; distinguish last close, overnight futures and later revised values.
- Create chronological walk-forward tests and an untouched final holdout.
- Purge/embargo by target horizon and overlapping label interval.
- Compare to naive baselines (previous close, unconditional up frequency, overnight gap-only).
- Evaluate directional Brier/log loss, calibration, MAE/RMSE, quantile coverage and economic value.
- Measure incremental value from US cues, Asia cues, GIFT basis, VIX, breadth, flows and news via ablation.
- Report metrics by volatility regime, trend regime, weekday/holiday gap, sector and market-cap/liquidity bucket.
- Test event/holiday weeks separately. Do not extrapolate a single post-crash relief rally.
- For stock strategies, report beta-adjusted/sector-adjusted returns and net-of-cost portfolio outcomes, not only index direction accuracy.
- Account for multiple testing and feature/strategy selection.
- Preserve the source, timestamp, retrieval timestamp, raw value and transformations for each input.

## 7. Freshness and conflict rules

- Use exchange/primary source data where available; use reputable secondary news only with source and timestamp.
- Every source has a maximum-age policy by data type. A quote that is stale for a minute may be acceptable for a daily macro series but unacceptable for an opening signal.
- Validate futures contract, expiry, session and basis before using GIFT Nifty.
- Validate holidays per market (NSE, NSE IX, US, Japan, Korea, Taiwan, Hong Kong); do not assume all exchanges share a calendar.
- When sources disagree, retain both records and flag the conflict. Prefer a timestamped primary exchange quote for the actual market value.
- Do not let a search snippet or cached webpage masquerade as a live quote.
- Use Asia/Kolkata for Indian decision cutoffs and UTC for canonical storage, preserving source timezone.

## 8. 2026-11-23 pre-market case study

A separately dated, source-timestamped case study is stored at [../market-briefs/2026-11-23-pre-market.md](../market-briefs/2026-11-23-pre-market.md). It is an example of how to record a mixed global risk picture; it must not be copied as a fixed rule or used as a training label.

## 9. Implementation order

1. Add typed contracts and fixture snapshots only after Phase 0 confirms the relevant source rights.
2. Build a descriptive market-context panel before an actionable market-direction model.
3. Establish timestamp/freshness tests, holiday tests, GIFT basis tests and missing-data behaviour.
4. Run standalone market-model baselines.
5. Add only those feature groups with repeatable chronological OOS uplift.
6. Integrate market context into stock-conditional forecasts and risk controls after the above gates.
7. Show model horizon, cutoff, timestamps and uncertainty in the UI.
8. Keep this separate from RL/HTCN until their own research and validation gates pass.

## Sources reviewed for the dated case study

- NSE International Exchange market dashboard: https://www.nseix.com/
- NSE IX press release on 23.5-hour market operations: https://www.nseix.com/web/pressrelease/2026-11/PR_CC_03112026_20261103101702.pdf
- NSE IX circular on revised 23.5-hour timing effective November 2: https://www.nseix.com/api/content/circulars/NSEIFSC_TRADE_2794.pdf
- Reuters, US correction and market breadth: https://www.reuters.com/business/finance/correction-or-deeper-reckoning-investors-seek-signs-us-stock-selling-will-abate-2026-11-22/
- Reuters, Nvidia SEC accounting inquiry: https://www.reuters.com/world/us-secs-nvidia-probe-is-examining-potential-accounting-issues-sources-say-2026-11-20/
- Oracle official statement, November 20: https://www.oracle.com/news/announcement/oracle-statement-2026-11-20/
- Reuters via Fidelity, South Korea stabilisation preparations: https://www.fidelity.com/news/article/international/202611220613RTRSNEWSCOMBINED_L2N47301B_1
- Business Standard, November 20 Indian market close: https://www.business-standard.com/markets/news/stock-market-live-november-20-nse-bse-sensex-today-nifty50-gift-nifty-crude-oil-prices-126112000118_1.html
- HDFC Sky, November 20 Friday market context and Asian market closes: https://hdfcsky.com/news/gift-nifty-signals-flat-open-for-sensex-nifty-on-monday-2
- Downstox GIFT Nifty page, used for explanatory basis context and then cross-checked with NSE IX: https://downstox.com/gift-nifty
- NSE 2026 trading holiday circular: https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf

