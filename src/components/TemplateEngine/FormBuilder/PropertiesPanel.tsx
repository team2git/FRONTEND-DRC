import React from 'react';
import { useTemplateStore } from '../../../context/TemplateStore';
import { Trash2, Plus, Settings2 } from 'lucide-react';

const PropertiesPanel: React.FC = () => {
    const { template, selectedFieldId, updateField, removeField } = useTemplateStore();

    // Find the selected field
    let field: any = null;
    template.modules.forEach(m => {
        m.sections.forEach(s => {
            const f = s.fields.find(f => f.fieldId === selectedFieldId);
            if (f) field = f;
        });
    });

    if (!field) {
        return (
            <div className="w-80 border-l bg-white p-6 flex flex-col items-center justify-center text-center text-gray-400">
                <Settings2 size={48} className="mb-4 opacity-20" />
                <p>Select a question to edit its properties</p>
            </div>
        );
    }

    const handleUpdate = (updates: any) => {
        updateField(field.fieldId, updates);
    };

    return (
        <div className="w-80 border-l bg-white h-full overflow-y-auto p-6 space-y-8">
            <header className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Properties</h3>
                <button
                    onClick={() => removeField(field.fieldId)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                >
                    <Trash2 size={18} />
                </button>
            </header>

            <div className="space-y-4">
                {/* Field Type Selection */}
                {(field.type !== 'note' && field.type !== 'tip' && field.type !== 'header') && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question Type</label>
                        <select
                            value={field.type}
                            onChange={(e) => handleUpdate({ type: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Answer</option>
                            <option value="number">Numeric</option>
                            <option value="radio">Single Choice (Radio)</option>
                            <option value="checkbox">Multiple Choice (Checkbox)</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="matrix">Matrix / Table</option>
                            <option value="date">Date</option>
                        </select>
                    </div>
                )}

                {(field.type !== 'note' && field.type !== 'tip' && field.type !== 'header') && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question Code</label>
                        <input
                            type="text"
                            value={field.questionCode}
                            placeholder="e.g. q101"
                            onChange={(e) => handleUpdate({ questionCode: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        {(['note', 'tip', 'header'].includes(field.type)) ? 'Text Content' : 'Question Label'}
                    </label>
                    <textarea
                        value={field.label}
                        onChange={(e) => handleUpdate({ label: e.target.value })}
                        rows={3}
                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Help Text / Enumerator Instructions</label>
                    <textarea
                        value={field.helpText}
                        onChange={(e) => handleUpdate({ helpText: e.target.value })}
                        rows={3}
                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Instructions for the user..."
                    />
                </div>

                {(field.type !== 'note' && field.type !== 'tip' && field.type !== 'header') && (
                    <>
                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="chk-required"
                                checked={field.required}
                                onChange={(e) => handleUpdate({ required: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="chk-required" className="text-sm font-medium text-gray-700 cursor-pointer">Required Question</label>
                        </div>

                        {/* Choice Settings */}
                        {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Answer Options</label>
                                    <button
                                        onClick={() => handleUpdate({ options: [...field.options, { label: 'New Option', value: String(field.options.length + 1) }] })}
                                        className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded"
                                    >
                                        <Plus size={12} /> Add Option
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {field.options?.map((opt: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg group">
                                            <div className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}</div>
                                            <input
                                                type="text"
                                                value={opt.label}
                                                onChange={(e) => {
                                                    const newOpts = [...field.options];
                                                    newOpts[idx].label = e.target.value;
                                                    handleUpdate({ options: newOpts });
                                                }}
                                                className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newOpts = field.options.filter((_: any, i: number) => i !== idx);
                                                    handleUpdate({ options: newOpts });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Matrix Settings */}
                        {field.type === 'matrix' && (
                            <div className="space-y-6 pt-4 border-t">
                                {/* Columns Editor */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Columns / Header Labels</label>
                                        <button
                                            onClick={() => handleUpdate({
                                                matrixConfig: { ...field.matrixConfig, columns: [...(field.matrixConfig?.columns || []), { label: 'Col', value: 'col' }] }
                                            })}
                                            className="text-blue-600 text-xs font-bold p-1 hover:bg-blue-50 rounded"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    {field.matrixConfig?.columns?.map((col: any, idx: number) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={col.label}
                                                onChange={(e) => {
                                                    const newCols = [...field.matrixConfig.columns];
                                                    newCols[idx] = { ...newCols[idx], label: e.target.value, value: e.target.value };
                                                    handleUpdate({ matrixConfig: { ...field.matrixConfig, columns: newCols } });
                                                }}
                                                className="flex-1 border text-xs p-1 rounded"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Rows Editor */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Rows / Side Labels</label>
                                        <button
                                            onClick={() => handleUpdate({
                                                matrixConfig: { ...field.matrixConfig, rows: [...(field.matrixConfig?.rows || []), { label: 'Row', value: 'row' }] }
                                            })}
                                            className="text-blue-600 text-xs font-bold p-1 hover:bg-blue-50 rounded"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    {field.matrixConfig?.rows?.map((row: any, idx: number) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={row.label}
                                                onChange={(e) => {
                                                    const newRows = [...field.matrixConfig.rows];
                                                    newRows[idx] = { ...newRows[idx], label: e.target.value, value: e.target.value };
                                                    handleUpdate({ matrixConfig: { ...field.matrixConfig, rows: newRows } });
                                                }}
                                                className="flex-1 border text-xs p-1 rounded"
                                            />
                                            <button onClick={() => {
                                                const newRows = field.matrixConfig.rows.filter((_: any, i: number) => i !== idx);
                                                handleUpdate({ matrixConfig: { ...field.matrixConfig, rows: newRows } });
                                            }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Logic & Validation */}
                        <div className="pt-4 border-t space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Settings2 size={12} /> Logic & Validation
                            </h4>

                            {(field.type === 'number' || field.type === 'text') && (
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Min / Pattern"
                                        className="border rounded p-2 text-xs outline-none"
                                        value={field.validation?.min || ''}
                                        onChange={(e) => handleUpdate({ validation: { ...field.validation, min: e.target.value } })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Max / Match"
                                        className="border rounded p-2 text-xs outline-none"
                                        value={field.validation?.max || ''}
                                        onChange={(e) => handleUpdate({ validation: { ...field.validation, max: e.target.value } })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Visible if...</label>
                                <textarea
                                    className="w-full border rounded p-2 text-xs outline-none h-12"
                                    placeholder="Logic (e.g. q101 == '1')"
                                    value={field.conditionalLogic?.statement || ''}
                                    onChange={(e) => handleUpdate({ conditionalLogic: { statement: e.target.value } })}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel;
