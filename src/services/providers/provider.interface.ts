/**
 * Data Provider Abstraction Framework
 * 
 * Strict Principle:
 * - Never pretend delayed data is real-time.
 * - Never fabricate or silently substitute mock data as live data.
 * - Every provider must register status, freshness, timestamps, and supported capabilities.
 */

import {
  DataFreshness,
  ProviderStatus,
  DataSource,
  IntradayPrice,
  PriceBar,
  MarketIndex,
  MarketBreadth,
  OrderBookSnapshot,
  TradingCalendar,
  NewsArticle,
  FundamentalSnapshot,
  CorporateAction
} from '../../types/index.ts';

export interface ProviderHealth {
  sourceId: string;
  sourceName: string;
  status: ProviderStatus;
  freshness: DataFreshness;
  lastSuccessfulSync?: string;
  lastAttempt?: string;
  lastError?: string;
  latencyMs?: number;
  recordsIngested: number;
}

export interface IDataProvider {
  readonly id: string;
  readonly name: string;
  readonly providerType: 'MARKET_DATA' | 'NEWS' | 'FUNDAMENTALS' | 'CORPORATE_ACTIONS' | 'MACRO';
  readonly updateFrequencyMinutes: number;
  readonly isOfficialLicense: boolean;
  readonly isDemoFixtureOnly: boolean;

  getMetadata(): DataSource;
  getHealth(): ProviderHealth;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}

export interface IMarketDataProvider extends IDataProvider {
  getIntradayPrices(symbols?: string[]): Promise<IntradayPrice[]>;
  getPriceBars(symbol: string, timeframe: string, limit?: number): Promise<PriceBar[]>;
  getHistoricalBars(symbol: string, timeframe: string, start: string, end: string): Promise<PriceBar[]>;
  getOrderBook(symbol: string): Promise<OrderBookSnapshot | null>;
  getMarketIndices(): Promise<MarketIndex[]>;
  getMarketBreadth(): Promise<MarketBreadth | null>;
  getMarketTurnover(): Promise<{ totalTurnoverKes: number; timestamp: string; isEstimated: boolean }>;
  getMarketVolume(): Promise<{ totalVolume: number; timestamp: string; isEstimated: boolean }>;
  getTradingCalendar(): Promise<TradingCalendar>;
}

export interface INewsProvider extends IDataProvider {
  getLatestArticles(limit?: number): Promise<NewsArticle[]>;
  getArticlesBySymbol(symbol: string, limit?: number): Promise<NewsArticle[]>;
}

export interface IFundamentalDataProvider extends IDataProvider {
  getFundamentals(symbol: string): Promise<FundamentalSnapshot | null>;
  getAllFundamentals(): Promise<FundamentalSnapshot[]>;
}

export interface ICorporateActionsProvider extends IDataProvider {
  getUpcomingCorporateActions(): Promise<CorporateAction[]>;
}
