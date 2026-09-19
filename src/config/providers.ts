// Provider configuration — enables/disables providers and sets credentials from env vars.
// No actual provider implementations here.

export interface ProviderConfig {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  rateLimit?: { requestsPerMinute: number };
  timeout?: number;
}

export const providerConfig = {
  price: {
    yfinance: {
      enabled: true,
      baseUrl: 'https://query1.finance.yahoo.com',
      rateLimit: { requestsPerMinute: 60 },
    } as ProviderConfig,
    nse_unofficial: {
      enabled: true,
      baseUrl: 'https://www.nseindia.com',
      rateLimit: { requestsPerMinute: 10 },
    } as ProviderConfig,
    alpha_vantage: {
      enabled: !!process.env.ALPHA_VANTAGE_API_KEY,
      apiKey: process.env.ALPHA_VANTAGE_API_KEY,
      baseUrl: 'https://www.alphavantage.co',
      rateLimit: { requestsPerMinute: 5 },
    } as ProviderConfig,
  },
  fundamentals: {
    screener: {
      enabled: true,
      baseUrl: 'https://www.screener.in',
      rateLimit: { requestsPerMinute: 5 },
    } as ProviderConfig,
  },
  news: {
    gdelt: {
      enabled: true,
      baseUrl: 'https://api.gdeltproject.org',
      rateLimit: { requestsPerMinute: 60 },
    } as ProviderConfig,
    alpha_vantage_news: {
      enabled: !!process.env.ALPHA_VANTAGE_API_KEY,
      apiKey: process.env.ALPHA_VANTAGE_API_KEY,
      rateLimit: { requestsPerMinute: 5 },
    } as ProviderConfig,
  },
  macro: {
    yfinance: {
      enabled: true,
      rateLimit: { requestsPerMinute: 60 },
    } as ProviderConfig,
  },
} as const;
