import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    MapPin, Users, Plus, Search, RefreshCw, ChevronRight, ChevronLeft,
    BarChart3, FileText, Clock, Edit3, Eye, Upload,
    AlertTriangle, ArrowRightLeft, Map as MapIcon, Activity
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
    const [level, setLevel] = useState<'city' | 'subcity' | 'woreda' | 'block' | 'household'>('city');
    const [path, setPath] = useState<{ subcity: string | null; woreda: string | null; block: string | null }>({ subcity: null, woreda: null, block: null });
    const [showCityOverview, setShowCityOverview] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showWoredaForm, setShowWoredaForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSync, setShowSync] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Draft' | 'Submitted' | 'Reviewed'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const searchParams = new URLSearchParams(location.search);
    const initialSyncId = searchParams.get('syncResponseId');

    useEffect(() => {
        if (initialSyncId) {
            setShowSync(true);
        }
    }, [initialSyncId]);

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

    const filtered = profiles.filter(p => {
        const matchesSearch = getProfileTitle(p).toLowerCase().includes(search.toLowerCase()) ||
            getProfileSubtitle(p).toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                        {/* City crumb — always resets to top */}
                        <button
                            onClick={() => { setLevel('city'); setPath({ subcity: null, woreda: null, block: null }); setShowCityOverview(true); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'city' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium'}`}
                        >
                            <Activity size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">City</span>
                        </button>
                        {/* Sub-Cities crumb */}
                        {(level === 'subcity' || level === 'woreda' || level === 'block' || level === 'household') && (
                            <>
                                <ChevronRight size={14} className="text-slate-300" />
                                <button
                                    onClick={() => { setLevel('subcity'); setPath({ subcity: null, woreda: null, block: null }); setShowCityOverview(false); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'subcity' && !path.subcity ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sub-Cities</span>
                                </button>
                            </>
                        )}
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

                {/* Filters & View Switches */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-3 shadow-sm flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${level}...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-[2.5rem] pl-16 pr-8 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        />
                    </div>

                    <div className="h-10 w-px bg-slate-100 mx-2" />

                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button onClick={() => setViewMode('grid')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Grid</button>
                        <button onClick={() => setViewMode('table')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Table</button>
                    </div>

                    {level === 'household' && (
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 ml-2">
                            {[
                                { label: 'All', value: 'ALL', color: 'bg-white text-slate-900 border-slate-200' },
                                { label: 'Draft', value: 'Draft', color: 'bg-amber-500 text-white border-transparent' },
                                { label: 'Submitted', value: 'Submitted', color: 'bg-emerald-500 text-white border-transparent' }
                            ].map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value as any)}
                                    className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${statusFilter === tab.value
                                        ? `${tab.color} shadow-sm border ring-1 ring-slate-100`
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <span className="text-xs font-bold text-slate-400 px-2 whitespace-nowrap md:ml-auto">
                        {showCityOverview ? '1 city overview' : `${filtered.length} ${level !== 'household' ? 'aggregated zones' : 'profiles'}`}
                    </span>
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
