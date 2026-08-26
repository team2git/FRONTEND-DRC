import React from 'react';
import { AssessmentAnalyticsData, ThemeOption } from '../types/dashboardTypes';
import ReactApexChart from 'react-apexcharts';
import { Home, Building } from 'lucide-react';

interface Props {
  data: AssessmentAnalyticsData | null;
  loading: boolean;
  theme?: ThemeOption;
}

export const AssessmentAnalyticsCard: React.FC<Props> = ({ data, loading, theme = 'light' }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';

  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/50 text-blue-100 shadow-xl shadow-blue-950/40'
    : isSolar
    ? 'bg-stone-900 border-amber-900/60 text-amber-100 shadow-xl'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const textColor = isLight ? '#334155' : isBlueBlack ? '#93c5fd' : isSolar ? '#fde68a' : '#e2e8f0';

  const hhData = data?.householdAssessment || {
    femaleHeadedPercentage: 24,
    idpPercentage: 8,
    informalSettlementPercentage: 18,
    emergencyPlanPercentage: 42,
  };

  const householdAssessmentOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true } },
    colors: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981'],
    xaxis: {
      categories: [
        'Female-Headed HHs (%)',
        'IDP Households (%)',
        'Informal Settlements (%)',
        'Emergency Plan Exists (%)',
      ],
      labels: { style: { colors: textColor, fontSize: '10px' } },
    },
    yaxis: { labels: { style: { colors: textColor, fontSize: '11px', fontWeight: 500 } } },
    legend: { show: false },
    theme: { mode: isLight ? 'light' : 'dark' },
  };

  const waData = data?.woredaAssessment || {
    avgKiiEwsScore: 3.8,
    avgKiiInstitutionalScore: 4.1,
    avgKiiInfrastructureScore: 3.5,
    totalDisasterLossETB: 1250000,
  };

  const woredaAssessmentOptions: ApexCharts.ApexOptions = {
    chart: { type: 'radar', background: 'transparent' },
    colors: ['#3B82F6'],
    stroke: { width: 2 },
    fill: { opacity: 0.4 },
    markers: { size: 4 },
    xaxis: {
      categories: ['Early Warning (EWS)', 'Institutional Strength', 'Emergency Infra', 'Community Preparedness', 'Recovery Plan'],
      labels: { style: { colors: textColor, fontSize: '10px' } },
    },
    yaxis: { max: 5, tickAmount: 5 },
    theme: { mode: isLight ? 'light' : 'dark' },
  };

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[360px] transition-colors duration-300 ${containerBg}`}>
      <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-400" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : isSolar ? 'text-amber-100' : 'text-white'}`}>
            HOUSEHOLD VULNERABILITY &amp; INSTITUTIONAL CAPACITY
          </h2>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex-1 flex items-center justify-center animate-pulse">
          <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Loading assessment analytics...</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 items-center">
        {/* Left: Household vulnerability bar */}
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-pink-400">
            <Home className="w-3.5 h-3.5" />
            <span>Household Vulnerability</span>
          </div>
          <div className="flex-1">
            <ReactApexChart
              options={householdAssessmentOptions}
              series={[
                {
                  name: 'Percentage (%)',
                  data: [
                    hhData.femaleHeadedPercentage,
                    hhData.idpPercentage,
                    hhData.informalSettlementPercentage,
                    hhData.emergencyPlanPercentage,
                  ],
                },
              ]}
              type="bar"
              height="100%"
            />
          </div>
        </div>

        {/* Right: Woreda Capacity Radar */}
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-blue-400">
            <Building className="w-3.5 h-3.5" />
            <span>Institutional Capacity Score (1 - 5)</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ReactApexChart
              options={woredaAssessmentOptions}
              series={[
                {
                  name: 'Institutional Score (1-5)',
                  data: [
                    waData.avgKiiEwsScore,
                    waData.avgKiiInstitutionalScore,
                    waData.avgKiiInfrastructureScore,
                    4.0,
                    3.9,
                  ],
                },
              ]}
              type="radar"
              height="100%"
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
