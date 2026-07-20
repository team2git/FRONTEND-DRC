import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Upload, FileSpreadsheet, Loader2, ArrowRightLeft, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { type ProfileMapping } from '../../../api/profileMappingService';

// ——— Import Modal ——————————————————————————————————————————————————————————
export const ImportModal: React.FC<{
    onClose: () => void;
    onImport: (file: File) => void;
    importing: boolean;
}> = ({ onClose, onImport, importing }) => {
    const [file, setFile] = useState<File | null>(null);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Upload size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Bulk Import Profiles</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Excel (XLSX) / CSV ingestion</p>
                    </div>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group relative overflow-hidden">
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-3">
                        <FileSpreadsheet size={40} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <p className="text-sm font-black text-slate-900">{file ? file.name : 'Drop file or click to select'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standardized DRM template required</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={() => file && onImport(file)}
                        disabled={!file || importing}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                        {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {importing ? 'Importing...' : 'Start Import'}
                    </button>
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
                            {mappings.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={() => onSync({ responseId, mappingId, dryRun: true })}
                        disabled={!responseId || !mappingId || syncing}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Sync Preview
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
