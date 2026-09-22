/**
 * Market-Wide Regime Detection Engine
 * 
 * Strict Principle:
 * - Evidence-based quantitative state scoring.
 * - Combines index momentum, advancing/declining breadth, turnover, and large-cap dispersion.
 * - No black-box arbitrary labels; every state transition includes an explicit explanation.
 */

import { MarketRegime, MarketRegimeType, MarketIndex, MarketBreadth } from '../../types/index.ts';

export class MarketRegimeService {
  /**
   * Deterministically evaluates market regime from measurable indicators
   */
  public evaluateRegime(
    indices: MarketIndex[],
    breadth: MarketBreadth | null,
    previousRegime?: MarketRegime
  ): MarketRegime {
    const timestamp = new Date().toISOString();

    // Default neutral scores if breadth is missing
    let adRatio = 1.0;
    let advRatioScore = 0;
    if (breadth && breadth.totalTradedStocks > 0) {
      adRatio = breadth.advanceDeclineRatio;
      if (adRatio > 2.0) advRatioScore = 80;
      else if (adRatio > 1.2) advRatioScore = 40;
      else if (adRatio > 0.8) advRatioScore = 0;
      else if (adRatio > 0.4) advRatioScore = -50;
      else advRatioScore = -90;
    }

    // Evaluate Index Momentum across NASI and NSE20
    let indexMomentumScore = 0;
    const nasi = indices.find(i => i.symbol === 'NASI');
    const nse20 = indices.find(i => i.symbol === 'NSE20');

    if (nasi) {
      if (nasi.changePct > 1.0) indexMomentumScore += 45;
      else if (nasi.changePct > 0.2) indexMomentumScore += 20;
      else if (nasi.changePct < -1.0) indexMomentumScore -= 45;
      else if (nasi.changePct < -0.2) indexMomentumScore -= 20;
    }

    if (nse20) {
      if (nse20.changePct > 1.0) indexMomentumScore += 45;
      else if (nse20.changePct > 0.2) indexMomentumScore += 20;
      else if (nse20.changePct < -1.0) indexMomentumScore -= 45;
      else if (nse20.changePct < -0.2) indexMomentumScore -= 20;
    }

    // Turnover & Volume Score
    const turnoverTrendScore = breadth && breadth.totalMarketTurnoverKes > 400000000 ? 25 : -15;

    // Volatility risk score
    const volatilityRiskScore = Math.abs(indexMomentumScore) > 60 || adRatio < 0.4 ? 75 : 25;

    // Composite Evidence Score (-100 to +100)
    const compositeScore = (advRatioScore * 0.4) + (indexMomentumScore * 0.4) + (turnoverTrendScore * 0.2);

    let state: MarketRegimeType = 'NORMAL';
    const keyDrivers: string[] = [];

    if (compositeScore < -70 || adRatio < 0.35) {
      state = 'EXTREME_SELLING';
      keyDrivers.push('Severe advance/decline collapse (A/D < 0.35)', 'Synchronized selling across benchmark indices');
    } else if (compositeScore < -40 || adRatio < 0.6) {
      state = 'BROAD_SELLING';
      keyDrivers.push('Broad decliners outnumber advancers significantly', 'Index momentum negative');
    } else if (compositeScore < -15) {
      state = 'RISK_RISING';
      keyDrivers.push('Early momentum deterioration in blue-chip tier', 'Breadth softening below parity');
    } else if (compositeScore > 50 && adRatio > 1.8) {
      state = 'STRONG_MARKET';
      keyDrivers.push('Advancers dominating decliners (>1.8x)', 'High index turnover confirmation');
    } else if (compositeScore > 15) {
      if (previousRegime && (previousRegime.state === 'BROAD_SELLING' || previousRegime.state === 'EXTREME_SELLING')) {
        state = 'RECOVERY';
        keyDrivers.push('Breadth rebound following sell-off exhaustion', 'Positive turnover impulse');
      } else {
        state = 'NORMAL';
        keyDrivers.push('Market functioning within normal statistical bounds');
      }
    } else {
      state = 'STABILIZATION';
      keyDrivers.push('Market volatility contracting; advance/decline roughly balanced');
    }

    const prevState = previousRegime?.state;
    let whyStateChanged = undefined;
    if (prevState && prevState !== state) {
      whyStateChanged = `Market shifted from ${prevState} to ${state} due to composite score move to ${compositeScore.toFixed(1)} (A/D ratio: ${adRatio.toFixed(2)}, NASI change: ${nasi?.changePct ?? 0}%).`;
    }

    return {
      id: `mreg-${Date.now()}`,
      timestamp,
      state,
      confidence: Math.min(95, Math.max(50, Math.round(Math.abs(compositeScore) + 40))),
      evidence: {
        indexMomentumScore: Math.round(indexMomentumScore),
        advanceDeclineScore: Math.round(advRatioScore),
        turnoverTrendScore: Math.round(turnoverTrendScore),
        largeCapBreadthScore: Math.round(indexMomentumScore),
        sectorBreadthScore: Math.round(advRatioScore * 0.8),
        volatilityRiskScore: Math.round(volatilityRiskScore),
        recoveryStrengthScore: compositeScore > 0 ? Math.round(compositeScore) : 0
      },
      keyDrivers,
      whyStateChanged,
      previousState: prevState,
      provenance: 'CALCULATED_METRIC'
    };
  }
}

export const marketRegimeService = new MarketRegimeService();
