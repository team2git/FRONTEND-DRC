import React, { useState } from 'react';
import { SummaryStats, ThemeOption } from '../types/dashboardTypes';
import ReactApexChart from 'react-apexcharts';
import {
  AlertTriangle,
  Flame,
  Users,
  MapPin,
  Megaphone,
  Zap,
  TrendingUp,
  PieChart as PieIcon,
  Hash,
} from 'lucide-react';

interface Props {
  summary: SummaryStats | null;
  loading: boolean;
  theme?: ThemeOption;
}

export const KPICards: React.FC<Props> = ({ summary, loading, theme = 'light' }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';
  const isDarkGrey = theme === 'dark_grey';

  const [showCharts, setShowCharts] = useState<boolean>(true);

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-36 rounded-2xl animate-pulse border ${isLight
                ? 'bg-slate-200 border-slate-300'
                : isBlueBlack
                  ? 'bg-blue-950/40 border-blue-900/40'
                  : isSolar
                    ? 'bg-stone-900/50 border-amber-900/30'
                    : 'bg-slate-800/60 border-slate-700/50'
              }`}
          />
        ))}
      </div>
    );
  }

  // Live Metrics
  const activeCount = summary?.activeIncidents ?? 0;
  const todayCount = summary?.incidentsToday ?? 0;
  const concernsCount = summary?.publicConcernsCount ?? 0;
  const criticalCount = summary?.criticalIncidents ?? 0;
  const affectedCount = summary?.affectedPeople ?? 0;
  const woredasCount = summary?.affectedWoredas ?? 0;
  const responsesCount = summary?.activeResponses ?? 0;
  const pendingRespCount = summary?.pendingResponseRequests ?? 0;

  // -------------------------------------------------------------
  // Responsive Full-Width Micro-Charts (100% Fluid Scaling)
  // -------------------------------------------------------------

  // 1. Active Incidents: Full-Width Gradient Area Curve
  const renderActiveIncidentsChart = () => {
    const data = [
      Math.max(1, Math.round(activeCount * 0.3)),
      Math.max(2, Math.round(activeCount * 0.55)),
      Math.max(1, Math.round(activeCount * 0.45)),
      Math.max(2, Math.round(activeCount * 0.7)),
      Math.max(1, todayCount),
      Math.max(2, activeCount),
    ];
    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'area',
        sparkline: { enabled: true },
        background: 'transparent',
        animations: { enabled: true, speed: 500 },
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#F59E0B'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      tooltip: {
        theme: isLight ? 'light' : 'dark',
        x: { show: false },
        y: { formatter: (v: number) => `${v} incidents` },
      },
    };
    return (
      <div className="w-full h-11 mt-2">
        <ReactApexChart options={options} series={[{ name: 'Incidents', data }]} type="area" width="100%" height="100%" />
      </div>
    );
  };

  // 2. Citizen Concerns: Full-Width Rounded Bar Sparkline
  const renderCitizenConcernsChart = () => {
    const data = [
      Math.max(1, Math.round(concernsCount * 0.4)),
      Math.max(2, Math.round(concernsCount * 0.65)),
      Math.max(1, Math.round(concernsCount * 0.5)),
      Math.max(3, Math.round(concernsCount * 0.85)),
      Math.max(1, concernsCount),
    ];
    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'bar',
        sparkline: { enabled: true },
        background: 'transparent',
        animations: { enabled: true, speed: 500 },
      },
      colors: ['#0284C7'],
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 3,
        },
      },
      tooltip: {
        theme: isLight ? 'light' : 'dark',
        x: { show: false },
        y: { formatter: (v: number) => `${v} concerns` },
      },
    };
    return (
      <div className="w-full h-11 mt-2">
        <ReactApexChart options={options} series={[{ name: 'Concerns', data }]} type="bar" width="100%" height="100%" />
      </div>
    );
  };

  // 3. Critical Incidents: Stepped / Pulsing Alert Sparkline
  const renderCriticalIncidentsChart = () => {
    const isZero = criticalCount === 0;
    const data = isZero
      ? [0, 0, 0, 0, 0]
      : [
        Math.max(0, Math.round(criticalCount * 0.2)),
        Math.max(1, Math.round(criticalCount * 0.6)),
        Math.max(0, Math.round(criticalCount * 0.4)),
        Math.max(1, Math.round(criticalCount * 0.8)),
        criticalCount,
      ];
    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'area',
        sparkline: { enabled: true },
        background: 'transparent',
        animations: { enabled: true, speed: 500 },
      },
      stroke: { curve: 'stepline', width: 2 },
      colors: ['#EF4444'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      tooltip: {
        theme: isLight ? 'light' : 'dark',
        x: { show: false },
        y: { formatter: (v: number) => `${v} critical` },
      },
    };
    return (
      <div className="w-full h-11 mt-2">
        <ReactApexChart options={options} series={[{ name: 'Critical', data }]} type="area" width="100%" height="100%" />
      </div>
    );
  };

  // 4. Affected Population: Mountain Area Wave Spline
  const renderAffectedPopChart = () => {
    const base = Math.max(10, affectedCount);
    const data = [
      Math.round(base * 0.35),
      Math.round(base * 0.65),
      Math.round(base * 0.45),
      Math.round(base * 0.8),
      Math.round(base * 0.6),
      base,
    ];
    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'area',
        sparkline: { enabled: true },
        background: 'transparent',
        animations: { enabled: true, speed: 500 },
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#818CF8'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      tooltip: {
        theme: isLight ? 'light' : 'dark',
        x: { show: false },
        y: { formatter: (v: number) => `${v.toLocaleString()} persons` },
      },
    };
    return (
      <div className="w-full h-11 mt-2">
        <ReactApexChart options={options} series={[{ name: 'Population', data }]} type="area" width="100%" height="100%" />
      </div>
    );
  };

  // 5. Affected Woredas: Dual Tone Geographic Histogram
  const renderAffectedWoredasChart = () => {
    const data = [
      Math.min(5, Math.max(1, Math.round(woredasCount * 0.3))),
      Math.min(8, Math.max(2, Math.round(woredasCount * 0.55))),
      Math.min(6, Math.max(1, Math.round(woredasCount * 0.4))),
      Math.min(10, Math.max(3, Math.round(woredasCount * 0.8))),
      Math.min(11, Math.max(1, woredasCount)),
    ];
    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'bar',
        sparkline: { enabled: true },
        background: 'transparent',
        animations: { enabled: true, speed: 500 },
      },
      colors: ['#0D9488'],
      plotOptions: {
        bar: {
          columnWidth: '55%',
          borderRadius: 3,
        },
      },
      tooltip: {
        theme: isLight ? 'light' : 'dark',
        x: { show: false },
        y: { formatter: (v: number) => `${v} Woredas` },
      },
    };
    return (
      <div className="w-full h-11 mt-2">
        <ReactApexChart options={options} series={[{ name: 'Woredas', data }]} type="bar" width="100%" height="100%" />
      </div>
    );
  };

  // 6. Active Responses: Smooth Emerald Flow Sparkline
  const renderActiveResponsesChart = () => {
    const data = [
      Math.max(1, Math.round(responsesCount * 0.25)),
      Math.max(2, Math.round(responsesCount * 0.6)),
      Math.max(1, Math.round(responsesCount * 0.45)),
      Math.max(3, Math.round(responsesCount * 0.8)),
      Math.max(1, responsesCount),
    ];
    const options: ApexCharts.ApexOptions = {
      chart: {
        type: 'area',
        sparkline: { enabled: true },
        background: 'transparent',
        animations: { enabled: true, speed: 500 },
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#10B981'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      tooltip: {
        theme: isLight ? 'light' : 'dark',
        x: { show: false },
        y: { formatter: (v: number) => `${v} dispatched` },
      },
    };
    return (
      <div className="w-full h-11 mt-2">
        <ReactApexChart options={options} series={[{ name: 'Responses', data }]} type="area" width="100%" height="100%" />
      </div>
    );
  };

  const cards = [
    {
      title: 'Active Incidents',
      value: activeCount,
      badge: `${todayCount} reported today`,
      icon: Flame,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: isLight ? 'border-amber-200' : isBlueBlack ? 'border-amber-500/30' : 'border-amber-500/20',
      glow: 'hover:shadow-amber-500/10',
      renderChart: renderActiveIncidentsChart,
    },
    {
      title: 'Citizen Concerns',
      value: concernsCount,
      badge: 'Public Reports',
      icon: Megaphone,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: isLight ? 'border-sky-200' : isBlueBlack ? 'border-sky-500/30' : 'border-sky-500/20',
      glow: 'hover:shadow-sky-500/10',
      renderChart: renderCitizenConcernsChart,
    },
    {
      title: 'Critical Incidents',
      value: criticalCount,
      badge: 'Immediate Priority',
      icon: AlertTriangle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: isLight ? 'border-rose-200' : isBlueBlack ? 'border-rose-500/30' : 'border-rose-500/20',
      glow: 'hover:shadow-rose-500/10',
      renderChart: renderCriticalIncidentsChart,
    },
    {
      title: 'Affected Population',
      value: affectedCount ? affectedCount.toLocaleString() : '0',
      badge: 'Estimated Persons',
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: isLight ? 'border-indigo-200' : isBlueBlack ? 'border-indigo-500/30' : 'border-indigo-500/20',
      glow: 'hover:shadow-indigo-500/10',
      renderChart: renderAffectedPopChart,
    },
    {
      title: 'Affected Woredas',
      value: woredasCount,
      badge: 'Geographic Scope',
      icon: MapPin,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: isLight ? 'border-teal-200' : isBlueBlack ? 'border-teal-500/30' : 'border-teal-500/20',
      glow: 'hover:shadow-teal-500/10',
      renderChart: renderAffectedWoredasChart,
    },
    {
      title: 'Active Responses',
      value: responsesCount,
      badge: `${pendingRespCount} pending queue`,
      icon: Zap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: isLight ? 'border-emerald-200' : isBlueBlack ? 'border-emerald-500/30' : 'border-emerald-500/20',
      glow: 'hover:shadow-emerald-500/10',
      renderChart: renderActiveResponsesChart,
    },
  ];

  const cardContainerBg = isLight
    ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
    : isBlueBlack
      ? 'bg-[#0f172a] border-blue-900/50 shadow-lg shadow-blue-950/40 hover:border-blue-700/60'
      : isSolar
        ? 'bg-stone-900/90 border-amber-900/40 shadow-lg hover:border-amber-700/60'
        : isDarkGrey
          ? 'bg-neutral-900 border-neutral-800 shadow-lg hover:border-neutral-700'
          : 'bg-slate-900 border-slate-800 shadow-lg hover:border-slate-600';

  return (
    <div className="mb-6">
      {/* Header bar with Micro-Chart Toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-700' : isBlueBlack ? 'text-blue-300' : 'text-slate-300'}`}>
          KEY OPERATIONS PERFORMANCE INDICATORS (KPIS)
        </h3>

        <button
          onClick={() => setShowCharts((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${isLight
              ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              : isBlueBlack
                ? 'bg-[#0f172a] border-blue-900/60 text-blue-200 hover:bg-blue-950'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          title="Toggle Dynamic Micro-Charts"
        >
          {showCharts ? (
            <>
              <Hash className="w-3.5 h-3.5 text-blue-500" />
              <span>Compact View</span>
            </>
          ) : (
            <>
              <PieIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Visual Graphs View</span>
            </>
          )}
        </button>
      </div>

      {/* Fluid Responsive Grid: adapts seamlessly to any screen size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 min-w-0 hover:-translate-y-0.5 ${cardContainerBg} ${card.border} ${card.glow}`}
            >
              {/* Card Header: Title & Category Icon */}
              <div className="flex items-center justify-between mb-2 gap-1.5 min-w-0">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider truncate ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/80' : 'text-slate-400'
                  }`}>
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg shrink-0 ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>

              {/* KPI Value & Trend Subtitle */}
              <div className="min-w-0 my-0.5">
                <div className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${isLight ? 'text-slate-900' : isBlueBlack ? 'text-blue-50' : 'text-white'
                  }`}>
                  {card.value}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-medium mt-0.5 truncate ${isLight ? 'text-slate-500' : isBlueBlack ? 'text-blue-300/60' : 'text-slate-400'
                  }`}>
                  <TrendingUp className={`w-3 h-3 shrink-0 ${isLight ? 'text-slate-400' : 'text-blue-400/60'}`} />
                  <span className="truncate">{card.badge}</span>
                </div>
              </div>

              {/* Full-Width Fluid Responsive Micro-Chart */}
              {showCharts && card.renderChart()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
