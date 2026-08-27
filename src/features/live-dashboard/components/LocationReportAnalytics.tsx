import React, { useState, useMemo } from 'react';
import { MapIncident, ThemeOption } from '../types/dashboardTypes';
import ReactApexChart from 'react-apexcharts';
import {
  MapPin,
  Building2,
  Compass,
  Search,
  PieChart as PieIcon,
  Navigation,
} from 'lucide-react';
import { findSubcityByCoordinates } from '@/utils/geoReverseLookup';

interface Props {
  incidents: MapIncident[];
  loading?: boolean;
  theme?: ThemeOption;
}

type TabMode = 'subcity' | 'woreda' | 'places' | 'proportion';

export const LocationReportAnalytics: React.FC<Props> = ({
  incidents = [],
  loading = false,
  theme = 'light',
}) => {
  const [tab, setTab] = useState<TabMode>('subcity');
  const [selectedSubcityFilter, setSelectedSubcityFilter] = useState<string>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'incident' | 'concern'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const headerBorder = isLight
    ? 'border-slate-200'
    : isBlueBlack
    ? 'border-blue-900/50'
    : isSolar
    ? 'border-amber-900/60'
    : 'border-slate-800';

  const textColor = isLight ? '#334155' : isBlueBlack ? '#93c5fd' : isSolar ? '#fde68a' : '#e2e8f0';

  // Normalize location attributes for every incident
  const enrichedIncidents = useMemo(() => {
    return incidents.map((item) => {
      let subCity = item.subCity?.trim() || '';
      let woreda = item.woreda?.trim() || '';
      let placeName = item.placeName?.trim() || '';
      let addressLine = item.addressLine?.trim() || '';

      // Fallback coordinate subcity resolution if empty
      if (!subCity && item.latitude && item.longitude) {
        subCity = findSubcityByCoordinates(item.latitude, item.longitude) || '';
      }

      // If locationName has comma-separated parts, extract placeName / address
      if (!placeName && item.locationName) {
        placeName = item.locationName;
      }

      return {
        ...item,
        subCity: subCity || 'Unspecified Sub-City',
        woreda: woreda || 'Woreda Area',
        placeName: placeName || addressLine || 'Local Area',
        addressLine: addressLine || placeName || 'Street Landmark',
      };
    });
  }, [incidents]);

  // Unique list of subcities for filtering
  const allSubcities = useMemo(() => {
    const set = new Set<string>();
    enrichedIncidents.forEach((item) => {
      if (item.subCity && item.subCity !== 'Unspecified Sub-City') {
        set.add(item.subCity);
      }
    });
    return Array.from(set).sort();
  }, [enrichedIncidents]);

  // Filtered dataset based on user controls
  const filteredData = useMemo(() => {
    return enrichedIncidents.filter((item) => {
      if (selectedSubcityFilter !== 'all' && item.subCity !== selectedSubcityFilter) {
        return false;
      }
      if (reportTypeFilter !== 'all' && item.reportType !== reportTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.subCity.toLowerCase().includes(q) ||
          item.woreda.toLowerCase().includes(q) ||
          item.placeName.toLowerCase().includes(q) ||
          item.addressLine.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.reportCode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [enrichedIncidents, selectedSubcityFilter, reportTypeFilter, searchQuery]);

  // Aggregated KPIs
  const totalReports = filteredData.length;
  const incidentCount = filteredData.filter((i) => i.reportType === 'incident').length;
  const concernCount = filteredData.filter((i) => i.reportType === 'concern').length;
  const criticalCount = filteredData.filter((i) => i.severity === 'critical').length;

  // Subcity breakdown aggregation
  const subcityStats = useMemo(() => {
    const map = new Map<string, { total: number; incidents: number; concerns: number; critical: number }>();
    filteredData.forEach((item) => {
      const sub = item.subCity;
      const current = map.get(sub) || { total: 0, incidents: 0, concerns: 0, critical: 0 };
      current.total += 1;
      if (item.reportType === 'incident') current.incidents += 1;
      if (item.reportType === 'concern') current.concerns += 1;
      if (item.severity === 'critical') current.critical += 1;
      map.set(sub, current);
    });

    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Woreda breakdown aggregation
  const woredaStats = useMemo(() => {
    const map = new Map<string, { subcity: string; total: number; incidents: number; concerns: number }>();
    filteredData.forEach((item) => {
      const key = `${item.subCity} - ${item.woreda}`;
      const current = map.get(key) || { subcity: item.subCity, total: 0, incidents: 0, concerns: 0 };
      current.total += 1;
      if (item.reportType === 'incident') current.incidents += 1;
      if (item.reportType === 'concern') current.concerns += 1;
      map.set(key, current);
    });

    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredData]);

  // Place name / address cluster aggregation
  const placeClusters = useMemo(() => {
    const map = new Map<string, { subCity: string; woreda: string; total: number; incidents: number; concerns: number; addressLine: string }>();
    filteredData.forEach((item) => {
      const place = item.placeName || item.addressLine || 'Area Cluster';
      const key = `${place} (${item.subCity})`;
      const current = map.get(key) || {
        subCity: item.subCity,
        woreda: item.woreda,
        total: 0,
        incidents: 0,
        concerns: 0,
        addressLine: item.addressLine,
      };
      current.total += 1;
      if (item.reportType === 'incident') current.incidents += 1;
      if (item.reportType === 'concern') current.concerns += 1;
      map.set(key, current);
    });

    return Array.from(map.entries())
      .map(([place, stats]) => ({ place, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [filteredData]);

  // Top hotspots summary
  const topSubcity = subcityStats[0]?.name || 'N/A';
  const topWoreda = woredaStats[0]?.name || 'N/A';
  const topPlace = placeClusters[0]?.place || 'N/A';

  // ApexCharts Configs: Subcity Stacked / Grouped Bar
  const subcityChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 4,
      },
    },
    colors: ['#EF4444', '#8B5CF6'], // Incidents: Red/Orange, Concerns: Purple
    xaxis: {
      categories: subcityStats.map((s) => s.name),
      labels: {
        style: { colors: textColor, fontSize: '11px', fontWeight: 600 },
        rotate: -35,
        trim: true,
      },
      axisBorder: { show: false },
    },
    yaxis: {
      title: { text: 'Report Count', style: { color: textColor, fontSize: '11px' } },
      labels: { style: { colors: textColor } },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: textColor },
    },
    tooltip: {
      theme: isLight ? 'light' : 'dark',
      y: { formatter: (val) => `${val} reports` },
    },
    grid: {
      borderColor: isLight ? '#E2E8F0' : '#1E293B',
    },
  };

  const subcityChartSeries = [
    {
      name: 'Incidents',
      data: subcityStats.map((s) => s.incidents),
    },
    {
      name: 'Concerns',
      data: subcityStats.map((s) => s.concerns),
    },
  ];

  // ApexCharts Configs: Woreda Horizontal Bar
  const woredaChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '65%',
        distributed: true,
      },
    },
    colors: [
      '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
      '#10B981', '#14B8A6', '#06B6D4', '#F59E0B', '#F97316',
      '#84CC16', '#A855F7', '#0EA5E9', '#D946EF', '#64748B',
    ],
    xaxis: {
      categories: woredaStats.map((w) => w.name),
      labels: { style: { colors: textColor, fontSize: '10px' } },
    },
    yaxis: {
      labels: { style: { colors: textColor, fontSize: '11px', fontWeight: 500 } },
    },
    legend: { show: false },
    tooltip: {
      theme: isLight ? 'light' : 'dark',
      y: { formatter: (val) => `${val} total reports` },
    },
    grid: {
      borderColor: isLight ? '#E2E8F0' : '#1E293B',
    },
  };

  const woredaChartSeries = [
    {
      name: 'Reports',
      data: woredaStats.map((w) => w.total),
    },
  ];

  // ApexCharts Configs: Donut Proportion
  const donutChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    labels: subcityStats.slice(0, 8).map((s) => s.name),
    colors: ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#F97316', '#06B6D4', '#64748B'],
    legend: {
      position: 'bottom',
      labels: { colors: textColor },
      fontSize: '11px',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Reports',
              color: textColor,
              formatter: () => `${totalReports}`,
            },
          },
        },
      },
    },
    stroke: { width: 2, colors: [isLight ? '#FFFFFF' : '#0F172A'] },
    tooltip: {
      theme: isLight ? 'light' : 'dark',
    },
  };

  const donutChartSeries = subcityStats.slice(0, 8).map((s) => s.total);

  return (
    <div className={`border rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full w-full min-h-[420px] transition-all duration-300 ${containerBg}`}>
      {/* ─── Card Header ─── */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b ${headerBorder}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20 shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight uppercase">
                Incident &amp; Concern Location Analytics
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {totalReports} Reports Mapped
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Spatial breakdown across Sub-Cities, Woredas, Places &amp; Street Landmarks
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-black/25 border border-slate-200 dark:border-slate-800 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setTab('subcity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'subcity'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sub-City</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('woreda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'woreda'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Woreda</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('places')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'places'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Hotspot Clusters</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('proportion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'proportion'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Proportion</span>
          </button>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 my-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subcity, woreda, place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border transition ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                : isBlueBlack
                ? 'bg-[#15233e] border-blue-900/60 text-blue-100 placeholder:text-blue-400/50'
                : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
        </div>

        {/* Subcity Filter */}
        <select
          value={selectedSubcityFilter}
          onChange={(e) => setSelectedSubcityFilter(e.target.value)}
          className={`px-3 py-1.5 text-xs rounded-xl border transition ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : isBlueBlack
              ? 'bg-[#15233e] border-blue-900/60 text-blue-100'
              : 'bg-slate-800 border-slate-700 text-white'
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          <option value="all">All Sub-Cities ({allSubcities.length})</option>
          {allSubcities.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        {/* Report Type Filter */}
        <select
          value={reportTypeFilter}
          onChange={(e) => setReportTypeFilter(e.target.value as any)}
          className={`px-3 py-1.5 text-xs rounded-xl border transition ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : isBlueBlack
              ? 'bg-[#15233e] border-blue-900/60 text-blue-100'
              : 'bg-slate-800 border-slate-700 text-white'
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          <option value="all">All Types (Incidents &amp; Concerns)</option>
          <option value="incident">Incidents Only</option>
          <option value="concern">Concerns Only</option>
        </select>

        {/* Quick Reset if filters active */}
        {(selectedSubcityFilter !== 'all' || reportTypeFilter !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedSubcityFilter('all');
              setReportTypeFilter('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-1 py-1.5"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ─── Metric Badges Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : isBlueBlack ? 'bg-[#121e35] border-blue-900/40' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Reports</span>
          <span className="text-base font-black text-blue-500">{totalReports}</span>
          <span className="text-[10px] text-slate-400 block">{incidentCount} Inc. • {concernCount} Con.</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : isBlueBlack ? 'bg-[#121e35] border-blue-900/40' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Sub-City</span>
          <span className="text-sm font-black truncate block text-indigo-400">{topSubcity}</span>
          <span className="text-[10px] text-slate-400 block">{subcityStats[0]?.total || 0} reports</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : isBlueBlack ? 'bg-[#121e35] border-blue-900/40' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Woreda</span>
          <span className="text-sm font-black truncate block text-pink-400">{topWoreda}</span>
          <span className="text-[10px] text-slate-400 block">{woredaStats[0]?.total || 0} reports</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200/80' : isBlueBlack ? 'bg-[#121e35] border-blue-900/40' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Place Hotspot</span>
          <span className="text-sm font-black truncate block text-rose-500" title={topPlace}>{topPlace}</span>
          <span className="text-[10px] text-slate-400 block">{criticalCount} critical flags</span>
        </div>
      </div>

      {/* ─── Main Chart / View Content ─── */}
      <div className="flex-1 min-h-[260px]">
        {loading ? (
          <div className="h-full flex items-center justify-center animate-pulse">
            <span className="text-xs text-slate-400">Loading location reports and graphs...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MapPin className="w-8 h-8 mb-2 opacity-40 text-blue-400" />
            <p className="text-xs font-bold">No incident or concern reports matching this location filter.</p>
            <button
              onClick={() => {
                setSelectedSubcityFilter('all');
                setReportTypeFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {tab === 'subcity' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1 px-1">
                  <span>Incident vs Concern Breakdown by Sub-City</span>
                  <span>{subcityStats.length} Sub-Cities</span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <ReactApexChart
                    options={subcityChartOptions}
                    series={subcityChartSeries}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>
            )}

            {tab === 'woreda' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1 px-1">
                  <span>Woreda-Level Report Distribution (Top Ranked)</span>
                  <span>{woredaStats.length} Woredas</span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <ReactApexChart
                    options={woredaChartOptions}
                    series={woredaChartSeries}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>
            )}

            {tab === 'places' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1">
                  <span>Top Reported Places, Landmarks &amp; Address Lines</span>
                  <span>{placeClusters.length} Clusters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[300px] pr-1">
                  {placeClusters.map((c, i) => (
                    <div
                      key={c.place + i}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition hover:shadow-md ${
                        isLight
                          ? 'bg-slate-50/70 border-slate-200'
                          : isBlueBlack
                          ? 'bg-[#15233e] border-blue-900/60'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-500 text-[10px] font-black flex items-center justify-center shrink-0">
                            #{i + 1}
                          </span>
                          <span className="text-xs font-bold line-clamp-1">{c.place}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shrink-0">
                          {c.total}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{c.subCity} • {c.woreda}</span>
                        <span className="font-semibold text-slate-500 shrink-0">
                          {c.incidents} Inc / {c.concerns} Con
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'proportion' && (
              <div className="h-full flex flex-col lg:flex-row items-center justify-around gap-4">
                <div className="w-full lg:w-1/2 h-64 flex items-center justify-center">
                  <ReactApexChart
                    options={donutChartOptions}
                    series={donutChartSeries}
                    type="donut"
                    height="100%"
                  />
                </div>
                <div className="w-full lg:w-1/2 space-y-2">
                  <span className="text-xs font-bold text-slate-400 block mb-2">
                    Sub-City Share &amp; Type Ratios
                  </span>
                  {subcityStats.slice(0, 5).map((s) => {
                    const percentage = totalReports > 0 ? Math.round((s.total / totalReports) * 100) : 0;
                    return (
                      <div key={s.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-slate-400">{s.total} reports ({percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Card Footer: Quick Location Details List ─── */}
      <div className={`mt-3 pt-3 border-t ${headerBorder} flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Incidents: {incidentCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Concerns: {concernCount}
          </span>
        </div>
        <span>Coordinates, Subcity &amp; Woreda auto-aggregated from map submissions</span>
      </div>
    </div>
  );
};
