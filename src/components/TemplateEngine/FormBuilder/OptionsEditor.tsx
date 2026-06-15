import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Option } from '../../../context/FormBuilderContext';

interface OptionsEditorProps {
    options: Option[];
    onChange: (options: Option[]) => void;
}

const OptionsEditor: React.FC<OptionsEditorProps> = ({ options, onChange }) => {
    const addOption = () => {
        const newVal = `opt_${options.length + 1}`;
        onChange([...options, { label: 'New Option', value: newVal, hasAdditionalInput: false }]);
    };

    const updateOption = (idx: number, updates: Partial<Option>) => {
        const newOpts = [...options];
        newOpts[idx] = { ...newOpts[idx], ...updates };
        onChange(newOpts);
    };

    const removeOption = (idx: number) => {
        onChange(options.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Answer Options</label>
                <button
                    onClick={addOption}
                    className="flex items-center gap-1 text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase hover:bg-blue-100 transition-colors"
                >
                    <Plus size={12} /> Add Option
                </button>
            </div>

            <div className="space-y-3">
                {options.map((opt, idx) => (
                    <div key={idx} className="bg-gray-50 border rounded-2xl p-4 space-y-3 relative group">
                        <button
                            onClick={() => removeOption(idx)}
                            className="absolute -top-2 -right-2 bg-white shadow-sm border p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Label</label>
                                <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => updateOption(idx, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                    className="w-full bg-transparent border-b border-gray-200 text-sm py-1 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={opt.hasAdditionalInput}
                                onChange={(e) => updateOption(idx, { hasAdditionalInput: e.target.checked, additionalInput: e.target.checked ? { type: 'text', label: 'Please specify' } : undefined })}
                                className="rounded text-blue-600"
                            />
                            <span className="text-xs font-medium text-gray-600 italic">Has additional input? (e.g. "Other")</span>
                        </div>

                        {opt.hasAdditionalInput && opt.additionalInput && (
                            <div className="mt-2 p-3 bg-white rounded-xl border border-blue-100 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-blue-400 uppercase">Input Type</label>
                                    <select
                                        value={opt.additionalInput.type}
                                        onChange={(e) => updateOption(idx, { additionalInput: { ...opt.additionalInput!, type: e.target.value as any } })}
                                        className="w-full text-xs bg-transparent border-none p-0 focus:ring-0"
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="number">Number</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-blue-400 uppercase">Input Label</label>
                                    <input
                                        type="text"
                                        value={opt.additionalInput.label}
                                        onChange={(e) => updateOption(idx, { additionalInput: { ...opt.additionalInput!, label: e.target.value } })}
                                        className="w-full text-xs bg-transparent border-none p-0 focus:ring-0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OptionsEditor;
