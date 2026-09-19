// Service layer interfaces — higher-level orchestration above providers.

import type { Signal, Prediction, Horizon, ModelEvaluation, WatchlistItem } from '@/types';

export interface PredictionService {
  /** Generate predictions for a symbol across all horizons */
  generatePredictions(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    predictionDate?: string
  ): Promise<Record<Horizon, Prediction>>;

  /** Retrieve stored historical predictions */
  getHistoricalPredictions(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    horizon: Horizon,
    fromDate: string,
    toDate: string
  ): Promise<Prediction[]>;

  /** Compare predictions against outcomes and update metrics */
  resolvePredictions(asOfDate: string): Promise<void>;
}

export interface SignalService {
  /** Generate BUY/HOLD/SELL signal from model predictions */
  generateSignal(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    predictions: Record<Horizon, Prediction>
  ): Promise<Signal>;

  /** Get historical signals */
  getHistoricalSignals(
    symbol: string,
    exchange: 'NSE' | 'BSE',
    fromDate: string,
    toDate: string
  ): Promise<Signal[]>;
}

export interface ModelEvaluationService {
  /** Run walk-forward evaluation for a model */
  runWalkForwardEvaluation(
    modelId: string,
    horizon: Horizon,
    options?: {
      trainWindowDays?: number;
      testWindowDays?: number;
      stepDays?: number;
      purgeGapDays?: number;
    }
  ): Promise<ModelEvaluation>;

  /** Get current model performance metrics */
  getModelMetrics(modelId: string, horizon: Horizon): Promise<ModelEvaluation | null>;
}

export interface WatchlistService {
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(item: WatchlistItem): Promise<void>;
  removeFromWatchlist(symbol: string, exchange: 'NSE' | 'BSE'): Promise<void>;
  updateItem(symbol: string, exchange: 'NSE' | 'BSE', updates: Partial<WatchlistItem>): Promise<void>;
}
