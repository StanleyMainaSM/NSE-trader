/**
 * Individual Stock Regime Detection Engine
 * 
 * Strict Principle:
 * - Derives regime states from measurable volatility (ATR), range compression, volume, and pullback depth.
 * - Distinguishes normal pullbacks from structural breakdowns.
 */

import { StockRegime, StockRegimeType, PriceBar, IntradayPrice } from '../../types/index.ts';
import { calculateAtr, calculateRelativeVolume } from './calculations.ts';

export class StockRegimeService {
  public evaluateStockRegime(
    quote: IntradayPrice,
    dailyBars: PriceBar[],
    previousRegime?: StockRegime
  ): StockRegime {
    const { atrKes, normalizedAtrPct } = calculateAtr(dailyBars, 14);
    const avgVolume20 = dailyBars.length > 0 
      ? dailyBars.slice(-20).reduce((acc, b) => acc + b.volume, 0) / Math.min(20, dailyBars.length)
      : quote.dayVolume;
    
    const rvol = calculateRelativeVolume(quote.dayVolume, avgVolume20);

    // Range compression calculation (standard deviation of last 5 closes / 20 closes)
    let rangeCompressionScore = 50;
    if (dailyBars.length >= 10) {
      const recentCloses = dailyBars.slice(-10).map(b => b.close);
      const minP = Math.min(...recentCloses);
      const maxP = Math.max(...recentCloses);
      const rangeRatio = (maxP - minP) / (quote.price || 1);
      rangeCompressionScore = Math.max(0, Math.min(100, Math.round((1 - rangeRatio * 10) * 100)));
    }

    // Pullback analysis: distance from 5-day high in multiples of ATR
    let highestPrice5d = quote.price;
    if (dailyBars.length >= 5) {
      highestPrice5d = Math.max(...dailyBars.slice(-5).map(b => b.high), quote.dayHigh);
    }
    const pullbackKes = highestPrice5d - quote.price;
    const pullbackAtrMultiple = atrKes > 0 ? Number((pullbackKes / atrKes).toFixed(2)) : 0;
    const isNormalPullback = pullbackAtrMultiple <= 1.5;

    let state: StockRegimeType = 'NORMAL';
    let reasoning = 'Stock trading within normal statistical volatility and range bands.';

    if (normalizedAtrPct > 4.5 || rvol > 2.5) {
      state = 'HIGH_VOLATILITY';
      reasoning = `High volatility expansion: ATR is ${normalizedAtrPct}% of share price with RVOL at ${rvol}x.`;
    } else if (normalizedAtrPct > 3.0) {
      state = 'ELEVATED_VOLATILITY';
      reasoning = `Elevated volatility: daily swings of ${atrKes} KSh per share.`;
    } else if (rangeCompressionScore > 75 && rvol < 0.8) {
      state = 'CONSOLIDATION';
      reasoning = `Tight price consolidation: range compression score ${rangeCompressionScore}/100 with sub-average volume.`;
    } else if (quote.changePct > 2.5 && rvol > 1.5) {
      state = 'BREAKOUT';
      reasoning = `Bullish breakout impulse: +${quote.changePct}% gain on ${rvol}x volume expansion.`;
    } else if (quote.changePct < -3.0 && pullbackAtrMultiple > 2.0) {
      state = 'BREAKDOWN';
      reasoning = `Structural breakdown: price surrendered >2.0x ATR (${pullbackKes.toFixed(2)} KSh).`;
    } else if (previousRegime?.state === 'BREAKDOWN' && quote.changePct > 1.0) {
      state = 'RECOVERY';
      reasoning = `Initial stabilization and recovery tick following sharp decline.`;
    } else if (normalizedAtrPct < 1.2) {
      state = 'LOW_VOLATILITY';
      reasoning = `Low volatility regime with narrow daily ranges (${atrKes} KSh).`;
    }

    const prevState = previousRegime?.state;
    let whyStateChanged = undefined;
    if (prevState && prevState !== state) {
      whyStateChanged = `Shifted from ${prevState} to ${state} due to ${reasoning}`;
    }

    return {
      id: `sreg-${quote.symbol}-${Date.now()}`,
      stockId: quote.stockId,
      symbol: quote.symbol,
      timestamp: new Date().toISOString(),
      state,
      reasoning,
      atrKes,
      relativeVolume: rvol,
      rangeCompressionScore,
      breakoutDistanceKes: Number((quote.price - highestPrice5d).toFixed(2)),
      isNormalPullback,
      pullbackBenchmarkAtrMultiple: pullbackAtrMultiple,
      whyStateChanged,
      provenance: 'CALCULATED_METRIC'
    };
  }
}

export const stockRegimeService = new StockRegimeService();
