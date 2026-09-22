/**
 * Portfolio & Position Intelligence View
 * Deterministic position tracking with absolute KSh/share movement, MAE/MFE,
 * profit giveback alerts, and hold-vs-exit assessment.
 */

import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, ShieldAlert, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle, Info } from 'lucide-react';
import { PortfolioPosition } from '../types/index.ts';

interface PortfolioViewProps {
  positions: PortfolioPosition[];
  onAddPosition: (pos: {
    symbol: string;
    shares: number;
    averageEntryPrice: number;
    notes?: string;
    targetPriceKes?: number;
    stopLossPriceKes?: number;
  }) => Promise<void>;
  onDeletePosition: (id: string) => Promise<void>;
  onSelectStock: (symbol: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  positions,
  onAddPosition,
  onDeletePosition,
  onSelectStock
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [symbol, setSymbol] = useState('SCOM');
  const [shares, setShares] = useState(1000);
  const [entryPrice, setEntryPrice] = useState(15.0);
  const [targetPrice, setTargetPrice] = useState<number | undefined>(17.0);
  const [stopLoss, setStopLoss] = useState<number | undefined>(14.2);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalInvested = positions.reduce((acc, p) => acc + p.investedValueKes, 0);
  const totalCurrent = positions.reduce((acc, p) => acc + p.currentValueKes, 0);
  const totalGrossPl = totalCurrent - totalInvested;
  const totalPlPct = totalInvested > 0 ? (totalGrossPl / totalInvested) * 100 : 0;
  const totalGiveback = positions.reduce((acc, p) => acc + p.profitGivebackKes, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !entryPrice) return;
    setIsSubmitting(true);
    try {
      await onAddPosition({
        symbol: symbol.toUpperCase(),
        shares: Number(shares),
        averageEntryPrice: Number(entryPrice),
        targetPriceKes: targetPrice ? Number(targetPrice) : undefined,
        stopLossPriceKes: stopLoss ? Number(stopLoss) : undefined,
        notes
      });
      setShowAddModal(false);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="portfolio-view-root" className="space-y-4 font-mono">
      {/* Top Portfolio Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">INVESTED CAPITAL</span>
          <span className="text-xl font-bold text-slate-100 mt-1 block">
            KSh {totalInvested.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">{positions.length} Active Positions</span>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">CURRENT MARKET VALUE</span>
          <span className="text-xl font-bold text-slate-100 mt-1 block">
            KSh {totalCurrent.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Live mark-to-market</span>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">GROSS UNREALIZED P/L</span>
          <span className={`text-xl font-bold mt-1 block ${totalGrossPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalGrossPl >= 0 ? '+' : ''}KSh {totalGrossPl.toLocaleString()}
          </span>
          <span className={`text-[11px] font-bold ${totalGrossPl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalGrossPl >= 0 ? '+' : ''}{totalPlPct.toFixed(2)}% return
          </span>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold block">TOTAL PROFIT GIVEBACK</span>
          <span className={`text-xl font-bold mt-1 block ${totalGiveback > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            KSh {totalGiveback.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Surrendered from peak high</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Open Positions & Hold-vs-Exit Analysis
          </h2>
          <p className="text-[11px] text-slate-400">
            Track movement in KSh per share and maximum excursions (MAE / MFE).
          </p>
        </div>
        <button
          id="btn-open-add-position"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      {/* Positions Table */}
      <div className="rounded-lg bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">Symbol / Shares</th>
                <th className="py-3 px-2 text-right">Entry Price</th>
                <th className="py-3 px-2 text-right">Current Price</th>
                <th className="py-3 px-2 text-right">KSh/Share Move</th>
                <th className="py-3 px-2 text-right">Unrealized P/L</th>
                <th className="py-3 px-2 text-right">Peak P/L</th>
                <th className="py-3 px-2 text-right">Giveback</th>
                <th className="py-3 px-2 text-right">MFE / MAE</th>
                <th className="py-3 px-2 text-center">Recommendation</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {positions.map(p => {
                const isProfitable = p.grossUnrealizedPlKes >= 0;
                const rec = p.holdVsExitAssessment?.recommendation || 'HOLD';
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td 
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => onSelectStock(p.symbol)}
                    >
                      <span className="font-bold text-slate-100 hover:text-emerald-400">{p.symbol}</span>
                      <div className="text-[11px] text-slate-400">{p.shares.toLocaleString()} shares</div>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-300 font-bold">
                      {p.averageEntryPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-100 font-bold">
                      {p.currentPrice.toFixed(2)}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold ${p.kshMovementPerShare >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.kshMovementPerShare >= 0 ? '+' : ''}{p.kshMovementPerShare.toFixed(2)} KSh
                    </td>
                    <td className={`py-3 px-2 text-right font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <div>{isProfitable ? '+' : ''}KSh {p.grossUnrealizedPlKes.toLocaleString()}</div>
                      <div className="text-[10px] font-normal">({isProfitable ? '+' : ''}{p.percentagePl.toFixed(2)}%)</div>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-300">
                      KSh {(p.peakUnrealizedPlKes || 0).toLocaleString()}
                    </td>
                    <td className={`py-3 px-2 text-right ${p.profitGivebackPct > 20 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                      {p.profitGivebackPct > 0 ? `${p.profitGivebackPct}% (KSh ${p.profitGivebackKes.toLocaleString()})` : '0%'}
                    </td>
                    <td className="py-3 px-2 text-right text-[11px] text-slate-400">
                      <span className="text-emerald-500">+{p.maximumFavorableExcursionKes.toLocaleString()}</span> /{' '}
                      <span className="text-rose-500">-{p.maximumAdverseExcursionKes.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        rec === 'EXIT' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        rec === 'TRIM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {rec}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeletePosition(p.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Delete position"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    No active positions. Click 'Add Position' to manually record an NSE trade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Position Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Record Manual NSE Position
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Stock Ticker Symbol</label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 uppercase"
                  placeholder="e.g. SCOM, EQTY, EABL"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Number of Shares</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={shares}
                    onChange={e => setShares(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Average Entry Price (KES)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    min="0.05"
                    value={entryPrice}
                    onChange={e => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Price (KES)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={targetPrice || ''}
                    onChange={e => setTargetPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                    placeholder="Optional target"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stop Loss (KES)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={stopLoss || ''}
                    onChange={e => setStopLoss(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                    placeholder="Optional stop"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Entry Rationale / Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
                  placeholder="e.g. Breakout retest of 14.80 support..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
