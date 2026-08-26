import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveDashboard } from '../hooks/useLiveDashboard';
import { DashboardHeader, DashboardViewMode } from '../components/DashboardHeader';
import { KPICards } from '../components/KPICards';
import { LiveMap } from '../components/LiveMap';
import { IncidentFeed } from '../components/IncidentFeed';
import { HazardAnalysis } from '../components/HazardAnalysis';
import { IncidentTrend } from '../components/IncidentTrend';
import { ResponseStatus } from '../components/ResponseStatus';
import { SiteSurveyStatus } from '../components/SiteSurveyStatus';
import { PublicOfficeWorkflow } from '../components/PublicOfficeWorkflow';
import { VisualAnalyticsDashboard } from '../components/VisualAnalyticsDashboard';
import { CriticalAlerts } from '../components/CriticalAlerts';
import { EarlyWarningAlerts } from '../components/EarlyWarningAlerts';
import { AssessmentAnalyticsCard } from '../components/AssessmentAnalyticsCard';
import { FilterPanel } from '../components/FilterPanel';
import { DashboardLayoutModal } from '../components/DashboardLayoutModal';
import { DisasterHistoryTrend } from '../components/DisasterHistoryTrend';
import { ThemeOption } from '../types/dashboardTypes';
import {
  DashboardCardConfig,
  DashboardCardId,
  GridColSpan,
  CustomScreenProfile,
  DEFAULT_CARD_ORDER,
  BUILTIN_SCREEN_PROFILES,
} from '../types/layoutTypes';
import { AlertCircle, Maximize2, X, Sliders } from 'lucide-react';

