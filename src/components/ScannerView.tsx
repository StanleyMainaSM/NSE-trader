/**
 * Opportunity Scanner View
 * Context-aware opportunity detection rejecting simplistic 'biggest gainer' biases.
 */

import React, { useState } from 'react';
import { Radar, Filter, ShieldAlert, ArrowUpRight, Flame, ChevronRight } from 'lucide-react';
import { ScannerCandidate } from '../types/index.ts';

interface ScannerViewProps {
  candidates: ScannerCandidate[];
  onSelectStock: (symbol: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  candidates,
  onSelectStock
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const types = ['ALL', 'BREAKOUT', 'HEALTHY_PULLBACK', 'MOMENTUM_ACCELERATION', 'RECOVERY_BOUNCE'];

  const filtered = candidates.filter(c => {
    if (filterType === 'ALL') return true;
    return c.opportunityType === filterType;
  });

  return (
    <div id="scanner-view-root" className="space-y-4 font-mono">
      {/* Scanner Principles Header */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Extensible Opportunity Scanner
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Evaluates KSh/share movement, relative volume (RVOL), ATR pullback tolerance, and minimum exit liquidity.
            </p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Type:
            </span>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-[11px] text-slate-400">
          <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="font-bold text-slate-300 block">KSh Movement Threshold:</span>
            <span>Screens for absolute KSh/share value expansion (minimum +0.20 KSh).</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="font-bold text-slate-300 block">Liquidity Gate:</span>
            <span>Enforces active trading volume to ensure institutional or swing exitability.</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="font-bold text-slate-300 block">Pullback Health:</span>
            <span>Distinguishes normal 1.5x ATR pullbacks from structural breakdowns.</span>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(c => {
          const isUp = c.changeKes >= 0;
          return (
            <div 
              key={c.stockId}
              onClick={() => onSelectStock(c.symbol)}
              className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
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
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Regime: {c.currentRegime} &bull; RVOL: {c.relativeVolume}x &bull; ATR: {c.atrKes.toFixed(2)} KSh ({c.normalizedAtrPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-slate-100">{c.currentPriceKes.toFixed(2)} KSh</span>
                    <span className={`text-xs font-bold block ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{c.changeKes.toFixed(2)} KSh ({c.changePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Rationale & Risk */}
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

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>Turnover: KSh {(c.dailyTurnoverKes / 1000000).toFixed(2)}M</span>
                  <span>&bull;</span>
                  <span>Volume: {c.dailyVolume.toLocaleString()} shs</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span>Inspect Setup</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="lg:col-span-2 py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
            No candidates found matching selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
