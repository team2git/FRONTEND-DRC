import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Upload, FileSpreadsheet, Loader2, ArrowRightLeft, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { type ProfileMapping } from '../../../api/profileMappingService';
import {
    downloadCSVTemplate,
    parseCSVText,
    validateTemplateFilename,
    validateColumnMatching,
    analyzeSpreadsheetData
} from '../../../utils/excelTemplates';

// ——— Import Modal ——————————————————————————————————————————————————————————
export const ImportModal: React.FC<{
    onClose: () => void;
    onImport: (file: File, type: 'woreda' | 'household', parsedData?: any[]) => void;
    importing: boolean;
}> = ({ onClose, onImport, importing }) => {
    const [activeTab, setActiveTab] = useState<'woreda' | 'household'>('woreda');
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<any[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [columnAnalysis, setColumnAnalysis] = useState<any | null>(null);
    const [dataAnalysis, setDataAnalysis] = useState<any | null>(null);
    const [showPreview, setShowPreview] = useState<boolean>(false);

    const handleFileSelect = (selectedFile: File | null) => {
        setFile(selectedFile);
        setParsedRows([]);
        setParseError(null);
        setColumnAnalysis(null);
        setDataAnalysis(null);
        setShowPreview(false);

        if (selectedFile) {
            // 1. Template Filename Validation
            const nameCheck = validateTemplateFilename(selectedFile.name, activeTab);
            if (!nameCheck.valid) {
                setParseError(nameCheck.error || 'Filename does not match selected template mode.');
                return;
            }

            // 2. Parse File & Validate Columns
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    if (text) {
                        const { headers, rows } = parseCSVText(text);

                        if (rows.length === 0) {
                            setParseError('File is empty or headers are unreadable. Please download the sample template.');
                            return;
                        }

                        // Column Matching Validation
                        const colCheck = validateColumnMatching(headers, activeTab);
                        if (colCheck.missingRequiredColumns.length > 0) {
                            setParseError(`Database Schema Error: Missing required columns: [${colCheck.missingRequiredColumns.join(', ')}]. Please use the official Excel template.`);
                            return;
                        }

                        // Spreadsheet Data Analysis
                        const analysis = analyzeSpreadsheetData(rows, activeTab);

                        setParsedRows(rows);
                        setColumnAnalysis(colCheck);
                        setDataAnalysis(analysis);
                        setShowPreview(true);
                    }
                } catch (err: any) {
                    setParseError('Failed to parse spreadsheet content. Make sure it is a valid CSV or Excel file.');
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-3xl bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#172358] text-white flex items-center justify-center shadow-md shadow-[#172358]/20">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#172358] tracking-tight">Bulk Assessment Import Engine</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database Schema Validation & Spreadsheet Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('woreda'); setFile(null); setParsedRows([]); setShowPreview(false); setParseError(null); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'woreda' ? 'bg-[#172358] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        Woreda Assessment (CGD/KII)
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('household'); setFile(null); setParsedRows([]); setShowPreview(false); setParseError(null); }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'household' ? 'bg-[#172358] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        Household Assessment
                    </button>
                </div>

                {!showPreview ? (
                    <div className="space-y-6">
                        {/* Download Template Banner */}
                        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-[#172358]">Standardized Database Template Required</p>
                                <p className="text-[10px] font-bold text-slate-500">Download formatted {activeTab === 'woreda' ? 'Woreda CGD/KII' : 'Household'} Excel file with all model columns.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => downloadCSVTemplate(activeTab)}
                                className="px-4 py-2.5 bg-[#172358] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#111a42] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <FileSpreadsheet size={14} /> Download Template
                            </button>
                        </div>

                        {/* File Dropzone */}
                        <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center hover:border-[#172358] hover:bg-slate-50/50 transition-all cursor-pointer group relative overflow-hidden">
                            <input type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFileSelect(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center gap-3">
                                <FileSpreadsheet size={44} className="text-slate-300 group-hover:text-[#172358] transition-colors" />
                                <p className="text-sm font-black text-slate-900">{file ? file.name : 'Drop Excel/CSV file here or click to select'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filename and Database Column Matching Required</p>
                            </div>
                        </div>

                        {/* Validation Error Banner */}
                        {parseError && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs font-bold">
                                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black">Validation Failure</p>
                                    <p className="text-[11px] font-medium text-rose-600 mt-0.5">{parseError}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Step 2: Data Analysis & Arranged Excel Preview Page */
                    <div className="space-y-5 overflow-y-auto pr-1 flex-1">

                        {/* Column Matching Badge */}
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-emerald-600" />
                                <div>
                                    <p className="text-xs font-black text-emerald-900">Database Schema Match Verified ({columnAnalysis?.matchPercentage}%)</p>
                                    <p className="text-[10px] font-bold text-emerald-700">{columnAnalysis?.matchedCount} of {columnAnalysis?.totalExpected} expected model columns matched cleanly.</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider">
                                Template Matched
                            </span>
                        </div>

                        {/* Analysis KPI Summary Cards */}
                        {dataAnalysis && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Rows</p>
                                    <p className="text-lg font-black text-[#172358]">{dataAnalysis.totalRows}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Population Covered</p>
                                    <p className="text-lg font-black text-slate-900">{dataAnalysis.totalPopulation.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sub-Cities Covered</p>
                                    <p className="text-lg font-black text-slate-900">{dataAnalysis.uniqueSubcities} Subcities</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Woredas Covered</p>
                                    <p className="text-lg font-black text-slate-900">{dataAnalysis.uniqueWoredas} Woredas</p>
                                </div>
                            </div>
                        )}

                        {/* Arranged Interactive Spreadsheet Preview Table */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="bg-[#172358] text-white px-5 py-3 flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-wider text-blue-200">Import Data Preview & Column Mapping</h4>
                                <span className="text-[10px] font-bold text-slate-300">Showing first {Math.min(5, parsedRows.length)} of {parsedRows.length} rows</span>
                            </div>
                            <div className="overflow-x-auto max-h-48">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5">Row</th>
                                            <th className="px-4 py-2.5">Subcity</th>
                                            <th className="px-4 py-2.5">Woreda</th>
                                            <th className="px-4 py-2.5">{activeTab === 'woreda' ? 'Population' : 'Block / House'}</th>
                                            <th className="px-4 py-2.5">{activeTab === 'woreda' ? 'Primary Hazard' : 'Household Head'}</th>
                                            <th className="px-4 py-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                                        {parsedRows.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-mono text-[10px] text-slate-400">#{idx + 1}</td>
                                                <td className="px-4 py-2 font-black text-slate-900">{row.Subcity || row.subcity || '—'}</td>
                                                <td className="px-4 py-2">{row.Woreda || row.woreda || '—'}</td>
                                                <td className="px-4 py-2">
                                                    {activeTab === 'woreda'
                                                        ? (Number(row['Total Population'] || row.total_population || 0)).toLocaleString()
                                                        : `${row.Block || 'Block 01'} - ${row['House No'] || 'H-01'}`
                                                    }
                                                </td>
                                                <td className="px-4 py-2">
                                                    {activeTab === 'woreda'
                                                        ? (row['Primary Hazard Name'] || 'Flash Flood')
                                                        : (row['Household Head Name'] || 'Head')}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-[#172358] border border-blue-200 rounded-full text-[9px] font-black uppercase">
                                                        {row.Status || row.status || 'Draft'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    {showPreview ? (
                        <button
                            onClick={() => file && onImport(file, activeTab, parsedRows)}
                            disabled={importing || parsedRows.length === 0}
                            className="flex-1 py-3.5 bg-[#172358] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl hover:bg-[#111a42] disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {importing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {importing ? 'Ingesting into Database...' : `Confirm & Import ${parsedRows.length} Assessment Records`}
                        </button>
                    ) : (
                        <button
                            disabled={!file}
                            className="flex-1 py-3.5 bg-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 cursor-not-allowed"
                        >
                            Select Excel File to Preview
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ——— Sync Interview Modal ———————————————————————————————————————————————————
export const SyncInterviewModal: React.FC<{
    onClose: () => void;
    onSync: (params: any) => void;
    mappings: ProfileMapping[];
    syncing: boolean;
    initialResponseId?: string;
}> = ({ onClose, onSync, mappings, syncing, initialResponseId }) => {
    const [responseId, setResponseId] = useState(initialResponseId || '');
    const [mappingId, setMappingId] = useState('');

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <ArrowRightLeft size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Sync From Survey</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct interview ingestion</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Interview Response ID</label>
                        <input type="text" value={responseId} onChange={e => setResponseId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none border focus:border-indigo-500" placeholder="Paste response ID..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mapping Template</label>
                        <select value={mappingId} onChange={e => setMappingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500">
                            <option value="">Select Template...</option>
                            {mappings.filter(m => m.status === 'Published').map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={() => onSync({ responseId, mappingId })}
                        disabled={!responseId || !mappingId || syncing}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Sync Now
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ——— Sync Preview Modal —————————————————————————————————————————————————————
export const SyncPreviewModal: React.FC<{
    data: any;
    onClose: () => void;
    onConfirm: () => void;
    syncing: boolean;
}> = ({ data, onClose, onConfirm, syncing }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="bg-amber-50 p-8 border-b border-amber-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-amber-900 tracking-tight">Sync Quality Review</h3>
                    <p className="text-amber-700/60 text-xs font-bold uppercase tracking-widest">Review mapped data before database commit</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Location</p>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <p className="text-sm font-black text-slate-900">{data.profileData.location.subcity}, Woreda {data.profileData.location.woreda}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Block {data.profileData.location.block} • {data.profileData.location.house_no}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity Metrics</p>
                        <div className="bg-slate-900 rounded-2xl p-4 text-white">
                            <p className="text-sm font-black">Score Match: {data.success ? '100%' : 'Partial'}</p>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight mt-1">{data.profileData.demographics.total_population} Impacted Inhabitants</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapping Analysis</p>
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
                        {Object.entries(data.profileData.household_profile?.demographics || {}).slice(0, 4).map(([k, v]: [any, any]) => (
                            <div key={k} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <span className="text-xs font-bold text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                <span className="text-xs font-black text-slate-900">{v?.toString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
                <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all font-outfit">Discard</button>
                <button
                    onClick={onConfirm}
                    disabled={syncing}
                    className="flex-2 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 px-12"
                >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Sync & Finalize
                </button>
            </div>
        </motion.div>
    </motion.div>
);
