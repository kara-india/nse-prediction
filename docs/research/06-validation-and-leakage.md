# 06 — Validation, Leakage and Survivorship Bias
*NSE/BSE Indian equities prediction dashboard · Sep 2026*
*Framework basis: Lopez de Prado (2018), Conformal Prediction literature*

## A. Walk-Forward Validation Scheme

### A.1 Expanding vs Rolling Window

| Property | Expanding Window | Rolling Window |
|---|---|---|
| Uses all historical data | YES | NO - fixed size |
| Stability in early periods | LOW - small train set | HIGH - consistent train size |
| Regime change sensitivity | LOW - old data dilutes recent signal | HIGH - drops stale data |
| Recommended for NSE? | YES - Default | Use only if regime change detected |

Recommendation: Expanding window as default. Add min_train_years=3 guard. Implement rolling as sensitivity check.

### A.2 Concrete Design

`
Total data:        2004-2026 (NSE full history)
Minimum train:     3 years (756 sessions)
Validation fold:   6 months (126 sessions)
Step size:         3 months (63 sessions)
Test (holdout):    Last 12 months - NEVER touched during development

Walk-forward folds (expanding):
  Fold 1:  Train 2004-2009 | Val 2010 H1 | Purge 1M | Embargo 5D
  Fold 2:  Train 2004-2010 | Val 2010 H2 | Purge 1M | Embargo 5D
  ...
  Fold N:  Train 2004-2024 | Val 2025 H1 | Test = 2025 H2-2026
`

### A.3 Purge Period by Horizon

The purge removes training samples whose label window overlaps with any test sample's feature window.

| Horizon | Label Window | Purge Period | Rationale |
|---|---|---|---|
| 1D (1T) | 1 session | 2 sessions | Minimal overlap; extra safety margin |
| 1W (5T) | 5 sessions | 5 sessions | Full label window |
| 1M (21T) | 21 sessions | 21 sessions | Full label window |
| 3M (63T) | 63 sessions | 63 sessions | Full label window |

Implementation: Use mlfinlab.cross_validation.PurgedKFold or equivalent.

### A.4 Embargo Period

The embargo removes training samples after the test fold ends (residual autocorrelation leakage).

| Horizon | Embargo (sessions) | Rationale |
|---|---|---|
| 1D | 5T (1 week) | Autocorrelation decays within days |
| 1W | 10T (2 weeks) | Rolling feature overlap |
| 1M | 21T (1 month) | Fundamental release cycle |
| 3M | 42T (2 months) | Macro data revisions lag by 1-2M |

### A.5 Hyperparameter Tuning Without Test Leakage

`
Strategy: Nested cross-validation
  Outer loop:  Walk-forward folds (evaluation)
  Inner loop:  Earlier portion of training fold split into val for HP search

  Tools: Optuna with TimeSeriesSplit (inner), scikit-learn Pipeline

  Rule: Hyperparameters selected ONLY using inner val scores.
        Outer fold = unbiased performance estimate.
        FINAL test holdout = touched ONCE at project end.

Anti-pattern: Running grid search across ALL walk-forward folds
  then selecting best HP - this leaks test-period information.
`

### A.6 Point-in-Time Feature Construction

| Feature Type | PIT Rule | Implementation |
|---|---|---|
| Rolling technical indicators | Use only rows <= t | df.shift(1) before rolling |
| Fundamental ratios | Use filing date, not period end | Join on announcement date |
| Macro data (GDP, CPI) | Use release date, not reference period | RBI/MOSPI release calendar |
| News sentiment | Use publication timestamp, not event date | Timestamp filter |
| Normalization (StandardScaler) | Fit on train fold only | Inside Pipeline.fit() - NEVER on full dataset |

## B. Leakage Sources - Complete Enumeration

| # | Leakage Source | Severity | Mitigation |
|---|---|---|---|
| 1 | Future news in feature window | CRITICAL | Strict timestamp filtering; use only news published <= t-1 |
| 2 | Restated fundamentals | CRITICAL | Use point-in-time fundamental database; snapshot at filing date |
| 3 | Survivorship bias | CRITICAL | Include delisted stocks in universe (see Section C) |
| 4 | Corporate actions not yet known | HIGH | Join splits/dividends on ex-date, not announcement date |
| 5 | Global feature normalization across train/test boundary | HIGH | Fit scaler inside cross-val Pipeline; never on full dataset |
| 6 | Target overlap between adjacent samples | HIGH | Apply purge period; use non-overlapping label windows where possible |
| 7 | Feature scaling fitted on full dataset | HIGH | Same as #5; common scikit-learn mistake - always use Pipeline |
| 8 | Hyperparameter selection on test period | HIGH | Nested CV; treat final holdout as sacred; evaluate once only |
| 9 | Index constituency look-ahead | MEDIUM | Use historical index compositions, not current NIFTY 500 membership |
| 10 | Volume/liquidity filters applied retroactively | MEDIUM | Apply liquidity screen using data available at time t |

