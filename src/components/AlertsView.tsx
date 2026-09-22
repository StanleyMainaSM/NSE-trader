/**
 * Alerts & Risk Notifications View
 * Comprehensive risk notifications, giveback alerts, and acknowledgment system.
 */

import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, Check, X } from 'lucide-react';
import { Alert } from '../types/index.ts';

interface AlertsViewProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => Promise<void>;
  onSelectStock: (symbol: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledge,
  onSelectStock
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const severities = ['ALL', 'CRITICAL', 'WARNING', 'INFO'];

  const filtered = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="alerts-view-root" className="space-y-4 font-mono">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-rose-400" />
            <span>Alerts & Risk Monitor</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-time market regime changes, profit giveback breaches, and unusual volatility alerts.
          </p>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 mr-1">Severity:</span>
          {severities.map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-slate-700 text-slate-100 font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.map(alert => (
          <div 
            key={alert.id}
            className={`p-4 rounded-lg bg-slate-900/80 border ${alert.isAcknowledged ? 'border-slate-800/60 opacity-70' : 'border-slate-700'} space-y-2`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getSeverityBadge(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className="text-xs font-bold text-slate-200">{alert.type.replace('_', ' ')}</span>
                {alert.affectedAsset && (
                  <button
                    onClick={() => onSelectStock(alert.affectedAsset!)}
                    className="text-xs px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-700 cursor-pointer"
                  >
                    {alert.affectedAsset}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500">
                  {new Date(alert.timestamp).toLocaleTimeString('en-GB')} EAT
                </span>
                {!alert.isAcknowledged ? (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Acknowledge</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Acknowledged</span>
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300">{alert.reason}</p>

            {alert.supportingMetrics && Object.keys(alert.supportingMetrics).length > 0 && (
              <div className="p-2 bg-slate-950/70 rounded border border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap gap-4">
                {Object.entries(alert.supportingMetrics).map(([k, v]) => (
                  <span key={k}>
                    <strong className="text-slate-300">{k}:</strong> {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
            No alerts matching current filter.
          </div>
        )}
      </div>
    </div>
  );
};
