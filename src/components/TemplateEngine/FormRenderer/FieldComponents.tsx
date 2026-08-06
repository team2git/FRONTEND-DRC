import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { MapPin, Upload, Cloud, Plus, Trash2 } from 'lucide-react';

interface FieldProps {
    field: any;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    setValue?: (name: string, value: any) => void;
    watch?: (name: string) => any;
}

export const TextField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-1">
        <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.systemAutoFill && field.systemAutoFill !== 'none' && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                    <Cloud size={10} className="fill-brand-500/20" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">System Auto-filled</span>
                </div>
            )}
        </div>
        <input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
            {...register(field.questionCode, { required: field.required })}
            placeholder={field.helpText}
            readOnly={field.systemAutoFill && field.systemAutoFill !== 'none'}
            className={`w-full p-2.5 border rounded-lg outline-none transition-all ${field.systemAutoFill && field.systemAutoFill !== 'none'
                ? 'bg-brand-50/30 border-brand-100 text-gray-800'
                : errors[field.questionCode]
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:bg-white'
                }`}
        />
        {errors[field.questionCode] && (
            <p className="text-xs text-red-500 font-medium">{field.label} is required</p>
        )}
    </div>
);

export const RadioField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(field.options || []).map((opt: any) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border-gray-100">
                    <input
                        type="radio"
                        value={opt.value}
                        {...register(field.questionCode, { required: field.required })}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
            ))}
        </div>
        {errors[field.questionCode] && (
            <p className="text-xs text-red-500 font-medium">Please select an option</p>
        )}
    </div>
);

export const SelectField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-1">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <select
            {...register(field.questionCode, { required: field.required })}
            className={`w-full p-2.5 border rounded-lg outline-none transition-all ${errors[field.questionCode] ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:bg-white'
                }`}
        >
            <option value="">Select an option</option>
            {(field.options || []).map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export const TextareaField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-1">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            {...register(field.questionCode, { required: field.required })}
            placeholder={field.helpText}
            rows={4}
            className={`w-full p-3 border rounded-lg outline-none transition-all resize-y min-h-[120px] ${
                errors[field.questionCode]
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:bg-white'
            }`}
        />
        {errors[field.questionCode] && (
            <p className="text-xs text-red-500 font-medium">{field.label} is required</p>
        )}
    </div>
);

export const CheckboxField: React.FC<FieldProps> = ({ field, register, errors }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(field.options || []).map((opt: any) => (
                <label
                    key={opt.value}
                    className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border-gray-100"
                >
                    <input
                        type="checkbox"
                        value={opt.value}
                        {...register(field.questionCode, { required: field.required })}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
            ))}
        </div>
        {errors[field.questionCode] && (
            <p className="text-xs text-red-500 font-medium">Please select at least one option</p>
        )}
    </div>
);

