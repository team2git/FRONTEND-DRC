import React from 'react';
import { SocketStatus, ThemeOption } from '../types/dashboardTypes';
import {
  RefreshCw,
  Radio,
  ShieldAlert,
  Building2,
  Maximize2,
  Minimize2,
  Palette,
  BarChart3,
  LayoutDashboard,
  Filter,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type DashboardViewMode = 'command' | 'analytics';

interface Props {
  socketStatus: SocketStatus;
  lastUpdated: Date;
  onRefresh: () => void;
  loading: boolean;
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  viewMode: DashboardViewMode;
  onViewModeChange: (mode: DashboardViewMode) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters?: boolean;
  onOpenLayoutModal: () => void;
}

export const DashboardHeader: React.FC<Props> = ({
  socketStatus,
  lastUpdated,
  onRefresh,
  loading,
  theme,
  onThemeChange,
  isFullscreen,
  onToggleFullscreen,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters = false,
  onOpenLayoutModal,
}) => {
  const { user } = useAuth();
  const isLight = theme === 'light';

  const getStatusBadge = () => {
    switch (socketStatus) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE
          </span>
        );
      case 'RECONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Radio className="w-3.5 h-3.5 animate-spin" />
            RECONNECTING...
          </span>
        );
      case 'DISCONNECTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            DISCONNECTED
          </span>
        );
    }
  };

  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const buttonBg = isLight
    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200';

  const selectContainerBg = isLight
    ? 'bg-slate-100 border-slate-300 text-slate-800'
    : 'bg-slate-950 border-slate-800 text-slate-200';

  return (
    <div className={`border rounded-xl p-5 mb-4 transition-colors duration-300 ${containerBg}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <ShieldAlert className="w-7 h-7 text-rose-500 shrink-0" />
            <h1
              className={`text-xl md:text-2xl font-bold tracking-tight ${
                isLight ? 'text-slate-900' : 'bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'
              }`}
            >
              FDRMC LIVE DASHBOARD
            </h1>
            {getStatusBadge()}
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} flex flex-wrap items-center gap-2`}>
            <Building2 className="w-3.5 h-3.5" />
            <span>
              Organization:{' '}
              <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                {user?.organization?.name || user?.accessLevel?.toUpperCase() || 'Head Office Bureau'}
              </strong>
            </span>
            <span>•</span>
            <span>Real-time Command &amp; Operations Center</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Toggle Filter Panel Button */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition border ${
              showFilters
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : buttonBg
            }`}
            title={showFilters ? 'Hide Situational Filters' : 'Show Situational Filters'}
          >
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-500" title="Active filters applied" />
            )}
            {showFilters ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Customize Layout & Display Mode Manager Button */}
          <button
            onClick={onOpenLayoutModal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition border ${buttonBg} hover:border-blue-400`}
            title="Configure Dashboard Layout, Reorder Cards & Multi-Screen Display"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Layout &amp; Displays</span>
          </button>

          {/* View Mode Switcher */}
          <button
            onClick={() => onViewModeChange(viewMode === 'command' ? 'analytics' : 'command')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition border ${buttonBg}`}
            title="Switch Dashboard Layout View"
          >
            {viewMode === 'command' ? (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Executive View</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
                <span>Command View</span>
              </>
            )}
          </button>

          {/* Background Theme Selector */}
          <div className={`flex items-center gap-1.5 border p-1 rounded-lg ${selectContainerBg}`}>
            <Palette className="w-3.5 h-3.5 text-blue-500 ml-1" />
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as ThemeOption)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              title="Select Dashboard Theme"
            >
              <option value="light" className="bg-white text-slate-900">Light</option>
              <option value="blue_black" className="bg-slate-900 text-white">Blue Black</option>
              <option value="dark" className="bg-slate-900 text-white">Dark</option>
              <option value="dark_grey" className="bg-slate-900 text-white">Dark Grey</option>
              <option value="solar" className="bg-slate-900 text-white">Solar</option>
            </select>
          </div>

          {/* Full Screen Toggle Button */}
          <button
            onClick={onToggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition border ${buttonBg}`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen Mode'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition border disabled:opacity-50 ${buttonBg}`}
            title={`Refresh Dashboard Data (Last updated: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
