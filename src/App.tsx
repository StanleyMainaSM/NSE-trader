/**
 * Master Terminal App Component
 * Nairobi Securities Exchange (NSE) Private Trading Intelligence System
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation, NavTab } from './components/Navigation.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MarketView } from './components/MarketView.tsx';
import { StocksView } from './components/StocksView.tsx';
import { ScannerView } from './components/ScannerView.tsx';
import { PortfolioView } from './components/PortfolioView.tsx';
import { NewsView } from './components/NewsView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { PredictionsView } from './components/PredictionsView.tsx';
import { JournalView } from './components/JournalView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { StockDrilldownModal } from './components/StockDrilldownModal.tsx';
import {
  MarketIndex,
  MarketBreadth,
  MarketRegime,
  PortfolioPosition,
  ScannerCandidate,
  Alert,
  NewsArticle,
  Prediction,
  UserSettings,
  DataSourceConfig,
  DataFreshness,
  DataQualitySummary
} from './types/index.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('DASHBOARD');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [freshness, setFreshness] = useState<DataFreshness>('UNAVAILABLE');
  const [isDemoFixture, setIsDemoFixture] = useState<boolean>(true);
  const [dataQuality, setDataQuality] = useState<DataQualitySummary | null>(null);

  // Core Data States
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null);
  const [regime, setRegime] = useState<MarketRegime | null>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<ScannerCandidate[]>([]);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([]);

  // Fetch all core datasets
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        healthRes,
        marketRes,
        stocksRes,
        scannerRes,
        portfolioRes,
        newsRes,
        alertsRes,
        predRes,
        settingsRes
      ] = await Promise.all([
        fetch('/api/health').catch(() => null),
        fetch('/api/market/overview').catch(() => null),
        fetch('/api/stocks').catch(() => null),
        fetch('/api/scanner').catch(() => null),
        fetch('/api/portfolio').catch(() => null),
        fetch('/api/news').catch(() => null),
        fetch('/api/alerts').catch(() => null),
        fetch('/api/predictions').catch(() => null),
        fetch('/api/settings').catch(() => null)
      ]);

      if (healthRes && healthRes.ok) {
        const h = await healthRes.json();
        setFreshness(h.freshness);
        setDataSources(h.dataSources || []);
        if (h.dataQuality) {
          setDataQuality(h.dataQuality);
        }
      }

      if (marketRes && marketRes.ok) {
        const m = await marketRes.json();
        setIndices(m.indices || []);
        setBreadth(m.breadth || null);
        setRegime(m.regime || null);
        setIsDemoFixture(Boolean(m.isDemoFixture));
      }

      if (stocksRes && stocksRes.ok) {
        const s = await stocksRes.json();
        setStocks(s.stocks || []);
      }

      if (scannerRes && scannerRes.ok) {
        const sc = await scannerRes.json();
        setCandidates(sc.candidates || []);
      }

      if (portfolioRes && portfolioRes.ok) {
        const p = await portfolioRes.json();
        setPositions(p.positions || []);
      }

      if (newsRes && newsRes.ok) {
        const n = await newsRes.json();
        setNews(n.articles || []);
      }

      if (alertsRes && alertsRes.ok) {
        const a = await alertsRes.json();
        setAlerts(a.alerts || []);
      }

      if (predRes && predRes.ok) {
        const pr = await predRes.json();
        setPredictions(pr.predictions || []);
      }

      if (settingsRes && settingsRes.ok) {
        const st = await settingsRes.json();
        setSettings(st.settings || null);
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error refreshing terminal data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleAddPosition = async (newPos: any) => {
    const res = await fetch('/api/portfolio/position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPos)
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const handleDeletePosition = async (id: string) => {
    const res = await fetch(`/api/portfolio/position/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPositions(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    const res = await fetch(`/api/alerts/${id}/ack`, { method: 'POST' });
    if (res.ok) {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a));
    }
  };

  const handleRunBacktest = async (symbol: string, strategy: string) => {
    const res = await fetch('/api/backtest/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, strategyName: strategy })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Backtest simulation failed');
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (res.ok) {
      setSettings(newSettings);
    }
  };

  const handleTestProvider = async (id: string) => {
    const res = await fetch(`/api/providers/${id}/test`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
    return { success: false, message: 'Provider test call failed' };
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE' && !a.isAcknowledged).length;

  return (
    <div id="app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono selection:bg-emerald-900 selection:text-emerald-100">
      
      {/* Top Fixed Header */}
      <Header
        freshness={freshness}
        isDemoFixture={isDemoFixture}
        lastUpdated={lastUpdated}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {/* Module Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeAlertsCount={activeAlertsCount}
        scannerCount={candidates.length}
        openPositionsCount={positions.length}
      />

      {/* Main Content Area */}
      <main id="main-content-viewport" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'DASHBOARD' && (
          <DashboardView
            indices={indices}
            breadth={breadth}
            regime={regime}
            positions={positions}
            candidates={candidates}
            alerts={alerts}
            news={news}
            dataQuality={dataQuality}
            freshness={freshness}
            isDemoFixture={isDemoFixture}
            onSelectStock={setSelectedStockSymbol}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'MARKET' && (
          <MarketView
            indices={indices}
            breadth={breadth}
            regime={regime}
          />
        )}

        {currentTab === 'STOCKS' && (
          <StocksView
            stocks={stocks}
            onSelectStock={setSelectedStockSymbol}
          />
        )}

        {currentTab === 'SCANNER' && (
          <ScannerView
            candidates={candidates}
            onSelectStock={setSelectedStockSymbol}
          />
        )}

        {currentTab === 'PORTFOLIO' && (
          <PortfolioView
            positions={positions}
            onAddPosition={handleAddPosition}
            onDeletePosition={handleDeletePosition}
            onSelectStock={setSelectedStockSymbol}
          />
        )}

        {currentTab === 'NEWS' && (
          <NewsView
            articles={news}
            onSelectStock={setSelectedStockSymbol}
          />
        )}

        {currentTab === 'ALERTS' && (
          <AlertsView
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onSelectStock={setSelectedStockSymbol}
          />
        )}

        {currentTab === 'PREDICTIONS' && (
          <PredictionsView
            predictions={predictions}
            onRunBacktest={handleRunBacktest}
          />
        )}

        {currentTab === 'JOURNAL' && (
          <JournalView />
        )}

        {currentTab === 'SETTINGS' && (
          <SettingsView
            settings={settings}
            dataSources={dataSources}
            onUpdateSettings={handleUpdateSettings}
            onTestProvider={handleTestProvider}
          />
        )}
      </main>

      {/* Single Stock Drill-Down Modal */}
      {selectedStockSymbol && (
        <StockDrilldownModal
          symbol={selectedStockSymbol}
          onClose={() => setSelectedStockSymbol(null)}
        />
      )}

      {/* Persistent Legal Notice Footer */}
      <footer id="terminal-footer" className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-[11px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Private NSE Short-Term Analytical Terminal &bull; Intended solely for personal decision support</span>
          <span className="text-slate-600">Trading equities involves financial risk. No automated trade execution.</span>
        </div>
      </footer>

    </div>
  );
}
