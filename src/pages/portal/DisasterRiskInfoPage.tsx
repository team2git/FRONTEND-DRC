import React, { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import { usePortalContent } from "@/hooks/usePortalContent";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";
import api from "@/api/axios";

const hazardFilters = [
  "Flood",
  "Landslide",
  "Fire",
  "Traffic",
  "Earthquake",
  "Electrical",
  "Sanitation",
  "Quarry",
];

const ladderLevels = [
  { label: "Extreme", count: 2, color: "var(--sev-extreme)" },
  { label: "Severe", count: 5, color: "var(--sev-severe)" },
  { label: "Moderate", count: 11, color: "var(--sev-moderate)" },
  { label: "Minor", count: 7, color: "var(--sev-minor)" },
  { label: "Informational", count: 14, color: "var(--sev-info)" },
];

const alerts = [
  {
    hazard: "Flash flood warning",
    time: "4h ago",
    location: "Kasenge district, southern basin",
    severity: "EXTREME",
    barColor: "var(--sev-extreme)",
    tagBg: "#FDEDEC",
    tagColor: "var(--sev-extreme)",
  },
  {
    hazard: "Landslide risk, slope failure",
    time: "8h ago",
    location: "Highland ridge, sector 4",
    severity: "SEVERE",
    barColor: "var(--sev-severe)",
    tagBg: "#FCF0E4",
    tagColor: "var(--sev-severe)",
  },
  {
    hazard: "Structure fire, market district",
    time: "10h ago",
    location: "Central market, block 12",
    severity: "SEVERE",
    barColor: "var(--sev-severe)",
    tagBg: "#FCF0E4",
    tagColor: "var(--sev-severe)",
  },
  {
    hazard: "Major traffic incident, ring road",
    time: "1d ago",
    location: "Northern bypass, km 14",
    severity: "MODERATE",
    barColor: "var(--sev-moderate)",
    tagBg: "#FBF4E1",
    tagColor: "var(--sev-moderate)",
  },
  {
    hazard: "Earthquake tremor cluster",
    time: "1d ago",
    location: "Rift corridor, offshore trench",
    severity: "MODERATE",
    barColor: "var(--sev-moderate)",
    tagBg: "#FBF4E1",
    tagColor: "var(--sev-moderate)",
  },
  {
    hazard: "Electrical line down",
    time: "1d ago",
    location: "Riverside substation area",
    severity: "MINOR",
    barColor: "var(--sev-minor)",
    tagBg: "#E7F3EC",
    tagColor: "var(--sev-minor)",
  },
  {
    hazard: "Sanitation system overflow",
    time: "2d ago",
    location: "Eastside treatment facility",
    severity: "MINOR",
    barColor: "var(--sev-minor)",
    tagBg: "#E7F3EC",
    tagColor: "var(--sev-minor)",
  },
  {
    hazard: "Quarry blasting notice",
    time: "2d ago",
    location: "Northwest quarry site",
    severity: "INFO",
    barColor: "var(--sev-info)",
    tagBg: "#EAEFF7",
    tagColor: "var(--sev-info)",
  },
];

const resources = [
  {
    title: "Historical disaster records",
    description: "Event logs, impact figures, and timelines dating back to 1990, filterable by hazard and district.",
    meta: "CSV · JSON",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D4C63" strokeWidth="1.7">
        <rect x="3" y="10" width="4" height="10" />
        <rect x="10" y="5" width="4" height="15" />
        <rect x="17" y="13" width="4" height="7" />
      </svg>
    ),
    linkText: "Browse →",
  },
  {
    title: "Risk assessment reports",
    description: "District-level vulnerability and exposure studies published by regional field offices.",
    meta: "PDF",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D4C63" strokeWidth="1.7">
        <path d="M4 19h16" />
        <path d="M8 19V9l4-4 4 4v10" />
      </svg>
    ),
    linkText: "Browse →",
  },
  {
    title: "Early warning feeds",
    description: "Real-time sensor and forecast streams from meteorological and seismic monitoring networks.",
    meta: "API",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D4C63" strokeWidth="1.7">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
    linkText: "Connect →",
  },
  {
    title: "Vulnerability index",
    description: "Composite scoring of population exposure, infrastructure resilience, and response capacity.",
    meta: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D4C63" strokeWidth="1.7">
        <path d="M12 3l8 4v5c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4z" />
      </svg>
    ),
    linkText: "Open →",
  },
];

