# 05 — ML Model Architecture: Comparison and RL Assessment
*NSE/BSE Indian equities prediction dashboard · Horizons: 1D, 1W (5T), 1M (21T), 3M (63T) · Sep 2026*

## A. Model Comparison

### Rating Legend
- STRONG: Consistently outperforms baselines in peer-reviewed equity literature
- MODERATE: Competitive but requires careful tuning; results mixed
- WEAK: Theoretically applicable but underperforms in practice at this horizon
- NOT_REC: High complexity/data cost for marginal gain

### Comparison Table

| Model | 1D | 1W | 1M | 3M | Notes |
|---|---|---|---|---|---|
| Naive (yesterday return) | WEAK | WEAK | NOT_REC | NOT_REC | Mean reversion dominates beyond 1D; required as benchmark floor |
| Historical mean | WEAK | WEAK | WEAK | WEAK | Required as minimum baseline; almost always beaten by features |
| Linear Regression (Ridge/Lasso) | MODERATE | MODERATE | MODERATE | MODERATE | Strong interpretability; Lasso does implicit feature selection; good Phase 1 baseline |
| Random Forest | MODERATE | MODERATE | MODERATE | WEAK | Handles non-linearity; slow for large feature sets; poor OOD at 3M |
| XGBoost / LightGBM / CatBoost | STRONG | STRONG | MODERATE | MODERATE | Best tabular model class; LightGBM fastest; CatBoost handles categoricals natively. PHASE 1 PRIMARY. |
| LSTM | MODERATE | MODERATE | WEAK | WEAK | Prone to overfitting on small per-stock histories; beaten by GBMs on tabular features |
| Temporal CNN (WaveNet-style) | MODERATE | MODERATE | MODERATE | WEAK | Faster than LSTM; good for price-only sequences |
| Transformer - TFT | MODERATE | STRONG | STRONG | MODERATE | Best for multi-horizon + covariate integration; data-hungry; needs pooled cross-stock training |
| Transformer - PatchTST | MODERATE | STRONG | STRONG | STRONG | SOTA long-horizon accuracy; requires 3+ years per stock or cross-stock pretraining |
| Ensemble (stacking) | STRONG | STRONG | STRONG | MODERATE | GBM + linear meta-learner robust; diversification reduces overfitting; Phase 2 upgrade |
| NGBoost | MODERATE | STRONG | STRONG | MODERATE | Outputs full distribution; slower than GBMs; excellent for quantile targets |
| MAPIE / CQR (conformal) | STRONG | STRONG | STRONG | STRONG | Conformal prediction wrapper; model-agnostic; guaranteed coverage; RECOMMENDED for quantile targets |
| Reinforcement Learning | NOT_REC | NOT_REC | NOT_REC | NOT_REC | See Section C for full RL assessment |
| Contextual Bandits | WEAK | NOT_REC | NOT_REC | NOT_REC | Useful for signal weighting, not raw price prediction |

### Phase 1 Recommendation

`
Primary model:     LightGBM (per-horizon, pooled cross-stock where possible)
Quantile outputs:  LightGBM quantile regression + MAPIE conformalization
Baseline:          Ridge regression + historical mean
Benchmark:         Beat naive + historical mean on direction accuracy AND Brier score
Defer to Phase 2:  TFT, PatchTST, Ensemble stacking, NGBoost
`

## B. RL Assessment

### B.1 What Problem Would RL Solve?

| Capability | Supervised Learning | RL |
|---|---|---|
| Predict forward return | YES - direct | YES - via reward shaping |
| Optimize non-differentiable objective (Sharpe, drawdown) | NO - surrogate loss only | YES - native |
| Sequential portfolio rebalancing | NO - static predictions | YES - MDP framework |
| Adapt to market regime shifts | NO - static model | YES - online policy updates |

Conclusion: RL solves a PORTFOLIO OPTIMIZATION / TRADING EXECUTION problem, not a prediction problem. For a prediction dashboard outputting signals (not orders), supervised learning is sufficient.

### B.2 Data Volume Requirements

| RL Algorithm | Min Episodes for Convergence | Equivalent Stock Data |
|---|---|---|
| DQN (discrete actions) | 10,000-100,000 | ~40-400 years of daily data per stock |
| PPO / A2C | 50,000-500,000 | Requires simulation/synthetic augmentation |
| TD3 / SAC (continuous) | 100,000+ | Not feasible with real NSE daily data alone |

NSE Reality: A liquid stock has ~5,000-7,000 trading sessions over 20 years. This is 10-50x below minimum RL requirements.

### B.3 Sample Efficiency Concerns (India)

- Per-stock data: ~5,000 sessions (20 years NSE) - far below RL requirements
- Cross-stock pooling: Possible but introduces non-stationarity from cross-sectional mixing
- Regime shifts: 2008, 2013 taper tantrum, 2020 COVID, 2022 rate cycle - RL agents trained on one regime fail in another
- Reward sparsity: Daily Sharpe rewards are extremely noisy; RL agents chase noise
- Transaction costs: Indian STT + brokerage + slippage erodes RL-discovered edges rapidly

### B.4 Validation Challenges

| Challenge | Impact |
|---|---|
| No standard out-of-sample benchmark | Hard to compare RL agents fairly |
| Overfitting to historical reward path | Backtest looks good; forward test fails |
| Requires MDP environment matching real execution | Slippage modeling is critical and hard |
| Hyperparameter sensitivity | PPO clip ratio, entropy coefficient change final policy significantly |
| Cannot use purged K-fold | RL is sequential; must use strict temporal holdout |

### B.5 VERDICT: NO for Phase 1

RL is NOT recommended for Phase 1.

Reasoning:
1. System goal is a PREDICTION DASHBOARD, not an autonomous trader - RL solves the wrong problem
2. NSE per-stock data is 10-50x below RL convergence thresholds
3. Validation is significantly harder; adds months of engineering
4. LightGBM + MAPIE delivers directional signals with calibrated uncertainty - sufficient for Phase 1
5. Contextual bandits may be revisited in Phase 2 for signal weighting across models (not price prediction)

Reconsider RL in Phase 3 if:
(a) Live trading execution is added
(b) A simulation environment with realistic market impact is built
(c) Cross-stock pooled representation learning provides sufficient state space coverage

## Sources
- Lopez de Prado, Advances in Financial Machine Learning (2018) - purged CV, leakage
- Nie et al., PatchTST (ICLR 2023)
- Lim et al., Temporal Fusion Transformers (IJF 2021)
- Duan et al., NGBoost (ICML 2020)
- Angelopoulos & Bates, Conformal Prediction (2022)
- FinRL-Meta framework (2022-2024) - RL for finance sample efficiency benchmarks
