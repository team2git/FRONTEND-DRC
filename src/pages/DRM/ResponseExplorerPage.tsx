import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '@/api/axios';
import {
    ArrowLeft, Search, PlusCircle,
    User, Clock, ChevronLeft, ChevronRight,
    Database, Calendar, X,
    FileText, CheckCircle2,
    Eye, Edit3, RefreshCw, Filter, RotateCcw, MapPin, Home, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import PageMeta from '@/components/common/PageMeta';
import { Can } from '@/components/auth/PermissionGuard';
import { getLocationHierarchy, type LocationHierarchyItem } from '@/api/locationService';

// --- Sub-component: Detail View Modal ---
const ResponseDetailsModal: React.FC<{
    response: any;
    template: any;
    onClose: () => void
}> = ({ response, template, onClose }) => {
    if (!response) return null;
    const activeTemplate = (template && template.modules?.length > 0)
        ? template
        : (response.templateId && typeof response.templateId === 'object' ? response.templateId : template);

    if (!activeTemplate) return null;

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
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-brand-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-600 shadow-inner flex-shrink-0">
                            <FileText className="h-5 w-5 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[11px] font-bold text-brand-600 uppercase tracking-widest mb-0.5 truncate">Assessment Record</p>
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{activeTemplate.name}</h2>
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
                                    <User size={14} className="text-brand-400" />
                                    <span className="text-sm sm:text-base font-semibold truncate">{response.respondentMetadata?.fullName || 'Anonymous'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission Time</p>
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Calendar size={14} className="text-brand-400" />
                                    <span className="text-sm sm:text-base font-semibold">{new Date(response.submittedAt || response.createdAt).toLocaleDateString()}</span>
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
                            {activeTemplate.modules?.map((module: any, mIdx: number) => (
                                <section key={module.moduleId || mIdx} className="space-y-6">
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
                                                <h4 className="text-xs sm:text-sm font-bold text-brand-500">{section.title}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                                    {section.fields?.map((field: any) => (
                                                        <div key={field.fieldId} className="group border-b border-slate-100 pb-3 transition-colors hover:border-brand-100">
                                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mb-1.5 transition-colors group-hover:text-brand-400">{field.label}</p>
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
                        className="px-6 sm:px-10 py-3.5 sm:py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 text-sm"
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

    // Filter Panel States
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [templateFilter, setTemplateFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [subcityFilter, setSubcityFilter] = useState('');
    const [woredaFilter, setWoredaFilter] = useState('');
    const [blockFilter, setBlockFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');

    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchyItem[]>([]);

    useEffect(() => {
        api.get('/templates').then(res => setAvailableTemplates(res.data)).catch(() => {});
        getLocationHierarchy().then(data => setLocationHierarchy(data)).catch(() => {});
    }, []);

    const selectedSubcityObj = locationHierarchy.find(s => s.name.toLowerCase() === subcityFilter.toLowerCase());
    const availableWoredasForFilter = selectedSubcityObj?.woredas || [];

    const activeFilterCount = [
        templateFilter,
        startDate,
        endDate,
        subcityFilter,
        woredaFilter,
        blockFilter,
        houseNoFilter
    ].filter(Boolean).length;

    const resetFilters = () => {
        setTemplateFilter('');
        setStartDate('');
        setEndDate('');
        setSubcityFilter('');
        setWoredaFilter('');
        setBlockFilter('');
        setHouseNoFilter('');
    };

    const getTemplateAbbr = (name?: string): string => {
        if (!name) return 'ASS';
        const clean = name.trim();
        const words = clean.split(/\s+/).filter(w => !['and', 'or', 'of', 'in', 'for', 'the', 'a', 'an', '&'].includes(w.toLowerCase()));
        if (words.length >= 2) {
            return words.map(w => w[0]?.toUpperCase() || '').slice(0, 4).join('');
        }
        return clean.slice(0, 3).toUpperCase();
    };

    const getResponseTemplateInfo = (res: any) => {
        let name = '';
        if (res?.templateId && typeof res.templateId === 'object') {
            name = res.templateId.name || res.templateId.title || '';
        }
        if (!name && res?.templateId) {
            const idStr = typeof res.templateId === 'string' ? res.templateId : res.templateId._id;
            const found = availableTemplates.find(t => t._id === idStr);
            if (found) name = found.name;
        }
        if (!name && template?.name && template.name !== 'All Assessment Responses') {
            name = template.name;
        }
        if (!name) name = 'Assessment Questionnaire';

        const abbr = getTemplateAbbr(name);
        return { name, abbr };
    };

    const getAnswerValue = (answers: any, ...possibleKeys: string[]) => {
        if (!answers) return '';
        const entries = answers instanceof Map ? Array.from(answers.entries()) : Object.entries(answers);

        for (const key of possibleKeys) {
            const lowerKey = key.toLowerCase();
            const found = entries.find(([k]) => k.toLowerCase() === lowerKey || k.toLowerCase().includes(lowerKey));
            if (found) {
                const val = found[1] as any;
                return (val?.value ?? val)?.toString() || '';
            }
        }
        return '';
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const isAll = !templateId || templateId === 'all';
                const [tmplRes, respRes] = await Promise.all([
                    isAll
                        ? Promise.resolve({ data: { name: 'All Assessment Responses', version: 'Global', modules: [] } })
                        : api.get(`/templates/${templateId}`),
                    api.get(`/responses${isAll ? '' : `?templateId=${templateId}`}`)
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

        fetchData();
    }, [templateId]);


    const handleSync = (resId: string) => {
        // Only attempt clipboard write in secure contexts (HTTPS / localhost).
        // On plain HTTP (production server), window.isSecureContext is false and
        // navigator.clipboard.writeText would throw a browser-level console error.
        if (window.isSecureContext && navigator.clipboard) {
            navigator.clipboard.writeText(resId).catch(() => { });
        }
        toast.success("Switching to Woreda Profile...");
        setTimeout(() => {
            navigate(`/woreda-profile?syncResponseId=${resId}`);
        }, 800);
    };

    const filteredResponses = responses.filter(r => {
        const searchText = search.toLowerCase();

        // Sync Status Filter
        if (statusFilter !== 'ALL' && r.syncStatus !== statusFilter) return false;

        // Template Name / ID Filter
        if (templateFilter) {
            const tmplInfo = getResponseTemplateInfo(r);
            const templateIdStr = (typeof r.templateId === 'object' ? r.templateId?._id : r.templateId)?.toString();

            const matchesName = tmplInfo.name.toLowerCase().includes(templateFilter.toLowerCase());
            const matchesId = templateIdStr === templateFilter;
            const matchesAbbr = tmplInfo.abbr.toLowerCase() === templateFilter.toLowerCase();

            if (!matchesName && !matchesId && !matchesAbbr) return false;
        }

        // Date Range Filter
        if (startDate) {
            const rDate = new Date(r.submittedAt || r.createdAt);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (rDate < start) return false;
        }
        if (endDate) {
            const rDate = new Date(r.submittedAt || r.createdAt);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (rDate > end) return false;
        }

        // Subcity Filter
        if (subcityFilter) {
            const val = getAnswerValue(r.answers, 'subcity', 'sub_city', 'subcity_name');
            if (!val.toLowerCase().includes(subcityFilter.toLowerCase())) return false;
        }

        // Woreda Filter
        if (woredaFilter) {
            const val = getAnswerValue(r.answers, 'woreda', 'woreda_name', 'woreda_no');
            if (!val.toLowerCase().includes(woredaFilter.toLowerCase())) return false;
        }

        // Block Filter
        if (blockFilter) {
            const val = getAnswerValue(r.answers, 'block', 'block_no', 'block_number');
            if (!val.toLowerCase().includes(blockFilter.toLowerCase())) return false;
        }

        // House No Filter
        if (houseNoFilter) {
            const val = getAnswerValue(r.answers, 'house', 'house_no', 'house_number', 'houseNo', 'premise');
            if (!val.toLowerCase().includes(houseNoFilter.toLowerCase())) return false;
        }

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
    }, [search, statusFilter, templateFilter, startDate, endDate, subcityFilter, woredaFilter, blockFilter, houseNoFilter]);

    const stats = {
        total: responses.length,
        synced: responses.filter(r => r.syncStatus === 'SYNCED').length,
        unsynced: responses.filter(r => r.syncStatus === 'UNSYNCED').length,
        updated: responses.filter(r => r.syncStatus === 'UPDATED').length,
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium font-sans animate-pulse">Synchronizing database...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
            <PageMeta title={`Database | ${template?.name}`} description="Response management" />

            {/* Gradient Header Decorator */}
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-brand-50/80 to-transparent pointer-events-none z-0" />

            {/* Top Navigation & Title */}
            <header className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl text-slate-400 hover:text-brand-600 hover:shadow-xl shadow-sm transition-all flex-shrink-0 flex items-center justify-center border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 text-[8px] sm:text-[10px]">
                            <span className="font-bold text-brand-600 uppercase tracking-widest bg-brand-100/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">Response Explorer</span>
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
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-brand-200 transition-all group"
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
                            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform flex-shrink-0">
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

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-[24px] border border-brand-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform flex-shrink-0">
                                <Edit3 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{stats.updated}</h2>
                                <p className="text-brand-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Updated Review</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Data List Container */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col">
                    {/* Search & Tool Bar */}
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-1 max-w-xl">
                            {/* Compact Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Enumerator, or House No..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-50/50 transition-all font-medium text-xs text-slate-800 placeholder:text-slate-400 shadow-xs"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Compact Filter Button */}
                            <button
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer flex-shrink-0 shadow-xs ${
                                    showFilterPanel || activeFilterCount > 0
                                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-200'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Filter size={14} />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white text-brand-700 font-black text-[9px] flex items-center justify-center shadow-xs ml-0.5">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            {/* Compact Status Tabs */}
                            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar shadow-inner">
                                {[
                                    { label: 'All', value: 'ALL', count: stats.total, activeColor: 'bg-white text-slate-900 shadow-xs' },
                                    { label: 'Synced', value: 'SYNCED', count: stats.synced, activeColor: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
                                    { label: 'Unsynced', value: 'UNSYNCED', count: stats.unsynced, activeColor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
                                    { label: 'Updated', value: 'UPDATED', count: stats.updated, activeColor: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
                                ].map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setStatusFilter(tab.value as any)}
                                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            statusFilter === tab.value
                                                ? tab.activeColor
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                            statusFilter === tab.value
                                                ? 'bg-slate-200/60 text-slate-900'
                                                : 'bg-slate-200/50 text-slate-500'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="hidden sm:flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-2">
                                {filteredResponses.length} {filteredResponses.length === 1 ? 'Record' : 'Records'}
                            </div>
                        </div>
                    </div>

                    {/* Expandable Filter Panel */}
                    <AnimatePresence>
                        {showFilterPanel && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-indigo-50/40 to-slate-50/90 p-6 sm:p-8"
                            >
                                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200/60">
                                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest">
                                        <Filter size={15} className="text-brand-600" />
                                        <span>Advanced Assessment Filters</span>
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                                        >
                                            <RotateCcw size={12} /> Clear All Filters
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                                    {/* Template Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <FileText size={11} className="text-brand-500" /> Template Name
                                        </label>
                                        <select
                                            value={templateFilter}
                                            onChange={e => setTemplateFilter(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50 shadow-sm cursor-pointer"
                                        >
                                            <option value="">All Templates</option>
                                            {availableTemplates.map(t => (
                                                <option key={t._id} value={t.name}>
                                                    [{getTemplateAbbr(t.name)}] {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Start Date */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={11} className="text-brand-500" /> Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm cursor-pointer"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={11} className="text-brand-500" /> End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm cursor-pointer"
                                        />
                                    </div>

                                    {/* Subcity */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <MapPin size={11} className="text-brand-500" /> Subcity
                                        </label>
                                        <select
                                            value={subcityFilter}
                                            onChange={e => {
                                                setSubcityFilter(e.target.value);
                                                setWoredaFilter('');
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm cursor-pointer"
                                        >
                                            <option value="">All Subcities</option>
                                            {locationHierarchy.map(s => (
                                                <option key={s._id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Woreda */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <MapPin size={11} className="text-brand-500" /> Woreda
                                        </label>
                                        <select
                                            value={woredaFilter}
                                            onChange={e => setWoredaFilter(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">All Woredas</option>
                                            {availableWoredasForFilter.map((w: any) => (
                                                <option key={w._id} value={w.name}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Block */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Layers size={11} className="text-brand-500" /> Block
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Block No..."
                                            value={blockFilter}
                                            onChange={e => setBlockFilter(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm"
                                        />
                                    </div>

                                    {/* House No. */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Home size={11} className="text-brand-500" /> House No.
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="House No..."
                                            value={houseNoFilter}
                                            onChange={e => setHouseNoFilter(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Clean Table / List */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 backdrop-blur-sm">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Template Name (Abbr)</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location / House No.</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Captured By</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                                    <th className="px-6 py-5 text-right w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 relative">
                                {filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-slate-400 font-bold">No tracking records matching criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedResponses.map((res: any) => {
                                        const tmplInfo = getResponseTemplateInfo(res);
                                        return (
                                            <tr
                                                key={res._id}
                                                className={`group transition-all border-l-4 ${res.syncStatus === 'SYNCED' ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-500' :
                                                        res.syncStatus === 'UPDATED' ? 'bg-blue-50/20 hover:bg-blue-50/40 border-blue-500' :
                                                            'bg-amber-50/20 hover:bg-amber-50/40 border-amber-500'
                                                    }`}
                                            >
                                                <td className="px-6 py-5" onClick={() => setSelectedResponse(res)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-black tracking-wider flex items-center justify-center group-hover:scale-105 transition-all shadow-sm flex-shrink-0 ${
                                                            res.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                            res.syncStatus === 'UPDATED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                            'bg-amber-100 text-amber-800 border border-amber-200'
                                                        }`}>
                                                            {tmplInfo.abbr}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-black text-slate-900 truncate max-w-[200px]" title={tmplInfo.name}>
                                                                {tmplInfo.name}
                                                            </span>
                                                            <span
                                                                className="text-[10px] font-mono text-slate-400 font-semibold cursor-pointer hover:text-brand-600 transition-colors"
                                                                title="Click to copy full ID"
                                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(res._id); toast.success('ID Copied!'); }}
                                                            >
                                                                ID: #{res._id.slice(-6).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            <td className="px-6 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-black text-slate-800">
                                                        {getAnswerValue(res.answers, 'subcity', 'sub_city') || 'Addis Ababa'}
                                                        {getAnswerValue(res.answers, 'woreda', 'woreda_name') ? ` · W. ${getAnswerValue(res.answers, 'woreda', 'woreda_name')}` : ''}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-semibold">
                                                        {getAnswerValue(res.answers, 'block', 'block_no') ? `Blk ${getAnswerValue(res.answers, 'block', 'block_no')}` : ''}
                                                        {getAnswerValue(res.answers, 'house', 'house_no', 'house_number') ? ` · House #${getAnswerValue(res.answers, 'house', 'house_no', 'house_number')}` : 'Premise N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${res.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-600' :
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
                                            <td className="px-6 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                                        {new Date(res.submittedAt || res.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                                                        <Clock size={12} />
                                                        {new Date(res.submittedAt || res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5" onClick={() => setSelectedResponse(res)}>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[10px] font-bold tracking-widest uppercase ${res.syncStatus === 'SYNCED' ? 'bg-emerald-100/50 text-emerald-700' :
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
                                            <td className="px-6 py-5 text-right relative z-10">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <Can resource="WoredaProfile" action="sync">
                                                        <button
                                                            onClick={() => handleSync(res._id)}
                                                            title={
                                                                res.syncStatus === 'SYNCED' ? 'Already Synced' :
                                                                    res.syncStatus === 'UPDATED' ? 'Update Required (Data Changed)' :
                                                                        'Sync to Profile'
                                                            }
                                                            className={`w-10 h-10 rounded-2xl border transition-all shadow-sm group/btn flex items-center justify-center ${res.syncStatus === 'SYNCED'
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
                                                        className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-brand-600 text-white flex items-center justify-center transition-all shadow-md shadow-slate-200"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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
                                    className={`p-2 rounded-xl border transition-all ${currentPage === 1
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
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
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
                                    className={`p-2 rounded-xl border transition-all ${currentPage === totalPages
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
