import React from 'react';
import { Settings2, Trash2, Info, Layout } from 'lucide-react';
import { useFormBuilder } from '../../../context/FormBuilderContext';
import OptionsEditor from './OptionsEditor';
import MatrixEditor from './MatrixEditor';
import TableEditor from './TableEditor';

const QuestionEditor: React.FC = () => {
    const { state, dispatch } = useFormBuilder();
    const { activeQuestionId, template } = state;

    // Find the active question
    let activeQuestion: any = null;
    template.modules.forEach(m => {
        const found = m.questions.find(q => q.questionId === activeQuestionId);
        if (found) activeQuestion = found;
    });

    if (!activeQuestion) {
        return (
            <div className="w-96 border-l bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4 text-2xl">
                    <Layout />
                </div>
                <h3 className="font-bold text-gray-900">No Question Selected</h3>
                <p className="text-sm text-gray-400 mt-2">Select a question from the canvas to edit its properties</p>
            </div>
        );
    }

    const update = (updates: any) => {
        dispatch({ type: 'UPDATE_QUESTION', questionId: activeQuestion.questionId, updates });
    };

    const isChoiceType = ['radio', 'checkbox', 'select'].includes(activeQuestion.answerType);
    const isInputType = ['text', 'textarea', 'number', 'date', 'email', 'phone'].includes(activeQuestion.answerType);

    return (
        <div className="w-96 border-l bg-white h-full overflow-y-auto shadow-2xl z-10 flex flex-col">
            <header className="p-6 border-b flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                        <Settings2 size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Configuration</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{activeQuestion.answerType}</p>
                    </div>
                </div>
                <button
                    onClick={() => dispatch({ type: 'REMOVE_QUESTION', questionId: activeQuestion.questionId })}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <Trash2 size={18} />
                </button>
            </header>

            <div className="p-6 space-y-8">
                {/* 🟢 Common Configuration */}
                <section className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Code</label>
                            <input
                                type="text"
                                value={activeQuestion.questionCode}
                                onChange={(e) => update({ questionCode: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                placeholder="q101"
                            />
                        </div>
                        <div className="flex flex-col justify-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={activeQuestion.required}
                                    onChange={(e) => update({ required: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">Required?</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Label / Label</label>
                        <textarea
                            value={activeQuestion.label}
                            onChange={(e) => update({ label: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[80px]"
                            placeholder="Type your question text here..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Helper Text / Instructions</label>
                        <textarea
                            value={activeQuestion.helperText}
                            onChange={(e) => update({ helperText: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl p-3 text-[11px] italic text-gray-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[60px]"
                            placeholder="Add instructions for data collectors..."
                        />
                    </div>
                </section>

                {/* 🟢 Dynamic Section: Input Validation */}
                {isInputType && (
                    <section className="pt-6 border-t space-y-4">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Info size={14} /> Validation & Hints
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Placeholder</label>
                                <input
                                    type="text"
                                    value={activeQuestion.validation?.placeholder || ''}
                                    onChange={(e) => update({ validation: { ...activeQuestion.validation, placeholder: e.target.value } })}
                                    className="w-full bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Min Value / Len</label>
                                    <input
                                        type="text"
                                        value={activeQuestion.validation?.min || ''}
                                        onChange={(e) => update({ validation: { ...activeQuestion.validation, min: e.target.value } })}
                                        className="w-full bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Max Value / Len</label>
                                    <input
                                        type="text"
                                        value={activeQuestion.validation?.max || ''}
                                        onChange={(e) => update({ validation: { ...activeQuestion.validation, max: e.target.value } })}
                                        className="w-full bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 🟢 Dynamic Section: Options Builder */}
                {isChoiceType && (
                    <section className="pt-6 border-t">
                        <OptionsEditor
                            options={activeQuestion.options}
                            onChange={(options) => update({ options })}
                        />
                    </section>
                )}

                {/* 🟢 Dynamic Section: Matrix Config */}
                {activeQuestion.answerType === 'matrix' && (
                    <section className="pt-6 border-t">
                        <MatrixEditor
                            config={activeQuestion.matrixConfig}
                            onChange={(matrixConfig) => update({ matrixConfig })}
                        />
                    </section>
                )}

                {/* 🟢 Dynamic Section: Table Config */}
                {activeQuestion.answerType === 'table' && (
                    <section className="pt-6 border-t">
                        <TableEditor
                            config={activeQuestion.tableConfig}
                            onChange={(tableConfig) => update({ tableConfig })}
                        />
                    </section>
                )}
            </div>
        </div>
    );
};

export default QuestionEditor;
