/**
 * Portfolio Management & Position Intelligence Engine
 * 
 * Strict Principle:
 * - Manual position entry and tracking only (no automated execution).
 * - Exact deterministic tracking of P/L, KSh/share movement, MFE, MAE, and Profit Giveback.
 * - Rigorous Hold-vs-Exit analysis based on evidence, not emotions.
 */

import { Portfolio, PortfolioPosition, Trade, TradingJournalEntry } from '../../types/index.ts';
import {
  calculateInvestedValue,
  calculateCurrentValue,
  calculateUnrealizedPl,
  calculateMfe,
  calculateMae,
  calculateProfitGiveback
} from '../quantitative/calculations.ts';
import { queryAll, queryOne, runCommand } from '../../db/database.ts';
import { logger } from '../logger.ts';

export class PortfolioService {
  /**
   * Recalculates position metrics against current live/observed market price
   */
  public updatePositionMetrics(
    position: PortfolioPosition,
    currentPrice: number,
    previousClosePrice?: number
  ): PortfolioPosition {
    const prevClose = previousClosePrice ?? position.previousClosePrice ?? position.averageEntryPrice;
    const { grossPlKes, plPct, kshMovementPerShare } = calculateUnrealizedPl(
      position.shares,
      position.averageEntryPrice,
      currentPrice
    );

    // Peak profit tracking: if current PL exceeds recorded peak, update peak
    const newPeakPlKes = Math.max(position.peakUnrealizedPlKes || 0, grossPlKes);
    const { givebackKes, givebackPct } = calculateProfitGiveback(newPeakPlKes, grossPlKes);

    // MFE / MAE tracking
    const highestPriceSoFar = Math.max(position.averageEntryPrice, currentPrice, (position.maximumFavorableExcursionKes / position.shares) + position.averageEntryPrice);
    const lowestPriceSoFar = Math.min(position.averageEntryPrice, currentPrice, position.averageEntryPrice - (position.maximumAdverseExcursionKes / position.shares));
    
    const mfeKes = calculateMfe(position.shares, position.averageEntryPrice, highestPriceSoFar);
    const maeKes = calculateMae(position.shares, position.averageEntryPrice, lowestPriceSoFar);

    // Hold-vs-Exit analysis
    let pullbackRisk: PortfolioPosition['pullbackRiskRating'] = 'NORMAL';
    let recommendation: 'HOLD' | 'TRIM' | 'EXIT' | 'TIGHTEN_STOP' = 'HOLD';
    const reasons: string[] = [];

    if (newPeakPlKes > 0 && givebackPct > 35) {
      pullbackRisk = 'HIGH_GIVEBACK_RISK';
      recommendation = 'TRIM';
      reasons.push(`Profit giveback has reached ${givebackPct}% of peak profit (${givebackKes.toFixed(2)} KSh surrendered).`);
    } else if (position.stopLossPriceKes && currentPrice <= position.stopLossPriceKes) {
      pullbackRisk = 'HIGH_GIVEBACK_RISK';
      recommendation = 'EXIT';
      reasons.push(`Price has breached user-defined stop loss of ${position.stopLossPriceKes} KSh.`);
    } else if (position.targetPriceKes && currentPrice >= position.targetPriceKes) {
      recommendation = 'TRIM';
      reasons.push(`Price achieved target profit price of ${position.targetPriceKes} KSh.`);
    } else {
      reasons.push(`Unrealized position is performing normally (+${kshMovementPerShare} KSh/share).`);
    }

    return {
      ...position,
      currentPrice,
      previousClosePrice: prevClose,
      investedValueKes: calculateInvestedValue(position.shares, position.averageEntryPrice),
      currentValueKes: calculateCurrentValue(position.shares, currentPrice),
      grossUnrealizedPlKes: grossPlKes,
      percentagePl: plPct,
      kshMovementPerShare,
      peakUnrealizedPlKes: newPeakPlKes,
      profitGivebackKes: givebackKes,
      profitGivebackPct: givebackPct,
      maximumAdverseExcursionKes: maeKes,
      maximumFavorableExcursionKes: mfeKes,
      pullbackRiskRating: pullbackRisk,
      holdVsExitAssessment: {
        recommendation,
        reasons,
        evidenceMetrics: {
          kshMovementPerShare,
          givebackPct,
          givebackKes,
          mfeKes,
          maeKes
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Retrieves all positions from persistent SQLite database
   */
  public async getPositions(): Promise<PortfolioPosition[]> {
    try {
      const rows = await queryAll<any>('SELECT * FROM portfolio_positions');
      return rows.map(r => ({
        id: r.id,
        portfolioId: r.portfolio_id,
        stockId: r.stock_id,
        symbol: r.symbol,
        shares: r.shares,
        averageEntryPrice: r.average_entry_price,
        currentPrice: r.current_price,
        previousClosePrice: r.previous_close_price,
        investedValueKes: r.invested_value_kes,
        currentValueKes: r.current_value_kes,
        grossUnrealizedPlKes: r.gross_unrealized_pl_kes,
        percentagePl: r.percentage_pl,
        kshMovementPerShare: r.ksh_movement_per_share,
        peakUnrealizedPlKes: r.peak_unrealized_pl_kes,
        profitGivebackKes: r.profit_giveback_kes,
        profitGivebackPct: r.profit_giveback_pct,
        maximumAdverseExcursionKes: r.maximum_adverse_excursion_kes,
        maximumFavorableExcursionKes: r.maximum_favorable_excursion_kes,
        holdingDurationDays: r.holding_duration_days,
        entryDate: r.entry_date,
        notes: r.notes,
        targetPriceKes: r.target_price_kes,
        stopLossPriceKes: r.stop_loss_price_kes,
        pullbackRiskRating: r.pullback_risk_rating,
        holdVsExitAssessment: r.hold_vs_exit_json ? JSON.parse(r.hold_vs_exit_json) : undefined,
        updatedAt: r.updated_at
      }));
    } catch (err: any) {
      logger.error('PortfolioService', 'Error fetching positions', err);
      return [];
    }
  }

  /**
   * Saves or creates a manual position
   */
  public async savePosition(pos: PortfolioPosition): Promise<void> {
    await runCommand(
      `INSERT OR REPLACE INTO portfolio_positions (
        id, portfolio_id, stock_id, symbol, shares, average_entry_price, current_price,
        previous_close_price, invested_value_kes, current_value_kes, gross_unrealized_pl_kes,
        percentage_pl, ksh_movement_per_share, peak_unrealized_pl_kes, profit_giveback_kes,
        profit_giveback_pct, maximum_adverse_excursion_kes, maximum_favorable_excursion_kes,
        holding_duration_days, entry_date, notes, target_price_kes, stop_loss_price_kes,
        pullback_risk_rating, hold_vs_exit_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pos.id, pos.portfolioId, pos.stockId, pos.symbol, pos.shares, pos.averageEntryPrice,
        pos.currentPrice, pos.previousClosePrice, pos.investedValueKes, pos.currentValueKes,
        pos.grossUnrealizedPlKes, pos.percentagePl, pos.kshMovementPerShare, pos.peakUnrealizedPlKes,
        pos.profitGivebackKes, pos.profitGivebackPct, pos.maximumAdverseExcursionKes,
        pos.maximumFavorableExcursionKes, pos.holdingDurationDays, pos.entryDate, pos.notes,
        pos.targetPriceKes, pos.stopLossPriceKes, pos.pullbackRiskRating,
        pos.holdVsExitAssessment ? JSON.stringify(pos.holdVsExitAssessment) : null,
        pos.updatedAt
      ]
    );
  }

  /**
   * Deletes a position by ID
   */
  public async deletePosition(id: string): Promise<void> {
    await runCommand('DELETE FROM portfolio_positions WHERE id = ?', [id]);
  }
}

export const portfolioService = new PortfolioService();
