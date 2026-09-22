/**
 * Primary Command Center Dashboard View
 * Directly answers the 8 fundamental trading intelligence questions on screen 1.
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import { 
  MarketIndex, 
  MarketBreadth, 
  MarketRegime, 
  PortfolioPosition, 
  ScannerCandidate, 
  Alert, 
  NewsArticle,
  DataQualitySummary,
  DataFreshness
} from '../types/index.ts';
import { DataQualityBanner } from './DataQualityBanner.tsx';

interface DashboardViewProps {
  indices: MarketIndex[];
  breadth: MarketBreadth | null;
  regime: MarketRegime | null;
  positions: PortfolioPosition[];
  candidates: ScannerCandidate[];
  alerts: Alert[];
  news: NewsArticle[];
  dataQuality?: DataQualitySummary | null;
  freshness?: DataFreshness;
  isDemoFixture?: boolean;
  onSelectStock: (symbol: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  indices,
  breadth,
  regime,
  positions,
  candidates,
  alerts,
  news,
  dataQuality,
  freshness = 'DELAYED',
  isDemoFixture = true,
  onSelectStock,
  onNavigateTab
}) => {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING');
  const givebackPositions = positions.filter(p => p.profitGivebackPct > 20);

  // Helper for regime coloring
  const getRegimeColor = (state?: string) => {
    switch (state) {
      case 'STRONG_MARKET':
      case 'RECOVERY':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      case 'NORMAL':
      case 'STABILIZATION':
        return 'text-sky-400 bg-sky-950/80 border-sky-800';
      case 'EARLY_WEAKNESS':
      case 'RISK_RISING':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'BROAD_SELLING':
      case 'EXTREME_SELLING':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div id="dashboard-view-root" className="space-y-4">
      
      {/* Top Governance Bar: Ingestion, Validation & Latency SLA Monitor */}
      <DataQualityBanner
        dataQuality={dataQuality || null}
        freshness={freshness}
        isDemoFixture={Boolean(isDemoFixture)}
      />

      {/* Primary Analytics Grid: Attention Matrix & Market State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Card 1 & 2: Market State & Risk Meter */}
        <div id="dash-market-regime-card" className="lg:col-span-2 rounded-lg bg-slate-900/80 border border-slate-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  1. Current Market Regime & Risk State
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  EVIDENCE-BASED
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  (regime?.freshness || freshness) === 'LIVE' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {regime?.freshness || freshness}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated from real-time momentum, advance/decline distribution, and turnover.
              </p>
            </div>
            {regime && (
              <div className={`px-3 py-1 rounded border text-xs font-mono font-bold ${getRegimeColor(regime.state)}`}>
                REGIME: {regime.state.replace('_', ' ')} ({regime.confidence}% Confidence)
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {/* Key Drivers */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                Evidence Drivers & Why Assessment Changed:
              </span>
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 text-xs text-slate-300 font-mono space-y-1">
                {regime?.whyStateChanged ? (
                  <p className="text-amber-300/90 font-medium">
                    &bull; {regime.whyStateChanged}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    State remains steady in current session.
                  </p>
                )}
                {regime?.keyDrivers.map((driver, idx) => (
                  <p key={idx} className="text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">&rsaquo;</span>
                    <span>{driver}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Breadth Quick Stats */}
            <div className="bg-slate-950/40 p-2.5 rounded border border-slate-800/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Breadth Dynamics
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {breadth?.freshness || freshness}
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">A/D Ratio:</span>
                  <span className={`font-bold ${(breadth?.advanceDeclineRatio || 1) >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {breadth?.advanceDeclineRatio ? breadth.advanceDeclineRatio.toFixed(2) : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Adv / Dec / Unch:</span>
                  <span className="text-slate-200">
                    <span className="text-emerald-400 font-semibold">{breadth?.advancingStocks || 0}</span> /{' '}
                    <span className="text-rose-400 font-semibold">{breadth?.decliningStocks || 0}</span> /{' '}
                    <span className="text-slate-400">{breadth?.unchangedStocks || 0}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Market Turnover:</span>
                  <span className="text-slate-200 font-semibold">
                    KSh {breadth ? (breadth.totalMarketTurnoverKes / 1000000).toFixed(1) : '--'}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: What Needs Attention? */}
        <div id="dash-action-needed-card" className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Attention Required</span>
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                {activeAlerts.length} Active
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {givebackPositions.length > 0 && (
                <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 font-mono">
                  <span className="font-bold block">Profit Giveback Alert:</span>
                  {givebackPositions.map(p => (
                    <div key={p.id} className="mt-0.5 text-[11px] text-amber-200">
                      {p.symbol}: Gave back {p.profitGivebackPct}% of peak profit (surrendered KSh {p.profitGivebackKes.toLocaleString()}).
                    </div>
                  ))}
                </div>
              )}

              {activeAlerts.slice(0, 2).map(alert => (
                <div key={alert.id} className="p-2 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-0.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">{alert.type}</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString('en-GB')}</span>
                  </div>
                  <p className="text-slate-200 text-[11px] line-clamp-2">{alert.reason}</p>
                </div>
              ))}

              {givebackPositions.length === 0 && activeAlerts.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500 font-mono flex flex-col items-center gap-1">
                  <CheckCircle className="w-5 h-5 text-emerald-500/80" />
                  <span>No immediate risk breaches or stop exits triggered.</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ALERTS')}
            className="w-full mt-3 py-1.5 text-center text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition cursor-pointer"
          >
            Review All System Alerts &rsaquo;
          </button>
        </div>

      </div>

      {/* Row 2: Benchmark Indices Pulse */}
      <div id="dash-indices-bar" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map(idx => {
          const isUp = idx.changePct >= 0;
          return (
            <div key={idx.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 font-mono flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-300 font-bold block">{idx.symbol}</span>
                    <span className="text-[11px] text-slate-500 truncate block">{idx.name}</span>
                  </div>
                  <span className={`flex items-center text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                    {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-baseline">
                  <span className="text-lg font-bold text-slate-100">{idx.value.toFixed(2)}</span>
                  <span className={`text-xs ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? '+' : ''}{idx.changeKes.toFixed(2)} pts
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
                <span className="px-1 rounded bg-slate-800 text-slate-400 font-semibold">{idx.freshness || freshness}</span>
                <span>{idx.provenance || 'ESTIMATE'}</span>
              </div>
            </div>
          );
        })}

        {/* Portfolio Quick Glance */}
        <div 
          onClick={() => onNavigateTab('PORTFOLIO')}
          className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 font-mono hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400 font-bold block">PERSONAL PORTFOLIO</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                {positions.length} OPEN
              </span>
            </div>
            <div className="mt-2 flex justify-between items-baseline">
              <span className="text-lg font-bold text-slate-100">
                KSh {positions.reduce((acc, p) => acc + p.currentValueKes, 0).toLocaleString()}
              </span>
              <span className={`text-xs font-bold ${positions.reduce((acc, p) => acc + p.grossUnrealizedPlKes, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {positions.reduce((acc, p) => acc + p.grossUnrealizedPlKes, 0) >= 0 ? '+' : ''}
                KSh {positions.reduce((acc, p) => acc + p.grossUnrealizedPlKes, 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
            <span className="px-1 rounded bg-slate-800 text-slate-400 font-semibold">{freshness}</span>
            <span>REAL-TIME VALUATION</span>
          </div>
        </div>
      </div>

      {/* Row 3: Two Column Layout: Moving Opportunities & Personal Positions Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Unusual Stocks & Scanner Candidates */}
        <div id="dash-scanner-preview" className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                  Unusual Movement & Scanner Setups
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {freshness}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Stocks exhibiting meaningful KSh movement and volume acceleration
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('SCANNER')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Scanner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {candidates.slice(0, 4).map(c => (
              <div 
                key={c.stockId}
                onClick={() => onSelectStock(c.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded transition cursor-pointer font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{c.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {c.opportunityType.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 text-slate-400">
                      {c.freshness || freshness}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.contextualRationale}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-100">{c.currentPriceKes.toFixed(2)} KSh</div>
                  <div className={`text-xs font-semibold ${c.changeKes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {c.changeKes >= 0 ? '+' : ''}{c.changeKes.toFixed(2)} KSh ({c.changePct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
            {candidates.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No stocks meeting current volatility/volume criteria.
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Real-Time Giveback & Position Health */}
        <div id="dash-portfolio-preview" className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                  Active Positions & Giveback Monitor
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {freshness}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tracks KSh/share movement, peak profit giveback, and hold-vs-exit status
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('PORTFOLIO')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Portfolio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {positions.map(p => (
              <div 
                key={p.id}
                onClick={() => onSelectStock(p.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded transition cursor-pointer font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{p.symbol}</span>
                    <span className="text-[11px] text-slate-400">{p.shares.toLocaleString()} shs @ {p.averageEntryPrice.toFixed(2)}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      p.holdVsExitAssessment?.recommendation === 'EXIT' 
                        ? 'bg-rose-900 text-rose-200' 
                        : p.holdVsExitAssessment?.recommendation === 'TRIM'
                        ? 'bg-amber-900 text-amber-200'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {p.holdVsExitAssessment?.recommendation || 'HOLD'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Move: <span className={p.kshMovementPerShare >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {p.kshMovementPerShare >= 0 ? '+' : ''}{p.kshMovementPerShare.toFixed(2)} KSh/share
                    </span>
                    {p.profitGivebackPct > 0 && (
                      <span className="text-amber-400 ml-2">
                        &bull; Giveback: {p.profitGivebackPct}%
                      </span>
                    )}
                    <span className="text-slate-500 ml-2">
                      &bull; {p.freshness || freshness}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-100">
                    KSh {p.currentValueKes.toLocaleString()}
                  </div>
                  <div className={`text-xs font-semibold ${p.grossUnrealizedPlKes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.grossUnrealizedPlKes >= 0 ? '+' : ''}KSh {p.grossUnrealizedPlKes.toLocaleString()} ({p.percentagePl.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}

            {positions.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No active positions recorded. Open the Portfolio tab to manually enter shares.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 4: Important News & Macro Transmission Preview */}
      <div id="dash-news-preview" className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Macro & Regulatory Intelligence
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
              FACT VS INTERPRETATION
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('NEWS')}
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>All Intelligence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {news.slice(0, 2).map(item => (
            <div key={item.id} className="p-3 rounded bg-slate-950/60 border border-slate-800/80 font-mono space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">{item.sourceName}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {item.freshness || 'LIVE'}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  item.classification === 'POTENTIALLY_MARKET_MOVING'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-sky-950 text-sky-300 border border-sky-800'
                }`}>
                  {item.classification.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 line-clamp-2">{item.headline}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">{item.summary}</p>
              {item.mentionedSymbols.length > 0 && (
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-500">AFFECTED:</span>
                  {item.mentionedSymbols.map(sym => (
                    <span key={sym} className="text-[10px] px-1 bg-slate-800 text-slate-300 rounded">
                      {sym}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
