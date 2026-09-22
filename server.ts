/**
 * Master Express Backend API & Vite Host
 * Nairobi Securities Exchange (NSE) Private Trading Intelligence System
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDatabase, queryAll, queryOne, runCommand } from './src/db/database.ts';
import { seedDatabase } from './src/db/seed.ts';
import { providerRegistry } from './src/services/providers/provider.registry.ts';
import { dataQualityService } from './src/services/validation/data-quality.service.ts';
import { marketRegimeService } from './src/services/quantitative/market-regime.service.ts';
import { stockRegimeService } from './src/services/quantitative/stock-regime.service.ts';
import { scannerService } from './src/services/quantitative/scanner.service.ts';
import { portfolioService } from './src/services/portfolio/portfolio.service.ts';
import { alertService } from './src/services/alerts/alert.service.ts';
import { newsIntelligenceService } from './src/services/news/news-intelligence.service.ts';
import { predictionService } from './src/services/prediction/prediction.service.ts';
import { backtestService } from './src/services/prediction/backtest.service.ts';
import { logger } from './src/services/logger.ts';
import { PortfolioPosition, UserSettings } from './src/types/index.ts';

const PORT = 3000;
const app = express();

app.use(express.json());

async function startServer() {
  // 1. Initialize persistent SQLite database & seed reference data
  try {
    await getDatabase();
    await seedDatabase();
  } catch (err: any) {
    logger.error('Server', 'Database initialization failure', err);
  }

  // ==========================================================================
  // REST API Endpoints
  // ==========================================================================

  // Health & Provider Status
  app.get('/api/health', (req: Request, res: Response) => {
    const freshness = providerRegistry.getAggregatedFreshness();
    const dataSources = providerRegistry.getAllDataSources();
    const dqSummary = dataQualityService.getDataQualitySummary(freshness, true);
    res.json({
      status: 'OK',
      systemTime: new Date().toISOString(),
      exchange: 'NSE',
      freshness,
      dataSources,
      dataQuality: dqSummary
    });
  });

  // Dedicated Data Quality & Governance APIs
  app.get('/api/data-quality/summary', (req: Request, res: Response) => {
    const freshness = providerRegistry.getAggregatedFreshness();
    res.json(dataQualityService.getDataQualitySummary(freshness, true));
  });

  app.get('/api/data-quality/issues', (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 50;
    const severity = req.query.severity as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const resolved = req.query.resolved !== undefined ? req.query.resolved === 'true' : undefined;
    res.json({
      issues: dataQualityService.getRecentIssues(limit, { severity, entityType, resolved })
    });
  });

  app.post('/api/data-quality/issues/:id/resolve', (req: Request, res: Response) => {
    const success = dataQualityService.resolveIssue(req.params.id);
    res.json({ success });
  });

  app.get('/api/data-quality/ingestions', (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 30;
    res.json({
      ingestions: dataQualityService.getRecentIngestions(limit)
    });
  });

  app.get('/api/data-quality/latencies', (req: Request, res: Response) => {
    res.json({
      latencies: dataQualityService.getAllLatencySummaries()
    });
  });

  // Providers List & Testing
  app.get('/api/providers', (req: Request, res: Response) => {
    const sources = providerRegistry.getAllDataSources();
    res.json({ dataSources: sources });
  });

  app.post('/api/providers/:id/test', async (req: Request, res: Response) => {
    const provider = providerRegistry.getProvider(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const result = await provider.testConnection();
    res.json(result);
  });

  // Market Overview & Regime
  app.get('/api/market/overview', async (req: Request, res: Response) => {
    try {
      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const [indices, breadth] = await Promise.all([
        marketProvider.getMarketIndices(),
        marketProvider.getMarketBreadth()
      ]);

      const regime = marketRegimeService.evaluateRegime(indices, breadth);

      res.json({
        indices,
        breadth,
        regime,
        freshness: indices[0]?.freshness || 'UNAVAILABLE',
        isDemoFixture: marketProvider.isDemoFixtureOnly,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      logger.error('API', 'Failed to retrieve market overview', err);
      res.status(500).json({ error: 'Failed to retrieve market overview' });
    }
  });

  // Stocks List
  app.get('/api/stocks', async (req: Request, res: Response) => {
    try {
      const stocks = await queryAll(`
        SELECT s.*, c.name, c.sector_code, sec.name as sector_name 
        FROM stocks s
        JOIN companies c ON s.company_id = c.id
        JOIN sectors sec ON c.sector_id = sec.id
        ORDER BY s.market_cap_kes DESC
      `);

      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const quotes = await marketProvider.getIntradayPrices();
      const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

      const enriched = stocks.map(stk => ({
        ...stk,
        quote: quoteMap.get(stk.symbol) || null
      }));

      res.json({ stocks: enriched });
    } catch (err: any) {
      logger.error('API', 'Failed to fetch stocks', err);
      res.status(500).json({ error: 'Failed to fetch stocks' });
    }
  });

  // Single Stock Drill-Down
  app.get('/api/stocks/:symbol', async (req: Request, res: Response) => {
    const symbol = req.params.symbol.toUpperCase();
    try {
      const stock = await queryOne(`
        SELECT s.*, c.name, c.description, c.sector_code, c.isin, sec.name as sector_name
        FROM stocks s
        JOIN companies c ON s.company_id = c.id
        JOIN sectors sec ON c.sector_id = sec.id
        WHERE s.symbol = ?
      `, [symbol]);

      if (!stock) {
        return res.status(404).json({ error: `Stock ${symbol} not found` });
      }

      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const [quotes, bars] = await Promise.all([
        marketProvider.getIntradayPrices([symbol]),
        marketProvider.getPriceBars(symbol, '1d', 30)
      ]);

      const quote = quotes[0] || null;
      let regime = null;
      if (quote) {
        regime = stockRegimeService.evaluateStockRegime(quote, bars);
      }

      const newsProvider = providerRegistry.getNewsProvider();
      const fundamentalsProvider = providerRegistry.getFundamentalProvider();

      const [articles, fundamentals] = await Promise.all([
        newsProvider.getArticlesBySymbol(symbol, 5),
        fundamentalsProvider.getFundamentals(symbol)
      ]);

      res.json({
        stock,
        quote,
        bars,
        regime,
        articles,
        fundamentals,
        isDemoFixture: marketProvider.isDemoFixtureOnly
      });
    } catch (err: any) {
      logger.error('API', `Failed to fetch stock detail for ${symbol}`, err);
      res.status(500).json({ error: `Failed to fetch stock detail for ${symbol}` });
    }
  });

  // Opportunity Scanner
  app.get('/api/scanner', async (req: Request, res: Response) => {
    try {
      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const quotes = await marketProvider.getIntradayPrices();

      const barsBySymbol = new Map();
      await Promise.all(
        quotes.map(async q => {
          const bars = await marketProvider.getPriceBars(q.symbol, '1d', 25);
          barsBySymbol.set(q.symbol, bars);
        })
      );

      const candidates = scannerService.scan(quotes, barsBySymbol, {
        minDailyTurnoverKes: 1000000 // reasonable threshold for scan
      });

      res.json({
        candidates,
        totalScanned: quotes.length,
        timestamp: new Date().toISOString(),
        isDemoFixture: marketProvider.isDemoFixtureOnly
      });
    } catch (err: any) {
      logger.error('API', 'Scanner execution error', err);
      res.status(500).json({ error: 'Scanner execution error' });
    }
  });

  // Portfolio
  app.get('/api/portfolio', async (req: Request, res: Response) => {
    try {
      const rawPositions = await portfolioService.getPositions();
      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const quotes = await marketProvider.getIntradayPrices();
      const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

      // Update positions with live/observed quote prices
      const positions: PortfolioPosition[] = [];
      for (const pos of rawPositions) {
        const quote = quoteMap.get(pos.symbol);
        if (quote) {
          const updated = portfolioService.updatePositionMetrics(pos, quote.price, quote.dayOpen);
          positions.push(updated);
          // Async update persistent state
          portfolioService.savePosition(updated).catch(() => {});
        } else {
          positions.push(pos);
        }
      }

      const totalInvested = positions.reduce((acc, p) => acc + p.investedValueKes, 0);
      const totalCurrent = positions.reduce((acc, p) => acc + p.currentValueKes, 0);
      const totalGrossPl = totalCurrent - totalInvested;
      const totalPlPct = totalInvested > 0 ? (totalGrossPl / totalInvested) * 100 : 0;
      const totalGiveback = positions.reduce((acc, p) => acc + p.profitGivebackKes, 0);

      res.json({
        portfolio: {
          id: 'port-primary',
          name: 'Personal NSE Growth Portfolio',
          totalInvestedKes: totalInvested,
          totalCurrentKes: totalCurrent,
          totalGrossPlKes: Number(totalGrossPl.toFixed(2)),
          totalPlPct: Number(totalPlPct.toFixed(2)),
          totalProfitGivebackKes: Number(totalGiveback.toFixed(2)),
          openPositionsCount: positions.length
        },
        positions,
        isDemoFixture: marketProvider.isDemoFixtureOnly
      });
    } catch (err: any) {
      logger.error('API', 'Portfolio retrieval error', err);
      res.status(500).json({ error: 'Portfolio retrieval error' });
    }
  });

  // Portfolio Position Add / Update
  app.post('/api/portfolio/position', async (req: Request, res: Response) => {
    try {
      const { symbol, shares, averageEntryPrice, notes, targetPriceKes, stopLossPriceKes } = req.body;
      if (!symbol || !shares || !averageEntryPrice) {
        return res.status(400).json({ error: 'symbol, shares, and averageEntryPrice are required' });
      }

      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const quotes = await marketProvider.getIntradayPrices([symbol.toUpperCase()]);
      const currentPrice = quotes[0]?.price || averageEntryPrice;

      const newPos: PortfolioPosition = {
        id: `pos-${symbol.toLowerCase()}-${Date.now()}`,
        portfolioId: 'port-primary',
        stockId: `stk-${symbol.toLowerCase()}`,
        symbol: symbol.toUpperCase(),
        shares: Number(shares),
        averageEntryPrice: Number(averageEntryPrice),
        currentPrice,
        previousClosePrice: currentPrice,
        investedValueKes: 0,
        currentValueKes: 0,
        grossUnrealizedPlKes: 0,
        percentagePl: 0,
        kshMovementPerShare: 0,
        peakUnrealizedPlKes: 0,
        profitGivebackKes: 0,
        profitGivebackPct: 0,
        maximumAdverseExcursionKes: 0,
        maximumFavorableExcursionKes: 0,
        holdingDurationDays: 1,
        entryDate: new Date().toISOString().split('T')[0],
        notes: notes || '',
        targetPriceKes: targetPriceKes ? Number(targetPriceKes) : undefined,
        stopLossPriceKes: stopLossPriceKes ? Number(stopLossPriceKes) : undefined,
        pullbackRiskRating: 'NORMAL',
        updatedAt: new Date().toISOString()
      };

      const calculated = portfolioService.updatePositionMetrics(newPos, currentPrice);
      await portfolioService.savePosition(calculated);

      res.status(201).json({ position: calculated });
    } catch (err: any) {
      logger.error('API', 'Failed to save position', err);
      res.status(500).json({ error: 'Failed to save position' });
    }
  });

  app.delete('/api/portfolio/position/:id', async (req: Request, res: Response) => {
    try {
      await portfolioService.deletePosition(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete position' });
    }
  });

  // News & Macro Events
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const newsProvider = providerRegistry.getNewsProvider();
      const articles = await newsProvider.getLatestArticles(20);
      res.json({ articles });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load news articles' });
    }
  });

  // Alerts
  app.get('/api/alerts', async (req: Request, res: Response) => {
    try {
      const alerts = await alertService.getAlerts(false);
      res.json({ alerts });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load alerts' });
    }
  });

  app.post('/api/alerts/:id/ack', async (req: Request, res: Response) => {
    try {
      await alertService.acknowledgeAlert(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  // Predictions & Backtest
  app.get('/api/predictions', async (req: Request, res: Response) => {
    try {
      const sampleEmpirical = predictionService.createEmpiricalPrediction({
        symbol: 'SCOM',
        setupName: 'Post-Pullback Moving Average Rebound',
        setupCriteria: 'Pullback <= 1.5x ATR into 20-day SMA with RVOL >= 1.2x on breakout session',
        horizonSessions: 3,
        targetGainPct: 4.5,
        adverseRiskPct: 2.5,
        currentPriceKes: 15.65,
        historicalHits: 47,
        historicalSampleSize: 68,
        modelVersion: 'v1.0-empirical-nse'
      });

      const list = [sampleEmpirical];
      res.json({ predictions: list });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve predictions' });
    }
  });

  app.post('/api/backtest/run', async (req: Request, res: Response) => {
    try {
      const { symbol = 'SCOM', strategyName = 'Momentum Breakout' } = req.body;
      const marketProvider = providerRegistry.getMarketDataProvider(false, true);
      const bars = await marketProvider.getPriceBars(symbol, '1d', 90);

      const simulation = backtestService.runSimulation(bars, {
        strategyName,
        symbol,
        startDate: bars[0]?.timestamp || '',
        endDate: bars[bars.length - 1]?.timestamp || '',
        trainSplitPct: 70,
        walkForwardSteps: 3,
        slippageBps: 15,
        roundTripCommissionPct: 1.85,
        initialCapitalKes: 200000
      });

      res.json(simulation);
    } catch (err: any) {
      logger.error('API', 'Backtest execution failed', err);
      res.status(500).json({ error: 'Backtest execution failed' });
    }
  });

  // User Settings
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const row = await queryOne('SELECT * FROM user_settings WHERE id = "usr-default"');
      if (!row) return res.status(404).json({ error: 'Settings not found' });
      const settings: UserSettings = {
        id: row.id,
        tradingCapitalKes: row.trading_capital_kes,
        preferredHoldingPeriod: row.preferred_holding_period,
        minimumKshShareOpportunity: row.minimum_ksh_share_opportunity,
        minimumLiquidityDailyTurnoverKes: row.minimum_liquidity_daily_turnover_kes,
        preferredVolatility: row.preferred_volatility,
        maximumPositionSizeKes: row.maximum_position_size_kes,
        maximumPortfolioAllocationPerStockPct: row.maximum_portfolio_allocation_per_stock_pct,
        alertSensitivity: row.alert_sensitivity,
        monitoredSymbols: JSON.parse(row.monitored_symbols_json || '[]'),
        profitGivebackWarningThresholdPct: row.profit_giveback_warning_threshold_pct,
        isDemoDataAllowed: Boolean(row.is_demo_data_allowed),
        updatedAt: row.updated_at
      };
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  app.put('/api/settings', async (req: Request, res: Response) => {
    try {
      const s = req.body;
      await runCommand(`
        UPDATE user_settings SET
          trading_capital_kes = ?,
          preferred_holding_period = ?,
          minimum_ksh_share_opportunity = ?,
          minimum_liquidity_daily_turnover_kes = ?,
          preferred_volatility = ?,
          maximum_position_size_kes = ?,
          maximum_portfolio_allocation_per_stock_pct = ?,
          alert_sensitivity = ?,
          monitored_symbols_json = ?,
          profit_giveback_warning_threshold_pct = ?,
          is_demo_data_allowed = ?,
          updated_at = ?
        WHERE id = "usr-default"
      `, [
        s.tradingCapitalKes, s.preferredHoldingPeriod, s.minimumKshShareOpportunity,
        s.minimumLiquidityDailyTurnoverKes, s.preferredVolatility, s.maximumPositionSizeKes,
        s.maximumPortfolioAllocationPerStockPct, s.alertSensitivity,
        JSON.stringify(s.monitoredSymbols || []),
        s.profitGivebackWarningThresholdPct, s.isDemoDataAllowed ? 1 : 0,
        new Date().toISOString()
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Recent Logs & Data Quality
  app.get('/api/logs', (req: Request, res: Response) => {
    res.json({
      logs: logger.getRecentLogs(60),
      dataQualityIssues: dataQualityService.getRecentIssues(40)
    });
  });

  // ==========================================================================
  // Vite Middleware & Static Serving
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('Server', `NSE Intelligence Terminal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
