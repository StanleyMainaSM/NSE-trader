import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Server
} from 'lucide-react';
import { DataQualitySummary, DataFreshness, DataQualityRecord, IngestionEvent, LatencyMetricSummary } from '../types/index.ts';

interface DataQualityBannerProps {
  dataQuality: DataQualitySummary | null;
  freshness: DataFreshness;
  isDemoFixture: boolean;
}

export const DataQualityBanner: React.FC<DataQualityBannerProps> = ({
  dataQuality,
  freshness,
  isDemoFixture
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'ISSUES' | 'INGESTIONS' | 'LATENCY'>('ISSUES');
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({});

  const handleResolveIssue = async (issueId: string) => {
    try {
      const res = await fetch(`/api/data-quality/issues/${issueId}/resolve`, { method: 'POST' });
      if (res.ok) {
        setResolvedIds(prev => ({ ...prev, [issueId]: true }));
      }
    } catch (err) {
      console.error('Failed to resolve issue:', err);
    }
  };

  const getFreshnessBadge = (f: DataFreshness) => {
    switch (f) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          dot: 'bg-emerald-400',
          label: 'LIVE REAL-TIME FEED'
        };
      case 'DELAYED':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800',
          dot: 'bg-amber-400',
          label: '15-MIN DELAYED FEED'
        };
      case 'STALE':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          dot: 'bg-rose-500 animate-ping',
          label: 'STALE / DISCONNECTED FEED'
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-slate-900 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
          label: 'FEED UNAVAILABLE'
        };
    }
  };

  const badge = getFreshnessBadge(freshness);

  const activeIssues = (dataQuality?.recentIssues || []).filter(i => !(i.resolved || i.isResolved) && !resolvedIds[i.id]);
  const passRate = dataQuality?.schemaValidationPassRatePct ?? 100;
  
  const latencyList: LatencyMetricSummary[] = dataQuality?.latencies || dataQuality?.latencySummaries || [];
  const avgLatency = dataQuality?.avgLatencyMs ?? (latencyList.length > 0 ? latencyList[0].avgFetchLatencyMs : 24);
  const isSlaBreached = dataQuality?.isSlaBreached ?? latencyList.some(l => l.isSlaBreached);

  return (
    <div id="data-quality-governance-card" className="rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs overflow-hidden shadow-sm">
      {/* Primary Status Strip */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Freshness Status & Provider Identity */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold ${badge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            <span>{badge.label}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-200">
              {isDemoFixture ? 'NSE Demo Simulation Fixture' : 'NSE Direct ATS FIX Gateway'}
            </span>
          </div>

          {isDemoFixture && (
            <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 text-[10px] font-semibold">
              SANDBOXED FIXTURE &bull; NOT LIVE BROKER MONEY
            </span>
          )}
        </div>

        {/* Right: Key Quality Metrics & Expand Drawer Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Schema Validation Pass Rate */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[11px]">
            <ShieldCheck className={`w-3.5 h-3.5 ${passRate >= 98 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-400">Schema Pass:</span>
            <span className={`font-bold ${passRate >= 98 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {passRate.toFixed(1)}%
            </span>
          </div>

          {/* Latency Metric */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[11px]">
            <Activity className={`w-3.5 h-3.5 ${isSlaBreached ? 'text-rose-400' : 'text-sky-400'}`} />
            <span className="text-slate-400">Pipeline Latency:</span>
            <span className={`font-bold ${isSlaBreached ? 'text-rose-300' : 'text-sky-300'}`}>
              {avgLatency.toFixed(0)}ms
            </span>
            <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
              {isSlaBreached ? 'SLA BREACH' : 'SLA OK'}
            </span>
          </div>

          {/* Anomaly / Issue Flag Counter */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[11px]">
            {activeIssues.length > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-bold">{activeIssues.length} Anomaly Flags</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">0 Anomalies</span>
              </>
            )}
          </div>

          {/* Expand/Collapse Toggle Button */}
          <button
            id="btn-toggle-data-quality-drawer"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer text-[11px]"
          >
            <span>{isExpanded ? 'Hide Telemetry' : 'Data Telemetry'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Deep Telemetry Drawer */}
      {isExpanded && (
        <div id="data-quality-telemetry-drawer" className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
          {/* Sub Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubTab('ISSUES')}
                className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                  activeSubTab === 'ISSUES' 
                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Validation Issues ({activeIssues.length})
              </button>
              <button
                onClick={() => setActiveSubTab('INGESTIONS')}
                className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                  activeSubTab === 'INGESTIONS' 
                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Recent Ingestions ({dataQuality?.recentIngestions.length || 0})
              </button>
              <button
                onClick={() => setActiveSubTab('LATENCY')}
                className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                  activeSubTab === 'LATENCY' 
                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Latency SLA Distributions ({latencyList.length})
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Total Batches: <strong className="text-slate-200">{dataQuality?.totalIngestions || 0}</strong></span>
              <span>&bull;</span>
              <span>Accepted Records: <strong className="text-emerald-400">{dataQuality?.totalRecordsAccepted || 0}</strong></span>
              {dataQuality && dataQuality.totalRecordsRejected > 0 && (
                <>
                  <span>&bull;</span>
                  <span>Rejected: <strong className="text-rose-400">{dataQuality.totalRecordsRejected}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* SubTab 1: Validation Issues */}
          {activeSubTab === 'ISSUES' && (
            <div className="space-y-2">
              {activeIssues.length === 0 ? (
                <div className="py-6 text-center text-slate-500 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/70" />
                  <p className="text-slate-300 font-semibold">Zero Schema or Data Integrity Violations</p>
                  <p className="text-[11px] text-slate-500">All received price quotes, index feeds, breadth distributions, and bars pass strict schema constraints.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded bg-slate-900/50">
                  {activeIssues.map(issue => (
                    <div key={issue.id} className="p-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            issue.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            issue.severity === 'ERROR' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="font-bold text-slate-200">{issue.entityType} ({issue.entityKey || issue.entityId || 'N/A'})</span>
                          <span className="text-[10px] text-slate-500">{issue.issueType}</span>
                        </div>
                        <p className="text-slate-300 mt-1 text-[11px]">{issue.details || issue.message}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Detected: {new Date(issue.checkedAt || issue.timestamp || Date.now()).toLocaleTimeString()}</p>
                      </div>
                      <button
                        onClick={() => handleResolveIssue(issue.id)}
                        className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                      >
                        Dismiss / Mark Resolved
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab 2: Recent Ingestions */}
          {activeSubTab === 'INGESTIONS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-slate-800 rounded bg-slate-900/50">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Entity Type</th>
                    <th className="p-2">Source</th>
                    <th className="p-2 text-right">Attempted</th>
                    <th className="p-2 text-right">Accepted</th>
                    <th className="p-2 text-right">Rejected</th>
                    <th className="p-2 text-right">Fetch Latency</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {(dataQuality?.recentIngestions || []).map(ing => (
                    <tr key={ing.id} className="hover:bg-slate-800/30">
                      <td className="p-2 text-slate-400">{new Date(ing.ingestedAt || ing.timestamp || Date.now()).toLocaleTimeString()}</td>
                      <td className="p-2 font-bold text-slate-200">{ing.entityType}</td>
                      <td className="p-2 text-slate-400">{ing.sourceName}</td>
                      <td className="p-2 text-right text-slate-200">{ing.recordsAttempted}</td>
                      <td className="p-2 text-right text-emerald-400 font-semibold">{ing.recordsAccepted}</td>
                      <td className="p-2 text-right text-rose-400">{ing.recordsRejected}</td>
                      <td className="p-2 text-right text-sky-300">{ing.fetchLatencyMs}ms</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          ing.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300' :
                          ing.status === 'PARTIAL' ? 'bg-amber-950 text-amber-300' :
                          'bg-rose-950 text-rose-300'
                        }`}>
                          {ing.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!dataQuality || dataQuality.recentIngestions.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500">
                        No ingestion events logged in current session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SubTab 3: Latency SLA Distributions */}
          {activeSubTab === 'LATENCY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {latencyList.map((l: LatencyMetricSummary) => (
                <div key={l.sourceId + (l.entityType || '')} className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-200">{l.entityType || 'General Feed'}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${l.isSlaBreached ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {l.isSlaBreached ? 'BREACHED' : 'SLA MET'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{l.sourceName}</div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono">
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-500">AVG</div>
                      <div className="font-bold text-sky-400">{l.avgFetchLatencyMs.toFixed(0)}ms</div>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-500">p50</div>
                      <div className="font-bold text-emerald-400">{l.p50FetchLatencyMs.toFixed(0)}ms</div>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-500">p95</div>
                      <div className="font-bold text-amber-400">{l.p95FetchLatencyMs.toFixed(0)}ms</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 flex justify-between pt-0.5">
                    <span>SLA Limit: {l.slaThresholdMs}ms</span>
                    <span>Samples: {l.sampleCount}</span>
                  </div>
                </div>
              ))}
              {latencyList.length === 0 && (
                <div className="col-span-full py-4 text-center text-slate-500 text-xs">
                  Awaiting latency metrics collection from active data feeds.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
