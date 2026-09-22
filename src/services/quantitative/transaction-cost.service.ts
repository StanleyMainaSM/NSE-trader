/**
 * Central Nairobi Securities Exchange (NSE) Transaction Cost Engine
 * 
 * Strict Principle:
 * - Deterministic financial modeling with explicit assumptions.
 * - Accurately reflects NSE regulatory levies, CMA fees, CDSC transaction fees,
 *   brokerage commission, VAT on commissions, and estimated liquidity slippage.
 * - Marked explicitly as ASSUMPTION.
 */

import { ObservationType, LiquidityClassification } from '../../types/index.ts';

export interface NseTransactionCostConfig {
  brokerCommissionRatePct: number; // Standard retail max 1.50% - 1.85%
  cmaLevyPct: number;             // Capital Markets Authority: 0.12%
  nseLevyPct: number;             // Nairobi Securities Exchange: 0.12%
  cdscLevyPct: number;            // Central Depository & Settlement Corporation: 0.08%
  icfLevyPct: number;             // Investor Compensation Fund: 0.01%
  vatOnBrokerPct: number;         // 16.0% VAT on broker fee only
  defaultSlippageBps: number;     // Configurable execution slippage assumption (bps)
}

export interface TransactionCostBreakdown {
  considerationKes: number;
  brokerFeeKes: number;
  cmaLevyKes: number;
  nseLevyKes: number;
  cdscLevyKes: number;
  icfLevyKes: number;
  vatKes: number;
  statutoryLeviesTotalKes: number;
  slippageKes: number;
  totalCostKes: number;
  effectiveRatePct: number;
  provenance: ObservationType;
}

export interface RoundTripCostBreakdown {
  buyConsiderationKes: number;
  sellConsiderationKes: number;
  buyCosts: TransactionCostBreakdown;
  sellCosts: TransactionCostBreakdown;
  totalFrictionKes: number;
  effectiveRoundTripPct: number;
  grossOpportunityKes: number;
  netOpportunityKes: number;
  isProfitableAfterFriction: boolean;
  provenance: ObservationType;
}

export class TransactionCostService {
  private defaultConfig: NseTransactionCostConfig = {
    brokerCommissionRatePct: 1.50, // 1.50% broker base
    cmaLevyPct: 0.12,
    nseLevyPct: 0.12,
    cdscLevyPct: 0.08,
    icfLevyPct: 0.01,
    vatOnBrokerPct: 16.0,
    defaultSlippageBps: 15 // 15 bps default
  };

  /**
   * Returns slippage assumption in basis points based on liquidity classification
   */
  public getSlippageAssumptionBps(tier: LiquidityClassification): number {
    switch (tier) {
      case 'VERY_LIQUID': return 10;
      case 'LIQUID': return 20;
      case 'MODERATE': return 40;
      case 'THIN': return 80;
      case 'VERY_THIN': return 150;
      case 'UNAVAILABLE': return 50;
      default: return 20;
    }
  }

