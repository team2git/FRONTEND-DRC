import React, { useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { QueryResult, ChartType, DataSource } from './types';

interface Props {
  result: QueryResult | null;
  loading: boolean;
  source: DataSource | null;
  selectedFields: string[];
  chartType: ChartType;
  groupBy: string;
}

const BRAND_CHART_COLORS = [
  '#143f84', // brand navy
  '#e11d2d', // logo red accent
  '#0ba5ec', // sky blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#4b6dc2', // brand-400
  '#6366f1', // indigo
  '#123776', // brand-600
];

/** Safely get a nested value from dot-notation path */
const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return '—';
    current = (current as Record<string, unknown>)[part];
  }
  if (current === null || current === undefined) return '—';
  if (current instanceof Date || (typeof current === 'string' && /^\d{4}-\d{2}-\d{2}/.test(current as string))) {
    return new Date(current as string).toLocaleDateString();
  }
  if (typeof current === 'boolean') return current ? 'Yes' : 'No';
  return String(current);
};

/** Render badges for common statuses/severities */
const renderCellContent = (value: string) => {
  const lower = value.toLowerCase();
  if (['critical', 'high', 'danger'].includes(lower)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-accent-100 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300">
        {value}
      </span>
    );
  }
  if (['moderate', 'medium', 'warning', 'submitted'].includes(lower)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
        {value}
      </span>
    );
  }
  if (['low', 'solved', 'active', 'reviewed', 'closed'].includes(lower)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
        {value}
      </span>
    );
  }
  return <span>{value}</span>;
};

export const ReportPreview: React.FC<Props> = ({
  result,
  loading,
  source,
  selectedFields,
  chartType,
  groupBy,
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fieldDefs = useMemo(() => {
    if (!source) return [];
    return selectedFields
      .map((key) => source.fields.find((f) => f.key === key))
      .filter(Boolean) as typeof source.fields;
  }, [source, selectedFields]);

  if (loading) {
    return (
      <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 animate-pulse mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-800/40">
        <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Report Generated Yet</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
          Click "Run &amp; Preview" from the bottom bar to fetch data and generate charts.
        </p>
      </div>
    );
  }

  const { data, total, isGrouped } = result;

  // Filter table data by client search
  const filteredData = (data || []).filter((row) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const displayCols = fieldDefs.length > 0 ? fieldDefs : source?.fields.slice(0, 6) ?? [];

  // ─── Grouped Visualization Mode ──────────────────────────────────────────
  if (isGrouped && groupBy) {
    const chartItems = (data as { label: string; count: number }[]).map((d) => ({
      name: d.label || '(empty)',
      count: d.count || 0,
    }));

    const categories = chartItems.map((d) => d.name);
    const seriesValues = chartItems.map((d) => d.count);

    return (
      <div className="space-y-5">
        {/* KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400">Total Matched Records</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {total.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400">Total Unique Groups</span>
            <div className="text-xl font-black text-brand-600 dark:text-brand-300 mt-1">
              {chartItems.length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400">Grouping Dimension</span>
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate mt-2">
              {source?.fields.find((f) => f.key === groupBy)?.label || groupBy}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400">Visualization</span>
            <div className="text-xs font-black text-brand-600 dark:text-brand-300 uppercase mt-2">
              {chartType} Chart
            </div>
          </div>
        </div>

        {/* Visual Chart Card */}
        {chartType === 'bar' && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm">
            <ReactApexChart
              options={{
                chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
                colors: BRAND_CHART_COLORS,
                plotOptions: {
                  bar: { distributed: true, borderRadius: 8, columnWidth: '50%' },
                },
                dataLabels: { enabled: true },
                xaxis: { categories, labels: { style: { fontSize: '11px' } } },
                yaxis: { labels: { style: { fontSize: '11px' } } },
                legend: { show: false },
              }}
              series={[{ name: 'Record Count', data: seriesValues }]}
              type="bar"
              height={340}
            />
          </div>
        )}

        {chartType === 'line' && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm">
            <ReactApexChart
              options={{
                chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
                colors: ['#143f84'],
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 6 },
                xaxis: { categories, labels: { style: { fontSize: '11px' } } },
                yaxis: { labels: { style: { fontSize: '11px' } } },
              }}
              series={[{ name: 'Count', data: seriesValues }]}
              type="line"
              height={340}
            />
          </div>
        )}

        {(chartType === 'donut' || chartType === 'pie') && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm flex justify-center">
            <div className="w-full max-w-lg">
              <ReactApexChart
                options={{
                  chart: { type: chartType === 'donut' ? 'donut' : 'pie', background: 'transparent' },
                  labels: categories,
                  colors: BRAND_CHART_COLORS,
                  legend: { position: 'bottom', fontSize: '12px' },
                }}
                series={seriesValues}
                type={chartType === 'donut' ? 'donut' : 'pie'}
                height={340}
              />
            </div>
          </div>
        )}

        {/* Group Breakdown Table */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-300">
                  {source?.fields.find((f) => f.key === groupBy)?.label || groupBy}
                </th>
                <th className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-300">
                  Total Count
                </th>
                <th className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-300">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {chartItems.map((row, i) => {
                const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0';
                return (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: BRAND_CHART_COLORS[i % BRAND_CHART_COLORS.length] }}
                      />
                      {row.name}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {row.count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-500">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Detailed Data Table Mode ────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* KPI Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400">Total Query Results</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {total.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400">Columns Selected</span>
          <div className="text-xl font-black text-brand-600 dark:text-brand-300 mt-1">
            {displayCols.length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400">Dataset</span>
          <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate mt-2">
            {source?.label}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400">Page Records</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {paginatedData.length}
          </div>
        </div>
      </div>

      {/* Table Shell with Search */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden shadow-sm">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in loaded preview..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} rows
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3 py-3 text-left font-black text-slate-500 w-10">#</th>
                {displayCols.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-black text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={displayCols.length + 1} className="px-4 py-12 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-brand-50/30 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    {displayCols.map((col) => {
                      const val = getNestedValue(row as Record<string, unknown>, col.key);
                      return (
                        <td key={col.key} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[220px] truncate">
                          {renderCellContent(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            <span className="font-bold text-slate-600 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 transition cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
