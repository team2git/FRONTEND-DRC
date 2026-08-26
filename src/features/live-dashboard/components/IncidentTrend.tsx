import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendItem, TrendTimeInterval, ThemeOption, FilterState } from '../types/dashboardTypes';
import { fetchIncidentTrends } from '../services/liveDashboardApi';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp, Layers, Flame, Megaphone, Activity, Clock, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

interface Props {
  trends?: TrendItem[];
  loading?: boolean;
  theme?: ThemeOption;
  filters?: Partial<FilterState>;
}

type TrendViewMode = 'all_severity' | 'report_types' | 'composite';

const INTERVAL_CONFIG: Array<{
  id: TrendTimeInterval;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'hourly',
    label: 'Time in Day',
    shortLabel: 'Hourly',
    description: 'Breakdown by hour across the day',
    icon: Clock,
  },
  {
    id: 'daily',
    label: 'Day in Month',
    shortLabel: 'Daily',
    description: 'Day-by-day frequency for the month',
    icon: CalendarDays,
  },
  {
    id: 'monthly',
    label: 'Month in Year',
    shortLabel: 'Monthly',
    description: 'Month-by-month trend for the year',
    icon: Calendar,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    shortLabel: 'Year',
    description: 'Year-over-year multi-year trend',
    icon: CalendarRange,
  },
];

