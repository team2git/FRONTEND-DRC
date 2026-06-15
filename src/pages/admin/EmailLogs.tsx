import { useState, useEffect } from 'react';
import { 
    Mail, Inbox, Send, Edit3, Trash2, Search, RefreshCw, 
    Plus, AlertCircle, Clock, 
    User, X, CheckCircle, ArrowLeft, MoreVertical
} from 'lucide-react';
import PageMeta from "../../components/common/PageMeta";
import { 
    getEmailLogs, 
    resendEmail, 
    createManualEmail, 
    moveToFolder, 
    EmailLog 
} from '../../api/emailLogService';
import Button from "../../components/ui/button/Button";
import { Modal } from '../../components/ui/modal';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

export default function EmailLogs() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'draft' | 'trash'>('sent');
    const [refresh, setRefresh] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
    
    // Manual Compose State
    const [showCompose, setShowCompose] = useState(false);
    const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [refresh, activeFolder]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getEmailLogs({ 
                folder: activeFolder,
                search: searchTerm || undefined 
            });
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
            toast.error("Failed to lead communication trails");
        } finally {
            setLoading(false);
        }
    };

    const handleComposeAction = async (action: 'send' | 'draft') => {
        if (!composeData.to || !composeData.subject) {
            toast.warning("Recipient and Subject are required");
            return;
        }
        setSending(true);
        try {
            await createManualEmail({ ...composeData, action });
            toast.success(action === 'send' ? "Signal transmitted successfully" : "Draft saved to hub");
            setShowCompose(false);
            setComposeData({ to: '', subject: '', body: '' });
            setRefresh(prev => prev + 1);
        } catch (error) {
            toast.error("Protocol failed");
        } finally {
            setSending(false);
        }
    };

    const handleMoveFolder = async (id: string, folder: string) => {
        try {
            await moveToFolder(id, folder);
            toast.info(`Moved to ${folder}`);
            setLogs(logs.filter(l => l._id !== id));
        } catch (error) {
            toast.error("Move failed");
        }
    };

    const handleResend = async (id: string) => {
        try {
            await resendEmail(id);
            toast.success("Signal re-transmitted");
            setRefresh(prev => prev + 1);
        } catch (error) {
            toast.error("Retry failed");
        }
    };

    const stats = {
        total: logs.length,
        success: logs.filter(l => l.status === 'sent').length,
        pending: logs.filter(l => l.status === 'pending' || l.folder === 'draft').length,
        failed: logs.filter(l => l.status === 'failed').length
    };

    const folders = [
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'sent', label: 'Sent', icon: Send },
        { id: 'draft', label: 'Draft', icon: Edit3 },
        { id: 'trash', label: 'Trash', icon: Trash2 }
    ];

    return (
        <div className="bg-[#F8FAFC] min-h-screen pb-20 px-4 sm:px-6 lg:px-8">
            <PageMeta title="Email Logs | IDRMIS" description="Premium Email Log Management" />
            
            {/* 1. IMMERSIVE HEADER (REPLICATING RESPONSE PAGE) */}
            <header className="py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-indigo-50 text-[9px] sm:text-[10px] font-black text-indigo-600 rounded-lg uppercase tracking-widest border border-indigo-100 truncate">
                                Communication Hub • Version 1
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter truncate">Email Logs</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                         onClick={() => setShowCompose(true)}
                         className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        New Email
                    </button>
                    <button className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
            </header>

            {/* 2. TELEMETRY STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {[
                    { label: 'Total Signals', value: stats.total, icon: Mail, color: 'indigo' },
                    { label: 'Transmitted', value: stats.success, icon: CheckCircle, color: 'emerald' },
                    { label: 'Pending/Draft', value: stats.pending, icon: Clock, color: 'amber' },
                    { label: 'Dropped Signals', value: stats.failed, icon: AlertCircle, color: 'rose' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`h-10 w-10 sm:h-14 sm:w-14 flex-shrink-0 flex items-center justify-center bg-${s.color}-50 rounded-xl sm:rounded-2xl`}>
                            <s.icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${s.color}-500`} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-lg sm:text-2xl font-black text-gray-900 leading-none mb-1">{s.value}</h4>
                            <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest truncate">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. CONTROL BOARD (SEARCH & TABS) */}
            <div className="bg-white p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xl w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input 
                        type="text" 
                        placeholder="Filter by recipient or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-3.5 sm:py-4 bg-gray-50 border-none rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm"
                    />
                </div>
                
                {/* TAB PILLS */}
                <div className="flex bg-gray-50 p-1 rounded-xl sm:rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
                    {folders.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFolder(f.id as any)}
                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeFolder === f.id 
                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. SIGNAL TABLE */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Packet ID</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-8 py-8"><div className="h-4 bg-gray-100 rounded-full w-full" /></td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-[0.2em] opacity-50">
                                    No transmission data recorded in this buffer
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr 
                                    key={log._id} 
                                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1.5 bg-gray-100 text-[10px] font-black text-gray-600 rounded-lg">
                                            #{log._id.substring(log._id.length - 4).toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex items-center justify-center bg-indigo-50 rounded-xl">
                                                <User className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{log.recipient}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{log.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{log.subject}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-[11px] font-bold">
                                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            log.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            log.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {log.status === 'sent' ? 'Verified' : log.status === 'failed' ? 'Dropped' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {log.status === 'failed' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleResend(log._id); }}
                                                    className="h-10 w-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:scale-110 active:scale-95 transition-all"
                                                    title="Re-transmit Signal"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleMoveFolder(log._id, 'trash'); }}
                                                className="h-10 w-10 flex items-center justify-center bg-white text-rose-500 rounded-xl border border-gray-100 hover:bg-rose-50 transition-all"
                                                title="Decommission"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 5. INSPECT MODAL (REFINED FOR NEW THEME) */}
            <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} className="max-w-[700px] w-[95%]">
                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-gray-100 shadow-4xl overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 flex items-center justify-center bg-indigo-50 rounded-2xl">
                                <Mail className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 leading-none">Signal Decryption</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">IDRMIS Security Protocol</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                            <X className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    {selectedLog && (
                        <div className="space-y-8">
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-4">{selectedLog!.subject}</h2>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow-sm">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-black text-gray-700">{selectedLog!.recipient}</span>
                                    <span className="h-1 w-1 rounded-full bg-gray-300 mx-1" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(selectedLog!.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="prose prose-sm max-w-none">
                                    <p className="whitespace-pre-wrap text-gray-600 font-medium leading-relaxed">{selectedLog!.body}</p>
                                </div>
                            </div>

                            {selectedLog!.error && (
                                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Signal Integrity Fault</span>
                                    </div>
                                    <code className="text-[11px] font-mono text-rose-400 font-bold block">{selectedLog!.error}</code>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-8">
                                <Button variant="outline" onClick={() => setSelectedLog(null)} className="rounded-2xl px-8">Dismiss</Button>
                                {selectedLog!.status === 'failed' && (
                                    <Button onClick={() => handleResend(selectedLog!._id)} className="rounded-2xl px-12 shadow-xl shadow-indigo-100">Re-transmit Signal</Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* 6. COMPOSE MODAL */}
            <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} className="max-w-[700px] w-[95%]">
                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-gray-100 shadow-4xl relative">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h4 className="text-3xl font-black text-gray-900 tracking-tighter">New Outreach</h4>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Secure Protocol Initialization</p>
                        </div>
                        <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                            <X className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="relative">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                            <input 
                                type="email" 
                                placeholder="Target Recipient Signal"
                                value={composeData.to}
                                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                                className="w-full pl-16 pr-6 py-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700"
                            />
                        </div>
                        <div className="relative">
                            <Edit3 className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                            <input 
                                type="text" 
                                placeholder="Mission Header / Subject"
                                value={composeData.subject}
                                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                                className="w-full pl-16 pr-6 py-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700"
                            />
                        </div>
                        <textarea 
                            rows={8}
                            placeholder="Message Buffer Payload..."
                            value={composeData.body}
                            onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                            className="w-full p-8 bg-gray-50 border-none rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-700 resize-none h-60 shadow-inner"
                        />

                        <div className="flex items-center justify-end gap-4 pt-6">
                            <button 
                                onClick={() => handleComposeAction('draft')}
                                className="text-xs font-black uppercase text-gray-400 hover:text-indigo-600 tracking-widest transition-colors"
                            >
                                Stage as Draft
                            </button>
                            <Button 
                                onClick={() => handleComposeAction('send')}
                                disabled={sending}
                                className="rounded-[1.5rem] px-16 py-4 shadow-2xl shadow-indigo-100 font-black"
                            >
                                {sending ? 'Transmitting...' : 'Transmit Packet'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
