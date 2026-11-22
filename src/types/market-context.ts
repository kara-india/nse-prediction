/**
 * Point-in-time market context contracts.
 *
 * These are data contracts only. They do not authorise any provider, implement
 * ingestion, assign hand-weighted regime points, or generate trading signals.
 */

export type MarketRegimeLabel =
  | 'RISK_ON'
  | 'BALANCED'
  | 'RISK_OFF'
  | 'TRANSITION'
  | 'UNKNOWN';

export type MarketForecastHorizon =
  | 'OPENING_GAP'
  | 'NEXT_30M'
  | 'NEXT_60M'
  | 'SESSION_CLOSE';

export type MarketContextCategory =
  | 'US_EQUITY'
  | 'US_FUTURES'
  | 'ASIA_EQUITY'
  | 'COMMODITY'
  | 'FX'
  | 'GIFT_NIFTY'
  | 'INDIA_INDEX'
  | 'INDIA_VOLATILITY'
  | 'MARKET_BREADTH'
  | 'INSTITUTIONAL_FLOW'
  | 'NEWS'
  | 'MACRO_EVENT';

export type MarketSessionState =
  | 'PRE_OPEN'
  | 'OPEN'
  | 'CLOSED'
  | 'POST_CLOSE'
  | 'UNKNOWN';

export interface MarketDataEntitlement {
  canDisplay: boolean;
  canStore: boolean;
  canBacktest: boolean;
  canTrainModels: boolean;
  canGenerateDerivedSignals: boolean;
  canRedistribute: boolean;
  commercialUseAllowed: boolean;
  agreementReference?: string;
  verifiedAt?: string; // ISO 8601
}

export interface MarketContextObservation {
  id: string;
  category: MarketContextCategory;
  instrument: string; // e.g. SPX, NDX_FUT, KOSPI, GIFT_NIFTY_NEAR, USDINR
  value: number;
  unit: 'POINTS' | 'PERCENT' | 'PRICE' | 'YIELD_PERCENT' | 'CURRENCY' | 'COUNT' | 'RATIO';
  changePct?: number;
  source: string;
  sourceUrl?: string;
  sourceTimestamp: string; // ISO 8601 with source timezone/offset
  retrievedAt: string; // ISO 8601
  marketTimezone: string; // e.g. America/New_York, Asia/Tokyo, Asia/Kolkata
  sessionState: MarketSessionState;
  contractExpiry?: string; // Required for futures observations where applicable
  staleAfterSeconds: number;
  isStale: boolean;
  entitlement: MarketDataEntitlement;
  qualityWarnings: string[];
}

export interface MarketContextSnapshot {
  id: string;
  asOf: string; // ISO 8601
  decisionCutoff: string; // Exact point-in-time cutoff used for the forecast
  marketTimezone: 'Asia/Kolkata';
  observations: MarketContextObservation[];
  missingCategories: MarketContextCategory[];
  qualityWarnings: string[];
  featureSchemaVersion: string;
  sourceSetVersion: string;
}

export interface MarketDirectionDistribution {
  probabilityUp: number; // [0, 1]
  probabilityFlat: number; // [0, 1]
  probabilityDown: number; // [0, 1]
  expectedReturn: number; // Return for the explicitly declared forecast horizon
  q10: number;
  q50: number;
  q90: number;
  expectedVolatility: number;
}

export interface MarketDirectionForecast {
  id: string;
  indexSymbol: 'NIFTY50' | 'BANKNIFTY' | 'SENSEX' | string;
  horizon: MarketForecastHorizon;
  predictionOrigin: string; // ISO 8601
  targetStartAt: string; // ISO 8601
  targetEndAt: string; // ISO 8601
  distribution: MarketDirectionDistribution;
  regimeLabel: MarketRegimeLabel;
  regimeProbability: number; // Calibrated probability of the assigned regime
  marketContextSnapshotId: string;
  modelId: string;
  modelVersion: string;
  calibrationVersion: string;
  featuresHash: string;
  sampleCount: number;
  validationStatus: 'RESEARCH_ONLY' | 'SHADOW' | 'APPROVED' | 'REJECTED';
  generatedAt: string; // ISO 8601
}
