import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
    Search, Shield, User, Activity, Clock, Server, AlertTriangle, Info,
    Database, Trash2, Edit2, Plus, ChevronDown, ChevronUp, Filter,
    RefreshCw, X, Calendar, Eye, LogIn, Lock, Settings, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLog {
    _id: string;
    userId: { _id: string; fullname: string; username: string; email: string; } | null;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    timestamp: string;
    ip?: string;
    severity: 'info' | 'warning' | 'critical';
}

const ACTION_CATEGORIES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    CREATE:  { label: 'Create',  icon: <Plus size={11} />,      color: 'bg-emerald-100 text-emerald-700' },
    UPDATE:  { label: 'Update',  icon: <Edit2 size={11} />,     color: 'bg-blue-100 text-blue-700' },
    DELETE:  { label: 'Delete',  icon: <Trash2 size={11} />,    color: 'bg-rose-100 text-rose-700' },
    LOGIN:   { label: 'Login',   icon: <LogIn size={11} />,     color: 'bg-violet-100 text-violet-700' },
    VIEW:    { label: 'View',    icon: <Eye size={11} />,        color: 'bg-slate-100 text-slate-600' },
    IMPORT:  { label: 'Import',  icon: <FileText size={11} />,  color: 'bg-amber-100 text-amber-700' },
    SYNC:    { label: 'Sync',    icon: <RefreshCw size={11} />, color: 'bg-cyan-100 text-cyan-700' },
    CONFIG:  { label: 'Config',  icon: <Settings size={11} />,  color: 'bg-orange-100 text-orange-700' },
    ACCESS:  { label: 'Access',  icon: <Lock size={11} />,      color: 'bg-indigo-100 text-indigo-700' },
};

const getActionCategory = (action: string) => {
    const upper = action.toUpperCase();
    for (const [key, val] of Object.entries(ACTION_CATEGORIES)) {
        if (upper.includes(key)) return { key, ...val };
    }
    return { key: 'OTHER', label: 'Other', icon: <Activity size={11} />, color: 'bg-slate-100 text-slate-500' };
};

const SEVERITY_STYLES: Record<string, string> = {
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
    warning:  'bg-amber-100 text-amber-700 border-amber-200',
    info:     'bg-slate-100 text-slate-600 border-slate-200',
};

