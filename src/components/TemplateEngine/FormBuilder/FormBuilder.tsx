import React, { useState, useEffect } from 'react';
import { FormBuilderProvider, useFormBuilder, Question, AnswerType, Option, Module } from '../../../context/FormBuilderContext';
import {
    Plus, Save, Send, Eye, X, ChevronLeft, Trash2,
    Copy, ChevronDown, ChevronUp,
    Type, MessageSquare, Hash, Calendar, Circle, CheckSquare,
    Grid, Phone, Mail, Upload, Heading,
    StickyNote, Check, Loader2, Settings, Layers, Palette, Sparkles, MapPin, Table
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router';
import api from '@/api/axios';
import clsx from 'clsx';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import QuestionTypeSelector from './QuestionTypeSelector';
import TableEditor from './TableEditor';

// ─── Utility Components ──────────────────────────────────────────────────────
const SettingToggle: React.FC<{
    title: string;
    desc: string;
    value: boolean;
    onChange: (val: boolean) => void;
}> = ({ title, desc, value, onChange }) => (
    <div className="p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all rounded-2xl border border-transparent hover:border-gray-100 flex items-center justify-between group">
        <div className="flex-1 pr-4">
            <h4 className="font-bold text-sm text-gray-800">{title}</h4>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight font-black">{desc}</p>
        </div>
        <button
            onClick={() => onChange(!value)}
            className={clsx(
                "w-11 h-6 rounded-full relative transition-all duration-300",
                value ? "bg-purple-600" : "bg-gray-300"
            )}
        >
            <div className={clsx(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                value ? "left-6" : "left-1"
            )} />
        </button>
    </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const QUESTION_TYPES: { type: AnswerType; label: string; icon: any; desc: string }[] = [
    { type: 'text', label: 'Short Answer', icon: Type, desc: 'Single line text' },
    { type: 'textarea', label: 'Paragraph', icon: MessageSquare, desc: 'Multi-line text' },
    { type: 'number', label: 'Number', icon: Hash, desc: 'Numeric input' },
    { type: 'date', label: 'Date', icon: Calendar, desc: 'Date picker' },
    { type: 'radio', label: 'Multiple Choice', icon: Circle, desc: 'Pick one option' },
    { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, desc: 'Pick many options' },
    { type: 'select', label: 'Dropdown', icon: ChevronDown, desc: 'Select from list' },
    { type: 'matrix', label: 'Grid', icon: Grid, desc: 'Matrix / grid' },
    { type: 'table', label: 'Dynamic Table', icon: Table, desc: 'Multiple fields per row' },
    { type: 'geo', label: 'Location', icon: MapPin, desc: 'Capture GPS location' },
    { type: 'phone', label: 'Phone', icon: Phone, desc: 'Phone number' },
    { type: 'email', label: 'Email', icon: Mail, desc: 'Email address' },
    { type: 'file', label: 'File Upload', icon: Upload, desc: 'Upload a file' },
    { type: 'header', label: 'Section Header', icon: Heading, desc: 'Visual separator' },
    { type: 'note', label: 'Note / Tip', icon: StickyNote, desc: 'Informational text' },
    { type: 'tip', label: 'Tip', icon: StickyNote, desc: 'Helpful guidance or context' },
];

const TYPE_COLORS: Record<string, string> = {
    text: '#673AB7', textarea: '#3F51B5', number: '#F44336',
    date: '#009688', radio: '#E91E63', checkbox: '#4CAF50',
    select: '#FF9800', matrix: '#2196F3', table: '#0EA5E9',
    geo: '#14B8A6', phone: '#795548', email: '#607D8B',
    file: '#9C27B0', header: '#455A64', note: '#FF5722',
};

// ─── Schema Converter ─────────────────────────────────────────────────────────
const convertToBackendSchema = (template: any) =>
    template.modules.map((module: any, mIdx: number) => ({
        moduleId: module.moduleId,
        title: module.moduleName,
        order: mIdx,
        sections: [{
            sectionId: `${module.moduleId}_section`,
            title: module.moduleName,
            description: '',
            fields: module.questions.map((q: Question): any => ({
                fieldId: q.questionId,
                questionCode: q.questionCode,
                label: q.label,
                type: q.answerType,
                helpText: q.helperText,
                required: q.required,
                options: q.options?.map((o: any) => ({ label: o.label, value: o.value })) || [],
                matrixConfig: q.answerType === 'matrix' ? q.matrixConfig : undefined,
                tableConfig: q.answerType === 'table' ? q.tableConfig : undefined,
                validation: q.validation || {},
                permissions: { visibleToRoles: [], editableByRoles: [] }
            }))
        }]
    }));

const convertFromBackendSchema = (data: any) => {
    const backendModules = Array.isArray(data?.modules) ? data.modules : [];

    // Some draft templates may be saved with an empty modules array; keep the builder usable.
    const modules = backendModules.length
        ? backendModules.map((m: any) => ({
            moduleId: m.moduleId,
            moduleName: m.title,
            questions: (m.sections || []).flatMap((s: any) => (s.fields || []).map((f: any) => ({
                questionId: f.fieldId,
                questionCode: f.questionCode,
                label: f.label,
                answerType: f.type,
                helperText: f.helpText || '',
                required: f.required || false,
                options: f.options || [],
                matrixConfig: f.matrixConfig || { rows: [], columns: [], cellType: 'radio' },
                tableConfig: f.tableConfig || { columns: [], allowAddRow: true },
                validation: f.validation || {}
            })))
        }))
        : [{ moduleId: `m_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, moduleName: 'Module 1', questions: [] }];

    return {
        templateName: data?.name || 'New Questionnaire',
        modules
    };
};

// ─── Type Badge ───────────────────────────────────────────────────────────────
const TypeBadge: React.FC<{ type: AnswerType }> = ({ type }) => {
    const info = QUESTION_TYPES.find(q => q.type === type);
    const Icon = info?.icon || Type;
    return (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: TYPE_COLORS[type] || '#666' }}>
            <Icon size={13} />
            <span>{info?.label || type}</span>
        </div>
    );
};

// ─── Option Row (for radio/checkbox/select) ───────────────────────────────────
const OptionRow: React.FC<{
    option: Option; index: number; type: AnswerType;
    onChange: (idx: number, updates: Partial<Option>) => void;
    onRemove: (idx: number) => void;
}> = ({ option, index, type, onChange, onRemove }) => (
    <div className="flex items-center gap-3 py-1 group">
        <div className="flex-shrink-0 text-gray-300">
            {type === 'checkbox' ? (
                <div className="w-4 h-4 border-2 border-gray-300 rounded" />
            ) : type === 'select' ? (
                <span className="text-xs text-gray-300 font-mono">{index + 1}.</span>
            ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
            )}
        </div>
        <input
            type="text"
            value={option.label}
            onChange={e => onChange(index, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none text-sm text-gray-700 bg-transparent py-0.5 transition-colors"
            placeholder={`Option ${index + 1}`}
        />
        <button
            onClick={() => onRemove(index)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        >
            <X size={14} />
        </button>
    </div>
);

// ─── Matrix Editor Inline ─────────────────────────────────────────────────────
const MatrixEditorInline: React.FC<{
    config: Question['matrixConfig'];
    onChange: (config: Question['matrixConfig']) => void;
}> = ({ config, onChange }) => {
    const addRow = () => {
        const label = `Row ${config.rows.length + 1}`;
        onChange({ ...config, rows: [...config.rows, { label, value: label.toLowerCase().replace(/\s+/g, '_') }] });
    };
    const addCol = () => {
        const label = `Col ${config.columns.length + 1}`;
        onChange({ ...config, columns: [...config.columns, { label, value: label.toLowerCase().replace(/\s+/g, '_') }] });
    };
    const updateRow = (i: number, label: string) => {
        const rows = [...config.rows];
        rows[i] = { label, value: label.toLowerCase().replace(/\s+/g, '_') };
        onChange({ ...config, rows });
    };
    const updateCol = (i: number, label: string) => {
        const columns = [...config.columns];
        columns[i] = { label, value: label.toLowerCase().replace(/\s+/g, '_') };
        onChange({ ...config, columns });
    };

    return (
        <div className="mt-4 space-y-3">
            <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full">
                    <thead>
                        <tr>
                            <th className="p-2 text-left text-gray-400 font-medium w-1/4">Rows \ Cols</th>
                            {config.columns.map((col, i) => (
                                <th key={i} className="p-2 text-center">
                                    <input
                                        type="text" value={col.label}
                                        onChange={e => updateCol(i, e.target.value)}
                                        className="w-20 text-center border-b border-gray-200 focus:border-blue-500 outline-none text-xs bg-transparent"
                                    />
                                </th>
                            ))}
                            <th className="p-2">
                                <button onClick={addCol} className="text-blue-500 hover:text-blue-700 font-bold">+ Col</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {config.rows.map((row, i) => (
                            <tr key={i}>
                                <td className="p-2">
                                    <input
                                        type="text" value={row.label}
                                        onChange={e => updateRow(i, e.target.value)}
                                        className="w-full border-b border-gray-200 focus:border-blue-500 outline-none text-xs bg-transparent"
                                    />
                                </td>
                                {config.columns.map((_, ci) => (
                                    <td key={ci} className="p-2 text-center">
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mx-auto" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={addRow} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add Row</button>
        </div>
    );
};

// ─── Google-Forms-style Question Card ─────────────────────────────────────────
const QuestionCard: React.FC<{
    question: Question;
}> = ({ question }) => {
    const { state, dispatch } = useFormBuilder();
    const isActive = state.activeQuestionId === question.questionId;

    const updateQuestion = (updates: Partial<Question>) => {
        dispatch({ type: 'UPDATE_QUESTION', questionId: question.questionId, updates });
    };

    const addOption = () => {
        const newOpt: Option = {
            label: `Option ${(question.options?.length || 0) + 1}`,
            value: `opt_${(question.options?.length || 0) + 1}`,
        };
        updateQuestion({ options: [...(question.options || []), newOpt] });
    };

    const updateOption = (idx: number, updates: Partial<Option>) => {
        const opts = [...(question.options || [])];
        opts[idx] = { ...opts[idx], ...updates };
        updateQuestion({ options: opts });
    };

    const removeOption = (idx: number) => {
        updateQuestion({ options: (question.options || []).filter((_, i) => i !== idx) });
    };

    const isChoiceType = ['radio', 'checkbox', 'select'].includes(question.answerType);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => dispatch({ type: 'SELECT_QUESTION', questionId: question.questionId })}
            className={clsx(
                "relative bg-white rounded-xl shadow-sm border-l-4 transition-all duration-300",
                isActive ? "shadow-xl z-20" : "border-transparent border-l-0 hover:shadow-md",
                "overflow-hidden p-6 mb-4 group cursor-pointer"
            )}
            style={{ borderLeftColor: isActive ? state.theme.primaryColor : undefined }}
        >
            {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ backgroundColor: state.theme.primaryColor }} />
            )}

            {/* Reorder Icons (Visible on Hover/Active) */}
            <div className={clsx(
                "absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
                <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MOVE_QUESTION', questionId: question.questionId, direction: 'up' }); }}
                    className="p-1.5 bg-gray-50 hover:bg-purple-100 text-gray-400 hover:text-purple-600 rounded-md shadow-sm transition-all border border-gray-100"
                    title="Move Up"
                >
                    <ChevronUp size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MOVE_QUESTION', questionId: question.questionId, direction: 'down' }); }}
                    className="p-1.5 bg-gray-50 hover:bg-purple-100 text-gray-400 hover:text-purple-600 rounded-md shadow-sm transition-all border border-gray-100"
                    title="Move Down"
                >
                    <ChevronDown size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {/* Header: Question + Type */}
                <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-[300px]">
                        <input
                            type="text"
                            value={question.label}
                            onChange={e => updateQuestion({ label: e.target.value })}
                            className={clsx(
                                "w-full text-lg outline-none bg-transparent border-b transition-all duration-200",
                                isActive ? "border-purple-200 focus:border-purple-600 pb-2" : "border-transparent"
                            )}
                            placeholder="Question text"
                        />
                        {isActive && (
                            <input
                                type="text"
                                value={question.helperText}
                                onChange={e => updateQuestion({ helperText: e.target.value })}
                                className="w-full text-xs text-gray-400 mt-2 outline-none border-none bg-transparent"
                                placeholder="Add optional instructions/helper text..."
                            />
                        )}
                    </div>

                    {isActive ? (
                        <div className="relative w-52">
                            <select
                                value={question.answerType}
                                onChange={e => updateQuestion({ answerType: e.target.value as AnswerType })}
                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all cursor-pointer"
                            >
                                {QUESTION_TYPES.map(t => (
                                    <option key={t.type} value={t.type}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    ) : (
                        <TypeBadge type={question.answerType} />
                    )}
                </div>

                {/* Content based on type */}
                <div className="pl-1">
                    {/* (keep existing type-specific rendering logic below) */}
                    {/* Text inputs */}
                    {question.answerType === 'text' && (
                        <div className="border-b-2 border-dotted border-gray-200 pb-1 text-sm text-gray-400 py-2 pl-2">
                            Short answer text
                        </div>
                    )}
                    {question.answerType === 'textarea' && (
                        <div className="border-b-2 border-dotted border-gray-200 pb-1 text-sm text-gray-400 py-2 pl-2">
                            Long answer text
                        </div>
                    )}
                    {question.answerType === 'number' && (
                        <div className="border-b-2 border-dotted border-gray-200 pb-1 text-sm text-gray-400 py-2 pl-2">
                            0–9999
                        </div>
                    )}
                    {question.answerType === 'date' && (
                        <div className="border-b-2 border-dotted border-gray-200 pb-1 text-sm text-gray-400 py-2 pl-2 flex items-center gap-2">
                            <Calendar size={14} /> MM/DD/YYYY
                        </div>
                    )}
                    {question.answerType === 'phone' && (
                        <div className="border-b-2 border-dotted border-gray-200 pb-1 text-sm text-gray-400 py-2 pl-2 flex items-center gap-2">
                            <Phone size={14} /> +251 9xx xxx xxx
                        </div>
                    )}
                    {question.answerType === 'email' && (
                        <div className="border-b-2 border-dotted border-gray-200 pb-1 text-sm text-gray-400 py-2 pl-2 flex items-center gap-2">
                            <Mail size={14} /> example@email.com
                        </div>
                    )}
                    {question.answerType === 'file' && (
                        <div className="flex items-center gap-3 mt-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                            <Upload size={18} /> Click to upload a file
                        </div>
                    )}

                    {/* Choice types */}
                    {isChoiceType && (
                        <div className="space-y-1 mt-1">
                            {(question.options || []).map((opt, i) => (
                                <OptionRow
                                    key={i} option={opt} index={i}
                                    type={question.answerType}
                                    onChange={updateOption}
                                    onRemove={removeOption}
                                />
                            ))}

                            {/* Add option row */}
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex-shrink-0 text-gray-200">
                                    {question.answerType === 'checkbox'
                                        ? <div className="w-4 h-4 border-2 border-gray-200 rounded" />
                                        : question.answerType === 'select'
                                            ? <span className="text-xs text-gray-200">{(question.options?.length || 0) + 1}.</span>
                                            : <div className="w-4 h-4 border-2 border-gray-200 rounded-full" />
                                    }
                                </div>
                                <button
                                    onClick={addOption}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    Add option
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Matrix */}
                    {question.answerType === 'matrix' && (
                        <MatrixEditorInline
                            config={question.matrixConfig}
                            onChange={(mc) => updateQuestion({ matrixConfig: mc })}
                        />
                    )}

                    {/* Table / Geo */}
                    {question.answerType === 'geo' && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400">
                            <MapPin size={16} /> GPS Capture (Location)
                        </div>
                    )}
                    {question.answerType === 'table' && (
                        <div className="mt-2">
                            {isActive ? (
                                <TableEditor
                                    config={question.tableConfig}
                                    onChange={(tc) => updateQuestion({ tableConfig: tc })}
                                />
                            ) : (
                                <div className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400">
                                    <div className="flex items-center gap-2 opacity-60"><Table size={14} /> Dynamic Data Table</div>
                                    {question.tableConfig?.columns?.length ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {question.tableConfig.columns.slice(0, 3).map((col, i) => (
                                                <div key={`${col.label}_${i}`} className="space-y-1">
                                                    <div className="text-[10px] font-black text-gray-400 uppercase">{col.label || `Column ${i + 1}`}</div>
                                                    <div className="h-7 bg-white border border-gray-200 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-20 border border-gray-200 rounded flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No columns yet</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Header type questions */}
                    {question.answerType === 'header' ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={question.label}
                                onChange={e => updateQuestion({ label: e.target.value })}
                                placeholder="Section title"
                                className="w-full text-xl font-semibold text-gray-800 border-b-2 border-blue-400 outline-none bg-transparent pb-1 focus:border-blue-600"
                                onClick={e => e.stopPropagation()}
                            />
                            <input
                                type="text"
                                value={question.helperText}
                                onChange={e => updateQuestion({ helperText: e.target.value })}
                                placeholder="Section description (optional)"
                                className="w-full text-sm text-gray-500 border-b border-gray-200 outline-none bg-transparent pb-1 focus:border-gray-400"
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    ) : ['note', 'tip'].includes(question.answerType) ? (
                        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                            <textarea
                                value={question.label}
                                onChange={e => updateQuestion({ label: e.target.value })}
                                placeholder={question.answerType === 'tip' ? 'Enter tip text...' : 'Enter note / instruction text...'}
                                className="w-full text-sm text-amber-800 bg-transparent outline-none resize-none min-h-[60px]"
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    ) : null}
                </div>

                {/* Footer actions (only when active) */}
                {isActive && question.answerType !== 'header' && question.answerType !== 'note' && question.answerType !== 'tip' && (
                    <div className="flex items-center gap-2 border-t pt-4">
                        {state.settings.showQuestionCodes && (
                            <div className="flex-1 flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100">
                                <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase">Question Code</span>
                                <input
                                    type="text"
                                    value={question.questionCode}
                                    onChange={e => updateQuestion({ questionCode: e.target.value })}
                                    className="bg-transparent border-none outline-none text-xs font-mono text-gray-500 w-24"
                                />
                            </div>
                        )}
                        {!state.settings.showQuestionCodes && <div className="flex-1" />}

                        <div className="flex items-center gap-1 border-r pr-4 mr-2 border-gray-100">
                            <button
                                onClick={() => {
                                    dispatch({ type: 'DUPLICATE_QUESTION', questionId: question.questionId });
                                }}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                title="Duplicate"
                            >
                                <Copy size={18} />
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'REMOVE_QUESTION', questionId: question.questionId })}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 ml-2">
                            <span className="text-xs font-semibold text-gray-500">Required</span>
                            <button
                                onClick={() => updateQuestion({ required: !question.required })}
                                className={clsx(
                                    "w-10 h-5 rounded-full transition-all relative",
                                    question.required ? "bg-purple-600" : "bg-gray-200"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                    question.required ? "left-5.5" : "left-0.5"
                                )} />
                            </button>
                        </div>

                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-all ml-1">
                            <Settings size={18} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ─── Section/Module Block ─────────────────────────────────────────────────────
const ModuleBlock: React.FC<{ module: Module; order: number }> = ({ module, order }) => {
    const { state, dispatch } = useFormBuilder();

    return (
        <div className="space-y-3 mb-8">
            {/* Section title card */}
            {order === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-2" style={{ background: 'linear-gradient(90deg, #673AB7, #3F51B5, #2196F3)' }} />
                    <div className="p-6 space-y-3">
                        <input
                            type="text"
                            value={state.template.templateName}
                            onChange={e => dispatch({ type: 'SET_TEMPLATE_NAME', name: e.target.value })}
                            placeholder="Form title"
                            className="w-full text-2xl font-semibold text-gray-800 border-b-2 border-purple-300 focus:border-purple-600 outline-none bg-transparent pb-1 transition-colors"
                        />
                        <input
                            type="text"
                            value={module.moduleName}
                            onChange={e => dispatch({ type: 'UPDATE_MODULE_NAME', moduleId: module.moduleId, name: e.target.value })}
                            placeholder="Form description (optional)"
                            className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-gray-300 outline-none bg-transparent pb-1 transition-colors"
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-1 bg-blue-400" />
                    <div className="p-5 flex items-center gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={module.moduleName}
                                onChange={e => dispatch({ type: 'UPDATE_MODULE_NAME', moduleId: module.moduleId, name: e.target.value })}
                                placeholder="Section title"
                                className="w-full text-lg font-semibold text-gray-800 border-b-2 border-blue-300 focus:border-blue-600 outline-none bg-transparent pb-1 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => dispatch({ type: 'ADD_MODULE_AT', name: 'New Section', index: order + 1 })}
                                className="p-2 bg-gray-50 hover:bg-purple-100 text-gray-400 hover:text-purple-600 rounded-lg transition-all"
                                title="Insert Section Below"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'MOVE_MODULE', moduleId: module.moduleId, direction: 'up' })}
                                className="p-2 bg-gray-50 hover:bg-blue-100 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                title="Move Module Up"
                            >
                                <ChevronUp size={18} />
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'MOVE_MODULE', moduleId: module.moduleId, direction: 'down' })}
                                className="p-2 bg-gray-50 hover:bg-blue-100 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                title="Move Module Down"
                            >
                                <ChevronDown size={18} />
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'REMOVE_MODULE', moduleId: module.moduleId })}
                                className="p-2 bg-gray-50 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                                title="Remove Module"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question cards */}
            <AnimatePresence>
                <div className="mb-4">
                    <button
                        onClick={() => dispatch({ type: 'OPEN_TYPE_SELECTOR', moduleId: module.moduleId, insertIndex: 0 })}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50/20 transition-all"
                        title="Add question here"
                    >
                        + Add question here
                    </button>
                </div>

                <Reorder.Group
                    axis="y"
                    values={module.questions}
                    onReorder={(questions) => dispatch({ type: 'REORDER_QUESTIONS', moduleId: module.moduleId, questions })}
                    className="space-y-4"
                >
                    {module.questions.map((question, qIdx) => (
                        <React.Fragment key={question.questionId}>
                            <Reorder.Item
                                value={question}
                                dragListener={state.activeQuestionId === question.questionId}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <QuestionCard question={question} />
                            </Reorder.Item>

                            <div>
                                <button
                                    onClick={() => dispatch({ type: 'OPEN_TYPE_SELECTOR', moduleId: module.moduleId, insertIndex: qIdx + 1 })}
                                    className="w-full border border-transparent rounded-xl py-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-purple-600 hover:border-purple-100 hover:bg-purple-50/20 transition-all"
                                    title="Add question below"
                                >
                                    + Add below
                                </button>
                            </div>
                        </React.Fragment>
                    ))}
                </Reorder.Group>
            </AnimatePresence>
        </div>
    );
};

// ─── Preview Modal ────────────────────────────────────────────────────────────
const PreviewModal: React.FC<{ template: any; onClose: () => void }> = ({ template, onClose }) => {
    const [radioValues, setRadioValues] = useState<Record<string, string>>({});
    const [checkboxValues, setCheckboxValues] = useState<Record<string, string[]>>({});

    return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-100 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">Preview: {template.templateName}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {template.modules.map((mod: any) => (
                        <div key={mod.moduleId} className="space-y-3">
                            <div className="bg-white rounded-xl p-5 border border-t-4" style={{ borderTopColor: '#673AB7' }}>
                                <h3 className="text-xl font-semibold text-gray-800">{template.templateName}</h3>
                                <p className="text-sm text-gray-500 mt-1">{mod.moduleName}</p>
                            </div>
                            {mod.questions.map((q: Question) => (
                                <div key={q.questionId} className="bg-white rounded-xl p-5 border border-gray-200">
                    {q.answerType === 'header' ? (
                        <h4 className="text-base font-semibold text-gray-800 border-b pb-2">{q.label}</h4>
                    ) : ['note', 'tip'].includes(q.answerType) ? (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 text-sm text-amber-800 rounded-r-lg">{q.label}</div>
                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-800 mb-3">
                                                {q.label}
                                                {q.required && <span className="text-red-500 ml-1">*</span>}
                                            </p>
                                            {q.helperText && <p className="text-xs text-gray-400 mb-3">{q.helperText}</p>}

                                            {['text', 'email', 'phone'].includes(q.answerType) && (
                                                <input type="text" className="w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1.5 bg-transparent" placeholder="Your answer" />
                                            )}
                                            {q.answerType === 'textarea' && (
                                                <textarea className="w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1.5 bg-transparent resize-none min-h-[60px]" placeholder="Your answer" />
                                            )}
                                            {q.answerType === 'number' && (
                                                <input type="number" className="w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1.5 bg-transparent" placeholder="0" />
                                            )}
                                            {q.answerType === 'date' && (
                                                <input type="date" className="border-b border-gray-300 focus:border-blue-500 outline-none text-sm py-1.5 bg-transparent" />
                                            )}
                                            {q.answerType === 'radio' && q.options?.map((opt, oi) => (
                                                <label key={oi} className="flex items-center gap-3 py-1.5 cursor-pointer">
                                                    <input type="radio" name={q.questionId} value={opt.value}
                                                        checked={radioValues[q.questionId] === opt.value}
                                                        onChange={() => setRadioValues(prev => ({ ...prev, [q.questionId]: opt.value }))}
                                                        className="accent-purple-600" />
                                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                                </label>
                                            ))}
                                            {q.answerType === 'checkbox' && q.options?.map((opt, oi) => (
                                                <label key={oi} className="flex items-center gap-3 py-1.5 cursor-pointer">
                                                    <input type="checkbox"
                                                        checked={checkboxValues[q.questionId]?.includes(opt.value) || false}
                                                        onChange={() => setCheckboxValues(prev => ({
                                                            ...prev,
                                                            [q.questionId]: prev[q.questionId]?.includes(opt.value)
                                                                ? prev[q.questionId].filter(v => v !== opt.value)
                                                                : [...(prev[q.questionId] || []), opt.value]
                                                        }))}
                                                        className="accent-purple-600 rounded" />
                                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                                </label>
                                            ))}

                                            {q.answerType === 'matrix' && (
                                                <div className="overflow-x-auto mt-2">
                                                    <table className="w-full text-xs border border-gray-100">
                                                        <thead>
                                                            <tr className="bg-gray-50">
                                                                <th className="p-2 border">Rows \ Cols</th>
                                                                {q.matrixConfig.columns.map(c => <th key={c.value} className="p-2 border">{c.label}</th>)}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {q.matrixConfig.rows.map(r => (
                                                                <tr key={r.value}>
                                                                    <td className="p-2 border font-medium">{r.label}</td>
                                                                    {q.matrixConfig.columns.map(c => (
                                                                        <td key={c.value} className="p-2 border text-center">
                                                                            <input type="radio" name={`${q.questionId}_${r.value}`} className="accent-purple-600" />
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {q.answerType === 'table' && (
                                                <div className="overflow-x-auto mt-2 rounded-lg border border-gray-100 bg-gray-50/30 p-3">
                                                    {q.tableConfig?.columns?.length ? (
                                                        <table className="w-full text-xs border border-gray-100 bg-white rounded-lg overflow-hidden">
                                                            <thead>
                                                                <tr className="bg-gray-50">
                                                                    {q.tableConfig.columns.map((c, i) => (
                                                                        <th key={`${c.label}_${i}`} className="p-2 border text-left font-bold text-gray-500">
                                                                            {c.label || `Column ${i + 1}`}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    {q.tableConfig.columns.map((c, i) => (
                                                                        <td key={`${c.label}_${i}_cell`} className="p-2 border">
                                                                            <div className="h-7 rounded bg-gray-50 border border-gray-100" />
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                            <Table size={16} className="opacity-40" />
                                                            <span>No columns configured yet</span>
                                                        </div>
                                                    )}
                                                    {q.tableConfig?.allowAddRow !== false && (
                                                        <div className="mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">+ Add new row</div>
                                                    )}
                                                </div>
                                            )}

                                            {q.answerType === 'geo' && (
                                                <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-600 text-xs mt-2">
                                                    <MapPin size={16} /> Capture GPS Location
                                                </div>
                                            )}

                                            {q.answerType === 'file' && (
                                                <div className="mt-2 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                                                    <Upload size={20} className="mb-2" />
                                                    <span className="text-xs font-medium">Click to upload file</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SidebarActions: React.FC = () => {
    const { state, dispatch } = useFormBuilder();

    const activeModuleIndex = state.activeQuestionId
        ? state.template.modules.findIndex(m => m.questions.some(q => q.questionId === state.activeQuestionId))
        : -1;

    const insertSectionIndex = activeModuleIndex >= 0 ? activeModuleIndex + 1 : state.template.modules.length;
    return (
        <div className="fixed right-10 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex flex-col gap-2 z-40">
            <button
                onClick={() => dispatch({ type: 'OPEN_TYPE_SELECTOR', moduleId: 'any' })}
                className="p-4 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all group relative"
                title="Add Question"
            >
                <Plus size={24} />
                <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold py-1 px-3 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Add Question</span>
            </button>
            <button
                onClick={() => dispatch({ type: 'ADD_MODULE_AT', name: 'New Section', index: insertSectionIndex })}
                className="p-4 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all group relative"
                title="Add Section"
            >
                <Layers size={24} />
                <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold py-1 px-3 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Add Section</span>
            </button>
            <button
                onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                className="p-4 rounded-xl text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all group relative"
                title="Customize Theme"
            >
                <Palette size={24} />
                <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold py-1 px-3 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Theme</span>
            </button>
            <div className="h-px bg-gray-100 mx-2" />
            <button
                onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
                className="p-4 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all group relative"
                title="Settings"
            >
                <Settings size={24} />
                <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold py-1 px-3 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Settings</span>
            </button>
        </div>
    );
};

// ─── Inner Form Builder ───────────────────────────────────────────────────────
const InnerFormBuilder: React.FC = () => {
    const { state, dispatch } = useFormBuilder();
    const navigate = useNavigate();
    const { id } = useParams();
    const [showPreview, setShowPreview] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (id) {
            setSavedId(id);
            fetchTemplate(id);
        }
    }, [id]);

    const fetchTemplate = async (templateId: string) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/templates/${templateId}`);
            const converted = convertFromBackendSchema(response.data);
            dispatch({ type: 'LOAD_TEMPLATE', template: converted });
        } catch (error) {
            toast.error('Failed to load template');
            navigate('/admin/template-library');
        } finally {
            setIsLoading(false);
        }
    };

    const buildPayload = (status: 'Draft' | 'Published') => ({
        name: state.template.templateName,
        category: 'Household',
        moduleType: 'HHQ',
        description: '',
        status,
        modules: convertToBackendSchema(state.template)
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let response;
            if (savedId) {
                response = await api.put(`/templates/${savedId}`, buildPayload('Draft'));
                toast.success('Draft updated!');
            } else {
                response = await api.post('/templates', buildPayload('Draft'));
                setSavedId(response.data._id);
                toast.success('Draft saved!');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            let id = savedId;
            if (!id) {
                const res = await api.post('/templates', buildPayload('Draft'));
                id = res.data._id;
                setSavedId(id);
            }
            await api.post(`/templates/${id}/publish`);
            toast.success('🚀 Published!');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to publish');
        } finally {
            setIsPublishing(false);
        }
    };

    const totalQuestions = state.template.modules.reduce((a, m) => a + m.questions.length, 0);

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-gray-100 items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-bold">Loading Template...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden" style={{ fontFamily: state.theme.fontFamily }}>
            {/* ── Top Bar (Google Forms style) ── */}
            <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/template-library')}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        title="Back to Library"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    {/* Logo dots (Google Forms inspired) */}
                    <div className="flex gap-0.5">
                        <div className="w-4 h-5 rounded-sm" style={{ backgroundColor: state.theme.primaryColor }} />
                        <div className="w-4 h-5 rounded-sm" style={{ backgroundColor: state.theme.primaryColor, opacity: 0.6 }} />
                        <div className="w-4 h-5 rounded-sm" style={{ backgroundColor: state.theme.primaryColor, opacity: 0.3 }} />
                    </div>

                    <div>
                        <input
                            type="text"
                            value={state.template.templateName}
                            onChange={e => dispatch({ type: 'SET_TEMPLATE_NAME', name: e.target.value })}
                            className="text-base font-medium text-gray-800 bg-transparent border-none outline-none focus:ring-0 p-0 min-w-[200px]"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{totalQuestions} question{totalQuestions !== 1 ? 's' : ''}</span>
                            {savedId && <span className="text-[10px] text-green-500 flex items-center gap-1"><Check size={9} /> Saved</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        title="Preview"
                    >
                        <Eye size={20} />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50"
                        style={{ backgroundColor: state.theme.primaryColor }}
                    >
                        {isPublishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </nav>

            {/* ── Floating Actions Sidebar ── */}
            <SidebarActions />

            <main className="flex-1 overflow-y-auto pt-8 pb-32 px-4 scroll-smooth">
                <div className="max-w-[770px] mx-auto">
                    {/* Header Image Area */}
                    <div className="h-40 w-full rounded-2xl mb-8 overflow-hidden relative shadow-xl shadow-purple-200/50">
                        <img
                            src={state.theme.headerImage}
                            className="w-full h-full object-cover"
                            style={{ opacity: state.theme.headerOpacity / 100 }}
                            alt="Header"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                            <div
                                className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white shadow-xl"
                                style={{ backgroundColor: `${state.theme.primaryColor}33` }}
                            >
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-white drop-shadow-lg tracking-tight">Instrument Designer</h2>
                        </div>
                    </div>

                    <Reorder.Group
                        axis="y"
                        values={state.template.modules}
                        onReorder={(modules) => dispatch({ type: 'REORDER_MODULES', modules })}
                        className="space-y-8"
                    >
                        {state.template.modules.map((m, idx) => (
                            <Reorder.Item
                                key={m.moduleId}
                                value={m}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <ModuleBlock module={m} order={idx} />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <div className="flex justify-center mt-12 pb-24">
                        <button
                            onClick={() => dispatch({ type: 'ADD_MODULE', name: 'New Section' })}
                            className="flex items-center gap-2 group text-gray-400 hover:text-purple-600 transition-all"
                        >
                            <div className="w-12 h-px bg-gray-200 group-hover:bg-purple-200 transition-all" />
                            <span className="text-xs font-black uppercase tracking-widest px-4 py-2 border border-gray-100 rounded-full group-hover:border-purple-100">Add New Module</span>
                            <div className="w-12 h-px bg-gray-200 group-hover:bg-purple-200 transition-all" />
                        </button>
                    </div>
                </div>
            </main>

            {/* ── Preview Modal ── */}
            <AnimatePresence>
                {showPreview && (
                    <PreviewModal template={state.template} onClose={() => setShowPreview(false)} />
                )}
            </AnimatePresence>

            {/* ── Question Type Selector ── */}
            <QuestionTypeSelector />

            {/* ── Theme Drawer ── */}
            <AnimatePresence>
                {state.isThemeOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[100] border-l border-gray-100 p-6"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-gray-900">Theme Selector</h3>
                            <button onClick={() => dispatch({ type: 'TOGGLE_THEME', open: false })} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500">Customize the look and feel of your questionnaire.</p>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Primary Color</label>
                                <div className="grid grid-cols-5 gap-3">
                                    {['#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => dispatch({ type: 'UPDATE_THEME', updates: { primaryColor: color } })}
                                            className={clsx(
                                                "w-10 h-10 rounded-full shadow-inner border-2 transition-all",
                                                state.theme.primaryColor === color ? "border-black scale-110" : "border-white"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Header Image URL</label>
                                <input
                                    type="text"
                                    value={state.theme.headerImage}
                                    onChange={e => dispatch({ type: 'UPDATE_THEME', updates: { headerImage: e.target.value } })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-purple-100 transition-all font-mono"
                                    placeholder="Enter image URL..."
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Header Opacity</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="range" min="0" max="100"
                                        value={state.theme.headerOpacity}
                                        onChange={e => dispatch({ type: 'UPDATE_THEME', updates: { headerOpacity: parseInt(e.target.value) } })}
                                        className="flex-1 accent-purple-600"
                                    />
                                    <span className="text-xs font-mono text-gray-500 w-8">{state.theme.headerOpacity}%</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Font Family</label>
                                <div className="flex flex-col gap-2">
                                    {['Inter', 'Outfit', 'Roboto', 'Poppins'].map(font => (
                                        <button
                                            key={font}
                                            onClick={() => dispatch({ type: 'UPDATE_THEME', updates: { fontFamily: font } })}
                                            className={clsx(
                                                "w-full px-4 py-3 rounded-xl border text-left transition-all",
                                                state.theme.fontFamily === font ? "bg-purple-50 border-purple-200 text-purple-700 font-bold" : "bg-white border-gray-100 text-gray-600"
                                            )}
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Settings Drawer ── */}
            <AnimatePresence>
                {state.isSettingsOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[100] border-l border-gray-100 p-6"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-gray-900">Form Settings</h3>
                            <button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS', open: false })} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <SettingToggle
                                title="Show Question Codes"
                                desc="Visible unique identifiers for each field"
                                value={state.settings.showQuestionCodes}
                                onChange={(val: boolean) => dispatch({ type: 'UPDATE_SETTINGS', updates: { showQuestionCodes: val } })}
                            />
                            <SettingToggle
                                title="Auto-save Drafts"
                                desc="Save changes automatically while building"
                                value={state.settings.autoSave}
                                onChange={(val: boolean) => dispatch({ type: 'UPDATE_SETTINGS', updates: { autoSave: val } })}
                            />
                            <SettingToggle
                                title="Default Required"
                                desc="Automatically set new questions to required"
                                value={state.settings.defaultRequired}
                                onChange={(val: boolean) => dispatch({ type: 'UPDATE_SETTINGS', updates: { defaultRequired: val } })}
                            />
                            <SettingToggle
                                title="Allow Public Access"
                                desc="Allow anyone with mirror link to respond"
                                value={state.settings.publicAccess}
                                onChange={(val: boolean) => dispatch({ type: 'UPDATE_SETTINGS', updates: { publicAccess: val } })}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const FormBuilder: React.FC = () => (
    <FormBuilderProvider>
        <InnerFormBuilder />
    </FormBuilderProvider>
);

export default FormBuilder;