export const MatrixField: React.FC<FieldProps> = ({ field, register }) => {
    const columns = field.options?.columns || field.matrixConfig?.columns || [
        { label: 'Low', value: '1' },
        { label: 'Medium', value: '2' },
        { label: 'High', value: '3' }
    ];
    const rows = field.options?.rows || field.matrixConfig?.rows || [
        { label: 'Frequency', value: 'freq' },
        { label: 'Severity', value: 'sev' }
    ];

    return (
        <div className="space-y-3 overflow-x-auto">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 p-3 text-left">Category</th>
                        {columns.map((col: any) => (
                            <th key={col.value} className="border border-gray-200 p-3 text-center">{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: any) => (
                        <tr key={row.value} className="hover:bg-gray-50">
                            <td className="border border-gray-200 p-3 font-medium text-gray-600">{row.label}</td>
                            {columns.map((col: any) => (
                                <td key={col.value} className="border border-gray-200 p-3 text-center">
                                    <input
                                        type="radio"
                                        value={col.value}
                                        {...register(`${field.questionCode}.${row.value}`, { required: field.required })}
                                        className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const TableField: React.FC<FieldProps> = ({ field, register }) => {
    const columns = field.options?.columns || field.tableConfig?.columns || [{ label: 'Name', value: 'name', type: 'text' }];
    const allowAddRow = field.tableConfig?.allowAddRow !== false;
    const createRowId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const [rows, setRows] = useState<string[]>(() => [createRowId()]);

    useEffect(() => {
        setRows([createRowId()]);
    }, [field.questionCode]);

    const addRow = () => setRows((current) => [...current, createRowId()]);
    const removeRow = (index: number) => {
        setRows((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {columns.map((col: any) => (
                                <th key={col.value} className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{col.label}</th>
                            ))}
                            {allowAddRow && <th className="p-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((rowId, visualIndex) => (
                            <tr key={rowId}>
                                {columns.map((col: any) => (
                                    <td key={col.value} className="p-2">
                                        <input
                                            type={col.type || 'text'}
                                            {...register(`${field.questionCode}.${rowId}.${col.value}`)}
                                            className="w-full p-2 border border-transparent focus:border-brand-300 rounded outline-none transition-all placeholder:text-gray-300"
                                            placeholder={`Row ${visualIndex + 1}`}
                                        />
                                    </td>
                                ))}
                                {allowAddRow && (
                                    <td className="p-2 align-top">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(visualIndex)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-30"
                                            disabled={rows.length === 1}
                                        >
                                            <Trash2 size={14} />
                                            Remove
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {allowAddRow && (
                <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
                >
                    <Plus size={16} /> Add Row
                </button>
            )}
        </div>
    );
};

export const GeoField: React.FC<FieldProps> = ({ field, register, setValue, watch }) => {
    const value = watch?.(field.questionCode);

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setValue?.(field.questionCode, {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: new Date().toISOString()
                });
            });
        }
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500 flex items-center gap-3">
                    <MapPin size={18} className="text-brand-500" />
                    {value ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : 'No location captured'}
                </div>
                <button
                    type="button"
                    onClick={handleGetLocation}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors flex items-center gap-2"
                >
                    Capture
                </button>
            </div>
            <input type="hidden" {...register(field.questionCode, { required: field.required })} />
        </div>
    );
};

export const FileField: React.FC<FieldProps> = ({ field, register, setValue }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (setValue) {
                setValue(field.questionCode, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: base64
                });
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50 hover:border-brand-400 cursor-pointer transition-all group">
                <Upload className="text-gray-400 group-hover:text-brand-500 mb-2" size={28} />
                <span className="text-sm text-gray-500 font-medium">Click or capture photo / attachment</span>
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
            <input type="hidden" {...register(field.questionCode, { required: field.required })} />
        </div>
    );
};

export const SignatureField: React.FC<FieldProps> = ({ field, register, setValue, watch }) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const value = watch?.(field.questionCode);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e293b';
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && setValue) {
            setValue(field.questionCode, canvas.toDataURL());
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (setValue) setValue(field.questionCode, '');
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {value && (
                    <button type="button" onClick={clearCanvas} className="text-xs text-red-500 hover:underline">
                        Clear
                    </button>
                )}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 touch-none cursor-crosshair"
                />
            </div>
            <input type="hidden" {...register(field.questionCode, { required: field.required })} />
        </div>
    );
};

export const RatingField: React.FC<FieldProps> = ({ field, register, setValue, watch }) => {
    const currentRating = Number(watch?.(field.questionCode) || 0);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setValue?.(field.questionCode, star)}
                        className={`text-2xl transition-transform hover:scale-110 ${currentRating >= star ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                        ★
                    </button>
                ))}
                <span className="ml-2 text-xs text-gray-500">({currentRating} / 5)</span>
            </div>
            <input type="hidden" {...register(field.questionCode, { required: field.required })} />
        </div>
    );
};

export const SwitchField: React.FC<FieldProps> = ({ field, register, setValue, watch }) => {
    const isChecked = !!watch?.(field.questionCode);

    return (
        <div className="space-y-2">
            <label className="flex items-center cursor-pointer gap-3">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setValue?.(field.questionCode, e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 relative"></div>
                <span className="text-sm font-semibold text-gray-700">{field.label}</span>
            </label>
            <input type="hidden" {...register(field.questionCode, { required: field.required })} />
        </div>
    );
};
