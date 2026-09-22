/**
 * Opportunity Scanner View
 * 
 * Strict Principle:
 * - Displays net KSh opportunity alongside percentage gain.
 * - Enforces realistic round-trip NSE transaction cost deductions and slippage.
 * - Features explicit NO_TRADE discipline tags and reasons.
 * - Displays clear liquidity classification and data provenance.
 */

import React, { useState } from 'react';
import { 
  Radar, 
  Filter, 
  ShieldAlert, 
  ArrowUpRight, 
  ChevronRight, 
  Coins, 
  AlertTriangle, 
  ShieldCheck, 
  Activity,
  Layers,
  Ban
} from 'lucide-react';
import { ScannerCandidate, LiquidityClassification } from '../types/index.ts';

interface ScannerViewProps {
  candidates: ScannerCandidate[];
  onSelectStock: (symbol: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  candidates,
  onSelectStock
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showNoTradeOnly, setShowNoTradeOnly] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<number>(0);

  const types = ['ALL', 'BREAKOUT', 'HEALTHY_PULLBACK', 'MOMENTUM_ACCELERATION', 'RECOVERY_BOUNCE'];

  const filtered = candidates.filter(c => {
    if (showNoTradeOnly) {
      if (!c.isNoTrade) return false;
    }
    if (filterType !== 'ALL' && c.opportunityType !== filterType) {
      return false;
    }
    if (c.opportunityScore !== undefined && c.opportunityScore < minScore) {
      return false;
    }
    return true;
  });

  const viableCount = candidates.filter(c => !c.isNoTrade).length;
  const noTradeCount = candidates.filter(c => c.isNoTrade).length;
  const isDemo = candidates.some(c => c.isDemoFixture);

  const getLiquidityBadge = (tier?: LiquidityClassification) => {
    switch (tier) {
      case 'HIGH_LIQUIDITY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">TIER-1 HIGH</span>;
      case 'MODERATE_LIQUIDITY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">TIER-2 MODERATE</span>;
      case 'LOW_LIQUIDITY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">TIER-3 THIN</span>;
      case 'ILLIQUID':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">ILLIQUID / UNTRADABLE</span>;
      default:
        return null;
    }
  };

