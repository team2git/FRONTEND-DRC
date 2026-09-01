import React from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  Sparkles,
  Check,
} from 'lucide-react';
import type { DataSource, ChartType } from './types';

interface Props {
  source: DataSource;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  groupBy: string;
  onGroupByChange: (field: string) => void;
}

const VISUALIZATIONS: {
  key: ChartType;
  label: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'table', label: 'Detailed Table', desc: 'Raw rows & paginated data', icon: TableIcon },
  { key: 'bar', label: 'Bar Distribution', desc: 'Categorical comparisons', icon: BarChart3 },
  { key: 'line', label: 'Trend Line', desc: 'Chronological timeline', icon: LineChart },
  { key: 'donut', label: 'Donut Share', desc: 'Proportions & percentages', icon: PieChart },
];

export const ColumnPicker: React.FC<Props> = ({
  source,
  selectedFields,
  onFieldsChange,
  chartType,
  onChartTypeChange,
  groupBy,
  onGroupByChange,
}) => {
  // Group fields by category prefix
  const grouped: Record<string, typeof source.fields> = {};
  source.fields.forEach((f) => {
    const prefix = f.key.includes('.') ? f.key.split('.')[0] : 'General';
    const formatted = prefix.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (!grouped[formatted]) grouped[formatted] = [];
    grouped[formatted].push(f);
  });

  const toggle = (key: string) => {
    if (selectedFields.includes(key)) {
      onFieldsChange(selectedFields.filter((f) => f !== key));
    } else {
      onFieldsChange([...selectedFields, key]);
    }
  };

  const selectAll = () => onFieldsChange(source.fields.map((f) => f.key));
  const selectDefault = () => onFieldsChange(source.defaultFields);
  const clearAll = () => onFieldsChange([]);

  return (
    <div className="space-y-6">
      {/* 1. Visualization Picker */}
      <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              1. Choose Report Format
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select how you want to visualize the results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VISUALIZATIONS.map((v) => {
            const Icon = v.icon;
            const isSelected = chartType === v.key || (v.key === 'donut' && chartType === 'pie');

            return (
              <button
                key={v.key}
                type="button"
                onClick={() => onChartTypeChange(v.key)}
                className={`
                  p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between
                  hover:scale-[1.02]
                  ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-950/40 shadow-md shadow-brand-900/10 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                </div>
                <div>
                  <h4
                    className={`text-xs font-black ${
                      isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {v.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{v.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Group By Option (Required for Charts, Optional for Tables) */}
      <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/60 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Aggregate &amp; Group By Dimension
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Summarize counts across specific categories (e.g. by Severity, Status, or Woreda)
            </p>
          </div>

          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">No Grouping (Individual Rows)</option>
            {source.groupByOptions.map((opt) => {
              const field = source.fields.find((f) => f.key === opt);
              return (
                <option key={opt} value={opt}>
                  Group by: {field ? field.label : opt}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 3. Column Checklist */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              2. Select Columns to Include
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedFields.length} of {source.fields.length} columns active
            </p>
          </div>

          {/* Quick Selection Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectDefault}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
            >
              Recommended
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition cursor-pointer border border-brand-200 dark:border-brand-800"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Grouped Field Pills */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([groupName, fields]) => (
            <div key={groupName} className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {groupName} Fields
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {fields.map((field) => {
                  const isSelected = selectedFields.includes(field.key);
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggle(field.key)}
                      className={`
                        flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-left transition-all duration-150 cursor-pointer border
                        ${
                          isSelected
                            ? 'bg-brand-50/90 dark:bg-brand-950/50 border-brand-400 dark:border-brand-700 text-brand-950 dark:text-brand-200 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }
                      `}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                      {isSelected ? (
                        <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <span className="truncate flex-1">{field.label}</span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60">
                        {field.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
