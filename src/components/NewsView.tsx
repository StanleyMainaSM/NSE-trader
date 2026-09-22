/**
 * News, Macro & Regulatory Intelligence View
 * Strictly separates FACT from INTERPRETATION and maps transmission mechanisms to NSE stocks.
 */

import React, { useState } from 'react';
import { Newspaper, ShieldAlert, ArrowRight, ExternalLink, Filter } from 'lucide-react';
import { NewsArticle } from '../types/index.ts';

interface NewsViewProps {
  articles: NewsArticle[];
  onSelectStock: (symbol: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  articles,
  onSelectStock
}) => {
  const [filterAuthority, setFilterAuthority] = useState<string>('ALL');

  const authorities = ['ALL', 'REGULATORY', 'COMPANY_FILING', 'FINANCIAL_PRESS'];

  const filtered = articles.filter(a => {
    if (filterAuthority === 'ALL') return true;
    return a.sourceAuthorityType === filterAuthority;
  });

  return (
    <div id="news-view-root" className="space-y-4 font-mono">
      {/* Principle Disclaimer Banner */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Macro & Corporate Intelligence
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Rigorous separation of verified facts from speculative interpretations and transmission mappings.
            </p>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Authority:
            </span>
            {authorities.map(auth => (
              <button
                key={auth}
                onClick={() => setFilterAuthority(auth)}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  filterAuthority === auth
                    ? 'bg-slate-700 text-sky-400 font-bold border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {auth.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Transmission Mechanism Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 text-slate-300">
            <span className="text-[10px] font-bold text-sky-400 uppercase block mb-1">
              Transmission: Central Bank CBR & T-Bill Yields
            </span>
            <p className="text-[11px] text-slate-400">
              Directly influences commercial bank lending margins (EQTY, KCB, ABSA, COOP) and treasury allocation yields.
            </p>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 text-slate-300">
            <span className="text-[10px] font-bold text-sky-400 uppercase block mb-1">
              Transmission: Excise Duty & Manufacturing Levies
            </span>
            <p className="text-[11px] text-slate-400">
              Changes to excise inflation adjustments directly compress volume elasticity for producers like EABL and BAT.
            </p>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filtered.map(article => (
          <div key={article.id} className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">{article.sourceName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {article.sourceAuthorityType}
                </span>
                <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                  article.classification === 'POTENTIALLY_MARKET_MOVING'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : article.classification === 'HIGH_IMPORTANCE'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {article.classification.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Headline & Body */}
            <div>
              <h3 className="text-sm font-bold text-slate-100">{article.headline}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{article.summary}</p>
            </div>

            {/* Fact vs Interpretation Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">OBSERVED FACT:</span>
                <p className="text-[11px] text-slate-300">{article.headline}</p>
              </div>
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] font-bold text-amber-400 block mb-0.5">ANALYTICAL INTERPRETATION:</span>
                <p className="text-[11px] text-slate-300">
                  Potential liquidity redistribution across domestic bond yields vs high-dividend equities.
                </p>
              </div>
            </div>

            {/* Mentioned Symbols */}
            {article.mentionedSymbols.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-500 font-semibold">LINKED ASSETS:</span>
                <div className="flex gap-1.5">
                  {article.mentionedSymbols.map(sym => (
                    <button
                      key={sym}
                      onClick={() => onSelectStock(sym)}
                      className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
            No intelligence items for selected authority.
          </div>
        )}
      </div>
    </div>
  );
};
