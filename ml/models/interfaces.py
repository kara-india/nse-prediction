"""ML model interfaces. No implementations here."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum


class Horizon(str, Enum):
    ONE_DAY = "1D"
    ONE_WEEK = "1W"
    ONE_MONTH = "1M"
    THREE_MONTHS = "3M"


@dataclass
class PredictionOutput:
    """Output from a forecasting model."""
    symbol: str
    prediction_date: str  # YYYY-MM-DD
    target_date: str  # YYYY-MM-DD
    horizon: Horizon
    # Point estimates
    expected_log_return: float
    expected_excess_return: float  # vs NIFTY
    # Probabilistic
    prob_positive: float  # P(return > 0)
    prob_exceed_5pct: float  # P(return > 5%)
    # Quantile estimates
    q10: float  # 10th percentile return
    q25: float
    q50: float  # median
    q75: float
    q90: float  # 90th percentile return
    # Uncertainty
    expected_volatility: float
    ensemble_std: float  # disagreement across ensemble members
    # Metadata
    model_version: str
    features_used: List[str]


@dataclass
class FeatureVector:
    """All features for one (symbol, date) observation."""
    symbol: str
    date: str  # YYYY-MM-DD
    # Technical features
    ret1d: Optional[float] = None
    ret5d: Optional[float] = None
    ret21d: Optional[float] = None
    ret63d: Optional[float] = None
    rsi14: Optional[float] = None
    macd_signal: Optional[float] = None
    bb_width: Optional[float] = None
    atr14_normalized: Optional[float] = None
    realized_vol20d: Optional[float] = None
    volume_ratio20d: Optional[float] = None
    alpha_vs_nifty5d: Optional[float] = None
    beta60d: Optional[float] = None
    dist_from_52w_high: Optional[float] = None
    # Macro features
    nifty50_ret1d: Optional[float] = None
    india_vix: Optional[float] = None
    sp500_ret1d: Optional[float] = None
    usd_inr_change1d: Optional[float] = None
    brent_crude_change1d: Optional[float] = None
    is_rbi_event_day: Optional[bool] = None
    is_fed_event_day: Optional[bool] = None
    # Fundamental features (point-in-time)
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    roe: Optional[float] = None
    debt_to_equity: Optional[float] = None
    revenue_growth_yoy: Optional[float] = None
    eps_surprise_pct: Optional[float] = None
    promoter_holding_pct: Optional[float] = None
    pledged_shares_pct: Optional[float] = None
    # News features
    company_sentiment: Optional[float] = None
    event_severity: Optional[float] = None
    news_volume_zscore: Optional[float] = None
    novelty_score: Optional[float] = None
    post_market_article_count: Optional[int] = None


class BaseForecaster(ABC):
    """Abstract base class for all forecasting models."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def supported_horizons(self) -> List[Horizon]:
        pass

    @abstractmethod
    def fit(self, features: List[FeatureVector], targets: Dict[Horizon, List[float]]) -> None:
        """Train the model. Must be called only on training data."""
        pass

    @abstractmethod
    def predict(self, features: FeatureVector, horizon: Horizon) -> PredictionOutput:
        """Generate a prediction for one observation."""
        pass

    @abstractmethod
    def predict_quantiles(
        self, features: FeatureVector, horizon: Horizon, quantiles: List[float]
    ) -> Dict[float, float]:
        """Predict return quantiles. Required for range estimation."""
        pass

    @abstractmethod
    def get_feature_importance(self, horizon: Horizon) -> Dict[str, float]:
        """Return feature importance scores (e.g., SHAP or permutation)."""
        pass
