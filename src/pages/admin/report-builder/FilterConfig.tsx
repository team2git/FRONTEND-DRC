import React from 'react';
import { Calendar, X, Filter, Clock } from 'lucide-react';
import type { DataSource, ReportFilters } from './types';

interface Props {
  source: DataSource;
  filters: ReportFilters;
  onChange: (key: string, value: ReportFilters[string]) => void;
  onClear: () => void;
}

export const FilterConfig: React.FC<Props> = ({ source, filters, onChange, onClear }) => {
  const activeCount = Object.values(filters).filter((v) => {
    if (v === null || v === undefined || v === '') return false;
    if (typeof v === 'object') {
      const obj = v as { from?: string; to?: string };
      return Boolean(obj.from || obj.to);
    }
    return true;
  }).length;

  const dateFilterDef = source.filters.find((f) => f.type === 'daterange');

  // Quick Date Range Presets
  const applyDatePreset = (preset: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'all') => {
    if (!dateFilterDef) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      onChange(dateFilterDef.key, null);
      return;
    }

    if (preset === 'today') {
      onChange(dateFilterDef.key, { from: todayStr, to: todayStr });
      return;
    }

    if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      onChange(dateFilterDef.key, { from: yStr, to: yStr });
      return;
    }

    if (preset === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      onChange(dateFilterDef.key, { from: d.toISOString().split('T')[0], to: todayStr });
      return;
    }

    if (preset === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      onChange(dateFilterDef.key, { from: d.toISOString().split('T')[0], to: todayStr });
      return;
    }

    if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      onChange(dateFilterDef.key, { from: firstDay, to: todayStr });
      return;
    }
  };

  return (
    <div className="space-y-5">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Filter Dataset</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Narrow down data by date, location, status, or specific conditions
            </p>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear {activeCount} Active Filter{activeCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Date Range Quick Presets */}
      {dateFilterDef && (
        <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              Quick Time Period Presets
            </span>
            <span className="text-[10px] text-slate-400">Or pick custom dates below</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id as any)}
                className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {source.filters.map((filterDef) => {
          const value = filters[filterDef.key];

          if (filterDef.type === 'daterange') {
            const dateVal = (value as { from?: string; to?: string }) || {};
            return (
              <div key={filterDef.key} className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar className="inline w-3.5 h-3.5 mr-1 text-brand-600" />
                  {filterDef.label}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateVal.from || ''}
                    onChange={(e) => onChange(filterDef.key, { ...dateVal, from: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-xs"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateVal.to || ''}
                    onChange={(e) => onChange(filterDef.key, { ...dateVal, to: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-xs"
                    placeholder="To"
                  />
                </div>
              </div>
            );
          }

          if (filterDef.type === 'enum' && filterDef.options) {
            return (
              <div key={filterDef.key}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {filterDef.label}
                </label>
                <select
                  value={(value as string) || ''}
                  onChange={(e) => onChange(filterDef.key, e.target.value || null)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-xs"
                >
                  <option value="">All ({filterDef.label})</option>
                  {filterDef.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (filterDef.type === 'boolean') {
            return (
              <div key={filterDef.key}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {filterDef.label}
                </label>
                <select
                  value={value === null || value === undefined ? '' : String(value)}
                  onChange={(e) => onChange(filterDef.key, e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-xs"
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            );
          }

          return (
            <div key={filterDef.key}>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {filterDef.label}
              </label>
              <input
                type="text"
                value={(value as string) || ''}
                onChange={(e) => onChange(filterDef.key, e.target.value || null)}
                placeholder={`Search ${filterDef.label}...`}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:outline-none transition shadow-xs"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
