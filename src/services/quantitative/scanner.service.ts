/**
 * Extensible Opportunity Scanner Framework
 * 
 * Strict Principle:
 * - Rejects simplistic "biggest gainer = best setup" bias.
 * - Evaluates opportunity strictly in context: KSh/share movement, volume expansion,
 *   pullback health, and minimum exit liquidity.
 */

import { ScannerCandidate, ScannerCriteria, IntradayPrice, PriceBar, StockRegime } from '../../types/index.ts';
import { calculateAtr, calculateRelativeVolume } from './calculations.ts';
import { stockRegimeService } from './stock-regime.service.ts';

export class ScannerService {
  public scan(
    quotes: IntradayPrice[],
    barsBySymbol: Map<string, PriceBar[]>,
    criteria: ScannerCriteria = {}
  ): ScannerCandidate[] {
    const candidates: ScannerCandidate[] = [];

    const minKsh = criteria.minKshMovementPerShare ?? 0.20;
    const minPct = criteria.minPercentageChange ?? 0.5;
    const minRvol = criteria.minRelativeVolume ?? 1.1;
    const minTurnover = criteria.minDailyTurnoverKes ?? 10000000; // 10M KSh default liquidity threshold

    for (const quote of quotes) {
      // 1. Minimum liquidity check for NSE exitability
      if (quote.dayTurnoverKes < minTurnover) {
        continue;
      }

      const bars = barsBySymbol.get(quote.symbol) || [];
      const { atrKes, normalizedAtrPct } = calculateAtr(bars, 14);
      const avgVol20 = bars.length > 0 
        ? bars.slice(-20).reduce((acc, b) => acc + b.volume, 0) / Math.min(20, bars.length)
        : quote.dayVolume;
      const rvol = calculateRelativeVolume(quote.dayVolume, avgVol20);

      const regime = stockRegimeService.evaluateStockRegime(quote, bars);

      const absKshMove = Math.abs(quote.changeKes);
      const absPctMove = Math.abs(quote.changePct);

      // Criteria filtering
      if (absKshMove < minKsh && absPctMove < minPct) {
        continue;
      }

      let opportunityType: ScannerCandidate['opportunityType'] = 'MOMENTUM_ACCELERATION';
      let score = 50;
      let rationale = '';
      let riskNote = '';

      if (quote.changePct > 2.0 && rvol >= 1.5) {
        opportunityType = 'BREAKOUT';
        score = Math.min(95, 60 + Math.round(rvol * 10) + Math.round(quote.changePct * 4));
        rationale = `Strong breakout impulse of +${quote.changeKes} KSh (+${quote.changePct}%) with ${rvol}x relative volume expansion.`;
        riskNote = `Watch for intraday profit-taking near prior structural highs.`;
      } else if (regime.isNormalPullback && quote.changePct < 0 && quote.changePct > -2.0) {
        opportunityType = 'HEALTHY_PULLBACK';
        score = 72;
        rationale = `Controlled pullback of only ${Math.abs(quote.changeKes)} KSh within normal 1.5x ATR tolerance.`;
        riskNote = `Ensure support holds before committing capital.`;
      } else if (rvol >= minRvol && quote.changePct > 1.0) {
        opportunityType = 'MOMENTUM_ACCELERATION';
        score = 68;
        rationale = `Positive momentum tick accompanied by above-average liquidity participation (${rvol}x RVOL).`;
        riskNote = `Evaluate sector breadth before entering.`;
      } else if (quote.changePct > 1.5 && regime.state === 'RECOVERY') {
        opportunityType = 'RECOVERY_BOUNCE';
        score = 65;
        rationale = `Early recovery reversal off support zone with positive price response.`;
        riskNote = `High failure risk if broad market enters sell-off.`;
      } else {
        continue;
      }

      candidates.push({
        stockId: quote.stockId,
        symbol: quote.symbol,
        name: quote.symbol, // mapped by UI
        sector: 'NSE',
        currentPriceKes: quote.price,
        changeKes: quote.changeKes,
        changePct: quote.changePct,
        dailyVolume: quote.dayVolume,
        dailyTurnoverKes: quote.dayTurnoverKes,
        relativeVolume: rvol,
        atrKes,
        normalizedAtrPct,
        currentRegime: regime.state,
        opportunityType,
        opportunityScore: score,
        contextualRationale: rationale,
        riskNote,
        provenance: 'CALCULATED_METRIC',
        freshness: quote.freshness
      });
    }

    // Sort by opportunity score descending
    return candidates.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }
}

export const scannerService = new ScannerService();
