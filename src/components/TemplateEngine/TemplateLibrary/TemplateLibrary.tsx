import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import {
    Search, Filter, Plus, MoreVertical,
    FileText, Clock,
    Edit3, Trash2, History, Download, Upload,
    X, AlertTriangle, Eye, Send, RotateCcw, Trash, LayoutDashboard, Database
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import WordImportModal from './WordImportModal';
import { Can } from '@/components/auth/PermissionGuard';

const PreviewModal: React.FC<{ template: any; onClose: () => void }> = ({ template, onClose }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
                <div className="bg-white px-8 py-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-0.5">{template.category} · v{template.version}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {template.modules.map((mod: any, mIdx: number) => (
                        <div key={mIdx} className="space-y-4">
                            <div className="bg-white rounded-2xl p-6 border-t-4 border-blue-600 shadow-sm">
                                <h3 className="text-2xl font-bold text-gray-900">{mod.title}</h3>
                                {mod.description && <p className="text-sm text-gray-500 mt-2">{mod.description}</p>}
                            </div>

                            {mod.sections.map((sec: any, sIdx: number) => (
                                <div key={sIdx} className="space-y-4">
                                    {sec.title && sec.title !== mod.title && (
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{sec.title}</h4>
                                    )}
                                    {sec.fields.map((field: any, fIdx: number) => (
                                        <div key={fIdx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                            <p className="text-sm font-semibold text-gray-800 mb-4 flex items-start gap-2">
                                                <span className="text-blue-500 font-black">{field.questionCode}</span>
                                                {field.label}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </p>

                                            {field.helpText && <p className="text-xs text-gray-400 mb-4 italic">{field.helpText}</p>}

                                            <div className="space-y-2">
                                                {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && field.options?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {field.options.map((opt: any, oIdx: number) => (
                                                            <div key={oIdx} className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 border border-gray-300 ${field.type === 'checkbox' ? 'rounded-sm' : 'rounded-full'}`} />
                                                                <span className="text-sm text-gray-600">{opt.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : field.type === 'matrix' ? (
                                                    <div className="bg-gray-50 border rounded-xl overflow-hidden overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="bg-gray-100/50">
                                                                    <th className="p-3 border-b text-left">Rows \ Columns</th>
                                                                    {field.matrixConfig?.columns?.map((c: any, ci: number) => (
                                                                        <th key={ci} className="p-3 border-b text-center font-bold">{c.label}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {field.matrixConfig?.rows?.map((r: any, ri: number) => (
                                                                    <tr key={ri} className="border-b last:border-0">
                                                                        <td className="p-3 bg-gray-50/50 font-medium">{r.label}</td>
                                                                        {field.matrixConfig?.columns?.map((_c: any, ci: number) => (
                                                                            <td key={ci} className="p-3 text-center">
                                                                                <div className="w-4 h-4 border border-gray-300 rounded-full mx-auto" />
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-10 border-b border-gray-200 text-sm italic text-gray-300 flex items-center">
                                                        Respondent will enter {field.type} here...
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

// ─── Template Card ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    Published: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    Draft: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    Archived: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const TemplateCard: React.FC<{
    template: any;
    isSurveyMode?: boolean;
    onEdit: (id: string) => void;
    onDelete: (t: any) => void;
    onExport: (id: string, name: string) => void;
    onPreview: (t: any) => void;
    onPublish: (id: string) => void;
    onRestore: (id: string) => void;
    onRevertToDraft: (id: string) => void;
    onPermanentDelete: (id: string) => void;
}> = ({ template, isSurveyMode = false, onEdit, onDelete, onExport, onPreview, onPublish, onRestore, onRevertToDraft, onPermanentDelete }) => {
    const navigate = useNavigate();
    const sc = statusConfig[template.status] || statusConfig.Draft;
    const fields = template.modules?.reduce((acc: number, m: any) =>
        acc + m.sections?.reduce((a: number, s: any) => a + (s.fields?.length || 0), 0), 0) ?? 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group flex flex-col"
        >
            {/* Top color strip */}
            <div className={`h-1.5 w-full ${template.status === 'Published' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : template.status === 'Draft' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-200'}`} />

            <div className="p-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {template.status}
                        </div>
                        {template.status === 'Published' && (
                            <Can resource="FormResponse" action="create">
                                <button
                                    onClick={(e) => { e.stopPropagation(); window.open(`/responses/${template._id}`, '_blank'); }}
                                    className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 group/btn"
                                    title="Start Data Entry"
                                >
                                    <LayoutDashboard size={14} className="group-hover/btn:scale-110 transition-transform" />
                                </button>
                            </Can>
                        )}
                    </div>
                    {!isSurveyMode && template.status !== 'Published' && (
                        <Can resource="Template" action="update">
                            <button
                                onClick={() => onEdit(template._id)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                title="Edit template"
                            >
                                <MoreVertical size={18} />
                            </button>
                        </Can>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{template.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-5 min-h-[40px]">
                    {template.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-3 gap-3 border-t pt-4">
                    <div className="text-center">
                        <p className="text-lg font-black text-gray-800">{template.modules?.length ?? 0}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Modules</p>
                    </div>
                    <div className="text-center border-x border-gray-100">
                        <p className="text-lg font-black text-blue-600">{fields}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Fields</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black text-gray-800">{template.usageCount ?? 0}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Responses</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-3.5 flex justify-between items-center border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium tracking-tight">
                    <Clock size={12} />
                    {new Date(template.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="text-gray-200">·</span>
                    <History size={12} />
                    v{template.version}
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                        <button
                            onClick={() => onPreview(template)}
                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                            title="Preview"
                        >
                            <Eye size={16} />
                        </button>
                        <Can resource="FormResponse" action="view">
                            <button
                                onClick={() => navigate(`/admin/responses/${template._id}`)}
                                className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-cyan-600 transition-all border border-transparent hover:border-cyan-100"
                                title="View Responses Database"
                            >
                                <Database size={16} />
                            </button>
                        </Can>

                        {!isSurveyMode && (template.isDeleted || template.status === 'Archived') && (
                            <>
                                <Can resource="Template" action="update">
                                    <button
                                        onClick={() => onRestore(template._id)}
                                        className="p-2 hover:bg-white rounded-lg text-green-400 hover:text-green-600 transition-all border border-transparent hover:border-green-100"
                                        title="Restore to Draft"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </Can>
                                <Can resource="Template" action="delete">
                                    <button
                                        onClick={() => onPermanentDelete(template._id)}
                                        className="p-2 hover:bg-white rounded-lg text-red-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                        title="Delete Permanently"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </Can>
                            </>
                        )}

                        {!isSurveyMode && !template.isDeleted && template.status !== 'Archived' && (
                            <>
                                <Can resource="Template" action="update">
                                    <button
                                        onClick={() => onExport(template._id, template.name)}
                                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                                        title="Export Template"
                                    >
                                        <Download size={16} />
                                    </button>
                                </Can>
                                {template.status === 'Draft' && (
                                    <Can resource="Template" action="update">
                                        <button
                                            onClick={() => onPublish(template._id)}
                                            className="p-2 hover:bg-white rounded-lg text-amber-400 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                                            title="Publish Now"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </Can>
                                )}
                                {template.status === 'Published' && (
                                    <Can resource="Template" action="update">
                                        <button
                                            onClick={() => onRevertToDraft(template._id)}
                                            className="p-2 hover:bg-white rounded-lg text-amber-400 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                                            title="Unpublish (Restore to Draft)"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </Can>
                                )}
                                {template.status !== 'Published' && (
                                    <Can resource="Template" action="update">
                                        <button
                                            onClick={() => onEdit(template._id)}
                                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                                            title="Edit / Update"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </Can>
                                )}
                                <Can resource="Template" action="delete">
                                    <button
                                        onClick={() => onDelete(template)}
                                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                        title="Archive"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </Can>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Template Library ────────────────────────────────────────────────────
interface TemplateLibraryProps {
    mode?: 'admin' | 'published_only';
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ mode = 'admin' }) => {
    const isSurveyMode = mode === 'published_only';
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(isSurveyMode ? 'Published' : 'All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [previewTarget, setPreviewTarget] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [_isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, [filterStatus]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates', {
                params: {
                    status: filterStatus === 'All' ? undefined : filterStatus
                }
            });
            setTemplates(response.data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (templateId: string, name: string) => {
        try {
            toast.info(`Downloading template structure for ${name}...`);
            const response = await api.get(`/templates/${templateId}`);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `${name.replace(/\s+/g, '_')}_structure.json`);
            dlAnchorElem.click();
        } catch {
            toast.error('Failed to export template');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            toast.info('Publishing template...');
            await api.post(`/templates/${id}/publish`);
            toast.success('Successfully published!');
            fetchTemplates();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to publish');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/templates/${deleteTarget._id}`);
            toast.success(`"${deleteTarget.name}" archived`);
            setDeleteTarget(null);
            fetchTemplates();
        } catch {
            toast.error('Failed to archive template');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await api.post(`/templates/${id}/restore`);
            toast.success('Template restored to Drafts');
            fetchTemplates();
        } catch {
            toast.error('Failed to restore template');
        }
    };

    const handleRevertToDraft = async (id: string) => {
        try {
            toast.info('Reverting to draft...');
            await api.post(`/templates/${id}/revert-to-draft`);
            toast.success('Template can now be edited');
            fetchTemplates();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to revert');
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!window.confirm("Are you sure? This action is permanent and cannot be undone.")) return;
        try {
            await api.delete(`/templates/${id}/permanent`);
            toast.success('Template permanently deleted');
            fetchTemplates();
        } catch {
            toast.error('Failed to delete permanently');
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = false;
        if (filterStatus === 'All') {
            matchesStatus = true;
        } else if (filterStatus === 'Archived') {
            matchesStatus = t.status === 'Archived' || t.isDeleted === true;
        } else {
            matchesStatus = t.status === filterStatus;
        }

        return matchesSearch && matchesStatus;
    });



    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* ── Page Header ── */}
            <header className="flex flex-wrap justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {isSurveyMode ? 'Survey Library' : 'Template Library'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isSurveyMode ? 'Browse and participate in active surveys' : 'Manage and version your national survey instruments'}
                    </p>
                </div>
                {!isSurveyMode && (
                    <div className="flex items-center gap-3">
                        {/* Import from Word */}
                        <Can resource="Template" action="create">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 shadow-sm transition-all"
                            >
                                <Upload size={18} />
                                Import from Word
                            </button>
                        </Can>
                        {/* Create New */}
                        <Can resource="Template" action="create">
                            <button
                                onClick={() => navigate('/admin/form-builder')}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 shadow-xl shadow-blue-200 transition-all"
                            >
                                <Plus size={20} />
                                Create New
                            </button>
                        </Can>
                    </div>
                )}
            </header>

            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Templates', value: templates.length, color: 'bg-white border-gray-100', textColor: 'text-gray-900' },
                    { label: 'Published', value: templates.filter(t => t.status === 'Published').length, color: 'bg-green-50 border-green-100', textColor: 'text-green-700' },
                    { label: 'Drafts', value: templates.filter(t => t.status === 'Draft').length, color: 'bg-amber-50 border-amber-100', textColor: 'text-amber-700' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.color} border rounded-2xl p-5 flex items-center gap-4`}>
                        <p className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
                        <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters Bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                {!isSurveyMode ? (
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-hidden">
                        {['All', 'Draft', 'Published', 'Archived'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Active Survey Instruments</span>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all w-72"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button className="p-2.5 bg-white border rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* ── Grid ── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100"
                >
                    <FileText size={64} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No templates found</h3>
                    <p className="text-gray-400 mt-1 mb-6">Try changing your filters or create a new one</p>
                    {!isSurveyMode && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
                            >
                                <Upload size={16} /> Import from Word
                            </button>
                            <button
                                onClick={() => navigate('/admin/form-builder')}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                            >
                                <Plus size={16} /> Create New
                            </button>
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredTemplates.map((template) => (
                            <TemplateCard
                                key={template._id}
                                template={template}
                                isSurveyMode={isSurveyMode}
                                onEdit={(id) => navigate(`/admin/form-builder/${id}`)}
                                onDelete={(t) => setDeleteTarget(t)}
                                onExport={handleExport}
                                onPreview={(t) => setPreviewTarget(t)}
                                onPublish={handlePublish}
                                onRestore={handleRestore}
                                onRevertToDraft={handleRevertToDraft}
                                onPermanentDelete={handlePermanentDelete}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Preview Modal ── */}
            <AnimatePresence>
                {previewTarget && (
                    <PreviewModal
                        template={previewTarget}
                        onClose={() => setPreviewTarget(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── Word Import Modal ── */}
            <AnimatePresence>
                {showImportModal && (
                    <WordImportModal
                        onClose={() => setShowImportModal(false)}
                        onImported={fetchTemplates}
                    />
                )}
            </AnimatePresence>

            {/* ── Delete Confirmation ── */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                        >
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 text-center">Archive Template?</h3>
                            <p className="text-sm text-gray-500 text-center mt-2">
                                <span className="font-bold text-gray-700">"{deleteTarget.name}"</span> will be archived and hidden from the library.
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-3 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-all"
                                >
                                    Archive
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TemplateLibrary;
