import React from 'react';
import { Plus, Database, Info } from 'lucide-react';
import { useFormBuilder, Question } from '../../../context/FormBuilderContext';
import { clsx } from 'clsx';
import { FIELD_TYPES } from './QuestionTypeSelector';

const QuestionCard: React.FC<{ question: Question }> = ({ question }) => {
    const { state, dispatch } = useFormBuilder();
    const isActive = state.activeQuestionId === question.questionId;
    const [previewSelected, setPreviewSelected] = React.useState<string[]>([]);

    // Find icon for this type
    const fieldInfo = FIELD_TYPES.find(f => f.type === question.answerType);
    const Icon = fieldInfo?.icon || Database;

    const handleOptionClick = (val: string) => {
        // We do NOT stop propagation here, so clicking the option also selects the question card
        if (question.answerType === 'radio' || question.answerType === 'select') {
            setPreviewSelected([val]); // Single selection
        } else if (question.answerType === 'checkbox') {
            // Multi-selection toggle
            setPreviewSelected(prev =>
                prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
            );
        }
    };

    return (
        <div
            onClick={() => dispatch({ type: 'SELECT_QUESTION', questionId: question.questionId })}
            className={clsx(
                "group relative bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg",
                isActive ? "border-blue-600 ring-4 ring-blue-50 shadow-xl scale-[1.02]" : "border-gray-100 hover:border-blue-200"
            )}
        >
            <div className="flex gap-4">
                <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                    isActive ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                )}>
                    <Icon size={24} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">
                            {question.questionCode}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {question.answerType}
                        </span>
                        {question.required && (
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-auto">Required</span>
                        )}
                    </div>

                    <h4 className={clsx(
                        "text-base font-bold truncate transition-colors",
                        isActive ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                    )}>
                        {question.label}
                    </h4>

                    {question.helperText && (
                        <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">{question.helperText}</p>
                    )}

                    {/* 🎨 Hyper-Realistic WYSIWYG Preview */}
                    <div className="mt-5 space-y-3">
                        {/* Choice Types: Radio / Checkbox / Select */}
                        {['radio', 'checkbox', 'select'].includes(question.answerType) && (
                            <div className="space-y-2">
                                {question.options?.map((opt, i) => {
                                    const isSelected = previewSelected.includes(opt.value);
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleOptionClick(opt.value)}
                                            className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-100 group/opt cursor-pointer"
                                        >
                                            <div className={clsx(
                                                "w-5 h-5 border-2 flex items-center justify-center transition-all",
                                                question.answerType === 'radio' ? "rounded-full" : "rounded-md",
                                                isSelected ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)] bg-blue-50" : "border-gray-300 bg-white"
                                            )}>
                                                {isSelected && <div className={clsx("bg-blue-600", question.answerType === 'radio' ? "w-2.5 h-2.5 rounded-full" : "w-3 h-3 rounded-[2px]")} />}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 tracking-tight">{opt.label}</span>

                                            {opt.hasAdditionalInput && isSelected && (
                                                <div className="flex-1 ml-4 h-8 bg-white border-b-2 border-dashed border-blue-200 rounded-t-md px-3 flex items-center shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                                                    <span className="text-[10px] text-gray-400 font-bold italic uppercase">{opt.additionalInput?.label || 'Please specify'}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {(!question.options || question.options.length === 0) && (
                                    <p className="text-xs text-amber-500 font-bold italic bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
                                        <Info size={14} /> Add options in the configuration panel to see them here.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Text / Input Types */}
                        {['text', 'textarea', 'number', 'date', 'phone', 'email'].includes(question.answerType) && (
                            <div className="w-full h-12 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl flex items-center px-4">
                                <span className="text-sm text-gray-300 font-medium">
                                    {question.validation?.placeholder || `User will enter ${question.answerType} here...`}
                                </span>
                            </div>
                        )}

                        {/* Matrix Preview */}
                        {question.answerType === 'matrix' && question.matrixConfig && (
                            <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white/50 shadow-inner">
                                <table className="min-w-full text-xs">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="p-3 text-left font-black text-gray-400 uppercase tracking-widest text-[9px]">Row Label</th>
                                            {question.matrixConfig.columns.map((col, i) => (
                                                <th key={i} className="p-3 text-center font-black text-gray-400 uppercase tracking-widest text-[9px]">{col.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {question.matrixConfig.rows.slice(0, 3).map((row, i) => (
                                            <tr key={i} className="border-t border-gray-50">
                                                <td className="p-3 font-bold text-gray-700">{row.label}</td>
                                                {question.matrixConfig.columns.map((_, ci) => (
                                                    <td key={ci} className="p-3">
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-200 mx-auto" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {question.matrixConfig.rows.length > 3 && (
                                    <div className="p-2 text-center text-[10px] text-gray-400 font-bold italic border-t border-gray-50 bg-gray-50/20">
                                        + {question.matrixConfig.rows.length - 3} more rows
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic Table Preview */}
                        {question.answerType === 'table' && question.tableConfig && (
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    {question.tableConfig.columns.map((col, i) => (
                                        <div key={i} className="space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase">{col.label}</label>
                                            <div className="h-8 bg-white border border-gray-100 rounded-lg shadow-sm" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-between items-center px-1">
                                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">+ Add New Row</div>
                                    <div className="text-[10px] font-black text-gray-300 uppercase underline tracking-widest italic">Dynamic Table</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ModuleBuilder: React.FC = () => {
    const { state, dispatch } = useFormBuilder();

    return (
        <div className="space-y-12 pb-24">
            {state.template.modules.map((module) => (
                <div key={module.moduleId} className="space-y-6">
                    <header className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black">
                                {state.template.modules.indexOf(module) + 1}
                            </div>
                            <input
                                type="text"
                                value={module.moduleName}
                                onChange={(e) => dispatch({ type: 'UPDATE_MODULE_NAME', moduleId: module.moduleId, name: e.target.value })}
                                className="text-2xl font-black text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full"
                            />
                        </div>
                    </header>

                    <div className="grid gap-4">
                        {module.questions.map((question) => (
                            <QuestionCard key={question.questionId} question={question} />
                        ))}

                        <button
                            onClick={() => dispatch({ type: 'OPEN_TYPE_SELECTOR', moduleId: module.moduleId })}
                            className="mt-4 flex flex-col items-center justify-center p-8 rounded-3xl border-4 border-dashed border-gray-100 text-gray-300 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-400 transition-all group scale-100 active:scale-95"
                        >
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all mb-4">
                                <Plus size={24} />
                            </div>
                            <span className="font-black uppercase tracking-widest text-xs">Add New Question</span>
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={() => dispatch({ type: 'ADD_MODULE', name: 'New Module' })}
                className="w-full py-4 text-sm font-black text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl hover:bg-gray-50 hover:text-gray-600 transition-all uppercase tracking-widest"
            >
                Create New Module
            </button>
        </div>
    );
};

export default ModuleBuilder;
