/**
 * Isolated Demo Data Fixture Provider
 * 
 * STRICT COMPLIANCE:
 * - Explicitly labeled as DEMO DATA — NOT REAL MARKET DATA.
 * - Used strictly for mathematical engine validation, algorithm testing, and UI verification.
 * - Isolated so it can never be mistaken for live broker prices.
 */

import { BaseDataProvider } from './base.provider.ts';
import { IMarketDataProvider, INewsProvider, IFundamentalDataProvider, ICorporateActionsProvider } from './provider.interface.ts';
import {
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
import { dataQualityService } from '../validation/data-quality.service.ts';

export class DemoFixtureProvider 
  extends BaseDataProvider 
  implements IMarketDataProvider, INewsProvider, IFundamentalDataProvider, ICorporateActionsProvider 
{
  readonly id = 'nse-demo-simulation-fixture';
  readonly name = 'Demo Simulation Fixture (Sandboxed)';
  readonly providerType = 'MARKET_DATA';
  readonly updateFrequencyMinutes = 5;
  readonly isOfficialLicense = false;
  readonly isDemoFixtureOnly = true;

  constructor() {
    super();
    this.status = 'DEMO_ONLY';
    this.legalNotice = 'DEMO DATA — NOT REAL MARKET DATA. Used exclusively for engine verification and calculation testing. Never use for live trade execution.';
    this.supportedData = ['INTRADAY_PRICES', 'PRICE_BARS', 'MARKET_INDICES', 'MARKET_BREADTH', 'NEWS', 'FUNDAMENTALS', 'CORPORATE_ACTIONS'];
    this.lastSuccessfulSync = new Date().toISOString();
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: 'Demo Simulation Fixture is operational in sandboxed verification mode (DEMO DATA — NOT REAL MARKET DATA).'
    };
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    const startTime = Date.now();
    const now = new Date().toISOString();
    const raw: MarketIndex[] = [
      {
        id: 'idx-nasi-demo',
        symbol: 'NASI',
        name: 'NSE All Share Index',
        value: 104.85,
        changeKes: 0.72,
        changePct: 0.69,
        previousClose: 104.13,
        high: 105.10,
        low: 103.95,
        volume: 18450000,
        turnoverKes: 382400000,
        timestamp: now,
        provenance: 'ESTIMATE',
        freshness: 'DELAYED'
      },
      {
        id: 'idx-nse20-demo',
        symbol: 'NSE20',
        name: 'NSE 20 Share Index',
        value: 1685.40,
        changeKes: -4.20,
        changePct: -0.25,
        previousClose: 1689.60,
        high: 1692.10,
        low: 1681.30,
        volume: 9800000,
        turnoverKes: 245000000,
        timestamp: now,
        provenance: 'ESTIMATE',
        freshness: 'DELAYED'
      },
      {
        id: 'idx-nse25-demo',
        symbol: 'NSE25',
        name: 'NSE 25 Share Index',
        value: 2840.15,
        changeKes: 12.80,
        changePct: 0.45,
        previousClose: 2827.35,
        high: 2845.00,
        low: 2822.50,
        volume: 14200000,
        turnoverKes: 310500000,
        timestamp: now,
        provenance: 'ESTIMATE',
        freshness: 'DELAYED'
      }
    ];

    const validated = raw.filter(idx => dataQualityService.validateMarketIndex(idx, this.id).isValid);
    const latency = Math.max(12, Date.now() - startTime + 16);
    this.recordSuccess(validated.length, latency, 'MARKET_INDEX', now);

    return dataQualityService.tagCollectionWithFreshness(validated, {
      sourceId: this.id,
      sourceTimestamp: now,
      isDemoFixture: true,
      fetchLatencyMs: latency
    });
  }

  async getMarketBreadth(): Promise<MarketBreadth | null> {
    const startTime = Date.now();
    const now = new Date().toISOString();
    const raw: MarketBreadth = {
      id: 'breadth-demo-current',
      timestamp: now,
      totalTradedStocks: 42,
      advancingStocks: 18,
      decliningStocks: 15,
      unchangedStocks: 9,
      advanceDeclineRatio: 1.20,
      totalMarketTurnoverKes: 485900000,
      totalMarketVolume: 24500000,
      new52WeekHighs: 2,
      new52WeekLows: 1,
      breadthThrustIndex: 54.5,
      freshness: 'DELAYED',
      dataSourceId: this.id
    };

    const validation = dataQualityService.validateMarketBreadth(raw, this.id);
    if (!validation.isValid) {
      this.recordFailure('Market breadth validation failed', 'MARKET_BREADTH');
      return null;
    }

    const latency = Math.max(10, Date.now() - startTime + 14);
    this.recordSuccess(1, latency, 'MARKET_BREADTH', now);

    return dataQualityService.tagEntityWithFreshness(raw, {
      sourceId: this.id,
      sourceTimestamp: now,
      isDemoFixture: true,
      fetchLatencyMs: latency
    });
  }

  async getIntradayPrices(symbols?: string[]): Promise<IntradayPrice[]> {
    const now = new Date().toISOString();
    const demoCatalog: IntradayPrice[] = [
      {
        id: 'p-scom-demo',
        stockId: 'stk-scom',
        symbol: 'SCOM',
        price: 15.65,
        changeKes: 0.35,
        changePct: 2.29,
        bidPrice: 15.60,
        bidQuantity: 45000,
        askPrice: 15.65,
        askQuantity: 12500,
        dayOpen: 15.30,
        dayHigh: 15.75,
        dayLow: 15.25,
        dayVolume: 8520000,
        dayTurnoverKes: 132450000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-eqty-demo',
        stockId: 'stk-eqty',
        symbol: 'EQTY',
        price: 43.50,
        changeKes: 1.25,
        changePct: 2.96,
        bidPrice: 43.25,
        bidQuantity: 28000,
        askPrice: 43.50,
        askQuantity: 15000,
        dayOpen: 42.25,
        dayHigh: 43.75,
        dayLow: 42.00,
        dayVolume: 2450000,
        dayTurnoverKes: 105350000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-kcb-demo',
        stockId: 'stk-kcb',
        symbol: 'KCB',
        price: 36.25,
        changeKes: -0.50,
        changePct: -1.36,
        bidPrice: 36.25,
        bidQuantity: 18000,
        askPrice: 36.50,
        askQuantity: 22000,
        dayOpen: 36.75,
        dayHigh: 37.00,
        dayLow: 36.00,
        dayVolume: 1890000,
        dayTurnoverKes: 68512500,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-eabl-demo',
        stockId: 'stk-eabl',
        symbol: 'EABL',
        price: 138.00,
        changeKes: 3.50,
        changePct: 2.60,
        bidPrice: 137.50,
        bidQuantity: 6500,
        askPrice: 138.00,
        askQuantity: 4200,
        dayOpen: 134.50,
        dayHigh: 139.00,
        dayLow: 134.00,
        dayVolume: 480000,
        dayTurnoverKes: 65760000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-absa-demo',
        stockId: 'stk-absa',
        symbol: 'ABSA',
        price: 14.85,
        changeKes: 0.15,
        changePct: 1.02,
        bidPrice: 14.80,
        bidQuantity: 35000,
        askPrice: 14.85,
        askQuantity: 18000,
        dayOpen: 14.70,
        dayHigh: 15.00,
        dayLow: 14.65,
        dayVolume: 1250000,
        dayTurnoverKes: 18562500,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-coop-demo',
        stockId: 'stk-coop',
        symbol: 'COOP',
        price: 13.90,
        changeKes: 0.05,
        changePct: 0.36,
        bidPrice: 13.85,
        bidQuantity: 42000,
        askPrice: 13.90,
        askQuantity: 30000,
        dayOpen: 13.85,
        dayHigh: 14.05,
        dayLow: 13.80,
        dayVolume: 1720000,
        dayTurnoverKes: 23908000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-bat-demo',
        stockId: 'stk-bat',
        symbol: 'BAT',
        price: 412.00,
        changeKes: -5.00,
        changePct: -1.20,
        bidPrice: 410.00,
        bidQuantity: 1200,
        askPrice: 413.00,
        askQuantity: 1800,
        dayOpen: 417.00,
        dayHigh: 418.00,
        dayLow: 410.00,
        dayVolume: 42000,
        dayTurnoverKes: 17304000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-ncba-demo',
        stockId: 'stk-ncba',
        symbol: 'NCBA',
        price: 45.20,
        changeKes: 1.10,
        changePct: 2.49,
        bidPrice: 45.00,
        bidQuantity: 14000,
        askPrice: 45.25,
        askQuantity: 8000,
        dayOpen: 44.10,
        dayHigh: 45.50,
        dayLow: 44.00,
        dayVolume: 610000,
        dayTurnoverKes: 27572000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      },
      {
        id: 'p-scbk-demo',
        stockId: 'stk-scbk',
        symbol: 'SCBK',
        price: 198.50,
        changeKes: 2.50,
        changePct: 1.28,
        bidPrice: 198.00,
        bidQuantity: 3500,
        askPrice: 199.00,
        askQuantity: 2100,
        dayOpen: 196.00,
        dayHigh: 200.00,
        dayLow: 195.50,
        dayVolume: 120000,
        dayTurnoverKes: 23820000,
        lastTradeTimestamp: now,
        sourceTimestamp: now,
        ingestionTimestamp: now,
        freshness: 'DELAYED',
        dataSourceId: this.id,
        provenance: 'ESTIMATE'
      }
    ];

    const filtered = (!symbols || symbols.length === 0) 
      ? demoCatalog 
      : demoCatalog.filter(c => symbols.includes(c.symbol));

    const validated = filtered.filter(q => dataQualityService.validateIntradayPrice(q).isValid);
    const latency = 22;
    this.recordSuccess(validated.length, latency, 'INTRADAY_PRICE', now);

    return dataQualityService.tagCollectionWithFreshness(validated, {
      sourceId: this.id,
      sourceTimestamp: now,
      isDemoFixture: true,
      fetchLatencyMs: latency
    });
  }

  async getPriceBars(symbol: string, timeframe: string, limit = 30): Promise<PriceBar[]> {
    const startTime = Date.now();
    const bars: PriceBar[] = [];
    let basePrice = symbol === 'SCOM' ? 14.50 : symbol === 'EQTY' ? 39.00 : symbol === 'EABL' ? 128.00 : 35.00;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = limit; i >= 0; i--) {
      const barTime = new Date(now - i * oneDayMs).toISOString();
      const dailyVolatility = basePrice * 0.025;
      const change = (Math.sin(i * 0.4) * 0.6 + (Math.random() - 0.48)) * dailyVolatility;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * dailyVolatility * 0.6;
      const low = Math.min(open, close) - Math.random() * dailyVolatility * 0.6;
      const volume = Math.floor(500000 + Math.random() * 2000000);
      const turnoverKes = volume * ((open + close) / 2);

      bars.push({
        id: `bar-${symbol}-${timeframe}-${i}`,
        stockId: `stk-${symbol.toLowerCase()}`,
        symbol,
        timeframe: timeframe as any,
        timestamp: barTime,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        turnoverKes: Number(turnoverKes.toFixed(2)),
        isCompleted: true,
        dataSourceId: this.id,
        provenance: 'ESTIMATE',
        freshness: 'DELAYED'
      });

      basePrice = close;
    }

    const validated = bars.filter(b => dataQualityService.validatePriceBar(b).isValid);
    const latency = Math.max(15, Date.now() - startTime + 18);
    this.recordSuccess(validated.length, latency, 'PRICE_BAR', new Date().toISOString());

    return dataQualityService.tagCollectionWithFreshness(validated, {
      sourceId: this.id,
      sourceTimestamp: new Date().toISOString(),
      isDemoFixture: true,
      fetchLatencyMs: latency
    });
  }

  async getHistoricalBars(symbol: string, timeframe: string, start: string, end: string): Promise<PriceBar[]> {
    const allBars = await this.getPriceBars(symbol, timeframe, 120);
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return allBars.filter(b => {
      const t = new Date(b.timestamp).getTime();
      return (!isNaN(startTime) ? t >= startTime : true) && (!isNaN(endTime) ? t <= endTime : true);
    });
  }

  async getOrderBook(symbol: string): Promise<OrderBookSnapshot | null> {
    const quotes = await this.getIntradayPrices([symbol]);
    const quote = quotes[0];
    if (!quote) return null;

    const basePrice = quote.price;
    const tick = 0.05;
    return {
      id: `ob-${symbol}-demo-${Date.now()}`,
      stockId: quote.stockId,
      symbol,
      timestamp: new Date().toISOString(),
      bids: [
        { price: Number((basePrice - tick).toFixed(2)), quantity: 45000, ordersCount: 8 },
        { price: Number((basePrice - tick * 2).toFixed(2)), quantity: 92000, ordersCount: 14 },
        { price: Number((basePrice - tick * 3).toFixed(2)), quantity: 120000, ordersCount: 22 }
      ],
      asks: [
        { price: Number((basePrice + tick).toFixed(2)), quantity: 38000, ordersCount: 6 },
        { price: Number((basePrice + tick * 2).toFixed(2)), quantity: 74000, ordersCount: 11 },
        { price: Number((basePrice + tick * 3).toFixed(2)), quantity: 155000, ordersCount: 19 }
      ],
      spreadKes: Number((tick * 2).toFixed(2)),
      spreadBps: Number((((tick * 2) / basePrice) * 10000).toFixed(1)),
      bidDepthTotal: 257000,
      askDepthTotal: 267000,
      orderBookImbalanceRatio: Number(((257000 - 267000) / (257000 + 267000)).toFixed(3)),
      hasLegitimateSource: false, // Explicitly false for demo simulation
      dataSourceId: this.id
    };
  }

  async getMarketTurnover(): Promise<{ totalTurnoverKes: number; timestamp: string; isEstimated: boolean }> {
    const breadth = await this.getMarketBreadth();
    return {
      totalTurnoverKes: breadth?.totalMarketTurnoverKes || 485900000,
      timestamp: new Date().toISOString(),
      isEstimated: true
    };
  }

  async getMarketVolume(): Promise<{ totalVolume: number; timestamp: string; isEstimated: boolean }> {
    const breadth = await this.getMarketBreadth();
    return {
      totalVolume: breadth?.totalMarketVolume || 24500000,
      timestamp: new Date().toISOString(),
      isEstimated: true
    };
  }

  async getTradingCalendar(): Promise<TradingCalendar> {
    const now = new Date();
    // Nairobi is UTC+3
    const utcHours = now.getUTCHours();
    const eatHours = (utcHours + 3) % 24;
    const isWeekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
    const isMarketHours = isWeekday && eatHours >= 9 && eatHours < 15;

    return {
      isMarketOpen: isMarketHours,
      sessionPhase: isMarketHours ? 'CONTINUOUS_TRADING' : 'CLOSED',
      nextOpen: '09:00:00 EAT',
      nextClose: '15:00:00 EAT',
      exchangeCode: 'NSE'
    };
  }

  async getLatestArticles(_limit = 10): Promise<NewsArticle[]> {
    const startTime = Date.now();
    const now = new Date().toISOString();
    const raw: NewsArticle[] = [
      {
        id: 'news-demo-1',
        headline: 'CBK Monetary Policy Committee Maintains Central Bank Rate at 12.75%',
        summary: 'The Monetary Policy Committee noted that overall inflation has stabilized within the target band of 5.0±2.5%, anchoring expectations across commercial banking lending margins.',
        sourceName: 'Central Bank of Kenya (CBK)',
        publishedAt: now,
        ingestedAt: now,
        classification: 'POTENTIALLY_MARKET_MOVING',
        rawTags: ['CBK', 'Interest Rates', 'Banking', 'Macro'],
        mentionedSymbols: ['EQTY', 'KCB', 'ABSA', 'COOP', 'NCBA', 'SCBK'],
        mentionedSectors: ['BANKING'],
        isVerifiedFact: true,
        dataSourceId: this.id
      },
      {
        id: 'news-demo-2',
        headline: 'East African Breweries PLC Announces Strong H1 Regional Volume Growth',
        summary: 'EABL posted strong premium beer resilience and spirits margin recovery in Kenya and Uganda, despite regional excise duty discussions.',
        sourceName: 'NSE Company Disclosure',
        publishedAt: now,
        ingestedAt: now,
        classification: 'RELEVANT',
        rawTags: ['EABL', 'Earnings', 'Manufacturing'],
        mentionedSymbols: ['EABL'],
        mentionedSectors: ['MANUFACTURING'],
        isVerifiedFact: true,
        dataSourceId: this.id
      },
      {
        id: 'news-demo-3',
        headline: 'Capital Markets Authority Releases Draft Regulations for Market Making on Derivatives and Equities',
        summary: 'CMA proposals aim to incentivize dedicated market makers on the Nairobi Securities Exchange to deepen liquidity across mid-cap shares.',
        sourceName: 'Capital Markets Authority (CMA)',
        publishedAt: now,
        ingestedAt: now,
        classification: 'INFORMATION',
        rawTags: ['CMA', 'Regulation', 'Liquidity', 'NSE'],
        mentionedSymbols: [],
        mentionedSectors: [],
        isVerifiedFact: true,
        dataSourceId: this.id
      }
    ];

    const validated = raw.filter(a => dataQualityService.validateNewsArticle(a, this.id).isValid);
    const latency = Math.max(10, Date.now() - startTime + 15);
    this.recordSuccess(validated.length, latency, 'NEWS', now);

    return dataQualityService.tagCollectionWithFreshness(validated, {
      sourceId: this.id,
      sourceTimestamp: now,
      isDemoFixture: true,
      fetchLatencyMs: latency
    });
  }

  async getArticlesBySymbol(symbol: string, limit = 5): Promise<NewsArticle[]> {
    const all = await this.getLatestArticles(20);
    return all.filter(a => a.mentionedSymbols.includes(symbol)).slice(0, limit);
  }

  async getFundamentals(symbol: string): Promise<FundamentalSnapshot | null> {
    const table: Record<string, Partial<FundamentalSnapshot>> = {
      SCOM: { peRatio: 12.4, pbRatio: 4.8, dividendYieldPct: 6.8, epsKes: 1.26, bpsKes: 3.25, roePct: 38.5 },
      EQTY: { peRatio: 4.6, pbRatio: 0.85, dividendYieldPct: 9.2, epsKes: 9.45, bpsKes: 51.20, roePct: 21.2 },
      KCB: { peRatio: 3.8, pbRatio: 0.62, dividendYieldPct: 8.5, epsKes: 9.54, bpsKes: 58.40, roePct: 18.4 },
      EABL: { peRatio: 14.8, pbRatio: 3.9, dividendYieldPct: 5.4, epsKes: 9.32, bpsKes: 35.40, roePct: 28.0 }
    };
    const row = table[symbol];
    if (!row) return null;

    return {
      id: `fund-${symbol}-demo`,
      stockId: `stk-${symbol.toLowerCase()}`,
      symbol,
      asOfDate: '2025-12-31',
      peRatio: row.peRatio,
      pbRatio: row.pbRatio,
      dividendYieldPct: row.dividendYieldPct,
      epsKes: row.epsKes,
      bpsKes: row.bpsKes,
      roePct: row.roePct,
      currency: 'KES',
      isAudited: true,
      updatedAt: new Date().toISOString()
    };
  }

  async getAllFundamentals(): Promise<FundamentalSnapshot[]> {
    const symbols = ['SCOM', 'EQTY', 'KCB', 'EABL'];
    const results: FundamentalSnapshot[] = [];
    for (const sym of symbols) {
      const fund = await this.getFundamentals(sym);
      if (fund) results.push(fund);
    }
    return results;
  }

  async getUpcomingCorporateActions(): Promise<CorporateAction[]> {
    return [
      {
        id: 'corp-demo-1',
        companyId: 'cmp-scom',
        symbol: 'SCOM',
        actionType: 'DIVIDEND',
        announcementDate: '2026-05-15',
        bookClosureDate: '2026-07-31',
        paymentDate: '2026-08-31',
        details: 'Final Dividend of KSh 0.65 per share for the year ended 31 March 2026',
        ratioOrAmountKes: 0.65,
        status: 'APPROVED',
        dataSourceId: this.id
      }
    ];
  }
}
