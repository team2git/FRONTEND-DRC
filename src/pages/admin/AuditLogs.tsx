import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { 
    Search, Database, Clock, User, Server, AlertCircle, 
    CheckCircle2, XCircle, Info, Shield, 
    ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
    _id: string;
    userId: {
        _id: string;
        fullname: string;
        email: string;
    } | null;
    action: string;
    resource: string;
    resourceId?: string;
    before?: any;
    after?: any;
    details?: any;
    timestamp: string;
    ipAddress?: string;
    ip?: string;
    status: 'success' | 'failure' | 'pending';
    severity: 'low' | 'medium' | 'high' | 'critical';
}
const DiamondBackground = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#0A0A0B]" />
        {[...Array(8)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, rotate: 45, x: Math.random() * 100 + "%", y: Math.random() * 100 + "%" }}
                animate={{ opacity: [0.1, 0.3, 0.1], y: ["-10%", "110%"], rotate: [45, 225] }}
                transition={{ duration: 25 + Math.random() * 20, repeat: Infinity, ease: "linear", delay: i * -5 }}
                className="absolute h-96 w-96 rounded-[64px] border border-white/30 bg-white/5 backdrop-blur-3xl dark:border-white/5 dark:bg-white/[0.02]"
                style={{ left: `${(i * 15) % 95}%` }}
            />
        ))}
    </div>
);

