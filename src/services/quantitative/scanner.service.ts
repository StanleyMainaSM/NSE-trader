/**
 * Extensible Opportunity Scanner Framework
 * 
 * Strict Principle:
 * - Rejects simplistic "biggest gainer = best setup" bias.
 * - Evaluates opportunity strictly in context: KSh/share movement, net KSh profit after
 *   transaction costs, volume expansion, pullback health, and exit liquidity.
 * - Categorizes setups and flags NO_TRADE states with deterministic rationale.
 */

import { ScannerCandidate, ScannerCriteria, IntradayPrice, PriceBar, MarketRegimeType } from '../../types/index.ts';
import { stockRegimeService } from './stock-regime.service.ts';
import { opportunityService } from './opportunity.service.ts';

const SYMBOL_METADATA: Record<string, { name: string; sector: string }> = {
  SCOM: { name: 'Safaricom PLC', sector: 'TELECOMMUNICATIONS' },
  EQTY: { name: 'Equity Group Holdings', sector: 'BANKING' },
  KCB: { name: 'KCB Group PLC', sector: 'BANKING' },
  EABL: { name: 'East African Breweries Ltd', sector: 'MANUFACTURING' },
  BAT: { name: 'British American Tobacco Kenya', sector: 'MANUFACTURING' },
  ABSA: { name: 'ABSA Bank Kenya PLC', sector: 'BANKING' },
  SCBK: { name: 'Standard Chartered Bank Kenya', sector: 'BANKING' },
  COOP: { name: 'Co-operative Bank of Kenya', sector: 'BANKING' },
  NCBA: { name: 'NCBA Group PLC', sector: 'BANKING' },
  KGEN: { name: 'Kenya Electricity Generating Co', sector: 'ENERGY' },
  BAMB: { name: 'Bamburi Cement PLC', sector: 'CONSTRUCTION' },
  TOTAL: { name: 'TotalEnergies Marketing Kenya', sector: 'ENERGY' }
};

export class ScannerService {
  public scan(
    quotes: IntradayPrice[],
    barsBySymbol: Map<string, PriceBar[]>,
    criteria: ScannerCriteria = {},
    tradingCapitalKes = 100000,
    marketRegime: MarketRegimeType = 'NORMAL',
    isDemoFixture = false
  ): ScannerCandidate[] {
    const candidates: ScannerCandidate[] = [];

    const minKsh = criteria.minKshMovementPerShare ?? 0.10;
    const minPct = criteria.minPercentageChange ?? 0.25;
    const minRvol = criteria.minRelativeVolume ?? 0.8;
    const minTurnover = criteria.minDailyTurnoverKes ?? 500000; // 500k minimum threshold for scan
    const allowNoTrade = criteria.allowNoTrade ?? true;

    for (const quote of quotes) {
      const bars = barsBySymbol.get(quote.symbol) || [];
      const regime = stockRegimeService.evaluateStockRegime(quote, bars);

      // Perform deep quantitative evaluation
      const opp = opportunityService.evaluateOpportunity(
        quote,
        bars,
        tradingCapitalKes,
        marketRegime
      );

      // Criteria filtering
      if (criteria.regimesAllowed && criteria.regimesAllowed.length > 0) {
        if (!criteria.regimesAllowed.includes(regime.state)) {
          continue;
        }
      }

      if (criteria.volatilityMode === 'ELEVATED_ONLY' && opp.volatilityExpansionRatio < 1.1) {
        continue;
      }

      if (criteria.volatilityMode === 'AMAC_LIKE_ONLY' && (opp.volatilityExpansionRatio < 1.25 || opp.relativeVolume < 1.4)) {
        continue;
      }

      // If NO_TRADE is filtered out and candidate is NO_TRADE
      if (opp.isNoTrade && !allowNoTrade) {
        continue;
      }

      // Filter by basic thresholds if not in allowNoTrade inspection mode
      if (!allowNoTrade) {
        if (quote.dayTurnoverKes < minTurnover) continue;
        if (opp.kshMovementPerShare < minKsh && Math.abs(opp.changePct) < minPct) continue;
        if (opp.relativeVolume < minRvol) continue;
      }

      const meta = SYMBOL_METADATA[quote.symbol] || { name: quote.symbol, sector: 'NSE' };

      let riskNote = '';
      if (opp.riskFlags.length > 0) {
        riskNote = opp.riskFlags.join('; ');
      } else if (opp.liquidityClassification === 'MODERATE') {
        riskNote = 'Moderate liquidity: Size orders prudently to limit price impact.';
      } else {
        riskNote = 'Standard execution parameters apply.';
      }

      candidates.push({
        stockId: quote.stockId,
        symbol: quote.symbol,
        name: meta.name,
        sector: meta.sector,
        currentPriceKes: quote.price,
        changeKes: quote.changeKes,
        changePct: quote.changePct,
        dailyVolume: quote.dayVolume,
        dailyTurnoverKes: quote.dayTurnoverKes,
        relativeVolume: opp.relativeVolume,
        atrKes: opp.atrKes,
        normalizedAtrPct: opp.normalizedAtrPct,
        currentRegime: regime.state,
        opportunityType: opp.setupType,
        opportunityScore: opp.opportunityScore,
        contextualRationale: opp.contextualRationale,
        riskNote,
        
        kshMovementPerShare: opp.kshMovementPerShare,
        percentageChange: opp.changePct,
        affordableShares: opp.affordableShares,
        grossOpportunityKes: opp.grossOpportunityKes,
        estimatedTransactionCostsKes: opp.estimatedTransactionCostsKes,
        estimatedNetOpportunityKes: opp.estimatedNetOpportunityKes,
        liquidityClassification: opp.liquidityClassification,
        supportLevelKes: opp.supportLevelKes,
        resistanceLevelKes: opp.resistanceLevelKes,
        distanceToSupportPct: opp.distanceToSupportPct,
        distanceToResistancePct: opp.distanceToResistancePct,
        pullbackDepthAtrMultiple: opp.pullbackDepthAtrMultiple,
        scoreComponents: opp.scoreComponents,
        riskFlags: opp.riskFlags,
        isNoTrade: opp.isNoTrade,
        noTradeReasons: opp.noTradeReasons,
        isDemoFixture,

        provenance: 'CALCULATED_METRIC',
        freshness: quote.freshness
      });
    }

    // Sort valid opportunities first by opportunity score descending, followed by NO_TRADE candidates
    return candidates.sort((a, b) => {
      if (a.isNoTrade && !b.isNoTrade) return 1;
      if (!a.isNoTrade && b.isNoTrade) return -1;
      return b.opportunityScore - a.opportunityScore;
    });
  }
}

export const scannerService = new ScannerService();