## C. Survivorship Bias

### C.1 Significance for Indian Markets

| Metric | Estimate | Source |
|---|---|---|
| NSE listed companies (2024) | ~2,200 | NSE |
| Estimated delisted 2000-2024 | ~1,500-2,000 | UNRESOLVED - no official consolidated count |
| Annual delisting rate (BSE) | ~3-5% of listed count | Qualitative estimate from Bhavcopy analysis |
| Return inflation from survivorship | +2-5% annualized for small-cap strategies | UNRESOLVED - India-specific studies scarce |

WARNING: Survivorship bias is MOST SEVERE for small/mid-cap models. Large-cap (NIFTY 50) models have lower exposure.

### C.2 Data Sources for Delisted Companies

| Source | Coverage | Format | Cost |
|---|---|---|---|
| NSE Bhavcopy (EOD archives) | 1994-present, all listed | CSV per day | Free |
| BSE Bhavcopy | Similar | CSV per day | Free |
| CMIE Prowess | Fundamentals + price, delisted included | API/export | Paid (Rs 50K-2L/yr) |
| BacktestIndia | Price + corp actions, survivorship-free | API | Paid (Rs 10-30K/yr) |
| EODHD | Some Indian delisted | API | Paid |
| Zerodha / Upstox | Active instruments only | REST | NOT suitable |

### C.3 Minimum Viable Survivorship-Free Pipeline

`python
# Pseudocode
all_isins = load_from_bhavcopy_archive()       # includes delisted
active_isins = load_current_nse_instruments()  # subset only

# Training universe = ALL ISINs active during training window
# NOT the current active list
train_universe = {isin for isin in all_isins
                  if isin.first_seen <= fold_start
                  and isin.last_seen >= fold_start}
`

Concrete steps:
1. Download all historical NSE Bhavcopy files (1994-present, ~32 years)
2. Build master security table with permanent IDs (ISIN - NOT ticker; tickers are reused)
3. Load all ISINs ever seen, including those absent from current instrument list
4. Join corporate action history from NSE archives
5. Adjust prices for splits/bonuses on ex-date

## D. Feature Importance - No Hand-Weighting

### D.1 Methods

| Method | When to Use | Strength | Weakness |
|---|---|---|---|
| SHAP (TreeSHAP) | Post-training explanation | Directional effect; interaction-aware | Correlated features share importance |
| Permutation Importance | Model-agnostic validation | Honest drop-in-performance measure | Slow; correlation issue |
| Ablation Testing | Feature group evaluation | Directly measures incremental value | Computationally expensive |
| Recursive Feature Elimination | Feature pruning | Systematic | Can eliminate correlated-but-useful pairs |

Recommended workflow: SHAP first -> confirm with Permutation Importance -> ablation for feature GROUPS.

### D.2 Incremental Value Testing Protocol

`
Stage 0: Price-only features (OHLCV, log-returns)
         -> Baseline: direction accuracy, IC (Information Coefficient)

Stage 1: + Technical indicators (RSI, MACD, Bollinger, ATR, momentum)
         -> Delta IC vs Stage 0

Stage 2: + Fundamentals (P/E, P/B, ROE, debt/equity, earnings growth)
         -> Delta IC vs Stage 1

Stage 3: + News/sentiment (headline sentiment score, earnings surprise)
         -> Delta IC vs Stage 2

Stage 4: + Macro (RBI repo rate, INR/USD, FII flows, global VIX, US yields)
         -> Delta IC vs Stage 3
`

Metric: Information Coefficient (Spearman correlation of predicted vs realized return) measured on VALIDATION FOLDS ONLY, never on test holdout.

### D.3 Feature Group Inclusion Decision Rule

`
Include feature group G if:
  1. Delta IC (val) > 0.005 (half a bps of rank correlation) AND
  2. Delta IC is consistent across >= 70% of walk-forward folds AND
  3. Feature construction is implementable without future data (PIT verified) AND
  4. Permutation importance confirms > 0 contribution on held-out val fold
`

### D.4 Avoiding Feature Selection Leakage

| Anti-pattern | Fix |
|---|---|
| Running SHAP on full dataset then filtering | Run SHAP only on validation set within each walk-forward fold |
| Selecting features based on test-period correlation | Feature selection must be inside outer CV loop |
| Reporting best-fold SHAP as overall importance | Average SHAP magnitude across all walk-forward folds |

## Sources
- Lopez de Prado, Advances in Financial Machine Learning (2018) - Ch. 7 (cross-validation), Ch. 4 (labeling)
- Angelopoulos & Bates, A Gentle Introduction to Conformal Prediction (2022)
- NSE EOD Bhavcopy Archive: nsearchives.nseindia.com
- mlfinlab PurgedKFold (Hudson & Thames)
- MAPIE library documentation (conformalized quantile regression)
