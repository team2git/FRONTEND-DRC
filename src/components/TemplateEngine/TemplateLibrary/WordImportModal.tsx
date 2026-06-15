import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, FileText, AlertCircle,
    Loader2, ChevronDown, ChevronRight, Tag, Layers,
    HelpCircle, List, Hash, AlignLeft, Table2,
    Save, Eye, EyeOff, Sparkles, Cloud
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/api/axios';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ParsedField {
    fieldId: string;
    questionCode: string;
    label: string;
    type: string;
    options?: { label: string; value: string }[];
    matrixConfig?: { rows: any[]; columns: any[] };
    helpText?: string;
    required: boolean;
    systemAutoFill?: string;
}

interface ParsedSection {
    sectionId: string;
    title: string;
    fields: ParsedField[];
}

interface ParsedModule {
    moduleId: string;
    title: string;
    order: number;
    sections: ParsedSection[];
}

interface ParsedTemplate {
    name: string;
    category: string;
    moduleType: string;
    modules: ParsedModule[];
}

// ─── Field type icon helper ───────────────────────────────────────────────────
const FieldTypeIcon: React.FC<{ type: string }> = ({ type }) => {
    const common = 'w-3.5 h-3.5';
    switch (type) {
        case 'radio': case 'checkbox': return <List className={common} />;
        case 'number': return <Hash className={common} />;
        case 'textarea': return <AlignLeft className={common} />;
        case 'matrix': return <Table2 className={common} />;
        case 'note': case 'header': return <Tag className={common} />;
        default: return <HelpCircle className={common} />;
    }
};

const fieldTypeColor: Record<string, string> = {
    radio: 'bg-violet-100 text-violet-700',
    checkbox: 'bg-purple-100 text-purple-700',
    number: 'bg-green-100 text-green-700',
    text: 'bg-blue-100 text-blue-700',
    textarea: 'bg-sky-100 text-sky-700',
    matrix: 'bg-orange-100 text-orange-700',
    date: 'bg-teal-100 text-teal-700',
    note: 'bg-amber-100 text-amber-700',
    header: 'bg-gray-100 text-gray-600',
    select: 'bg-indigo-100 text-indigo-700',
};

