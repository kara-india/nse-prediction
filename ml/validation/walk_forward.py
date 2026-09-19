"""Walk-forward validation framework. Skeleton only — no implementation."""
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum


class WindowType(str, Enum):
    EXPANDING = "expanding"  # grow training window over time
    ROLLING = "rolling"  # fixed-size training window


@dataclass
class WalkForwardConfig:
    """
    Configuration for walk-forward (purged) validation.

    Key design decisions:
    - Expanding window preferred for regime stability
    - Purge gap prevents target overlap and forward-looking features
    - Embargo period prevents feature-to-target leakage via lagged features
    - Feature scaling must be fit ONLY on training fold, applied to val/test
    - Fundamental features must use point-in-time values available at each date
    - News features must use only news available before market open on that date
    """
    window_type: WindowType = WindowType.EXPANDING
    initial_train_days: int = 756  # ~3 years
    test_window_days: int = 63  # ~3 months per fold
    step_days: int = 21  # advance by ~1 month per fold
    # Purge and embargo
    purge_gap_days: int = 5  # days to drop between train and val (1W horizon)
    embargo_days: int = 10  # days to exclude from train end (feature lag)
    # Hyperparameter tuning
    inner_cv_folds: int = 3  # inner folds for HPO (nested CV)
    # Leakage prevention flags
    enforce_point_in_time_features: bool = True
    enforce_post_market_news_cutoff: bool = True
    fit_scaler_on_train_only: bool = True  # CRITICAL


@dataclass
class WalkForwardFold:
    """One fold of a walk-forward validation run."""
    fold_index: int
    train_start: str  # YYYY-MM-DD
    train_end: str
    purge_start: str  # excluded from training
    purge_end: str
    test_start: str
    test_end: str
    train_sample_count: int = 0
    test_sample_count: int = 0


@dataclass
class WalkForwardResult:
    """Aggregated results across all folds."""
    folds: List[WalkForwardFold] = field(default_factory=list)
    # Per-fold metrics stored separately
    fold_metrics: List[dict] = field(default_factory=list)
    # Aggregated
    mean_directional_accuracy: float = 0.0
    mean_brier_score: float = 0.0
    mean_mae: float = 0.0
    coverage_90: float = 0.0
    skill_score: float = 0.0  # vs naive baseline
    # Leakage checks
    leakage_warnings: List[str] = field(default_factory=list)


# TODO: Implement WalkForwardValidator class
class WalkForwardValidator:
    """Runs purged walk-forward validation. Not yet implemented."""

    def __init__(self, config: WalkForwardConfig):
        self.config = config
        # TODO: implement

    def generate_folds(self, all_dates: List[str]) -> List[WalkForwardFold]:
        """Generate train/purge/test splits. TODO: implement."""
        raise NotImplementedError

    def run(self, model, feature_vectors, targets) -> WalkForwardResult:
        """Run full walk-forward evaluation. TODO: implement."""
        raise NotImplementedError
