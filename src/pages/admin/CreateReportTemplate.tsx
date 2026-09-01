import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Database,
  Share2,
  Star,
  Lock,
  Globe,
  UserCheck,
  ShieldCheck,
  Tag,
  RefreshCw,
  Loader2,
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  FileText,
  Palette,
  LucideIcon,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchSources,
  fetchTemplates,
  saveTemplate,
  updateTemplate,
  fetchShareableUsers,
} from '../../api/reportBuilderApi';
import type {
  DataSource,
  ShareableUser,
  SharingType,
  ChartType,
  ReportFilters,
  RefreshSchedule,
} from './report-builder/types';

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Dataset & Config', icon: Database },
  { id: 2, title: 'Appearance', icon: Palette },
  { id: 3, title: 'Sharing & Access', icon: Share2 },
  { id: 4, title: 'Review & Save', icon: CheckCircle2 },
];

const CHART_TYPES: { key: ChartType; label: string; icon: LucideIcon }[] = [
  { key: 'table', label: 'Table', icon: TableIcon },
  { key: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { key: 'line', label: 'Line Chart', icon: LineChart },
  { key: 'donut', label: 'Donut Chart', icon: PieChart },
];

const SHARING_OPTIONS: {
  key: SharingType;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    key: 'private',
    label: 'Private — Only Me',
    desc: 'Only you can view and use this report template.',
    icon: Lock,
    color: '#64748b',
  },
  {
    key: 'all_users',
    label: 'All Staff Members',
    desc: 'Visible to every active staff user in the system.',
    icon: Globe,
    color: '#10b981',
  },
  {
    key: 'specific_users',
    label: 'Specific Individuals',
    desc: 'Choose exact people who can access this template.',
    icon: UserCheck,
    color: '#0ba5ec',
  },
  {
    key: 'by_roles',
    label: 'By Role / Access Level',
    desc: 'Share with users based on their role or access level.',
    icon: ShieldCheck,
    color: '#8b5cf6',
  },
];

const CATEGORIES = [
  'Operational', 'Emergency Response', 'Assessment', 'Administrative',
  'Financial', 'Community', 'Environmental', 'Executive Summary',
];

const ACCESS_LEVELS = [
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'manager', label: 'Manager' },
  { key: 'deputy', label: 'Deputy' },
  { key: 'sector_lead', label: 'Sector Lead' },
  { key: 'directorate', label: 'Directorate' },
  { key: 'team_leader', label: 'Team Leader' },
  { key: 'expert', label: 'Expert' },
  { key: 'branch_admin', label: 'Branch Admin' },
];

const COLOR_PALETTE = [
  '#143f84', '#e11d2d', '#0ba5ec', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#64748b', '#1e293b',
];

