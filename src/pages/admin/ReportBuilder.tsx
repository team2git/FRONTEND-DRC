import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Layers,
  SlidersHorizontal,
  Eye,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  LayoutGrid,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchSources, executeQuery, fetchTemplates, executeMultiQuery } from '../../api/reportBuilderApi';
import type {
  DataSource,
  ReportConfig,
  QueryResult,
  ReportTemplate,
  WizardStep,
  ReportFilters,
  PerSourceConfig,
  MultiQueryResponse,
} from './report-builder/types';
import { SourceSelector } from './report-builder/SourceSelector';
import { FilterConfig } from './report-builder/FilterConfig';
import { ColumnPicker } from './report-builder/ColumnPicker';
import { ReportPreview } from './report-builder/ReportPreview';
import { ExportToolbar } from './report-builder/ExportToolbar';
import { SavedTemplates } from './report-builder/SavedTemplates';
import { MultiSourceConfigurator } from './report-builder/MultiSourceConfigurator';
import { MultiSourcePreview } from './report-builder/MultiSourcePreview';
import { toast } from 'react-toastify';

export const ReportBuilder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [showPresetsPanel, setShowPresetsPanel] = useState(true);

  // ── Report Mode Toggle ────────────────────────────────────────────────────
  type ReportMode = 'single' | 'multi';
  const [reportMode, setReportMode] = useState<ReportMode>('single');

  // ── Multi-source state ───────────────────────────────────────────────────
  const [multiSourceConfigs, setMultiSourceConfigs] = useState<PerSourceConfig[]>([]);
  const [multiResult, setMultiResult] = useState<MultiQueryResponse | null>(null);
  const [loadingMulti, setLoadingMulti] = useState(false);

  // Configuration State
  const [config, setConfig] = useState<ReportConfig>({
    source: '',
    filters: {},
    fields: [],
    groupBy: '',
    chartType: 'table',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 100,
  });

  // Query Result State
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);

  // Load initial sources & saved templates
  const loadInitialData = async () => {
    try {
      setLoadingSources(true);
      const [srcs, tmpls] = await Promise.all([fetchSources(), fetchTemplates()]);
      setSources(srcs);
      setTemplates(tmpls);
      if (srcs.length > 0 && !config.source) {
        const first = srcs[0];
        setConfig((prev) => ({
          ...prev,
          source: first.key,
          fields: first.defaultFields,
        }));
      }
    } catch (err: any) {
      console.error('Failed to load report builder sources:', err);
      toast.error('Failed to load data sources');
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const currentSource = useMemo(() => {
    return sources.find((s) => s.key === config.source) || null;
  }, [sources, config.source]);

  // Handle source switch
  const handleSelectSource = (sourceKey: string) => {
    const src = sources.find((s) => s.key === sourceKey);
    if (!src) return;
    setConfig({
      source: sourceKey,
      filters: {},
      fields: src.defaultFields,
      groupBy: '',
      chartType: 'table',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 100,
    });
    setResult(null);
    setCurrentStep(2);
  };

  // Filter change
  const handleFilterChange = (key: string, value: ReportFilters[string]) => {
    setConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  };

  const handleClearFilters = () => {
    setConfig((prev) => ({ ...prev, filters: {} }));
  };

  // Run report query
  const handleRunReport = async (overrideConfig?: ReportConfig) => {
    const targetConfig = overrideConfig || config;
    if (!targetConfig.source) return;
    try {
      setLoadingQuery(true);
      const res = await executeQuery(targetConfig);
      setResult(res);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Report execution failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoadingQuery(false);
    }
  };

  // Reset entire builder
  const handleReset = () => {
    if (!currentSource) return;
    setConfig({
      source: currentSource.key,
      filters: {},
      fields: currentSource.defaultFields,
      groupBy: '',
      chartType: 'table',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 100,
    });
    setResult(null);
    setCurrentStep(1);
  };

  // Load a saved template (optionally auto-running it immediately)
  const handleLoadTemplate = async (tmpl: ReportTemplate, autoRun = false) => {
    const src = sources.find((s) => s.key === tmpl.source);
    if (!src) {
      toast.warn(`Data source "${tmpl.source}" is not available.`);
      return;
    }
    const newConfig: ReportConfig = {
      source: tmpl.source,
      filters: tmpl.filters || {},
      fields: tmpl.fields && tmpl.fields.length > 0 ? tmpl.fields : src.defaultFields,
      groupBy: tmpl.groupBy || '',
      chartType: tmpl.chartType || 'table',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 100,
    };
    setConfig(newConfig);
    toast.info(`Loaded "${tmpl.name}" preset`);

    if (autoRun) {
      await handleRunReport(newConfig);
    } else {
      setCurrentStep(2);
    }
  };

  // Run multi-source parallel queries
  const handleRunMultiQuery = async () => {
    if (multiSourceConfigs.length === 0) {
      toast.warn('Please add at least one dataset to query.');
      return;
    }
    try {
      setLoadingMulti(true);
      const res = await executeMultiQuery(multiSourceConfigs);
      setMultiResult(res);
      toast.success(`Queried ${res.sourceCount} datasets — ${res.grandTotal.toLocaleString()} total records`);
    } catch (err: any) {
      console.error('Multi-query failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to run multi-dataset report');
    } finally {
      setLoadingMulti(false);
    }
  };

  if (loadingSources) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Initializing System Report Engine...
        </p>
        <p className="text-xs text-slate-400 mt-1">Connecting to system models and schemas</p>
      </div>
    );
  }

  const stepsInfo = [
    {
      step: 1 as WizardStep,
      title: '1. Select Dataset',
      subtitle: currentSource ? currentSource.label : 'Choose data domain',
      icon: Layers,
    },
    {
      step: 2 as WizardStep,
      title: '2. Filters & Visuals',
      subtitle: `${Object.keys(config.filters).length} filters • ${config.fields.length} cols`,
      icon: SlidersHorizontal,
    },
    {
      step: 3 as WizardStep,
      title: '3. Preview & Export',
      subtitle: result ? `${result.total.toLocaleString()} records ready` : 'Execute query',
      icon: Eye,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300 font-outfit">
      {/* Top Header Card (Matching Dashboard Style) */}
      <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-brand-500/10 dark:bg-brand-500/20 rounded-2xl text-brand-600 dark:text-brand-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  System Report Builder
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  Analytical Suite
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 max-w-2xl leading-relaxed">
                Query, filter, aggregate, and visualize real-time data across emergency operations, field surveys, and administrative datasets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            <button
              type="button"
              onClick={() => setShowPresetsPanel((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              {showPresetsPanel ? (
                <>
                  <PanelRightClose className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Hide Presets</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4 text-brand-600" />
                  <span className="hidden sm:inline">Presets ({templates.length})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/report-builder/new')}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-accent-500 to-red-600 hover:from-accent-600 hover:to-red-700 text-white shadow-md shadow-red-900/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>

            {reportMode === 'single' ? (
              <button
                type="button"
                onClick={() => handleRunReport()}
                disabled={loadingQuery || !config.source}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {loadingQuery ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                )}
                Run &amp; Preview
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRunMultiQuery}
                disabled={loadingMulti || multiSourceConfigs.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {loadingMulti ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                )}
                Run All Queries ({multiSourceConfigs.length})
              </button>
            )}
          </div>
        </div>

        {/* Mode Toggle — Single vs Multi */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setReportMode('single')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportMode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Single Dataset
            </button>
            <button
              type="button"
              onClick={() => setReportMode('multi')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportMode === 'multi'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Multi-Dataset Report
              {multiSourceConfigs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black">{multiSourceConfigs.length}</span>
              )}
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {reportMode === 'single'
              ? (currentSource ? `Active: ${currentSource.label}` : 'Select a dataset to begin')
              : `${multiSourceConfigs.length} dataset${multiSourceConfigs.length !== 1 ? 's' : ''} configured`}
          </span>
        </div>
      </div>

      {/* Stepped Progress Bar (Single Dataset Mode) */}
      {reportMode === 'single' && (
        <div className="p-2 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="grid grid-cols-3 gap-2">
            {stepsInfo.map((s) => {
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;
              const Icon = s.icon;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`
                    p-3 rounded-xl text-left transition-all duration-200 cursor-pointer flex items-center gap-3
                    ${
                      isActive
                        ? 'bg-brand-50/90 dark:bg-brand-950/50 border border-brand-300 dark:border-brand-700/70 shadow-xs ring-1 ring-brand-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                    }
                  `}
                >
                  <div
                    className={`
                      w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition
                      ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }
                    `}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 hidden sm:block">
                    <h4
                      className={`text-xs font-black truncate ${
                        isActive ? 'text-brand-900 dark:text-brand-200' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {s.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{s.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Central Content Area */}
        <div className={showPresetsPanel ? 'lg:col-span-8 xl:col-span-9 space-y-6' : 'lg:col-span-12 space-y-6'}>

          {/* ── Multi-Dataset Mode Panel ─────────────────────────────── */}
          {reportMode === 'multi' && (
            <>
              <MultiSourceConfigurator
                sources={sources}
                configs={multiSourceConfigs}
                onChange={setMultiSourceConfigs}
              />
              <MultiSourcePreview
                response={multiResult}
                loading={loadingMulti}
                sourceConfigs={multiSourceConfigs}
                allSources={sources}
              />
            </>
          )}

          {/* ── Single-Dataset Mode: STEP 1 ──────────────────────────── */}
          {reportMode === 'single' && currentStep === 1 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm">
              <SourceSelector
                sources={sources}
                selected={config.source}
                onSelect={handleSelectSource}
              />
            </div>
          )}

          {/* STEP 2: Configure Filters, Columns & Visuals */}
          {reportMode === 'single' && currentStep === 2 && currentSource && (
            <div className="space-y-6">
              {/* Active Source Summary Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                    style={{ backgroundColor: `${currentSource.color}20`, color: currentSource.color }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {currentSource.label}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                        {currentSource.fields.length} Available Columns
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentSource.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-300 hover:underline px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition cursor-pointer"
                >
                  Change Dataset
                </button>
              </div>

              {/* Filters Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm">
                <FilterConfig
                  source={currentSource}
                  filters={config.filters}
                  onChange={handleFilterChange}
                  onClear={handleClearFilters}
                />
              </div>

              {/* Columns & Visualizer Config Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm">
                <ColumnPicker
                  source={currentSource}
                  selectedFields={config.fields}
                  onFieldsChange={(fields) => setConfig((prev) => ({ ...prev, fields }))}
                  chartType={config.chartType}
                  onChartTypeChange={(chartType) => setConfig((prev) => ({ ...prev, chartType }))}
                  groupBy={config.groupBy}
                  onGroupByChange={(groupBy) => setConfig((prev) => ({ ...prev, groupBy }))}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Export */}
          {reportMode === 'single' && currentStep === 3 && (
            <div className="space-y-4">
              <ExportToolbar
                config={config}
                source={currentSource}
                onTemplateSaved={loadInitialData}
                onAdjustFilters={() => setCurrentStep(2)}
              />
              <ReportPreview
                result={result}
                loading={loadingQuery}
                source={currentSource}
                selectedFields={config.fields}
                chartType={config.chartType}
                groupBy={config.groupBy}
              />
            </div>
          )}

          {/* Wizard Footer Controls (Single Dataset Mode) */}
          {reportMode === 'single' && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as WizardStep)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Stage
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1) setCurrentStep(2);
                    else if (currentStep === 2) handleRunReport();
                  }}
                  disabled={loadingQuery || !config.source}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {currentStep === 2 ? 'Run & Generate Preview' : 'Continue to Configuration'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
                  Adjust Query &amp; Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Saved Templates */}
        {showPresetsPanel && (
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <SavedTemplates
              templates={templates}
              sources={sources}
              onLoadTemplate={handleLoadTemplate}
              onRefresh={loadInitialData}
              currentUserId={(user as any)?._id || (user as any)?.id || ''}
            />

            <div className="p-4 rounded-2xl border border-brand-200 dark:border-brand-800/70 bg-brand-50/60 dark:bg-brand-950/30 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-brand-800 dark:text-brand-200">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>Executive Tips</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Use <strong>Quick Date Presets</strong> (e.g. <em>Last 30 Days</em>) combined with <strong>Group By</strong> to prepare presentation-ready reports for team meetings in seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;
