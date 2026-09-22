/**
 * User Settings & Data Providers View
 * Configuration of user capital, risk parameters, and official data provider status.
 */

import React, { useState } from 'react';
import { Settings, Database, ShieldAlert, Check, RefreshCw, Key } from 'lucide-react';
import { UserSettings, DataSourceConfig } from '../types/index.ts';

interface SettingsViewProps {
  settings: UserSettings | null;
  dataSources: DataSourceConfig[];
  onUpdateSettings: (newSettings: UserSettings) => Promise<void>;
  onTestProvider: (providerId: string) => Promise<any>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  dataSources,
  onUpdateSettings,
  onTestProvider
}) => {
  const [formData, setFormData] = useState<UserSettings>(
    settings || {
      id: 'usr-default',
      tradingCapitalKes: 500000,
      preferredHoldingPeriod: 'SWING_1_3_DAYS',
      minimumKshShareOpportunity: 0.50,
      minimumLiquidityDailyTurnoverKes: 10000000,
      preferredVolatility: 'MODERATE',
      maximumPositionSizeKes: 150000,
      maximumPortfolioAllocationPerStockPct: 30,
      alertSensitivity: 'BALANCED',
      monitoredSymbols: ['SCOM', 'EQTY', 'KCB', 'EABL', 'ABSA'],
      profitGivebackWarningThresholdPct: 30,
      isDemoDataAllowed: true,
      updatedAt: new Date().toISOString()
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await onTestProvider(id);
      setTestResults(prev => ({ ...prev, [id]: res }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div id="settings-view-root" className="space-y-4 font-mono">
      {/* Data Sources Architecture & Integration Status */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Nairobi Securities Exchange Data Feeds & Architecture
          </h2>
        </div>

        <div className="space-y-3">
          {dataSources.map(ds => (
            <div key={ds.id} className="p-3.5 bg-slate-950/70 rounded border border-slate-800 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-100">{ds.name}</span>
                  <span className="text-slate-500 ml-2">({ds.id})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    ds.status === 'ONLINE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    ds.status === 'DEMO_ONLY' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {ds.status}
                  </span>
                  <button
                    onClick={() => handleTest(ds.id)}
                    disabled={testingId === ds.id}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingId === ds.id ? 'animate-spin' : ''}`} />
                    <span>Test Feed</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">{ds.legalNotice}</p>

              {testResults[ds.id] && (
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300">
                  <span className="font-bold text-emerald-400">TEST STATUS: </span>
                  {testResults[ds.id].message} (Latency: {testResults[ds.id].latencyMs || 0}ms)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Risk Parameters & Capital Settings */}
      <form onSubmit={handleSave} className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Personal Risk & Threshold Configuration
            </h2>
          </div>
          {saveSuccess && (
            <span className="text-emerald-400 flex items-center gap-1 text-xs">
              <Check className="w-3.5 h-3.5" /> Saved successfully
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 mb-1">Total Trading Capital (KES)</label>
            <input
              type="number"
              value={formData.tradingCapitalKes}
              onChange={e => setFormData({ ...formData, tradingCapitalKes: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Max Position Size (KES)</label>
            <input
              type="number"
              value={formData.maximumPositionSizeKes}
              onChange={e => setFormData({ ...formData, maximumPositionSizeKes: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Max Single Stock Allocation (%)</label>
            <input
              type="number"
              max="100"
              value={formData.maximumPortfolioAllocationPerStockPct}
              onChange={e => setFormData({ ...formData, maximumPortfolioAllocationPerStockPct: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Min KSh Movement Threshold</label>
            <input
              type="number"
              step="0.05"
              value={formData.minimumKshShareOpportunity}
              onChange={e => setFormData({ ...formData, minimumKshShareOpportunity: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Min Daily Liquidity Turnover (KES)</label>
            <input
              type="number"
              value={formData.minimumLiquidityDailyTurnoverKes}
              onChange={e => setFormData({ ...formData, minimumLiquidityDailyTurnoverKes: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Profit Giveback Alert Threshold (%)</label>
            <input
              type="number"
              value={formData.profitGivebackWarningThresholdPct}
              onChange={e => setFormData({ ...formData, profitGivebackWarningThresholdPct: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={formData.isDemoDataAllowed}
              onChange={e => setFormData({ ...formData, isDemoDataAllowed: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500"
            />
            <span>Allow sandboxed simulation fixture data when official feed is disconnected</span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
