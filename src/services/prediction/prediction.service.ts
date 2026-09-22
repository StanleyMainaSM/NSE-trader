/**
 * Statistical Scenario Probability & Prediction Accountability Engine
 * 
 * Strict Principle:
 * - NO arbitrary AI-generated percentages.
 * - Every probability MUST correspond to a concrete, verifiable setup condition
 *   (e.g. "+5.0% or +1.50 KSh before -3.0% or -0.90 KSh within 3 sessions").
 * - Must report historical sample size (N), confidence intervals, and track realized outcomes.
 */

import { Prediction, PredictionOutcome } from '../../types/index.ts';
import { queryAll, runCommand } from '../../db/database.ts';
import { logger } from '../logger.ts';

export class PredictionService {
  /**
   * Evaluates historical frequency of a setup outcome across defined sample
   */
  public createEmpiricalPrediction(params: {
    symbol: string;
    setupName: string;
    setupCriteria: string;
    horizonSessions: number;
    targetGainPct: number;
    adverseRiskPct: number;
    currentPriceKes: number;
    historicalHits: number;
    historicalSampleSize: number;
    modelVersion?: string;
  }): Prediction {
    const n = params.historicalSampleSize;
    if (n <= 0) {
      throw new Error('Historical sample size (N) must be > 0 to establish empirical probability.');
    }

    const calculatedProbability = Number((params.historicalHits / n).toFixed(4));
    
    // Wilson Score or Wald 95% confidence interval
    const z = 1.96;
    const p = calculatedProbability;
    const se = Math.sqrt((p * (1 - p)) / n);
    const ciLower = Math.max(0, Number((p - z * se).toFixed(3)));
    const ciUpper = Math.min(1, Number((p + z * se).toFixed(3)));

    const targetGainKes = Number((params.currentPriceKes * (params.targetGainPct / 100)).toFixed(2));
    const adverseRiskKes = Number((params.currentPriceKes * (params.adverseRiskPct / 100)).toFixed(2));

    const prediction: Prediction = {
      id: `pred-${params.symbol}-${Date.now()}`,
      assetSymbol: params.symbol,
      timestamp: new Date().toISOString(),
      setupName: params.setupName,
      setupCriteria: params.setupCriteria,
      predictionHorizonSessions: params.horizonSessions,
      targetCondition: `+${params.targetGainPct}% (+${targetGainKes} KSh) before -${params.adverseRiskPct}% (-${adverseRiskKes} KSh)`,
      adverseCondition: `-${params.adverseRiskPct}% stop threshold (-${adverseRiskKes} KSh)`,
      targetGainPct: params.targetGainPct,
      adverseRiskPct: params.adverseRiskPct,
      targetGainKes,
      adverseRiskKes,
      calculatedProbability,
      historicalSampleSize: n,
      confidenceInterval95Pct: [ciLower, ciUpper],
      modelVersion: params.modelVersion || 'v1.0-empirical-nse',
      isEmpirical: true,
      status: 'PENDING'
    };

    return prediction;
  }

  public async getRecentPredictions(): Promise<Prediction[]> {
    try {
      const rows = await queryAll<any>('SELECT * FROM predictions ORDER BY timestamp DESC LIMIT 30');
      return rows.map(r => ({
        id: r.id,
        assetSymbol: r.asset_symbol,
        timestamp: r.timestamp,
        setupName: r.setup_name,
        setupCriteria: r.setup_criteria,
        predictionHorizonSessions: r.prediction_horizon_sessions,
        targetCondition: r.target_condition,
        adverseCondition: r.adverse_condition,
        targetGainPct: r.target_gain_pct,
        adverseRiskPct: r.adverse_risk_pct,
        targetGainKes: r.target_gain_kes,
        adverseRiskKes: r.adverse_risk_kes,
        calculatedProbability: r.calculated_probability,
        historicalSampleSize: r.historical_sample_size,
        confidenceInterval95Pct: r.confidence_interval_json ? JSON.parse(r.confidence_interval_json) : undefined,
        modelVersion: r.model_version,
        isEmpirical: Boolean(r.is_empirical),
        status: r.status,
        outcomeVerifiedAt: r.outcome_verified_at,
        realizedGainKes: r.realized_gain_kes,
        realizedGainPct: r.realized_gain_pct,
        holdingSessionsActual: r.holding_sessions_actual
      }));
    } catch (err: any) {
      logger.error('PredictionService', 'Error fetching predictions', err);
      return [];
    }
  }
}

export const predictionService = new PredictionService();