const guidance = [
  "Flood evacuation routes and shelter locations",
  "Landslide early-warning signs and slope safety",
  "Fire response and evacuation checklist",
  "Traffic incident reporting and detour guidance",
  "Earthquake safety and building inspection checklist",
  "Electrical hazard reporting and outage safety",
  "Sanitation system failure and health precautions",
  "Quarry site safety zones and blasting schedules",
  "Regional emergency contact directory",
];

const accessLevels = [
  {
    tier: "Public summaries",
    description: "Alerts, maps, general guidance",
    badge: "Open",
    badgeClass: "open",
  },
  {
    tier: "Agency datasets",
    description: "Full historical records, raw feeds",
    badge: "Restricted",
    badgeClass: "restricted",
  },
  {
    tier: "API access",
    description: "Programmatic access for partners",
    badge: "By request",
    badgeClass: "request",
  },
];

const DisasterRiskInfoPage: React.FC = () => {
  const { portalContent } = usePortalContent();
  const riskInfo = portalContent?.pages?.riskInformation ?? {};

  const [lastSyncedState, setLastSyncedState] = useState<string | null>(riskInfo.lastSynced || null);
  const [activeAlertsState, setActiveAlertsState] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/public/gis-last-updated');
        const t = res?.data?.lastUpdated;
        if (mounted && t) {
          const d = new Date(t);
          const formatted = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
          setLastSyncedState(formatted);
        }
        // fetch woreda profile hazard/vulnerability summaries for map/alerts
        try {
          const r2 = await api.get('/api/public/woreda-hazards');
          const items = r2?.data || [];
          if (mounted) {
            const mapped = items.map((it: any) => {
              const when = it.updatedAt ? new Date(it.updatedAt) : new Date();
              const diffMs = Date.now() - when.getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const timeLabel = hours < 1 ? `${Math.floor(diffMs / (1000 * 60))}m ago` : `${hours}h ago`;
              const hazardIndex = Number(it.hazardIndex ?? 0);
              const vulnIndex = Number(it.vulnerabilityIndex ?? 0);
              let severity = 'INFO';
              if (!isNaN(hazardIndex)) {
                if (hazardIndex >= 8) severity = 'EXTREME';
                else if (hazardIndex >= 6) severity = 'SEVERE';
                else if (hazardIndex >= 4) severity = 'MODERATE';
                else if (hazardIndex >= 2) severity = 'MINOR';
              }
              const colorMap: Record<string,string> = { EXTREME: 'var(--sev-extreme)', SEVERE: 'var(--sev-severe)', MODERATE: 'var(--sev-moderate)', MINOR: 'var(--sev-minor)', INFO: 'var(--sev-info)' };
              const bgMap: Record<string,string> = { EXTREME: '#FDEDEC', SEVERE: '#FCF0E4', MODERATE: '#FBF4E1', MINOR: '#E7F3EC', INFO: '#EAEFF7' };
              const locLabel = it.location?.woreda ? `${it.location.subcity || ''} ${it.location.woreda}`.trim() : (it.location?.parent_key || 'Unknown');
              return {
                hazard: (Array.isArray(it.hazards) && it.hazards.length) ? it.hazards[0] : 'Hazard Index',
                time: timeLabel,
                location: `${locLabel} · H:${hazardIndex ?? 'N/A'} V:${vulnIndex ?? 'N/A'}`,
                severity: severity,
                barColor: colorMap[severity],
                tagBg: bgMap[severity],
                tagColor: colorMap[severity]
              };
            });
            setActiveAlertsState(mapped);
          }
        } catch (err) {
          // ignore fetch errors
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const heroImage = resolvePortalAssetUrl(riskInfo.heroImage) || "/assets/images/hero1.png";
  const statusLabel = riskInfo.statusLabel || "SYSTEM STATUS";
  const statusValue = riskInfo.statusValue || "OPERATIONAL — DATA FEED LIVE";
  const lastSynced = lastSyncedState || riskInfo.lastSynced || "2026-08-07 09:41 UTC";
  const searchPlaceholder = riskInfo.searchPlaceholder || "Search by region, hazard type, or event ID";
  const hazardsLabel = riskInfo.hazardsLabel || "All hazards";
  const regionsLabel = riskInfo.regionsLabel || "All regions";
  const searchButtonLabel = riskInfo.searchButtonLabel || "Search";
  const heroHazardFilters: string[] = riskInfo.hazardFilters || hazardFilters;
  const heroLadderLevels: { label: string; count: number; color: string }[] = riskInfo.ladderLevels || ladderLevels;

  return (
    <div className="disaster-risk-page">
      <PageMeta
        title={`${riskInfo.title || "Disaster Risk Information Access"} | IDRMIS Portal`}
        description={riskInfo.subtitle || "Live hazard monitoring, historical records, and preparedness resources for national and regional response coordination."}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .disaster-risk-page {
          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
        }

        .disaster-risk-page * {
          box-sizing: border-box;
        }

        .disaster-risk-page a {
          color: inherit;
          text-decoration: none;
        }

        .disaster-risk-page .topstrip {
          background: var(--navy-950);
          color: #B9C4D6;
          font-size: 12px;
          padding: 6px 32px;
          display: flex;
          justify-content: space-between;
          letter-spacing: .02em;
          align-items: center;
          gap: 12px;
        }

        .disaster-risk-page .topstrip .mono {
          color: #7FA3D6;
        }

        .disaster-risk-page .header {
          background: var(--navy-900);
          color: #fff;
          padding: 32px 32px 34px;
        }

        .disaster-risk-page .header-row {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(220px, 1fr);
          gap: 24px;
          max-width: 1280px;
          margin: 0 auto;
          align-items: start;
        }

        .disaster-risk-page .brand {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          width: 100%;
        }

        .disaster-risk-page .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--navy-700);
          border: 1px solid var(--slate-line);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .disaster-risk-page .brand-mark svg {
          width: 22px;
          height: 22px;
        }

        .disaster-risk-page h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }

        .disaster-risk-page .brand p {
          margin: 0;
          font-size: 13px;
          color: #9FB0C8;
          max-width: 460px;
          line-height: 1.5;
        }

        .disaster-risk-page .header-meta {
          text-align: right;
          font-size: 11px;
          color: #8FA1BA;
        }

        .disaster-risk-page .header-meta .mono {
          display: block;
          color: #DCE6F5;
          font-size: 12px;
          margin-top: 2px;
        }

        .disaster-risk-page .searchbar {
          max-width: 1280px;
          margin: 18px auto 0;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .disaster-risk-page .searchbar input,
        .disaster-risk-page .searchbar select {
          background: var(--navy-800);
          border: 1px solid var(--slate-line);
          border-radius: 6px;
          color: #fff;
          padding: 11px 14px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          min-width: 180px;
          flex: 1;
        }

        .disaster-risk-page .searchbar input::placeholder {
          color: #6E82A0;
        }

        .disaster-risk-page .searchbar button {
          background: #DCE6F5;
          color: var(--navy-950);
          border: none;
          border-radius: 6px;
          padding: 0 18px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          min-height: 44px;
        }

        .disaster-risk-page .ladder-strip {
          display: flex;
          max-width: 1280px;
          margin: 0 auto;
          border-top: 1px solid var(--slate-line);
        }

        .disaster-risk-page .ladder-seg {
          flex: 1;
          padding: 10px 16px;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-right: 1px solid var(--navy-900);
        }

        .disaster-risk-page .ladder-seg:last-child {
          border-right: none;
        }

        .disaster-risk-page .ladder-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .disaster-risk-page .ladder-seg .mono {
          color: rgba(255, 255, 255, .55);
        }

        .disaster-risk-page .ladder-seg span.label {
          color: #EDF1F7;
          font-weight: 500;
        }

        .disaster-risk-page .main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 32px 60px;
        }

        .disaster-risk-page .section-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .09em;
          color: var(--ink-faint);
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .disaster-risk-page .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #D7DCE4;
        }

        .disaster-risk-page .grid-top {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          margin-bottom: 40px;
        }

        .disaster-risk-page .map-panel,
        .disaster-risk-page .alerts-panel,
        .disaster-risk-page .res-card,
        .disaster-risk-page .list-card {
          background: var(--paper-card);
          border: 1px solid #DDE2E9;
          border-radius: 10px;
        }

        .disaster-risk-page .map-panel {
          overflow: hidden;
        }

        .disaster-risk-page .map-panel-head,
        .disaster-risk-page .alerts-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding: 14px 18px;
          border-bottom: 1px solid #E7EAEF;
        }

        .disaster-risk-page .map-panel-head h2,
        .disaster-risk-page .alerts-panel-head h2 {
          font-size: 14px;
          margin: 0;
          font-weight: 600;
          white-space: nowrap;
        }

        .disaster-risk-page .layer-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
        }

        .disaster-risk-page .chip {
          font-size: 10.5px;
          padding: 4px 9px;
          border-radius: 20px;
          border: 1px solid #D7DCE4;
          color: var(--ink-soft);
          white-space: nowrap;
          cursor: pointer;
        }

        .disaster-risk-page .chip.on {
          background: var(--navy-900);
          color: #fff;
          border-color: var(--navy-900);
        }

        .disaster-risk-page .map-canvas {
          height: 320px;
          position: relative;
          background:
            linear-gradient(#E9EDF2 1px, transparent 1px) 0 0/40px 40px,
            linear-gradient(90deg, #E9EDF2 1px, transparent 1px) 0 0/40px 40px,
            #F6F7F9;
        }

        .disaster-risk-page .map-zone {
          position: absolute;
          border-radius: 50%;
          opacity: .85;
        }

        .disaster-risk-page .map-zone.z1 { width: 120px; height: 120px; background: radial-gradient(circle, rgba(180,50,45,.55), rgba(180,50,45,0) 70%); top: 60px; left: 90px; }
        .disaster-risk-page .map-zone.z2 { width: 170px; height: 170px; background: radial-gradient(circle, rgba(217,112,36,.45), rgba(217,112,36,0) 70%); top: 120px; left: 420px; }
        .disaster-risk-page .map-zone.z3 { width: 100px; height: 100px; background: radial-gradient(circle, rgba(217,163,36,.45), rgba(217,163,36,0) 70%); top: 40px; left: 600px; }

        .disaster-risk-page .map-pin {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid #fff;
        }

        .disaster-risk-page .map-caption {
          position: absolute;
          bottom: 12px;
          left: 18px;
          font-size: 10px;
          color: var(--ink-faint);
        }

        .disaster-risk-page .map-panel-foot {
          display: flex;
          justify-content: space-between;
          padding: 12px 18px;
          border-top: 1px solid #E7EAEF;
          font-size: 12px;
          color: var(--ink-soft);
        }

        .disaster-risk-page .alerts-panel {
          display: flex;
          flex-direction: column;
        }

        .disaster-risk-page .count {
          font-size: 11px;
          background: #FDEDEC;
          color: var(--sev-extreme);
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .disaster-risk-page .alert-item {
          display: flex;
          gap: 10px;
          padding: 13px 18px;
          border-bottom: 1px solid #EEF0F3;
        }

        .disaster-risk-page .alert-item:last-child {
          border-bottom: none;
        }

        .disaster-risk-page .sev-rail {
          width: 3px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .disaster-risk-page .alert-body {
          flex: 1;
        }

        .disaster-risk-page .alert-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }

        .disaster-risk-page .alert-hazard {
          font-size: 13px;
          font-weight: 600;
        }

        .disaster-risk-page .alert-time {
          font-size: 10px;
          color: var(--ink-faint);
          white-space: nowrap;
        }

        .disaster-risk-page .alert-loc {
          font-size: 12px;
          color: var(--ink-soft);
          margin: 2px 0 0;
        }

        .disaster-risk-page .alert-tag {
          display: inline-block;
          margin-top: 6px;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 600;
        }

        .disaster-risk-page .res-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }

        .disaster-risk-page .res-card {
          padding: 18px;
        }

        .disaster-risk-page .res-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #EEF2F7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .disaster-risk-page .res-card h3 {
          font-size: 13.5px;
          margin: 0 0 6px;
          font-weight: 600;
        }

        .disaster-risk-page .res-card p {
          font-size: 12px;
          color: var(--ink-soft);
          line-height: 1.5;
          margin: 0 0 12px;
        }

        .disaster-risk-page .res-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--ink-faint);
          border-top: 1px solid #EEF0F3;
          padding-top: 10px;
        }

        .disaster-risk-page .res-link {
          color: var(--navy-900);
          font-weight: 600;
        }

        .disaster-risk-page .lower-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .disaster-risk-page .list-card {
          padding: 20px 22px;
        }

        .disaster-risk-page .list-card h2 {
          font-size: 14px;
          margin: 0 0 4px;
          font-weight: 600;
        }

        .disaster-risk-page .list-card .sub {
          font-size: 12px;
          color: var(--ink-soft);
          margin: 0 0 16px;
        }

        .disaster-risk-page .guide-row,
        .disaster-risk-page .access-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-top: 1px solid #EEF0F3;
          font-size: 13px;
        }

        .disaster-risk-page .guide-row:first-of-type,
        .disaster-risk-page .access-row:first-of-type {
          border-top: none;
        }

        .disaster-risk-page .guide-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--ink-faint);
          width: 20px;
        }

        .disaster-risk-page .guide-row span.t {
          flex: 1;
        }

        .disaster-risk-page .guide-row a {
          color: var(--navy-900);
          font-size: 12px;
          font-weight: 600;
        }

        .disaster-risk-page .access-row {
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
        }

        .disaster-risk-page .access-tier {
          font-size: 13px;
          font-weight: 600;
        }

        .disaster-risk-page .access-desc {
          font-size: 11.5px;
          color: var(--ink-soft);
          margin-top: 2px;
        }

        .disaster-risk-page .access-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .disaster-risk-page .access-badge.open {
          background: #E7F3EC;
          color: var(--sev-minor);
        }

        .disaster-risk-page .access-badge.restricted {
          background: #FDF1E3;
          color: var(--sev-severe);
        }

        .disaster-risk-page .access-badge.request {
          background: #EAEFF7;
          color: var(--sev-info);
        }

        .disaster-risk-page .request-btn {
          margin-top: 16px;
          width: 100%;
          background: var(--navy-900);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 11px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .disaster-risk-page .footer {
          background: var(--navy-950);
          color: #8091AA;
          padding: 24px 32px;
          font-size: 11px;
        }

        .disaster-risk-page .footer-row {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .disaster-risk-page .footer-sources {
          color: #5E6E88;
        }

        @media(max-width:900px) {
          .disaster-risk-page .grid-top,
          .disaster-risk-page .lower-grid {
            grid-template-columns: 1fr;
          }
          .disaster-risk-page .res-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .disaster-risk-page .ladder-strip {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="relative overflow-hidden bg-slate-950 pb-28 pt-24">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('${heroImage}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,63,132,0.15),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(71,85,105,0.18),transparent)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-slate-950/10">
              <span className="h-2 w-2 rounded-full bg-[#D7000F] animate-pulse" />
              <span className="font-semibold">{statusLabel}</span>
              <span className="text-slate-300">{statusValue}</span>
            </div>
            <div className="flex flex-col gap-6">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {riskInfo.title || "Disaster Risk Information Access"}
                </h1>
                <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl">
                  {riskInfo.subtitle || "Live hazard monitoring, historical records, and preparedness resources for national and regional response coordination."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white">
                  <div className="text-slate-300 uppercase tracking-[0.18em] text-[11px]">Last synced</div>
                  <div className="mt-2 text-lg font-semibold">{lastSynced}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white">
                  <div className="text-slate-300 uppercase tracking-[0.18em] text-[11px]">Hazards</div>
                  <div className="mt-2 text-lg font-semibold">{heroHazardFilters.length}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white">
                  <div className="text-slate-300 uppercase tracking-[0.18em] text-[11px]">Regions</div>
                  <div className="mt-2 text-lg font-semibold">{regionsLabel}</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.5fr_0.9fr]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_0.8fr]">
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none"
                  placeholder={searchPlaceholder}
                />
                <select
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled hidden>{hazardsLabel}</option>
                  {heroHazardFilters.map((filter) => (
                    <option key={filter} value={filter}>{filter}</option>
                  ))}
                </select>
                <select
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled hidden>{regionsLabel}</option>
                  <option value="national">National</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                  <option value="south">South</option>
                  <option value="north">North</option>
                </select>
                <button
                  type="button"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/10 hover:bg-slate-100"
                >
                  {searchButtonLabel}
                </button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
              {heroLadderLevels.map((level) => (
                <div key={level.label} className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white">
                  <div className="text-slate-300 uppercase tracking-[0.18em] text-[11px]">{level.label}</div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <span className="h-2 w-2 rounded-full" style={{ background: level.color }} />
                    {level.count} active
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="main">
        <p className="section-label">Current risk status</p>
        <div className="grid-top">
          <div className="map-panel">
            <div className="map-panel-head">
              <h2>Active hazard map</h2>
              <div className="layer-toggles">
                {hazardFilters.map((filter, index) => (
                  <span className={`chip ${index === 0 ? "on" : ""}`} key={filter}>
                    {filter}
                  </span>
                ))}
              </div>
            </div>
            <div className="map-canvas">
              <div className="map-zone z1" />
              <div className="map-zone z2" />
              <div className="map-zone z3" />
              <div className="map-pin" style={{ background: "var(--sev-extreme)", top: 105, left: 135 }} />
              <div className="map-pin" style={{ background: "var(--sev-severe)", top: 190, left: 480 }} />
              <div className="map-pin" style={{ background: "var(--sev-moderate)", top: 75, left: 630 }} />
              <span className="map-caption mono">ZOOM: NATIONAL — 25 active markers</span>
            </div>
            <div className="map-panel-foot">
              <span>Coverage: 34 districts</span>
              <span className="mono">Feed refresh: 15 min</span>
            </div>
          </div>

          <div className="alerts-panel">
            <div className="alerts-panel-head">
              <h2>Active alerts</h2>
              <span className="count">{(activeAlertsState || alerts).length} active</span>
            </div>
            {(activeAlertsState || alerts).map((alert) => (
              <div className="alert-item" key={alert.hazard + alert.time}>
                <div className="sev-rail" style={{ background: alert.barColor }} />
                <div className="alert-body">
                  <div className="alert-top">
                    <span className="alert-hazard">{alert.hazard}</span>
                    <span className="alert-time mono">{alert.time}</span>
                  </div>
                  <p className="alert-loc">{alert.location}</p>
                  <span className="alert-tag" style={{ background: alert.tagBg, color: alert.tagColor }}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="section-label">Data and resources</p>
        <div className="res-grid">
          {resources.map((resource) => (
            <div className="res-card" key={resource.title}>
              <div className="res-icon">{resource.icon}</div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div className="res-meta">
                <span className="mono">{resource.meta}</span>
                <a className="res-link" href="#">
                  {resource.linkText}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="lower-grid">
          <div className="list-card">
            <h2>Preparedness and guidance</h2>
            <p className="sub">Protocols and checklists by hazard type</p>
            {guidance.map((item, index) => (
              <div className="guide-row" key={item}>
                <span className="guide-num mono">{String(index + 1).padStart(2, "0")}</span>
                <span className="t">{item}</span>
                <a href="#">View</a>
              </div>
            ))}
          </div>

          <div className="list-card">
            <h2>Access and permissions</h2>
            <p className="sub">Data availability by user tier</p>
            {accessLevels.map((item) => (
              <div className="access-row" key={item.tier}>
                <div>
                  <div className="access-tier">{item.tier}</div>
                  <div className="access-desc">{item.description}</div>
                </div>
                <span className={`access-badge ${item.badgeClass}`}>{item.badge}</span>
              </div>
            ))}
            <button type="button" className="request-btn">
              Request data access
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        {/* <div className="footer-row">
          <span className="footer-sources">Data sources: national meteorological service, seismological institute, regional disaster management offices</span>
          <span>Technical support: helpdesk@drima.gov</span>
        </div> */}
      </footer>
    </div>
  );
};

export default DisasterRiskInfoPage;