export const LiveDashboard: React.FC = () => {
  const {
    summary,
    mapIncidents,
    hazards,
    trends,
    responseMonitoring,
    surveyMonitoring,
    publicOfficeWorkflow,
    assessmentAnalytics,
    activityFeed,
    disasterHistory,
    loading,
    error,
    lastUpdated,
    socketStatus,
    activeAlert,
    filters,
    updateFilter,
    resetFilters,
    dismissAlert,
    refreshData,
  } = useLiveDashboard();

  const dashboardContainerRef = useRef<HTMLDivElement>(null);

  // Background Theme preference state
  const [theme, setTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem('live_dashboard_theme') as ThemeOption) || 'light';
  });

  // View Mode State: 'command' | 'analytics'
  const [viewMode, setViewMode] = useState<DashboardViewMode>('command');

  // Full screen state tracking
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Show/Hide Filter Card state (persisted)
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    const saved = localStorage.getItem('live_dashboard_show_filters');
    return saved !== null ? saved === 'true' : true;
  });

  // Custom User Screen Profiles list (persisted)
  const [customProfiles, setCustomProfiles] = useState<CustomScreenProfile[]>(() => {
    try {
      const saved = localStorage.getItem('live_dashboard_custom_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Active Screen Profile ID (persisted)
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('live_dashboard_active_profile_id') || 'integrated';
  });

  // Layout & Cards Ordering state (persisted)
  const [cardsConfig, setCardsConfig] = useState<DashboardCardConfig[]>(() => {
    try {
      const saved = localStorage.getItem('live_dashboard_cards_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: DashboardCardConfig) => p.id));
          const missing = DEFAULT_CARD_ORDER.filter((d) => !existingIds.has(d.id));
          const valid = parsed.filter((p: DashboardCardConfig) =>
            DEFAULT_CARD_ORDER.some((d) => d.id === p.id)
          ).map((p: DashboardCardConfig) => {
            const def = DEFAULT_CARD_ORDER.find((d) => d.id === p.id);
            return {
              ...p,
              colSpan: p.colSpan || (def ? def.colSpan : 12),
            };
          });
          return [...valid, ...missing];
        }
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_CARD_ORDER;
  });

  // Layout Modal open state
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);

  // Standalone popout single card focus state
  const [popoutCardId, setPopoutCardId] = useState<DashboardCardId | null>(null);

  // Persist theme
  useEffect(() => {
    localStorage.setItem('live_dashboard_theme', theme);
  }, [theme]);

  // Persist showFilters
  useEffect(() => {
    localStorage.setItem('live_dashboard_show_filters', String(showFilters));
  }, [showFilters]);

  // Persist cardsConfig
  useEffect(() => {
    localStorage.setItem('live_dashboard_cards_config', JSON.stringify(cardsConfig));
  }, [cardsConfig]);

  // Persist customProfiles
  useEffect(() => {
    localStorage.setItem('live_dashboard_custom_profiles', JSON.stringify(customProfiles));
  }, [customProfiles]);

  // Persist activeProfileId
  useEffect(() => {
    localStorage.setItem('live_dashboard_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  // Fullscreen change listener to sync state when user exits via ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (dashboardContainerRef.current?.requestFullscreen) {
        dashboardContainerRef.current.requestFullscreen().catch(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        });
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Map theme values to container CSS styles
  const getThemeClass = () => {
    switch (theme) {
      case 'blue_black':
        return 'bg-[#080e21] text-blue-50 theme-blue-black';
      case 'dark':
        return 'bg-slate-950 text-slate-100 theme-dark';
      case 'dark_grey':
        return 'bg-neutral-950 text-neutral-100 theme-dark-grey';
      case 'solar':
        return 'bg-stone-950 text-amber-100 theme-solar';
      case 'light':
      default:
        return 'bg-slate-100 text-slate-900 theme-light';
    }
  };

  // Check if any filter is active
  const hasActiveFilters =
    filters.woreda !== '' ||
    filters.hazard !== '' ||
    filters.severity !== '' ||
    filters.status !== '' ||
    filters.datePreset !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  // Handle switching screen profile
  const handleSelectProfile = (profileId: string, newCards: DashboardCardConfig[]) => {
    setActiveProfileId(profileId);
    setCardsConfig(newCards);
  };

  // Handle saving new custom screen configuration
  const handleSaveCustomProfile = (newProfile: CustomScreenProfile) => {
    setCustomProfiles((prev) => [...prev.filter((p) => p.id !== newProfile.id), newProfile]);
  };

  // Handle deleting a custom screen configuration
  const handleDeleteCustomProfile = (profileId: string) => {
    setCustomProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (activeProfileId === profileId) {
      setActiveProfileId('integrated');
      setCardsConfig(DEFAULT_CARD_ORDER);
    }
  };

  // Get active screen profile name
  const activeProfileName = useMemo(() => {
    const all = [...BUILTIN_SCREEN_PROFILES, ...customProfiles];
    const found = all.find((p) => p.id === activeProfileId);
    return found ? found.name : 'Custom Layout';
  }, [activeProfileId, customProfiles]);

  // Helper to map colSpan numbers to responsive Tailwind CSS grid classes
  const getColSpanClass = (span: GridColSpan = 12) => {
    switch (span) {
      case 3:
        return 'col-span-12 sm:col-span-6 lg:col-span-3';
      case 4:
        return 'col-span-12 sm:col-span-6 lg:col-span-4';
      case 6:
        return 'col-span-12 lg:col-span-6';
      case 8:
        return 'col-span-12 lg:col-span-8';
      case 12:
      default:
        return 'col-span-12';
    }
  };

  // Render individual card by ID
  const renderCard = (cardId: DashboardCardId) => {
    switch (cardId) {
      case 'kpi_cards':
        return <KPICards summary={summary} loading={loading} theme={theme} />;
      case 'early_warning':
        return <EarlyWarningAlerts incidents={mapIncidents} loading={loading} theme={theme} />;
      case 'public_workflow':
        return <PublicOfficeWorkflow data={publicOfficeWorkflow} loading={loading} theme={theme} />;
      case 'gis_map':
        return <LiveMap incidents={mapIncidents} loading={loading} theme={theme} />;
      case 'incident_feed':
        return <IncidentFeed activities={activityFeed} loading={loading} theme={theme} />;
      case 'incident_trend':
        return <IncidentTrend trends={trends} loading={loading} theme={theme} filters={filters} />;
      case 'hazard_analysis':
        return <HazardAnalysis hazards={hazards} loading={loading} theme={theme} />;
      case 'response_status':
        return <ResponseStatus data={responseMonitoring} loading={loading} theme={theme} />;
      case 'survey_status':
        return <SiteSurveyStatus data={surveyMonitoring} loading={loading} theme={theme} />;
      case 'assessment_analytics':
        return <AssessmentAnalyticsCard data={assessmentAnalytics} loading={loading} theme={theme} />;
      case 'disaster_history':
        return <DisasterHistoryTrend data={disasterHistory} loading={loading} theme={theme} />;
      default:
        return null;
    }
  };

  // Sorted and enabled cards in strict sequence
  const sortedEnabledCards = useMemo(() => {
    return [...cardsConfig]
      .filter((c) => c.enabled)
      .sort((a, b) => a.order - b.order);
  }, [cardsConfig]);

  return (
    <div
      ref={dashboardContainerRef}
      className={`min-h-screen p-4 md:p-6 space-y-4 transition-colors duration-300 ${getThemeClass()} ${
        isFullscreen ? 'overflow-y-auto h-screen w-screen fixed inset-0 z-[999999]' : ''
      }`}
    >
      {/* Dashboard Header with Theme, View Mode, Filter toggle, Layout Manager & Fullscreen */}
      <DashboardHeader
        socketStatus={socketStatus}
        lastUpdated={lastUpdated}
        onRefresh={refreshData}
        loading={loading}
        theme={theme}
        onThemeChange={setTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        hasActiveFilters={hasActiveFilters}
        onOpenLayoutModal={() => setIsLayoutModalOpen(true)}
      />

      {/* Situational Filters Card (Show/Hide controlled by user) */}
      {showFilters && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <FilterPanel
            filters={filters}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            theme={theme}
          />
        </div>
      )}

      {/* Error Alert if any */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      )}

      {/* Active Screen Configuration Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Screen Configuration:</span>
          <span className="px-2.5 py-0.5 rounded-md font-black bg-blue-600 text-white text-[11px] shadow-sm">
            {activeProfileName}
          </span>
          <span className="text-slate-400 hidden sm:inline">
            ({sortedEnabledCards.length} of {cardsConfig.length} cards visible)
          </span>
        </div>
        <button
          onClick={() => setIsLayoutModalOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Customize Grid &amp; Layout</span>
        </button>
      </div>

      {/* Standalone Card Focus / Pop-out Window Overlay */}
      {popoutCardId && (
        <div className="fixed inset-0 z-[99999] p-4 bg-black/80 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-3 text-white">
            <span className="text-sm font-bold flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-blue-400" /> Dedicated Card Display Mode
            </span>
            <button
              onClick={() => setPopoutCardId(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
              title="Close Popout Mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">{renderCard(popoutCardId)}</div>
        </div>
      )}

      {/* Conditional Layout Rendering */}
      {viewMode === 'analytics' ? (
        <div className="space-y-4">
          {sortedEnabledCards.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl border-dashed border-slate-300 dark:border-slate-800 text-slate-400">
              <p className="text-sm font-bold mb-2">No cards currently visible in this screen configuration.</p>
              <button
                onClick={() => setIsLayoutModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Open Layout Manager &amp; Enable Cards
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic Grid for Enabled Executive Cards */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                {sortedEnabledCards.map((card) => (
                  <div
                    key={card.id}
                    className={`${getColSpanClass(card.colSpan)} h-full flex flex-col justify-between transition-all duration-300`}
                  >
                    {renderCard(card.id)}
                  </div>
                ))}
              </div>

              {/* Comprehensive Executive Analytics Breakdown Section */}
              <VisualAnalyticsDashboard
                summary={summary}
                hazards={hazards}
                trends={trends}
                responseMonitoring={responseMonitoring}
                surveyMonitoring={surveyMonitoring}
                publicWorkflow={publicOfficeWorkflow}
                assessmentAnalytics={assessmentAnalytics}
                loading={loading}
                theme={theme}
              />
            </>
          )}
        </div>
      ) : (
        /* Dynamic 12-Column Flexible Grid Layout for Command View */
        <div className="space-y-4">
          {sortedEnabledCards.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl border-dashed border-slate-300 dark:border-slate-800 text-slate-400">
              <p className="text-sm font-bold mb-2">No cards currently visible in this screen configuration.</p>
              <button
                onClick={() => setIsLayoutModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Open Layout Manager &amp; Enable Cards
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {sortedEnabledCards.map((card) => (
                <div
                  key={card.id}
                  className={`${getColSpanClass(card.colSpan)} h-full flex flex-col justify-between transition-all duration-300`}
                >
                  {renderCard(card.id)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* Layout & Card Manager Modal */}
      <DashboardLayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        cards={cardsConfig}
        onCardsChange={setCardsConfig}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        customProfiles={customProfiles}
        onSaveCustomProfile={handleSaveCustomProfile}
        onDeleteCustomProfile={handleDeleteCustomProfile}
        onPopoutCard={(cardId) => {
          setPopoutCardId(cardId);
          setIsLayoutModalOpen(false);
        }}
        theme={theme}
      />

      {/* Critical Incident Alert Banner Modal */}
      <CriticalAlerts alert={activeAlert} onClose={dismissAlert} theme={theme} />
    </div>
  );
};

export default LiveDashboard;