const AdminLogs: React.FC = () => {
    const [logs, setLogs]               = useState<AdminLog[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [expandedId, setExpandedId]   = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [search,       setSearch]       = useState('');
    const [severity,     setSeverity]     = useState('all');
    const [actionCat,    setActionCat]    = useState('all');
    const [resource,     setResource]     = useState('all');
    const [dateFrom,     setDateFrom]     = useState('');
    const [dateTo,       setDateTo]       = useState('');
    const [currentPage,  setCurrentPage]  = useState(1);
    const PER_PAGE = 25;

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/admin-logs');
            setLogs(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Access denied or server error.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    // Derived unique resource list for filter
    const uniqueResources = useMemo(() =>
        Array.from(new Set(logs.map(l => l.resource).filter(Boolean))).sort()
    , [logs]);

    // Advanced filtered list
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return logs.filter(log => {
            // Multi-field search: action, resource, user name/email, ip, resourceId, details JSON
            if (q) {
                const haystack = [
                    log.action, log.resource, log.ip,
                    log.userId?.fullname, log.userId?.email, log.userId?.username,
                    log.resourceId,
                    JSON.stringify(log.details || {})
                ].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            if (severity !== 'all' && log.severity !== severity) return false;
            if (actionCat !== 'all' && !log.action.toUpperCase().includes(actionCat)) return false;
            if (resource !== 'all' && log.resource !== resource) return false;
            if (dateFrom && new Date(log.timestamp) < new Date(dateFrom)) return false;
            if (dateTo   && new Date(log.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
            return true;
        });
    }, [logs, search, severity, actionCat, resource, dateFrom, dateTo]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [search, severity, actionCat, resource, dateFrom, dateTo]);

    const hasActiveFilters = severity !== 'all' || actionCat !== 'all' || resource !== 'all' || dateFrom || dateTo;

    const clearFilters = () => {
        setSeverity('all'); setActionCat('all'); setResource('all');
        setDateFrom(''); setDateTo(''); setSearch('');
    };

    const stats = useMemo(() => ({
        total:    logs.length,
        critical: logs.filter(l => l.severity === 'critical').length,
        warning:  logs.filter(l => l.severity === 'warning').length,
        admins:   new Set(logs.map(l => l.userId?._id).filter(Boolean)).size,
        today:    logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    }), [logs]);

    const inputCls = "h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";

    return (
        <div className="min-h-screen pb-20 px-4 sm:px-6 lg:px-10">
            <PageMeta title="Admin Logs | IDRMIS" description="System administrative activity history" />
            <PageBreadcrumb pageTitle="Admin Logs" />

            <div className="max-w-[1600px] mx-auto space-y-5">

                {/* ── Compact Stats Row ─────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { label: 'Total Actions', value: stats.total,    color: 'text-indigo-700', bg: 'bg-indigo-50',  icon: <Shield size={14} /> },
                        { label: 'Critical',      value: stats.critical, color: 'text-rose-700',   bg: 'bg-rose-50',    icon: <AlertTriangle size={14} /> },
                        { label: 'Warnings',      value: stats.warning,  color: 'text-amber-700',  bg: 'bg-amber-50',   icon: <Info size={14} /> },
                        { label: 'Today',         value: stats.today,    color: 'text-emerald-700',bg: 'bg-emerald-50', icon: <Calendar size={14} /> },
                        { label: 'Unique Users',  value: stats.admins,   color: 'text-slate-700',  bg: 'bg-slate-50',   icon: <User size={14} /> },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 flex items-center gap-3 border border-white shadow-sm`}>
                            <div className={`${s.color} opacity-70`}>{s.icon}</div>
                            <div>
                                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Search + Filter Bar ───────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-3">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by action, user, email, resource, IP, payload..."
                                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Toggle Filters */}
                        <button
                            onClick={() => setShowFilters(f => !f)}
                            className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-xs font-bold transition-all ${showFilters || hasActiveFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={13} />
                            Filters
                            {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-white/30 text-[9px] flex items-center justify-center font-black">!</span>}
                            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {/* Refresh */}
                        <button onClick={fetchLogs} className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all hover:border-indigo-300">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>

                        {/* Count */}
                        <span className="text-xs font-bold text-slate-400 whitespace-nowrap pr-1">
                            {filtered.length} / {logs.length} entries
                        </span>
                    </div>

                    {/* Expanded Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {/* Severity */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Severity</label>
                                        <select value={severity} onChange={e => setSeverity(e.target.value)} className={`${inputCls} w-full`}>
                                            <option value="all">All</option>
                                            <option value="info">Info</option>
                                            <option value="warning">Warning</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>

                                    {/* Action Category */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Action Type</label>
                                        <select value={actionCat} onChange={e => setActionCat(e.target.value)} className={`${inputCls} w-full`}>
                                            <option value="all">All Types</option>
                                            {Object.keys(ACTION_CATEGORIES).map(k => (
                                                <option key={k} value={k}>{ACTION_CATEGORIES[k].label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Resource */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Resource</label>
                                        <select value={resource} onChange={e => setResource(e.target.value)} className={`${inputCls} w-full`}>
                                            <option value="all">All Resources</option>
                                            {uniqueResources.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>

                                    {/* Date From */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">From Date</label>
                                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`${inputCls} w-full`} />
                                    </div>

                                    {/* Date To */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">To Date</label>
                                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`${inputCls} w-full`} />
                                    </div>
                                </div>

                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors">
                                        <X size={12} /> Clear all filters
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Table ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">User</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Resource</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Severity</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">IP / Time</th>
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-rose-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <AlertTriangle size={24} />
                                                    <span className="font-bold text-sm">{error}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <Database size={28} />
                                                    <p className="font-bold text-sm">No logs match your filters</p>
                                                    {hasActiveFilters && (
                                                        <button onClick={clearFilters} className="text-xs text-indigo-600 font-bold hover:underline">Clear filters</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginated.map(log => {
                                        const cat = getActionCategory(log.action);
                                        const isExpanded = expandedId === log._id;
                                        return (
                                            <React.Fragment key={log._id}>
                                                <motion.tr
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`group hover:bg-slate-50/80 transition-colors text-sm ${isExpanded ? 'bg-indigo-50/40' : ''}`}
                                                >
                                                    {/* Action */}
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${cat.color}`}>
                                                                {cat.icon} {cat.label}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]" title={log.action}>
                                                                {log.action.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* User */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                                <User size={12} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{log.userId?.fullname || 'System'}</p>
                                                                <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{log.userId?.email || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Resource */}
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black uppercase text-slate-600 tracking-wide">
                                                            <Database size={10} /> {log.resource}
                                                        </span>
                                                    </td>

                                                    {/* Severity */}
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info}`}>
                                                            {log.severity}
                                                        </span>
                                                    </td>

                                                    {/* IP / Time */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                                                <Server size={10} className="text-slate-300" />
                                                                {log.ip || 'internal'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <Clock size={10} className="text-slate-300" />
                                                                {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Expand */}
                                                    <td className="px-5 py-3 text-right">
                                                        <button
                                                            onClick={() => setExpandedId(isExpanded ? null : log._id)}
                                                            className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white'}`}
                                                        >
                                                            {isExpanded ? <ChevronUp size={12} /> : 'View'}
                                                        </button>
                                                    </td>
                                                </motion.tr>

                                                {/* Expanded Payload */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={6} className="p-0 border-none bg-indigo-50/30">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mx-5 my-3 rounded-2xl bg-slate-950 border border-white/5 overflow-hidden">
                                                                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                                                                                <Activity size={12} className="text-indigo-400" />
                                                                                Action Payload — {log.action}
                                                                            </div>
                                                                            {log.resourceId && (
                                                                                <span className="text-[10px] font-mono text-indigo-400 bg-white/5 px-3 py-1 rounded-full">
                                                                                    REF: {log.resourceId}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <pre className="text-xs font-mono text-indigo-100 leading-relaxed p-5 overflow-x-auto max-h-72">
                                                                            {JSON.stringify(log.details || {}, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ───────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                            <span className="text-xs font-bold text-slate-400">
                                Showing {((currentPage - 1) * PER_PAGE) + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >← Prev</button>
                                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                    let page: number;
                                    if (totalPages <= 7) page = i + 1;
                                    else if (currentPage <= 4) page = i + 1;
                                    else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                                    else page = currentPage - 3 + i;
                                    return (
                                        <button key={page} onClick={() => setCurrentPage(page)}
                                            className={`h-8 w-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg' : 'border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;
