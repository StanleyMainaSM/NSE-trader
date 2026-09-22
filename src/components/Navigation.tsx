/**
 * Navigation Bar Component
 * Terminal navigation across the 10 core analytical modules
 */

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  LineChart,
  Radar,
  Briefcase,
  Newspaper,
  Bell,
  Scale,
  BookOpen,
  Settings
} from 'lucide-react';

export type NavTab = 
  | 'DASHBOARD'
  | 'MARKET'
  | 'STOCKS'
  | 'SCANNER'
  | 'PORTFOLIO'
  | 'NEWS'
  | 'ALERTS'
  | 'PREDICTIONS'
  | 'JOURNAL'
  | 'SETTINGS';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertsCount?: number;
  scannerCount?: number;
  openPositionsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount = 0,
  scannerCount = 0,
  openPositionsCount = 0
}) => {
  const tabs = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MARKET', label: 'Market', icon: TrendingUp },
    { id: 'STOCKS', label: 'Stocks', icon: LineChart },
    { id: 'SCANNER', label: 'Scanner', icon: Radar, badge: scannerCount },
    { id: 'PORTFOLIO', label: 'Portfolio', icon: Briefcase, badge: openPositionsCount },
    { id: 'NEWS', label: 'News & Events', icon: Newspaper },
    { id: 'ALERTS', label: 'Alerts', icon: Bell, badge: activeAlertsCount, alertColor: true },
    { id: 'PREDICTIONS', label: 'Predictions & Backtest', icon: Scale },
    { id: 'JOURNAL', label: 'Journal', icon: BookOpen },
    { id: 'SETTINGS', label: 'Settings & Sources', icon: Settings },
  ];

  return (
    <nav id="terminal-navigation" className="bg-slate-900/60 border-b border-slate-800/80 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id.toLowerCase()}`}
              onClick={() => onSelectTab(tab.id as NavTab)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    tab.alertColor
                      ? 'bg-rose-900/80 text-rose-300 border border-rose-700/80'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
