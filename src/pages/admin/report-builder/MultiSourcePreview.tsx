import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import type { MultiSourceResult, MultiQueryResponse, PerSourceConfig, DataSource } from './types';
import { exportMultiQuery } from '../../../api/reportBuilderApi';
import { toast } from 'react-toastify';

interface Props {
  response: MultiQueryResponse | null;
  loading: boolean;
  sourceConfigs: PerSourceConfig[];
  allSources: DataSource[];
}

const BRAND_COLORS = [
  '#143f84', '#e11d2d', '#0ba5ec', '#10b981',
  '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899',
];

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return '—';
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur === null || cur === undefined) return '—';
  if (typeof cur === 'boolean') return cur ? 'Yes' : 'No';
  if (typeof cur === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cur)) {
    return new Date(cur).toLocaleDateString();
  }
  return String(cur).replace(/"/g, '""');
}

function StatusBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  if (['critical', 'high', 'danger'].includes(lower))
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{value}</span>;
  if (['moderate', 'medium', 'submitted', 'warning'].includes(lower))
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{value}</span>;
  if (['low', 'solved', 'active', 'closed', 'reviewed'].includes(lower))
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{value}</span>;
  return <span>{value}</span>;
}

// Single source section component
const SourceSection: React.FC<{
  result: MultiSourceResult;
  config: PerSourceConfig;
  allSources: DataSource[];
  sectionIndex: number;
}> = ({ result, config, allSources, sectionIndex }) => {
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const src = allSources.find((s) => s.key === result.sourceKey);
  const color = result.sourceColor || BRAND_COLORS[sectionIndex % BRAND_COLORS.length];

  const fieldDefs = (config.fields || result.fields || [])
    .map((k) => src?.fields.find((f) => f.key === k))
    .filter(Boolean) as NonNullable<DataSource['fields'][0]>[];

  if (result.error) {
    return (
      <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-bold">
        ⚠ Error loading {result.sourceLabel}: {result.error}
      </div>
    );
  }

  // Grouped Chart Mode
  if (result.isGrouped && result.groupBy) {
    const items = (result.data as { label: string; count: number }[]).map((d) => ({
      name: d.label || '(empty)',
      count: d.count || 0,
    }));
    const categories = items.map((d) => d.name);
    const values = items.map((d) => d.count);

    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden shadow-xs">
        {/* Section Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
            <span className="text-xs font-black" style={{ color }}>{sectionIndex + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{result.sourceLabel}</h3>
            <p className="text-[11px] text-slate-400">
              {result.total.toLocaleString()} records · Grouped by {src?.fields.find(f => f.key === result.groupBy)?.label || result.groupBy}
            </p>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}18`, color }}>
            {items.length} groups
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Chart */}
          {config.chartType === 'bar' && (
            <ReactApexChart
              options={{
                chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
                colors: [color, ...BRAND_COLORS.filter(c => c !== color)],
                plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: '55%' } },
                dataLabels: { enabled: true, style: { fontSize: '10px' } },
                xaxis: { categories, labels: { style: { fontSize: '10px' } } },
                legend: { show: false },
                grid: { borderColor: '#e2e8f030' },
              }}
              series={[{ name: 'Count', data: values }]}
              type="bar"
              height={240}
            />
          )}
          {config.chartType === 'line' && (
            <ReactApexChart
              options={{
                chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
                colors: [color],
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 5 },
                xaxis: { categories, labels: { style: { fontSize: '10px' } } },
              }}
              series={[{ name: 'Count', data: values }]}
              type="line"
              height={240}
            />
          )}
          {(config.chartType === 'donut' || config.chartType === 'pie') && (
            <ReactApexChart
              options={{
                chart: { type: config.chartType === 'donut' ? 'donut' : 'pie', background: 'transparent' },
                labels: categories,
                colors: [color, ...BRAND_COLORS.filter(c => c !== color)],
                legend: { position: 'bottom', fontSize: '11px' },
              }}
              series={values}
              type={config.chartType === 'donut' ? 'donut' : 'pie'}
              height={260}
            />
          )}

          {/* Compact group breakdown table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-3 py-2 text-left font-black text-slate-500 dark:text-slate-400">
                    {src?.fields.find(f => f.key === result.groupBy)?.label || result.groupBy}
                  </th>
                  <th className="px-3 py-2 text-right font-black text-slate-500 dark:text-slate-400">Count</th>
                  <th className="px-3 py-2 text-right font-black text-slate-500 dark:text-slate-400">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {items.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition">
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }} />
                      {row.name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">{row.count.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-slate-400">
                      {result.total > 0 ? ((row.count / result.total) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Table Mode
  const filteredData = result.data.filter((row) => {
    if (!tableSearch.trim()) return true;
    return Object.values(row).some((v) => String(v).toLowerCase().includes(tableSearch.toLowerCase()));
  });
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const pageData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const displayCols = fieldDefs.length > 0 ? fieldDefs : src?.fields.slice(0, 5) || [];

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
          <span className="text-xs font-black" style={{ color }}>{sectionIndex + 1}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{result.sourceLabel}</h3>
          <p className="text-[11px] text-slate-400">{result.total.toLocaleString()} total records</p>
        </div>
        <div className="relative w-40">
          <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={tableSearch}
            onChange={(e) => { setTableSearch(e.target.value); setPage(1); }}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1.5 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-3 py-2.5 text-left font-black text-slate-400 w-8">#</th>
              {displayCols.map((col) => (
                <th key={col.key} className="px-4 py-2.5 text-left font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={displayCols.length + 1} className="px-4 py-8 text-center text-slate-400 text-xs">No records found.</td>
              </tr>
            ) : pageData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition">
                <td className="px-3 py-2 text-slate-400 font-mono">{(page - 1) * pageSize + i + 1}</td>
                {displayCols.map((col) => {
                  const val = getNestedValue(row as Record<string, unknown>, col.key);
                  return (
                    <td key={col.key} className="px-4 py-2 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                      <StatusBadge value={val} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" /> Prev
          </button>
          <span className="font-bold text-slate-500">Page {page}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 cursor-pointer"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// Main preview component
export const MultiSourcePreview: React.FC<Props> = ({ response, loading, sourceConfigs, allSources }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!response || sourceConfigs.length === 0) return;
    try {
      setExporting(true);
      const fullData = await exportMultiQuery(sourceConfigs);

      // Build combined CSV with section headers
      let csvLines: string[] = [];
      fullData.results.forEach((res, i) => {
        const src = allSources.find((s) => s.key === res.sourceKey);
        const fields = sourceConfigs[i]?.fields || res.fields || [];
        const fieldDefs = fields.map((k) => src?.fields.find((f) => f.key === k)).filter(Boolean) as DataSource['fields'];

        if (i > 0) csvLines.push('');
        csvLines.push('"=== ' + res.sourceLabel.toUpperCase() + ' (' + res.total + ' records) ==="');

        if (res.isGrouped) {
          csvLines.push('"Group","Count","Percentage"');
          (res.data as { label: string; count: number }[]).forEach((row) => {
            const pct = res.total > 0 ? ((row.count / res.total) * 100).toFixed(1) : '0';
            csvLines.push('"' + (row.label || '(empty)').replace(/"/g, '""') + '","' + row.count + '","' + pct + '%"');
          });
        } else {
          const headers = fieldDefs.map((f) => '"' + f.label.replace(/"/g, '""') + '"').join(',');
          csvLines.push(headers);
          res.data.forEach((row) => {
            const line = fields.map((f) => '"' + getNestedValue(row as Record<string, unknown>, f) + '"').join(',');
            csvLines.push(line);
          });
        }
      });

      const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multi_dataset_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${fullData.sourceCount} datasets to CSV!`);
    } catch (err: any) {
      toast.error('CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 animate-pulse space-y-3">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-800/40">
        <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Multi-Dataset Report Yet</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
          Add datasets using the configurator and click <strong>Run All Queries</strong> to generate your unified report.
        </p>
      </div>
    );
  }

  const { results, grandTotal, sourceCount } = response;

  return (
    <div className="space-y-5">
      {/* Executive Summary Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-950 to-brand-800 border border-brand-700/50 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
              <TrendingUp className="w-4 h-4" />
              Multi-Dataset Executive Summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              <div>
                <p className="text-[11px] text-brand-300/70 font-medium">Datasets Queried</p>
                <p className="text-2xl font-black">{sourceCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-brand-300/70 font-medium">Grand Total Records</p>
                <p className="text-2xl font-black">{grandTotal.toLocaleString()}</p>
              </div>
              {results.map((r) => (
                <div key={r.sourceKey}>
                  <p className="text-[11px] font-medium" style={{ color: `${r.sourceColor}cc` }}>{r.sourceLabel}</p>
                  <p className="text-xl font-black">{r.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Export All (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Per-source sections */}
      {results.map((result, i) => {
        const cfg = sourceConfigs.find((c) => c.source === result.sourceKey);
        return (
          <SourceSection
            key={result.sourceKey}
            result={result}
            config={cfg || sourceConfigs[i] || sourceConfigs[0]}
            allSources={allSources}
            sectionIndex={i}
          />
        );
      })}
    </div>
  );
};
