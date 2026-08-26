import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, PlusCircle, HelpCircle, X, Check } from 'lucide-react';

export interface DuplicateConflictDetails {
    house_no: string;
    woreda?: string;
    subcity?: string;
    targetType: 'household' | 'woreda';
    existingId?: string;
    existingData?: any;
}

interface DuplicateHousePromptModalProps {
    isOpen: boolean;
    conflict: DuplicateConflictDetails | null;
    onClose: () => void;
    onUpdateExisting: () => void;
    onRegisterNewHouseNo: (newHouseNo: string) => void;
    onRegisterAsNoHouseNo: () => void;
}

export const DuplicateHousePromptModal: React.FC<DuplicateHousePromptModalProps> = ({
    isOpen,
    conflict,
    onClose,
    onUpdateExisting,
    onRegisterNewHouseNo,
    onRegisterAsNoHouseNo
}) => {
    const [isEditingNewNo, setIsEditingNewNo] = useState(false);
    const [customHouseNo, setCustomHouseNo] = useState('');

    if (!isOpen || !conflict) return null;

    const isHousehold = conflict.targetType === 'household';
    const entityName = isHousehold ? 'Household Profile' : 'Woreda Assessment';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-amber-200 dark:border-amber-900/50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                                <AlertTriangle size={24} className="text-white" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-full">
                                    Duplicate House No Detected
                                </span>
                                <h3 className="text-lg font-black tracking-tight mt-1">House #{conflict.house_no} Already Exists</h3>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            A <span className="font-bold text-slate-900 dark:text-white">{entityName}</span> with House Number{' '}
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                {conflict.house_no}
                            </span>{' '}
                            is already registered in{' '}
                            <span className="font-bold">{conflict.woreda || 'this Woreda'}</span>.
                        </p>

                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Please choose how you would like to proceed:
                        </p>

                        {/* Action Choice 1: Update Existing Record */}
                        <button
                            type="button"
                            onClick={onUpdateExisting}
                            className="w-full text-left p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition-all flex items-start gap-3.5 group cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <RefreshCw size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                                    Update Existing Record
                                </h4>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                                    Merge this survey data into the existing record for House #{conflict.house_no}.
                                </p>
                            </div>
                        </button>

                        {/* Action Choice 2: Register New House No */}
                        <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 transition-all">
                            {!isEditingNewNo ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditingNewNo(true);
                                        setCustomHouseNo('');
                                    }}
                                    className="w-full text-left flex items-start gap-3.5 group cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                                        <PlusCircle size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                                            Register with a New House No
                                        </h4>
                                        <p className="text-[11px] text-blue-700 dark:text-blue-400/80 mt-0.5">
                                            Provide a different unique house number (e.g. {conflict.house_no}-B).
                                        </p>
                                    </div>
                                </button>
                            ) : (
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest block">
                                        Enter New House Number
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={customHouseNo}
                                            onChange={e => setCustomHouseNo(e.target.value)}
                                            placeholder={`e.g. ${conflict.house_no}-B`}
                                            className="flex-1 bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            disabled={!customHouseNo.trim()}
                                            onClick={() => {
                                                if (customHouseNo.trim()) {
                                                    onRegisterNewHouseNo(customHouseNo.trim());
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <Check size={14} /> Apply
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingNewNo(false)}
                                            className="p-2 text-slate-500 hover:text-slate-700 text-xs font-bold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Choice 3: Unnumbered / No House No */}
                        <button
                            type="button"
                            onClick={onRegisterAsNoHouseNo}
                            className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 transition-all flex items-start gap-3.5 group cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <HelpCircle size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                                    Register as "No House No" / Unnumbered
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Save as a new separate survey record for a premise with no official house number.
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                        >
                            Close & Review
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DuplicateHousePromptModal;
