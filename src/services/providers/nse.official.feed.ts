/**
 * Official NSE Market Data Gateway (Unconfigured / Awaiting Provider)
 * 
 * Strict Principle:
 * - Never fabricate prices or claim this feed is live when no broker/license is configured.
 * - Explains required configuration (e.g. NSE Automated Trading System / Licensed Data Vendor).
 */

import { BaseDataProvider } from './base.provider.ts';
import { IMarketDataProvider } from './provider.interface.ts';
import { IntradayPrice, PriceBar, MarketIndex, MarketBreadth, OrderBookSnapshot, TradingCalendar } from '../../types/index.ts';

export class OfficialNseMarketDataProvider extends BaseDataProvider implements IMarketDataProvider {
  readonly id = 'nse-official-ats-gateway';
  readonly name = 'NSE Direct Market Gateway / Licensed Feed';
  readonly providerType = 'MARKET_DATA';
  readonly updateFrequencyMinutes = 1;
  readonly isOfficialLicense = true;
  readonly isDemoFixtureOnly = false;

  constructor() {
    super();
    this.status = 'UNCONFIGURED';
    this.legalNotice = 'Awaiting integration with licensed Nairobi Securities Exchange ATS market-feed provider or authorized broker API. Real-time data unavailable until authorized credentials are provided.';
    this.supportedData = ['INTRADAY_PRICES', 'PRICE_BARS', 'ORDER_BOOK', 'MARKET_INDICES', 'MARKET_BREADTH'];
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: false,
      message: 'Official NSE Feed is currently UNCONFIGURED. Requires licensed NSE Market Data Gateway endpoint and authorized client credentials.'
    };
  }

  async getIntradayPrices(_symbols?: string[]): Promise<IntradayPrice[]> {
    return []; // Return empty; never fabricate data
  }

  async getPriceBars(_symbol: string, _timeframe: string, _limit?: number): Promise<PriceBar[]> {
    return [];
  }

  async getHistoricalBars(_symbol: string, _timeframe: string, _start: string, _end: string): Promise<PriceBar[]> {
    return [];
  }

  async getOrderBook(_symbol: string): Promise<OrderBookSnapshot | null> {
    return null;
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    return [];
  }

  async getMarketBreadth(): Promise<MarketBreadth | null> {
    return null;
  }

  async getMarketTurnover(): Promise<{ totalTurnoverKes: number; timestamp: string; isEstimated: boolean }> {
    return {
      totalTurnoverKes: 0,
      timestamp: new Date().toISOString(),
      isEstimated: false
    };
  }

  async getMarketVolume(): Promise<{ totalVolume: number; timestamp: string; isEstimated: boolean }> {
    return {
      totalVolume: 0,
      timestamp: new Date().toISOString(),
      isEstimated: false
    };
  }

  async getTradingCalendar(): Promise<TradingCalendar> {
    return {
      isMarketOpen: false,
      sessionPhase: 'CLOSED',
      nextOpen: '09:00:00',
      nextClose: '15:00:00',
      exchangeCode: 'NSE'
    };
  }
}
