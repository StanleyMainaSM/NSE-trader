/**
 * Terminal Header Component
 * Shows System Time (EAT), Aggregated Data Freshness, Demo Isolation Badge, and Global Health.
 */

import React from 'react';
import { Activity, ShieldAlert, Clock, RefreshCw, Database } from 'lucide-react';
import { DataFreshness } from '../types/index.ts';

interface HeaderProps {
  freshness: DataFreshness;
  isDemoFixture: boolean;
  lastUpdated: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  freshness,
  isDemoFixture,
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  const getFreshnessBadge = () => {
    switch (freshness) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE FEED
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            DELAYED FEED
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950 text-orange-400 border border-orange-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
            STALE DATA
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <header id="terminal-header" className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Brand & Market Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
            NSE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
                Trading Intelligence System
              </h1>
              <span className="text-[11px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
                v1.0-alpha
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Private Analytical Terminal &bull; Nairobi Securities Exchange
            </p>
          </div>
        </div>

        {/* Real-time Status and Data Provenance Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isDemoFixture && (
            <div 
              id="demo-warning-banner"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium"
              title="Demo data is sandboxed for algorithmic testing. No real money trades should be based on simulated fixtures."
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>DEMO DATA — NOT REAL MARKET DATA</span>
            </div>
          )}

          {getFreshnessBadge()}

          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : '--:--:--'} EAT</span>
          </div>

          <button
            id="header-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

      </div>
    </header>
  );
};
