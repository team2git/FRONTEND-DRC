import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    MapPin, Users, Plus, Search, RefreshCw, ChevronRight, ChevronLeft,
    BarChart3, FileText, Clock, Edit3, Eye, Upload,
    AlertTriangle, ArrowRightLeft, Map as MapIcon, Activity,
    Filter, ArrowUpDown, X, ShieldAlert, Sparkles, Download,
    SlidersHorizontal, PieChart, Building2, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    getWoredaProfiles, getWoredaProfileStats,
    updateWoredaProfile, importWoredaProfile, bulkImportProfiles,
    syncFromInterview,
    createHouseholdProfile, updateHouseholdProfile, deleteHouseholdProfile,
    deleteWoredaAssessment,
    type WoredaProfile as WProfile,
    type WoredaProfileInput as WProfileInput,
    type WoredaProfileStats
} from '../../api/woredaProfileService';
import { getProfileMappings, type ProfileMapping } from '../../api/profileMappingService';
import { Can } from '../../components/auth/PermissionGuard';

// Modular components and constants
import {
    STATUS_CONFIG,
    getProfileTitle,
    getProfileSubtitle
} from './woreda-profile/constants';
import { ProfileCard } from './woreda-profile/ProfileCard';
import { DetailView } from './woreda-profile/DetailView';
import { FormWizard } from './woreda-profile/FormWizard';
import { ImportModal, SyncInterviewModal } from './woreda-profile/modals';
import { WoredaAssessmentForm } from './WoredaAssessmentForm';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Trash2 } from 'lucide-react';