  /**
   * Calculates single-leg (Buy or Sell) fees and levies
   */
  public calculateSingleLegCosts(
    considerationKes: number,
    options?: {
      brokerRatePct?: number;
      slippageBps?: number;
      liquidityTier?: LiquidityClassification;
    }
  ): TransactionCostBreakdown {
    if (considerationKes <= 0 || isNaN(considerationKes)) {
      return {
        considerationKes: 0,
        brokerFeeKes: 0,
        cmaLevyKes: 0,
        nseLevyKes: 0,
        cdscLevyKes: 0,
        icfLevyKes: 0,
        vatKes: 0,
        statutoryLeviesTotalKes: 0,
        slippageKes: 0,
        totalCostKes: 0,
        effectiveRatePct: 0,
        provenance: 'ASSUMPTION'
      };
    }

    const brokerRate = options?.brokerRatePct ?? this.defaultConfig.brokerCommissionRatePct;
    let slippageBps = options?.slippageBps;
    if (slippageBps === undefined && options?.liquidityTier) {
      slippageBps = this.getSlippageAssumptionBps(options.liquidityTier);
    } else if (slippageBps === undefined) {
      slippageBps = this.defaultConfig.defaultSlippageBps;
    }

    const brokerFeeKes = Number((considerationKes * (brokerRate / 100)).toFixed(2));
    const vatKes = Number((brokerFeeKes * (this.defaultConfig.vatOnBrokerPct / 100)).toFixed(2));
    
    const cmaLevyKes = Number((considerationKes * (this.defaultConfig.cmaLevyPct / 100)).toFixed(2));
    const nseLevyKes = Number((considerationKes * (this.defaultConfig.nseLevyPct / 100)).toFixed(2));
    const cdscLevyKes = Number((considerationKes * (this.defaultConfig.cdscLevyPct / 100)).toFixed(2));
    const icfLevyKes = Number((considerationKes * (this.defaultConfig.icfLevyPct / 100)).toFixed(2));

    const statutoryLeviesTotalKes = Number((cmaLevyKes + nseLevyKes + cdscLevyKes + icfLevyKes).toFixed(2));
    const slippageKes = Number((considerationKes * (slippageBps / 10000)).toFixed(2));

    const totalCostKes = Number((brokerFeeKes + vatKes + statutoryLeviesTotalKes + slippageKes).toFixed(2));
    const effectiveRatePct = Number(((totalCostKes / considerationKes) * 100).toFixed(3));

    return {
      considerationKes: Number(considerationKes.toFixed(2)),
      brokerFeeKes,
      cmaLevyKes,
      nseLevyKes,
      cdscLevyKes,
      icfLevyKes,
      vatKes,
      statutoryLeviesTotalKes,
      slippageKes,
      totalCostKes,
      effectiveRatePct,
      provenance: 'ASSUMPTION'
    };
  }

  /**
   * Calculates comprehensive round-trip costs and net opportunity in KSh
   */
  public calculateRoundTrip(
    entryPrice: number,
    targetPrice: number,
    shares: number,
    options?: {
      brokerRatePct?: number;
      slippageBps?: number;
      liquidityTier?: LiquidityClassification;
    }
  ): RoundTripCostBreakdown {
    if (entryPrice <= 0 || targetPrice <= 0 || shares <= 0) {
      const emptyBreakdown = this.calculateSingleLegCosts(0);
      return {
        buyConsiderationKes: 0,
        sellConsiderationKes: 0,
        buyCosts: emptyBreakdown,
        sellCosts: emptyBreakdown,
        totalFrictionKes: 0,
        effectiveRoundTripPct: 0,
        grossOpportunityKes: 0,
        netOpportunityKes: 0,
        isProfitableAfterFriction: false,
        provenance: 'ASSUMPTION'
      };
    }

    const buyConsideration = entryPrice * shares;
    const sellConsideration = targetPrice * shares;
    const grossOpportunityKes = Number(((targetPrice - entryPrice) * shares).toFixed(2));

    const buyCosts = this.calculateSingleLegCosts(buyConsideration, options);
    const sellCosts = this.calculateSingleLegCosts(sellConsideration, options);

    const totalFrictionKes = Number((buyCosts.totalCostKes + sellCosts.totalCostKes).toFixed(2));
    const netOpportunityKes = Number((grossOpportunityKes - totalFrictionKes).toFixed(2));
    const effectiveRoundTripPct = buyConsideration > 0 
      ? Number(((totalFrictionKes / buyConsideration) * 100).toFixed(3)) 
      : 0;

    return {
      buyConsiderationKes: Number(buyConsideration.toFixed(2)),
      sellConsiderationKes: Number(sellConsideration.toFixed(2)),
      buyCosts,
      sellCosts,
      totalFrictionKes,
      effectiveRoundTripPct,
      grossOpportunityKes,
      netOpportunityKes,
      isProfitableAfterFriction: netOpportunityKes > 0,
      provenance: 'ASSUMPTION'
    };
  }
}

export const transactionCostService = new TransactionCostService();
