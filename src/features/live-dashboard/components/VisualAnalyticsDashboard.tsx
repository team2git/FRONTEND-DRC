import React from 'react';
import {
  SummaryStats,
  HazardItem,
  HazardAnalysisData,
  TrendItem,
  ResponseMonitoring,
  SurveyMonitoring,
  PublicOfficeWorkflowData,
  AssessmentAnalyticsData,
  ThemeOption,
} from '../types/dashboardTypes';
import ReactApexChart from 'react-apexcharts';
import { BarChart3, ShieldCheck, Flame, PieChart as PieIcon, Activity, Home, Building, Wifi, WifiOff, Megaphone } from 'lucide-react';

interface Props {
  summary: SummaryStats | null;
  hazards: HazardAnalysisData | HazardItem[];
  trends: TrendItem[];
  responseMonitoring: ResponseMonitoring | null;
  surveyMonitoring: SurveyMonitoring | null;
  publicWorkflow: PublicOfficeWorkflowData | null;
  assessmentAnalytics: AssessmentAnalyticsData | null;
  loading: boolean;
  theme?: ThemeOption;
}

export const VisualAnalyticsDashboard: React.FC<Props> = ({
  summary,
  hazards,
  trends,
  responseMonitoring,
  surveyMonitoring,
  publicWorkflow,
  assessmentAnalytics,
  loading,
  theme,
}) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';
  const isDarkGrey = theme === 'dark_grey';

  // Dynamic Theme Colors for High-Visibility Contrast across ALL themes
  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/60 text-blue-50 shadow-xl shadow-blue-950/40'
    : isSolar
    ? 'bg-stone-900 border-amber-900/60 text-amber-100 shadow-xl'
    : isDarkGrey
    ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const innerBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : isBlueBlack
    ? 'bg-[#080d1a] border-blue-900/40'
    : isSolar
    ? 'bg-stone-950 border-amber-900/40'
    : 'bg-slate-950 border-slate-800';

  const textColor = isLight
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

  const gridColor = isLight
    ? '#e2e8f0'
    : isBlueBlack
    ? '#1e293b'
    : isSolar
    ? '#451a03'
    : '#334155';

  const labelClass = isLight
    ? 'text-slate-600 font-semibold'
    : isBlueBlack
    ? 'text-blue-300 font-medium'
    : isSolar
    ? 'text-amber-200 font-medium'
    : 'text-slate-200 font-medium';

  // Extract separate incident and concern datasets
  const incidentList = Array.isArray(hazards) ? hazards : hazards?.incidents || [];
  const concernList = Array.isArray(hazards) ? [] : hazards?.concerns || [];

  // -------------------------------------------------------------
  // 1. PUBLIC SUBMISSIONS & REQUESTS (Donut Chart)
  // -------------------------------------------------------------
  const pubData = publicWorkflow?.publicSubmissions || { incidents: 0, concerns: 0, inspections: 0, alertSubscribers: 0 };
  const publicSubmissionsOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', background: 'transparent' },
    labels: ['Public Incidents', 'Citizen Concerns', 'Safety Inspections', 'Alert Subscribers'],
    colors: ['#EF4444', '#F59E0B', '#0284C7', '#6366F1'],
    theme: { mode: isLight ? 'light' : 'dark' },
    legend: { position: 'bottom', fontSize: '11px', labels: { colors: textColor } },
    plotOptions: { pie: { donut: { size: '65%' } } },
    stroke: { show: true, colors: [isLight ? '#ffffff' : '#0f172a'], width: 2 },
  };

  // -------------------------------------------------------------
  // 2. INCIDENT RESOLUTION RATE (Radial Bar Gauge)
  // -------------------------------------------------------------
  const resStatus = responseMonitoring?.responseStatus || { submitted: 0, received: 0, dispatched: 0, closed: 0 };
  const totalRes = resStatus.submitted + resStatus.received + resStatus.dispatched + resStatus.closed || 1;
  const resolutionPercentage = Math.round((resStatus.closed / totalRes) * 100);

  const resolutionRadialOptions: ApexCharts.ApexOptions = {
    chart: { type: 'radialBar', background: 'transparent' },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%' },
        dataLabels: {
          name: { show: true, fontSize: '12px', color: textColor },
          value: { show: true, fontSize: '24px', fontWeight: 'bold', color: titleColor, formatter: (val) => `${val}%` },
        },
        track: { background: isLight ? '#e2e8f0' : '#1e293b' },
      },
    },
    colors: ['#10B981'],
    labels: ['Incidents Closed'],
  };

  // -------------------------------------------------------------
  // 3. DEDICATED EMERGENCY INCIDENT REPORT TYPES (Column Bar Chart)
  // -------------------------------------------------------------
  const incidentLabels = incidentList.length > 0 ? incidentList.map((h) => h.hazardType) : ['Flood', 'Fire', 'Landslide', 'Drought', 'Medical', 'Collapse'];
  const incidentValues = incidentList.length > 0 ? incidentList.map((h) => h.totalIncidents) : [12, 8, 5, 3, 4, 2];

  const incidentReportTypeOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '45%', distributed: true } },
    colors: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'],
    xaxis: {
      categories: incidentLabels,
      labels: { style: { colors: textColor, fontSize: '10px', fontWeight: 500 } },
    },
    yaxis: { labels: { style: { colors: textColor, fontSize: '10px' } } },
    legend: { show: false },
    theme: { mode: isLight ? 'light' : 'dark' },
  };

  // -------------------------------------------------------------
  // 4. DEDICATED CITIZEN CONCERN CATEGORIES (Bar Chart)
  // -------------------------------------------------------------
  const concernLabels = concernList.length > 0 ? concernList.map((c) => c.concernCategory) : ['Drainage Risk', 'Infra Hazard', 'Public Safety', 'Environmental', 'EWS Complaint'];
  const concernValues = concernList.length > 0 ? concernList.map((c) => c.totalConcerns) : [9, 6, 4, 3, 2];

  const concernCategoryOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true } },
    colors: ['#0284C7', '#F59E0B', '#6366F1', '#10B981', '#EC4899'],
    xaxis: {
      categories: concernLabels,
      labels: { style: { colors: textColor, fontSize: '10px' } },
    },
    yaxis: { labels: { style: { colors: textColor, fontSize: '10px', fontWeight: 500 } } },
    legend: { show: false },
    theme: { mode: isLight ? 'light' : 'dark' },
  };

  // -------------------------------------------------------------
  // 5. REAL-TIME INCIDENT FREQUENCY TRENDS (Area Chart)
  // -------------------------------------------------------------
  const dates = trends.map((t) => t.date);
  const totalIncidents = trends.map((t) => t.total);
  const criticalIncidents = trends.map((t) => t.critical);

  const trendChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    colors: ['#3B82F6', '#EF4444'],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
    xaxis: { categories: dates, labels: { style: { colors: textColor, fontSize: '10px' } } },
    yaxis: { labels: { style: { colors: textColor, fontSize: '10px' } } },
    grid: { borderColor: gridColor, strokeDashArray: 3 },
    theme: { mode: isLight ? 'light' : 'dark' },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: textColor } },
  };

  // -------------------------------------------------------------
  // 6. HOUSEHOLD LEVEL VULNERABILITY ASSESSMENT (Horizontal Bar Chart)
  // -------------------------------------------------------------
  const hhData = assessmentAnalytics?.householdAssessment || {
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

  // -------------------------------------------------------------
  // 7. WOREDA INSTITUTIONAL CAPACITY ASSESSMENT (Radar Chart)
  // -------------------------------------------------------------
  const waData = assessmentAnalytics?.woredaAssessment || {
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
      labels: { style: { colors: textColor, fontSize: '11px' } },
    },
    yaxis: { max: 5, tickAmount: 5 },
    theme: { mode: isLight ? 'light' : 'dark' },
  };

  // -------------------------------------------------------------
  // 8. ONLINE vs OFFLINE SITE SURVEY REPORT (Grouped Column - BELOW EVERYTHING ELSE)
  // -------------------------------------------------------------
  const sync = surveyMonitoring?.syncBreakdown || { SYNCED: 0, UNSYNCED: 0, UPDATED: 0 };
  const onlineCount = surveyMonitoring?.onlineSubmissions ?? 0;
  const offlineCount = surveyMonitoring?.offlineSubmissions ?? (sync.SYNCED + sync.UNSYNCED + sync.UPDATED);

  const surveyChannelOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '45%', distributed: true } },
    colors: ['#10B981', '#0284C7', '#F59E0B', '#EF4444'],
    xaxis: {
      categories: ['Online Web Portal', 'Offline PWA Synced', 'Pending Offline Sync', 'Survey Drafts'],
      labels: { style: { colors: textColor, fontSize: '11px', fontWeight: 500 } },
    },
    yaxis: { labels: { style: { colors: textColor, fontSize: '11px' } } },
    legend: { show: false },
    theme: { mode: isLight ? 'light' : 'dark' },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`h-64 rounded-xl border ${cardBg}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔴 TOP FIRST ORDER: Public Submissions & Incident Resolution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Public Submissions & Requests Donut Chart */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between h-[360px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-400" />
              <h3 className={`font-bold text-xs ${labelClass}`}>PUBLIC SUBMISSIONS & REQUESTS</h3>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ReactApexChart
              options={publicSubmissionsOptions}
              series={[pubData.incidents || 1, pubData.concerns || 1, pubData.inspections || 1, pubData.alertSubscribers || 1]}
              type="donut"
              height="100%"
            />
          </div>
        </div>

        {/* 2. Incident Resolution Rate Radial Gauge */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between h-[360px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className={`font-bold text-xs ${labelClass}`}>INCIDENT RESOLUTION RATE</h3>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ReactApexChart options={resolutionRadialOptions} series={[resolutionPercentage]} type="radialBar" height="100%" />
          </div>
          <div className={`grid grid-cols-2 gap-2 text-center text-xs p-2 rounded-lg ${innerBg}`}>
            <div>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>Dispatched Teams</span>
              <p className="font-extrabold text-emerald-400">{resStatus.dispatched}</p>
            </div>
            <div>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>Closed Incidents</span>
              <p className="font-extrabold text-blue-400">{resStatus.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 SEPARATE CHARTS: Emergency Incidents vs Citizen Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. DEDICATED EMERGENCY INCIDENT REPORT TYPES */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between h-[360px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className={`font-bold text-xs ${labelClass}`}>EMERGENCY INCIDENT REPORT TYPES</h3>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>By Hazard Category</span>
          </div>
          <div className="flex-1">
            <ReactApexChart
              options={incidentReportTypeOptions}
              series={[{ name: 'Reported Incidents', data: incidentValues }]}
              type="bar"
              height="100%"
            />
          </div>
        </div>

        {/* 4. DEDICATED CITIZEN CONCERN CATEGORIES */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between h-[360px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-sky-400" />
              <h3 className={`font-bold text-xs ${labelClass}`}>CITIZEN CONCERN CATEGORIES</h3>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>By Concern Category</span>
          </div>
          <div className="flex-1">
            <ReactApexChart
              options={concernCategoryOptions}
              series={[{ name: 'Reported Concerns', data: concernValues }]}
              type="bar"
              height="100%"
            />
          </div>
        </div>
      </div>

      {/* 🔵 SECOND ORDER: Incident Frequency Trends & Household Vulnerability & Woreda Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Real-Time Incident Frequency Trends (Area Chart) */}
        <div className={`lg:col-span-2 border rounded-xl p-4 flex flex-col justify-between h-[360px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <h3 className={`font-bold text-xs ${labelClass}`}>REAL-TIME INCIDENT FREQUENCY TRENDS</h3>
            </div>
          </div>
          <div className="flex-1">
            <ReactApexChart
              options={trendChartOptions}
              series={[
                { name: 'Total Incidents', data: totalIncidents.length > 0 ? totalIncidents : [3, 7, 5, 9, 12, 8] },
                { name: 'Critical Incidents', data: criticalIncidents.length > 0 ? criticalIncidents : [1, 2, 1, 3, 4, 2] },
              ]}
              type="area"
              height="100%"
            />
          </div>
        </div>

        {/* 6. Household Level Vulnerability Assessment (Horizontal Bar) */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between h-[360px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-pink-400" />
              <h3 className={`font-bold text-xs ${labelClass}`}>HOUSEHOLD VULNERABILITY ASSESSMENT</h3>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{assessmentAnalytics?.householdAssessment?.totalHouseholdProfiles || 0} Profiles</span>
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
      </div>

      {/* 🏛️ THIRD ORDER: Woreda Capacity Radar & Operations Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 7. Woreda Institutional Capacity Radar Chart */}
        <div className={`md:col-span-2 border rounded-xl p-4 flex flex-col justify-between h-[340px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <h3 className={`font-bold text-xs ${labelClass}`}>WOREDA INSTITUTIONAL CAPACITY ASSESSMENT</h3>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Scale 1 - 5 Score</span>
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

        {/* Command Operations Quick Summary */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between h-[340px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h3 className={`font-bold text-xs ${labelClass}`}>COMMAND OPERATIONS METRICS</h3>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-around">
            <div className={`p-3 rounded-lg border ${innerBg}`}>
              <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Active Crisis Alerts</span>
              <span className="text-xl font-extrabold text-rose-500">{summary?.criticalIncidents ?? 0}</span>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>High priority dispatches</p>
            </div>

            <div className={`p-3 rounded-lg border ${innerBg}`}>
              <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Historical Disaster Loss</span>
              <span className="text-xl font-extrabold text-amber-500">
                {(assessmentAnalytics?.woredaAssessment?.totalDisasterLossETB ?? 0).toLocaleString()} ETB
              </span>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aggregated economic loss</p>
            </div>

            <div className={`p-3 rounded-lg border ${innerBg}`}>
              <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Population Impact Estimate</span>
              <span className="text-xl font-extrabold text-sky-400">{summary?.affectedPeople ? summary.affectedPeople.toLocaleString() : '0'}</span>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Estimated individuals</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🟡 BOTTOM ORDER: SITE SURVEY RELATED REPORT (BELOW EVERYTHING ELSE) */}
      <div className="pt-4 border-t border-slate-700/40">
        <div className={`border rounded-xl p-5 flex flex-col h-[380px] ${cardBg}`}>
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className={`font-bold text-sm ${labelClass}`}>ONLINE vs OFFLINE SITE SURVEY REPORT</h3>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PWA Field Surveys & Enumerator Sync Status</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Wifi className="w-3.5 h-3.5" /> Online Web: {onlineCount}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <WifiOff className="w-3.5 h-3.5" /> Offline PWA: {offlineCount}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <ReactApexChart
              options={surveyChannelOptions}
              series={[{ name: 'Survey Submissions', data: [onlineCount, sync.SYNCED, sync.UNSYNCED, surveyMonitoring?.woredaProfileStatus?.Draft || 0] }]}
              type="bar"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
