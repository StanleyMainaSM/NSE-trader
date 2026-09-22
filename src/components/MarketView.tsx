/**
 * Market Intelligence View
 * Detailed breakdown of benchmark indices (NASI, NSE20, NSE25), breadth, turnover,
 * advance/decline distribution, and sector performance.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Layers, BarChart3, PieChart } from 'lucide-react';
import { MarketIndex, MarketBreadth, MarketRegime } from '../types/index.ts';

interface MarketViewProps {
  indices: MarketIndex[];
  breadth: MarketBreadth | null;
  regime: MarketRegime | null;
}

export const MarketView: React.FC<MarketViewProps> = ({
  indices,
  breadth,
  regime
}) => {
  const sectors = [
    { name: 'Telecommunication & Technology', code: 'TELECOM', weight: 42.5, changePct: 1.25, turnoverKes: 185000000 },
    { name: 'Banking', code: 'BANKING', weight: 34.2, changePct: 0.85, turnoverKes: 165000000 },
    { name: 'Manufacturing & Allied', code: 'MANUFACTURING', weight: 12.0, changePct: -0.45, turnoverKes: 45000000 },
    { name: 'Energy & Petroleum', code: 'ENERGY', weight: 4.8, changePct: 0.10, turnoverKes: 12000000 },
    { name: 'Insurance', code: 'INSURANCE', weight: 2.5, changePct: -0.20, turnoverKes: 5500000 },
    { name: 'Investment & Services', code: 'INVESTMENT', weight: 1.8, changePct: 0.00, turnoverKes: 3200000 },
    { name: 'Commercial & Services', code: 'COMMERCIAL', weight: 1.2, changePct: 0.35, turnoverKes: 4800000 },
    { name: 'Agricultural', code: 'AGRICULTURAL', weight: 1.0, changePct: -0.15, turnoverKes: 1900000 }
  ];

  return (
    <div id="market-view-root" className="space-y-4">
      {/* Index Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indices.map(idx => {
          const isPositive = idx.changePct >= 0;
          return (
            <div key={idx.id} className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 font-mono">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-slate-400 font-bold">{idx.symbol}</span>
                  <h3 className="text-sm font-bold text-slate-200 mt-0.5">{idx.name}</h3>
                </div>
                <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                  isPositive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {isPositive ? '+' : ''}{idx.changePct.toFixed(2)}%
                </span>
              </div>

              <div className="mt-4 flex justify-between items-baseline">
                <span className="text-2xl font-bold text-slate-100">{idx.value.toFixed(2)}</span>
                <span className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}{idx.changeKes.toFixed(2)} points
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
                <span>Prev Close: {idx.previousClose.toFixed(2)}</span>
                <span>Day High/Low: {idx.high.toFixed(2)} / {idx.low.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Breadth & Participation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Advance / Decline Breakdown */}
        <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 font-mono">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Market Breadth & Participation
              </h3>
              <p className="text-[11px] text-slate-400">Advance/Decline health across active listed shares</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
              A/D: {breadth?.advanceDeclineRatio.toFixed(2) || '1.00'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded">
              <span className="text-[11px] text-emerald-400 font-semibold block">ADVANCERS</span>
              <span className="text-xl font-bold text-emerald-300 mt-1 block">
                {breadth?.advancingStocks || 0}
              </span>
              <span className="text-[10px] text-emerald-500">Positive sessions</span>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded">
              <span className="text-[11px] text-rose-400 font-semibold block">DECLINERS</span>
              <span className="text-xl font-bold text-rose-300 mt-1 block">
                {breadth?.decliningStocks || 0}
              </span>
              <span className="text-[10px] text-rose-500">Negative sessions</span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
              <span className="text-[11px] text-slate-400 font-semibold block">UNCHANGED</span>
              <span className="text-xl font-bold text-slate-300 mt-1 block">
                {breadth?.unchangedStocks || 0}
              </span>
              <span className="text-[10px] text-slate-500">Inactive or flat</span>
            </div>
          </div>

          {/* Visual distribution bar */}
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${((breadth?.advancingStocks || 1) / (breadth?.totalTradedStocks || 1)) * 100}%` }}
              />
              <div 
                className="bg-slate-600 transition-all duration-500" 
                style={{ width: `${((breadth?.unchangedStocks || 1) / (breadth?.totalTradedStocks || 1)) * 100}%` }}
              />
              <div 
                className="bg-rose-500 transition-all duration-500" 
                style={{ width: `${((breadth?.decliningStocks || 1) / (breadth?.totalTradedStocks || 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Advancing: {breadth ? Math.round((breadth.advancingStocks / breadth.totalTradedStocks) * 100) : 0}%</span>
              <span>Total Traded: {breadth?.totalTradedStocks || 0} Companies</span>
              <span>Declining: {breadth ? Math.round((breadth.decliningStocks / breadth.totalTradedStocks) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Aggregate Market Liquidity */}
        <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 font-mono">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Session Liquidity & Capital Flow
            </h3>
            <p className="text-[11px] text-slate-400">Volume and aggregate turnover metrics</p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400">Aggregate NSE Turnover:</span>
              <span className="text-sm font-bold text-slate-100">
                KSh {breadth ? (breadth.totalMarketTurnoverKes).toLocaleString() : '--'}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400">Shares Traded:</span>
              <span className="text-sm font-bold text-slate-100">
                {breadth ? (breadth.totalMarketVolume).toLocaleString() : '--'} shares
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400">Total Market Deals:</span>
              <span className="text-sm font-bold text-slate-100">
                {breadth?.dealsCount || '--'} deals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Performance Table */}
      <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 font-mono">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Sectoral Performance & Capital Allocation
          </h3>
          <p className="text-[11px] text-slate-400">Relative performance by Nairobi Securities Exchange sectors</p>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-semibold">Sector</th>
                <th className="pb-2 font-semibold text-right">Index Weight</th>
                <th className="pb-2 font-semibold text-right">Session Change</th>
                <th className="pb-2 font-semibold text-right">Session Turnover (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sectors.map(sec => {
                const isPos = sec.changePct >= 0;
                return (
                  <tr key={sec.code} className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-200">
                      <span className="font-bold">{sec.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({sec.code})</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300">{sec.weight.toFixed(1)}%</td>
                    <td className={`py-2.5 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{sec.changePct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 text-right text-slate-200">
                      KSh {(sec.turnoverKes / 1000000).toFixed(2)}M
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
