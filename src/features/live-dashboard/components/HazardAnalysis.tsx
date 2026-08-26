import React from 'react';
import { HazardItem, HazardAnalysisData, ThemeOption } from '../types/dashboardTypes';
import ReactApexChart from 'react-apexcharts';
import { PieChart } from 'lucide-react';

interface Props {
  hazards: HazardAnalysisData | HazardItem[];
  loading: boolean;
  theme?: ThemeOption;
}

export const HazardAnalysis: React.FC<Props> = ({ hazards, loading, theme }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';

  const incidentItems: HazardItem[] = Array.isArray(hazards) ? hazards : hazards?.incidents || [];

  const categories = incidentItems.map((h) => h.hazardType);
  const series = incidentItems.map((h) => h.totalIncidents);

  const labelColor = isLight
    ? '#334155'
    : isBlueBlack
    ? '#93c5fd'
    : isSolar
    ? '#fde68a'
    : '#e2e8f0';

  const titleColor = isLight
    ? '#0f172a'
    : isBlueBlack
    ? '#ffffff'
    : isSolar
    ? '#fffbe6'
    : '#ffffff';

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    labels: categories.length > 0 ? categories : ['No Hazards Data'],
    theme: {
      mode: isLight ? 'light' : 'dark',
    },
    colors: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'],
    stroke: {
      show: true,
      colors: [isLight ? '#ffffff' : '#0f172a'],
      width: 2,
    },
    legend: {
      position: 'bottom',
      fontSize: '11px',
      labels: {
        colors: labelColor,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
      },
    },
    tooltip: {
      theme: isLight ? 'light' : 'dark',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Hazards',
              color: labelColor,
              formatter: () => series.reduce((a, b) => a + b, 0).toString(),
            },
            value: {
              color: titleColor,
              fontSize: '18px',
              fontWeight: 'bold',
            },
          },
        },
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

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[360px] transition-colors duration-300 ${containerBg}`}>
      <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-amber-500" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : isSolar ? 'text-amber-100' : 'text-white'}`}>
            INCIDENT ANALYSIS BY HAZARD TYPE
          </h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {loading && incidentItems.length === 0 ? (
          <div className="h-full flex items-center justify-center animate-pulse">
            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Loading hazard data...</span>
          </div>
        ) : (
          <ReactApexChart
            options={chartOptions}
            series={series.length > 0 ? series : [1]}
            type="donut"
            height="100%"
          />
        )}
      </div>
    </div>
  );
};
