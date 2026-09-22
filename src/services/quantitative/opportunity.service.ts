/**
 * KSh Opportunity & Generalized High-Opportunity Volatility Profile Engine
 * 
 * Strict Principle:
 * - Rejects percentage-only bias: Evaluates absolute KSh gains relative to position sizing and friction.
 * - Generalized high-opportunity profile (volatility expansion, RVOL, KSh movement, clean structure).
 * - Not hardcoded to any single ticker.
 * - Deterministic, non-stochastic, transparent component breakdown.
 */

import { IntradayPrice, PriceBar, StockRegimeType, MarketRegimeType, SetupType, LiquidityClassification } from '../../types/index.ts';
import { calculateAtr, calculateRelativeVolume, calculateVolatilityExpansionRatio, calculateSupportResistanceLevels, calculatePullbackMetrics } from './calculations.ts';
import { transactionCostService } from './transaction-cost.service.ts';
import { liquidityService } from './liquidity.service.ts';

export interface OpportunityScoreComponents {
  kshOpportunity: number;       // 0 - 25
  momentum: number;             // 0 - 20
  relativeVolume: number;       // 0 - 20
  volatilityExpansion: number;  // 0 - 15
  liquidity: number;            // 0 - 10
  priceStructure: number;       // 0 - 10
  penalties: number;            // >= 0 (subtracted)
}

export interface OpportunityAnalysis {
  symbol: string;
  currentPriceKes: number;
  changeKes: number;
  changePct: number;
  kshMovementPerShare: number;
  
  // Position-sized financial impact
  tradingCapitalKes: number;
  affordableShares: number;
  grossOpportunityKes: number;
  estimatedTransactionCostsKes: number;
  estimatedNetOpportunityKes: number;
  isProfitableAfterFriction: boolean;
  
  // Technical & Structure metrics
  atrKes: number;
  normalizedAtrPct: number;
  relativeVolume: number;
  volatilityExpansionRatio: number;
  liquidityClassification: LiquidityClassification;
  dailyTurnoverKes: number;
  
  // Setup & Scoring
  setupType: SetupType;
  opportunityScore: number; // 0 - 100
  scoreComponents: OpportunityScoreComponents;
  contextualRationale: string;
  riskFlags: string[];
  isNoTrade: boolean;
  noTradeReasons: string[];
  
  supportLevelKes?: number;
  resistanceLevelKes?: number;
  distanceToSupportPct?: number;
  distanceToResistancePct?: number;
  pullbackDepthAtrMultiple?: number;
}

