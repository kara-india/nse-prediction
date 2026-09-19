// Internationalization configuration
// Supports English (default) and Hindi

export const SUPPORTED_LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
};

// Signal explanation keys — translated in locale files
export const SIGNAL_EXPLANATION_KEYS = [
  'signal.reason.momentum_positive',
  'signal.reason.momentum_negative',
  'signal.reason.valuation_attractive',
  'signal.reason.valuation_stretched',
  'signal.reason.positive_news_overnight',
  'signal.reason.negative_news_overnight',
  'signal.reason.sector_strength',
  'signal.reason.sector_weakness',
  'signal.reason.global_tailwind',
  'signal.reason.global_headwind',
  'signal.reason.high_confidence',
  'signal.reason.low_confidence',
  'signal.reason.volume_accumulation',
  'signal.reason.volume_distribution',
  'signal.reason.above_support',
  'signal.reason.below_resistance',
] as const;

export type SignalExplanationKey = (typeof SIGNAL_EXPLANATION_KEYS)[number];