const REFRESH_OPTIONS: { key: RefreshSchedule; label: string }[] = [
  { key: 'on_demand', label: 'On Demand (Manual)' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

// ── Field Quick-Date Presets ──────────────────────────────────────────────────
function applyDatePreset(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const s = y.toISOString().split('T')[0]; return { from: s, to: s };
  }
  if (preset === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { from: d.toISOString().split('T')[0], to: today };
  }
  if (preset === '30d') {
    const d = new Date(now); d.setDate(d.getDate() - 30);
    return { from: d.toISOString().split('T')[0], to: today };
  }
  if (preset === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: today };
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
const CreateReportTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditing = Boolean(editId);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data
  const [sources, setSources] = useState<DataSource[]>([]);
  const [shareableUsers, setShareableUsers] = useState<ShareableUser[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Form state
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedGroupBy, setSelectedGroupBy] = useState('');
  const [chartType, setChartType] = useState<ChartType>('table');
  const [filters, setFilters] = useState<ReportFilters>({});

  // Appearance
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operational');
  const [tags, setTags] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [color, setColor] = useState('#143f84');
  const [isFeatured, setIsFeatured] = useState(false);
  const [executiveNotes, setExecutiveNotes] = useState('');
  const [refreshSchedule, setRefreshSchedule] = useState<RefreshSchedule>('on_demand');

  // Sharing
  const [sharingType, setSharingType] = useState<SharingType>('private');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Load sources + shareable users + (if editing) template data
  useEffect(() => {
    const load = async () => {
      try {
        const [srcs, users] = await Promise.all([fetchSources(), fetchShareableUsers()]);
        setSources(srcs);
        setShareableUsers(users);

        if (isEditing && editId) {
          const templates = await fetchTemplates();
          const tmpl = templates.find((t) => t._id === editId);
          if (tmpl) {
            setSelectedSource(tmpl.source);
            setSelectedFields(tmpl.fields || []);
            setSelectedGroupBy(tmpl.groupBy || '');
            setChartType(tmpl.chartType || 'table');
            setFilters(tmpl.filters || {});
            setName(tmpl.name);
            setDescription(tmpl.description || '');
            setCategory(tmpl.category || 'Operational');
            setTags((tmpl.tags || []).join(', '));
            setIcon(tmpl.icon || 'FileText');
            setColor(tmpl.color || '#143f84');
            setIsFeatured(tmpl.isFeatured || false);
            setExecutiveNotes(tmpl.executiveNotes || '');
            setRefreshSchedule(tmpl.refreshSchedule || 'on_demand');
            setSharingType(tmpl.sharingType || 'private');

            const sharedUsers = (tmpl.sharedWithUsers || []).map((u) =>
              typeof u === 'string' ? u : u._id
            );
            setSelectedUserIds(sharedUsers);

            const sharedRoles = (tmpl.sharedWithRoles || []).map((r) =>
              typeof r === 'string' ? r : r._id
            );
            setSelectedRoles(sharedRoles);

            if (srcs.length > 0) {
              const src = srcs.find((s) => s.key === tmpl.source);
              if (src && (!tmpl.fields || tmpl.fields.length === 0)) {
                setSelectedFields(src.defaultFields);
              }
            }
          }
        } else if (srcs.length > 0) {
          setSelectedSource(srcs[0].key);
          setSelectedFields(srcs[0].defaultFields);
        }
      } catch (err) {
        console.error('Error loading create-template data:', err);
        toast.error('Failed to load data sources');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEditing, editId]);

  // Derived
  const activeSource = useMemo(
    () => sources.find((s) => s.key === selectedSource) || null,
    [sources, selectedSource]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return shareableUsers.filter(
      (u) =>
        (u.fullname || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.accessLevel || '').toLowerCase().includes(q)
    );
  }, [shareableUsers, userSearch]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSourceChange = (key: string) => {
    const src = sources.find((s) => s.key === key);
    setSelectedSource(key);
    setSelectedFields(src?.defaultFields || []);
    setSelectedGroupBy('');
    setFilters({});
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Template name is required'); setStep(2); return; }
    if (!selectedSource) { toast.error('Please select a dataset'); setStep(1); return; }
    if (selectedFields.length === 0) { toast.error('Please select at least one column'); setStep(1); return; }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        source: selectedSource,
        filters,
        fields: selectedFields,
        groupBy: selectedGroupBy,
        chartType,
        sharingType,
        sharedWithUsers: sharingType === 'specific_users' ? selectedUserIds : [],
        sharedWithRoles: sharingType === 'by_roles' ? selectedRoles : [],
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        icon,
        color,
        isFeatured,
        executiveNotes: executiveNotes.trim(),
        refreshSchedule,
        isShared: sharingType !== 'private',
      };

      if (isEditing && editId) {
        await updateTemplate(editId, payload as any);
        toast.success('Report template updated!');
      } else {
        await saveTemplate(payload as any);
        toast.success('Report template created!');
      }

      navigate('/admin/report-builder');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-brand-200">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm font-bold">Loading Report Builder...</p>
        </div>
      </div>
    );
  }

  const canProceed =
    step === 1 ? selectedSource && selectedFields.length > 0 :
    step === 2 ? name.trim().length > 0 :
    step === 3 ? (sharingType !== 'specific_users' || selectedUserIds.length > 0) && (sharingType !== 'by_roles' || selectedRoles.length > 0) :
    true;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-outfit">
      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 border-b border-brand-700/60 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate('/admin/report-builder')}
              className="p-2 rounded-xl text-brand-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white">
                {isEditing ? 'Edit Report Template' : 'Create New Report Template'}
              </h1>
              <p className="text-xs text-brand-300 mt-0.5">
                {isEditing
                  ? 'Modify the configuration, appearance, and sharing settings for this template.'
                  : 'Build a reusable, shareable report preset in 4 simple steps.'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id < step || done) setStep(s.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition cursor-pointer
                      ${active ? 'bg-white/15 text-white' : done ? 'text-brand-300 hover:text-white' : 'text-brand-500'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 transition
                        ${done ? 'bg-emerald-500 border-emerald-400 text-white'
                          : active ? 'bg-white border-white text-brand-900'
                          : 'bg-transparent border-brand-600 text-brand-500'}`}
                    >
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block ${active ? 'text-white' : done ? 'text-brand-300' : 'text-brand-600'}`}>
                      {s.title}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className={`w-4 h-4 shrink-0 ${done ? 'text-emerald-500' : 'text-brand-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ─── Step 1: Dataset & Config ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <SectionCard title="Select Data Source" subtitle="Choose which system dataset this report will query">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((src) => (
                  <button
                    key={src.key}
                    type="button"
                    onClick={() => handleSourceChange(src.key)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer hover:scale-[1.01]
                      ${selectedSource === src.key
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-brand-300'}`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: `${src.color}20` }}>
                      <FileText className="w-5 h-5" style={{ color: src.color }} />
                    </div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">{src.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{src.description}</div>
                    <div className="mt-2 text-[10px] font-bold" style={{ color: src.color }}>{src.fields.length} fields available</div>
                  </button>
                ))}
              </div>
            </SectionCard>

            {activeSource && (
              <>
                {/* Visualization Type */}
                <SectionCard title="Visualization Format" subtitle="How should the data be presented?">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CHART_TYPES.map((ct) => {
                      const Icon = ct.icon;
                      const isActive = chartType === ct.key;
                      return (
                        <button
                          key={ct.key}
                          type="button"
                          onClick={() => setChartType(ct.key)}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer
                            ${isActive
                              ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-500 hover:border-slate-300'}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black">{ct.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                {/* Group By */}
                <SectionCard title="Aggregate & Group By" subtitle="Summarize data by a key dimension">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Group Dimension</label>
                      <select
                        value={selectedGroupBy}
                        onChange={(e) => setSelectedGroupBy(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
                      >
                        <option value="">No Grouping (Show Individual Rows)</option>
                        {activeSource.groupByOptions.map((opt) => {
                          const field = activeSource.fields.find((f) => f.key === opt);
                          return <option key={opt} value={opt}>Group by: {field ? field.label : opt}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </SectionCard>

                {/* Date Filter Presets */}
                {activeSource.filters.some((f) => f.type === 'daterange') && (
                  <SectionCard title="Date Range Filter" subtitle="Optionally limit the data to a specific time period">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['today', 'yesterday', '7d', '30d', 'month'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const df = activeSource.filters.find((f) => f.type === 'daterange');
                            if (df) {
                              const range = applyDatePreset(p);
                              if (range) setFilters((prev) => ({ ...prev, [df.key]: range }));
                            }
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 transition cursor-pointer"
                        >
                          {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : p === 'month' ? 'This Month' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const df = activeSource.filters.find((f) => f.type === 'daterange');
                          if (df) setFilters((prev) => ({ ...prev, [df.key]: null }));
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition cursor-pointer"
                      >
                        Clear Date
                      </button>
                    </div>
                    {activeSource.filters.filter(f => f.type === 'daterange').map((df) => {
                      const val = (filters[df.key] || {}) as { from?: string; to?: string };
                      return (
                        <div key={df.key} className="flex gap-3">
                          <input type="date" value={val.from || ''} onChange={(e) => setFilters(p => ({ ...p, [df.key]: { ...(p[df.key] as object || {}), from: e.target.value } }))}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none" />
                          <input type="date" value={val.to || ''} onChange={(e) => setFilters(p => ({ ...p, [df.key]: { ...(p[df.key] as object || {}), to: e.target.value } }))}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none" />
                        </div>
                      );
                    })}
                  </SectionCard>
                )}

                {/* Column Selection */}
                <SectionCard
                  title="Select Columns"
                  subtitle={`${selectedFields.length} of ${activeSource.fields.length} columns active`}
                  action={
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSelectedFields(activeSource.defaultFields)} className="text-[11px] font-bold text-brand-600 hover:underline cursor-pointer">Recommended</button>
                      <button type="button" onClick={() => setSelectedFields(activeSource.fields.map(f => f.key))} className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer">All</button>
                      <button type="button" onClick={() => setSelectedFields([])} className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer">Clear</button>
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {activeSource.fields.map((f) => {
                      const active = selectedFields.includes(f.key);
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setSelectedFields(prev => active ? prev.filter(k => k !== f.key) : [...prev, f.key])}
                          className={`px-3 py-2 rounded-xl text-xs text-left font-bold transition border cursor-pointer
                            ${active
                              ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-400 dark:border-brand-700 text-brand-900 dark:text-brand-200'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        )}

        {/* ─── Step 2: Appearance ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <SectionCard title="Template Identity" subtitle="Name and describe this report so others understand its purpose">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Template Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Monthly Incident Severity Distribution"
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What insights does this report surface? Who should use it and when?"
                    className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Executive Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={executiveNotes}
                    onChange={(e) => setExecutiveNotes(e.target.value)}
                    placeholder="Notes or guidance for leadership when interpreting this report..."
                    className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SectionCard title="Category" subtitle="Organize this template under a module category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </SectionCard>

              <SectionCard title="Tags" subtitle="Add comma-separated keywords">
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. incident, monthly, severity"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300">
                      <Tag className="inline w-3 h-3 mr-0.5" />{tag}
                    </span>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SectionCard title="Accent Color" subtitle="Color used on template cards">
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-4 transition cursor-pointer ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5" />
                  <span className="text-xs font-mono text-slate-500">{color}</span>
                </div>
              </SectionCard>

              <SectionCard title="Refresh Schedule" subtitle="How often should this report be regenerated?">
                <div className="space-y-2 mt-1">
                  {REFRESH_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRefreshSchedule(opt.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer
                        ${refreshSchedule === opt.key
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshSchedule === opt.key ? 'text-brand-600' : 'text-slate-400'}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Featured Toggle */}
            <SectionCard title="Featured Template" subtitle="Pin this template to the top of the report library">
              <div
                onClick={() => setIsFeatured(!isFeatured)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition cursor-pointer
                  ${isFeatured ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}
              >
                <Star className={`w-6 h-6 transition ${isFeatured ? 'text-amber-500 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {isFeatured ? 'Featured — Pinned to Top' : 'Mark as Featured Template'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Featured templates appear first in the report library and on dashboard quick-access panels.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ─── Step 3: Sharing & Access ─────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <SectionCard title="Sharing Scope" subtitle="Control who can discover and use this report template">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHARING_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = sharingType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSharingType(opt.key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer
                        ${active
                          ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${opt.color}18` }}>
                          <Icon className="w-5 h-5" style={{ color: opt.color }} />
                        </div>
                        {active && <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 ml-auto" />}
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{opt.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Specific Users picker */}
            {sharingType === 'specific_users' && (
              <SectionCard
                title="Select Individuals"
                subtitle={`${selectedUserIds.length} user${selectedUserIds.length !== 1 ? 's' : ''} selected`}
              >
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or role..."
                    className="w-full pl-3 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">No users found</p>
                  ) : filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u._id);
                    return (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => toggleUser(u._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer
                          ${isSelected
                            ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300'}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                          ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {(u.fullname || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">{u.fullname || '—'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
                          {u.accessLevel?.replace(/_/g, ' ')}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {selectedUserIds.length === 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Select at least one user to proceed</span>
                  </div>
                )}
              </SectionCard>
            )}

            {/* By Role picker */}
            {sharingType === 'by_roles' && (
              <SectionCard
                title="Select Access Levels"
                subtitle={`${selectedRoles.length} role${selectedRoles.length !== 1 ? 's' : ''} selected`}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ACCESS_LEVELS.map((role) => {
                    const active = selectedRoles.includes(role.key);
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => toggleRole(role.key)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between gap-2
                          ${active
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                      >
                        <span>{role.label}</span>
                        {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-brand-600" />}
                      </button>
                    );
                  })}
                </div>
                {selectedRoles.length === 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Select at least one access level to proceed</span>
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* ─── Step 4: Review & Save ────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <SectionCard title="Review Your Template" subtitle="Confirm all settings before saving">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReviewRow label="Template Name" value={name || '(unnamed)'} />
                <ReviewRow label="Dataset Source" value={activeSource?.label || selectedSource} />
                <ReviewRow label="Visualization" value={CHART_TYPES.find(c => c.key === chartType)?.label || chartType} />
                <ReviewRow label="Columns Active" value={`${selectedFields.length} of ${activeSource?.fields.length || 0} columns`} />
                <ReviewRow label="Group By" value={selectedGroupBy ? (activeSource?.fields.find(f => f.key === selectedGroupBy)?.label || selectedGroupBy) : 'None'} />
                <ReviewRow label="Category" value={category} />
                <ReviewRow label="Refresh Schedule" value={REFRESH_OPTIONS.find(r => r.key === refreshSchedule)?.label || refreshSchedule} />
                <ReviewRow label="Tags" value={tags.split(',').filter(Boolean).join(', ') || 'None'} />
              </div>
            </SectionCard>

            {/* Sharing Summary Card */}
            <SectionCard title="Sharing Configuration" subtitle="Who will have access to this template?">
              <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
                {(() => {
                  const opt = SHARING_OPTIONS.find(s => s.key === sharingType);
                  const Icon = opt?.icon || Lock;
                  return (
                    <>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${opt?.color || '#64748b'}18` }}>
                        <Icon className="w-5 h-5" style={{ color: opt?.color || '#64748b' }} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{opt?.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt?.desc}</p>
                        {sharingType === 'specific_users' && selectedUserIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {selectedUserIds.map(uid => {
                              const u = shareableUsers.find(u => u._id === uid);
                              return u ? (
                                <span key={uid} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300">
                                  {u.fullname || u.email}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        {sharingType === 'by_roles' && selectedRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {selectedRoles.map(r => (
                              <span key={r} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                                {ACCESS_LEVELS.find(a => a.key === r)?.label || r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </SectionCard>

            {/* Preview Card */}
            <SectionCard title="Card Preview" subtitle="How it will appear in the template library">
              <div className="p-5 rounded-2xl border-2 max-w-sm" style={{ borderColor: color }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <FileText className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-400" />}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                      {CHART_TYPES.find(c => c.key === chartType)?.label}
                    </span>
                  </div>
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">{name || 'Template Name'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{description || activeSource?.description || ''}</p>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{activeSource?.label || selectedSource}</span>
                  <span style={{ color }}>{selectedFields.length} cols</span>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Navigation Footer ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(s => (s - 1) as typeof step) : navigate('/admin/report-builder')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => (s + 1) as typeof step)}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isEditing ? 'Save Changes' : 'Create Template'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, subtitle, children, action }) => (
  <div className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 p-6 shadow-xs space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);

const ReviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-0.5">
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default CreateReportTemplate;
