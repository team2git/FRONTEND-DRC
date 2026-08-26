import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, AlertTriangle, ChevronLeft, ChevronRight, Loader2,
    ShieldCheck, Shield, Leaf, MessageSquare, X,
    CheckCircle2, Sparkles, BarChart3, Zap, Plus, Trash2, RotateCcw,
    Pencil, Check
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    type WoredaAssessmentInput,
    createWoredaAssessment, updateWoredaAssessment, getWoredaAssessments,
    checkWoredaAssessmentHouseNo
} from '../../api/woredaProfileService';
import { getLocationHierarchy, type LocationHierarchyItem } from '../../api/locationService';
import { HAZARD_TYPES } from './woreda-profile/constants';
import { DuplicateHousePromptModal, type DuplicateConflictDetails } from '../../components/survey/DuplicateHousePromptModal';

type SubStep = 'cgd_hazards' | 'cgd_voice' | 'cgd_disaster_history' | 'kii_capacity' | 'kii_infrastructure' | 'kii_environment';

const STEP_LABELS = ['Location', 'CGD & KII Assessment', 'Review'];

// Logo brand colors: primary #465FFF (brand blue), accent #e11d48 (red), dark #101828

const emptyAssessment = (): WoredaAssessmentInput => ({
    location: { subcity: '', woreda: '', block: '', house_no: '' },
    assessment_date: new Date().toISOString().split('T')[0],
    remarks: '',
    hazards: HAZARD_TYPES.map(h => ({ hazard_name: h, frequency: '3', severity: '3', duration: '3', spatial_extent: '3', seasonality: '', historical_events: '' })),
    cgd_community_voice: { coping_strategies: '', collective_action_structure: '', suggested_interventions: '' },
    disaster_history: [],
    kii_capacity_indicators: { ews: 3, drm_committee: 3, focal_persons: 3, training_freq: 3, shelters: 3, community_structures: 3, emergency_services: 3, inter_sector_coordination: 3, institutional_strength: 3, recovery_plan: 3, budget: 3, drm_mainstreaming: 3 },
    kii_infrastructure_exposure: { health: 3, water: 3, energy: 3, emergency: 3, communications: 3 },
    kii_environmental_indicators: { drainage: 3, green_cover: 3, waste_mgmt: 3, pollution: 3 },
    status: 'Draft',
});

const ScoreSlider: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
    onDelete?: () => void;
    onRename?: (newLabel: string) => void;
}> = ({ label, value, onChange, onDelete, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedLabel, setEditedLabel] = useState(label);

    useEffect(() => {
        setEditedLabel(label);
    }, [label]);

    const handleSaveRename = () => {
        if (editedLabel.trim() && editedLabel.trim() !== label) {
            onRename?.(editedLabel.trim());
        }
        setIsEditing(false);
    };

    const scoreConfig = value <= 2
        ? { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', label: 'Low' }
        : value === 3
        ? { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', label: 'Moderate' }
        : { bg: 'bg-rose-100', text: 'text-rose-700', bar: 'bg-rose-500', label: 'High' };

    return (
        <div className="space-y-2 bg-white/60 rounded-2xl p-3.5 border border-slate-100 hover:border-[#465FFF]/20 hover:bg-white transition-all duration-200 group">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1">
                            <input
                                type="text"
                                value={editedLabel}
                                onChange={e => setEditedLabel(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSaveRename())}
                                className="bg-white border-2 border-[#465FFF] rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 outline-none w-full"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleSaveRename}
                                className="p-1 rounded-md bg-[#465FFF] text-white cursor-pointer"
                                title="Save Name"
                            >
                                <Check size={12} />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setEditedLabel(label); }}
                                className="p-1 rounded-md bg-slate-200 text-slate-600 cursor-pointer"
                                title="Cancel"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate">{label}</label>
                            {onRename && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-[#465FFF] hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                                    title="Edit Indicator Name"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                                    title="Remove Indicator"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </>
                    )}
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0 ${scoreConfig.bg} ${scoreConfig.text}`}>{value}/5 · {scoreConfig.label}</span>
            </div>
            <div className="relative">
                <input
                    type="range" min={1} max={5} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #465FFF ${((value - 1) / 4) * 100}%, #e2e8f0 ${((value - 1) / 4) * 100}%)`
                    }}
                />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Very Low (1)</span><span>Moderate (3)</span><span>Very High (5)</span>
            </div>
        </div>
    );
};