const Pagination = ({ total, current, perPage, onPageChange }: { total: number, current: number, perPage: number, onPageChange: (p: number) => void }) => {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-10 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest text-center sm:text-left">
                Showing <span className="text-slate-900 dark:text-white">{(current - 1) * perPage + 1} - {Math.min(current * perPage, total)}</span> of {total} events
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                    disabled={current === 1}
                    onClick={() => onPageChange(current - 1)}
                    className="h-8 px-3 sm:px-4 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-colors"
                >
                    Prev
                </button>
                <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`h-8 w-8 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${current === pageNum ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white dark:hover:bg-white/5 text-slate-400'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button 
                    disabled={current === totalPages}
                    onClick={() => onPageChange(current + 1)}
                    className="h-8 px-3 sm:px-4 rounded-lg border border-slate-200 dark:border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const AuditStats = ({ logs }: { logs: AuditLog[] }) => {
    const successCount = logs.filter(l => l.status === 'success').length;
    const failureCount = logs.filter(l => l.status === 'failure').length;
    const criticalCount = logs.filter(l => l.severity === 'critical').length;
    const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;

    const stats = [
        { label: 'Operational Events', value: logs.length, icon: <Database size={16} />, color: 'blue' },
        { label: 'Integrity Score', value: `${successRate}%`, icon: <CheckCircle2 size={16} />, color: 'emerald' },
        { label: 'System Anomalies', value: failureCount, icon: <AlertCircle size={16} />, color: 'red' },
        { label: 'Critical Escalations', value: criticalCount, icon: <Server size={16} />, color: 'amber' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-0.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                >
                    <div className="relative p-4 md:p-5 flex items-center gap-4">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-600 dark:text-${s.color}-400 shadow-inner group-hover:scale-105 transition-transform duration-500 flex-shrink-0`}>
                            {s.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5 truncate">{s.label}</p>
                            <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tighter">{s.value}</h4>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/audit-logs');
                setLogs(response.data || []);
            } catch (error) {
                console.error('Failed to fetch audit logs', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        const sorted = [...logs].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        return sorted.filter(log => {
            const matchesSearch = 
                (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.resource || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.userId?.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.ipAddress || log.ip || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [logs, searchTerm, statusFilter]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, currentPage]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={12} />;
            case 'failure': return <XCircle className="text-red-500" size={12} />;
            default: return <AlertCircle className="text-amber-500" size={12} />;
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-600 border-red-200';
            case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200';
            case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-200';
            default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
        }
    };

    const getActionStyles = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('add') || a.includes('register') || a.includes('import')) 
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
        if (a.includes('update') || a.includes('edit') || a.includes('patch') || a.includes('sync') || a.includes('modify')) 
            return 'bg-amber-500/10 text-amber-600 border-amber-200';
        if (a.includes('delete') || a.includes('remove') || a.includes('drop') || a.includes('clear')) 
            return 'bg-rose-500/10 text-rose-600 border-rose-200';
        if (a.includes('login') || a.includes('auth') || a.includes('access')) 
            return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
        if (a.includes('export') || a.includes('download')) 
            return 'bg-blue-500/10 text-blue-600 border-blue-200';
        return 'bg-slate-500/10 text-slate-600 border-slate-200';
    };

    const getChangedKeys = (before: any, after: any) => {
        const keys = new Set<string>();
        if (!before || !after) return keys;
        try {
            const b = typeof before === 'string' ? JSON.parse(before) : before;
            const a = typeof after === 'string' ? JSON.parse(after) : after;
            Object.keys({ ...b, ...a }).forEach(k => {
                if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) keys.add(k);
            });
        } catch (e) { }
        return keys;
    };

    const renderDataNode = (label: string, data: any, changedKeys: Set<string>, isAfter: boolean) => {
        const jsonString = data ? JSON.stringify(data, null, 2) : '';
        const lines = jsonString.split('\n');

        return (
            <div className={`flex-1 min-w-[300px] bg-slate-900 rounded-[1.5rem] p-4 border border-white/10 shadow-2xl overflow-hidden`}>
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <h5 className={`text-[9px] font-black uppercase tracking-[0.2em] ${isAfter ? 'text-emerald-400' : 'text-rose-400/80'}`}>
                        {label}
                    </h5>
                    {isAfter && changedKeys.size > 0 && (
                        <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                            {changedKeys.size} DIFFS
                        </div>
                    )}
                </div>
                <div className="font-mono text-[10px] leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {data ? lines.map((line, i) => {
                        let isHighlighted = false;
                        changedKeys.forEach(key => {
                            if (line.includes(`"${key}":`)) isHighlighted = true;
                        });

                        return (
                            <div 
                                key={i} 
                                className={`
                                    whitespace-pre-wrap break-all px-1 py-0.5 rounded-sm transition-colors
                                    ${isHighlighted 
                                        ? (isAfter ? 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-500' : 'bg-red-500/10 text-red-300 border-l-2 border-red-500 opacity-60') 
                                        : 'text-slate-400'
                                    }
                                `}
                            >
                                {line}
                            </div>
                        );
                    }) : (
                        <div className="text-white/10 italic py-10 text-center flex flex-col items-center gap-2">
                            <Database size={24} className="opacity-10" />
                            <span className="text-[8px] font-black uppercase tracking-widest">No Snapshot</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen pb-20 p-4 sm:p-6 lg:p-10 overflow-hidden bg-slate-50 dark:bg-[#0A0A0B]">
            <PageMeta title="Audit Logs | IDRMIS" description="System audit and data history" />
            <PageBreadcrumb pageTitle="Audit Logs" />
            <DiamondBackground />

            <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">
                
                {/* Header Unit */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 md:h-12 md:w-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Shield size={20} />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Audit Logs</h2>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-white/50 tracking-wider">
                            REAL-TIME SYSTEM INTEGRITY AUDIT TRAIL. MONITORING IDENTITY AND DATA LINEAGE.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search action..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 w-full rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 pl-10 pr-4 text-[11px] font-bold shadow-sm focus:outline-none focus:border-blue-500 transition-all backdrop-blur-xl"
                            />
                        </div>
                        <div className="flex bg-white/60 dark:bg-white/5 p-1 rounded-xl border border-white/50 dark:border-white/10 backdrop-blur-xl shadow-sm overflow-x-auto">
                            {['all', 'success', 'failure'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <AuditStats logs={logs} />

                {/* Main Ledger Container */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/20 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
                                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Event Meta</th>
                                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Initiator</th>
                                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Target</th>
                                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 text-center">Status</th>
                                    <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Vector</th>
                                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 text-right">Ledger</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Ledger...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedLogs.map((log) => {
                                        const changedKeys = getChangedKeys(log.before, log.after);
                                        const isExp = expandedLogId === log._id;
                                        return (
                                            <React.Fragment key={log._id}>
                                                <motion.tr
                                                    layout
                                                    className={`transition-colors h-16 ${isExp ? 'bg-blue-50/50 dark:bg-blue-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.01]'}`}
                                                >
                                                    <td className="px-8 py-3">
                                                        <div className="space-y-1.5">
                                                            <div className={`
                                                                inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight
                                                                ${getActionStyles(log.action)}
                                                            `}>
                                                                {log.action}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                                                                <Clock size={10} className="text-blue-500" />
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                                                <User size={14} className="text-slate-400" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[120px]">{log.userId?.fullname || 'SYSTEM UNIT'}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 truncate max-w-[120px]">{log.userId?.email || 'INTERNAL'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[8px] font-black text-slate-600 dark:text-white/60 uppercase tracking-widest">
                                                                {log.resource}
                                                            </span>
                                                            {changedKeys.size > 0 && (
                                                                <span className="flex items-center gap-1 text-[7px] font-black text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 uppercase tracking-tighter">
                                                                    {changedKeys.size} field(s) delta
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${log.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                            {getStatusIcon(log.status)}
                                                            {log.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                                                                <Server size={8} className="text-blue-500" />
                                                                {log.ipAddress || log.ip || '0.0.0.0'}
                                                            </div>
                                                            <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border ${getSeverityStyles(log.severity)}`}>
                                                                {log.severity}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-3 text-right">
                                                        <button
                                                            onClick={() => setExpandedLogId(isExp ? null : log._id)}
                                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isExp ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60'}`}
                                                        >
                                                            {isExp ? 'Close' : 'Diff'}
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                                <AnimatePresence>
                                                    {isExp && (
                                                        <tr>
                                                            <td colSpan={6} className="bg-slate-50/30 dark:bg-black/20 p-6">
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                                    className="space-y-6"
                                                                >
                                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                                        {renderDataNode('Prior State', log.before, changedKeys, false)}
                                                                        <div className="hidden xl:flex items-center justify-center text-slate-200 dark:text-white/5">
                                                                            <ChevronRight size={32} />
                                                                        </div>
                                                                        {renderDataNode('Final State', log.after, changedKeys, true)}
                                                                    </div>
                                                                    
                                                                    {log.details && (
                                                                        <div className="p-4 bg-white dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
                                                                            <h6 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                                                                <Info size={12} className="text-blue-500" /> 
                                                                                Execution Meta
                                                                            </h6>
                                                                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 font-mono text-[9px] text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                                                                {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                                                                            </div>
                                                                        </div>
                                                                    )}
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
                        
                        <Pagination 
                            total={filteredLogs.length} 
                            current={currentPage} 
                            perPage={itemsPerPage} 
                            onPageChange={setCurrentPage} 
                        />

                        {!loading && filteredLogs.length === 0 && (
                            <div className="py-32 text-center flex flex-col items-center gap-3">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                    <Database size={24} className="text-slate-300" />
                                </div>
                                <p className="text-xs font-black text-slate-900 opacity-20 uppercase tracking-widest">No Events Found</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuditLogs;
