import { useEffect, useState, useRef, useMemo } from 'react';
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import PageMeta from "../../components/common/PageMeta";
import { getDashboardStats, DashboardStats } from "../../api/dashboardService";
import { getWoredaProfiles, type WoredaProfile } from "../../api/woredaProfileService";
import {
  addisAbabaGeoData, ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM, ADDIS_ABABA_BOUNDS,
  getRiskColor, getRiskLevel
} from "../DRM/addisAbabaGeoData";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  Database, AlertTriangle, Map as MapIcon, RefreshCw,
  User as UserIcon, Clock, Shield, BarChart3, Users, Building2, BookOpen
} from 'lucide-react';

type TabKey = 'drm' | 'admin';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('drm');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profiles, setProfiles] = useState<WoredaProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, profilesData] = await Promise.all([
        getDashboardStats(),
        getWoredaProfiles()
      ]);
      setStats(statsData);
      setProfiles(profilesData);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Build subcity risk lookup for GIS map
  const subcityRiskMap = useMemo(() => {
    const map: Record<string, {
      risk: number; population: number; hazard: number;
      exposure: number; vulnerability: number; capacity: number; profiles: number;
    }> = {};
    profiles.forEach(p => {
      const name = p.location.subcity;
      if (!name) return;
      const risk = p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 0;
      const pop = p.demographics?.total_population || p.hierarchy_summary?.total_population || 0;
      const hazard = p.risk_index?.hazard_index || p.hierarchy_summary?.hazard_score || 0;
      const exposure = p.risk_index?.exposure_index || p.hierarchy_summary?.exposure_score || 0;
      const vulnerability = p.risk_index?.vulnerability_index || p.hierarchy_summary?.vulnerability_score || 0;
      const capacity = p.risk_index?.capacity_index || p.hierarchy_summary?.capacity_score || 0;
      if (!map[name]) {
        map[name] = { risk, population: pop, hazard, exposure, vulnerability, capacity, profiles: 1 };
      } else {
        const e = map[name];
        const t = e.profiles + 1;
        e.risk = ((e.risk * e.profiles) + risk) / t;
        e.population += pop;
        e.hazard = ((e.hazard * e.profiles) + hazard) / t;
        e.exposure = ((e.exposure * e.profiles) + exposure) / t;
        e.vulnerability = ((e.vulnerability * e.profiles) + vulnerability) / t;
        e.capacity = ((e.capacity * e.profiles) + capacity) / t;
        e.profiles = t;
      }
    });
    return map;
  }, [profiles]);

  // Leaflet GIS map init
  useEffect(() => {
    if (activeTab !== 'drm') return;
    if (!mapContainerRef.current) return;

    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true, attributionControl: false,
      minZoom: 10, maxZoom: 14,
      maxBounds: L.latLngBounds(ADDIS_ABABA_BOUNDS[0], ADDIS_ABABA_BOUNDS[1]),
    }).setView(ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    L.geoJSON(addisAbabaGeoData as any, {
      style: (feature) => {
        const name = (feature as any)?.properties?.name || '';
        const data = subcityRiskMap[name];
        const riskScore = data ? data.risk : 0;
        const fillColor = data ? getRiskColor(riskScore) : '#cbd5e1';
        return { fillColor, weight: 2, opacity: 1, color: '#ffffff', fillOpacity: 0.80 };
      },
      onEachFeature: (feature, layer) => {
        const name = (feature as any)?.properties?.name || '';
        const data = subcityRiskMap[name];
        const riskScore = data ? data.risk : 0;
        const riskLevel = getRiskLevel(riskScore);
        const population = data ? data.population : 0;

        layer.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif;padding:6px;min-width:200px;">
            <div style="font-weight:900;font-size:14px;margin-bottom:8px;color:#1e293b;">${name}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;">
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Risk Level</div>
                <div style="font-weight:800;color:${riskLevel.color};">${riskLevel.label}</div>
              </div>
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Score</div>
                <div style="font-weight:800;color:${riskLevel.color};">${riskScore.toFixed(1)} / 10</div>
              </div>
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Population</div>
                <div style="font-weight:800;color:#334155;">${population > 0 ? population.toLocaleString() : 'N/A'}</div>
              </div>
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Profiles</div>
                <div style="font-weight:800;color:#334155;">${data?.profiles || 0}</div>
              </div>
            </div>
          </div>
        `, { sticky: true, className: 'risk-map-tooltip' });

        (layer as L.Polygon).on('mouseover', () => {
          (layer as L.Polygon).setStyle({ fillOpacity: 0.95, weight: 3 });
        });
        (layer as L.Polygon).on('mouseout', () => {
          (layer as L.Polygon).setStyle({ fillOpacity: 0.80, weight: 2 });
        });

        const bounds = (layer as any).getBounds?.();
        if (bounds) {
          const center = bounds.getCenter();
          L.marker(center, {
            icon: L.divIcon({
              className: '',
              html: `<span style="font-family:'Outfit',sans-serif;font-weight:800;font-size:10px;color:#334155;text-shadow:0 0 4px #fff,0 0 8px #fff;white-space:nowrap;">${name}</span>`,
              iconSize: [80, 16],
              iconAnchor: [40, 8]
            })
          }).addTo(map);
        }
      }
    }).addTo(map);

    mapRef.current = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [activeTab, profiles, subcityRiskMap]);

  // ─── Chart configs ────────────────────────────────────────────────────────

  // Woreda Profile status donut chart
  const woredaDonutOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: ['#f59e0b', '#143f84', '#10b981'],
    labels: ['Draft', 'Submitted', 'Reviewed'],
    legend: { position: 'bottom', fontSize: '12px' },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '13px', fontWeight: 700 } } } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v} profiles` } }
  };
  const woredaDonutSeries = [
    stats?.woredaByStatus?.Draft || 0,
    stats?.woredaByStatus?.Submitted || 0,
    stats?.woredaByStatus?.Reviewed || 0,
  ];

  // Template status donut
  const templateDonutOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: ['#f59e0b', '#4b6dc2', '#94a3b8'],
    labels: ['Draft', 'Published', 'Archived'],
    legend: { position: 'bottom', fontSize: '12px' },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '13px', fontWeight: 700 } } } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v} templates` } }
  };
  const templateDonutSeries = [
    stats?.templatesByStatus?.Draft || 0,
    stats?.templatesByStatus?.Published || 0,
    stats?.templatesByStatus?.Archived || 0,
  ];

  // Mapping status donut
  const mappingDonutOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: ['#f59e0b', '#6c88d4', '#94a3b8'],
    labels: ['Draft', 'Published', 'Archived'],
    legend: { position: 'bottom', fontSize: '12px' },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '13px', fontWeight: 700 } } } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v} mappings` } }
  };
  const mappingDonutSeries = [
    stats?.mappingsByStatus?.Draft || 0,
    stats?.mappingsByStatus?.Published || 0,
    stats?.mappingsByStatus?.Archived || 0,
  ];

  // Survey sync status bar chart
  const surveyBarOptions: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
    colors: ['#10b981', '#ef4444', '#f59e0b'],
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 6 } },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
    xaxis: { categories: ['SYNCED', 'UNSYNCED', 'UPDATED'], axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    grid: { borderColor: '#f1f5f9' },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => `${v} responses` } }
  };
  const surveyBarSeries = [{
    name: 'Survey Responses',
    data: [
      stats?.surveysBySyncStatus?.SYNCED || 0,
      stats?.surveysBySyncStatus?.UNSYNCED || 0,
      stats?.surveysBySyncStatus?.UPDATED || 0,
    ]
  }];

  // User Admin - users by access level horizontal bar
  const usersLevelOptions: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
    colors: ['#e11d2d'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 }, offsetX: 5 },
    xaxis: { categories: (stats?.usersByAccessLevel || []).map(u => u.accessLevel.replace(/_/g, ' ')), axisBorder: { show: false } },
    yaxis: { labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    grid: { borderColor: '#f1f5f9' },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => `${v} users` } }
  };
  const usersLevelSeries = [{ name: 'Users', data: (stats?.usersByAccessLevel || []).map(u => u.count) }];

  // Users by organization donut
  const usersOrgOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: ['#e11d2d', '#143f84', '#6c88d4', '#10b981', '#f59e0b', '#bf1124', '#d92d20'],
    labels: (stats?.usersByOrganization || []).map(u => u.organizationName || 'Unknown'),
    legend: { position: 'bottom', fontSize: '11px' },
    plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: 'Users', fontSize: '13px', fontWeight: 700 } } } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v} users` } }
  };
  const usersOrgSeries = (stats?.usersByOrganization || []).map(u => u.count);

  // Severity badge helper
  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
      default: return 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20';
    }
  };

  const formatAction = (a: string) => a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  // Stat card component
  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-4`}>
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <h4 className="mt-1 text-2xl font-black text-gray-800 dark:text-white/90">{value.toLocaleString()}</h4>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-[#e11d2d] animate-spin" />
        <span className="text-gray-500 dark:text-gray-400 font-medium">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/10 max-w-xl mx-auto my-12">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="text-red-600 size-6 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-400 mb-1">Dashboard Error</h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-[#e11d2d] text-white rounded-xl text-xs font-semibold hover:bg-[#bf1124] transition">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Disaster Risk Dashboard | IDRMIS"
        description="Dynamic disaster risk management dashboard with maps, charts, and audit logs."
      />

      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#e11d2d] animate-pulse" />
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
              {stats?.userInfo?.organizationName} · <span className="capitalize">{stats?.userInfo?.accessLevel?.replace(/_/g, ' ')}</span> access
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Tab Navigation */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
              {([
                { key: 'drm', label: 'Overview', icon: Shield },
                { key: 'admin', label: 'User Admin', icon: Users },
              ] as { key: TabKey; label: string; icon: any }[]).map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform active:scale-95 ${isActive
                      ? 'bg-gradient-to-r from-[#e11d2d] to-red-600 text-white shadow-md shadow-red-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    <tab.icon className={`size-3.5 transition-transform duration-300 ${isActive ? 'rotate-12 scale-110' : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="flex items-center justify-center p-2.5 border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-[#e11d2d] dark:hover:text-red-400 text-slate-500 dark:text-slate-400 shadow-sm transition-all duration-200 active:scale-95 group"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ DRM TAB */}
        {activeTab === 'drm' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <EcommerceMetrics />

            {/* Status Breakdown Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Woreda Profile status donut */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1 flex items-center gap-2">
                  <MapIcon className="size-4 text-red-500" /> Woreda Profiles
                </h3>
                <p className="text-xs text-gray-400 mb-3">By review status</p>
                <Chart options={woredaDonutOptions} series={woredaDonutSeries} type="donut" height={220} />
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Draft', val: stats?.woredaByStatus?.Draft || 0, color: 'text-amber-600' },
                    { label: 'Submitted', val: stats?.woredaByStatus?.Submitted || 0, color: 'text-brand-600' },
                    { label: 'Reviewed', val: stats?.woredaByStatus?.Reviewed || 0, color: 'text-emerald-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2">
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template status donut */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1 flex items-center gap-2">
                  <BookOpen className="size-4 text-amber-500" /> Templates
                </h3>
                <p className="text-xs text-gray-400 mb-3">By publication status</p>
                <Chart options={templateDonutOptions} series={templateDonutSeries} type="donut" height={220} />
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Draft', val: stats?.templatesByStatus?.Draft || 0, color: 'text-amber-600' },
                    { label: 'Published', val: stats?.templatesByStatus?.Published || 0, color: 'text-brand-600' },
                    { label: 'Archived', val: stats?.templatesByStatus?.Archived || 0, color: 'text-slate-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2">
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapping status donut */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1 flex items-center gap-2">
                  <BarChart3 className="size-4 text-brand-500" /> Mappings
                </h3>
                <p className="text-xs text-gray-400 mb-3">By publication status</p>
                <Chart options={mappingDonutOptions} series={mappingDonutSeries} type="donut" height={220} />
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Draft', val: stats?.mappingsByStatus?.Draft || 0, color: 'text-amber-600' },
                    { label: 'Published', val: stats?.mappingsByStatus?.Published || 0, color: 'text-sky-600' },
                    { label: 'Archived', val: stats?.mappingsByStatus?.Archived || 0, color: 'text-slate-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2">
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Survey Sync Status bar chart */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1 flex items-center gap-2">
                  <Database className="size-4 text-emerald-500" /> Survey Sync
                </h3>
                <p className="text-xs text-gray-400 mb-3">SYNCED / UNSYNCED / UPDATED</p>
                <Chart options={surveyBarOptions} series={surveyBarSeries} type="bar" height={220} />
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Synced', val: stats?.surveysBySyncStatus?.SYNCED || 0, color: 'text-emerald-600' },
                    { label: 'Unsynced', val: stats?.surveysBySyncStatus?.UNSYNCED || 0, color: 'text-red-600' },
                    { label: 'Updated', val: stats?.surveysBySyncStatus?.UPDATED || 0, color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2">
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GIS Map + Database Change Report side by side */}
            <div className="grid grid-cols-12 gap-6">
              {/* GIS Map */}
              <div className="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                      <MapIcon className="text-[#e11d2d] size-5" /> GIS Risk Map — Addis Ababa Sub-Cities
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Choropleth by disaster risk score. Hover subcity for details.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                    {[
                      { label: 'Very Low', color: '#10b981' },
                      { label: 'Low', color: '#34d399' },
                      { label: 'Moderate', color: '#fbbf24' },
                      { label: 'High', color: '#f97316' },
                      { label: 'Very High', color: '#ef4444' },
                      { label: 'Critical', color: '#991b1b' },
                    ].map(r => (
                      <span key={r.label} className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }}></span>
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-50">
                  <div ref={mapContainerRef} className="w-full h-full" />
                  {profiles.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/90 dark:bg-slate-900/80 gap-2 z-10">
                      <MapIcon className="w-10 h-10 opacity-20 animate-pulse" />
                      <span className="text-sm">No profile data available for map</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Database Change Report */}
              <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90 flex items-center gap-2 mb-1">
                  <Database className="size-5 text-[#e11d2d]" /> Database Changes
                </h3>
                <p className="text-xs text-gray-400 mb-4">Last 10 system operations</p>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
                  {stats?.recentDatabaseChanges?.length ? stats.recentDatabaseChanges.map(log => (
                    <div key={log._id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">{formatAction(log.action)}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-black rounded border capitalize flex-shrink-0 ${getSeverityBadge(log.severity)}`}>{log.severity || 'low'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><UserIcon className="size-3" />{log.userId?.fullname || 'System'}</span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold px-1.5 py-0.5 rounded text-[10px]">{log.resource}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2">
                        <span className="flex items-center gap-1"><Clock className="size-3" />{new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={log.status === 'success' ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{log.status === 'success' ? '✓ OK' : '✗ Failed'}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-10">
                      <Database className="w-8 h-8" />
                      <span className="text-xs">No audit logs yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ USER ADMIN TAB */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* User Admin KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" />
              <StatCard label="Organizations" value={stats?.totalOrganizations || 0} icon={Building2} color="bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" />
              <StatCard label="Sectors" value={stats?.totalSectors || 0} icon={BarChart3} color="bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" />
              <StatCard label="Departments" value={stats?.totalDepartments || 0} icon={BookOpen} color="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
              <StatCard label="Roles" value={stats?.totalRoles || 0} icon={Shield} color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
            </div>

            {/* User context info */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50 dark:border-brand-900/40 dark:bg-brand-900/10 p-5">
              <h3 className="text-sm font-bold text-brand-800 dark:text-brand-300 mb-3 flex items-center gap-2">
                <UserIcon className="size-4" /> Your Access Context
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                {[
                  { label: 'Access Level', value: stats?.userInfo?.accessLevel?.replace(/_/g, ' ') },
                  { label: 'Org Type', value: stats?.userInfo?.organizationType?.replace(/_/g, ' ') },
                  { label: 'Organization', value: stats?.userInfo?.organizationName },
                  { label: 'Sector', value: stats?.userInfo?.sectorName },
                  { label: 'Department', value: stats?.userInfo?.departmentName },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-brand-500 dark:text-brand-400 text-xs mb-0.5">{item.label}</p>
                    <p className="font-bold text-brand-900 dark:text-brand-200 capitalize">{item.value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users by Access Level */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-1">Users by Access Level</h3>
                <p className="text-xs text-gray-400 mb-4">Distribution across all access tiers</p>
                {stats?.usersByAccessLevel?.length ? (
                  <Chart options={usersLevelOptions} series={usersLevelSeries} type="bar" height={280} />
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
                )}
              </div>

              {/* Users by Organization */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-1">Users by Organization</h3>
                <p className="text-xs text-gray-400 mb-4">Breakdown per organization</p>
                {stats?.usersByOrganization?.length ? (
                  <Chart options={usersOrgOptions} series={usersOrgSeries} type="donut" height={280} />
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
