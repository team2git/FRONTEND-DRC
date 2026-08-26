import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { MapIncident, ThemeOption } from '../types/dashboardTypes';
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Bell,
  MapPin,
  Flame,
  Clock,
} from 'lucide-react';

interface Props {
  incidents?: MapIncident[];
  loading?: boolean;
  theme?: ThemeOption;
}

export const EarlyWarningAlerts: React.FC<Props> = ({
  incidents = [],
  loading = false,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isSolar = theme === 'solar';

  // Theme container classes
  const containerBg = isLight
    ? 'bg-white border-slate-200 shadow-sm'
    : isBlueBlack
      ? 'bg-[#0f172a]/90 border-blue-900/40 shadow-xl'
      : isSolar
        ? 'bg-[#1c1917]/95 border-amber-900/40 shadow-xl'
        : 'bg-slate-900/90 border-slate-800 shadow-xl';

  const headerBorder = isLight
    ? 'border-slate-100'
    : isBlueBlack
      ? 'border-blue-900/40'
      : isSolar
        ? 'border-amber-900/30'
        : 'border-slate-800';

  const cardInnerBg = isLight
    ? 'bg-slate-50 border-slate-200/80'
    : isBlueBlack
      ? 'bg-blue-950/30 border-blue-800/40'
      : isSolar
        ? 'bg-stone-900/60 border-amber-900/40'
        : 'bg-slate-800/40 border-slate-700/50';

  const labelColor = isLight ? '#64748b' : isBlueBlack ? '#93c5fd' : isSolar ? '#fde68a' : '#94a3b8';
  const titleColor = isLight ? '#0f172a' : isBlueBlack ? '#ffffff' : isSolar ? '#fffbe6' : '#ffffff';

  // ── Normalize severity
  const normalizeSev = (s?: string) => {
    const u = (s || '').toUpperCase();
    if (u === 'CRITICAL') return 'critical';
    if (u === 'HIGH') return 'high';
    if (u === 'MODERATE' || u === 'MEDIUM') return 'moderate';
    return 'low';
  };

  const sevCfg: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      dot: string;
      bar: string;
      color: string;
      icon: typeof Zap;
      label: string;
    }
  > = {
    critical: {
      bg: isLight ? 'bg-red-50' : 'bg-red-950/30',
      text: isLight ? 'text-red-700' : 'text-red-400',
      border: isLight ? 'border-red-200' : 'border-red-800/60',
      dot: 'bg-red-500',
      bar: 'bg-red-500',
      color: '#ef4444',
      icon: Zap,
      label: 'Critical',
    },
    high: {
      bg: isLight ? 'bg-orange-50' : 'bg-orange-950/30',
      text: isLight ? 'text-orange-700' : 'text-orange-400',
      border: isLight ? 'border-orange-200' : 'border-orange-800/60',
      dot: 'bg-orange-500',
      bar: 'bg-orange-500',
      color: '#f97316',
      icon: AlertTriangle,
      label: 'High',
    },
    moderate: {
      bg: isLight ? 'bg-amber-50' : 'bg-amber-950/30',
      text: isLight ? 'text-amber-700' : 'text-amber-400',
      border: isLight ? 'border-amber-200' : 'border-amber-800/60',
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
      color: '#f59e0b',
      icon: AlertCircle,
      label: 'Moderate',
    },
    low: {
      bg: isLight ? 'bg-blue-50' : 'bg-blue-950/30',
      text: isLight ? 'text-blue-700' : 'text-blue-400',
      border: isLight ? 'border-blue-200' : 'border-blue-800/60',
      dot: 'bg-blue-500',
      bar: 'bg-blue-500',
      color: '#3b82f6',
      icon: Bell,
      label: 'Low',
    },
  };

  const getSev = (s?: string) => sevCfg[normalizeSev(s)] || sevCfg['moderate'];

  // ── Chart 1: Report Type (Incident vs Concern)
  const incidentCount = incidents.filter(
    (i) => i.reportType === 'incident' || (!i.reportType && !(i.category || '').toLowerCase().includes('concern'))
  ).length;
  const concernCount = incidents.length - incidentCount;

  const typeChartOpts: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
      background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    colors: ['#C8102E', '#3b82f6'],
    labels: ['Incident', 'Concern'],
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              color: labelColor,
              formatter: () => `${incidents.length}`,
            },
            value: {
              fontSize: '22px',
              fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              color: titleColor,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: [isLight ? '#fff' : '#0f172a'] },
    tooltip: {
      style: { fontFamily: 'Outfit, sans-serif' },
      y: { formatter: (v: number) => `${v} report${v !== 1 ? 's' : ''}` },
    },
  };
  const typeSeries = [incidentCount || 0, concernCount || 0];
  const hasTypeData = typeSeries.some((v) => v > 0);

  // ── Chart 2: Status breakdown
  const statusCounts = {
    active: incidents.filter((i) => i.status === 'submitted' || (i as any).status === 'Active').length,
    monitoring: incidents.filter((i) => i.status === 'received' || (i as any).status === 'Monitoring').length,
    dispatched: incidents.filter((i) => i.status === 'dispatched' || (i as any).status === 'Dispatched').length,
    resolved: incidents.filter((i) => i.status === 'closed' || (i as any).status === 'Resolved').length,
  };

  const statusOrder = ['Active', 'Monitoring', 'Dispatched', 'Resolved'];
  const statusSeries = [
    statusCounts.active,
    statusCounts.monitoring,
    statusCounts.dispatched,
    statusCounts.resolved,
  ];
  const hasStatusData = statusSeries.some((v) => v > 0);

  const statusChartOpts: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
      background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
    labels: statusOrder,
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: 'Status',
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              color: labelColor,
              formatter: () => `${incidents.length}`,
            },
            value: {
              fontSize: '22px',
              fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              color: titleColor,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: [isLight ? '#fff' : '#0f172a'] },
    tooltip: {
      style: { fontFamily: 'Outfit, sans-serif' },
      y: { formatter: (v: number) => `${v} report${v !== 1 ? 's' : ''}` },
    },
  };

  // ── Severity counts
  const sevOrder = ['critical', 'high', 'moderate', 'low'] as const;
  const sevCounts = sevOrder.map(
    (k) => incidents.filter((i) => normalizeSev(i.severity) === k).length
  );

  // ── Batch Carousel: Show 3 alerts, then animate out and slide next 3 in from bottom to top
  const BATCH_SIZE = 3;
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const totalBatches = Math.max(1, Math.ceil(incidents.length / BATCH_SIZE));

  useEffect(() => {
    if (totalBatches <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentBatch((prev) => (prev + 1) % totalBatches);
    }, 4500); // Transitions to next 3 alerts every 4.5 seconds

    return () => clearInterval(timer);
  }, [totalBatches, isPaused]);

  // Current batch of up to 3 alerts
  const visibleAlerts = incidents.slice(
    currentBatch * BATCH_SIZE,
    currentBatch * BATCH_SIZE + BATCH_SIZE
  );

  return (
    <div className={`rounded-2xl border ${containerBg} overflow-hidden h-full w-full min-h-[360px] flex flex-col justify-between transition-all duration-300`}>
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${headerBorder}`}>
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 animate-pulse flex-shrink-0" />
          <div>
            <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Active Early Warning &amp; Disaster Alerts
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time spatial monitoring &amp; continuous incident triage ticker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {incidents.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {incidents.length} Live Alerts
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Clear
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[220px] gap-2 text-slate-400">
          <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Synchronizing Live Alerts...</span>
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[220px] gap-3 text-slate-400">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <p className="text-sm font-semibold">No active incidents or concerns reported at this time.</p>
        </div>
      ) : (
        /* ── Two-Panel Body (Flexible Height) ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-[360px]">
          {/* ════ LEFT: Two mini charts + severity progress bars ════ */}
          <div className={`flex flex-col gap-3 p-4 border-b lg:border-b-0 lg:border-r ${headerBorder} overflow-y-auto no-scrollbar`}>
            {/* Donut charts row */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Type chart */}
              <div className={`flex flex-col items-center rounded-xl p-2.5 border ${cardInnerBg}`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Report Type</p>
                {hasTypeData ? (
                  <Chart options={typeChartOpts} series={typeSeries} type="donut" width={140} height={140} />
                ) : (
                  <div className="w-[140px] h-[140px] flex items-center justify-center text-slate-400 text-[10px]">No data</div>
                )}
                <div className="flex gap-2.5 mt-1">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-[#C8102E] inline-block" />
                    Incidents <b className={isLight ? 'text-slate-800' : 'text-slate-200'}>{incidentCount}</b>
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Concerns <b className={isLight ? 'text-slate-800' : 'text-slate-200'}>{concernCount}</b>
                  </span>
                </div>
              </div>

              {/* Status chart */}
              <div className={`flex flex-col items-center rounded-xl p-2.5 border ${cardInnerBg}`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Triage Status</p>
                {hasStatusData ? (
                  <Chart options={statusChartOpts} series={statusSeries} type="donut" width={140} height={140} />
                ) : (
                  <div className="w-[140px] h-[140px] flex items-center justify-center text-slate-400 text-[10px]">No data</div>
                )}
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 w-full px-1">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Active: {statusCounts.active}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Mon: {statusCounts.monitoring}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Disp: {statusCounts.dispatched}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Done: {statusCounts.resolved}
                  </span>
                </div>
              </div>
            </div>

            {/* Severity Breakdown Progress Bars */}
            <div className={`rounded-xl p-3.5 border ${cardInnerBg} space-y-2.5`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Severity Breakdown</p>
              {sevOrder.map((k, i) => {
                const cnt = sevCounts[i];
                const cfg = sevCfg[k];
                const pct = incidents.length > 0 ? Math.round((cnt / incidents.length) * 100) : 0;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <cfg.icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.text}`} />
                    <span className={`text-[10px] font-bold w-16 flex-shrink-0 ${cfg.text}`}>{cfg.label}</span>
                    <div className="flex-1 h-2 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[10px] font-black w-6 text-right tabular-nums ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {cnt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════ RIGHT: Animated 3-Alert Display with Bottom-to-Top Transition ════ */}
          <div
            className="relative h-full flex flex-col justify-between p-3.5 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Header: Live Alerts Count & Batch Dot Indicators */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/50 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
                  Active Live Alerts
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  ({incidents.length === 0 ? 0 : currentBatch * BATCH_SIZE + 1}–{Math.min((currentBatch + 1) * BATCH_SIZE, incidents.length)} of {incidents.length})
                </span>
              </div>

              {/* Batch Dots */}
              {totalBatches > 1 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalBatches }).map((_, bIdx) => (
                    <button
                      key={bIdx}
                      type="button"
                      onClick={() => setCurrentBatch(bIdx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        bIdx === currentBatch
                          ? 'w-4 bg-red-500 shadow-sm'
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                      }`}
                      title={`Batch ${bIdx + 1}: Alerts ${bIdx * BATCH_SIZE + 1} to ${Math.min((bIdx + 1) * BATCH_SIZE, incidents.length)}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Exactly 3 alert cards animated from bottom to top */}
            <div
              key={currentBatch}
              className="flex-1 flex flex-col justify-between gap-2 animate-in fade-in slide-in-from-bottom-8 duration-500"
            >
              {visibleAlerts.map((incident, idx) => {
                const cfg = getSev(incident.severity);
                const SevIcon = cfg.icon;
                const isIncident =
                  incident.reportType === 'incident' ||
                  (!incident.reportType && !(incident.category || '').toLowerCase().includes('concern'));
                const displayTitle =
                  incident.category || (incident as any).title || (isIncident ? 'Emergency Incident' : 'Public Concern');
                const displayLocation = incident.locationName || (incident as any).location || 'Addis Ababa';
                const displayCode = incident.reportCode || (incident as any).code || `ALT-${currentBatch * BATCH_SIZE + idx + 1}`;
                const displayStatus =
                  incident.status === 'submitted' || (incident as any).status === 'Active'
                    ? 'Active'
                    : incident.status === 'received' || (incident as any).status === 'Monitoring'
                    ? 'Monitoring'
                    : incident.status === 'dispatched'
                    ? 'Dispatched'
                    : 'Resolved';

                return (
                  <div
                    key={`${incident.id || idx}-${currentBatch}`}
                    className={`rounded-xl border ${cfg.border} ${cfg.bg} p-2.5 flex flex-col justify-between flex-1 shadow-sm transition-all`}
                  >
                    {/* Top Row: Type Badge + Severity Badge + Code + Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isIncident
                              ? 'bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50'
                          }`}
                        >
                          {isIncident ? <Flame className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" />}
                          {isIncident ? 'Incident' : 'Concern'}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <SevIcon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>

                        <span className="text-[8px] font-mono font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                          {displayCode}
                        </span>
                      </div>

                      <span
                        className={`text-[8px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                          displayStatus === 'Active'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            : displayStatus === 'Monitoring'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : displayStatus === 'Dispatched'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    {/* Title / Category */}
                    <p className={`text-xs font-bold leading-snug line-clamp-1 ${cfg.text}`}>{displayTitle}</p>

                    {/* Details snippet if available */}
                    {incident.details && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {incident.details}
                      </p>
                    )}

                    {/* Meta Row: Location & Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/30 dark:border-slate-800/30">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{displayLocation}</span>
                      </span>

                      {incident.createdAt && (
                        <span className="flex items-center gap-1 text-[9px] text-slate-400">
                          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                          {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
