/**
 * Liquidity Intelligence Engine
 * 
 * Strict Principle:
 * - Deterministic, non-fabricated liquidity assessment for NSE stocks.
 * - Protects trader from illiquidity traps, high slippage, and inability to exit swing positions.
 */

import { IntradayPrice, PriceBar, OrderBookSnapshot, LiquidityClassification, LiquidityMetrics } from '../../types/index.ts';
import { calculateRelativeVolume } from './calculations.ts';

export class LiquidityService {
  /**
   * Classifies liquidity based on daily and 20-day average turnover in KSh
   */
  public classifyLiquidity(dailyTurnoverKes: number, avg20DayTurnoverKes: number): LiquidityClassification {
    const benchmark = avg20DayTurnoverKes > 0 ? avg20DayTurnoverKes : dailyTurnoverKes;
    if (benchmark <= 0 || isNaN(benchmark)) return 'UNAVAILABLE';
    if (benchmark >= 50000000) return 'VERY_LIQUID'; // >= 50M KSh (e.g. SCOM, EQTY)
    if (benchmark >= 10000000) return 'LIQUID';      // 10M - 50M KSh (e.g. KCB, EABL)
    if (benchmark >= 2000000) return 'MODERATE';     // 2M - 10M KSh
    if (benchmark >= 500000) return 'THIN';          // 500k - 2M KSh
    return 'VERY_THIN';                             // < 500k KSh
  }

  /**
   * Computes days required to exit a position safely without exceeding max volume participation
   * Default max participation = 10% of average daily volume
   */
  public calculateDaysToLiquidate(
    sharesToExit: number,
    avgDailyVolume: number,
    maxParticipationPct = 10.0
  ): number {
    if (sharesToExit <= 0) return 0;
    if (avgDailyVolume <= 0 || isNaN(avgDailyVolume)) return 999;
    const maxDailyExitCapacity = avgDailyVolume * (maxParticipationPct / 100);
    if (maxDailyExitCapacity <= 0) return 999;
    return Number((sharesToExit / maxDailyExitCapacity).toFixed(1));
  }

  /**
   * Evaluates comprehensive liquidity profile for a stock
   */
  public evaluateLiquidity(
    quote: IntradayPrice,
    dailyBars: PriceBar[],
    orderBook?: OrderBookSnapshot | null,
    positionShares = 0
  ): LiquidityMetrics {
    const dailyTurnoverKes = quote.dayTurnoverKes;
    const avg20Bars = dailyBars.slice(-20);
    const avg20DayTurnoverKes = avg20Bars.length > 0
      ? avg20Bars.reduce((acc, b) => acc + b.turnoverKes, 0) / avg20Bars.length
      : dailyTurnoverKes;

    const avg20DayVolume = avg20Bars.length > 0
      ? avg20Bars.reduce((acc, b) => acc + b.volume, 0) / avg20Bars.length
      : quote.dayVolume;

    const turnoverRatio = avg20DayTurnoverKes > 0
      ? Number((dailyTurnoverKes / avg20DayTurnoverKes).toFixed(2))
      : 1.0;

    const relativeVolume = calculateRelativeVolume(quote.dayVolume, avg20DayVolume);
    const classification = this.classifyLiquidity(dailyTurnoverKes, avg20DayTurnoverKes);

    // Calculate spread if bid/ask available
    let spreadKes: number | undefined;
    let spreadBps: number | undefined;

    if (quote.bidPrice && quote.askPrice && quote.askPrice > quote.bidPrice) {
      spreadKes = Number((quote.askPrice - quote.bidPrice).toFixed(2));
      spreadBps = Number(((spreadKes / quote.price) * 10000).toFixed(1));
    } else if (orderBook && orderBook.spreadKes > 0) {
      spreadKes = orderBook.spreadKes;
      spreadBps = orderBook.spreadBps;
    }

    const daysToLiquidate = this.calculateDaysToLiquidate(
      positionShares > 0 ? positionShares : Math.floor(100000 / (quote.price || 1)),
      avg20DayVolume
    );

    let warningNote: string | undefined;
    if (classification === 'VERY_THIN' || classification === 'THIN') {
      warningNote = `Thin liquidity alert: Average turnover is only KSh ${(avg20DayTurnoverKes / 1000).toFixed(0)}k. High slippage on exit.`;
    } else if (spreadBps && spreadBps > 150) {
      warningNote = `Wide bid-ask spread (${spreadBps} bps / ${spreadKes} KSh) creates significant friction.`;
    } else if (daysToLiquidate > 3) {
      warningNote = `Exit capacity constrained: estimated ${daysToLiquidate} days to liquidate position cleanly.`;
    }

    return {
      dailyTurnoverKes,
      avg20DayTurnoverKes: Number(avg20DayTurnoverKes.toFixed(2)),
      turnoverRatio,
      relativeVolume,
      spreadKes,
      spreadBps,
      daysToLiquidate,
      classification,
      warningNote
    };
  }
}

export const liquidityService = new LiquidityService();
