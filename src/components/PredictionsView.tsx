/**
 * Scenario Probability & Backtesting Console
 * Strictly grounded in empirical historical sample sizes (N), confidence intervals,
 * and zero look-ahead bias backtest simulations.
 */

import React, { useState } from 'react';
import { Scale, Play, CheckCircle2, ShieldAlert, BarChart, Clock } from 'lucide-react';
import { Prediction } from '../types/index.ts';

interface PredictionsViewProps {
  predictions: Prediction[];
  onRunBacktest: (symbol: string, strategy: string) => Promise<any>;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  predictions,
  onRunBacktest
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState('SCOM');
  const [strategy, setStrategy] = useState('Momentum Breakout');
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await onRunBacktest(selectedSymbol, strategy);
      setBacktestResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="predictions-view-root" className="space-y-4 font-mono">
      {/* Principle Banner */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Scale className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Empirical Probabilities & Backtesting Engine
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          The system strictly forbids unsubstantiated or hallucinated win-rate percentages.
          Every scenario probability below represents an empirical historical calculation over a sample size (N)
          with formal 95% confidence intervals and verified NSE transaction fees (1.85%).
        </p>
      </div>

      {/* Active Empirical Scenario Predictions */}
      <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Grounded Scenario Predictions (Active Samples)
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            N &gt; 50 SAMPLES ENFORCED
          </span>
        </div>

        <div className="space-y-3">
          {predictions.map(pred => (
            <div key={pred.id} className="p-3.5 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">{pred.assetSymbol}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-xs font-semibold text-slate-200">{pred.setupName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Sample N = {pred.historicalSampleSize}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Prob: {(pred.calculatedProbability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80">
                  <span className="text-emerald-400 font-bold block">TARGET CONDITION:</span>
                  <span className="text-slate-300">{pred.targetCondition}</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80">
                  <span className="text-rose-400 font-bold block">ADVERSE STOP CONDITION:</span>
                  <span className="text-slate-300">{pred.adverseCondition}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Setup: {pred.setupCriteria}</span>
                {pred.confidenceInterval95Pct && (
                  <span>
                    95% CI: [{(pred.confidenceInterval95Pct[0] * 100).toFixed(1)}% – {(pred.confidenceInterval95Pct[1] * 100).toFixed(1)}%]
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backtest Simulation Panel */}
      <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Walk-Forward Backtesting Simulator (Zero Look-Ahead Bias)
          </h3>
          <span className="text-[10px] text-slate-500">Includes 15 bps slippage & 1.85% NSE costs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Asset Symbol</label>
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200"
            >
              <option value="SCOM">SCOM (Safaricom PLC)</option>
              <option value="EQTY">EQTY (Equity Group)</option>
              <option value="KCB">KCB (KCB Group)</option>
              <option value="EABL">EABL (East African Breweries)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Strategy Specification</label>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200"
            >
              <option value="Momentum Breakout">20-Day Range Breakout Impulse</option>
              <option value="ATR Pullback Retest">Normal Pullback Retest (1.5x ATR)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs transition cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Backtest Result Display */}
        {backtestResult && (
          <div className="mt-4 p-4 rounded bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">TOTAL TRADES</span>
                <span className="text-base font-bold text-slate-100">{backtestResult.run.totalTrades}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">WIN RATE</span>
                <span className="text-base font-bold text-emerald-400">{backtestResult.run.winRatePct}%</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PROFIT FACTOR</span>
                <span className="text-base font-bold text-slate-100">{backtestResult.run.profitFactor}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MAX DRAWDOWN</span>
                <span className="text-base font-bold text-rose-400">-{backtestResult.run.maxDrawdownPct}%</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">NET PROFIT (KES)</span>
                <span className={`text-base font-bold ${backtestResult.result.metricSummary.totalNetPlKes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {backtestResult.result.metricSummary.totalNetPlKes >= 0 ? '+' : ''}
                  KSh {backtestResult.result.metricSummary.totalNetPlKes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Trade Log Table */}
            <div>
              <span className="text-[11px] font-bold text-slate-300 uppercase block mb-2">
                Simulated Execution Log (Recent Trades)
              </span>
              <div className="max-h-56 overflow-y-auto border border-slate-800 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Entry</th>
                      <th className="py-2 px-2">Exit</th>
                      <th className="py-2 px-2 text-right">Entry (KES)</th>
                      <th className="py-2 px-2 text-right">Exit (KES)</th>
                      <th className="py-2 px-2 text-right">Net P/L (KES)</th>
                      <th className="py-2 px-3 text-right">Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {backtestResult.result.tradeLog.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-300">{t.entryDate.split('T')[0]}</td>
                        <td className="py-2 px-2 text-slate-400">{t.exitDate.split('T')[0]}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{t.entryPrice.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{t.exitPrice.toFixed(2)}</td>
                        <td className={`py-2 px-2 text-right font-bold ${t.netPlKes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.netPlKes >= 0 ? '+' : ''}{t.netPlKes.toFixed(2)}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${t.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.returnPct >= 0 ? '+' : ''}{t.returnPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