export class OpportunityService {
  /**
   * Evaluates comprehensive KSh opportunity and setup profile for a stock
   */
  public evaluateOpportunity(
    quote: IntradayPrice,
    bars: PriceBar[],
    tradingCapitalKes = 100000,
    marketRegime: MarketRegimeType = 'NORMAL'
  ): OpportunityAnalysis {
    const symbol = quote.symbol;
    const currentPrice = quote.price;
    const changeKes = quote.changeKes;
    const changePct = quote.changePct;
    const absKshMove = Math.abs(changeKes);
    const absPctMove = Math.abs(changePct);

    // 1. Technical Indicators
    const { atrKes, normalizedAtrPct } = calculateAtr(bars, 14);
    const volExpansionRatio = calculateVolatilityExpansionRatio(bars, 14, 60);

    const avgVol20 = bars.length > 0
      ? bars.slice(-20).reduce((acc, b) => acc + b.volume, 0) / Math.min(20, bars.length)
      : quote.dayVolume;
    const rvol = calculateRelativeVolume(quote.dayVolume, avgVol20);

    const liquidity = liquidityService.evaluateLiquidity(quote, bars);

    // 2. Position Sizing & Real KSh Opportunity
    // Assume standard whole shares (NSE lots typically 100 shares, allow floor)
    const affordableShares = currentPrice > 0 ? Math.floor(tradingCapitalKes / currentPrice) : 0;
    
    // Potential target move: 1x ATR or observed movement
    const projectedTargetMoveKes = Math.max(absKshMove, atrKes > 0 ? atrKes : currentPrice * 0.02);
    const targetPrice = currentPrice + projectedTargetMoveKes;

    const roundTrip = transactionCostService.calculateRoundTrip(
      currentPrice,
      targetPrice,
      affordableShares,
      { liquidityTier: liquidity.classification }
    );

    const grossOpportunityKes = roundTrip.grossOpportunityKes;
    const estimatedTransactionCostsKes = roundTrip.totalFrictionKes;
    const estimatedNetOpportunityKes = roundTrip.netOpportunityKes;
    const isProfitableAfterFriction = roundTrip.isProfitableAfterFriction;

    // 3. Price Structure: Support, Resistance, Pullback
    const srLevels = calculateSupportResistanceLevels(bars, currentPrice);
    const pullback = calculatePullbackMetrics(currentPrice, bars, atrKes);

    let distanceToSupportPct: number | undefined;
    let distanceToResistancePct: number | undefined;

    if (srLevels.primarySupport && srLevels.primarySupport > 0) {
      distanceToSupportPct = Number((((currentPrice - srLevels.primarySupport) / currentPrice) * 100).toFixed(2));
    }
    if (srLevels.primaryResistance && srLevels.primaryResistance > 0) {
      distanceToResistancePct = Number((((srLevels.primaryResistance - currentPrice) / currentPrice) * 100).toFixed(2));
    }

    // 4. Setup Classification & Scoring Components
    const riskFlags: string[] = [];
    const noTradeReasons: string[] = [];

    // Component scores
    let compKsh = 0;
    let compMom = 0;
    let compRvol = 0;
    let compVolExp = 0;
    let compLiq = 0;
    let compStruct = 0;
    let penalties = 0;

    // A. KSh Opportunity Component (0 - 25)
    // Rewards meaningful absolute KSh movement and positive net opportunity
    if (absKshMove >= 1.0) compKsh += 15;
    else if (absKshMove >= 0.50) compKsh += 10;
    else if (absKshMove >= 0.20) compKsh += 6;

    if (estimatedNetOpportunityKes > 3000) compKsh += 10;
    else if (estimatedNetOpportunityKes > 1000) compKsh += 7;
    else if (estimatedNetOpportunityKes > 0) compKsh += 4;
    else penalties += 15; // Net friction exceeds profit

    // B. Momentum Component (0 - 20)
    if (changePct > 3.0) compMom += 20;
    else if (changePct > 1.5) compMom += 14;
    else if (changePct > 0.5) compMom += 8;
    else if (changePct < -3.0) compMom += 2; // Potential sharp mean-reversion watch

    // C. Relative Volume Component (0 - 20)
    if (rvol >= 2.5) compRvol += 20;
    else if (rvol >= 1.8) compRvol += 16;
    else if (rvol >= 1.2) compRvol += 10;
    else if (rvol < 0.8) penalties += 5; // Dry volume

    // D. Volatility Expansion Component (0 - 15)
    if (volExpansionRatio >= 1.4) compVolExp += 15;
    else if (volExpansionRatio >= 1.1) compVolExp += 10;
    else if (volExpansionRatio >= 0.9) compVolExp += 5;

    // E. Liquidity Component (0 - 10)
    if (liquidity.classification === 'VERY_LIQUID') compLiq += 10;
    else if (liquidity.classification === 'LIQUID') compLiq += 8;
    else if (liquidity.classification === 'MODERATE') compLiq += 5;
    else if (liquidity.classification === 'THIN') {
      compLiq += 2;
      penalties += 10;
      riskFlags.push('THIN_LIQUIDITY');
    } else {
      penalties += 25;
      riskFlags.push('ILLIQUID_MARKET');
    }

    // F. Price Structure Component (0 - 10)
    if (srLevels.primaryResistance && currentPrice > srLevels.primaryResistance) {
      compStruct += 10; // Clean breakout above resistance
    } else if (pullback.isNormalPullback && distanceToSupportPct && distanceToSupportPct < 2.0) {
      compStruct += 9; // Near support with normal pullback
    } else if (distanceToSupportPct && distanceToSupportPct < 3.0) {
      compStruct += 6;
    } else {
      compStruct += 4;
    }

    // G. Penalty Checks
    // Check for overextension
    if (distanceToSupportPct && distanceToSupportPct > 10.0) {
      penalties += 15;
      riskFlags.push('OVEREXTENDED_FROM_SUPPORT');
    }
    if (pullback.isBreakdown) {
      penalties += 25;
      riskFlags.push('STRUCTURAL_BREAKDOWN');
    }
    if (quote.freshness === 'STALE' || quote.freshness === 'UNAVAILABLE') {
      penalties += 30;
      riskFlags.push('STALE_OR_UNAVAILABLE_DATA');
    }
    if (marketRegime === 'EXTREME_SELLING' && changePct < 0) {
      penalties += 20;
      riskFlags.push('MARKET_REGIME_HEADWIND');
    }

    // Compute raw opportunity score clamped to 0 - 100
    const rawScore = (compKsh + compMom + compRvol + compVolExp + compLiq + compStruct) - penalties;
    const opportunityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // 5. Determine Setup Type & NO_TRADE logic
    let setupType: SetupType = 'CONSOLIDATION';
    let contextualRationale = '';

    if (changePct > 2.0 && rvol >= 1.5 && (!srLevels.primaryResistance || currentPrice >= srLevels.primaryResistance)) {
      setupType = 'BREAKOUT';
      contextualRationale = `Breakout expansion: +${absKshMove.toFixed(2)} KSh (+${changePct.toFixed(2)}%) on ${rvol.toFixed(1)}x volume expansion.`;
    } else if (rvol >= 1.4 && changePct > 1.0) {
      setupType = 'MOMENTUM_ACCELERATION';
      contextualRationale = `Momentum acceleration: Volume expanding to ${rvol.toFixed(1)}x average with +${changePct.toFixed(2)}% advance.`;
    } else if (pullback.isNormalPullback && changePct < 0 && changePct > -2.5) {
      setupType = 'HEALTHY_PULLBACK';
      contextualRationale = `Controlled pullback of ${pullback.pullbackKes.toFixed(2)} KSh (${pullback.pullbackAtrMultiple.toFixed(1)}x ATR) into support.`;
    } else if (volExpansionRatio >= 1.3 && absKshMove >= 0.50) {
      setupType = 'VOLATILITY_EXPANSION';
      contextualRationale = `Volatility surge: Daily ATR expanding to ${volExpansionRatio.toFixed(1)}x baseline with ${absKshMove.toFixed(2)} KSh range.`;
    } else if (pullback.highestPrice > currentPrice * 1.05 && changePct > 1.2) {
      setupType = 'RECOVERY';
      contextualRationale = `Technical recovery bounce: Positive price impulse following stabilization.`;
    } else if (pullback.isBreakdown) {
      setupType = 'BREAKDOWN_RISK';
      contextualRationale = `Breakdown warning: Price surrendered ${pullback.pullbackAtrMultiple.toFixed(1)}x ATR (${pullback.pullbackKes.toFixed(2)} KSh).`;
    } else if (distanceToSupportPct && distanceToSupportPct > 8.0 && changePct > 4.0) {
      setupType = 'EXTENDED_MOVE';
      contextualRationale = `Extended move: ${distanceToSupportPct.toFixed(1)}% above support; high risk of mean-reversion pullbacks.`;
    } else {
      setupType = 'CONSOLIDATION';
      contextualRationale = `Range-bound consolidation within typical daily statistical volatility.`;
    }

    // 6. Explicit NO_TRADE conditions
    let isNoTrade = false;

    if (liquidity.classification === 'VERY_THIN') {
      isNoTrade = true;
      noTradeReasons.push('Insufficient exit liquidity (< 500k KSh daily turnover)');
    }
    if (quote.freshness === 'STALE' || quote.freshness === 'UNAVAILABLE') {
      isNoTrade = true;
      noTradeReasons.push('Stale or unavailable market data prohibits deterministic execution');
    }
    if (estimatedNetOpportunityKes <= 0) {
      isNoTrade = true;
      noTradeReasons.push('Transaction friction (fees + slippage) exceeds projected KSh gain');
    }
    if (liquidity.spreadBps && liquidity.spreadBps > 250) {
      isNoTrade = true;
      noTradeReasons.push(`Excessive bid-ask spread (${liquidity.spreadBps} bps) renders setup uneconomic`);
    }
    if (pullback.isBreakdown) {
      isNoTrade = true;
      noTradeReasons.push('Severe structural breakdown violates risk management parameters');
    }
    if (marketRegime === 'EXTREME_SELLING' && setupType === 'BREAKOUT') {
      isNoTrade = true;
      noTradeReasons.push('Breakout attempts during EXTREME_SELLING market regime face severe failure rates');
    }
    if (bars.length < 10) {
      isNoTrade = true;
      noTradeReasons.push('Insufficient historical observations (< 10 bars) to validate setup');
    }

    if (isNoTrade) {
      setupType = 'NO_TRADE';
    }

    return {
      symbol,
      currentPriceKes: currentPrice,
      changeKes,
      changePct,
      kshMovementPerShare: absKshMove,
      tradingCapitalKes,
      affordableShares,
      grossOpportunityKes,
      estimatedTransactionCostsKes,
      estimatedNetOpportunityKes,
      isProfitableAfterFriction,
      atrKes,
      normalizedAtrPct,
      relativeVolume: rvol,
      volatilityExpansionRatio: volExpansionRatio,
      liquidityClassification: liquidity.classification,
      dailyTurnoverKes: quote.dayTurnoverKes,
      setupType,
      opportunityScore,
      scoreComponents: {
        kshOpportunity: compKsh,
        momentum: compMom,
        relativeVolume: compRvol,
        volatilityExpansion: compVolExp,
        liquidity: compLiq,
        priceStructure: compStruct,
        penalties
      },
      contextualRationale,
      riskFlags,
      isNoTrade,
      noTradeReasons,
      supportLevelKes: srLevels.primarySupport ?? undefined,
      resistanceLevelKes: srLevels.primaryResistance ?? undefined,
      distanceToSupportPct,
      distanceToResistancePct,
      pullbackDepthAtrMultiple: pullback.pullbackAtrMultiple
    };
  }
}

export const opportunityService = new OpportunityService();