  return (
    <div id="scanner-view-root" className="space-y-4 font-mono">
      {/* Scanner Principles Header */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Quantitative Opportunity Scanner & Net KSh Engine
              </h2>
              {isDemo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
                  SIMULATION FIXTURE DATA
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enforces real NSE round-trip transaction costs (~1.85% + VAT), order book slippage, and capital allocation gating.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowNoTradeOnly(!showNoTradeOnly)}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                showNoTradeOnly 
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700 font-bold' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Ban className="w-3 h-3" />
              NO_TRADE Setups ({noTradeCount})
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Setup:
              </span>
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                    filterType === t
                      ? 'bg-slate-700 text-emerald-400 font-bold border border-slate-600'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-[11px]">
          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase">Viable Candidates</span>
            <span className="text-sm font-bold text-emerald-400">{viableCount} Setups</span>
            <span className="text-[10px] text-slate-500 block">Surpassed fee & liquidity threshold</span>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase">NO_TRADE Rejections</span>
            <span className="text-sm font-bold text-rose-400">{noTradeCount} Setups</span>
            <span className="text-[10px] text-slate-500 block">Friction or liquidity prohibitive</span>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase">Transaction Friction</span>
            <span className="text-sm font-bold text-slate-200">1.85% + VAT + Slip</span>
            <span className="text-[10px] text-slate-500 block">CMA, NSE, CDSC, ICF statutory</span>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] uppercase">Calculations Mode</span>
            <span className="text-sm font-bold text-slate-200">Deterministic Pure Math</span>
            <span className="text-[10px] text-slate-500 block">Zero AI hallucinated scores</span>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(c => {
          const isUp = c.changeKes >= 0;
          const isNoTrade = Boolean(c.isNoTrade);

          return (
            <div 
              key={c.stockId}
              onClick={() => onSelectStock(c.symbol)}
              className={`p-4 rounded-lg transition cursor-pointer flex flex-col justify-between border ${
                isNoTrade
                  ? 'bg-slate-950/70 border-rose-900/50 hover:border-rose-700/80'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-100">{c.symbol}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        c.opportunityType === 'BREAKOUT' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : c.opportunityType === 'HEALTHY_PULLBACK'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {c.opportunityType.replace('_', ' ')}
                      </span>
                      {getLiquidityBadge(c.liquidityClassification)}
                      {c.opportunityScore !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          Score: {c.opportunityScore}/100
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Regime: <strong className="text-slate-300">{c.currentRegime}</strong> &bull; RVOL: {c.relativeVolume}x &bull; ATR: {c.atrKes.toFixed(2)} KSh ({c.normalizedAtrPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-slate-100">{c.currentPriceKes.toFixed(2)} KSh</span>
                    <span className={`text-xs font-bold block ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{c.changeKes.toFixed(2)} KSh ({c.changePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* NO_TRADE Alert or Net KSh Breakdown */}
                {isNoTrade ? (
                  <div className="mt-3 p-2.5 bg-rose-950/40 rounded border border-rose-900/80 text-rose-300 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <Ban className="w-3.5 h-3.5" />
                      <span>NO_TRADE DISCIPLINE TRIGGERED</span>
                    </div>
                    <p className="mt-1 text-[11px] text-rose-200">
                      {c.noTradeReason || 'Expected gain does not sufficiently clear round-trip transaction costs and slippage.'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-950/70 rounded border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Net Opportunity</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {c.netOpportunityKes !== undefined 
                          ? `+${c.netOpportunityKes.toLocaleString()} KSh` 
                          : `+${(c.changeKes * 1000).toFixed(0)} KSh`}
                      </span>
                      <span className="text-[10px] text-emerald-500 block">
                        ({c.netOpportunityPct !== undefined ? `+${c.netOpportunityPct.toFixed(2)}%` : `+${c.changePct.toFixed(2)}%`})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Friction Est.</span>
                      <span className="text-xs font-bold text-slate-300">
                        {c.estimatedRoundTripCostKes !== undefined 
                          ? `${c.estimatedRoundTripCostKes.toLocaleString()} KSh` 
                          : '1.85%'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Slip: {c.estimatedSlippageBps ?? 20} bps
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Break-Even</span>
                      <span className="text-xs font-bold text-amber-400">
                        {c.breakEvenPriceKes !== undefined 
                          ? `${c.breakEvenPriceKes.toFixed(2)} KSh` 
                          : `${(c.currentPriceKes * 1.0185).toFixed(2)} KSh`}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Req: +{((((c.breakEvenPriceKes || c.currentPriceKes * 1.0185) - c.currentPriceKes) / c.currentPriceKes) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Contextual Rationale */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 text-slate-300">
                    <span className="font-semibold text-emerald-400 mr-1">RATIONALE:</span>
                    {c.contextualRationale}
                  </div>
                  {c.riskNote && (
                    <div className="p-2 bg-slate-950/40 rounded border border-slate-800/60 text-slate-400">
                      <span className="font-semibold text-amber-400 mr-1">RISK NOTE:</span>
                      {c.riskNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Turnover: KSh {(c.dailyTurnoverKes / 1000000).toFixed(2)}M</span>
                  <span>&bull;</span>
                  <span>Vol: {c.dailyVolume.toLocaleString()}</span>
                  {c.exitTurnoverRatio !== undefined && (
                    <>
                      <span>&bull;</span>
                      <span className={c.exitTurnoverRatio > 0.05 ? 'text-amber-400' : 'text-slate-400'}>
                        Exit: {(c.exitTurnoverRatio * 100).toFixed(1)}% of adv
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span>Inspect Stock</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="lg:col-span-2 py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
            No candidates found matching selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
