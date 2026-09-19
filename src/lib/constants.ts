// Application-wide constants

export const MARKET_TIMEZONE = 'Asia/Kolkata';

export const MARKET_OPEN_TIME = '09:15'; // IST
export const MARKET_CLOSE_TIME = '15:30'; // IST
export const PRE_OPEN_START_TIME = '09:00'; // IST

// Trading-calendar day mapping
export const HORIZON_TRADING_DAYS: Record<string, number> = {
  '1D': 1,
  '1W': 5,
  '1M': 21,
  '3M': 63,
};

// Signal thresholds (placeholder — to be calibrated empirically)
// DO NOT hand-assign weights. These are tunable parameters.
export const SIGNAL_CONFIG = {
  // Minimum expected return to consider BUY (placeholder, subject to backtesting)
  BUY_MIN_EXPECTED_RETURN: 0.02,
  // Maximum expected return to consider SELL (placeholder)
  SELL_MAX_EXPECTED_RETURN: -0.015,
  // Minimum probability of gain for BUY
  BUY_MIN_PROB_POSITIVE: 0.58,
  // ATR multiplier for stop loss
  STOP_LOSS_ATR_MULTIPLIER: 2.0,
  // Minimum risk/reward ratio for BUY signal
  MIN_RISK_REWARD: 1.5,
} as const;

// NSE indices
export const NSE_INDICES = {
  NIFTY50: '^NSEI',
  NIFTY_BANK: '^NSEBANK',
  NIFTY_IT: '^CNXIT',
  NIFTY_AUTO: '^CNXAUTO',
  NIFTY_PHARMA: '^CNXPHARMA',
  NIFTY_FMCG: '^CNXFMCG',
  NIFTY_METAL: '^CNXMETAL',
  NIFTY_REALTY: '^CNXREALTY',
  INDIA_VIX: '^INDIAVIX',
} as const;

// Data provider priority order
export const PROVIDER_PRIORITY = {
  price: ['yfinance', 'nse_unofficial', 'alpha_vantage'],
  fundamentals: ['screener', 'yfinance_info', 'alternative'],
  news: ['gdelt', 'alpha_vantage_news', 'rss_feeds'],
  macro: ['yfinance', 'fred', 'manual_csv'],
} as const;

export const EXCHANGES = ['NSE', 'BSE'] as const;
export const HORIZONS = ['1D', '1W', '1M', '3M'] as const;
export const SIGNAL_TYPES = ['BUY', 'HOLD', 'SELL'] as const;
