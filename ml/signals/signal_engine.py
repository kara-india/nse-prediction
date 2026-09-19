"""Signal engine — maps model outputs to BUY/HOLD/SELL. Skeleton only."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class SignalType(str, Enum):
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"


@dataclass
class SignalInput:
    """
    Inputs from the forecasting model used to derive the signal.
    All values are model outputs, not manually assigned.
    """
    symbol: str
    date: str
    # From prediction model
    expected_return_1d: float
    prob_positive_1d: float
    q10_return_1d: float  # downside scenario
    q90_return_1d: float  # upside scenario
    expected_return_1w: float
    prob_positive_1w: float
    # Risk/reward
    atr_normalized: float  # ATR/price
    realized_vol_20d: float
    # Calibrated confidence
    calibrated_confidence: float  # [0, 1]
    ensemble_std: float
    # Market regime (from regime classifier)
    regime_label: Optional[str] = None  # e.g., 'trending_bull', 'mean_reverting', 'high_vol'


@dataclass
class SignalOutput:
    signal: SignalType
    confidence_score: int  # [0, 100]
    # Risk levels derived from model
    entry_low: float
    entry_high: float
    stop_loss: float  # ATR-based or quantile-based
    upside_target: float
    risk_reward_ratio: float
    # Explanation keys for i18n
    explanation_keys: list  # references to i18n keys
    explanation_params: list  # parameters for i18n string formatting


class SignalEngine:
    """
    Maps model prediction outputs to trading signals.

    Design constraints:
    - Thresholds must be calibrated empirically, not hand-assigned
    - Signal must be independently testable from forecasting model
    - Stop loss derived from ATR or predicted quantile, not fixed %
    - Confidence score is calibrated probability, not arbitrary number

    TODO: Implement after backtesting validates threshold choices.
    """

    def __init__(self, config: dict):
        self.config = config
        # TODO: load calibrated thresholds

    def generate_signal(self, inputs: SignalInput, current_price: float) -> SignalOutput:
        """Generate BUY/HOLD/SELL signal. TODO: implement."""
        raise NotImplementedError

    def _compute_stop_loss(self, current_price: float, atr: float, q10_return: float) -> float:
        """
        Stop loss = max(ATR-based, quantile-based).
        ATR-based: current_price - N * ATR (N calibrated empirically)
        Quantile-based: current_price * (1 + q10_return)
        Use the more conservative (lower) of the two.
        TODO: implement and backtest.
        """
        raise NotImplementedError

    def _compute_confidence_score(self, calibrated_prob: float, ensemble_std: float) -> int:
        """
        confidence = f(calibrated_prob, ensemble_std, historical_accuracy_in_regime)
        Output: integer [0, 100] for layman display.
        TODO: implement after calibration testing.
        """
        raise NotImplementedError
