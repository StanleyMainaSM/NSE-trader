/**
 * Official NSE Market Data Gateway (Unconfigured / Awaiting Provider)
 * 
 * Strict Principle:
 * - Never fabricate prices or claim this feed is live when no broker/license is configured.
 * - Explains required configuration (e.g. NSE Automated Trading System / Licensed Data Vendor).
 */

import { BaseDataProvider } from './base.provider.ts';
import { IMarketDataProvider } from './provider.interface.ts';
import { IntradayPrice, PriceBar, MarketIndex, MarketBreadth } from '../../types/index.ts';

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

  async getMarketIndices(): Promise<MarketIndex[]> {
    return [];
  }

  async getMarketBreadth(): Promise<MarketBreadth | null> {
    return null;
  }
}
