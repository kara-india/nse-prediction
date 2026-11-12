"""Provider-neutral, provenance-aware contracts for Phase 1 market data."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Protocol, Sequence


class Venue(StrEnum):
    NSE = "NSE"
    BSE = "BSE"


@dataclass(frozen=True)
class SourceMetadata:
    source_id: str
    retrieved_at: datetime
    request_id: str | None = None
    license_reference: str | None = None

    def __post_init__(self) -> None:
        if not self.source_id.strip():
            raise ValueError("source_id must not be empty")
        if self.retrieved_at.tzinfo is None or self.retrieved_at.utcoffset() is None:
            raise ValueError("retrieved_at must be timezone-aware")


@dataclass(frozen=True)
class InstrumentRecord:
    """One version of an instrument's identifiers over a valid-time interval."""

    instrument_id: str
    company_name: str
    valid_from: date
    valid_to: date | None
    source: SourceMetadata
    isin: str | None = None
    nse_symbol: str | None = None
    bse_code: str | None = None
    series: str | None = None
    sector: str | None = None

    def __post_init__(self) -> None:
        if not self.instrument_id.strip() or not self.company_name.strip():
            raise ValueError("instrument_id and company_name must not be empty")
        if self.valid_to is not None and self.valid_to < self.valid_from:
            raise ValueError("valid_to must be on or after valid_from")

    def is_valid_on(self, on_date: date) -> bool:
        return self.valid_from <= on_date and (
            self.valid_to is None or on_date <= self.valid_to
        )


@dataclass(frozen=True)
class DailyBar:
    instrument_id: str
    venue: Venue
    symbol_as_reported: str
    session_date: date
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int
    source: SourceMetadata
    is_adjusted: bool = False
    currency: str = "INR"

    def __post_init__(self) -> None:
        if not self.instrument_id.strip() or not self.symbol_as_reported.strip():
            raise ValueError("instrument_id and symbol_as_reported must not be empty")
        if min(self.open, self.high, self.low, self.close) <= 0:
            raise ValueError("OHLC prices must be positive")
        if self.high < max(self.open, self.close, self.low):
            raise ValueError("high must be at least open, close, and low")
        if self.low > min(self.open, self.close, self.high):
            raise ValueError("low must be at most open, close, and high")
        if self.volume < 0:
            raise ValueError("volume must not be negative")


class MarketDataProvider(Protocol):
    """Boundary implemented by a source whose rights have been reviewed."""

    def get_daily_bars(
        self, instrument_id: str, start: date, end: date
    ) -> Sequence[DailyBar]: ...

    def get_security_master(self, as_of: date) -> Sequence[InstrumentRecord]: ...
