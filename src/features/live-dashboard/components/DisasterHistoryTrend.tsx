import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Activity, ChevronDown, ChevronUp, TableProperties } from 'lucide-react';
import { DisasterHistoryItem, ThemeOption } from '../types/dashboardTypes';

interface Props {
  data: DisasterHistoryItem[];
  loading: boolean;
  theme?: ThemeOption;
}

export const DisasterHistoryTrend: React.FC<Props> = ({ data, loading, theme }) => {
  const [showTable, setShowTable] = useState(false);

  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';
  const isDarkGrey = theme === 'dark_grey';

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/60 text-blue-50 shadow-xl shadow-blue-950/40'
    : isSolar
    ? 'bg-stone-900 border-amber-900/60 text-amber-100 shadow-xl'
    : isDarkGrey
    ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
  const tableBorder = isLight ? 'divide-slate-100' : 'divide-slate-800';
  const tableHeadColor = isLight ? 'text-slate-400' : 'text-slate-500';
  const tableRowHover = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';
  const gridColor = isLight ? '#e2e8f0' : '#1e293b';
  const textColor = isLight ? '#334155' : '#94a3b8';
  const titleColor = isLight ? '#0f172a' : '#ffffff';

  const sorted = useMemo(
    () => [...data].sort((a, b) => a.year - b.year),
    [data]
  );

  type YearAgg = {
    affected: number; displaced: number;
    deaths: number; injuries: number; housesDamaged: number;
  };

  const byYear = useMemo(() =>
    sorted.reduce<Record<number, YearAgg>>((acc, d) => {
      if (!acc[d.year]) acc[d.year] = { affected: 0, displaced: 0, deaths: 0, injuries: 0, housesDamaged: 0 };
      acc[d.year].affected      += d.affected      ?? 0;
      acc[d.year].displaced     += d.displaced     ?? 0;
      acc[d.year].deaths        += d.deaths        ?? 0;
      acc[d.year].injuries      += d.injuries      ?? 0;
      acc[d.year].housesDamaged += d.housesDamaged ?? 0;
      return acc;
    }, {}),
    [sorted]
  );

  const years = useMemo(() =>
    Object.keys(byYear).map(Number).sort((a, b) => a - b),
    [byYear]
  );

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 600 },
    },
    colors: ['#C8102E', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
    xaxis: {
      categories: years.map(String),
      labels: { style: { colors: textColor, fontSize: '11px', fontFamily: 'Outfit, sans-serif' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: textColor, fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontWeight: 700,
      fontFamily: 'Outfit, sans-serif',
      labels: { colors: titleColor },
    },
    tooltip: { shared: true, intersect: false, theme: isLight ? 'light' : 'dark' },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    dataLabels: { enabled: false },
  };

  const series = [
    { name: 'People Affected',  data: years.map(y => byYear[y].affected) },
    { name: 'People Displaced', data: years.map(y => byYear[y].displaced) },
    { name: 'Deaths',           data: years.map(y => byYear[y].deaths) },
    { name: 'Injuries',         data: years.map(y => byYear[y].injuries) },
    { name: 'Damaged Houses',   data: years.map(y => byYear[y].housesDamaged) },
  ];

  if (loading) {
    return (
      <div className={`border rounded-2xl p-6 ${cardBg}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-slate-700/30 rounded w-1/3" />
          <div className="h-[280px] bg-slate-700/20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 flex flex-col justify-between h-full w-full min-h-[360px] space-y-4 ${cardBg}`}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Historical Disaster Impact Trend
            </h3>
            <p className={`text-[11px] ${textMuted}`}>
              Year-by-year aggregated impact across all registered disaster events
            </p>
          </div>
        </div>

        {/* Toggle button — only shown when there is data */}
        {sorted.length > 0 && (
          <button
            onClick={() => setShowTable(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
              showTable
                ? isLight
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/10 text-white border-white/20'
                : isLight
                  ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            {showTable ? 'Hide' : 'Show'} Events Table
            {showTable
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────── */}
      {years.length === 0 ? (
        <div className={`flex items-center justify-center h-[280px] text-sm ${textMuted}`}>
          No disaster history records found.
        </div>
      ) : (
        <ReactApexChart options={chartOptions} series={series} type="area" height={280} />
      )}

      {/* ── Table (hidden by default) ───────────────────────────────────── */}
      {showTable && sorted.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-700/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b border-slate-700/30 font-black uppercase tracking-wider text-[10px] ${tableHeadColor}`}>
                <th className="p-3">Year</th>
                <th className="p-3">Hazard</th>
                <th className="p-3">Location</th>
                <th className="p-3 text-right">Affected</th>
                <th className="p-3 text-right">Displaced</th>
                <th className="p-3 text-right">Deaths</th>
                <th className="p-3 text-right">Injuries</th>
                <th className="p-3 text-right">Damaged Houses</th>
                <th className="p-3">Infra Damage</th>
                <th className="p-3 text-right">Est. Loss (ETB)</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-semibold ${tableBorder} ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {sorted.map((dh, idx) => (
                <tr key={idx} className={`transition-colors ${tableRowHover}`}>
                  <td className="p-3 font-bold">{dh.year}</td>
                  <td className={`p-3 font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{dh.hazard}</td>
                  <td className="p-3">{dh.location}</td>
                  <td className="p-3 text-right font-mono">{dh.affected?.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{dh.displaced?.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-rose-500 font-bold">{dh.deaths?.toLocaleString() ?? 0}</td>
                  <td className="p-3 text-right font-mono">{dh.injuries?.toLocaleString() ?? 0}</td>
                  <td className="p-3 text-right font-mono">{dh.housesDamaged?.toLocaleString() ?? 0}</td>
                  <td className="p-3">{dh.infraDamaged || '—'}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#C8102E]">{dh.lossETB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DisasterHistoryTrend;
