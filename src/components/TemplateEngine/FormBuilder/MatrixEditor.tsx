import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface MatrixEditorProps {
    config: {
        rows: { label: string; value: string }[];
        columns: { label: string; value: string }[];
        cellType: 'radio' | 'checkbox' | 'number' | 'text';
    };
    onChange: (config: any) => void;
}

const MatrixEditor: React.FC<MatrixEditorProps> = ({ config, onChange }) => {
    const addRow = () => onChange({ ...config, rows: [...config.rows, { label: 'New Row', value: `r${config.rows.length + 1}` }] });
    const addCol = () => onChange({ ...config, columns: [...config.columns, { label: 'New Column', value: `c${config.columns.length + 1}` }] });

    return (
        <div className="space-y-6 pt-4 border-t">
            <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-3 block">Cell Input Type</label>
                <select
                    value={config.cellType}
                    onChange={(e) => onChange({ ...config, cellType: e.target.value })}
                    className="w-full border rounded-xl p-2 text-sm bg-gray-50 outline-none"
                >
                    <option value="radio">Single Choice (Radio)</option>
                    <option value="checkbox">Multiple Choice (Checkbox)</option>
                    <option value="number">Numeric Input</option>
                    <option value="text">Short Text</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Rows</label>
                        <button onClick={addRow} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Plus size={14} /></button>
                    </div>
                    {config.rows.map((row, idx) => (
                        <div key={idx} className="flex gap-2 group">
                            <input
                                type="text"
                                value={row.label}
                                onChange={(e) => {
                                    const nr = [...config.rows];
                                    nr[idx] = { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                    onChange({ ...config, rows: nr });
                                }}
                                className="flex-1 bg-white border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button onClick={() => onChange({ ...config, rows: config.rows.filter((_, i) => i !== idx) })} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Columns</label>
                        <button onClick={addCol} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Plus size={14} /></button>
                    </div>
                    {config.columns.map((col, idx) => (
                        <div key={idx} className="flex gap-2 group">
                            <input
                                type="text"
                                value={col.label}
                                onChange={(e) => {
                                    const nc = [...config.columns];
                                    nc[idx] = { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                    onChange({ ...config, columns: nc });
                                }}
                                className="flex-1 bg-white border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MatrixEditor;
