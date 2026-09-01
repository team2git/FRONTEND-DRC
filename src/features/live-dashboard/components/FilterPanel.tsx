import React, { useState, useEffect } from 'react';
import { FilterState, ThemeOption } from '../types/dashboardTypes';
import { Filter, RotateCcw, Search, Calendar as CalendarIcon, X, Check, Clock } from 'lucide-react';

interface Props {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  theme?: ThemeOption;
}

export const FilterPanel: React.FC<Props> = ({ filters, onFilterChange, onReset, theme }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';

  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<string>(filters.startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(filters.endDate);

  // Keep temp dates in sync with external filter changes (e.g. reset, preset changes)
  useEffect(() => {
    setTempStartDate(filters.startDate);
    setTempEndDate(filters.endDate);
  }, [filters.startDate, filters.endDate]);


  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/60 text-blue-100 shadow-xl shadow-blue-950/40'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const inputBg = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
    : isBlueBlack
    ? 'bg-[#080d1a] border-blue-800/60 text-blue-100 placeholder-blue-300/40 focus:border-blue-400'
    : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-sky-500';

  const labelColor = isLight
    ? 'text-slate-600 font-semibold'
    : isBlueBlack
    ? 'text-blue-300/80 font-medium'
    : 'text-slate-400';

  const modalBg = isLight
    ? 'bg-white border-slate-300 text-slate-900 shadow-2xl'
    : isBlueBlack
    ? 'bg-[#080d1a] border-blue-800/80 text-blue-50 shadow-2xl shadow-blue-950/80'
    : 'bg-slate-950 border-slate-800 text-white shadow-2xl';

  // Get human readable label for the trigger button
  const getDateLabel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (filters.datePreset === 'today' || (filters.startDate === todayStr && filters.endDate === todayStr)) {
      return `Today (${todayStr})`;
    }
    if (filters.datePreset === 'yesterday') {
      return 'Yesterday';
    }
    if (filters.datePreset === 'custom' && (filters.startDate || filters.endDate)) {
      return `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`;
    }
    return 'All Time (Default)';
  };

  const handleApplyCustomDates = () => {
    onFilterChange('datePreset', 'custom');
    onFilterChange('startDate', tempStartDate);
    onFilterChange('endDate', tempEndDate);
    setIsCalendarOpen(false);
  };

  const handleSelectPreset = (preset: 'all' | 'today' | 'yesterday' | 'last7' | 'last30') => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (preset === 'all') {
      onFilterChange('datePreset', 'all');
      setIsCalendarOpen(false);
    } else if (preset === 'today') {
      onFilterChange('datePreset', 'today');
      setIsCalendarOpen(false);
    } else if (preset === 'yesterday') {
      onFilterChange('datePreset', 'yesterday');
      setIsCalendarOpen(false);
    } else if (preset === 'last7') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      const d7Str = d7.toISOString().split('T')[0];
      onFilterChange('datePreset', 'custom');
      onFilterChange('startDate', d7Str);
      onFilterChange('endDate', todayStr);
      setIsCalendarOpen(false);
    } else if (preset === 'last30') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const d30Str = d30.toISOString().split('T')[0];
      onFilterChange('datePreset', 'custom');
      onFilterChange('startDate', d30Str);
      onFilterChange('endDate', todayStr);
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className={`border rounded-xl p-4 mb-6 shadow-md text-xs transition-colors duration-300 relative ${containerBg}`}>
      <div className={`flex items-center justify-between mb-3 pb-2 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className={`font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-slate-200'}`}>
            SITUATIONAL DASHBOARD FILTERS
          </span>
        </div>
        <button
          onClick={onReset}
          className={`flex items-center gap-1 transition text-[11px] font-medium ${
            isLight
              ? 'text-slate-500 hover:text-slate-800'
              : isBlueBlack
              ? 'text-blue-300/70 hover:text-blue-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3 h-3" /> Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Interactive Calendar Popup Trigger Button */}
        <div>
          <label className={`block text-[11px] mb-1 flex items-center gap-1 ${labelColor}`}>
            <CalendarIcon className="w-3 h-3 text-sky-400" /> Date Filter & Calendar
          </label>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className={`w-full border rounded-lg px-3 py-1.5 flex items-center justify-between transition font-semibold ${inputBg} ${
              filters.datePreset !== 'all' ? 'border-blue-500 text-blue-500' : ''
            }`}
          >
            <span className="truncate">{getDateLabel()}</span>
            <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-sky-400" />
          </button>
        </div>

        {/* Woreda Search */}
        <div>
          <label className={`block text-[11px] mb-1 ${labelColor}`}>Search Woreda / City</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Woreda 03..."
              value={filters.woreda}
              onChange={(e) => onFilterChange('woreda', e.target.value)}
              className={`w-full border rounded-lg px-3 py-1.5 pl-8 focus:outline-none transition ${inputBg}`}
            />
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${isLight ? 'text-slate-400' : 'text-blue-400/60'}`} />
          </div>
        </div>

        {/* Hazard Category */}
        <div>
          <label className={`block text-[11px] mb-1 ${labelColor}`}>Hazard Type</label>
          <select
            value={filters.hazard}
            onChange={(e) => onFilterChange('hazard', e.target.value)}
            className={`w-full border rounded-lg px-3 py-1.5 focus:outline-none transition ${inputBg}`}
          >
            <option value="" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>All Hazards</option>
            <option value="Flood" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Flood</option>
            <option value="Drought" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Drought</option>
            <option value="Fire" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Fire</option>
            <option value="Landslide" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Landslide</option>
            <option value="Collapse" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Building Collapse</option>
            <option value="Medical" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Medical Emergency</option>
            <option value="Power" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Power Outage</option>
            <option value="Security" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Security Concern</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className={`block text-[11px] mb-1 ${labelColor}`}>Severity Level</label>
          <select
            value={filters.severity}
            onChange={(e) => onFilterChange('severity', e.target.value)}
            className={`w-full border rounded-lg px-3 py-1.5 focus:outline-none transition ${inputBg}`}
          >
            <option value="" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>All Severities</option>
            <option value="critical" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Critical</option>
            <option value="high" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>High</option>
            <option value="moderate" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Moderate</option>
            <option value="low" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Low</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={`block text-[11px] mb-1 ${labelColor}`}>Incident Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className={`w-full border rounded-lg px-3 py-1.5 focus:outline-none transition ${inputBg}`}
          >
            <option value="" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>All Statuses</option>
            <option value="submitted" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Submitted</option>
            <option value="received" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Received</option>
            <option value="dispatched" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Dispatched / Active</option>
            <option value="closed" className={isBlueBlack ? 'bg-[#0f172a]' : ''}>Closed</option>
          </select>
        </div>

        {/* Region */}
        <div>
          <label className={`block text-[11px] mb-1 ${labelColor}`}>Region / Subcity</label>
          <input
            type="text"
            placeholder="e.g. Addis Ababa"
            value={filters.region}
            onChange={(e) => onFilterChange('region', e.target.value)}
            className={`w-full border rounded-lg px-3 py-1.5 focus:outline-none transition ${inputBg}`}
          />
        </div>
      </div>

      {/* Calendar Popup Modal / Popover */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md border rounded-2xl p-5 shadow-2xl transition-all duration-300 ${modalBg}`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">SELECT DATE RANGE & CALENDAR</h3>
              </div>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-2">QUICK DATE PRESETS</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleSelectPreset('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                    filters.datePreset === 'all'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : isLight
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Clock className="w-3 h-3 inline mr-1" /> All Time
                </button>

                <button
                  onClick={() => handleSelectPreset('today')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                    filters.datePreset === 'today'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : isLight
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  ⚡ Today
                </button>

                <button
                  onClick={() => handleSelectPreset('yesterday')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                    filters.datePreset === 'yesterday'
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : isLight
                      ? 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  Yesterday
                </button>

                <button
                  onClick={() => handleSelectPreset('last7')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                    isLight ? 'bg-slate-100 border-slate-300 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  Last 7 Days
                </button>

                <button
                  onClick={() => handleSelectPreset('last30')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition ${
                    isLight ? 'bg-slate-100 border-slate-300 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Custom Interactive Calendar Date Range Pickers */}
            <div className="space-y-3 pt-3 border-t border-slate-700/40">
              <label className="block text-[11px] font-semibold text-slate-400">CUSTOM CALENDAR RANGE</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none transition ${inputBg}`}
                  />
                </div>
              </div>
            </div>

            {/* Popup Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-700/40">
              <button
                onClick={() => setIsCalendarOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition border ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomDates}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
              >
                <Check className="w-3.5 h-3.5" /> Apply Custom Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
