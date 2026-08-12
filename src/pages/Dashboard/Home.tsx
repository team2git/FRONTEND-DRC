import { useEffect, useState, useRef, useMemo } from 'react';
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, DashboardStats } from "../../api/dashboardService";
import {
  addisAbabaGeoData, ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM, ADDIS_ABABA_BOUNDS,
  getRiskColor, getRiskLevel
} from "../DRM/addisAbabaGeoData";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  AlertTriangle, Map as MapIcon, RefreshCw,
  Shield, BarChart3, Users, Building2,
  Filter, FileText, Activity, AlertCircle, CheckCircle2, Clock, Flame,
  HeartPulse, Sparkles, TrendingUp, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { RiskMatrix } from '../../components/dashboard/RiskMatrix';
import { DRMReportModal } from '../../components/dashboard/DRMReportModal';

type DRMTabKey = 
  | 'overview' 
  | 'map' 
  | 'ranking' 
  | 'hazards' 
  | 'vulnerability' 
  | 'exposure' 
  | 'disasters' 
  | 'capacity' 
  | 'response' 
  | 'admin';

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DRMTabKey>('overview');

  const isSuperAdmin = user?.roles?.some(r => ['superadmin', 'super admin', 'super_admin'].includes(r.name.toLowerCase()));
  const isHeadOfficeSuperAdmin = (user?.accessLevel === 'super_admin' || isSuperAdmin) && user?.organizationType === 'head_office';
  const isBranchAdmin = user?.accessLevel === 'branch_admin';
  const isAdmin = isHeadOfficeSuperAdmin || isBranchAdmin;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filterYear, setFilterYear] = useState('2025/26');
  const [filterWoreda, setFilterWoreda] = useState('');
  const [filterHazard, setFilterHazard] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState('');
  const [filterStatus] = useState('');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        year: filterYear,
        woreda: filterWoreda,
        hazard: filterHazard,
        riskLevel: filterRiskLevel,
        status: filterStatus,
      };
      const statsData = await getDashboardStats(params);
      setStats(statsData);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterYear, filterWoreda, filterHazard, filterRiskLevel, filterStatus]);

  // Build Woreda risk lookup for Leaflet GIS map directly from stats.woredaRankings
  const subcityRiskMap = useMemo(() => {
    const map: Record<string, {
      risk: number; population: number; exposure: number; vulnerability: number;
    }> = {};
    (stats?.woredaRankings || []).forEach(w => {
      map[w.name] = {
        risk: w.score,
        population: w.pop,
        exposure: w.exposure,
        vulnerability: w.vulnerability
      };
    });
    return map;
  }, [stats]);

  // Leaflet GIS map init
  useEffect(() => {
    if (activeTab !== 'map' && activeTab !== 'overview') return;
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
        const riskScore = data ? data.risk : 5.5;
        const fillColor = getRiskColor(riskScore);
        return { fillColor, weight: 2, opacity: 1, color: '#ffffff', fillOpacity: 0.82 };
      },
      onEachFeature: (feature, layer) => {
        const name = (feature as any)?.properties?.name || '';
        const data = subcityRiskMap[name];
        const riskScore = data ? data.risk : 5.5;
        const riskLevel = getRiskLevel(riskScore);
        const population = data ? data.population : 18500;

        layer.bindTooltip(`
          <div style="font-family:'Outfit',sans-serif;padding:8px;min-width:220px;">
            <div style="font-weight:900;font-size:15px;margin-bottom:8px;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">${name}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Risk Level</div>
                <div style="font-weight:800;color:${riskLevel.color};">${riskLevel.label}</div>
              </div>
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Risk Score</div>
                <div style="font-weight:800;color:${riskLevel.color};">${riskScore.toFixed(1)} / 10</div>
              </div>
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Population</div>
                <div style="font-weight:800;color:#334155;">${population.toLocaleString()}</div>
              </div>
              <div style="background:#f8fafc;padding:5px 7px;border-radius:6px;">
                <div style="color:#94a3b8;font-size:9px;font-weight:700;text-transform:uppercase;">Main Hazard</div>
                <div style="font-weight:800;color:#334155;">Flood / Fire</div>
              </div>
            </div>
          </div>
        `, { sticky: true, className: 'risk-map-tooltip' });

        (layer as L.Polygon).on('click', () => {
          setFilterWoreda(name);
        });
      }
    }).addTo(map);

    mapRef.current = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [activeTab, subcityRiskMap]);

  // ApexChart Options
  const hazardFreqOptions: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
    colors: ['#C8102E'],
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
    xaxis: { categories: (stats?.hazardAnalysis || []).map(h => h.type), axisBorder: { show: false } },
    yaxis: { title: { text: 'Occurrences' } },
    grid: { borderColor: '#f1f5f9' },
  };
  const hazardFreqSeries = [{ name: 'Occurrences', data: (stats?.hazardAnalysis || []).map(h => h.occurrences) }];

  const hazardDistOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#0ea5e9', '#ec4899', '#64748b'],
    labels: (stats?.hazardAnalysis || []).map(h => h.type),
    legend: { position: 'bottom', fontSize: '11px' },
    plotOptions: { pie: { donut: { size: '65%' } } }
  };
  const hazardDistSeries = (stats?.hazardAnalysis || []).map(h => h.affectedPop);

  const disasterTrendOptions: ApexOptions = {
    chart: { type: 'area', fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
    colors: ['#C8102E', '#3b82f6'],
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: (stats?.disasterHistory || []).map(d => d.year.toString()) },
    grid: { borderColor: '#f1f5f9' }
  };
  const disasterTrendSeries = [
    { name: 'People Affected', data: (stats?.disasterHistory || []).map(d => d.affected) },
    { name: 'People Displaced', data: (stats?.disasterHistory || []).map(d => d.displaced) },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-[#C8102E] animate-spin" />
        <span className="text-slate-500 dark:text-slate-400 font-medium">Loading Woreda DRM Dashboard...</span>
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
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-[#C8102E] text-white rounded-xl text-xs font-semibold hover:bg-[#a00d24] transition">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = stats?.executiveKpis;
  const header = stats?.woredaHeader;
  const rankings = stats?.woredaRankings || [];

  return (
    <>
      <PageMeta
        title="Woreda DRM Decision Dashboard | PDRM"
        description="Decision-oriented Woreda Disaster Risk Management Dashboard"
      />

      <div className="space-y-6">
        {/* ─── 1. WOREDA PROFILE HEADER BAR ────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#C8102E]/10 rounded-2xl text-[#C8102E]">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {header?.woredaName || 'Addis Ababa Central Woreda'} DRM Dashboard
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                    Zone: <span className="font-bold text-slate-700 dark:text-slate-300">{header?.zone}</span> · Region: <span className="font-bold text-slate-700 dark:text-slate-300">{header?.region}</span> · Total Woredas: <span className="font-bold text-slate-700 dark:text-slate-300">{header?.totalWoredas || rankings.length}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="text-right hidden sm:block">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {header?.dataStatus || 'Verified Data'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Period: {header?.reportingPeriod} | Updated: {new Date(header?.lastDataUpdate || '').toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8102E] to-red-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-900/20 hover:bg-[#a00d24] transition active:scale-95"
              >
                <FileText className="w-4 h-4" /> Generate DRM Report
              </button>

              <button
                onClick={fetchData}
                className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-[#C8102E] transition active:scale-95"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-[#C8102E]" /> Filters:
            </span>

            {/* Reporting Year */}
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300"
            >
              <option value="2025/26">Year: 2025/26</option>
              <option value="2024/25">Year: 2024/25</option>
              <option value="2023/24">Year: 2023/24</option>
            </select>

            {/* Woreda Filter */}
            <select
              value={filterWoreda}
              onChange={e => setFilterWoreda(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Woredas</option>
              {rankings.map(k => (
                <option key={k.name} value={k.name}>{k.subcity ? `${k.subcity} — ${k.name}` : k.name} ({k.level})</option>
              ))}
            </select>

            {/* Hazard Type */}
            <select
              value={filterHazard}
              onChange={e => setFilterHazard(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Hazards</option>
              <option value="Flood">Flood</option>
              <option value="Fire">Fire</option>
              <option value="Landslide">Landslide</option>
              <option value="Epidemic">Epidemic</option>
              <option value="Drought">Drought</option>
            </select>

            {/* Risk Level */}
            <select
              value={filterRiskLevel}
              onChange={e => setFilterRiskLevel(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Risk Levels</option>
              <option value="Very High">Very High</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {(filterWoreda || filterHazard || filterRiskLevel) && (
              <button
                onClick={() => { setFilterWoreda(''); setFilterHazard(''); setFilterRiskLevel(''); }}
                className="text-xs font-bold text-[#C8102E] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ─── 2. EXECUTIVE KPI CARDS GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Population', val: (kpis?.totalPopulation || 0).toLocaleString(), badge: 'Woreda Wide', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Users },
            { label: 'Total Households', val: (kpis?.totalHouseholds || 0).toLocaleString(), badge: 'Dwelling Units', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Building2 },
            { label: 'Population at Risk', val: (kpis?.populationAtRisk || 0).toLocaleString(), badge: 'High Risk', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ShieldAlert },
            { label: 'Households at Risk', val: (kpis?.householdsAtRisk || 0).toLocaleString(), badge: 'High Risk', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertTriangle },
            { label: 'Identified Hazards', val: kpis?.numberOfHazards || 0, badge: 'Monitored', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Flame },
            { label: 'High-Risk Woredas', val: kpis?.highRiskWoredasCount || 0, badge: 'Priority Zones', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: MapIcon },
            { label: 'Recorded Disasters', val: kpis?.recordedDisasters || 0, badge: 'Historical', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Activity },
            { label: 'Affected People', val: (kpis?.affectedPeopleCount || 0).toLocaleString(), badge: 'Cumulative', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Users },
            { label: 'Vulnerable People', val: (kpis?.vulnerablePeopleCount || 0).toLocaleString(), badge: 'Target Group', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: HeartPulse },
            { label: 'Est. Damage / Loss', val: kpis?.estimatedDamageLossETB || '0 ETB', badge: 'Financial Impact', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: BarChart3 },
            { label: 'Preparedness Score', val: `${kpis?.preparednessScore || 0}%`, badge: kpis?.preparednessScore && kpis.preparednessScore >= 70 ? 'Good' : 'Needs Action', color: 'bg-[#C8102E]/10 text-[#C8102E]', icon: ShieldCheck },
            { label: 'Open DRM Actions', val: kpis?.openResponseActionsCount || 0, badge: 'Active Tasks', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => setActiveTab('ranking')}
                className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
                </div>
                <h4 className="mt-2 text-xl font-black text-slate-900 dark:text-white tracking-tight">{item.val}</h4>
              </div>
            );
          })}
        </div>

        {/* ─── 3. TAB NAVIGATION ────────────────────────────────────────────────── */}
        <div className="flex overflow-x-auto p-1.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 no-scrollbar gap-1">
          {[
            { key: 'overview', label: 'Overview', icon: Shield },
            { key: 'map', label: 'Risk Map', icon: MapIcon },
            { key: 'ranking', label: 'Woreda Ranking', icon: TrendingUp },
            { key: 'hazards', label: 'Hazards', icon: Flame },
            { key: 'vulnerability', label: 'Vulnerability', icon: HeartPulse },
            { key: 'exposure', label: 'Exposure', icon: Building2 },
            { key: 'disasters', label: 'Disaster History', icon: Activity },
            { key: 'capacity', label: 'Capacity Gaps', icon: ShieldCheck },
            { key: 'response', label: 'Response Actions', icon: Clock },
            ...(isAdmin ? [{ key: 'admin' as DRMTabKey, label: 'User Admin', icon: Users }] : []),
          ].map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as DRMTabKey)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C8102E] to-red-600 text-white shadow-md shadow-red-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB CONTENT 1: OVERVIEW ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Dynamic Executive Summary Narrative */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-64 h-64 text-[#C8102E]" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#C8102E] rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                    System Generated Executive Summary
                  </span>
                  <span className="text-xs text-slate-400">• Data-Driven Narrative</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold leading-relaxed text-slate-100">
                  {stats?.executiveSummaryText}
                </h2>
              </div>
            </div>

            {/* Priority Recommendations Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C8102E]" /> Priority System Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(stats?.priorityRecommendations || []).map(rec => (
                  <div
                    key={rec.priority}
                    className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Priority {rec.priority} — {rec.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rec.riskContext}</p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-[#C8102E]">Action: </span>{rec.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Early Warning Alerts */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" /> Active Early Warning & Disaster Alerts
                </h3>
                <span className="text-xs font-bold text-slate-400">{(stats?.activeAlerts || []).length} Active</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(stats?.activeAlerts || []).map(alert => (
                  <div key={alert.id} className="py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500 text-white">{alert.severity}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{alert.code} — {alert.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Location: <span className="font-bold">{alert.location}</span> | Affected: <span className="font-bold">{alert.affectedPop}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{alert.action}</p>
                      <span className="text-[10px] text-slate-400">{alert.responsible}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 2: RISK MAP ─────────────────────────────────────────── */}
        {activeTab === 'map' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-[#C8102E]" /> Interactive Woreda Risk Map
                </h3>
                <p className="text-xs text-slate-400 font-medium">Choropleth map colored by Woreda Risk Level score. Click Woreda to inspect details.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                {[
                  { label: 'Low (0-3.9)', color: '#10b981' },
                  { label: 'Medium (4-6.4)', color: '#fbbf24' },
                  { label: 'High (6.5-7.9)', color: '#f97316' },
                  { label: 'Very High (8.0+)', color: '#ef4444' },
                ].map(r => (
                  <span key={r.label} className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
                    {r.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-50">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 3: WOREDA RANKING ───────────────────────────────────── */}
        {activeTab === 'ranking' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C8102E]" /> Woreda Risk Ranking Table
                </h3>
                <p className="text-xs text-slate-400 font-medium">Woredas automatically sorted from highest risk to lowest risk priority</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Subcity</th>
                    <th className="p-3">Woreda Unit</th>
                    <th className="p-3">Main Hazard</th>
                    <th className="p-3 text-right">Population</th>
                    <th className="p-3 text-right">Exposure Index</th>
                    <th className="p-3 text-right">Vulnerability Index</th>
                    <th className="p-3 text-right">Risk Score</th>
                    <th className="p-3 text-center">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {rankings.map((k, idx) => (
                    <tr key={k.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{k.subcity || '—'}</td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">{k.name}</td>
                      <td className="p-3">{k.hazard}</td>
                      <td className="p-3 text-right font-mono">{k.pop.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{k.exposure.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono">{k.vulnerability.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-[#C8102E]">{k.score.toFixed(1)} / 10</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          k.level === 'Very High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          k.level === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          k.level === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {k.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 4: HAZARDS ───────────────────────────────────────────── */}
        {activeTab === 'hazards' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Hazard Frequency Distribution</h3>
                <Chart options={hazardFreqOptions} series={hazardFreqSeries} type="bar" height={280} />
              </div>
              <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Affected Population by Hazard</h3>
                <Chart options={hazardDistOptions} series={hazardDistSeries} type="donut" height={280} />
              </div>
            </div>

            <RiskMatrix hazards={stats?.hazardAnalysis} />
          </div>
        )}

        {/* ─── TAB CONTENT 5: VULNERABILITY ────────────────────────────────────── */}
        {activeTab === 'vulnerability' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-500" /> Vulnerable Population Analysis
              </h3>
              <p className="text-xs text-slate-400">Demographic breakdown of registered high-vulnerability groups across Woredas</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Children (0-17)', count: stats?.vulnerabilityAnalysis?.vulnerableChildren, icon: Users },
                { label: 'Elderly (60+)', count: stats?.vulnerabilityAnalysis?.vulnerableElderly, icon: Users },
                { label: 'Persons with Disability', count: stats?.vulnerabilityAnalysis?.vulnerablePwd, icon: HeartPulse },
                { label: 'Pregnant / Lactating', count: stats?.vulnerabilityAnalysis?.vulnerablePregnant, icon: Activity },
                { label: 'Female-Headed HH', count: stats?.vulnerabilityAnalysis?.femaleHeadedHH, icon: Building2 },
                { label: 'Displaced IDP Households', count: stats?.vulnerabilityAnalysis?.idpHouseholds, icon: AlertCircle },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Icon className="w-5 h-5 text-[#C8102E] mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">{item.label}</p>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">{(item.count || 0).toLocaleString()}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 6: EXPOSURE ─────────────────────────────────────────── */}
        {activeTab === 'exposure' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Infrastructure & Asset Exposure
              </h3>
              <p className="text-xs text-slate-400">Critical public facilities located within active hazard zones</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(stats?.exposureAnalysis?.infrastructure || []).map(infra => (
                <div key={infra.category} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{infra.category}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{infra.riskLevel}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {infra.exposed} / {infra.total} <span className="text-xs font-bold text-slate-400">exposed ({infra.percentage}%)</span>
                  </h4>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-[#C8102E] h-2 rounded-full" style={{ width: `${infra.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 7: DISASTER HISTORY ─────────────────────────────────── */}
        {activeTab === 'disasters' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Historical Disaster Impact Trend</h3>
              <Chart options={disasterTrendOptions} series={disasterTrendSeries} type="area" height={280} />
            </div>

            <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" /> Registered Historical Disaster Events
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {(stats?.disasterHistory || []).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-slate-400">No historical disaster records registered in MongoDB yet.</td>
                      </tr>
                    ) : (
                      (stats?.disasterHistory || []).map((dh, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold">{dh.year}</td>
                          <td className="p-3 font-black text-slate-900 dark:text-white">{dh.hazard}</td>
                          <td className="p-3">{dh.location}</td>
                          <td className="p-3 text-right font-mono">{dh.affected?.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono">{dh.displaced?.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-rose-600 font-bold">{dh.deaths?.toLocaleString() || 0}</td>
                          <td className="p-3 text-right font-mono">{dh.injuries?.toLocaleString() || 0}</td>
                          <td className="p-3 text-right font-mono">{dh.housesDamaged?.toLocaleString() || 0}</td>
                          <td className="p-3">{dh.infraDamaged || '—'}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#C8102E]">{dh.lossETB}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 8: CAPACITY GAPS ────────────────────────────────────── */}
        {activeTab === 'capacity' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Preparedness & Resource Capacity Gap Analysis
                </h3>
                <p className="text-xs text-slate-400">Required vs. Available Emergency Response Capacity across Woredas</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Resource / Item</th>
                    <th className="p-3 text-right">Required</th>
                    <th className="p-3 text-right">Available</th>
                    <th className="p-3 text-right">Capacity Gap</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {(stats?.capacityGaps || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">No severe capacity gaps identified across assessed Woredas.</td>
                    </tr>
                  ) : (
                    (stats?.capacityGaps || []).map(gap => (
                      <tr key={gap.resource}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{gap.resource}</td>
                        <td className="p-3 text-right font-mono">{gap.required}</td>
                        <td className="p-3 text-right font-mono">{gap.available}</td>
                        <td className="p-3 text-right font-mono font-bold text-red-600">{gap.gap}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            gap.status === 'High Gap' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            gap.status === 'Medium Gap' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {gap.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 9: RESPONSE ACTIONS ────────────────────────────────── */}
        {activeTab === 'response' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> DRM Action Tracking & Progress
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Action Item</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Responsible</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-center">Progress</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {(stats?.responseActions || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No open response actions found.</td>
                    </tr>
                  ) : (
                    (stats?.responseActions || []).map(act => (
                      <tr key={act.id}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{act.action}</td>
                        <td className="p-3">{act.location}</td>
                        <td className="p-3">{act.responsible}</td>
                        <td className="p-3 font-mono">{act.dueDate}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div className="bg-[#C8102E] h-1.5 rounded-full" style={{ width: `${act.progress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold">{act.progress}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            act.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                            act.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            act.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 10: USER ADMIN ──────────────────────────────────────── */}
        {activeTab === 'admin' && (
          <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> System User & Administrative Analytics
              </h3>
              <p className="text-xs text-slate-400">Database user accounts, roles, departments, and active organization breakdown</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Users', val: stats?.totalUsers || 0, color: 'text-indigo-600' },
                { label: 'Departments', val: stats?.totalDepartments || 0, color: 'text-blue-600' },
                { label: 'System Roles', val: stats?.totalRoles || 0, color: 'text-purple-600' },
                { label: 'Organizations', val: stats?.totalOrganizations || 0, color: 'text-emerald-600' },
                { label: 'Sectors', val: stats?.totalSectors || 0, color: 'text-amber-600' },
              ].map(card => (
                <div key={card.label} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 font-semibold">{card.label}</p>
                  <h4 className={`text-2xl font-black mt-1 ${card.color}`}>{card.val.toLocaleString()}</h4>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Users by Access Level</h4>
                <div className="space-y-2">
                  {(stats?.usersByAccessLevel || []).map(u => (
                    <div key={u.accessLevel} className="flex justify-between items-center text-xs font-bold p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="capitalize text-slate-800 dark:text-slate-200">{u.accessLevel.replace(/_/g, ' ')}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-mono">{u.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Users by Organization</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(stats?.usersByOrganization || []).map((o, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-800 dark:text-slate-200">{o.organizationName || 'PDRM Bureau'}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-mono">{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        <DRMReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          stats={stats}
        />
      </div>
    </>
  );
}