// ─── Module Preview Accordion ─────────────────────────────────────────────────
const ModulePreview: React.FC<{ module: ParsedModule; idx: number }> = ({ module, idx }) => {
    const [open, setOpen] = useState(idx === 0);
    const allFields = module.sections.flatMap(s => s.fields);

    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                        {idx + 1}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[280px]">{module.title || 'Untitled Module'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{allFields.length} fields · {module.sections.length} section{module.sections.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {module.sections.map((section) => (
                                <div key={section.sectionId}>
                                    {section.title && section.title !== 'General' && (
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{section.title}</p>
                                    )}
                                    <div className="space-y-1.5">
                                        {section.fields.map((field) => (
                                            <div
                                                key={field.fieldId}
                                                className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl"
                                            >
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 mt-0.5 ${fieldTypeColor[field.type] || 'bg-gray-100 text-gray-600'}`}>
                                                    <FieldTypeIcon type={field.type} />
                                                    {field.type}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                                        <span className="text-blue-500 font-black mr-1">{field.questionCode}</span>
                                                        {field.label}
                                                    </p>
                                                    {field.systemAutoFill && field.systemAutoFill !== 'none' && (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-tighter">
                                                                <Cloud size={8} className="mr-0.5" />
                                                                System Auto-filled
                                                            </span>
                                                        </div>
                                                    )}
                                                    {field.options && field.options.length > 0 && (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {field.options.slice(0, 3).map(o => o.label).join(' · ')}
                                                            {field.options.length > 3 && ` +${field.options.length - 3} more`}
                                                        </p>
                                                    )}
                                                    {field.matrixConfig && (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {field.matrixConfig.rows.length} rows × {field.matrixConfig.columns.length} cols
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface WordImportModalProps {
    onClose: () => void;
    onImported: () => void;
}

type Step = 'upload' | 'analysis' | 'preview' | 'saving';

const CATEGORIES = ['Household', 'Woreda', 'Shock', 'Finance', 'Assessment', 'Other'];
const MODULE_TYPES = ['HHQ', 'WRP', 'SAP', 'DRA', 'CRA', 'EA', 'VOL', 'AW', 'INS', 'Other'];

const WordImportModal: React.FC<WordImportModalProps> = ({ onClose, onImported }) => {
    const [step, setStep] = useState<Step>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [parsedTemplate, setParsedTemplate] = useState<ParsedTemplate | null>(null);
    const [showFullPreview, setShowFullPreview] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields
    const [templateName, setTemplateName] = useState('');
    const [category, setCategory] = useState('Household');
    const [moduleType, setModuleType] = useState('HHQ');
    const [description, setDescription] = useState('');
    const [saveMode, setSaveMode] = useState<'Draft' | 'Published'>('Draft');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Upload & Parse ──────────────────────────────────────────────────────
    const processFile = useCallback(async (file: File) => {
        if (!file.name.match(/\.(docx)$/i)) {
            toast.error('Please upload a .docx Word file');
            return;
        }

        setIsParsing(true);
        setParseError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            formData.append('moduleType', moduleType);

            const res = await api.post('/templates/import-word', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data: ParsedTemplate = res.data;
            setParsedTemplate(data);
            setTemplateName(data.name || file.name.replace(/\.docx$/i, ''));
            setCategory(data.category || 'Household');
            setModuleType(data.moduleType || 'HHQ');

            // Move to analysis first
            setStep('analysis');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || 'Failed to parse Word document';
            setParseError(msg);
            toast.error(msg);
        } finally {
            setIsParsing(false);
        }
    }, [category, moduleType]);

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    // ── Save Template ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!parsedTemplate) return;
        if (!templateName.trim()) { toast.error('Please enter a template name'); return; }

        setIsSaving(true);
        setStep('saving');

        try {
            // Build the payload matching the backend Template model
            const payload = {
                name: templateName.trim(),
                description: description.trim(),
                category,
                moduleType,
                status: saveMode,
                modules: parsedTemplate.modules.map((mod, mIdx) => ({
                    moduleId: mod.moduleId,
                    title: mod.title,
                    order: mIdx,
                    sections: mod.sections.map(sec => ({
                        sectionId: sec.sectionId,
                        title: sec.title,
                        description: '',
                        fields: sec.fields.map(f => ({
                            fieldId: f.fieldId,
                            questionCode: f.questionCode,
                            label: f.label,
                            type: f.type,
                            helpText: f.helpText || '',
                            required: f.required || false,
                            options: f.options || [],
                            matrixConfig: f.matrixConfig,
                            systemAutoFill: (f as any).systemAutoFill || 'none',
                            validation: {},
                            permissions: { visibleToRoles: [], editableByRoles: [] }
                        }))
                    }))
                }))
            };

            await api.post('/templates', payload);

            // Optionally publish immediately
            if (saveMode === 'Published') {
                // The backend `publishTemplate` endpoint handles this,
                // but we already set status=Published in the create payload.
            }

            toast.success(`✅ Template "${templateName}" imported successfully!`);
            onImported();
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || 'Failed to save template';
            toast.error(msg);
            setStep('preview');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalFields = parsedTemplate?.modules.flatMap(m => m.sections.flatMap(s => s.fields)).length ?? 0;
    const totalSections = parsedTemplate?.modules.reduce((acc, m) => acc + m.sections.length, 0) ?? 0;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* ── Header ── */}
                <div className="flex-shrink-0 px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                            <FileText size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">Import from Word</h2>
                            <p className="text-blue-200 text-xs mt-0.5">
                                {step === 'upload' ? 'Upload a .docx questionnaire file' :
                                    step === 'analysis' ? 'Initial Analysis Output' :
                                        step === 'preview' ? `Parsed · ${parsedTemplate?.modules.length} modules · ${totalFields} fields` :
                                            'Saving your template...'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Step Indicator ── */}
                <div className="flex-shrink-0 px-8 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    {[
                        { id: 'upload', label: 'Upload' },
                        { id: 'analysis', label: 'Analysis' },
                        { id: 'preview', label: 'Review' },
                        { id: 'saving', label: 'Save' },
                    ].map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${step === s.id ? 'text-blue-600' :
                                (step === 'preview' && i <= 2) || (step === 'analysis' && i === 0) || step === 'saving' ? 'text-green-600' :
                                    'text-gray-400'
                                }`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${step === s.id ? 'bg-blue-600 text-white' :
                                    (step === 'preview' && i <= 2) || (step === 'analysis' && i === 0) || step === 'saving' ? 'bg-green-500 text-white' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                    {((step === 'preview' && i <= 2) || (step === 'analysis' && i === 0) || step === 'saving') ? '✓' : i + 1}
                                </div>
                                {s.label}
                            </div>
                            {i < 3 && <div className="flex-1 h-px bg-gray-200" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">
                    {/* STEP 1: Upload */}
                    {step === 'upload' && (
                        <div className="p-8">
                            {/* Drag-and-drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                onClick={() => !isParsing && fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer select-none ${isDragging
                                    ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                                    : isParsing
                                        ? 'border-indigo-300 bg-indigo-50 cursor-wait'
                                        : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx"
                                    onChange={onFileSelected}
                                    className="hidden"
                                />

                                {isParsing ? (
                                    <>
                                        <Loader2 size={52} className="mx-auto text-indigo-400 animate-spin mb-4" />
                                        <p className="text-lg font-black text-indigo-700">Analysing document...</p>
                                        <p className="text-sm text-indigo-400 mt-1">Extracting questions, sections & options</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                            <Upload size={36} className="text-blue-500" />
                                        </div>
                                        <p className="text-xl font-black text-gray-800">
                                            {isDragging ? 'Drop your file here!' : 'Drop your Word file here'}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-2">or click to browse</p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500">
                                            <FileText size={14} className="text-blue-500" />
                                            Supports: .docx
                                        </div>
                                    </>
                                )}
                            </div>

                            {parseError && (
                                <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                    <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-red-700">Parsing Failed</p>
                                        <p className="text-xs text-red-500 mt-0.5">{parseError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                {[
                                    { icon: '📋', title: 'Form-style Questions', desc: 'Use Q1, Q2... or q101 numbering for auto-detection' },
                                    { icon: '📝', title: 'Multiple Choice', desc: 'Bullet lists or "o" prefixed options become radio/checkbox' },
                                    { icon: '📊', title: 'Matrix Tables', desc: 'Word tables become matrix questions automatically' },
                                    { icon: '📁', title: 'Sections & Modules', desc: 'H1/H2 headings create new modules; H3 creates sections' },
                                ].map((tip) => (
                                    <div key={tip.title} className="p-4 bg-white border border-gray-100 rounded-2xl flex gap-3">
                                        <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                                        <div>
                                            <p className="text-xs font-black text-gray-800">{tip.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{tip.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Analysis */}
                    {step === 'analysis' && parsedTemplate && (
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="text-yellow-500" size={24} />
                                <h3 className="text-xl font-black text-gray-800">Document Analysis Complete</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white mb-3">
                                        <Layers size={20} />
                                    </div>
                                    <p className="text-2xl font-black text-blue-700">{parsedTemplate.modules.length}</p>
                                    <p className="text-sm font-bold text-blue-600/70">Modules Detected</p>
                                </div>
                                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white mb-3">
                                        <HelpCircle size={20} />
                                    </div>
                                    <p className="text-2xl font-black text-indigo-700">{totalFields}</p>
                                    <p className="text-sm font-bold text-indigo-600/70">Questions & Notes</p>
                                </div>
                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white mb-3">
                                        <Table2 size={20} />
                                    </div>
                                    <p className="text-2xl font-black text-orange-700">
                                        {parsedTemplate.modules.flatMap(m => m.sections.flatMap(s => s.fields.filter(f => f.type === 'matrix'))).length}
                                    </p>
                                    <p className="text-sm font-bold text-orange-600/70">Tables (Matrices)</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Breakdown</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-xs font-bold text-gray-600">Choices/Options</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-900">
                                            {parsedTemplate.modules.flatMap(m => m.sections.flatMap(s => s.fields.flatMap(f => f.options || []))).length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            <span className="text-xs font-bold text-gray-600">Sections</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-900">{totalSections}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-amber-900">AI Analysis Insight</p>
                                    <p className="text-xs text-amber-700/80 leading-relaxed mt-1">
                                        We found <strong>{totalFields}</strong> questions across <strong>{parsedTemplate.modules.length}</strong> modules.
                                        {parsedTemplate.modules.flatMap(m => m.sections.flatMap(s => s.fields.filter(f => f.type === 'matrix'))).length > 0 ?
                                            ` We successfully identified several tables which have been converted to Matrix fields.` :
                                            ` No tables were detected in this document structure.`
                                        } Options were extracted from bullet points and numbered lists.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={() => setStep('preview')}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 transition-all flex items-center gap-2"
                                >
                                    Proceed to Detailed Preview <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Preview & Configure */}
                    {(step === 'preview' || step === 'saving') && parsedTemplate && (
                        <div className="flex flex-col lg:flex-row gap-0 h-full">
                            {/* Left: Config */}
                            <div className="lg:w-72 flex-shrink-0 p-6 border-r border-gray-100 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Template Name</label>
                                    <input
                                        type="text"
                                        value={templateName}
                                        onChange={e => setTemplateName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                        placeholder="e.g. Household Survey 2024"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={2}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                                        placeholder="Optional description..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    >
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Module Type</label>
                                    <select
                                        value={moduleType}
                                        onChange={e => setModuleType(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    >
                                        {MODULE_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {[
                                        { label: 'Modules', value: parsedTemplate.modules.length, color: 'bg-blue-50 text-blue-700' },
                                        { label: 'Sections', value: totalSections, color: 'bg-purple-50 text-purple-700' },
                                        { label: 'Fields', value: totalFields, color: 'bg-green-50 text-green-700' },
                                        { label: 'Options', value: parsedTemplate.modules.flatMap(m => m.sections.flatMap(s => s.fields.flatMap(f => f.options || []))).length, color: 'bg-orange-50 text-orange-700' },
                                    ].map(stat => (
                                        <div key={stat.label} className={`rounded-xl p-3 ${stat.color}`}>
                                            <p className="text-lg font-black">{stat.value}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Save mode */}
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Save as</label>
                                    <div className="flex gap-2">
                                        {(['Draft', 'Published'] as const).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setSaveMode(mode)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${saveMode === mode
                                                    ? mode === 'Published'
                                                        ? 'bg-green-600 text-white border-green-600'
                                                        : 'bg-amber-500 text-white border-amber-500'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Re-upload */}
                                <button
                                    onClick={() => { setStep('upload'); setParsedTemplate(null); setParseError(null); }}
                                    className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-all"
                                >
                                    ↩ Upload different file
                                </button>
                            </div>

                            {/* Right: Module Preview */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                                        <Sparkles size={16} className="text-blue-500" />
                                        Parsed Structure Preview
                                    </h3>
                                    <button
                                        onClick={() => setShowFullPreview(v => !v)}
                                        className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showFullPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {showFullPreview ? 'Collapse' : 'Expand'}
                                    </button>
                                </div>

                                {parsedTemplate.modules.length === 0 ? (
                                    <div className="text-center py-16">
                                        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm font-bold text-gray-400">No structured content detected</p>
                                        <p className="text-xs text-gray-300 mt-1">The document may not follow a recognizable questionnaire format</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {parsedTemplate.modules.map((mod, i) => (
                                            <ModulePreview key={mod.moduleId} module={mod} idx={i} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Saving animation */}
                    {step === 'saving' && isSaving && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <Cloud size={56} className="text-blue-400 animate-bounce mb-4" />
                            <p className="text-lg font-black text-gray-800">Saving template...</p>
                            <p className="text-sm text-gray-400 mt-1">Creating {parsedTemplate?.modules.length} modules in your library</p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex-shrink-0 px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                        {step === 'upload' ? 'Supported: Microsoft Word (.docx)' :
                            step === 'preview' ? `Ready to import · ${parsedTemplate?.modules.length} modules detected` : ''}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        {step === 'preview' && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !templateName.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Saving...' : `Save as ${saveMode}`}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default WordImportModal;
