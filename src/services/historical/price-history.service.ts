/**
 * Historical Price Data Storage & Retrieval Service
 * 
 * Strict Principle:
 * - Deterministic SQLite persistence for multi-timeframe price bars (1m, 5m, 15m, 1h, 1d, 1w).
 * - Full deduplication, validation, and provenance preservation.
 * - Guarantees chronological ordering and zero look-ahead bias.
 */

import { PriceBar, TimeFrame } from '../../types/index.ts';
import { queryAll, queryOne, runCommand, getDatabase, saveDatabase } from '../../db/database.ts';
import { dataQualityService } from '../validation/data-quality.service.ts';
import { logger } from '../logger.ts';

export class PriceHistoryService {
  /**
   * Stores or updates a collection of price bars into SQLite with deduplication
   */
  public async upsertPriceBars(bars: PriceBar[]): Promise<{ inserted: number; errors: number }> {
    if (!bars || bars.length === 0) return { inserted: 0, errors: 0 };

    let inserted = 0;
    let errors = 0;
    const db = await getDatabase();

    const insertSql = `
      INSERT OR REPLACE INTO price_bars (
        id, stock_id, symbol, timeframe, timestamp,
        open, high, low, close, volume, turnover_kes,
        trades_count, vwap, is_completed, data_source_id,
        provenance, freshness
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const bar of bars) {
      const validation = dataQualityService.validatePriceBar(bar);
      if (!validation.isValid) {
        errors++;
        continue;
      }

      try {
        const id = bar.id || `bar-${bar.symbol.toLowerCase()}-${bar.timeframe}-${bar.timestamp}`;
        db.run(insertSql, [
          id,
          bar.stockId || `stk-${bar.symbol.toLowerCase()}`,
          bar.symbol.toUpperCase(),
          bar.timeframe,
          bar.timestamp,
          bar.open,
          bar.high,
          bar.low,
          bar.close,
          bar.volume,
          bar.turnoverKes,
          bar.tradesCount ?? null,
          bar.vwap ?? null,
          bar.isCompleted ? 1 : 0,
          bar.dataSourceId || 'system',
          bar.provenance || 'ESTIMATE',
          bar.freshness || 'HISTORICAL'
        ]);
        inserted++;
      } catch (err) {
        errors++;
        logger.error('PriceHistoryService', `Failed to insert bar for ${bar.symbol}`, err);
      }
    }

    saveDatabase();
    return { inserted, errors };
  }

  /**
   * Retrieves historical price bars sorted chronologically (ascending timestamp)
   */
  public async getPriceBars(
    symbol: string,
    timeframe: TimeFrame = '1d',
    options?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PriceBar[]> {
    let sql = `
      SELECT * FROM price_bars 
      WHERE symbol = ? AND timeframe = ?
    `;
    const params: any[] = [symbol.toUpperCase(), timeframe];

    if (options?.startDate) {
      sql += ` AND timestamp >= ?`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ` AND timestamp <= ?`;
      params.push(options.endDate);
    }

    sql += ` ORDER BY timestamp ASC`;

    if (options?.limit && options.limit > 0) {
      // If limit is specified with no startDate, we want the most recent N bars in chronological order
      if (!options.startDate) {
        sql = `
          SELECT * FROM (
            SELECT * FROM price_bars 
            WHERE symbol = ? AND timeframe = ?
            ORDER BY timestamp DESC
            LIMIT ?
          ) ORDER BY timestamp ASC
        `;
        params.splice(2, 0, options.limit);
      } else {
        sql += ` LIMIT ?`;
        params.push(options.limit);
      }
    }

    const rows = await queryAll(sql, params);
    return rows.map(r => ({
      id: r.id,
      stockId: r.stock_id,
      symbol: r.symbol,
      timeframe: r.timeframe as TimeFrame,
      timestamp: r.timestamp,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
      turnoverKes: r.turnover_kes,
      tradesCount: r.trades_count ?? undefined,
      vwap: r.vwap ?? undefined,
      isCompleted: Boolean(r.is_completed),
      dataSourceId: r.data_source_id,
      provenance: r.provenance,
      freshness: r.freshness
    }));
  }

  /**
   * Returns the most recent bar for a symbol & timeframe
   */
  public async getLatestBar(symbol: string, timeframe: TimeFrame = '1d'): Promise<PriceBar | null> {
    const row = await queryOne(`
      SELECT * FROM price_bars 
      WHERE symbol = ? AND timeframe = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [symbol.toUpperCase(), timeframe]);

    if (!row) return null;

    return {
      id: row.id,
      stockId: row.stock_id,
      symbol: row.symbol,
      timeframe: row.timeframe as TimeFrame,
      timestamp: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
      turnoverKes: row.turnover_kes,
      tradesCount: row.trades_count ?? undefined,
      vwap: row.vwap ?? undefined,
      isCompleted: Boolean(row.is_completed),
      dataSourceId: row.data_source_id,
      provenance: row.provenance,
      freshness: row.freshness
    };
  }

  /**
   * Returns summary of available bars per timeframe for a symbol
   */
  public async getTimeframeSummary(symbol: string): Promise<{
    timeframe: string;
    count: number;
    firstTimestamp: string;
    lastTimestamp: string;
  }[]> {
    const rows = await queryAll(`
      SELECT 
        timeframe,
        COUNT(*) as count,
        MIN(timestamp) as first_timestamp,
        MAX(timestamp) as last_timestamp
      FROM price_bars
      WHERE symbol = ?
      GROUP BY timeframe
    `, [symbol.toUpperCase()]);

    return rows.map(r => ({
      timeframe: r.timeframe,
      count: r.count,
      firstTimestamp: r.first_timestamp,
      lastTimestamp: r.last_timestamp
    }));
  }
}

export const priceHistoryService = new PriceHistoryService();
