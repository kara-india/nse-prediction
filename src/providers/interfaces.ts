// Provider interfaces — all data providers must implement these contracts.
// No implementations here.

import type {
  HistoricalBar,
  Quote,
  Stock,
  CorporateAction,
  FundamentalSnapshot,
  NewsArticle,
  MacroFeature,
} from '@/types';

// --- Price Data ---

export interface PriceDataProvider {
  readonly name: string;
  readonly supportsNSE: boolean;
  readonly supportsBSE: boolean;
  readonly supportsIntraday: boolean;
  readonly historicalDepthYears: number;

  /** Fetch OHLCV bars for a symbol */
  getHistoricalBars(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    fromDate: string,
    toDate: string,
    interval?: '1d' | '1h' | '5m'
  ): Promise<HistoricalBar[]>;

  /** Fetch latest quote (may be delayed) */
  getQuote(symbol: string, exchange: 'NSE' | 'BSE'): Promise<Quote>;

  /** Fetch full symbol list for an exchange */
  getUniverse(exchange: 'NSE' | 'BSE'): Promise<Stock[]>;

  /** Health check */
  isAvailable(): Promise<boolean>;
}

// --- Fundamental Data ---

export interface FundamentalDataProvider {
  readonly name: string;
  readonly supportsPointInTime: boolean; // critical for ML training

  /** Get fundamental snapshot as of a specific date (point-in-time safe if supportsPointInTime) */
  getFundamentals(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    asOfDate?: string
  ): Promise<FundamentalSnapshot | null>;

  /** Get corporate actions */
  getCorporateActions(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    fromDate: string,
    toDate: string
  ): Promise<CorporateAction[]>;

  isAvailable(): Promise<boolean>;
}

// --- News Data ---

export interface NewsDataProvider {
  readonly name: string;
  readonly hasHistoricalAccess: boolean;
  readonly historicalDepthYears: number;
  readonly isRealtime: boolean;

  /** Fetch news for a symbol/entities in a time window */
  getNews(
    query: {
      symbols?: string[];
      sectors?: string[];
      keywords?: string[];
      fromTimestamp: string; // ISO 8601
      toTimestamp: string;
      maxResults?: number;
    }
  ): Promise<NewsArticle[]>;

  /** Fetch post-market news (after 15:30 IST) since last close */
  getOvernightNews(
    symbol: string,
    prevCloseTimestamp: string
  ): Promise<NewsArticle[]>;

  isAvailable(): Promise<boolean>;
}

// --- Macro Data ---

export interface MacroDataProvider {
  readonly name: string;

  /** Get macro feature snapshot for a given date */
  getMacroFeatures(date: string): Promise<MacroFeature | null>;

  /** Get batch macro features */
  getMacroFeatureRange(fromDate: string, toDate: string): Promise<MacroFeature[]>;

  isAvailable(): Promise<boolean>;
}

// --- Provider Registry ---

export interface ProviderRegistry {
  price: PriceDataProvider[];
  fundamentals: FundamentalDataProvider[];
  news: NewsDataProvider[];
  macro: MacroDataProvider[];
}

// --- Provider Result with fallback tracking ---

export interface ProviderResult<T> {
  data: T;
  provider: string;
  isCached: boolean;
  isStale: boolean;
  fetchedAt: string;
  warnings: string[];
}
