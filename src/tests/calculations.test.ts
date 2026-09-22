/**
 * Deterministic Financial Calculations & Logic Test Suite
 * Ensures mathematical fidelity, zero look-ahead bias, and correct edge-case handling.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateKshMovement,
  calculatePercentageChange,
  calculateInvestedValue,
  calculateCurrentValue,
  calculateUnrealizedPl,
  calculateMfe,
  calculateMae,
  calculateProfitGiveback,
  calculateTrueRange,
  calculateAtr,
  calculateRelativeVolume,
  calculateRoundTripTransactionCosts
} from '../services/quantitative/calculations.ts';
import { DataQualityService } from '../services/validation/data-quality.service.ts';
import { MarketRegimeService } from '../services/quantitative/market-regime.service.ts';

describe('Deterministic Financial Calculations', () => {
  it('calculates absolute KSh movement per share correctly', () => {
    expect(calculateKshMovement(15.65, 14.80)).toBe(0.85);
    expect(calculateKshMovement(43.50, 40.50)).toBe(3.00);
    expect(calculateKshMovement(36.25, 37.00)).toBe(-0.75);
    expect(calculateKshMovement(100.00, 100.00)).toBe(0.00);
  });

  it('calculates percentage return accurately with zero-division safeguard', () => {
    expect(calculatePercentageChange(15.65, 14.80)).toBe(5.74);
    expect(calculatePercentageChange(43.50, 40.50)).toBe(7.41);
    expect(calculatePercentageChange(36.25, 37.00)).toBe(-2.03);
    expect(calculatePercentageChange(10.0, 0)).toBe(0);
  });

  it('computes portfolio invested value, current market value, and unrealized P/L', () => {
    const shares = 10000;
    const entry = 14.80;
    const current = 15.65;

    const invested = calculateInvestedValue(shares, entry);
    const currValue = calculateCurrentValue(shares, current);
    const pl = calculateUnrealizedPl(shares, entry, current);

    expect(invested).toBe(148000.0);
    expect(currValue).toBe(156500.0);
    expect(pl.grossPlKes).toBe(8500.0);
    expect(pl.plPct).toBe(5.74);
    expect(pl.kshMovementPerShare).toBe(0.85);
  });

  it('calculates MFE and MAE rigorously', () => {
    const shares = 4000;
    const entry = 40.50;
    const highSinceEntry = 44.00;
    const lowSinceEntry = 39.50;

    const mfe = calculateMfe(shares, entry, highSinceEntry);
    const mae = calculateMae(shares, entry, lowSinceEntry);

    // MFE: (44 - 40.50) * 4000 = 3.50 * 4000 = 14,000 KSh
    expect(mfe).toBe(14000.0);

    // MAE: (40.50 - 39.50) * 4000 = 1.00 * 4000 = 4,000 KSh
    expect(mae).toBe(4000.0);
  });

  it('detects profit giveback and calculates surrendered profit percentage', () => {
    const peakPl = 10000.0;
    const currentPl = 7000.0;

    const giveback = calculateProfitGiveback(peakPl, currentPl);
    expect(giveback.isGivingBack).toBe(true);
    expect(giveback.givebackKes).toBe(3000.0);
    expect(giveback.givebackPct).toBe(30.0);

    // Case when at new peak
    const atPeak = calculateProfitGiveback(10000.0, 11000.0);
    expect(atPeak.isGivingBack).toBe(false);
    expect(atPeak.givebackKes).toBe(0);
    expect(atPeak.givebackPct).toBe(0);
  });

  it('calculates True Range (TR) and Average True Range (ATR)', () => {
    const tr1 = calculateTrueRange(16.00, 15.20, 15.50);
    // max(0.80, |16 - 15.50|=0.50, |15.20 - 15.50|=0.30) = 0.80
    expect(tr1).toBe(0.80);

    const bars = [
      { high: 15.0, low: 14.5, close: 14.8 },
      { high: 15.5, low: 14.7, close: 15.2 },
      { high: 15.8, low: 15.0, close: 15.6 },
      { high: 16.0, low: 15.3, close: 15.7 }
    ];
    const { atrKes, normalizedAtrPct } = calculateAtr(bars, 3);
    expect(atrKes).toBeGreaterThan(0);
    expect(normalizedAtrPct).toBeGreaterThan(0);
  });

  it('calculates Relative Volume (RVOL) and Transaction Levies', () => {
    expect(calculateRelativeVolume(2000000, 1000000)).toBe(2.0);
    expect(calculateRelativeVolume(500000, 1000000)).toBe(0.5);

    // NSE round trip transaction levies (~1.85%)
    const cost = calculateRoundTripTransactionCosts(100000, 1.85);
    expect(cost).toBe(1850.0);
  });
});

describe('Data Quality Validation Service', () => {
  const dq = new DataQualityService();

  it('rejects impossible negative price quotes', () => {
    const invalidQuote: any = {
      symbol: 'SCOM',
      price: -5.0,
      dayVolume: 10000,
      dayHigh: 15.0,
      dayLow: 14.0,
      lastTradeTimestamp: new Date().toISOString(),
      dataSourceId: 'test'
    };
    const res = dq.validateIntradayPrice(invalidQuote);
    expect(res.isValid).toBe(false);
    expect(res.issues.some(i => i.includes('Impossible trade price'))).toBe(true);
  });

  it('rejects inverted high and low prices in bars', () => {
    const invertedBar: any = {
      symbol: 'EQTY',
      timeframe: '1d',
      timestamp: new Date().toISOString(),
      open: 42.0,
      high: 40.0, // High lower than low!
      low: 43.0,
      close: 41.0,
      volume: 50000,
      turnoverKes: 2000000,
      dataSourceId: 'test'
    };
    const res = dq.validatePriceBar(invertedBar);
    expect(res.isValid).toBe(false);
    expect(res.issues.some(i => i.includes('High (40) < Low (43)'))).toBe(true);
  });
});

describe('Market Regime Transitions', () => {
  const regimeService = new MarketRegimeService();

  it('determines BROAD_SELLING or EXTREME_SELLING when breadth collapses', () => {
    const negativeIndices: any[] = [
      { symbol: 'NASI', changePct: -2.5 },
      { symbol: 'NSE20', changePct: -2.2 }
    ];
    const collapsedBreadth: any = {
      totalTradedStocks: 40,
      advancingStocks: 3,
      decliningStocks: 32,
      advanceDeclineRatio: 0.09,
      totalMarketTurnoverKes: 600000000
    };

    const regime = regimeService.evaluateRegime(negativeIndices, collapsedBreadth);
    expect(['BROAD_SELLING', 'EXTREME_SELLING']).toContain(regime.state);
    expect(regime.confidence).toBeGreaterThan(50);
  });

  it('detects STRONG_MARKET when advancers dominate and index momentum is positive', () => {
    const bullishIndices: any[] = [
      { symbol: 'NASI', changePct: 1.8 },
      { symbol: 'NSE20', changePct: 1.5 }
    ];
    const strongBreadth: any = {
      totalTradedStocks: 45,
      advancingStocks: 30,
      decliningStocks: 8,
      advanceDeclineRatio: 3.75,
      totalMarketTurnoverKes: 750000000
    };

    const regime = regimeService.evaluateRegime(bullishIndices, strongBreadth);
    expect(regime.state).toBe('STRONG_MARKET');
    expect(regime.keyDrivers.length).toBeGreaterThan(0);
  });
});
