import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '@/api/axios';
import {
    ArrowLeft, Search, PlusCircle,
    User, Clock, ChevronLeft, ChevronRight,
    Database, Calendar, X,
    FileText, CheckCircle2,
    Eye, Edit3, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import PageMeta from '@/components/common/PageMeta';
import { Can } from '@/components/auth/PermissionGuard';

// --- Sub-component: Detail View Modal ---
const ResponseDetailsModal: React.FC<{
    response: any;
    template: any;
    onClose: () => void
}> = ({ response, template, onClose }) => {
    if (!response || !template) return null;

    const getAnswer = (fieldCode: string) => {
        const answers = response.answers;
        if (!answers) return undefined;
        const val = answers instanceof Map ? answers.get(fieldCode) : answers[fieldCode];
        
        // Handle new structured value { value, answerId }
        if (typeof val === 'object' && val !== null && 'value' in val) {
            return val;
        }
        return { value: val };
    };

    const renderAnswerValue = (field: any) => {
        const { value, answerId } = getAnswer(field.questionCode) || {};
        
        if (value === undefined || value === null || value === '') {
            return <span className="text-gray-300 italic">No response</span>;
        }

        return (
            <div className="space-y-1">
                <div className="text-slate-900 font-medium">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
                {answerId && (
                    <div className="flex items-center gap-1.5 ">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[9px] font-mono text-slate-300 uppercase">UID: {answerId}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl sm:rounded-[40px] w-full max-w-5xl h-full sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
                {/* Header */}
                <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner flex-shrink-0">
                            <FileText className="h-5 w-5 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5 truncate">Assessment Record</p>
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{template.name}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 sm:p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 sm:p-10">
                    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">

                        {/* Profile Summary Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 hover:shadow-lg transition-all">
                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enumerator</p>
                                <div className="flex items-center gap-2 text-slate-900">
                                    <User size={14} className="text-indigo-400" />
                                    <span className="text-sm sm:text-base font-semibold truncate">{response.respondentMetadata?.fullName || 'Anonymous'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission Time</p>
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Calendar size={14} className="text-indigo-400" />
                                    <span className="text-sm sm:text-base font-semibold">{new Date(response.submittedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record Status</p>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className={response.isDraft ? 'text-amber-400' : 'text-emerald-500'} />
                                    <span className={`text-sm sm:text-base font-semibold ${response.isDraft ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {response.isDraft ? 'Draft' : 'Final'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Responses by Module */}
                        <div className="space-y-10">
                            {template.modules?.map((module: any, mIdx: number) => (
                                <section key={module.moduleId} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-900 font-bold text-xs sm:text-sm flex-shrink-0">
                                            {mIdx + 1}
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{module.title}</h3>
                                        <div className="flex-1 h-px bg-slate-200/50" />
                                    </div>

                                    <div className="space-y-8 pl-4 sm:pl-14">
                                        {module.sections?.map((section: any) => (
                                            <div key={section.sectionId} className="space-y-4">
                                                <h4 className="text-xs sm:text-sm font-bold text-indigo-500">{section.title}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                    {section.fields?.map((field: any) => (
                                                        <div key={field.fieldId} className="group border-b border-slate-100 pb-3 transition-colors hover:border-indigo-100">
                                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mb-1.5 transition-colors group-hover:text-indigo-400">{field.label}</p>
                                                            <div className="min-h-[1.5rem]">
                                                                {renderAnswerValue(field)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 sm:p-8 bg-white border-t border-slate-50 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 sm:px-10 py-3.5 sm:py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-100 text-sm"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 sm:px-10 py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 text-sm"
                    >
                        Export PDF
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Page Component ---
const ResponseExplorerPage: React.FC = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SYNCED' | 'UNSYNCED' | 'UPDATED'>('ALL');
    const [selectedResponse, setSelectedResponse] = useState<any>(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [tmplRes, respRes] = await Promise.all([
                    api.get(`/templates/${templateId}`),
                    api.get(`/responses?templateId=${templateId}`)
                ]);
                setTemplate(tmplRes.data);
                setResponses(respRes.data);
            } catch (error: any) {
                toast.error('Failed to load responses');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (templateId) fetchData();
    }, [templateId]);


    const handleSync = (resId: string) => {
        navigator.clipboard.writeText(resId).then(() => {
            toast.success("Response ID copied! Switching to Woreda Profile...");
            setTimeout(() => {
                navigate(`/woreda-profile?syncResponseId=${resId}`);
            }, 1200);
        });
    };

    const filteredResponses = responses.filter(r => {
        const searchText = search.toLowerCase();
        
        // Sync Status Filter
        if (statusFilter !== 'ALL' && r.syncStatus !== statusFilter) return false;

        const matchesBasic = (
            r.respondentMetadata?.fullName?.toLowerCase().includes(searchText) ||
            r._id.toLowerCase().includes(searchText)
        );
        
        // Comprehensive search in all answers
        const matchesAnswers = Object.values(r.answers || {}).some((v: any) => {
            const val = (v?.value ?? v)?.toString() || '';
            return val.toLowerCase().includes(searchText);
        });

        return matchesBasic || matchesAnswers;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
    const paginatedResponses = filteredResponses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 on search/filter
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    const stats = {
        total: responses.length,
        synced: responses.filter(r => r.syncStatus === 'SYNCED').length,
        unsynced: responses.filter(r => r.syncStatus === 'UNSYNCED').length,
        updated: responses.filter(r => r.syncStatus === 'UPDATED').length,
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium font-sans animate-pulse">Synchronizing database...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
            <PageMeta title={`Database | ${template?.name}`} description="Response management" />

            {/* Gradient Header Decorator */}
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none z-0" />

            {/* Top Navigation & Title */}
            <header className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-xl shadow-sm transition-all flex-shrink-0 flex items-center justify-center border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 text-[8px] sm:text-[10px]">
                            <span className="font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">Response Explorer</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Version {template?.version}</span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">{template?.name}</h1>
                    </div>
                </div>

                <div className="w-full lg:w-auto">
                    <Can resource="FormResponse" action="create">
                        <button
                            onClick={() => window.open(`/responses/${templateId}`, '_blank')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-200 transition-all group"
                        >
                            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                            Give Response
                        </button>
                    </Can>
                </div>
            </header>

            <main className="relative z-10 max-w-[1400px] mx-auto px-6 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform flex-shrink-0">
                                <Database size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{stats.total}</h2>
                                <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Captured Logs</p>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-[24px] border border-emerald-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{stats.synced}</h2>
                                <p className="text-emerald-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Synced Records</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-[24px] border border-amber-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform flex-shrink-0">
                                <RefreshCw size={18} className="animate-spin-slow" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{stats.unsynced}</h2>
                                <p className="text-amber-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Pending Action</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-[24px] border border-blue-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0">
                                <Edit3 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{stats.updated}</h2>
                                <p className="text-blue-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Updated Review</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Data List Container */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col">
                    {/* Search & Tool Bar */}
                    <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="relative w-full xl:w-[480px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by ID, Enumerator, or House No..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-14 pr-6 py-3.5 sm:py-4 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-sm sm:text-base text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="flex bg-slate-50 p-1 rounded-xl sm:rounded-2xl border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
                                {[
                                    { label: 'All', value: 'ALL', color: 'bg-white text-slate-900 shadow-sm' },
                                    { label: 'Synced', value: 'SYNCED', color: 'bg-emerald-50 text-emerald-700' },
                                    { label: 'Unsynced', value: 'UNSYNCED', color: 'bg-amber-50 text-amber-700' },
                                    { label: 'Updated', value: 'UPDATED', color: 'bg-blue-50 text-blue-700' },
                                ].map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setStatusFilter(tab.value as any)}
                                        className={`px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${
                                            statusFilter === tab.value 
                                            ? `${tab.color} ring-1 ring-slate-100` 
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-4 border-l border-slate-100 ml-2">
                                {filteredResponses.length} Entries
                            </div>
                        </div>
                    </div>

                    {/* Clean Table / List */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 backdrop-blur-sm">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Record Track ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">House No</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Captured By</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                                    <th className="px-8 py-5 text-right w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 relative">
                                {filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-slate-400 font-bold">No tracking records found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedResponses.map((res: any) => (
                                        <tr
                                            key={res._id}
                                            className={`group transition-all border-l-4 ${
                                                res.syncStatus === 'SYNCED' ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-500' :
                                                res.syncStatus === 'UPDATED' ? 'bg-blue-50/20 hover:bg-blue-50/40 border-blue-500' :
                                                'bg-amber-50/20 hover:bg-amber-50/40 border-amber-500'
                                            }`}
                                        >
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-[10px] font-bold group-hover:scale-110 transition-all ${
                                                        res.syncStatus === 'SYNCED' ? 'bg-emerald-100/50 text-emerald-700' :
                                                        res.syncStatus === 'UPDATED' ? 'bg-blue-100/50 text-blue-700' :
                                                        'bg-amber-100/50 text-amber-700'
                                                    }`}>
                                                        #{res._id.slice(-4).toUpperCase()}
                                                    </div>
                                                    <span className="text-[12px] font-mono text-slate-500 font-semibold cursor-pointer group-hover:text-indigo-600 transition-colors" title="Copy Full ID" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(res._id); toast.success('ID Copied!'); }}>{res._id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800">
                                                        {(() => {
                                                            const houseEntry = Object.entries(res.answers || {}).find(([k]) => k.toLowerCase().includes('house'));
                                                            const val = houseEntry?.[1] as any;
                                                            return val?.value ?? val ?? 'N/A';
                                                        })()}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Premise ID</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                                        res.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-600' :
                                                        res.syncStatus === 'UPDATED' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-amber-100 text-amber-600'
                                                    }`}>
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{res.respondentMetadata?.fullName || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Field User</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                                        {new Date(res.submittedAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                                                        <Clock size={12} />
                                                        {new Date(res.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[10px] font-bold tracking-widest uppercase ${
                                                        res.syncStatus === 'SYNCED' ? 'bg-emerald-100/50 text-emerald-700' :
                                                        res.syncStatus === 'UPDATED' ? 'bg-blue-100/50 text-blue-700' :
                                                        'bg-amber-100/50 text-amber-700'
                                                    }`}>
                                                        <Database size={12} />
                                                        {res.syncStatus}
                                                    </span>
                                                    {res.lastSyncedAt && (
                                                        <span className="text-[9px] text-slate-400 font-bold ml-1 italic">
                                                            Last: {new Date(res.lastSyncedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right relative z-10">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <Can resource="WoredaProfile" action="sync">
                                                        <button 
                                                            onClick={() => handleSync(res._id)}
                                                            title={
                                                                res.syncStatus === 'SYNCED' ? 'Already Synced' : 
                                                                res.syncStatus === 'UPDATED' ? 'Update Required (Data Changed)' : 
                                                                'Sync to Profile'
                                                            }
                                                            className={`w-10 h-10 rounded-2xl border transition-all shadow-sm group/btn flex items-center justify-center ${
                                                                res.syncStatus === 'SYNCED' 
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                                res.syncStatus === 'UPDATED'
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                                                'bg-amber-50 border-amber-200 text-amber-600 animate-pulse-subtle'
                                                            } hover:scale-110`}
                                                        >
                                                            <RefreshCw size={16} className={`${res.syncStatus === 'UNSYNCED' ? 'animate-spin-slow' : ''} group-hover/btn:rotate-180 transition-transform duration-500`} />
                                                        </button>
                                                    </Can>
                                                    <Can resource="FormResponse" action="update">
                                                        <button 
                                                            onClick={() => navigate(`/responses/${templateId}?edit=${res._id}`)}
                                                            title="Edit Survey"
                                                            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 text-slate-400 flex items-center justify-center transition-all shadow-sm"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                    </Can>
                                                    <button 
                                                        onClick={() => setSelectedResponse(res)}
                                                        title="View Record"
                                                        className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md shadow-slate-200"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900 shadow-sm">{currentPage}</span>
                                    <span className="text-xs font-bold text-slate-300">of</span>
                                    <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-xl border transition-all ${
                                        currentPage === 1 
                                        ? 'bg-slate-50 text-slate-300 border-slate-100' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                                    }`}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Simple windowing logic
                                        let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                                        if (pageNum > totalPages) pageNum = totalPages - (Math.min(5, totalPages) - i - 1);
                                        if (pageNum < 1) pageNum = i + 1;
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                    currentPage === pageNum 
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-xl border transition-all ${
                                        currentPage === totalPages 
                                        ? 'bg-slate-50 text-slate-300 border-slate-100' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                                    }`}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Modal Layer */}
            <AnimatePresence>
                {selectedResponse && (
                    <ResponseDetailsModal
                        response={selectedResponse}
                        template={template}
                        onClose={() => setSelectedResponse(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResponseExplorerPage;
