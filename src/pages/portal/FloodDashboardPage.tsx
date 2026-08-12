import { useState, useRef } from 'react';
import {
  Waves,
  Maximize2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  PhoneCall,
  BellRing,
  Layers,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router';
import PageMeta from '@/components/common/PageMeta';
import Header from './components/Header';
import Footer from './components/Footer';
import ServiceExitButton from './components/ServiceExitButton';
import { usePortalContent } from '@/hooks/usePortalContent';

export default function FloodDashboardPage() {
  const { portalContent } = usePortalContent();
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;

  const tableauUrl = "https://public.tableau.com/views/AddisAbabaFloodRiskDashboard2025/1_Home?:embed=y&:showVizHome=no&:host_url=https%3A%2F%2Fpublic.tableau.com%2F&:embed_code_version=3&:tabs=no&:toolbar=yes&:animate_transition=yes&:display_static_image=no&:display_spinner=no&:display_overlay=yes&:display_count=yes&:language=en-US&:loadOrderID=0";

  const handleRefresh = () => {
    setIsLoadingIframe(true);
    setIframeKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-outfit selection:bg-blue-600 selection:text-white">
      <PageMeta
        title="Addis Ababa Flood Risk Analytics Dashboard 2025 | PDRM Portal"
        description="Interactive GIS flood risk assessment, woreda vulnerability mapping, and real-time hazard analytics."
      />

      {/* --- PUBLIC LIGHT HEADER (CRYSTAL VISIBLE ON WHITE) --- */}
      {showHeader && (
        <Header
          branding={portalContent?.branding}
          header={portalContent?.header}
          variant="light"
          solidBackground={true}
        />
      )}

      {/* --- FLOOD DASHBOARD HERO TITLE BAR (LIGHT THEME) --- */}
      <section className="relative pt-28 pb-8 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Waves className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Live GIS Analytics
                </span>
                <span className="px-3.5 py-1 rounded-full bg-cyan-100/80 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> Addis Ababa 2025
                </span>
                <span className="px-3.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> Multi-Layer Tableau Viz
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Addis Ababa <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">Flood Risk Dashboard</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed font-medium">
                Comprehensive flood vulnerability analysis, historical rainfall inundation models, and real-time woreda emergency risk index powered by Tableau GIS Data Visualization.
              </p>
            </div>

            {/* Dashboard Controls */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
              <button
                onClick={handleRefresh}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                title="Reload Visualization Data"
              >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${isLoadingIframe ? 'animate-spin' : ''}`} /> Reload Viz
              </button>

              <button
                onClick={toggleFullscreen}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4" /> {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>

              <a
                href="https://public.tableau.com/views/AddisAbabaFloodRiskDashboard2025/1_Home"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-slate-600" /> Tableau Server
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- EMBEDDED TABLEAU DASHBOARD CONTAINER --- */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-8">
        <div
          ref={containerRef}
          className="relative bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl transition-all"
        >
          {/* Loading Spinner Overlay */}
          {isLoadingIframe && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-slate-900 font-bold text-base">Loading Tableau Flood GIS Viz...</p>
                <p className="text-slate-500 text-xs font-medium">Connecting to Public Tableau Cloud Engine</p>
              </div>
            </div>
          )}

          {/* Tableau Iframe */}
          <iframe
            key={iframeKey}
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="Addis Ababa Flood Risk Dashboard 2025"
            allowTransparency={true}
            allowFullScreen={true}
            className="tableauViz w-full border-0 transition-opacity duration-300"
            style={{
              display: 'block',
              width: '100%',
              minHeight: '850px',
              height: '920px',
              border: 'none'
            }}
            src={tableauUrl}
            onLoad={() => setIsLoadingIframe(false)}
          />
        </div>

        {/* --- QUICK ACTION EMERGENCY CALLOUT BANNER (LIGHT THEME) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/incident-reporting"
            className="p-6 bg-white border border-slate-200/80 hover:border-rose-300 hover:shadow-md rounded-3xl group transition-all duration-300 flex items-start gap-4"
          >
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition-colors">Report Flood Incident</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Submit live flood coordinates, water levels, or blocked drainages for rapid emergency dispatch.
              </p>
            </div>
          </Link>

          <Link
            to="/alert-subscription"
            className="p-6 bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md rounded-3xl group transition-all duration-300 flex items-start gap-4"
          >
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:scale-110 transition-transform">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">Flood Alert SMS / Email</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Subscribe to instant early warning SMS alerts for your sub-city and woreda.
              </p>
            </div>
          </Link>

          <Link
            to="/emergency-contacts"
            className="p-6 bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md rounded-3xl group transition-all duration-300 flex items-start gap-4"
          >
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">Emergency Hotlines</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                View 24/7 emergency contacts, rescue services, and woreda disaster taskforce numbers.
              </p>
            </div>
          </Link>
        </div>
      </main>

      <ServiceExitButton />

      {/* --- PUBLIC FOOTER --- */}
      {showFooter && <Footer branding={portalContent?.branding} footer={portalContent?.footer} />}
    </div>
  );
}
