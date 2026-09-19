"""Daily data pipeline — point-in-time safe feature construction. Skeleton only."""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class DailyPipelineConfig:
    """
    Configuration for the daily data ingestion and feature construction pipeline.

    DAY T PIPELINE:
    1. Collect price data through T
    2. Collect fundamentals available by T (using publication date, not period-end date)
    3. Collect news published between prev_close (T-1 15:30 IST) and market_open (T 09:15 IST)
    4. Collect global/macro data for T-1 (previous session close)
    5. Construct features (all calculations use data <= T)
    6. Generate predictions for horizons 1D/1W/1M/3M
    7. Store predictions with timestamp
    8. Resolve any prior predictions whose target_date <= T
    9. Update model performance metrics
    """
    market_timezone: str = "Asia/Kolkata"
    market_open: str = "09:15"
    market_close: str = "15:30"
    # Point-in-time safety
    fundamental_publication_lag_days: int = 45  # conservative lag after quarter-end
    news_cutoff: str = "pre_market_open"  # only use news before market open
    # Retraining
    retrain_frequency_days: int = 30  # monthly retraining
    min_train_samples: int = 500


class DailyPipeline:
    """Orchestrates daily data collection, feature engineering, and prediction generation."""

    def __init__(self, config: DailyPipelineConfig):
        self.config = config
        # TODO: inject providers

    def run(self, date: str) -> None:
        """Run the full pipeline for a given date. TODO: implement."""
        raise NotImplementedError

    def collect_features(self, symbol: str, date: str):
        """Build point-in-time safe feature vector. TODO: implement."""
        raise NotImplementedError

    def resolve_predictions(self, date: str) -> None:
        """Compare stored predictions against actual outcomes. TODO: implement."""
        raise NotImplementedError

    def should_retrain(self, model_id: str) -> bool:
        """Check if model needs retraining based on drift or schedule. TODO: implement."""
        raise NotImplementedError