export const WoredaAssessmentForm: React.FC<{
    initial?: any;
    onClose: () => void;
    onSaved?: () => void;
}> = ({ initial, onClose, onSaved }) => {
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState<SubStep>('cgd_hazards');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchyItem[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    useEffect(() => {
        getLocationHierarchy()
            .then(data => setLocationHierarchy(data))
            .catch(() => {})
            .finally(() => setLoadingLocations(false));
    }, []);

    const [formData, setFormData] = useState<WoredaAssessmentInput>(
        initial ? {
            location: initial.location,
            assessment_date: initial.assessment_date || emptyAssessment().assessment_date,
            remarks: initial.remarks || '',
            hazards: initial.hazards || emptyAssessment().hazards,
            cgd_community_voice: initial.cgd_community_voice || emptyAssessment().cgd_community_voice,
            disaster_history: initial.disaster_history || [],
            kii_capacity_indicators: initial.kii_capacity_indicators || emptyAssessment().kii_capacity_indicators,
            kii_infrastructure_exposure: initial.kii_infrastructure_exposure || emptyAssessment().kii_infrastructure_exposure,
            kii_environmental_indicators: initial.kii_environmental_indicators || emptyAssessment().kii_environmental_indicators,
            status: initial.status || 'Draft',
        } : emptyAssessment()
    );

    const [assessmentId, setAssessmentId] = useState<string | null>(initial?._id || null);

    const [conflictModalOpen, setConflictModalOpen] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<DuplicateConflictDetails | null>(null);
    const [allowDuplicateUpdate, setAllowDuplicateUpdate] = useState(false);

    useEffect(() => {
        if (initial) {
            setFormData({
                location: initial.location || { subcity: '', woreda: '', block: '', house_no: '' },
                assessment_date: initial.assessment_date ? (initial.assessment_date.includes('T') ? initial.assessment_date.split('T')[0] : initial.assessment_date) : emptyAssessment().assessment_date,
                remarks: initial.remarks || '',
                hazards: initial.hazards || emptyAssessment().hazards,
                cgd_community_voice: initial.cgd_community_voice || emptyAssessment().cgd_community_voice,
                disaster_history: initial.disaster_history || [],
                kii_capacity_indicators: initial.kii_capacity_indicators || emptyAssessment().kii_capacity_indicators,
                kii_infrastructure_exposure: initial.kii_infrastructure_exposure || emptyAssessment().kii_infrastructure_exposure,
                kii_environmental_indicators: initial.kii_environmental_indicators || emptyAssessment().kii_environmental_indicators,
                status: initial.status || 'Draft',
            });
            if (initial._id) setAssessmentId(initial._id);
        }
    }, [initial]);

    useEffect(() => {
        const subcity = formData.location.subcity;
        const woreda = formData.location.woreda;
        const house_no = formData.location.house_no;
        if (!subcity || !woreda) {
            setAssessmentId(null);
            return;
        }

        if (initial && initial._id && initial.location?.subcity === subcity && initial.location?.woreda === woreda && (!house_no || initial.location?.house_no === house_no)) {
            setAssessmentId(initial._id);
            return;
        }

        let isCurrent = true;
        const queryParams: any = { subcity, woreda };
        if (house_no) queryParams.house_no = house_no;

        getWoredaAssessments(queryParams)
            .then(assessments => {
                if (isCurrent && assessments && assessments.length > 0) {
                    const match = assessments[0];
                    setAssessmentId(match._id);
                    setFormData({
                        location: match.location,
                        assessment_date: match.assessment_date ? match.assessment_date.split('T')[0] : emptyAssessment().assessment_date,
                        remarks: match.remarks || '',
                        hazards: match.hazards || emptyAssessment().hazards,
                        cgd_community_voice: match.cgd_community_voice || emptyAssessment().cgd_community_voice,
                        disaster_history: match.disaster_history || [],
                        kii_capacity_indicators: match.kii_capacity_indicators || emptyAssessment().kii_capacity_indicators,
                        kii_infrastructure_exposure: match.kii_infrastructure_exposure || emptyAssessment().kii_infrastructure_exposure,
                        kii_environmental_indicators: match.kii_environmental_indicators || emptyAssessment().kii_environmental_indicators,
                        status: match.status || 'Draft',
                    });
                } else if (isCurrent && !initial?._id) {
                    setAssessmentId(null);
                }
            })
            .catch(() => {});

        return () => {
            isCurrent = false;
        };
    }, [formData.location.subcity, formData.location.woreda, formData.location.house_no]);

    const selectedSubcityObj = locationHierarchy.find(s => s.name === formData.location.subcity);
    const availableWoredas = selectedSubcityObj?.woredas || [];

    const updateNested = (path: string, val: any) => {
        const keys = path.split('.');
        setFormData(prev => {
            const next = { ...prev } as any;
            let cur = next;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!cur[keys[i]]) cur[keys[i]] = {};
                cur = cur[keys[i]];
            }
            cur[keys[keys.length - 1]] = val;
            return next;
        });
    };

    const [selectedHazardToAdd, setSelectedHazardToAdd] = useState('');
    const [customHazardName, setCustomHazardName] = useState('');
    const [showCustomHazardInput, setShowCustomHazardInput] = useState(false);

    const [newCapacityName, setNewCapacityName] = useState('');
    const [newInfraName, setNewInfraName] = useState('');
    const [newEnvName, setNewEnvName] = useState('');

    const formatKeyToLabel = (key: string) => {
        const knownLabels: Record<string, string> = {
            ews: 'Early Warning System (EWS)',
            drm_committee: 'DRM Committee',
            focal_persons: 'Trained Focal Persons',
            training_freq: 'Training Frequency',
            shelters: 'Emergency Shelters',
            community_structures: 'Community Structures',
            emergency_services: 'Emergency Response Services',
            inter_sector_coordination: 'Inter-sector Coordination',
            institutional_strength: 'Institutional Strength',
            recovery_plan: 'Post-Disaster Recovery Plan',
            budget: 'DRM Budget Allocation',
            drm_mainstreaming: 'DRM Mainstreaming',
            health: 'Health Facilities Exposure',
            water: 'Water Supply Exposure',
            energy: 'Energy & Utilities Exposure',
            emergency: 'Emergency Services Exposure',
            communications: 'Communications Infrastructure Exposure',
            drainage: 'Drainage System Condition',
            green_cover: 'Green Cover / Urban Forests',
            waste_mgmt: 'Waste Management',
            pollution: 'Pollution Levels'
        };
        if (knownLabels[key]) return knownLabels[key];
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleAddHazard = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (formData.hazards?.some(h => (h.hazard_name || '').toLowerCase() === trimmed.toLowerCase())) {
            toast.info('Hazard already exists in table');
            return;
        }
        setFormData(prev => ({
            ...prev,
            hazards: [
                ...(prev.hazards || []),
                { hazard_name: trimmed, frequency: '3', severity: '3', duration: '3', spatial_extent: '3', seasonality: '', historical_events: '' }
            ]
        }));
    };

    const handleRemoveHazard = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            hazards: prev.hazards?.filter((_, i) => i !== idx)
        }));
    };

    const handleAddCapacity = (label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase().replace(/\s+/g, '_');
        setFormData(prev => ({
            ...prev,
            kii_capacity_indicators: {
                ...(prev.kii_capacity_indicators || {}),
                [key]: 3
            }
        }));
        setNewCapacityName('');
    };

    const handleRemoveCapacity = (key: string) => {
        setFormData(prev => {
            const next: Record<string, any> = { ...(prev.kii_capacity_indicators || {}) };
            delete next[key];
            return { ...prev, kii_capacity_indicators: next };
        });
    };

    const handleAddInfra = (label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase().replace(/\s+/g, '_');
        setFormData(prev => ({
            ...prev,
            kii_infrastructure_exposure: {
                ...(prev.kii_infrastructure_exposure || {}),
                [key]: 3
            }
        }));
        setNewInfraName('');
    };

    const handleRemoveInfra = (key: string) => {
        setFormData(prev => {
            const next: Record<string, any> = { ...(prev.kii_infrastructure_exposure || {}) };
            delete next[key];
            return { ...prev, kii_infrastructure_exposure: next };
        });
    };

    const handleAddEnv = (label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase().replace(/\s+/g, '_');
        setFormData(prev => ({
            ...prev,
            kii_environmental_indicators: {
                ...(prev.kii_environmental_indicators || {}),
                [key]: 3
            }
        }));
        setNewEnvName('');
    };

    const handleRemoveEnv = (key: string) => {
        setFormData(prev => {
            const next: Record<string, any> = { ...(prev.kii_environmental_indicators || {}) };
            delete next[key];
            return { ...prev, kii_environmental_indicators: next };
        });
    };

    const [editingHazardIdx, setEditingHazardIdx] = useState<number | null>(null);
    const [editingHazardName, setEditingHazardName] = useState('');

    const handleRenameCapacity = (oldKey: string, newLabel: string) => {
        const trimmed = newLabel.trim();
        if (!trimmed) return;
        const newKey = trimmed.toLowerCase().replace(/\s+/g, '_');
        setFormData(prev => {
            const next: Record<string, any> = { ...(prev.kii_capacity_indicators || {}) };
            const val = next[oldKey] ?? 3;
            delete next[oldKey];
            next[newKey] = val;
            return { ...prev, kii_capacity_indicators: next };
        });
    };

    const handleRenameInfra = (oldKey: string, newLabel: string) => {
        const trimmed = newLabel.trim();
        if (!trimmed) return;
        const newKey = trimmed.toLowerCase().replace(/\s+/g, '_');
        setFormData(prev => {
            const next: Record<string, any> = { ...(prev.kii_infrastructure_exposure || {}) };
            const val = next[oldKey] ?? 3;
            delete next[oldKey];
            next[newKey] = val;
            return { ...prev, kii_infrastructure_exposure: next };
        });
    };

    const handleRenameEnv = (oldKey: string, newLabel: string) => {
        const trimmed = newLabel.trim();
        if (!trimmed) return;
        const newKey = trimmed.toLowerCase().replace(/\s+/g, '_');
        setFormData(prev => {
            const next: Record<string, any> = { ...(prev.kii_environmental_indicators || {}) };
            const val = next[oldKey] ?? 3;
            delete next[oldKey];
            next[newKey] = val;
            return { ...prev, kii_environmental_indicators: next };
        });
    };

    const updateHazard = (idx: number, field: string, val: string) => {
        setFormData(prev => {
            const hazards = [...(prev.hazards || [])];
            hazards[idx] = { ...hazards[idx], [field]: val };
            return { ...prev, hazards };
        });
    };

    const handleSave = async (status: 'Draft' | 'Submitted') => {
        setSaving(true);
        setError(null);
        try {
            const payload = { ...formData, status, allowUpdateIfDuplicate: allowDuplicateUpdate };
            const idToSave = assessmentId || initial?._id;
            if (idToSave) {
                await updateWoredaAssessment(idToSave, payload);
            } else {
                await createWoredaAssessment(payload);
            }
            onSaved?.();
            onClose();
        } catch (e: any) {
            if (e?.response?.status === 409) {
                const houseNo = formData.location.house_no?.trim() || '';
                setConflictDetails({
                    house_no: houseNo,
                    woreda: formData.location.woreda || 'this Woreda',
                    subcity: formData.location.subcity,
                    targetType: 'woreda',
                    existingId: e.response.data?.existing?._id,
                    existingData: e.response.data?.existing
                });
                setConflictModalOpen(true);
            } else {
                setError(e?.response?.data?.message || 'Save failed');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleStepAdvanceWoreda = async () => {
        if (step === 1 && !allowDuplicateUpdate) {
            const houseNo = formData.location.house_no?.trim();
            const woreda = formData.location.woreda?.trim();
            const subcity = formData.location.subcity?.trim();
            const isUnnumbered = !houseNo || ['none', 'n/a', 'no house no', 'no house number', 'unnumbered'].includes(houseNo.toLowerCase());

            if (!isUnnumbered && houseNo && !assessmentId) {
                try {
                    const checkRes = await checkWoredaAssessmentHouseNo({
                        woreda,
                        subcity,
                        house_no: houseNo,
                        excludeId: initial?._id
                    });
                    if (checkRes && checkRes.exists) {
                        setConflictDetails({
                            house_no: houseNo,
                            woreda: woreda || 'this Woreda',
                            subcity,
                            targetType: 'woreda',
                            existingId: checkRes.assessment?._id,
                            existingData: checkRes.assessment
                        });
                        setConflictModalOpen(true);
                        return;
                    }
                } catch (e) {
                    console.warn('Duplicate check failed (continuing):', e);
                }
            }
        }
        setStep(step + 1);
    };

    const handleConflictUpdateExisting = () => {
        setAllowDuplicateUpdate(true);
        setConflictModalOpen(false);
        if (step < 3) setStep(step + 1);
    };

    const handleConflictNewHouseNo = (newHouseNo: string) => {
        setFormData(prev => ({ ...prev, location: { ...prev.location, house_no: newHouseNo } }));
        setConflictModalOpen(false);
        if (step < 3) setStep(step + 1);
    };

    const handleConflictNoHouseNo = () => {
        handleConflictNewHouseNo('No House No');
    };

    const [disasterYear, setDisasterYear] = useState<number>(new Date().getFullYear());
    const [disasterHazard, setDisasterHazard] = useState<string>('Flood');
    const [disasterLoc, setDisasterLoc] = useState<string>('');
    const [disasterAffected, setDisasterAffected] = useState<number>(0);
    const [disasterDisplaced, setDisasterDisplaced] = useState<number>(0);
    const [disasterDeaths, setDisasterDeaths] = useState<number>(0);
    const [disasterInjuries, setDisasterInjuries] = useState<number>(0);
    const [disasterHouses, setDisasterHouses] = useState<number>(0);
    const [disasterInfra, setDisasterInfra] = useState<string>('');
    const [disasterLoss, setDisasterLoss] = useState<number>(0);

    const handleAddDisasterRecord = () => {
        if (!disasterHazard) return;
        const newRecord = {
            year: Number(disasterYear) || new Date().getFullYear(),
            hazard_name: disasterHazard,
            location_description: disasterLoc,
            affected_population: Number(disasterAffected) || 0,
            displaced_population: Number(disasterDisplaced) || 0,
            deaths: Number(disasterDeaths) || 0,
            injuries: Number(disasterInjuries) || 0,
            houses_damaged: Number(disasterHouses) || 0,
            infrastructure_damaged: disasterInfra,
            estimated_loss_etb: Number(disasterLoss) || 0,
        };
        setFormData(prev => ({
            ...prev,
            disaster_history: [...(prev.disaster_history || []), newRecord]
        }));
        setDisasterLoc('');
        setDisasterAffected(0);
        setDisasterDisplaced(0);
        setDisasterDeaths(0);
        setDisasterInjuries(0);
        setDisasterHouses(0);
        setDisasterInfra('');
        setDisasterLoss(0);
    };

    const handleRemoveDisasterRecord = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            disaster_history: prev.disaster_history?.filter((_, i) => i !== idx)
        }));
    };

    const subTabs = [
        { id: 'cgd_hazards', label: 'CGD: Hazards', icon: AlertTriangle, color: 'text-rose-500' },
        { id: 'cgd_voice', label: 'Community Voice', icon: MessageSquare, color: 'text-violet-500' },
        { id: 'cgd_disaster_history', label: 'Disaster History', icon: BarChart3, color: 'text-red-500' },
        { id: 'kii_capacity', label: 'KII: Capacity', icon: Shield, color: 'text-blue-500' },
        { id: 'kii_infrastructure', label: 'KII: Infrastructure', icon: Zap, color: 'text-amber-500' },
        { id: 'kii_environment', label: 'KII: Environment', icon: Leaf, color: 'text-emerald-500' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(16, 24, 40, 0.65)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 60, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="w-full max-w-5xl h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
                style={{ boxShadow: '0 32px 80px rgba(70,95,255,0.20), 0 8px 32px rgba(0,0,0,0.12)' }}
            >
                {/* ─── Premium Header ─────────────────────────────────────── */}
                <div className="relative overflow-hidden px-8 py-6 flex items-center gap-5 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1f3a8a 0%, #465FFF 50%, #6B7FF5 100%)' }}
                >
                    {/* Decorative glows */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />
                    <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full opacity-10 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, #6B7FF5 0%, transparent 70%)', transform: 'translateY(50%)' }} />

                    {/* Logo icon + title */}
                    <div className="relative z-10 flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-lg flex-shrink-0">
                            <Shield size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 mb-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[9px] font-black uppercase tracking-widest">
                                <Sparkles size={8} className="text-white/80" />
                                Woreda-Level DRM Assessment
                            </div>
                            <h2 className="text-base font-black text-white tracking-tight leading-none">
                                {initial ? 'Edit Woreda Assessment' : 'New Woreda CGD / KII Assessment'}
                            </h2>
                        </div>
                    </div>

                    {/* Step progress pills */}
                    <div className="relative z-10 hidden md:flex items-center gap-1.5">
                        {STEP_LABELS.map((label, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                        step === i + 1
                                            ? 'bg-white text-[#465FFF] border-white shadow-lg'
                                            : step > i + 1
                                            ? 'bg-white/20 text-white border-white/20'
                                            : 'bg-white/8 text-white/50 border-white/10'
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 ${
                                        step === i + 1
                                            ? 'bg-[#465FFF] text-white'
                                            : step > i + 1
                                            ? 'bg-white/40 text-white'
                                            : 'bg-white/15 text-white/40'
                                    }`}>
                                        {step > i + 1 ? <CheckCircle2 size={9} /> : i + 1}
                                    </span>
                                    {label}
                                </div>
                                {i < STEP_LABELS.length - 1 && (
                                    <div className="w-4 h-px bg-white/20" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="relative z-10 w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/15 cursor-pointer ml-2 flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ─── Body ───────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto bg-[#f7f8fc]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
                    <div className="p-8 space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3"
                                >
                                    <AlertTriangle size={16} className="text-rose-500 flex-shrink-0" />
                                    <span className="text-sm font-bold text-rose-700">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ─── STEP 1: Location ──────────────────────────── */}
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-slate-200/80">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)' }}>
                                            <MapPin size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Woreda Location</h3>
                                            <p className="text-slate-400 text-xs font-medium mt-0.5">Select the Subcity and Woreda for this CGD/KII assessment</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        {/* Subcity */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                Sub-city
                                                <span className="text-[#465FFF]">*</span>
                                            </label>
                                            {loadingLocations ? (
                                                <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-2 text-slate-400">
                                                    <Loader2 size={16} className="animate-spin text-[#465FFF]" />
                                                    <span className="text-sm font-medium">Loading locations...</span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={formData.location.subcity || ''}
                                                    onChange={e => {
                                                        setFormData(prev => ({ ...prev, location: { ...prev.location, subcity: e.target.value, woreda: '' } }));
                                                    }}
                                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-[#465FFF] focus:outline-none focus:ring-4 focus:ring-[#465FFF]/10 transition-all cursor-pointer"
                                                >
                                                    <option value="">— Select Sub-city —</option>
                                                    {locationHierarchy.map(s => (
                                                        <option key={s._id} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* Woreda */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                Woreda
                                                <span className="text-[#465FFF]">*</span>
                                            </label>
                                            <select
                                                value={formData.location.woreda || ''}
                                                onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, woreda: e.target.value } }))}
                                                disabled={!formData.location.subcity || availableWoredas.length === 0}
                                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-[#465FFF] focus:outline-none focus:ring-4 focus:ring-[#465FFF]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                <option value="">{!formData.location.subcity ? '— Select sub-city first —' : '— Select Woreda —'}</option>
                                                {availableWoredas.map((w: any) => (
                                                    <option key={w._id} value={w.name}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Block */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Block</label>
                                            <input
                                                type="text"
                                                value={formData.location.block || ''}
                                                onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, block: e.target.value } }))}
                                                placeholder="e.g. 04"
                                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-[#465FFF] focus:outline-none focus:ring-4 focus:ring-[#465FFF]/10 transition-all"
                                            />
                                        </div>

                                        {/* House Number */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">House Number</label>
                                            <input
                                                type="text"
                                                value={formData.location.house_no || ''}
                                                onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, house_no: e.target.value } }))}
                                                placeholder="e.g. H-102"
                                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-[#465FFF] focus:outline-none focus:ring-4 focus:ring-[#465FFF]/10 transition-all"
                                            />
                                        </div>

                                        {/* Assessment Date */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assessment Date</label>
                                            <input
                                                type="date"
                                                value={formData.assessment_date}
                                                onChange={e => setFormData(prev => ({ ...prev, assessment_date: e.target.value }))}
                                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-[#465FFF] focus:outline-none focus:ring-4 focus:ring-[#465FFF]/10 transition-all"
                                            />
                                        </div>

                                        {/* Remarks */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remarks / Notes</label>
                                            <textarea
                                                value={formData.remarks || ''}
                                                rows={3}
                                                onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                                placeholder="Context about this assessment..."
                                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-medium focus:border-[#465FFF] focus:outline-none focus:ring-4 focus:ring-[#465FFF]/10 transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Info callout */}
                                    {formData.location.subcity && formData.location.woreda && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-[#465FFF]/20 bg-[#465FFF]/5"
                                        >
                                            <CheckCircle2 size={18} className="text-[#465FFF] flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-black text-[#465FFF]">{formData.location.subcity} · {formData.location.woreda}</p>
                                                <p className="text-xs text-slate-500 font-medium">Location confirmed — existing data will be loaded if available.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* ─── STEP 2: CGD + KII ──────────────────────── */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-5"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-slate-200/80">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)' }}>
                                            <BarChart3 size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">CGD & KII Assessment</h3>
                                            <p className="text-slate-400 text-xs font-medium mt-0.5">Score each indicator 1 (Very Low) to 5 (Very High)</p>
                                        </div>
                                    </div>

                                    {/* Sub-tab pills */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                        {subTabs.map(sub => (
                                            <button
                                                key={sub.id}
                                                type="button"
                                                onClick={() => setSubStep(sub.id as SubStep)}
                                                className={`flex items-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer border-2 ${
                                                    subStep === sub.id
                                                        ? 'text-white border-transparent shadow-lg'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-[#465FFF]/30 hover:text-[#465FFF]'
                                                }`}
                                                style={subStep === sub.id ? { background: 'linear-gradient(135deg, #465FFF, #6B7FF5)', boxShadow: '0 4px 16px rgba(70,95,255,0.30)' } : {}}
                                            >
                                                <sub.icon size={11} />
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>

                                        {/* CGD: Hazards */}
                                        <AnimatePresence mode="wait">
                                            {subStep === 'cgd_hazards' && (
                                                <motion.div key="cgd_hazards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-sm">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <select
                                                                value={selectedHazardToAdd}
                                                                onChange={e => {
                                                                    if (e.target.value === 'CUSTOM') {
                                                                        setShowCustomHazardInput(true);
                                                                    } else if (e.target.value) {
                                                                        handleAddHazard(e.target.value);
                                                                        setSelectedHazardToAdd('');
                                                                    }
                                                                }}
                                                                className="bg-[#f7f8fc] border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-[#465FFF]"
                                                            >
                                                                <option value="">+ Add Hazard to Assessment...</option>
                                                                {HAZARD_TYPES.filter(h => !formData.hazards?.some(existing => (existing.hazard_name || '').toLowerCase() === h.toLowerCase())).map(h => (
                                                                    <option key={h} value={h}>{h}</option>
                                                                ))}
                                                                <option value="CUSTOM">+ Add Custom Hazard Name...</option>
                                                            </select>

                                                            {showCustomHazardInput && (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter hazard name..."
                                                                        value={customHazardName}
                                                                        onChange={e => setCustomHazardName(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                if (customHazardName.trim()) {
                                                                                    handleAddHazard(customHazardName);
                                                                                    setCustomHazardName('');
                                                                                    setShowCustomHazardInput(false);
                                                                                    setSelectedHazardToAdd('');
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="bg-white border-2 border-[#465FFF] rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (customHazardName.trim()) {
                                                                                handleAddHazard(customHazardName);
                                                                                setCustomHazardName('');
                                                                                setShowCustomHazardInput(false);
                                                                                setSelectedHazardToAdd('');
                                                                            }
                                                                        }}
                                                                        className="px-3 py-1.5 bg-[#465FFF] text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setShowCustomHazardInput(false);
                                                                            setSelectedHazardToAdd('');
                                                                        }}
                                                                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    hazards: HAZARD_TYPES.map(h => ({ hazard_name: h, frequency: '3', severity: '3', duration: '3', spatial_extent: '3', seasonality: '', historical_events: '' }))
                                                                }));
                                                                toast.info('Restored default hazard list');
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all"
                                                        >
                                                            <RotateCcw size={12} /> Restore Defaults
                                                        </button>
                                                    </div>

                                                    <div className="overflow-auto rounded-[1.5rem] border-2 border-slate-200 bg-white shadow-sm">
                                                        <table className="w-full text-left">
                                                            <thead>
                                                                <tr style={{ background: 'linear-gradient(135deg, #f7f8fc, #eef2ff)' }}>
                                                                    <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-44 border-b border-slate-200">Hazard</th>
                                                                    <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest text-center border-b border-slate-200" style={{ color: '#465FFF' }}>Frequency<br /><span className="text-slate-400 font-normal normal-case tracking-normal text-[8px]">35%</span></th>
                                                                    <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest text-center border-b border-slate-200" style={{ color: '#465FFF' }}>Severity<br /><span className="text-slate-400 font-normal normal-case tracking-normal text-[8px]">35%</span></th>
                                                                    <th className="px-3 py-4 text-[9px] font-black text-blue-600 uppercase tracking-widest text-center border-b border-slate-200">Duration<br /><span className="text-slate-400 font-normal normal-case tracking-normal text-[8px]">15%</span></th>
                                                                    <th className="px-3 py-4 text-[9px] font-black text-blue-600 uppercase tracking-widest text-center border-b border-slate-200">Spatial Ext.<br /><span className="text-slate-400 font-normal normal-case tracking-normal text-[8px]">15%</span></th>
                                                                    <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200">H Score</th>
                                                                    <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {(formData.hazards || []).map((hazard, idx) => {
                                                                    const f = Number(hazard.frequency) || 0;
                                                                    const s = Number(hazard.severity) || 0;
                                                                    const d = Number(hazard.duration) || 0;
                                                                    const x = Number(hazard.spatial_extent) || 0;
                                                                    const h = (f * 0.35 + s * 0.35 + d * 0.15 + x * 0.15).toFixed(2);
                                                                    const numH = parseFloat(h);
                                                                    const scoreColor = numH >= 4 ? 'bg-rose-100 text-rose-700' : numH >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                                                                    return (
                                                                        <tr key={idx} className="hover:bg-[#465FFF]/3 transition-colors">
                                                                            <td className="px-5 py-3">
                                                                                {editingHazardIdx === idx ? (
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingHazardName}
                                                                                            onChange={e => setEditingHazardName(e.target.value)}
                                                                                            onKeyDown={e => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    if (editingHazardName.trim()) {
                                                                                                        updateHazard(idx, 'hazard_name', editingHazardName.trim());
                                                                                                        setEditingHazardIdx(null);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            className="bg-white border-2 border-[#465FFF] rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
                                                                                            autoFocus
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (editingHazardName.trim()) {
                                                                                                    updateHazard(idx, 'hazard_name', editingHazardName.trim());
                                                                                                    setEditingHazardIdx(null);
                                                                                                }
                                                                                            }}
                                                                                            className="p-1.5 rounded-lg bg-[#465FFF] text-white cursor-pointer"
                                                                                            title="Save Hazard Name"
                                                                                        >
                                                                                            <Check size={13} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setEditingHazardIdx(null)}
                                                                                            className="p-1.5 rounded-lg bg-slate-200 text-slate-600 cursor-pointer"
                                                                                            title="Cancel"
                                                                                        >
                                                                                            <X size={13} />
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 group/hName">
                                                                                        <span className="text-xs font-bold text-slate-800">{hazard.hazard_name}</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                setEditingHazardIdx(idx);
                                                                                                setEditingHazardName(hazard.hazard_name || '');
                                                                                            }}
                                                                                            className="p-1 rounded text-slate-300 hover:text-[#465FFF] hover:bg-indigo-50 opacity-0 group-hover/hName:opacity-100 transition-all cursor-pointer"
                                                                                            title="Edit Hazard Name"
                                                                                        >
                                                                                            <Pencil size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            {(['frequency', 'severity', 'duration', 'spatial_extent'] as const).map(field => (
                                                                                <td key={field} className="px-3 py-2 text-center">
                                                                                    <select
                                                                                        value={(hazard as any)[field] || '3'}
                                                                                        onChange={e => updateHazard(idx, field, e.target.value)}
                                                                                        className="w-16 bg-[#f7f8fc] border-2 border-slate-200 rounded-xl p-2 text-xs font-bold text-center outline-none focus:border-[#465FFF] focus:ring-2 focus:ring-[#465FFF]/15 transition-all cursor-pointer"
                                                                                    >
                                                                                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                                                                    </select>
                                                                                </td>
                                                                            ))}
                                                                            <td className="px-3 py-2 text-center">
                                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-black ${scoreColor}`}>{h}</span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-center">
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setEditingHazardIdx(idx);
                                                                                            setEditingHazardName(hazard.hazard_name || '');
                                                                                        }}
                                                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-[#465FFF] hover:bg-indigo-50 transition-all cursor-pointer"
                                                                                        title="Edit Hazard Name"
                                                                                    >
                                                                                        <Pencil size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveHazard(idx)}
                                                                                        className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                                                                        title="Remove Hazard"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </motion.div>
                                            )}

                                        {/* CGD: Community Voice */}
                                        {subStep === 'cgd_voice' && (
                                            <motion.div key="cgd_voice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                className="space-y-5 rounded-[2rem] p-7 border-2 border-[#1f3a8a]/20"
                                                style={{ background: 'linear-gradient(135deg, #1f3a8a 0%, #2d4db5 50%, #465FFF 100%)' }}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                                                        <MessageSquare size={14} className="text-white" />
                                                    </div>
                                                    <h4 className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">Community Group Discussion — Voices</h4>
                                                </div>
                                                {[
                                                    { key: 'coping_strategies', label: 'Community Coping Strategies', placeholder: 'How does the community cope with hazards?' },
                                                    { key: 'collective_action_structure', label: 'Collective Action & Social Structures', placeholder: 'Describe community groups, committees, traditional structures...' },
                                                    { key: 'suggested_interventions', label: 'Suggested Interventions', placeholder: 'What interventions do community members recommend?' }
                                                ].map(field => (
                                                    <div key={field.key} className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-white/60 uppercase tracking-widest">{field.label}</label>
                                                        <textarea
                                                            value={(formData.cgd_community_voice as any)?.[field.key] || ''}
                                                            onChange={e => updateNested(`cgd_community_voice.${field.key}`, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            rows={3}
                                                            className="w-full bg-white/10 border-2 border-white/15 rounded-2xl p-4 text-sm text-white placeholder-white/40 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/15 resize-none transition-all font-medium"
                                                        />
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* CGD: Disaster History */}
                                        {subStep === 'cgd_disaster_history' && (
                                            <motion.div key="cgd_disaster_history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#C8102E]/15 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#C8102E] text-white">
                                                                <BarChart3 size={13} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#C8102E]">Register Historical Disaster Events</h4>
                                                                <p className="text-[9px] text-slate-400 font-medium">Log past disaster occurrences, affected population, casualties, and financial damage (ETB)</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Record Entry Form */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Year</label>
                                                            <input
                                                                type="number"
                                                                value={disasterYear}
                                                                onChange={e => setDisasterYear(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hazard Type</label>
                                                            <select
                                                                value={disasterHazard}
                                                                onChange={e => setDisasterHazard(e.target.value)}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            >
                                                                {HAZARD_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Location / Zone</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Riverbank District"
                                                                value={disasterLoc}
                                                                onChange={e => setDisasterLoc(e.target.value)}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Affected Pop</label>
                                                            <input
                                                                type="number"
                                                                value={disasterAffected}
                                                                onChange={e => setDisasterAffected(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Displaced Pop</label>
                                                            <input
                                                                type="number"
                                                                value={disasterDisplaced}
                                                                onChange={e => setDisasterDisplaced(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Deaths</label>
                                                            <input
                                                                type="number"
                                                                value={disasterDeaths}
                                                                onChange={e => setDisasterDeaths(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Injuries</label>
                                                            <input
                                                                type="number"
                                                                value={disasterInjuries}
                                                                onChange={e => setDisasterInjuries(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Houses Damaged</label>
                                                            <input
                                                                type="number"
                                                                value={disasterHouses}
                                                                onChange={e => setDisasterHouses(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Infra Damage</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 2 Schools, 1 Bridge"
                                                                value={disasterInfra}
                                                                onChange={e => setDisasterInfra(e.target.value)}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Est. Loss (ETB)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g. 15000000"
                                                                value={disasterLoss}
                                                                onChange={e => setDisasterLoss(Number(e.target.value))}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddDisasterRecord}
                                                                className="w-full py-2 bg-[#C8102E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-[#a00d24] transition"
                                                            >
                                                                <Plus size={14} /> Add Disaster Record
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Registered History Table */}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                                                                    <th className="py-2 px-3">Year</th>
                                                                    <th className="py-2 px-3">Hazard</th>
                                                                    <th className="py-2 px-3">Location</th>
                                                                    <th className="py-2 px-3 text-right">Affected</th>
                                                                    <th className="py-2 px-3 text-right">Displaced</th>
                                                                    <th className="py-2 px-3 text-right">Loss (ETB)</th>
                                                                    <th className="py-2 px-3 text-center">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                                                {(formData.disaster_history || []).length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">No historical disaster records added yet.</td>
                                                                    </tr>
                                                                ) : (
                                                                    formData.disaster_history?.map((dh, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50">
                                                                            <td className="py-2.5 px-3 font-bold">{dh.year}</td>
                                                                            <td className="py-2.5 px-3 font-black text-slate-900">{dh.hazard_name}</td>
                                                                            <td className="py-2.5 px-3">{dh.location_description || '—'}</td>
                                                                            <td className="py-2.5 px-3 text-right font-mono">{dh.affected_population?.toLocaleString()}</td>
                                                                            <td className="py-2.5 px-3 text-right font-mono">{dh.displaced_population?.toLocaleString()}</td>
                                                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#C8102E]">{dh.estimated_loss_etb ? `${dh.estimated_loss_etb.toLocaleString()} ETB` : '0 ETB'}</td>
                                                                            <td className="py-2.5 px-3 text-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveDisasterRecord(idx)}
                                                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* KII: Capacity */}
                                        {subStep === 'kii_capacity' && (
                                            <motion.div key="kii_capacity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                                <div className="bg-white rounded-[1.5rem] p-6 border-2 border-[#465FFF]/15 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)' }}>
                                                                <Shield size={13} className="text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#465FFF' }}>Capacity & Preparedness Indicators</h4>
                                                                <p className="text-[9px] text-slate-400 font-medium">Add, edit, score, or remove DRM capacity indicators</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {Object.entries(formData.kii_capacity_indicators || {}).map(([key, value]) => (
                                                            <ScoreSlider
                                                                key={key}
                                                                label={formatKeyToLabel(key)}
                                                                value={value as number}
                                                                onChange={v => updateNested(`kii_capacity_indicators.${key}`, v)}
                                                                onDelete={() => handleRemoveCapacity(key)}
                                                                onRename={newLabel => handleRenameCapacity(key, newLabel)}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                                        <input
                                                            type="text"
                                                            placeholder="Add custom capacity indicator..."
                                                            value={newCapacityName}
                                                            onChange={e => setNewCapacityName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCapacity(newCapacityName))}
                                                            className="flex-1 bg-[#f7f8fc] border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#465FFF]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddCapacity(newCapacityName)}
                                                            className="px-4 py-2 bg-[#465FFF] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-[#364ecc]"
                                                        >
                                                            <Plus size={14} /> Add Indicator
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* KII: Infrastructure */}
                                        {subStep === 'kii_infrastructure' && (
                                            <motion.div key="kii_infrastructure" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                <div className="bg-white rounded-[1.5rem] p-6 border-2 border-amber-100 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-xl bg-amber-500 flex items-center justify-center">
                                                                <Zap size={13} className="text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Infrastructure Exposure Indicators</h4>
                                                                <p className="text-[9px] text-slate-400 font-medium">Add, edit, score, or remove critical infrastructure exposure metrics</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {Object.entries(formData.kii_infrastructure_exposure || {}).map(([key, value]) => (
                                                            <ScoreSlider
                                                                key={key}
                                                                label={formatKeyToLabel(key)}
                                                                value={value as number}
                                                                onChange={v => updateNested(`kii_infrastructure_exposure.${key}`, v)}
                                                                onDelete={() => handleRemoveInfra(key)}
                                                                onRename={newLabel => handleRenameInfra(key, newLabel)}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                                        <input
                                                            type="text"
                                                            placeholder="Add custom infrastructure indicator..."
                                                            value={newInfraName}
                                                            onChange={e => setNewInfraName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInfra(newInfraName))}
                                                            className="flex-1 bg-[#f7f8fc] border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddInfra(newInfraName)}
                                                            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-amber-600"
                                                        >
                                                            <Plus size={14} /> Add Infrastructure Metric
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* KII: Environment */}
                                        {subStep === 'kii_environment' && (
                                            <motion.div key="kii_environment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                <div className="bg-white rounded-[1.5rem] p-6 border-2 border-emerald-100 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center">
                                                                <Leaf size={13} className="text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Environmental Vulnerability Indicators</h4>
                                                                <p className="text-[9px] text-slate-400 font-medium">Add, edit, score, or remove environmental vulnerability metrics</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {Object.entries(formData.kii_environmental_indicators || {}).map(([key, value]) => (
                                                            <ScoreSlider
                                                                key={key}
                                                                label={formatKeyToLabel(key)}
                                                                value={value as number}
                                                                onChange={v => updateNested(`kii_environmental_indicators.${key}`, v)}
                                                                onDelete={() => handleRemoveEnv(key)}
                                                                onRename={newLabel => handleRenameEnv(key, newLabel)}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                                        <input
                                                            type="text"
                                                            placeholder="Add custom environmental indicator..."
                                                            value={newEnvName}
                                                            onChange={e => setNewEnvName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddEnv(newEnvName))}
                                                            className="flex-1 bg-[#f7f8fc] border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddEnv(newEnvName)}
                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-emerald-600"
                                                        >
                                                            <Plus size={14} /> Add Environmental Metric
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* ─── STEP 3: Review ─────────────────────────── */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-slate-200/80">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)' }}>
                                            <CheckCircle2 size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Review & Submit</h3>
                                            <p className="text-slate-400 text-xs font-medium mt-0.5">Confirm your assessment details before submitting</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        {/* Location card */}
                                        <div className="bg-white border-2 rounded-[1.5rem] p-6 shadow-sm space-y-4" style={{ borderColor: '#465FFF' + '30' }}>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#465FFF' }}>Location</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #465FFF20, #465FFF15)' }}>
                                                    <MapPin size={18} style={{ color: '#465FFF' }} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{formData.location.woreda || 'Woreda not set'}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{formData.location.subcity || ''} Sub-city</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date:</span>
                                                <span className="text-[10px] font-black text-slate-700">{formData.assessment_date}</span>
                                            </div>
                                        </div>

                                        {/* Hazard summary */}
                                        <div className="bg-white border-2 border-slate-200 rounded-[1.5rem] p-6 shadow-sm space-y-3">
                                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Hazard Summary</h4>
                                            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                                {(formData.hazards || []).map((h, i) => {
                                                    const score = (Number(h.frequency) * 0.35 + Number(h.severity) * 0.35 + Number(h.duration) * 0.15 + Number(h.spatial_extent) * 0.15).toFixed(2);
                                                    const scoreColor = Number(score) >= 4 ? 'bg-rose-100 text-rose-700' : Number(score) >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                                                    return (
                                                        <div key={i} className="flex justify-between items-center py-1.5 px-2 rounded-xl hover:bg-slate-50 border-b border-slate-50">
                                                            <span className="text-xs font-medium text-slate-700">{h.hazard_name}</span>
                                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${scoreColor}`}>{score}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status select */}
                                    <div className="bg-white border-2 border-slate-200 rounded-[1.5rem] p-6 shadow-sm">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Submission Status</h4>
                                        <div className="flex gap-3">
                                            {['Draft', 'Submitted'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, status: s as any }))}
                                                    className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${
                                                        formData.status === s
                                                            ? s === 'Submitted' ? 'text-white border-transparent' : 'border-[#465FFF] text-[#465FFF] bg-[#465FFF]/5'
                                                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                                    style={formData.status === s && s === 'Submitted' ? { background: 'linear-gradient(135deg, #465FFF, #6B7FF5)' } : {}}
                                                >
                                                    {s === 'Draft' ? '📝 Save as Draft' : '✅ Submit Assessment'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ─── Footer ─────────────────────────────────────────────── */}
                <div className="bg-white border-t-2 border-slate-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-[#465FFF]/30 hover:text-[#465FFF] transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleStepAdvanceWoreda}
                                className="px-8 py-3.5 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)', boxShadow: '0 8px 24px rgba(70,95,255,0.35)' }}
                            >
                                Continue <ChevronRight size={14} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSave('Draft')}
                                    disabled={saving}
                                    className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-[#465FFF]/30 hover:text-[#465FFF] transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                                    Save Draft
                                </button>
                                <button
                                    onClick={() => handleSave('Submitted')}
                                    disabled={saving}
                                    className="px-8 py-3.5 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)', boxShadow: '0 8px 24px rgba(70,95,255,0.35)' }}
                                >
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                                    {saving ? 'Saving...' : 'Submit Assessment'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Duplicate House Prompt Modal */}
                <DuplicateHousePromptModal
                    isOpen={conflictModalOpen}
                    conflict={conflictDetails}
                    onClose={() => setConflictModalOpen(false)}
                    onUpdateExisting={handleConflictUpdateExisting}
                    onRegisterNewHouseNo={handleConflictNewHouseNo}
                    onRegisterAsNoHouseNo={handleConflictNoHouseNo}
                />
            </motion.div>
        </motion.div>
    );
};

export default WoredaAssessmentForm;
