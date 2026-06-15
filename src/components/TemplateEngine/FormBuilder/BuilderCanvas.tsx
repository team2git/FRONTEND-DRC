import React, { useState } from 'react';
import { useTemplateStore } from '../../../context/TemplateStore';
import { Plus, Trash2, ChevronRight, ChevronDown, GripVertical, Type } from 'lucide-react';
import { clsx } from 'clsx';

const BuilderCanvas: React.FC = () => {
    const {
        template,
        addModule,
        addSection,
        addField,
        removeModule,
        selectField,
        selectedFieldId
    } = useTemplateStore();

    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    const toggleModule = (id: string) => {
        setExpandedModules(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                        <p className="text-gray-500">{template.category} • {template.moduleType}</p>
                    </div>
                    <button
                        onClick={() => addModule('New Module')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} /> Add Module
                    </button>
                </header>

                {template.modules.map((module) => (
                    <div key={module.moduleId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div
                            className="flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer"
                            onClick={() => toggleModule(module.moduleId)}
                        >
                            <div className="flex items-center gap-3">
                                <GripVertical className="text-gray-400 cursor-move" size={18} />
                                {expandedModules.includes(module.moduleId) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <h2 className="font-semibold text-gray-800">{module.title}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); addSection(module.moduleId, 'New Section'); }}
                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg text-sm flex items-center gap-1"
                                >
                                    <Plus size={16} /> Section
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeModule(module.moduleId); }}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {expandedModules.includes(module.moduleId) && (
                            <div className="p-4 space-y-6">
                                {module.sections.map((section) => (
                                    <div key={section.sectionId} className="border-l-4 border-blue-100 pl-6 py-2">
                                        <h3 className="text-lg font-medium text-gray-700 mb-4">{section.title}</h3>

                                        <div className="space-y-3">
                                            {section.fields.map((field) => (
                                                <div
                                                    key={field.fieldId}
                                                    onClick={() => selectField(field.fieldId)}
                                                    className={clsx(
                                                        "group p-4 rounded-lg border transition-all cursor-pointer",
                                                        selectedFieldId === field.fieldId
                                                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                                            : "border-gray-100 bg-white hover:border-gray-300"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            {field.type === 'header' ? (
                                                                <div className="border-b-2 border-blue-500 pb-2 mb-4">
                                                                    <h4 className="text-lg font-extrabold text-gray-900 uppercase tracking-tight">{field.label}</h4>
                                                                </div>
                                                            ) : ['note', 'tip'].includes(field.type) ? (
                                                                <div className="bg-gradient-to-r from-amber-50 to-white border-l-4 border-amber-400 p-4 rounded-r-xl shadow-sm mb-2">
                                                                    <p className="text-sm text-amber-900 font-medium leading-relaxed italic">{field.label}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider shadow-sm border border-blue-100">
                                                                                {field.questionCode}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-base font-semibold text-gray-900 leading-snug">
                                                                                {field.label}
                                                                            </p>
                                                                            {field.helpText && (
                                                                                <div className="mt-2 bg-gray-50 border-l-2 border-gray-300 px-3 py-1.5 rounded-r-md">
                                                                                    <p className="text-xs text-gray-600 leading-relaxed italic">
                                                                                        {field.helpText}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-3 pt-2">
                                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-tighter">
                                                                            <Type size={12} className="opacity-50" /> {field.type}
                                                                        </div>

                                                                        {field.options && field.options.length > 0 && (
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {field.options.slice(0, 4).map((opt: any, i: number) => (
                                                                                    <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                                                                                        <div className="w-2 h-2 rounded-full border-2 border-blue-400 bg-white" />
                                                                                        <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                                                                                    </div>
                                                                                ))}
                                                                                {field.options.length > 4 && (
                                                                                    <div className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                                                                                        +{field.options.length - 4} More
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {field.type === 'matrix' && field.matrixConfig && (
                                                                        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50/50 p-1">
                                                                            <table className="min-w-full text-[10px] text-gray-500">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th className="p-2 text-left bg-gray-100/50 rounded-tl-md">Item</th>
                                                                                        {field.matrixConfig?.columns?.map((col: any, idx: number) => (
                                                                                            <th key={idx} className="p-2 text-center bg-gray-100/50">{col.label}</th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {field.matrixConfig?.rows?.slice(0, 3).map((row: any, idx: number) => (
                                                                                        <tr key={idx} className="border-t border-gray-100">
                                                                                            <td className="p-2 font-medium bg-white">{row.label}</td>
                                                                                            {field.matrixConfig?.columns?.map((_: any, cidx: number) => (
                                                                                                <td key={cidx} className="p-2 text-center bg-white">
                                                                                                    <div className="w-3 h-3 rounded-full border border-gray-300 mx-auto" />
                                                                                                </td>
                                                                                            ))}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                            {field.matrixConfig?.rows?.length && field.matrixConfig.rows.length > 3 ? (
                                                                                <div className="p-1 px-2 text-[9px] text-gray-400 font-bold italic">
                                                                                    Showing 3 of {field.matrixConfig.rows.length} rows...
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(field.required && field.type !== 'note' && field.type !== 'tip' && field.type !== 'header') && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Required</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            <div
                                                className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex justify-center items-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer"
                                                onClick={() => addField(section.sectionId, 'text')}
                                            >
                                                <Plus size={16} className="mr-2" /> Add Question here
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuilderCanvas;
