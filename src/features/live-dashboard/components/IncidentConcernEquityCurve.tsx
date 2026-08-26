import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { MapIncident, ThemeOption } from '../types/dashboardTypes';
import { TrendingUp, Flame, Bell, Activity } from 'lucide-react';

interface Props {
  incidents: MapIncident[];
  loading?: boolean;
  theme?: ThemeOption;
}

export const IncidentConcernEquityCurve: React.FC<Props> = ({
  incidents = [],
  loading = false,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';
  const isDarkGrey = theme === 'dark_grey';

  // Theme colors
  const containerBg = isLight
    ? 'bg-white border-slate-200 shadow-sm'
    : isBlueBlack
      ? 'bg-[#0f172a] border-blue-900/50 shadow-xl shadow-blue-950/40'
      : isSolar
        ? 'bg-stone-900 border-amber-900/60 shadow-xl'
        : isDarkGrey
          ? 'bg-neutral-900 border-neutral-800 shadow-xl'
          : 'bg-slate-900 border-slate-800 shadow-xl';

  const headerBorder = isLight
    ? 'border-slate-100'
    : isBlueBlack
      ? 'border-blue-900/40'
      : 'border-slate-800/60';

  const labelColor = isLight
    ? '#64748b'
    : isBlueBlack
      ? '#93c5fd'
      : isSolar
        ? '#fde68a'
        : '#94a3b8';

  const gridColor = isLight
    ? '#f1f5f9'
    : isBlueBlack
      ? '#1e3a5f30'
      : isSolar
        ? '#451a0330'
        : '#1e293b40';

  const titleColor = isLight ? '#0f172a' : '#f8fafc';

  // ── Build date-bucketed cumulative equity curve from incidents
  const { dates, incidentCumul, concernCumul } = useMemo(() => {
    if (!incidents.length) {
      return { dates: [], incidentCumul: [], concernCumul: [] };
    }

    // Collect all unique dates from last 30 days
    const now = new Date();
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Count per-day
    const incidentByDay: Record<string, number> = {};
    const concernByDay: Record<string, number> = {};
    days.forEach((d) => {
      incidentByDay[d] = 0;
      concernByDay[d] = 0;
    });

    incidents.forEach((inc) => {
      const day = new Date(inc.createdAt).toISOString().split('T')[0];
      const isIncident = inc.reportType !== 'concern';
      if (incidentByDay[day] !== undefined) {
        if (isIncident) incidentByDay[day]++;
        else concernByDay[day]++;
      }
    });

    // Raw daily series
    const rawIncident = days.map((d) => incidentByDay[d]);
    const rawConcern = days.map((d) => concernByDay[d]);

    // Cumulative equity curve (running total)
    let incSum = 0;
    let conSum = 0;
    const incidentCumul = rawIncident.map((v) => (incSum += v));
    const concernCumul = rawConcern.map((v) => (conSum += v));

    // Human-readable date labels — only show every 5th to avoid crowding
    const displayDates = days.map((d, i) => {
      if (i % 5 !== 0) return '';
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      dates: displayDates,
      incidentCumul,
      concernCumul,
    };
  }, [incidents]);

  const totalIncidents = incidents.filter((i) => i.reportType !== 'concern').length;
  const totalConcerns = incidents.filter((i) => i.reportType === 'concern').length;
  const totalAll = incidents.length;

  // ApexCharts — Dual Equity Curves
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: { enabled: true, delay: 100 },
        dynamicAnimation: { enabled: true, speed: 400 },
      },
    },
    colors: ['#C8102E', '#3B82F6'],
    stroke: {
      curve: 'smooth',
      width: [2.5, 2.5],
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 85, 100],
        colorStops: [
          [
            { offset: 0, color: '#C8102E', opacity: 0.35 },
            { offset: 100, color: '#C8102E', opacity: 0.02 },
          ],
          [
            { offset: 0, color: '#3B82F6', opacity: 0.3 },
            { offset: 100, color: '#3B82F6', opacity: 0.02 },
          ],
        ],
      },
    },
    xaxis: {
      categories: dates,
      axisBorder: { color: gridColor },
      axisTicks: { color: gridColor },
      labels: {
        style: { colors: labelColor, fontSize: '9px', fontFamily: 'Outfit, sans-serif' },
        rotate: 0,
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: labelColor, fontSize: '9px', fontFamily: 'Outfit, sans-serif' },
        formatter: (v: number) => Math.round(v).toString(),
      },
      min: 0,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      padding: { left: 4, right: 4 },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    markers: {
      size: 0,
      hover: { size: 4, sizeOffset: 2 },
    },
    tooltip: {
      theme: isLight ? 'light' : 'dark',
      shared: true,
      intersect: false,
      style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
      y: {
        formatter: (v: number, { seriesIndex }: { seriesIndex: number }) =>
          seriesIndex === 0 ? `${v} Incidents` : `${v} Concerns`,
      },
    },
  };

  const series = [
    { name: 'Incidents (Cumulative)', data: incidentCumul },
    { name: 'Concerns (Cumulative)', data: concernCumul },
  ];

  return (
    <div className={`rounded-2xl border ${containerBg} overflow-hidden transition-all duration-300`}>
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${headerBorder}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-rose-500/10 shrink-0">
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-extrabold truncate`} style={{ color: titleColor }}>
              Incident &amp; Concern Equity Curve
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Cumulative 30-day volume trajectory — Incidents vs. Concerns
            </p>
          </div>
        </div>

        {/* Live Stats Pills */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <Flame className="w-3 h-3" />
            {totalIncidents} Incidents
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            <Bell className="w-3 h-3" />
            {totalConcerns} Concerns
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        {loading ? (
          <div className="h-52 flex items-center justify-center gap-2 text-slate-400">
            <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Loading equity curve data…</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center gap-2 text-slate-400">
            <TrendingUp className="w-8 h-8 text-slate-300" />
            <span className="text-xs font-semibold">No report data available for equity curve.</span>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="w-full" style={{ height: '180px' }}>
              <ReactApexChart
                options={chartOptions}
                series={series}
                type="area"
                width="100%"
                height="100%"
              />
            </div>

            {/* Summary Row */}
            <div className={`mt-3 grid grid-cols-3 divide-x rounded-xl overflow-hidden border ${isLight ? 'border-slate-200 divide-slate-200' : isBlueBlack ? 'border-blue-900/40 divide-blue-900/40' : 'border-slate-800 divide-slate-800'
              }`}>
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Reports</p>
                <p className={`text-lg font-black tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalAll}</p>
              </div>
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-0.5">🔥 Incidents</p>
                <p className="text-lg font-black tabular-nums text-rose-600 dark:text-rose-400">{totalIncidents}</p>
              </div>
              <div className="px-3 py-2.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-0.5">🔔 Concerns</p>
                <p className="text-lg font-black tabular-nums text-blue-600 dark:text-blue-400">{totalConcerns}</p>
              </div>
            </div>

            {/* Color Legend */}
            <div className="flex items-center justify-center gap-5 mt-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-6 h-0.5 bg-[#C8102E] rounded-full inline-block" />
                Incident Trajectory
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-6 h-0.5 bg-blue-500 rounded-full inline-block" />
                Concern Trajectory
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