const WoredaProfile: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [profiles, setProfiles] = useState<WProfile[]>([]);
    const [stats, setStats] = useState<WoredaProfileStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState<'city' | 'subcity' | 'woreda' | 'block' | 'household'>('subcity');
    const [path, setPath] = useState<{ subcity: string | null; woreda: string | null; block: string | null }>({ subcity: null, woreda: null, block: null });
    const [showCityOverview, setShowCityOverview] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showWoredaForm, setShowWoredaForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSync, setShowSync] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showAnalysisCard, setShowAnalysisCard] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Pending Review' | 'Rejected'>('ALL');
    const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
    const [subcityFilter, setSubcityFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'pop_desc' | 'name_asc' | 'date_desc'>('risk_desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (subcityFilter !== 'ALL') count++;
        if (riskFilter !== 'ALL') count++;
        if (statusFilter !== 'ALL') count++;
        if (sortBy !== 'risk_desc') count++;
        return count;
    }, [subcityFilter, riskFilter, statusFilter, sortBy]);

    const searchParams = new URLSearchParams(location.search);
    const initialSyncId = searchParams.get('syncResponseId');
    const initialStatus = searchParams.get('status');

    useEffect(() => {
        if (initialSyncId) {
            setShowSync(true);
        }
        if (initialStatus) {
            setStatusFilter(initialStatus as any);
            setShowCityOverview(false);
            setLevel('household');
        }
    }, [initialSyncId, initialStatus]);

    const [mappings, setMappings] = useState<ProfileMapping[]>([]);
    const [editProfile, setEditProfile] = useState<WProfile | null>(null);
    const [viewProfile, setViewProfile] = useState<WProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);


    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { level };
            if (path.subcity) params.subcity = path.subcity;
            if (path.woreda) params.woreda = path.woreda;
            if (path.block) params.block = path.block;

            const [pList, pStats, mList] = await Promise.all([
                getWoredaProfiles(params),
                getWoredaProfileStats(),
                getProfileMappings()
            ]);
            setProfiles(pList);
            setStats(pStats);
            setMappings(mList);
        } catch {
            toast.error('Failed to load Woreda Profiles');
        } finally {
            setLoading(false);
        }
    }, [path, level]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const subcityOptions = useMemo(() => {
        return Array.from(new Set(profiles.map(p => p.location?.subcity).filter(Boolean))).sort() as string[];
    }, [profiles]);

    const getRiskScore = (p: WProfile) => parseFloat((p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 0).toString());
    const getRiskCategory = (score: number) => score >= 7.0 ? 'HIGH' : score >= 4.0 ? 'MODERATE' : 'LOW';

    const highRiskCount = useMemo(() => profiles.filter(p => getRiskCategory(getRiskScore(p)) === 'HIGH').length, [profiles]);
    const moderateRiskCount = useMemo(() => profiles.filter(p => getRiskCategory(getRiskScore(p)) === 'MODERATE').length, [profiles]);
    const lowRiskCount = useMemo(() => profiles.filter(p => getRiskCategory(getRiskScore(p)) === 'LOW').length, [profiles]);
    const topRiskZone = useMemo(() => profiles.length > 0 ? [...profiles].sort((a, b) => getRiskScore(b) - getRiskScore(a))[0] : null, [profiles]);

    const filtered = useMemo(() => {
        return profiles.filter(p => {
            const title = getProfileTitle(p).toLowerCase();
            const subtitle = getProfileSubtitle(p).toLowerCase();
            const subcityStr = (p.location?.subcity || '').toLowerCase();
            const houseNoStr = (p.location?.house_no || '').toLowerCase();
            const query = search.trim().toLowerCase();

            const matchesSearch = !query || title.includes(query) || subtitle.includes(query) || subcityStr.includes(query) || houseNoStr.includes(query);
            const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
            const matchesSubcity = subcityFilter === 'ALL' || p.location?.subcity === subcityFilter;
            const score = getRiskScore(p);
            const category = getRiskCategory(score);
            const matchesRisk = riskFilter === 'ALL' || category === riskFilter;

            return matchesSearch && matchesStatus && matchesSubcity && matchesRisk;
        }).sort((a, b) => {
            if (sortBy === 'risk_desc') return getRiskScore(b) - getRiskScore(a);
            if (sortBy === 'risk_asc') return getRiskScore(a) - getRiskScore(b);
            if (sortBy === 'pop_desc') {
                const popA = a.demographics?.total_population || a.household_profile?.demographics?.total_household_members || 0;
                const popB = b.demographics?.total_population || b.household_profile?.demographics?.total_household_members || 0;
                return popB - popA;
            }
            if (sortBy === 'name_asc') return getProfileTitle(a).localeCompare(getProfileTitle(b));
            if (sortBy === 'date_desc') return new Date(b.assessment_date || 0).getTime() - new Date(a.assessment_date || 0).getTime();
            return 0;
        });
    }, [profiles, search, statusFilter, subcityFilter, riskFilter, sortBy]);

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setRiskFilter('ALL');
        setSubcityFilter('ALL');
        setSortBy('risk_desc');
    };

    const handleExportReportCSV = () => {
        const rows = filtered.map(p => {
            const score = getRiskScore(p).toFixed(1);
            const category = getRiskCategory(getRiskScore(p));
            const pop = p.demographics?.total_population || p.household_profile?.demographics?.total_household_members || 0;
            return `"${getProfileTitle(p)}","${p.location?.subcity || ''}","${p.location?.woreda || ''}","${score}","${category}","${pop}","${p.status || 'Draft'}"`;
        });
        const csvContent = 'Location,Subcity,Woreda,Risk Score,Risk Category,Population,Status\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `DRM_Executive_Risk_Report_${level}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Executive report CSV generated successfully');
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSave = async (input: WProfileInput) => {
        try {
            setSaving(true);
            const householdPayload = {
                location: input.location,
                assessment_date: input.assessment_date,
                remarks: input.remarks,
                status: input.status,
                identity_location: input.household_profile?.identity_location,
                demographics: input.household_profile?.demographics,
                livelihood_economy: input.household_profile?.livelihood_economy,
                housing_physical_conditions: input.household_profile?.housing_physical_conditions,
                preparedness: input.household_profile?.preparedness,
                recovery_capacity: input.household_profile?.recovery_capacity
            };

            if (editProfile) {
                await updateHouseholdProfile(editProfile._id, householdPayload);
                toast.success('Household survey updated successfully');
            } else {
                await createHouseholdProfile(householdPayload);
                toast.success('Household survey created successfully');
            }
            setShowForm(false);
            setEditProfile(null);
            fetchData();
        } catch {
            toast.error('Failed to save household survey');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this profile?')) return;
        try {
            if (level === 'woreda') {
                await deleteWoredaAssessment(id);
                toast.success('Woreda assessment deleted');
            } else {
                await deleteHouseholdProfile(id);
                toast.success('Household survey deleted');
            }
            fetchData();
        } catch {
            toast.error('Failed to delete profile');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await updateWoredaProfile(id, { status } as any);
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleImport = async (file: File, type: 'woreda' | 'household', parsedData?: any[]) => {
        try {
            setImporting(true);
            if (parsedData && parsedData.length > 0) {
                await bulkImportProfiles(type, parsedData);
                toast.success(`Imported ${parsedData.length} ${type} assessment records successfully`);
            } else {
                await importWoredaProfile(file);
                toast.success('Profiles imported successfully');
            }
            setShowImport(false);
            fetchData();
        } catch (err: any) {
            console.error('Import error:', err);
            toast.error('Import failed. Please verify spreadsheet columns.');
        } finally {
            setImporting(false);
        }
    };

    const handleSync = async (params: any) => {
        try {
            setSaving(true);
            await syncFromInterview(params);
            toast.success('Data synchronized successfully');
            setShowSync(false);
            fetchData();
            // Strip ?syncResponseId= from the URL so the useEffect
            // doesn't re-trigger the sync modal on re-render.
            navigate('/woreda-profile', { replace: true });
        } catch (err: any) {
            console.error('Sync error:', err);
            toast.error(err.response?.data?.message || 'Sync failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-outfit">
            <PageMeta title="DRM Assessment Dashboard" description="Hierarchical disaster risk assessment and spatial aggregation dashboard." />

            <div className="max-w-[1600px] mx-auto p-8 space-y-8">
                {/* Compact Navigation & Action Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/50 rounded-2xl border border-slate-200/60 inline-flex">
                        {/* Sub-Cities crumb — top root level */}
                        <button
                            onClick={() => { setLevel('subcity'); setPath({ subcity: null, woreda: null, block: null }); setShowCityOverview(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'subcity' && !path.subcity ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium'}`}
                        >
                            <Activity size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sub-Cities</span>
                        </button>
                        {/* Selected sub-city crumb */}
                        {path.subcity && (
                            <>
                                <ChevronRight size={14} className="text-slate-300" />
                                <button
                                    onClick={() => { setLevel('woreda'); setPath({ subcity: path.subcity, woreda: null, block: null }); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'woreda' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{path.subcity}</span>
                                </button>
                            </>
                        )}
                        {/* Selected woreda crumb */}
                        {path.woreda && (
                            <>
                                <ChevronRight size={14} className="text-slate-300" />
                                <button
                                    onClick={() => { setLevel('block'); setPath({ subcity: path.subcity, woreda: path.woreda, block: null }); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'block' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Woreda {path.woreda}</span>
                                </button>
                            </>
                        )}
                        {/* Selected block crumb */}
                        {path.block && (
                            <>
                                <ChevronRight size={14} className="text-slate-300" />
                                <button
                                    onClick={() => { setLevel('household'); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all bg-white shadow-sm text-indigo-600 font-bold"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Block {path.block}</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 min-w-max">
                        <button
                            onClick={() => setShowImport(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-[#172358] hover:bg-[#111a42] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-[#172358]/20 cursor-pointer"
                        >
                            <Upload size={16} /> Bulk Excel Import
                        </button>
                        <button
                            onClick={() => navigate('/woreda-profile/map')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group border border-indigo-100 cursor-pointer"
                        >
                            <MapIcon size={16} className="group-hover:scale-110 transition-transform" />
                            Open GIS Map
                        </button>

                        {(level === 'household' || level === 'woreda') && (
                            <>
                                <Can resource="WoredaProfile" action="create">
                                    {level === 'household' && (
                                        <button onClick={() => setShowSync(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-slate-200">
                                            <ArrowRightLeft size={16} /> Sync Protocol
                                        </button>
                                    )}
                                </Can>
                                <Can resource="WoredaProfile" action="create">
                                    <button onClick={() => {
                                        setEditProfile(null);
                                        if (level === 'woreda') {
                                            setShowWoredaForm(true);
                                        } else {
                                            setShowForm(true);
                                        }
                                    }} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
                                        <Plus size={16} /> {level === 'woreda' ? 'New Woreda Assessment' : 'New Household Survey'}
                                    </button>
                                </Can>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Assessments', value: stats?.total || 0, sub: 'All levels', icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
                        { label: 'Residents Protected', value: (stats?.totalPopulation || 0).toLocaleString(), sub: 'Across hierarchy', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Avg Risk Score', value: '4.82', sub: 'City mean', icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
                        { label: 'Sync Efficiency', value: '94.2%', sub: 'Last 7 days', icon: RefreshCw, color: 'bg-amber-50 text-amber-600' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <h4 className="text-2xl font-black text-slate-900">{s.value}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{s.sub}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                <s.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter, Search & Sorting Controls Bar */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 p-5 shadow-lg shadow-slate-200/40 dark:shadow-none transition-all">
                    {/* Main Controls Header Row */}
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        
                        {/* Search Input Bar */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${level} by name, subcity, house #...`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl pl-13 pr-10 py-3.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none shadow-inner"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Action Buttons: Filter Toggle + View Mode Switcher */}
                        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                            
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                                    showFilters || activeFilterCount > 0
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 hover:bg-indigo-700'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                                }`}
                            >
                                <SlidersHorizontal size={16} />
                                <span>Filters</span>

                                {/* Active Filters Badge */}
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-white text-indigo-700 dark:bg-slate-900 dark:text-indigo-400 shadow-sm">
                                        {activeFilterCount}
                                    </span>
                                )}

                                <motion.div
                                    animate={{ rotate: showFilters ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown size={15} />
                                </motion.div>
                            </button>

                            {/* View Mode Switcher */}
                            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    Table
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Collapsible Animated Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    
                                    {/* Subcity Filter */}
                                    {subcityOptions.length > 0 && (
                                        <div className="flex flex-col space-y-1.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Building2 size={12} className="text-indigo-500" /> Subcity
                                            </label>
                                            <select
                                                value={subcityFilter}
                                                onChange={e => setSubcityFilter(e.target.value)}
                                                className="bg-transparent border-none outline-none font-bold cursor-pointer text-xs text-slate-800 dark:text-slate-200 pr-2"
                                            >
                                                <option value="ALL">All Subcities</option>
                                                {subcityOptions.map(sc => (
                                                    <option key={sc} value={sc}>{sc}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Risk Level Filter */}
                                    <div className="flex flex-col space-y-1.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Filter size={12} className="text-rose-500" /> Risk Index Level
                                        </label>
                                        <select
                                            value={riskFilter}
                                            onChange={e => setRiskFilter(e.target.value as any)}
                                            className="bg-transparent border-none outline-none font-bold cursor-pointer text-xs text-slate-800 dark:text-slate-200 pr-2"
                                        >
                                            <option value="ALL">All Risk Levels</option>
                                            <option value="HIGH">High Risk (≥ 7.0)</option>
                                            <option value="MODERATE">Moderate Risk (4 - 6.9)</option>
                                            <option value="LOW">Low Risk (&lt; 4.0)</option>
                                        </select>
                                    </div>

                                    {/* Protocol Status Filter */}
                                    <div className="flex flex-col space-y-1.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <SlidersHorizontal size={12} className="text-amber-500" /> Protocol Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value as any)}
                                            className="bg-transparent border-none outline-none font-bold cursor-pointer text-xs text-slate-800 dark:text-slate-200 pr-2"
                                        >
                                            <option value="ALL">All Statuses</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Pending Review">Pending Review</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Draft">Draft</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>

                                    {/* Sort Order */}
                                    <div className="flex flex-col space-y-1.5 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <ArrowUpDown size={12} className="text-indigo-500" /> Sort Order
                                        </label>
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value as any)}
                                            className="bg-transparent border-none outline-none font-bold cursor-pointer text-xs text-indigo-900 dark:text-indigo-300 pr-2"
                                        >
                                            <option value="risk_desc">Risk: High to Low</option>
                                            <option value="risk_asc">Risk: Low to High</option>
                                            <option value="pop_desc">Population: Highest</option>
                                            <option value="name_asc">Name: A - Z</option>
                                            <option value="date_desc">Latest Assessment</option>
                                        </select>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Filter Tags & Count Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Filters:</span>
                            {search && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/50">
                                    Search: "{search}"
                                    <X size={12} className="cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-100" onClick={() => setSearch('')} />
                                </span>
                            )}
                            {subcityFilter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/50">
                                    Subcity: {subcityFilter}
                                    <X size={12} className="cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-100" onClick={() => setSubcityFilter('ALL')} />
                                </span>
                            )}
                            {riskFilter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] font-bold border border-rose-100 dark:border-rose-900/50">
                                    Risk: {riskFilter}
                                    <X size={12} className="cursor-pointer hover:text-rose-900 dark:hover:text-rose-100" onClick={() => setRiskFilter('ALL')} />
                                </span>
                            )}
                            {statusFilter !== 'ALL' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl text-[11px] font-bold border border-amber-200 dark:border-amber-900/50">
                                    Status: {statusFilter}
                                    <X size={12} className="cursor-pointer hover:text-amber-950 dark:hover:text-amber-100" onClick={() => setStatusFilter('ALL')} />
                                </span>
                            )}
                            {(search || subcityFilter !== 'ALL' || riskFilter !== 'ALL' || statusFilter !== 'ALL') ? (
                                <button
                                    onClick={handleResetFilters}
                                    className="text-[10px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline px-2 py-1 transition-colors cursor-pointer"
                                >
                                    Clear All Filters
                                </button>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs italic">None (showing all data)</span>
                            )}
                        </div>

                        <div className="font-bold text-slate-500 dark:text-slate-400 text-xs">
                            Showing <span className="font-black text-slate-900 dark:text-white">{filtered.length}</span> of {profiles.length} items
                        </div>
                    </div>
                </div>

                {/* Profile Grid */}
                {showCityOverview ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            <ProfileCard
                                key="city-overview"
                                profile={{
                                    _id: 'city-overview',
                                    location: { subcity: 'Addis Ababa', woreda: '', block: '', house_no: '' },
                                    status: 'Reviewed',
                                    aggregation_level: 'city',
                                    assessment_date: new Date().toISOString(),
                                    demographics: { total_population: stats?.totalPopulation || 0, total_households: 0, internally_displaced_population: 0 },
                                    hierarchy_summary: { source_profiles: stats?.total || 0, dr_risk_score: 4.8 },
                                    risk_index: { hazard_index: 0, vulnerability_index: 0, exposure_index: 0, capacity_index: 0, overall_woreda_risk_score: 4.8 }
                                } as any}
                                level="city"
                                onView={() => { setShowCityOverview(false); setLevel('subcity'); }}
                                onDrillDown={() => { setShowCityOverview(false); setLevel('subcity'); }}
                            />
                        </AnimatePresence>
                    </motion.div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium text-sm animate-pulse">Loading profiles…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                            <MapPin size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No profiles found</p>
                        <p className="text-slate-400 text-sm">Create your first Woreda Profile to get started</p>
                        <Can resource="WoredaProfile" action="create">
                            <button onClick={() => {
                                setEditProfile(null);
                                if (level === 'woreda') {
                                    setShowWoredaForm(true);
                                } else {
                                    setShowForm(true);
                                }
                            }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold mt-2">
                                <Plus size={16} /> {level === 'woreda' ? 'Create Woreda Assessment' : 'Create Household Survey'}
                            </button>
                        </Can>
                    </div>
                ) : viewMode === 'grid' ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filtered.map(p => (
                                <ProfileCard key={p._id} profile={p} level={level}
                                    onView={() => setViewProfile(p)}
                                    onDrillDown={level !== 'household' ? () => {
                                        if (level === 'subcity') { setPath({ subcity: p.location.subcity || null, woreda: null, block: null }); setLevel('woreda'); }
                                        else if (level === 'woreda') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: null }); setLevel('block'); }
                                        else if (level === 'block') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: p.location.block && p.location.block !== 'All Blocks' ? p.location.block : 'Unknown' }); setLevel('household'); }
                                    } : undefined}
                                    onAssess={level === 'woreda' ? () => {
                                        setEditProfile({
                                            location: {
                                                subcity: p.location.subcity || '',
                                                woreda: p.location.woreda || ''
                                            }
                                        } as any);
                                        setShowWoredaForm(true);
                                    } : undefined}
                                    onEdit={(level === 'household' || (level === 'woreda' && p.aggregation_level === 'woreda')) ? () => {
                                        setEditProfile(p);
                                        if (level === 'woreda') {
                                            setShowWoredaForm(true);
                                        } else {
                                            setShowForm(true);
                                        }
                                    } : undefined}
                                    onDelete={(level === 'household' || (level === 'woreda' && p.aggregation_level === 'woreda')) ? () => handleDelete(p._id) : undefined} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <DataTable<WProfile>
                        data={filtered}
                        columns={[
                            {
                                key: 'title',
                                header: 'Location Identity',
                                sortable: true,
                                render: (p) => (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-[#172358]/10 text-[#172358] flex items-center justify-center font-mono text-[11px] font-black group-hover:bg-[#172358] group-hover:text-white transition-all shadow-sm">
                                            #{p._id.slice(-4).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-[#172358] transition-colors">{getProfileTitle(p)}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{getProfileSubtitle(p)}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'demographics',
                                header: 'Demographics & Households',
                                sortable: true,
                                render: (p) => (
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900">{(p.demographics?.total_population || 0).toLocaleString()}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Residents</span>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-700">{(p.demographics?.total_households || 0).toLocaleString()}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Households</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'risk_score',
                                header: 'DRM Risk Composite',
                                sortable: true,
                                render: (p) => {
                                    const riskScore = parseFloat((p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 0).toString());
                                    const riskColor = riskScore >= 7.0 ? '#e11d48' : riskScore >= 4.0 ? '#d97706' : '#059669';
                                    return (
                                        <div className="space-y-1.5 w-36">
                                            <div className="flex justify-between items-center text-xs font-black">
                                                <span className="text-slate-900">{riskScore.toFixed(1)} <span className="text-[9px] text-slate-400 font-bold">/ 10</span></span>
                                                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full font-black text-white" style={{ backgroundColor: riskColor }}>
                                                    {riskScore >= 7.0 ? 'High' : riskScore >= 4.0 ? 'Mod' : 'Low'}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((riskScore / 10) * 100, 100)}%`, backgroundColor: riskColor }} />
                                            </div>
                                        </div>
                                    );
                                }
                            },
                            {
                                key: 'status',
                                header: 'Protocol Status',
                                sortable: true,
                                render: (p) => (
                                    <div className="text-center">
                                        <StatusBadge
                                            status={p.status || 'Draft'}
                                            pulse={p.status === 'Submitted'}
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'assessment_date',
                                header: 'Assessment Date',
                                sortable: true,
                                render: (p) => (
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">{new Date(p.assessment_date).toLocaleDateString()}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                            <Clock size={10} /> Verified Date
                                        </span>
                                    </div>
                                )
                            }
                        ]}
                        rowActions={(p) => [
                            {
                                label: 'Inspect Details',
                                icon: <Eye size={14} />,
                                onClick: () => setViewProfile(p)
                            },
                            ...(level !== 'household' ? [{
                                label: 'Explore Sub-Zones',
                                icon: <ChevronRight size={14} />,
                                onClick: () => {
                                    if (level === 'city') { setPath({ subcity: null, woreda: null, block: null }); setLevel('subcity'); }
                                    else if (level === 'subcity') { setPath({ subcity: p.location.subcity || null, woreda: null, block: null }); setLevel('woreda'); }
                                    else if (level === 'woreda') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: p.location.block && p.location.block !== 'All Blocks' ? p.location.block : 'Unknown' }); setLevel('household'); }
                                }
                            }] : []),
                            ...(level === 'woreda' ? [{
                                label: 'Take Assessment',
                                icon: <FileText size={14} />,
                                onClick: () => {
                                    setEditProfile({
                                        location: {
                                            subcity: p.location.subcity || '',
                                            woreda: p.location.woreda || ''
                                        }
                                    } as any);
                                    setShowWoredaForm(true);
                                }
                            }] : []),
                            ...((level === 'household' || (level === 'woreda' && p.aggregation_level === 'woreda')) ? [{
                                label: 'Edit Record',
                                icon: <Edit3 size={14} />,
                                onClick: () => {
                                    setEditProfile(p);
                                    if (level === 'woreda') {
                                        setShowWoredaForm(true);
                                    } else {
                                        setShowForm(true);
                                    }
                                }
                            }, {
                                label: 'Delete Record',
                                icon: <Trash2 size={14} />,
                                danger: true,
                                onClick: () => handleDelete(p._id)
                            }] : [])
                        ]}
                        bulkActions={[
                            {
                                label: 'Export Selected CSV',
                                icon: <FileText size={14} />,
                                action: (selected) => {
                                    const csv = 'ID,Subcity,Woreda,Status\n' + selected.map(s => `${s._id},${s.location.subcity},${s.location.woreda},${s.status}`).join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'selected_profiles.csv';
                                    a.click();
                                }
                            },
                            {
                                label: 'Delete Selected',
                                icon: <Trash2 size={14} />,
                                danger: true,
                                action: (selected) => {
                                    if (window.confirm(`Are you sure you want to delete ${selected.length} records?`)) {
                                        selected.forEach(s => handleDelete(s._id));
                                    }
                                }
                            }
                        ]}
                        onExportCSV={() => {
                            const csv = 'ID,Subcity,Woreda,Population,Status\n' + filtered.map(s => `${s._id},${s.location.subcity},${s.location.woreda},${s.demographics?.total_population || 0},${s.status}`).join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'woreda_profiles.csv';
                            a.click();
                        }}
                        onRefresh={fetchData}
                        onRowClick={(p) => setViewProfile(p)}
                        searchPlaceholder="Search profiles by subcity, woreda, ID, status..."
                    />
                )}

                {/* Executive Report Analysis & Risk Distribution Widget (White Card, Default Closed) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-7 shadow-sm transition-all space-y-4 mt-6">
                    
                    {/* Always-Visible Card Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        {/* Left Side: Top High Vulnerability Zone Summary */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <Sparkles size={16} className="text-amber-500 animate-pulse" />
                                <span className="text-slate-900 dark:text-white font-extrabold">Top High Vulnerability Zone:</span>
                            </div>

                            {topRiskZone ? (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60 text-xs">
                                    <span className="truncate">{getProfileTitle(topRiskZone)} ({getProfileSubtitle(topRiskZone)})</span>
                                    <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                                        Score: {getRiskScore(topRiskZone).toFixed(1)} / 10
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs font-medium text-slate-400 italic">No zones recorded</span>
                            )}
                        </div>

                        {/* Right Side: Toggle Option to Display Full Analysis */}
                        <button
                            onClick={() => setShowAnalysisCard(!showAnalysisCard)}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                showAnalysisCard
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 hover:bg-indigo-700'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <PieChart size={15} />
                            <span>{showAnalysisCard ? 'Hide' : 'Show'}</span>
                            <motion.div animate={{ rotate: showAnalysisCard ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                <ChevronDown size={15} />
                            </motion.div>
                        </button>

                    </div>

                    {/* Collapsible Analysis Details */}
                    <AnimatePresence>
                        {showAnalysisCard && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6"
                            >
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest">
                                            <PieChart size={14} className="text-amber-500" />
                                            Risk Vulnerability Summary & Zone Classification • {(level).toUpperCase()} LEVEL
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-2xl">
                                            Real-time disaster risk profiling across {profiles.length} aggregated location records. Click category pills below to filter high, moderate, or low risk zones.
                                        </p>
                                    </div>

                                    
                                </div>

                                {/* Risk Classification Pills */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => setRiskFilter('ALL')}
                                        className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                                            riskFilter === 'ALL'
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                                        }`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">All Categories</span>
                                        <span className="text-2xl font-black mt-1 block">{profiles.length} <span className="text-xs font-bold opacity-60">zones</span></span>
                                    </button>

                                    <button
                                        onClick={() => setRiskFilter('HIGH')}
                                        className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                                            riskFilter === 'HIGH'
                                                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/70'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider block">High Risk (≥ 7.0)</span>
                                            <AlertTriangle size={14} className="text-rose-500" />
                                        </div>
                                        <span className="text-2xl font-black mt-1 block">{highRiskCount} <span className="text-xs font-bold opacity-75">zones</span></span>
                                    </button>

                                    <button
                                        onClick={() => setRiskFilter('MODERATE')}
                                        className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                                            riskFilter === 'MODERATE'
                                                ? 'bg-amber-500 text-white border-amber-400 shadow-md'
                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950/70'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider block">Moderate Risk (4 - 6.9)</span>
                                            <ShieldAlert size={14} className="text-amber-500" />
                                        </div>
                                        <span className="text-2xl font-black mt-1 block">{moderateRiskCount} <span className="text-xs font-bold opacity-75">zones</span></span>
                                    </button>

                                    <button
                                        onClick={() => setRiskFilter('LOW')}
                                        className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                                            riskFilter === 'LOW'
                                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/70'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider block">Low Risk (&lt; 4.0)</span>
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                        </div>
                                        <span className="text-2xl font-black mt-1 block">{lowRiskCount} <span className="text-xs font-bold opacity-75">zones</span></span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Detail Overlay */}
            <AnimatePresence>
                {viewProfile && (
                    <DetailView profile={viewProfile} onClose={() => setViewProfile(null)} />
                )}
            </AnimatePresence>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <FormWizard initial={editProfile} onSave={handleSave} onClose={() => { setShowForm(false); setEditProfile(null); }} saving={saving} />
                )}
                {showWoredaForm && (
                    <WoredaAssessmentForm initial={editProfile} onClose={() => { setShowWoredaForm(false); setEditProfile(null); }} onSaved={() => { toast.success('Woreda assessment saved successfully'); fetchData(); }} />
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImport && (
                    <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} importing={importing} />
                )}
                {showSync && (
                    <SyncInterviewModal
                        onClose={() => setShowSync(false)}
                        onSync={handleSync}
                        mappings={mappings}
                        syncing={saving}
                        initialResponseId={initialSyncId || undefined}
                    />
                )}

            </AnimatePresence>
        </div>
    );
};

export default WoredaProfile;
