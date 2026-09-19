// Core domain types for the NSE/BSE stock intelligence dashboard
// These are interfaces only — no implementations here.

export type Exchange = 'NSE' | 'BSE';
export type SignalType = 'BUY' | 'HOLD' | 'SELL';
export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'POST_CLOSE';
export type Horizon = '1D' | '1W' | '1M' | '3M';
export type SentimentLabel = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNCERTAIN';
export type EventType =
  | 'EARNINGS_RELEASE'
  | 'MANAGEMENT_CHANGE'
  | 'MERGER_ACQUISITION'
  | 'REGULATORY_ACTION'
  | 'LEGAL_ISSUE'
  | 'DIVIDEND_ANNOUNCEMENT'
  | 'SHARE_BUYBACK'
  | 'PROMOTER_ACTIVITY'
  | 'MACRO_POLICY'
  | 'ANALYST_RATING'
  | 'PRODUCT_LAUNCH'
  | 'EARNINGS_GUIDANCE'
  | 'OTHER';

// --- Market / Quote ---

export interface Stock {
  symbol: string;
  exchange: Exchange;
  companyName: string;
  isin: string;
  sector: string;
  industry: string;
  isDelisted: boolean;
  delistingDate?: string; // ISO date
  listedDate?: string;
}

export interface Quote {
  symbol: string;
  exchange: Exchange;
  timestamp: string; // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  marketCap?: number;
  changePercent?: number;
  previousClose?: number;
  marketStatus: MarketStatus;
}

export interface HistoricalBar {
  symbol: string;
  exchange: Exchange;
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number; // adjusted for splits/dividends
  splitFactor?: number;
  dividendAmount?: number;
}

// --- Fundamental Snapshot ---

export interface FundamentalSnapshot {
  symbol: string;
  exchange: Exchange;
  snapshotDate: string; // Date this data was actually AVAILABLE (point-in-time)
  periodEndDate: string; // Quarter/year end date
  periodType: 'QUARTERLY' | 'ANNUAL';
  // Valuation
  peRatio?: number;
  pbRatio?: number;
  evEbitda?: number;
  pegRatio?: number;
  dividendYield?: number;
  marketCap?: number;
  // Profitability
  roe?: number;
  roce?: number;
  ebitdaMargin?: number;
  netProfitMargin?: number;
  // Growth (YoY)
  revenueGrowthYoy?: number;
  epsGrowthYoy?: number;
  ebitdaGrowthYoy?: number;
  // Balance sheet
  debtToEquity?: number;
  currentRatio?: number;
  interestCoverage?: number;
  // Cash flow
  freeCashFlowYield?: number;
  operatingCashFlow?: number;
  // Ownership
  promoterHoldingPct?: number;
  promoterHoldingChangePct?: number;
  pledgedSharesPct?: number;
  institutionalHoldingPct?: number;
  // Earnings surprise
  epsActual?: number;
  epsEstimate?: number;
  epsSurprisePct?: number;
  // Source metadata
  dataSource: string;
  retrievedAt: string;
}

// --- Corporate Actions ---

export interface CorporateAction {
  symbol: string;
  exchange: Exchange;
  actionDate: string; // YYYY-MM-DD
  exDate?: string;
  recordDate?: string;
  actionType: 'DIVIDEND' | 'SPLIT' | 'BONUS' | 'RIGHTS' | 'BUYBACK' | 'MERGER' | 'DEMERGER' | 'DELISTING';
  details: Record<string, unknown>;
  source: string;
}

// --- News ---

export interface NewsArticle {
  id: string;
  headline: string;
  summary?: string;
  url: string;
  source: string;
  publishedAt: string; // ISO 8601 with timezone
  retrievedAt: string; // ISO 8601 — when we fetched it
  entities: string[]; // company symbols or names mentioned
  sector?: string;
  country?: string;
  isCompanySpecific: boolean;
  isSectorNews: boolean;
  isIndianMacroNews: boolean;
  isGlobalMacroNews: boolean;
}

export interface NewsFeature {
  symbol: string;
  featureDate: string; // YYYY-MM-DD — the trading day this feature applies to
  windowHours: number; // e.g., 18 for overnight window
  companySentiment: number; // [-1, 1]
  eventType?: EventType;
  eventSeverity: number; // [0, 1]
  newsVolumeZscore: number;
  noveltyScore: number; // [0, 1]
  marketRelevance: number; // [0, 1]
  sectorRelevance: number; // [0, 1]
  globalRelevance: number; // [0, 1]
  sentimentLabel: SentimentLabel;
  articleCount: number;
  postMarketArticleCount: number; // articles after 15:30 IST prev day
  modelVersion: string; // which NLP model produced this
}

