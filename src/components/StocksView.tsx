/**
 * Stocks Catalog & Overview Component
 * Accurate listed NSE shares with tick sizes, sector mapping, and drill-down trigger.
 */

import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Stock } from '../types/index.ts';

interface StocksViewProps {
  stocks: any[];
  onSelectStock: (symbol: string) => void;
}

export const StocksView: React.FC<StocksViewProps> = ({
  stocks,
  onSelectStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  const sectors = ['ALL', 'BANKING', 'TELECOM', 'MANUFACTURING', 'ENERGY', 'INSURANCE'];

  const filteredStocks = stocks.filter(stk => {
    const matchesSearch = 
      stk.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stk.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || stk.sector_code === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div id="stocks-view-root" className="space-y-4 font-mono">
      {/* Search and Sector Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            id="stocks-search-input"
            type="text"
            placeholder="Search by ticker or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Sector:
          </span>
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                selectedSector === sec
                  ? 'bg-slate-700 text-emerald-400 font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Stocks Table */}
      <div className="rounded-lg bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">Symbol / Company</th>
                <th className="py-3 px-2">Sector</th>
                <th className="py-3 px-2 text-right">Price (KES)</th>
                <th className="py-3 px-2 text-right">Day Chg (KES)</th>
                <th className="py-3 px-2 text-right">Day Chg (%)</th>
                <th className="py-3 px-2 text-right">Day Volume</th>
                <th className="py-3 px-2 text-right">Day Turnover (KES)</th>
                <th className="py-3 px-2 text-right">Tick Size</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.map(stk => {
                const quote = stk.quote;
                const isPos = (quote?.changeKes || 0) >= 0;
                return (
                  <tr 
                    key={stk.id}
                    onClick={() => onSelectStock(stk.symbol)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{stk.symbol}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{stk.isin}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{stk.name}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {stk.sector_code}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-100">
                      {quote ? quote.price.toFixed(2) : '--'}
                    </td>
                    <td className={`py-3 px-2 text-right font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {quote ? `${isPos ? '+' : ''}${quote.changeKes.toFixed(2)}` : '--'}
                    </td>
                    <td className={`py-3 px-2 text-right font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {quote ? `${isPos ? '+' : ''}${quote.changePct.toFixed(2)}%` : '--'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-300">
                      {quote ? quote.dayVolume.toLocaleString() : '--'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-200">
                      {quote ? `KSh ${(quote.dayTurnoverKes / 1000000).toFixed(2)}M` : '--'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400">
                      {stk.price_tick_size.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(stk.symbol);
                        }}
                        className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 mx-auto"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
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
