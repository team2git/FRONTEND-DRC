import React from 'react';
import { Trash2 } from 'lucide-react';

interface TableEditorProps {
    config: {
        columns: { label: string; type: string }[];
        allowAddRow: boolean;
    };
    onChange: (config: any) => void;
}

const TableEditor: React.FC<TableEditorProps> = ({ config, onChange }) => {
    const addCol = () => onChange({ ...config, columns: [...config.columns, { label: 'New Col', type: 'text' }] });

    return (
        <div className="space-y-6 pt-4 border-t">
            <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Dynamic Table Settings</label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Allow add row?</span>
                    <input
                        type="checkbox"
                        checked={config.allowAddRow}
                        onChange={(e) => onChange({ ...config, allowAddRow: e.target.checked })}
                        className="rounded text-blue-600"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Columns Configuration</label>
                    <button onClick={addCol} className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-1 rounded uppercase hover:bg-blue-100 transition-colors">
                        Add Column
                    </button>
                </div>
                {config.columns.map((col, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-xl border flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Col Label</label>
                            <input
                                type="text"
                                value={col.label}
                                onChange={(e) => {
                                    const nc = [...config.columns];
                                    nc[idx].label = e.target.value;
                                    onChange({ ...config, columns: nc });
                                }}
                                className="w-full bg-transparent border-b border-gray-200 text-xs py-1 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="w-32">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Input Type</label>
                            <select
                                value={col.type}
                                onChange={(e) => {
                                    const nc = [...config.columns];
                                    nc[idx].type = e.target.value;
                                    onChange({ ...config, columns: nc });
                                }}
                                className="w-full bg-transparent border-none p-0 text-xs focus:ring-0"
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="select">Dropdown</option>
                            </select>
                        </div>
                        <button onClick={() => onChange({ ...config, columns: config.columns.filter((_, i) => i !== idx) })} className="text-gray-300 hover:text-red-500 p-1">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableEditor;
