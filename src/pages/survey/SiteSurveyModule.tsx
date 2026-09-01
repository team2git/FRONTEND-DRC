import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { db, LocalSurveyTemplate, LocalSurveyResponse, LocalSyncLog } from '../../offline/db';
import { executeSurveySync, syncAllPendingSurveys } from '../../offline/syncEngine';
import { isOnline, getCachedAuthSession } from '../../offline/offlineAuth';
import { DynamicSurveyForm } from '../../components/survey/DynamicSurveyForm';
import {
    Search,
    Download,
    UploadCloud,
    History,
    FileText,
    Clock,
    X,
    Eye,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    Play,
    Wifi,
    WifiOff
} from 'lucide-react';
import { toast } from 'react-toastify';
import { isPortalFeedbackTemplate } from '../../utils/templateUtils';

// ─── Template Preview Modal (Matching TemplateLibrary) ────────────────────────
const PreviewModal: React.FC<{ template: any; onClose: () => void; onStartSurvey: (t: any) => void }> = ({
    template,
    onClose,
    onStartSurvey
}) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
                <div className="bg-white px-8 py-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-0.5">
                            {template.category || 'General'} · v{template.version}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                onStartSurvey(template);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-200"
                        >
                            <Play size={14} /> Start Survey
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {template.modules?.map((mod: any, mIdx: number) => (
                        <div key={mIdx} className="space-y-4">
                            <div className="bg-white rounded-2xl p-6 border-t-4 border-brand-600 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900">{mod.title}</h3>
                                {mod.description && <p className="text-sm text-gray-500 mt-1">{mod.description}</p>}
                            </div>

                            {mod.sections?.map((sec: any, sIdx: number) => (
                                <div key={sIdx} className="space-y-4">
                                    {sec.title && sec.title !== mod.title && (
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                                            {sec.title}
                                        </h4>
                                    )}
                                    {sec.fields?.map((field: any, fIdx: number) => (
                                        <div key={fIdx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                            <p className="text-sm font-semibold text-gray-800 mb-2 flex items-start gap-2">
                                                {field.questionCode && (
                                                    <span className="text-brand-500 font-black">{field.questionCode}</span>
                                                )}
                                                <span>{field.label}</span>
                                                {field.required && <span className="text-red-500">*</span>}
                                            </p>

                                            {field.helpText && (
                                                <p className="text-xs text-gray-400 mb-3 italic">{field.helpText}</p>
                                            )}

                                            <div className="space-y-2">
                                                {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && field.options?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {field.options.map((opt: any, oIdx: number) => (
                                                            <div key={oIdx} className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 border border-gray-300 ${field.type === 'checkbox' ? 'rounded-sm' : 'rounded-full'}`} />
                                                                <span className="text-sm text-gray-600">{opt.label || opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-9 border-b border-gray-200 text-xs italic text-gray-300 flex items-center">
                                                        Respondent will enter {field.type || 'text'} here...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Offline Template Card (Matching TemplateLibrary TemplateCard) ─────────────
const OfflineTemplateCard: React.FC<{
    template: LocalSurveyTemplate;
    onStartSurvey: (t: LocalSurveyTemplate) => void;
    onPreview: (t: LocalSurveyTemplate) => void;
}> = ({ template, onStartSurvey, onPreview }) => {
    const fieldsCount = template.modules?.reduce((acc: number, m: any) =>
        acc + (m.sections?.reduce((a: number, s: any) => a + (s.fields?.length || 0), 0) || 0), 0) || 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all duration-300 group flex flex-col"
        >
            {/* Top color strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-blue-500" />

            <div className="p-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {template.status || 'Published'}
                        </div>
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                            {template.category || 'Survey'}
                        </span>
                    </div>

                    <button
                        onClick={() => onStartSurvey(template)}
                        className="flex items-center justify-center w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-md shadow-brand-100 group/btn"
                        title="Start Offline Survey"
                    >
                        <Play size={14} className="group-hover/btn:scale-110 transition-transform ml-0.5" />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-brand-600 transition-colors">
                    {template.name}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-5 min-h-[40px]">
                    {template.description || 'Standardized survey instrument ready for offline field data collection.'}
                </p>

                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                    <div className="text-center border-r border-gray-100">
                        <p className="text-lg font-black text-gray-800">{template.modules?.length ?? 0}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Modules</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black text-brand-600">{fieldsCount}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Fields</p>
                    </div>
                </div>
            </div>

            {/* Card Bottom Bar */}
            <div className="bg-gray-50 px-6 py-3.5 flex justify-between items-center border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium tracking-tight">
                    <Clock size={12} />
                    {template.cachedAt ? new Date(template.cachedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Cached'}
                    <span className="text-gray-200">·</span>
                    <History size={12} />
                    v{template.version || 1}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPreview(template)}
                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-brand-600 transition-all border border-transparent hover:border-brand-100 flex items-center gap-1 text-xs font-semibold"
                        title="Preview Template"
                    >
                        <Eye size={15} /> Preview
                    </button>
                    <button
                        onClick={() => onStartSurvey(template)}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <Play size={12} /> Fill Form
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main SiteSurveyModule Component ──────────────────────────────────────────
export const SiteSurveyModule: React.FC = () => {
    const [onlineStatus, setOnlineStatus] = useState<boolean>(isOnline());
    const [templates, setTemplates] = useState<LocalSurveyTemplate[]>([]);
    const [pendingResponses, setPendingResponses] = useState<LocalSurveyResponse[]>([]);
    const [syncLogs, setSyncLogs] = useState<LocalSyncLog[]>([]);

    const [selectedTemplate, setSelectedTemplate] = useState<LocalSurveyTemplate | null>(null);
    const [previewTarget, setPreviewTarget] = useState<LocalSurveyTemplate | null>(null);
    const [editingResponseId, setEditingResponseId] = useState<string | undefined>(undefined);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'templates' | 'pending' | 'history'>('templates');

    // Monitor Network Online/Offline status
    useEffect(() => {
        const handleOnline = async () => {
            setOnlineStatus(true);
            try {
                const count = await db.surveyResponses.where('syncStatus').equals('pending').count();
                if (count > 0) {
                    toast.info(`Network online! ${count} unsynced offline survey(s) ready to synchronize.`, { autoClose: 6000 });
                }
            } catch (e) {
                console.error('Failed to check pending count:', e);
            }
        };

        const handleOffline = () => setOnlineStatus(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        loadLocalData();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load data from IndexedDB
    const loadLocalData = async () => {
        try {
            const tmps = await db.surveyTemplates.toArray();
            const pending = await db.surveyResponses.where('syncStatus').equals('pending').toArray();
            const logs = await db.syncLogs.orderBy('timestamp').reverse().limit(50).toArray();

            // Exclude portal feedback templates from field/offline survey view
            setTemplates(tmps.filter(t => !isPortalFeedbackTemplate(t)));
            setPendingResponses(pending);
            setSyncLogs(logs);
        } catch (err) {
            console.error('Failed to read from IndexedDB:', err);
        }
    };

    // Pre-cache Survey Package from API into IndexedDB
    const handleDownloadPackage = async () => {
        if (!onlineStatus) {
            toast.error('Cannot download package while offline. Please connect to the internet.');
            return;
        }

        const { token } = getCachedAuthSession();
        if (!token) {
            toast.error('Authentication token not found. Please log in first.');
            return;
        }

        setIsDownloading(true);
        setStatusMessage('Downloading published survey templates & offline lookup values...');

        try {
            // 1. Fetch published templates
            const tmplRes = await api.get('/site-survey/templates');
            const tmplData = tmplRes.data;

            if (tmplData.success && Array.isArray(tmplData.data)) {
                await db.surveyTemplates.clear();
                for (const tmpl of tmplData.data) {
                    // Do not cache portal feedback templates into field site survey package
                    if (isPortalFeedbackTemplate(tmpl)) continue;

                    await db.surveyTemplates.add({
                        serverId: tmpl._id,
                        name: tmpl.name,
                        description: tmpl.description,
                        version: tmpl.version || 1,
                        category: tmpl.category,
                        status: tmpl.status,
                        modules: tmpl.modules || [],
                        cachedAt: new Date().toISOString()
                    });
                }
            }

            // 2. Fetch lookups
            const lookupRes = await api.get('/site-survey/lookups');
            const lookupData = lookupRes.data;
            if (lookupData.success && Array.isArray(lookupData.data)) {
                await db.lookupValues.clear();
                await db.lookupValues.bulkAdd(lookupData.data);
            }

            toast.success('Offline templates downloaded & cached successfully!');
            setStatusMessage('Offline survey package cached successfully!');
            await loadLocalData();
        } catch (err: any) {
            console.error('Failed to pre-cache package:', err);
            const errMsg = err.response?.data?.message || err.message || 'Network error';
            toast.error(`Pre-cache failed: ${errMsg}`);
            setStatusMessage(`Pre-cache failed: ${errMsg}`);
        } finally {
            setIsDownloading(false);
        }
    };

    // Trigger Manual Batch Sync
    const handleSyncAll = async () => {
        if (!onlineStatus) {
            toast.error('Cannot sync while offline. Please reconnect to the internet.');
            return;
        }

        setIsSyncing(true);
        setStatusMessage('Synchronizing pending surveys in ordered sequence...');
        try {
            const res = await syncAllPendingSurveys();
            toast.success(`Sync completed: ${res.synced} synced, ${res.failed} failed.`);
            setStatusMessage(`Sync completed: ${res.synced} synced, ${res.failed} failed.`);
            await loadLocalData();
        } catch (err: any) {
            console.error('Sync failed:', err);
            toast.error(`Sync error: ${err.message}`);
            setStatusMessage(`Sync error: ${err.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // Filtered Templates by Search (ensuring portal feedback is excluded)
    const filteredTemplates = useMemo(() => {
        const surveyList = templates.filter(t => !isPortalFeedbackTemplate(t));
        if (!searchQuery.trim()) return surveyList;
        const q = searchQuery.toLowerCase();
        return surveyList.filter(t =>
            t.name.toLowerCase().includes(q) ||
            (t.category && t.category.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
    }, [templates, searchQuery]);

    // Active Render: Dynamic Form View or Dashboard
    if (selectedTemplate) {
        return (
            <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                    >
                        <DynamicSurveyForm
                            template={selectedTemplate}
                            site={null}
                            existingResponseId={editingResponseId}
                            onSaveSuccess={() => {
                                setSelectedTemplate(null);
                                setEditingResponseId(undefined);
                                loadLocalData();
                            }}
                            onCancel={() => {
                                setSelectedTemplate(null);
                                setEditingResponseId(undefined);
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8 bg-gray-50 min-h-screen">
            {/* ── Page Header (Matching TemplateLibrary) ── */}
            <header className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Offline Site Survey
                        </h1>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            onlineStatus 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                            {onlineStatus ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <Wifi size={13} /> Online
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <WifiOff size={13} /> Offline Mode
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-500">
                        Collect and inspect survey instruments offline, then synchronize sequentially upon reconnecting
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadPackage}
                        disabled={isDownloading || !onlineStatus}
                        className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Download size={18} className={isDownloading ? 'animate-bounce' : ''} />
                        {isDownloading ? 'Downloading...' : 'Download Offline Package'}
                    </button>

                    <button
                        onClick={handleSyncAll}
                        disabled={isSyncing || pendingResponses.length === 0 || !onlineStatus}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 transition-all"
                    >
                        <UploadCloud size={18} className={isSyncing ? 'animate-spin' : ''} />
                        Sync Queue ({pendingResponses.length})
                    </button>

                    <button
                        onClick={loadLocalData}
                        title="Refresh Local Cache"
                        className="p-3 bg-white hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 shadow-xs transition-colors"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </header>

            {/* ── Stats Bar (Matching TemplateLibrary) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { 
                        label: 'Cached Templates', 
                        value: templates.length, 
                        color: 'bg-white border-gray-100', 
                        textColor: 'text-gray-900',
                        tab: 'templates' as const
                    },
                    { 
                        label: 'Pending Sync Queue', 
                        value: pendingResponses.length, 
                        color: pendingResponses.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-amber-50/50 border-amber-100', 
                        textColor: 'text-amber-700',
                        tab: 'pending' as const
                    },
                    { 
                        label: 'Sync Log Records', 
                        value: syncLogs.length, 
                        color: 'bg-green-50 border-green-100', 
                        textColor: 'text-green-700',
                        tab: 'history' as const
                    },
                ].map(stat => (
                    <div 
                        key={stat.label} 
                        onClick={() => setActiveTab(stat.tab)}
                        className={`${stat.color} border rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${
                            activeTab === stat.tab ? 'ring-2 ring-brand-500/20' : ''
                        }`}
                    >
                        <div>
                            <p className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
                            <p className="text-sm font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                        </div>
                        <div className="p-3 bg-white/80 rounded-xl shadow-xs text-gray-400">
                            {stat.tab === 'templates' && <FileText size={22} className="text-brand-600" />}
                            {stat.tab === 'pending' && <Clock size={22} className="text-amber-600" />}
                            {stat.tab === 'history' && <History size={22} className="text-emerald-600" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Persistent Unsynced Alert Banner ── */}
            {pendingResponses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md flex flex-col sm:flex-row justify-between items-center gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-white animate-bounce" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-wide">
                                {pendingResponses.length} Offline Survey{pendingResponses.length > 1 ? 's' : ''} Stored Locally
                            </h4>
                            <p className="text-xs text-amber-100 font-medium">
                                Ready to synchronize sequentially to the central database upon connection.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSyncAll}
                        disabled={isSyncing || !onlineStatus}
                        className="px-5 py-2.5 bg-white hover:bg-amber-50 disabled:opacity-50 text-amber-800 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
                    >
                        <UploadCloud size={15} /> {onlineStatus ? 'Sync All Now' : 'Connect to Sync'}
                    </button>
                </motion.div>
            )}

            {statusMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-between">
                    <span>{statusMessage}</span>
                    <button onClick={() => setStatusMessage('')} className="text-blue-400 hover:text-blue-600">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* ── Filters & Search Bar (Matching TemplateLibrary) ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-hidden">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'templates'
                                ? 'bg-brand-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <FileText size={15} />
                        Templates ({templates.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'pending'
                                ? 'bg-brand-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Clock size={15} />
                        Pending Sync ({pendingResponses.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'history'
                                ? 'bg-brand-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <History size={15} />
                        Sync History ({syncLogs.length})
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search cached templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-9 py-2.5 bg-white border rounded-xl outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition-all w-72 text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── View 1: Cached Templates Grid ── */}
            {activeTab === 'templates' && (
                <div>
                    {filteredTemplates.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100"
                        >
                            <FileText size={56} className="mx-auto text-gray-200 mb-3" />
                            <h3 className="text-xl font-bold text-gray-400">No cached templates found</h3>
                            <p className="text-gray-400 text-sm mt-1 mb-5">
                                Connect online and click "Download Offline Package" to fetch published survey templates.
                            </p>
                            <button
                                onClick={handleDownloadPackage}
                                disabled={isDownloading || !onlineStatus}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-md shadow-brand-200"
                            >
                                <Download size={16} /> Download Templates
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredTemplates.map((template) => (
                                    <OfflineTemplateCard
                                        key={template.serverId}
                                        template={template}
                                        onStartSurvey={(t) => {
                                            setSelectedTemplate(t);
                                            setEditingResponseId(undefined);
                                        }}
                                        onPreview={(t) => setPreviewTarget(t)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            )}

            {/* ── View 2: Pending Sync Queue (Matching TemplateLibrary Table Style) ── */}
            {activeTab === 'pending' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 bg-gray-50/70 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Surveys Awaiting Server Sync</h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                Stored locally in Dexie IndexedDB, ready for ordered sequential sync
                            </p>
                        </div>
                        <button
                            onClick={handleSyncAll}
                            disabled={pendingResponses.length === 0 || !onlineStatus}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                            <UploadCloud size={14} /> Sync All ({pendingResponses.length})
                        </button>
                    </div>

                    {pendingResponses.length === 0 ? (
                        <div className="p-16 text-center">
                            <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-2" />
                            <p className="text-base font-bold text-gray-800">All Surveys Synchronized</p>
                            <p className="text-xs text-gray-400 mt-1">There are no pending responses in your offline queue.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pendingResponses.map((resp) => (
                                <div key={resp.localId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-gray-900">{resp.localId}</span>
                                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                Pending Sync
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Template: <span className="font-semibold text-gray-700">{resp.respondentMetadata?.templateName || resp.templateId}</span> · Saved {new Date(resp.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                let tmpl = templates.find(t => t.serverId === resp.templateId || t.name === resp.respondentMetadata?.templateName);
                                                if (!tmpl && templates.length > 0) {
                                                    tmpl = templates[0];
                                                }
                                                if (!tmpl) {
                                                    toast.error('Survey template not found in offline cache. Please download offline package.');
                                                    return;
                                                }
                                                setSelectedTemplate(tmpl);
                                                setEditingResponseId(resp.localId);
                                            }}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                                        >
                                            Edit Form
                                        </button>
                                        <button
                                            onClick={() => executeSurveySync(resp).then(() => loadLocalData())}
                                            disabled={!onlineStatus}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                                        >
                                            <UploadCloud size={14} /> Sync Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── View 3: Sync History Audit Logs ── */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 bg-gray-50/70 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Synchronization History Audit Logs</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Sequential execution history for uploaded surveys</p>
                    </div>

                    {syncLogs.length === 0 ? (
                        <div className="p-16 text-center text-xs text-gray-400 font-bold">
                            No synchronization logs recorded yet on this device.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {syncLogs.map((log, idx) => (
                                <div key={idx} className="p-5 flex items-center justify-between text-xs hover:bg-gray-50/50 transition-colors">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-gray-900">{log.localSurveyId}</span>
                                            {log.serverSurveyId && (
                                                <span className="text-[10px] text-gray-400 font-mono">Server ID: {log.serverSurveyId}</span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                        log.syncStatus === 'synced' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {log.syncStatus}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Preview Modal ── */}
            <AnimatePresence>
                {previewTarget && (
                    <PreviewModal
                        template={previewTarget}
                        onClose={() => setPreviewTarget(null)}
                        onStartSurvey={(t) => {
                            setSelectedTemplate(t);
                            setEditingResponseId(undefined);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SiteSurveyModule;
