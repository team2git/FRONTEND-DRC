import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { db, LocalAssignedSite, LocalSurveyTemplate, LocalSurveyResponse, LocalSyncLog } from '../../offline/db';
import { executeSurveySync, syncAllPendingSurveys } from '../../offline/syncEngine';
import { isOnline, getCachedAuthSession } from '../../offline/offlineAuth';
import { DynamicSurveyForm } from '../../components/survey/DynamicSurveyForm';
import {
    Download,
    MapPin,
    FileText,
    Clock,
    UploadCloud,
    History,
    Plus,
    Building2,
    ArrowRight,
    Search,
    X,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

export const SiteSurveyModule: React.FC = () => {
    const [onlineStatus, setOnlineStatus] = useState<boolean>(isOnline());
    const [assignedSites, setAssignedSites] = useState<LocalAssignedSite[]>([]);
    const [templates, setTemplates] = useState<LocalSurveyTemplate[]>([]);
    const [pendingResponses, setPendingResponses] = useState<LocalSurveyResponse[]>([]);
    const [syncLogs, setSyncLogs] = useState<LocalSyncLog[]>([]);

    const [selectedSite, setSelectedSite] = useState<LocalAssignedSite | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<LocalSurveyTemplate | null>(null);
    const [editingResponseId, setEditingResponseId] = useState<string | undefined>(undefined);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'sites' | 'templates' | 'pending' | 'history'>('sites');

    // Monitor Network Online/Offline status & notify on unsynced offline data
    useEffect(() => {
        const handleOnline = async () => {
            setOnlineStatus(true);
            try {
                const count = await db.surveyResponses.where('syncStatus').equals('pending').count();
                if (count > 0) {
                    toast.info(`Network reconnected! ${count} unsynced offline survey(s) stored locally.`, { autoClose: 7000 });
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
            const sites = await db.assignedSites.toArray();
            const tmps = await db.surveyTemplates.toArray();
            const pending = await db.surveyResponses.where('syncStatus').equals('pending').toArray();
            const logs = await db.syncLogs.orderBy('timestamp').reverse().limit(30).toArray();

            setAssignedSites(sites);
            setTemplates(tmps);
            setPendingResponses(pending);
            setSyncLogs(logs);
        } catch (err) {
            console.error('Failed to read from IndexedDB:', err);
        }
    };

    // Pre-cache Survey Package (Assigned Sites, Templates, Lookups) from API into IndexedDB
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
        setStatusMessage('Downloading assigned sites & published survey templates...');

        try {
            // 1. Fetch assigned sites
            const sitesRes = await api.get('/site-survey/assigned-sites');
            const sitesData = sitesRes.data;

            if (sitesData.success && Array.isArray(sitesData.data)) {
                await db.assignedSites.clear();
                for (const site of sitesData.data) {
                    await db.assignedSites.add({
                        siteCode: site.siteCode,
                        name: site.name,
                        description: site.description,
                        region: site.region,
                        zone: site.zone,
                        woreda: site.woreda,
                        kebele: site.kebele,
                        location: site.location,
                        assignedTemplate: site.assignedTemplate,
                        templateId: site.assignedTemplate?._id || site.assignedTemplate,
                        status: site.status || 'Assigned',
                        priority: site.priority,
                        dueDate: site.dueDate,
                        cachedAt: new Date().toISOString(),
                        serverId: site._id
                    });
                }
            }

            // 2. Fetch templates
            const tmplRes = await api.get('/site-survey/templates');
            const tmplData = tmplRes.data;

            if (tmplData.success && Array.isArray(tmplData.data)) {
                await db.surveyTemplates.clear();
                for (const tmpl of tmplData.data) {
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

            // 3. Fetch lookups
            const lookupRes = await api.get('/site-survey/lookups');
            const lookupData = lookupRes.data;
            if (lookupData.success && Array.isArray(lookupData.data)) {
                await db.lookupValues.clear();
                await db.lookupValues.bulkAdd(lookupData.data);
            }

            toast.success('Offline package downloaded & cached successfully!');
            setStatusMessage('Offline package cached successfully!');
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

    // Open Dynamic Survey for a Site or Template
    const handleStartSurvey = (site: LocalAssignedSite) => {
        let templateObj = templates.find(t => t.serverId === site.templateId || t.name === site.assignedTemplate?.name);
        if (!templateObj && site.assignedTemplate && typeof site.assignedTemplate === 'object') {
            templateObj = {
                serverId: site.assignedTemplate._id,
                name: site.assignedTemplate.name,
                version: site.assignedTemplate.version || 1,
                modules: site.assignedTemplate.modules || [],
                cachedAt: new Date().toISOString(),
                status: 'Published'
            };
        }

        if (!templateObj && templates.length > 0) {
            templateObj = templates[0];
        }

        if (!templateObj) {
            toast.error('No cached survey template found for this site. Please click "Download Offline Package".');
            return;
        }

        setSelectedSite(site);
        setSelectedTemplate(templateObj);
        setEditingResponseId(undefined);
    };

    // Search Filtered Data
    const filteredSites = useMemo(() => {
        if (!searchQuery.trim()) return assignedSites;
        const q = searchQuery.toLowerCase();
        return assignedSites.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.siteCode.toLowerCase().includes(q) ||
            (s.region && s.region.toLowerCase().includes(q)) ||
            (s.woreda && s.woreda.toLowerCase().includes(q))
        );
    }, [assignedSites, searchQuery]);

    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(q) ||
            (t.category && t.category.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
    }, [templates, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 space-y-8">
            {/* Top Page Header - Matching MappingConfig Layout */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-black uppercase tracking-wider">
                            Offline Engine
                        </span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${onlineStatus ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                            <div className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {onlineStatus ? 'ONLINE NETWORK' : 'OFFLINE MODE'}
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-brand-600" /> Offline Site Survey Module
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Pre-cache published templates, inspect sites offline, and synchronize data sequentially upon reconnecting.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleDownloadPackage}
                        disabled={isDownloading || !onlineStatus}
                        className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                        {isDownloading ? 'Caching Package...' : 'Download Offline Package'}
                    </button>

                    <button
                        onClick={handleSyncAll}
                        disabled={isSyncing || pendingResponses.length === 0 || !onlineStatus}
                        className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                    >
                        <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Queue ({pendingResponses.length})
                    </button>
                </div>
            </div>

            {/* KPI Summary Grid - Matching MappingConfig KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-brand-50 rounded-2xl text-brand-600">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Sites</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{assignedSites.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cached Templates</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{templates.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Sync</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingResponses.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
                        <History size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sync Executions</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{syncLogs.length}</h3>
                    </div>
                </div>
            </div>

            {/* Persistent Unsynced Data Alert Banner */}
            {pendingResponses.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 flex flex-col sm:flex-row justify-between items-center gap-4 border border-amber-400"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <AlertCircle className="w-6 h-6 text-white animate-bounce" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-wider">Unsynced Offline Surveys Detected</h4>
                            <p className="text-xs text-amber-100 font-medium mt-0.5">
                                You have <span className="font-bold underline">{pendingResponses.length}</span> offline survey response(s) stored locally on this device.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSyncAll}
                        disabled={isSyncing || !onlineStatus}
                        className="px-6 py-3 bg-white hover:bg-amber-50 disabled:opacity-50 text-amber-800 font-black text-xs rounded-2xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <UploadCloud className="w-4 h-4" /> {onlineStatus ? 'Sync All Now' : 'Connect to Sync'}
                    </button>
                </motion.div>
            )}

            {statusMessage && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center justify-between">
                    <span>{statusMessage}</span>
                    <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
            )}

            {/* Active Render Condition */}
            {selectedTemplate ? (
                /* Dynamic Survey Form View (Unified FormRenderer) */
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <DynamicSurveyForm
                            template={selectedTemplate}
                            site={selectedSite}
                            existingResponseId={editingResponseId}
                            onSaveSuccess={() => {
                                setSelectedTemplate(null);
                                setSelectedSite(null);
                                loadLocalData();
                            }}
                            onCancel={() => {
                                setSelectedTemplate(null);
                                setSelectedSite(null);
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            ) : (
                /* Main Dashboard View */
                <div className="space-y-6">
                    {/* Filter & Search Bar - Matching MappingConfig Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 w-full sm:w-80">
                            <Search size={18} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search sites, codes, or templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-full placeholder:text-slate-400"
                            />
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('sites')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'sites' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <MapPin size={14} /> Assigned Sites ({assignedSites.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('templates')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText size={14} /> Cached Templates ({templates.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Clock size={14} /> Pending Sync ({pendingResponses.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <History size={14} /> Sync History ({syncLogs.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab 1: Assigned Sites Cards Grid (Matching MappingConfig MappingCard Layout) */}
                    {activeTab === 'sites' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSites.length === 0 ? (
                                <div className="col-span-full p-16 bg-white rounded-3xl text-center border border-slate-100">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <MapPin size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">No Assigned Sites Found</h3>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        Click "Download Offline Package" while online to fetch assigned sites to this device.
                                    </p>
                                </div>
                            ) : (
                                filteredSites.map((site) => (
                                    <motion.div
                                        key={site.siteCode}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 flex flex-col overflow-hidden group"
                                    >
                                        <div className={`h-1.5 w-full ${site.status === 'Synced' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />

                                        <div className="p-6 flex-1">
                                            <div className="flex items-start justify-between mb-4">
                                                <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                                                    {site.siteCode}
                                                </span>
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${site.status === 'Synced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${site.status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                    {site.status}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{site.name}</h3>
                                            <p className="text-slate-500 text-xs line-clamp-2 mb-6 font-medium min-h-[32px]">
                                                {site.description || 'Disaster risk and infrastructure site survey'}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-xs">
                                                <div className="text-center border-r border-slate-50">
                                                    <p className="font-bold text-slate-800 truncate">{site.region || 'Addis Ababa'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Region / Location</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-brand-600 truncate">{site.priority || 'Medium'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Priority</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                                            <button
                                                onClick={() => handleStartSurvey(site)}
                                                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
                                            >
                                                Start Dynamic Survey <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab 2: Cached Templates Grid */}
                    {activeTab === 'templates' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.length === 0 ? (
                                <div className="col-span-full p-16 bg-white rounded-3xl text-center border border-slate-100">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <FileText size={28} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">No Cached Templates Found</h3>
                                    <p className="text-xs text-slate-400 mt-1">Download published templates online to inspect sites offline.</p>
                                </div>
                            ) : (
                                filteredTemplates.map((tmpl) => (
                                    <motion.div
                                        key={tmpl.serverId}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden group"
                                    >
                                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

                                        <div className="p-6 flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase">
                                                    v{tmpl.version}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tmpl.category || 'General'}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">{tmpl.name}</h3>
                                            <p className="text-slate-500 text-xs line-clamp-2 mb-6 font-medium min-h-[32px]">
                                                {tmpl.description || 'Form builder template for site inspection'}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                                            <button
                                                onClick={() => {
                                                    setSelectedTemplate(tmpl);
                                                    setSelectedSite(null);
                                                }}
                                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                                            >
                                                Open Template Form <Plus size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab 3: Pending Sync Table */}
                    {activeTab === 'pending' && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Surveys Awaiting Server Sync</h3>
                                    <p className="text-xs text-slate-400 font-medium">Collected offline, ready to synchronize sequentially</p>
                                </div>
                                <button
                                    onClick={handleSyncAll}
                                    disabled={pendingResponses.length === 0 || !onlineStatus}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
                                >
                                    Sync All Now
                                </button>
                            </div>

                            {pendingResponses.length === 0 ? (
                                <div className="p-12 text-center text-xs text-slate-400 font-bold">
                                    No pending survey responses in offline queue.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {pendingResponses.map((resp) => (
                                        <div key={resp.localId} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 font-mono">{resp.localId}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Saved: {new Date(resp.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black">
                                                    Pending Sync
                                                </span>
                                                <button
                                                    onClick={async () => {
                                                        const tmpl = templates.find(t => t.serverId === resp.templateId);
                                                        if (tmpl) setSelectedTemplate(tmpl);
                                                        setEditingResponseId(resp.localId);
                                                    }}
                                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => executeSurveySync(resp).then(() => loadLocalData())}
                                                    disabled={!onlineStatus}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all"
                                                >
                                                    Sync Now
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Sync History Log Table */}
                    {activeTab === 'history' && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-900">Synchronization History Audit Log</h3>
                                <p className="text-xs text-slate-400 font-medium">Sequential execution history for uploaded surveys</p>
                            </div>
                            {syncLogs.length === 0 ? (
                                <div className="p-12 text-center text-xs text-slate-400 font-bold">No sync logs recorded yet.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {syncLogs.map((log, idx) => (
                                        <div key={idx} className="p-6 flex items-center justify-between text-xs">
                                            <div>
                                                <p className="font-bold text-slate-900 font-mono">{log.localSurveyId}</p>
                                                <p className="text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${log.syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                {log.syncStatus.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
