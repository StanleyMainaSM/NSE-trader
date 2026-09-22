/**
 * Private Trading Journal Component
 * Personal accountability tracking: rationale, emotional state, rule adherence, and trade post-mortems.
 */

import React, { useState } from 'react';
import { BookOpen, Plus, HeartPulse, CheckSquare, Award } from 'lucide-react';
import { TradingJournalEntry } from '../types/index.ts';

export const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<TradingJournalEntry[]>([
    {
      id: 'jrn-1',
      date: '2026-09-17',
      symbol: 'SCOM',
      tradeType: 'BUY',
      thesis: 'Breakout above 14.80 resistance supported by Safaricom Ethiopia monthly active customer disclosure.',
      emotionalState: 'DISCIPLINED',
      followedPlan: true,
      executionQualityRating: 5,
      postTradeNotes: 'Exited partial size at target 15.65 (+0.85 KSh). Trailing remainder above 15.20.'
    },
    {
      id: 'jrn-2',
      date: '2026-09-14',
      symbol: 'EQTY',
      tradeType: 'BUY',
      thesis: 'Range bottom accumulation at 40.50 with narrow intraday spread and low selling pressure.',
      emotionalState: 'CALM',
      followedPlan: true,
      executionQualityRating: 4,
      postTradeNotes: 'Held through initial minor consolidation. KSh movement reached +3.00/share.'
    }
  ]);

  const [symbol, setSymbol] = useState('EABL');
  const [thesis, setThesis] = useState('');
  const [emotionalState, setEmotionalState] = useState<'CALM' | 'DISCIPLINED' | 'ANXIOUS' | 'FOMO' | 'REVENGE'>('DISCIPLINED');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: TradingJournalEntry = {
      id: `jrn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      symbol: symbol.toUpperCase(),
      tradeType: 'BUY',
      thesis,
      emotionalState,
      followedPlan,
      executionQualityRating: rating,
      postTradeNotes: notes
    };
    setEntries([newEntry, ...entries]);
    setShowAdd(false);
    setThesis('');
    setNotes('');
  };

  return (
    <div id="journal-view-root" className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Private Trading Journal & Rule Discipline
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Log trade setups, psychological state, and rule adherence to prevent emotional trading errors.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-slate-900/90 border border-slate-700 space-y-3 text-xs">
          <h3 className="font-bold text-slate-200 uppercase text-xs">Record Trade Journal Observation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Stock Ticker</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Emotional State</label>
              <select
                value={emotionalState}
                onChange={e => setEmotionalState(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
              >
                <option value="DISCIPLINED">Disciplined</option>
                <option value="CALM">Calm</option>
                <option value="ANXIOUS">Anxious</option>
                <option value="FOMO">FOMO (Chasing)</option>
                <option value="REVENGE">Revenge Trading</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Execution Quality (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={e => setRating(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Trade Thesis & Entry Rationale</label>
            <textarea
              required
              rows={2}
              value={thesis}
              onChange={e => setThesis(e.target.value)}
              placeholder="Why this stock? What technical/fundamental evidence triggered entry?"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Post-Trade Notes & Lessons</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Execution review, giveback handling, lessons..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={followedPlan}
                onChange={e => setFollowedPlan(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-emerald-500"
              />
              <span>I strictly adhered to my written trading plan</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded cursor-pointer"
              >
                Save Entry
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {entries.map(e => (
          <div key={e.id} className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">{e.symbol}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  e.emotionalState === 'DISCIPLINED' || e.emotionalState === 'CALM'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {e.emotionalState}
                </span>
                <span className="text-[11px] text-slate-400">Score: {e.executionQualityRating}/5</span>
              </div>
              <span className="text-[11px] text-slate-500">{e.date}</span>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-slate-200"><strong className="text-slate-400">THESIS:</strong> {e.thesis}</p>
              {e.postTradeNotes && (
                <p className="text-slate-300 mt-1"><strong className="text-slate-400">REVIEW:</strong> {e.postTradeNotes}</p>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <CheckSquare className={`w-3.5 h-3.5 ${e.followedPlan ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span>{e.followedPlan ? 'Followed written plan' : 'Plan deviated'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
