import React, { useState } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import type { DataSource, PerSourceConfig, ChartType } from './types';

interface Props {
  sources: DataSource[];
  configs: PerSourceConfig[];
  onChange: (configs: PerSourceConfig[]) => void;
}

const MAX_SOURCES = 6;

const CHART_TYPES: { key: ChartType; label: string; icon: LucideIcon }[] = [
  { key: 'table', label: 'Table', icon: TableIcon },
  { key: 'bar', label: 'Bar', icon: BarChart3 },
  { key: 'line', label: 'Line', icon: LineChart },
  { key: 'donut', label: 'Donut', icon: PieChart },
];

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'month', label: 'Month' },
];

function getDateRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const s = y.toISOString().split('T')[0]; return { from: s, to: s };
  }
  if (preset === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { from: d.toISOString().split('T')[0], to: today };
  }
  if (preset === '30d') {
    const d = new Date(now); d.setDate(d.getDate() - 30);
    return { from: d.toISOString().split('T')[0], to: today };
  }
  if (preset === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: today };
  }
  return null;
}

export const MultiSourceConfigurator: React.FC<Props> = ({ sources, configs, onChange }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const selectedKeys = configs.map((c) => c.source);

  const addSource = (sourceKey: string) => {
    if (configs.length >= MAX_SOURCES) return;
    const src = sources.find((s) => s.key === sourceKey);
    if (!src || selectedKeys.includes(sourceKey)) return;

    const newConfig: PerSourceConfig = {
      source: sourceKey,
      label: src.label,
      color: src.color,
      filters: {},
      fields: src.defaultFields,
      groupBy: src.groupByOptions[0] || '',
      chartType: 'bar',
      limit: 100,
    };
    const updated = [...configs, newConfig];
    onChange(updated);
    setExpandedIdx(updated.length - 1);
  };

  const removeSource = (idx: number) => {
    const updated = configs.filter((_, i) => i !== idx);
    onChange(updated);
    setExpandedIdx(updated.length > 0 ? Math.max(0, idx - 1) : null);
  };

  const updateConfig = (idx: number, patch: Partial<PerSourceConfig>) => {
    const updated = configs.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange(updated);
  };

  const toggleField = (idx: number, field: string) => {
    const cfg = configs[idx];
    const current = cfg.fields;
    const updated = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    updateConfig(idx, { fields: updated });
  };

  const applyDatePreset = (idx: number, preset: string, src: DataSource) => {
    const dateFilterDef = src.filters.find((f) => f.type === 'daterange');
    if (!dateFilterDef) return;
    const range = getDateRange(preset);
    if (range) {
      updateConfig(idx, {
        filters: { ...configs[idx].filters, [dateFilterDef.key]: range },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Source selector pills */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Add Datasets</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select up to {MAX_SOURCES} data sources — each gets its own section in the report.
            </p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            configs.length >= MAX_SOURCES
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
              : 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800'
          }`}>
            {configs.length}/{MAX_SOURCES} active
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sources.map((src) => {
            const isSelected = selectedKeys.includes(src.key);
            return (
              <button
                key={src.key}
                type="button"
                onClick={() => !isSelected && addSource(src.key)}
                disabled={isSelected || configs.length >= MAX_SOURCES}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer
                  ${isSelected
                    ? 'cursor-default opacity-50 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    : configs.length >= MAX_SOURCES
                    ? 'opacity-40 cursor-not-allowed bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
                  }`}
              >
                {!isSelected && <Plus className="w-3 h-3 shrink-0" />}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: src.color }}
                />
                {src.label}
              </button>
            );
          })}
        </div>

        {configs.length === 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Click datasets above to add them to your multi-source report. You can add up to {MAX_SOURCES}.
          </div>
        )}
      </div>

      {/* Per-source accordion cards */}
      <div className="space-y-3">
        {configs.map((cfg, idx) => {
          const src = sources.find((s) => s.key === cfg.source);
          if (!src) return null;
          const isExpanded = expandedIdx === idx;
          const dateFilterDef = src.filters.find((f) => f.type === 'daterange');
          const dateVal = dateFilterDef ? ((cfg.filters[dateFilterDef.key] || {}) as { from?: string; to?: string }) : {};

          return (
            <div
              key={cfg.source}
              className="rounded-2xl border-2 overflow-hidden transition-all"
              style={{ borderColor: isExpanded ? cfg.color : undefined }}
            >
              {/* Accordion Header */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition select-none ${
                  isExpanded ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}22` }}>
                  <span className="text-[10px] font-black" style={{ color: cfg.color }}>{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{src.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {cfg.fields.length} cols · {cfg.groupBy ? `Grouped by ${src.fields.find(f => f.key === cfg.groupBy)?.label || cfg.groupBy}` : 'No grouping'} · {cfg.chartType}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Chart type quick indicator */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                    {CHART_TYPES.find(c => c.key === cfg.chartType)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeSource(idx); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 p-4 space-y-5">
                  {/* Chart Type + Group By */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chart Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Visualization
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CHART_TYPES.map((ct) => {
                          const Icon = ct.icon;
                          const isActive = cfg.chartType === ct.key;
                          return (
                            <button
                              key={ct.key}
                              type="button"
                              onClick={() => updateConfig(idx, { chartType: ct.key })}
                              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition cursor-pointer
                                ${isActive
                                  ? 'border-brand-500 text-brand-700 dark:text-brand-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                              style={isActive ? { backgroundColor: `${cfg.color}12`, borderColor: cfg.color, color: cfg.color } : {}}
                            >
                              <Icon className="w-4 h-4" />
                              {ct.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group By */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        <Sparkles className="inline w-3 h-3 mr-1" />Group By
                      </label>
                      <select
                        value={cfg.groupBy}
                        onChange={(e) => updateConfig(idx, { groupBy: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
                      >
                        <option value="">No Grouping (Rows)</option>
                        {src.groupByOptions.map((opt) => {
                          const field = src.fields.find((f) => f.key === opt);
                          return <option key={opt} value={opt}>By: {field?.label || opt}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Date Presets */}
                  {dateFilterDef && (
                    <div className="p-3 rounded-xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-800/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-300">
                        <Clock className="w-3.5 h-3.5" /> Date Filter
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {DATE_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyDatePreset(idx, p.id, src)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 transition cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, { filters: { ...cfg.filters, [dateFilterDef.key]: null } })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateVal.from || ''}
                          onChange={(e) => updateConfig(idx, { filters: { ...cfg.filters, [dateFilterDef.key]: { ...dateVal, from: e.target.value } } })}
                          className="flex-1 px-2 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                          type="date"
                          value={dateVal.to || ''}
                          onChange={(e) => updateConfig(idx, { filters: { ...cfg.filters, [dateFilterDef.key]: { ...dateVal, to: e.target.value } } })}
                          className="flex-1 px-2 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Column picker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Columns ({cfg.fields.length}/{src.fields.length})
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, { fields: src.defaultFields })}
                          className="text-[10px] font-bold text-brand-600 hover:underline cursor-pointer"
                        >
                          Recommended
                        </button>
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, { fields: src.fields.map((f) => f.key) })}
                          className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => updateConfig(idx, { fields: [] })}
                          className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {src.fields.map((field) => {
                        const isSelected = cfg.fields.includes(field.key);
                        return (
                          <button
                            key={field.key}
                            type="button"
                            onClick={() => toggleField(idx, field.key)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-left font-bold border transition cursor-pointer
                              ${isSelected
                                ? 'border-brand-400 dark:border-brand-700 text-brand-900 dark:text-brand-200'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                              }`}
                            style={isSelected ? { backgroundColor: `${cfg.color}10`, borderColor: cfg.color } : {}}
                          >
                            {isSelected ? (
                              <Eye className="w-3 h-3 shrink-0" style={{ color: cfg.color }} />
                            ) : (
                              <EyeOff className="w-3 h-3 shrink-0 text-slate-300 dark:text-slate-600" />
                            )}
                            <span className="truncate">{field.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