// --- Features ---

export interface TechnicalFeature {
  symbol: string;
  exchange: Exchange;
  date: string; // YYYY-MM-DD
  // Returns / momentum
  ret1d?: number;
  ret5d?: number;
  ret21d?: number;
  ret63d?: number;
  logRet1d?: number;
  // Trend
  rsi14?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbWidth?: number; // Bollinger Band width
  bbPosition?: number; // Position within bands [0,1]
  // Volatility
  atr14Normalized?: number; // ATR/price
  realizedVol20d?: number;
  realizedVol60d?: number;
  // Volume
  volumeRatio20d?: number; // today/20D MA
  // Market-relative
  alphaVsNifty5d?: number;
  alphaVsSector5d?: number;
  beta60d?: number;
  distFrom52wHigh?: number; // [0,1], 0=at high
  distFrom52wLow?: number; // [0,1], 0=at low
  gapOpenPct?: number; // (open-prevClose)/prevClose
}

export interface MacroFeature {
  date: string; // YYYY-MM-DD
  nifty50Ret1d?: number;
  niftyBankRet1d?: number;
  indiaVix?: number;
  sp500Ret1d?: number;
  nikkeiRet1d?: number;
  hangSengRet1d?: number;
  dxyChange1d?: number;
  usdInrChange1d?: number;
  brentCrudeChange1d?: number;
  goldChange1d?: number;
  us10yYieldChange1d?: number;
  isRbiEventDay: boolean;
  isFedEventDay: boolean;
  rbiRateDecision?: number; // change in bps
  fedRateDecision?: number; // change in bps
}

// --- Predictions ---

export interface PredictionInterval {
  q10: number; // 10th percentile return
  q25: number;
  q50: number; // median
  q75: number;
  q90: number; // 90th percentile return
  centralEstimate: number; // point estimate
  probabilityPositive: number; // [0, 1]
  expectedVolatility: number;
}

export interface Prediction {
  id: string;
  symbol: string;
  exchange: Exchange;
  predictionDate: string; // Date the prediction was made (YYYY-MM-DD)
  horizon: Horizon;
  targetDate: string; // YYYY-MM-DD — exact date the prediction is for
  intervals: PredictionInterval;
  modelVersion: string;
  modelId: string;
  featuresHash: string; // hash of input features for reproducibility
  generatedAt: string; // ISO 8601
}

export interface PredictionOutcome {
  predictionId: string;
  symbol: string;
  exchange: Exchange;
  resolvedAt: string; // ISO 8601
  actualReturn: number;
  actualDirection: 1 | -1 | 0;
  actualClose: number;
  // Errors
  returnError: number; // predicted - actual
  directionCorrect: boolean;
  inInterval90: boolean; // was actual in [q10, q90]?
  inInterval50: boolean; // was actual in [q25, q75]?
  brierScore?: number;
}

// --- Signal ---

export interface Signal {
  id: string;
  symbol: string;
  exchange: Exchange;
  signalDate: string; // YYYY-MM-DD
  signal: SignalType;
  confidenceScore: number; // [0, 100] calibrated
  // Signal inputs
  expectedReturn1d: number;
  probabilityPositive1d: number;
  riskRewardRatio: number;
  // Risk levels
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  upsideTarget: number;
  // Explanation bullets (i18n keys, not hardcoded strings)
  explanationKeys: string[];
  explanationParams: Record<string, unknown>[];
  // Metadata
  modelVersion: string;
  generatedAt: string;
}

// --- Model Evaluation ---

export interface ModelEvaluation {
  modelId: string;
  modelVersion: string;
  horizon: Horizon;
  evaluationPeriodStart: string;
  evaluationPeriodEnd: string;
  sampleCount: number;
  // Regression
  mae: number;
  rmse: number;
  directionalAccuracy: number;
  // Probabilistic
  brierScore: number;
  expectedCalibrationError: number;
  coverageAt90: number; // fraction of actuals in [q10, q90]
  // Signal
  signalHitRate?: number;
  avgReturnOnSignal?: number;
  sharpeProxy?: number;
  // Baselines
  naiveBaseMae: number;
  naiveBaseBrierScore: number;
  skillScore: number; // 1 - model_score/baseline_score
}

// --- Watchlist ---

export interface WatchlistItem {
  symbol: string;
  exchange: Exchange;
  addedAt: string;
  notes?: string;
  alertThresholds?: {
    priceAbove?: number;
    priceBelow?: number;
    returnThreshold?: number;
  };
}