export const IncidentTrend: React.FC<Props> = ({
  trends: initialTrends = [],
  loading: initialLoading = false,
  theme = 'light',
  filters = {},
}) => {
  const [viewMode, setViewMode] = useState<TrendViewMode>('all_severity');
  const [interval, setInterval] = useState<TrendTimeInterval>('daily');
  const [trendData, setTrendData] = useState<TrendItem[]>(initialTrends);
  const [loadingInterval, setLoadingInterval] = useState<boolean>(false);

  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';

  // Fetch trend data whenever interval or global filters change
  const loadTrendData = useCallback(async (selectedInterval: TrendTimeInterval) => {
    try {
      setLoadingInterval(true);
      const data = await fetchIncidentTrends({
        ...filters,
        interval: selectedInterval,
      });
      setTrendData(data);
    } catch (error) {
      console.error('Failed to load incident trends for interval:', selectedInterval, error);
    } finally {
      setLoadingInterval(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTrendData(interval);
  }, [interval, loadTrendData]);

  // Sync initial trends on first mount if interval is daily
  useEffect(() => {
    if (initialTrends && initialTrends.length > 0 && interval === 'daily') {
      setTrendData(initialTrends);
    }
  }, [initialTrends, interval]);

  // Process and sanitize categories and series data based on interval
  const {
    dates,
    criticalSeries,
    highSeries,
    moderateSeries,
    lowSeries,
    incidentSeries,
    concernSeries,
    totalSeries,
    summaryStats,
  } = useMemo(() => {
    const activeTrends = trendData && trendData.length > 0 ? trendData : [];

    if (activeTrends.length > 0) {
      const parsedDates = activeTrends.map((t) => {
        try {
          if (interval === 'hourly') {
            // '2026-08-23 19:00' -> '19:00' or 'Aug 23 19:00'
            const parts = t.date.split(' ');
            if (parts.length === 2) {
              const [dStr, hStr] = parts;
              const d = new Date(dStr);
              const dayName = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return dayName ? `${dayName} ${hStr}` : hStr;
            }
            return t.date;
          }

          if (interval === 'monthly') {
            // '2026-08' -> 'Aug 2026'
            const [y, m] = t.date.split('-');
            if (y && m) {
              const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
              return isNaN(d.getTime()) ? t.date : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }
            return t.date;
          }

          if (interval === 'yearly') {
            return t.date; // '2026'
          }

          // Daily: '2026-08-20' -> 'Aug 20'
          const d = new Date(t.date);
          return isNaN(d.getTime()) ? t.date : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
          return t.date;
        }
      });

      const crit = activeTrends.map((t) => t.critical || 0);
      const hi = activeTrends.map((t) => t.high || 0);
      const mod = activeTrends.map((t) => t.moderate || 0);
      const lo = activeTrends.map((t) => t.low || 0);
      const inc = activeTrends.map((t) => t.incidents ?? (t.critical + t.high + t.moderate + t.low));
      const con = activeTrends.map((t) => t.concerns || 0);
      const tot = activeTrends.map((t) => t.total || (t.critical + t.high + t.moderate + t.low));

      const totalCount = tot.reduce((a, b) => a + b, 0);
      const criticalCount = crit.reduce((a, b) => a + b, 0);
      const highCount = hi.reduce((a, b) => a + b, 0);
      const moderateCount = mod.reduce((a, b) => a + b, 0);
      const lowCount = lo.reduce((a, b) => a + b, 0);
      const concernCount = con.reduce((a, b) => a + b, 0);

      return {
        dates: parsedDates,
        criticalSeries: crit,
        highSeries: hi,
        moderateSeries: mod,
        lowSeries: lo,
        incidentSeries: inc,
        concernSeries: con,
        totalSeries: tot,
        summaryStats: {
          total: totalCount,
          critical: criticalCount,
          high: highCount,
          moderate: moderateCount,
          low: lowCount,
          concerns: concernCount,
        },
      };
    }

    // Default fallback dates
    const fallbackDates: string[] = [];
    const zeroes: number[] = [];
    const now = new Date();

    if (interval === 'hourly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(d.getHours() - i * 4);
        fallbackDates.push(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        zeroes.push(0);
      }
    } else if (interval === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        fallbackDates.push(d.toLocaleDateString('en-US', { month: 'short' }));
        zeroes.push(0);
      }
    } else if (interval === 'yearly') {
      for (let i = 3; i >= 0; i--) {
        fallbackDates.push(String(now.getFullYear() - i));
        zeroes.push(0);
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        fallbackDates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        zeroes.push(0);
      }
    }

    return {
      dates: fallbackDates,
      criticalSeries: [...zeroes],
      highSeries: [...zeroes],
      moderateSeries: [...zeroes],
      lowSeries: [...zeroes],
      incidentSeries: [...zeroes],
      concernSeries: [...zeroes],
      totalSeries: [...zeroes],
      summaryStats: {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        concerns: 0,
      },
    };
  }, [trendData, interval]);

  const labelColor = isLight
    ? '#475569'
    : isBlueBlack
    ? '#93c5fd'
    : isSolar
    ? '#fde68a'
    : '#e2e8f0';

  const gridColor = isLight
    ? '#e2e8f0'
    : isBlueBlack
    ? '#1e293b'
    : isSolar
    ? '#451a03'
    : '#334155';

  // Dynamic series & colors based on viewMode
  const { currentSeries, currentColors } = useMemo(() => {
    switch (viewMode) {
      case 'report_types':
        return {
          currentSeries: [
            { name: 'Total Reports', data: totalSeries },
            { name: 'Emergency Incidents', data: incidentSeries },
            { name: 'Citizen Concerns', data: concernSeries },
          ],
          currentColors: ['#3B82F6', '#EF4444', '#06B6D4'],
        };

      case 'composite':
        return {
          currentSeries: [
            { name: 'Critical Severity', data: criticalSeries },
            { name: 'High Severity', data: highSeries },
            { name: 'Moderate Severity', data: moderateSeries },
            { name: 'Minor / Low Severity', data: lowSeries },
            { name: 'Citizen Concerns', data: concernSeries },
          ],
          currentColors: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4'],
        };

      case 'all_severity':
      default:
        return {
          currentSeries: [
            { name: 'Critical', data: criticalSeries },
            { name: 'High', data: highSeries },
            { name: 'Moderate', data: moderateSeries },
            { name: 'Minor / Low', data: lowSeries },
          ],
          currentColors: ['#EF4444', '#F97316', '#F59E0B', '#10B981'],
        };
    }
  }, [
    viewMode,
    totalSeries,
    incidentSeries,
    concernSeries,
    criticalSeries,
    highSeries,
    moderateSeries,
    lowSeries,
  ]);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 350,
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    colors: currentColors,
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: dates,
      labels: {
        style: {
          colors: labelColor,
          fontSize: '10px',
          fontWeight: 500,
        },
        rotate: interval === 'hourly' ? -35 : 0,
        rotateAlways: false,
      },
      axisBorder: {
        color: gridColor,
      },
      axisTicks: {
        color: gridColor,
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: {
          colors: labelColor,
          fontSize: '10px',
          fontWeight: 500,
        },
        formatter: (val: number) => Math.round(val).toString(),
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      padding: {
        left: 5,
        right: 5,
        top: 0,
        bottom: 0,
      },
    },
    theme: {
      mode: isLight ? 'light' : 'dark',
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontWeight: 600,
      labels: {
        colors: labelColor,
      },
      markers: {
        size: 5,
      },
    },
    tooltip: {
      theme: isLight ? 'light' : 'dark',
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => `${val} reports`,
      },
    },
  };

  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/50 text-blue-100 shadow-xl shadow-blue-950/40'
    : isSolar
    ? 'bg-stone-900 border-amber-900/60 text-amber-100 shadow-xl'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const isLoading = initialLoading || loadingInterval;

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[360px] transition-colors duration-300 ${containerBg}`}>
      {/* Header with Title, Interval Selector, Mode Switcher & Quick Stats */}
      <div className={`flex flex-col gap-2.5 pb-2.5 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          {/* Title & Stats */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : isSolar ? 'text-amber-100' : 'text-white'}`}>
                  INCIDENT &amp; CONCERN FREQUENCY TRENDS
                </h2>
                {isLoading && (
                  <Activity className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mt-0.5">
                <span className="text-rose-500 font-bold">Critical: {summaryStats.critical}</span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-500 font-bold">Mod: {summaryStats.moderate}</span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-500 font-bold">Minor: {summaryStats.low}</span>
                <span className="text-slate-400">·</span>
                <span className="text-cyan-500 font-bold">Concerns: {summaryStats.concerns}</span>
                <span className="text-slate-400">·</span>
                <span className="text-blue-500 font-bold">Total: {summaryStats.total}</span>
              </div>
            </div>
          </div>

          {/* Controls: Time Interval Selector & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Time Interval Selector */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
              {INTERVAL_CONFIG.map((item) => {
                const IconComponent = item.icon;
                const active = interval === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInterval(item.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm scale-100'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={item.description}
                  >
                    <IconComponent className={`w-3 h-3 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('all_severity')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                  viewMode === 'all_severity'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Show all severity levels: Critical, High, Moderate, Minor"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Severities</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('report_types')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                  viewMode === 'report_types'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Show Incidents vs Citizen Concerns vs Total"
              >
                <Megaphone className="w-3 h-3 text-cyan-400" />
                <span>Incidents vs Concerns</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('composite')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                  viewMode === 'composite'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Show All Signals: All Severities + Citizen Concerns"
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>All Signals</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-0 pt-1 relative">
        {isLoading && dates.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center animate-pulse gap-1 text-slate-400">
            <Activity className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-xs">Loading incident trend data...</span>
          </div>
        ) : (
          <ReactApexChart options={chartOptions} series={currentSeries} type="area" height="100%" />
        )}
      </div>
    </div>
  );
};

export default IncidentTrend;
