import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Users, CheckCircle2, ChevronLeft, ChevronRight,
    Loader2, ShieldCheck, FileText, Building, Shield, Heart,
    Sparkles, X, Navigation, RefreshCw, AlertCircle
} from 'lucide-react';
import {
    type WoredaProfile as WProfile,
    type WoredaProfileInput as WProfileInput,
    checkHouseholdHouseNo
} from '../../../api/woredaProfileService';
import {
    emptyHouseholdProfile, emptyProfile,
    EDUCATION_CATS, LIVELIHOOD_TYPES
} from './constants';
import { getLocationHierarchy, type LocationHierarchyItem } from '../../../api/locationService';
import { DuplicateHousePromptModal, type DuplicateConflictDetails } from '../../../components/survey/DuplicateHousePromptModal';

type HHSubStep = 'demographics' | 'livelihood' | 'housing' | 'preparedness' | 'recovery';

const STEP_LABELS = ['Location & Meta', 'Household Details', 'Review & Submit'];

export const FormWizard: React.FC<{
    initial: WProfile | null;
    onSave: (data: WProfileInput) => void;
    onClose: () => void;
    saving: boolean;
}> = ({ initial, onSave, onClose, saving }) => {
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState<HHSubStep>('demographics');
    const totalSteps = 3;

    // Duplicate house number check state
    const [conflictModalOpen, setConflictModalOpen] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<DuplicateConflictDetails | null>(null);
    const [allowDuplicateUpdate, setAllowDuplicateUpdate] = useState(false);

    // Location hierarchy for dropdowns
    const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchyItem[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    // Geolocation detection state
    const [locating, setLocating] = useState(false);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
    const [locationError, setLocationError] = useState<string | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);

    useEffect(() => {
        getLocationHierarchy()
            .then(data => setLocationHierarchy(data))
            .catch(err => console.error('Failed to load location hierarchy', err))
            .finally(() => setLoadingLocations(false));
    }, []);

    const [formData, setFormData] = useState<WProfileInput>(initial ? {
        location: initial.location,
        assessment_date: initial.assessment_date,
        remarks: initial.remarks || '',
        aggregation_level: initial.aggregation_level || 'household',
        household_profile: initial.household_profile || emptyHouseholdProfile(),
        survey_metadata: initial.survey_metadata || emptyProfile().survey_metadata,
        raw_survey: initial.raw_survey || emptyProfile().raw_survey,
        demographics: initial.demographics || emptyProfile().demographics,
        livelihoods: initial.livelihoods || emptyProfile().livelihoods,
        basic_services: initial.basic_services || emptyProfile().basic_services,
        critical_facilities: initial.critical_facilities || emptyProfile().critical_facilities,
        vulnerable_groups: initial.vulnerable_groups || emptyProfile().vulnerable_groups,
        community_capacity: initial.community_capacity || emptyProfile().community_capacity,
        hazards: initial.hazards || emptyProfile().hazards,
        vulnerability_assessments: initial.vulnerability_assessments || emptyProfile().vulnerability_assessments,
        capacity_assessments: initial.capacity_assessments || emptyProfile().capacity_assessments,
        risk_assessments: initial.risk_assessments || emptyProfile().risk_assessments,
        risk_index: initial.risk_index || emptyProfile().risk_index,
        economic_risk_indicators: initial.economic_risk_indicators || emptyProfile().economic_risk_indicators,
        environmental_indicators: initial.environmental_indicators || emptyProfile().environmental_indicators,
        infrastructure_exposure: initial.infrastructure_exposure || emptyProfile().infrastructure_exposure,
        community_voice_interventions: initial.community_voice_interventions || emptyProfile().community_voice_interventions,
        preparedness_indicators: initial.preparedness_indicators || emptyProfile().preparedness_indicators,
        recovery_indicators: initial.recovery_indicators || emptyProfile().recovery_indicators,
        kii_capacity_indicators: initial.kii_capacity_indicators || emptyProfile().kii_capacity_indicators,
        kii_infrastructure_exposure: initial.kii_infrastructure_exposure || emptyProfile().kii_infrastructure_exposure,
        kii_environmental_indicators: initial.kii_environmental_indicators || emptyProfile().kii_environmental_indicators,
        cgd_community_voice: initial.cgd_community_voice || emptyProfile().cgd_community_voice,
        status: initial.status || 'Draft'
    } : emptyProfile());

    // Automatic GPS capture logic
    const captureGpsLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationError('Your browser cannot get your location. Please enter it manually.');
            return;
        }

        setLocating(true);
        setLocationStatus('detecting');
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position.coords.latitude.toFixed(6));
                const lng = Number(position.coords.longitude.toFixed(6));
                setAccuracy(position.coords.accuracy ? Math.round(position.coords.accuracy) : null);
                setLocating(false);
                setLocationStatus('success');

                setFormData(prev => {
                    const next = { ...prev };
                    if (!next.household_profile) next.household_profile = emptyHouseholdProfile();
                    if (!next.household_profile.identity_location) {
                        next.household_profile.identity_location = emptyHouseholdProfile().identity_location;
                    }
                    next.household_profile.identity_location.gps_latitude = lat;
                    next.household_profile.identity_location.gps_longitude = lng;
                    if (!next.location) next.location = { subcity: '', woreda: '', coordinates: [0, 0] };
                    next.location.coordinates = [lng, lat];
                    return next;
                });
            },
            (err) => {
                setLocating(false);
                setLocationStatus('error');
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setLocationError('We need your location to continue. Please allow location access in your browser.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setLocationError('Position unavailable. Please try again.');
                        break;
                    case err.TIMEOUT:
                        setLocationError('Location request timed out. Please try again.');
                        break;
                    default:
                        setLocationError('Failed to capture location: ' + err.message);
                }
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (!initial?.household_profile?.identity_location?.gps_latitude) {
            captureGpsLocation();
        } else if (initial?.household_profile?.identity_location?.gps_latitude) {
            setLocationStatus('success');
        }
    }, []);

    // Derive filtered woredas based on selected subcity
    const selectedSubcityObj = locationHierarchy.find(
        s => s.name === formData.location.subcity
    );
    const availableWoredas = selectedSubcityObj?.woredas || [];

    const updateNested = (path: string, val: any) => {
        const keys = path.split('.');
        setFormData(prev => {
            const next = { ...prev };
            let current = next as any;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = val;
            return next;
        });
    };

    const demographics = formData.household_profile?.demographics || {};
    const livelihood = formData.household_profile?.livelihood_economy || {};
    const housing = formData.household_profile?.housing_physical_conditions || {};
    const preparedness = formData.household_profile?.preparedness || {};
    const recovery = formData.household_profile?.recovery_capacity || {};

    const handleStepAdvance = async () => {
        if (step === 1 && !allowDuplicateUpdate) {
            const houseNo = formData.location?.house_no?.trim();
            const woreda = formData.location?.woreda?.trim();
            const subcity = formData.location?.subcity?.trim();
            const isUnnumbered = !houseNo || ['none', 'n/a', 'no house no', 'no house number', 'unnumbered'].includes(houseNo.toLowerCase());

            if (!isUnnumbered && houseNo) {
                try {
                    const checkRes = await checkHouseholdHouseNo({
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
                            targetType: 'household',
                            existingId: checkRes.profile?._id,
                            existingData: checkRes.profile
                        });
                        setConflictModalOpen(true);
                        return;
                    }
                } catch (e) {
                    console.warn('Duplicate check failed', e);
                }
            }
        }
        setStep(step + 1);
    };

    const handleSaveWithCheck = async () => {
        const payload = {
            ...formData,
            allowUpdateIfDuplicate: allowDuplicateUpdate
        };
        onSave(payload);
    };

    const handleUpdateExistingConflict = () => {
        setAllowDuplicateUpdate(true);
        setConflictModalOpen(false);
        setStep(step + 1);
    };

    const handleRegisterNewHouseNo = (newHouseNo: string) => {
        updateNested('location.house_no', newHouseNo);
        updateNested('household_profile.identity_location.house_no', newHouseNo);
        setConflictModalOpen(false);
        setStep(step + 1);
    };

    const handleRegisterAsNoHouseNo = () => {
        handleRegisterNewHouseNo('No House No');
    };

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
                {/* ─── Premium Header (Matches WoredaAssessment style) ─────────────── */}
                <div className="relative overflow-hidden px-8 py-6 flex items-center gap-5 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1f3a8a 0%, #465FFF 50%, #6B7FF5 100%)' }}
                >
                    {/* Decorative glows */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />
                    <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full opacity-10 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, #6B7FF5 0%, transparent 70%)', transform: 'translateY(50%)' }} />

                    {/* Icon + title */}
                    <div className="relative z-10 flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-lg flex-shrink-0">
                            <Users size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 mb-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[9px] font-black uppercase tracking-widest">
                                <Sparkles size={8} className="text-white/80" />
                                Household DRM Survey
                            </div>
                            <h2 className="text-base font-black text-white tracking-tight leading-none">
                                {initial ? 'Edit Household Survey' : 'New Household Survey Protocol'}
                            </h2>
                        </div>
                    </div>

                    {/* Step progress pills */}
                    <div className="relative z-10 hidden md:flex items-center gap-1.5">
                        {STEP_LABELS.map((label, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setStep(i + 1)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
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
                                </button>
                                {i < STEP_LABELS.length - 1 && (
                                    <div className="w-4 h-px bg-white/20" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="relative z-10 w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/15 cursor-pointer ml-2 flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ─── Body Content ────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto bg-[#f7f8fc]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
                    <div className="p-8 space-y-6">

                        {/* STEP 1: Location & Meta */}
                        {step === 1 && (
                            <motion.div
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
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Location & Survey Metadata</h3>
                                        <p className="text-xs text-slate-400 font-medium">Select target administrative area, respondent identity, and auto-detect GPS location.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Subcity Dropdown */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">Sub-city</label>
                                        {loadingLocations ? (
                                            <div className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3.5 flex items-center gap-2 text-slate-400 text-xs font-bold">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Loading subcities...</span>
                                            </div>
                                        ) : (
                                            <select
                                                value={formData.location.subcity || ''}
                                                onChange={e => {
                                                    updateNested('location.subcity', e.target.value);
                                                    updateNested('location.woreda', '');
                                                }}
                                                className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                            >
                                                <option value="">-- Select Sub-city --</option>
                                                {locationHierarchy.map(s => (
                                                    <option key={s._id} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Woreda Dropdown */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">Woreda</label>
                                        <select
                                            value={formData.location.woreda || ''}
                                            onChange={e => {
                                                updateNested('location.woreda', e.target.value);
                                                updateNested('household_profile.identity_location.woreda', e.target.value);
                                                updateNested('household_profile.identity_location.subcity', formData.location.subcity);
                                            }}
                                            disabled={!formData.location.subcity || availableWoredas.length === 0}
                                            className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">{!formData.location.subcity ? '-- Select sub-city first --' : '-- Select Woreda --'}</option>
                                            {availableWoredas.map((w: any) => (
                                                <option key={w._id} value={w.name}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Block */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">Block</label>
                                        <input
                                            type="text"
                                            value={formData.location.block || ''}
                                            onChange={e => {
                                                updateNested('location.block', e.target.value);
                                                updateNested('household_profile.identity_location.block', e.target.value);
                                            }}
                                            placeholder="e.g. 12"
                                            className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                        />
                                    </div>

                                    {/* House Number */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">House Number</label>
                                        <input
                                            type="text"
                                            value={formData.location.house_no || ''}
                                            onChange={e => {
                                                updateNested('location.house_no', e.target.value);
                                                updateNested('household_profile.identity_location.house_no', e.target.value);
                                            }}
                                            placeholder="e.g. 1045"
                                            className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Enumerator Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">Enumerator Name</label>
                                        <input
                                            type="text"
                                            value={formData.household_profile?.identity_location?.enumerator_name || ''}
                                            onChange={e => updateNested('household_profile.identity_location.enumerator_name', e.target.value)}
                                            placeholder="e.g. Abebe Kebede"
                                            className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Survey Date */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">Survey Date</label>
                                        <input
                                            type="date"
                                            value={formData.assessment_date ? new Date(formData.assessment_date).toISOString().split('T')[0] : ''}
                                            onChange={e => {
                                                updateNested('assessment_date', e.target.value);
                                                updateNested('household_profile.identity_location.survey_date', e.target.value);
                                            }}
                                            className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Respondent Consent Status */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block">Respondent Consent Status</label>
                                        <select
                                            value={formData.household_profile?.identity_location?.respondent_consent_status || ''}
                                            onChange={e => updateNested('household_profile.identity_location.respondent_consent_status', e.target.value)}
                                            className="w-full bg-white border-2 border-slate-200 focus:border-[#465FFF] focus:ring-4 focus:ring-[#465FFF]/10 rounded-2xl p-3.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                        >
                                            <option value="">Select status...</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>

                                    {/* ─── Auto GPS Detection Section ───────────────────────────────────── */}
                                    <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-2 border-indigo-100 rounded-3xl p-5 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-[#465FFF] text-white flex items-center justify-center shadow-md">
                                                    <Navigation size={16} className={locating ? 'animate-spin' : ''} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Device GPS Location</h4>
                                                    <p className="text-[10px] font-bold text-slate-500">Auto-detected user location coordinates</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={captureGpsLocation}
                                                disabled={locating}
                                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-[#465FFF] hover:bg-indigo-50 text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                <RefreshCw size={12} className={locating ? 'animate-spin' : ''} />
                                                {locating ? 'Detecting...' : 'Recapture Location'}
                                            </button>
                                        </div>

                                        {locationError && (
                                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-xs font-bold">
                                                <AlertCircle size={14} className="flex-shrink-0" />
                                                <span>{locationError}</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 pt-1">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center justify-between">
                                                    <span>GPS Lat</span>
                                                    <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">Auto-Captured</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.household_profile?.identity_location?.gps_latitude !== undefined ? formData.household_profile.identity_location.gps_latitude : (locating ? 'Detecting...' : 'Not Captured')}
                                                    className="w-full bg-slate-100/90 border-2 border-slate-200/80 rounded-2xl p-3.5 text-xs font-bold text-slate-700 cursor-not-allowed outline-none font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center justify-between">
                                                    <span>GPS Long</span>
                                                    <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">Auto-Captured</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.household_profile?.identity_location?.gps_longitude !== undefined ? formData.household_profile.identity_location.gps_longitude : (locating ? 'Detecting...' : 'Not Captured')}
                                                    className="w-full bg-slate-100/90 border-2 border-slate-200/80 rounded-2xl p-3.5 text-xs font-bold text-slate-700 cursor-not-allowed outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                        {accuracy !== null && locationStatus === 'success' && (
                                            <p className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 px-1">
                                                <CheckCircle2 size={11} /> Location captured with ~{accuracy}m accuracy
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Household Details */}
                        {step === 2 && (
                            <motion.div
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
                                        <Users size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Household Assessment Profile</h3>
                                        <p className="text-xs text-slate-400 font-medium">Capture demographics, livelihood, physical housing condition, preparedness, and recovery capacity.</p>
                                    </div>
                                </div>

                                {/* Category Sub-tabs Selector */}
                                <div className="flex bg-white p-1.5 rounded-2xl overflow-x-auto gap-1 border border-slate-200/80 shadow-sm">
                                    {[
                                        { id: 'demographics', label: 'Demographics', icon: Users },
                                        { id: 'livelihood', label: 'Livelihood & Economy', icon: FileText },
                                        { id: 'housing', label: 'Housing Conditions', icon: Building },
                                        { id: 'preparedness', label: 'Preparedness', icon: Shield },
                                        { id: 'recovery', label: 'Recovery Capacity', icon: Heart }
                                    ].map(sub => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => setSubStep(sub.id as HHSubStep)}
                                            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                                                subStep === sub.id
                                                    ? 'bg-[#465FFF] text-white shadow-md'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            <sub.icon size={14} />
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Sub-Tab Contents */}
                                {subStep === 'demographics' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm space-y-5">
                                            <h4 className="text-[10px] font-black text-[#465FFF] uppercase tracking-[0.2em] mb-3">Members & Headcounts</h4>
                                            {[
                                                { l: 'Total members', f: 'total_household_members' },
                                                { l: 'Male members', f: 'male_members' },
                                                { l: 'Female members', f: 'female_members' },
                                                { l: 'Children (0-17)', f: 'children_0_17' },
                                                { l: 'Youth (18-29)', f: 'youth_18_29' },
                                                { l: 'Elderly (60+)', f: 'elderly_60_plus' }
                                            ].map(item => (
                                                <div key={item.f} className="flex items-center justify-between gap-4">
                                                    <span className="text-xs font-bold text-slate-600">{item.l}</span>
                                                    <input
                                                        type="number" min="0"
                                                        value={(demographics as any)[item.f] ?? 0}
                                                        onChange={e => updateNested(`household_profile.demographics.${item.f}`, Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="w-24 border-2 border-slate-200 rounded-xl p-2 text-center text-sm font-black outline-none focus:border-[#465FFF] bg-slate-50 text-slate-900"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-5">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Vulnerabilities & Head Details</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Female-headed?</label>
                                                    <select
                                                        value={demographics.female_headed_household || 'No'}
                                                        onChange={e => updateNested('household_profile.demographics.female_headed_household', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">IDP Status</label>
                                                    <select
                                                        value={demographics.idp_status || 'No'}
                                                        onChange={e => updateNested('household_profile.demographics.idp_status', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Unknown" className="text-slate-900">Unknown</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {demographics.idp_status === 'Yes' && (
                                                <div className="space-y-1.5 animate-in fade-in duration-300">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">IDP Reason</label>
                                                    <input
                                                        type="text"
                                                        value={demographics.idp_reason || ''}
                                                        onChange={e => updateNested('household_profile.demographics.idp_reason', e.target.value)}
                                                        placeholder="e.g. Drought, Conflict..."
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Education of Head</label>
                                                <select
                                                    value={demographics.education_level_of_head || ''}
                                                    onChange={e => updateNested('household_profile.demographics.education_level_of_head', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                >
                                                    <option value="" className="text-slate-900">Select Education...</option>
                                                    {EDUCATION_CATS.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Employment of Head</label>
                                                <select
                                                    value={demographics.employment_status || ''}
                                                    onChange={e => updateNested('household_profile.demographics.employment_status', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                >
                                                    <option value="" className="text-slate-900">Select Employment...</option>
                                                    {['Employed', 'Unemployed', 'Self-employed', 'Student', 'Retired', 'Other'].map(emp => (
                                                        <option key={emp} value={emp} className="text-slate-900">{emp}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'livelihood' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm space-y-5">
                                            <h4 className="text-[10px] font-black text-[#465FFF] uppercase tracking-[0.2em] mb-3">Livelihood Sources</h4>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Primary Livelihood</label>
                                                <select
                                                    value={livelihood.primary_livelihood_type || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.primary_livelihood_type', e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                >
                                                    <option value="">Select Primary livelihood...</option>
                                                    {LIVELIHOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Secondary Livelihood</label>
                                                <select
                                                    value={livelihood.secondary_livelihood_type || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.secondary_livelihood_type', e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                >
                                                    <option value="None">None</option>
                                                    {LIVELIHOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Household Income Level</label>
                                                <select
                                                    value={livelihood.household_income_level || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.household_income_level', e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                >
                                                    <option value="">Select Income Level...</option>
                                                    {['Low', 'Medium', 'High'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-5">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Economic Vulnerabilities</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Small Business Owner?</label>
                                                    <select
                                                        value={livelihood.small_business_ownership || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.small_business_ownership', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Daily Labor Dependent?</label>
                                                    <select
                                                        value={livelihood.daily_labour_dependency || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.daily_labour_dependency', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {livelihood.small_business_ownership === 'Yes' && (
                                                <div className="space-y-1.5 animate-in fade-in duration-300">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Business Type</label>
                                                    <input
                                                        type="text"
                                                        value={livelihood.small_business_type || ''}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.small_business_type', e.target.value)}
                                                        placeholder="e.g. Retail Shop, Tailoring..."
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Disaster Income Disruption</label>
                                                <input
                                                    type="text"
                                                    value={livelihood.income_disruption_by_disaster || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.income_disruption_by_disaster', e.target.value)}
                                                    placeholder="e.g. Yes - 3 months, No"
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Insurance?</label>
                                                    <select
                                                        value={livelihood.insurance_coverage || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.insurance_coverage', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Partial" className="text-slate-900">Partial</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Safety Net / Credit Access</label>
                                                    <select
                                                        value={livelihood.access_to_credit_safety_nets || ''}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.access_to_credit_safety_nets', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select access level...</option>
                                                        <option value="Good Access" className="text-slate-900">Good Access</option>
                                                        <option value="Limited Access" className="text-slate-900">Limited Access</option>
                                                        <option value="No Access" className="text-slate-900">No Access</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'housing' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm space-y-5">
                                            <h4 className="text-[10px] font-black text-[#465FFF] uppercase tracking-[0.2em] mb-3">Structure Characteristics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Wall Material</label>
                                                    <input
                                                        type="text"
                                                        value={housing.wall_material_type || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.wall_material_type', e.target.value)}
                                                        placeholder="e.g. Brick, Wood and Mud"
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Roof Material</label>
                                                    <input
                                                        type="text"
                                                        value={housing.roof_material_type || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.roof_material_type', e.target.value)}
                                                        placeholder="e.g. Corrugated Iron"
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Building Age (years)</label>
                                                    <input
                                                        type="number" min="0"
                                                        value={housing.building_age_years ?? 0}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.building_age_years', Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Sleeping Rooms</label>
                                                    <input
                                                        type="number" min="0"
                                                        value={housing.sleeping_rooms ?? 0}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.sleeping_rooms', Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-5">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Compliance & Hazard Exposure</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Informal Settlement?</label>
                                                    <select
                                                        value={housing.informal_settlement || 'No'}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.informal_settlement', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Building Compliance</label>
                                                    <select
                                                        value={housing.building_code_compliance || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.building_code_compliance', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select compliance...</option>
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Unsure" className="text-slate-900">Unsure</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Fire Resistant?</label>
                                                    <select
                                                        value={housing.fire_resistant_materials || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.fire_resistant_materials', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select fire resistant...</option>
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Partial" className="text-slate-900">Partial</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Utilities Access</label>
                                                    <select
                                                        value={housing.drainage_water_electricity_access || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.drainage_water_electricity_access', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select utility access...</option>
                                                        <option value="Full Access" className="text-slate-900">Full Access</option>
                                                        <option value="Partial Access" className="text-slate-900">Partial Access</option>
                                                        <option value="No Access" className="text-slate-900">No Access</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Proximity to Hazard Zone</label>
                                                <input
                                                    type="text"
                                                    value={housing.proximity_to_hazard_zone || ''}
                                                    onChange={e => updateNested('household_profile.housing_physical_conditions.proximity_to_hazard_zone', e.target.value)}
                                                    placeholder="e.g. Yes - 50m to River, No"
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'preparedness' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm space-y-5">
                                            <h4 className="text-[10px] font-black text-[#465FFF] uppercase tracking-[0.2em] mb-3">Emergency Preparedness</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Knows emergency shelter?</label>
                                                    <select
                                                        value={preparedness.knows_nearest_emergency_shelter || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.knows_nearest_emergency_shelter', e.target.value)}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Knows evacuation route?</label>
                                                    <select
                                                        value={preparedness.knows_local_evacuation_route || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.knows_local_evacuation_route', e.target.value)}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Emergency plan exists?</label>
                                                    <select
                                                        value={preparedness.family_emergency_plan_exists || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.family_emergency_plan_exists', e.target.value)}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Stockpiled supplies?</label>
                                                    <select
                                                        value={preparedness.emergency_supplies_stockpiled || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.emergency_supplies_stockpiled', e.target.value)}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="Partial">Partial</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-5">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">DRM training & communication</h4>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">DRM Training Received</label>
                                                <input
                                                    type="text"
                                                    value={preparedness.drm_training_received_type || ''}
                                                    onChange={e => updateNested('household_profile.preparedness.drm_training_received_type', e.target.value)}
                                                    placeholder="e.g. First Aid, Kebele Fire Drills"
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Early Warning Channel</label>
                                                <input
                                                    type="text"
                                                    value={preparedness.early_warning_received_channel || ''}
                                                    onChange={e => updateNested('household_profile.preparedness.early_warning_received_channel', e.target.value)}
                                                    placeholder="e.g. SMS, Kebele Megaphone"
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Awareness self-rated (1-5)</label>
                                                <input
                                                    type="range" min="1" max="5"
                                                    value={preparedness.community_awareness_self_rated_1_5 || 3}
                                                    onChange={e => updateNested('household_profile.preparedness.community_awareness_self_rated_1_5', parseInt(e.target.value) || 3)}
                                                    className="w-full accent-[#465FFF]"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                    <span>1 (Very low)</span>
                                                    <span>5 (Expert)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'recovery' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm space-y-5">
                                            <h4 className="text-[10px] font-black text-[#465FFF] uppercase tracking-[0.2em] mb-3">Past Disaster Experience</h4>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Type of disaster experienced</label>
                                                <input
                                                    type="text"
                                                    value={recovery.past_disaster_experience_type || ''}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.past_disaster_experience_type', e.target.value)}
                                                    placeholder="e.g. Flood, House fire"
                                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 block">Recovery duration (months)</label>
                                                <input
                                                    type="number" min="0"
                                                    value={recovery.recovery_duration_months ?? 0}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.recovery_duration_months', Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-[#465FFF]"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-5">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Financial & Social Buffers</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Savings group member?</label>
                                                    <select
                                                        value={recovery.self_help_savings_group_membership || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.self_help_savings_group_membership', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Safety net access?</label>
                                                    <select
                                                        value={recovery.government_safety_net_access || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.government_safety_net_access', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Income diversification (2+ sources)?</label>
                                                <select
                                                    value={recovery.income_diversification_2plus_sources || 'No'}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.income_diversification_2plus_sources', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/15 rounded-2xl p-3 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                >
                                                    <option value="Yes" className="text-slate-900">Yes</option>
                                                    <option value="No" className="text-slate-900">No</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block">Resilience self-assessment (1-5)</label>
                                                <input
                                                    type="range" min="1" max="5"
                                                    value={recovery.resilience_enumerator_assessment_1_5 || 3}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.resilience_enumerator_assessment_1_5', parseInt(e.target.value) || 3)}
                                                    className="w-full accent-[#465FFF]"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                    <span>1 (Extremely vulnerable)</span>
                                                    <span>5 (Highly resilient)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 3: Review & Submit */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                <div className="rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl"
                                    style={{ background: 'linear-gradient(135deg, #1f3a8a 0%, #465FFF 50%, #6B7FF5 100%)' }}
                                >
                                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
                                        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />

                                    <div className="relative z-10 flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-lg flex-shrink-0">
                                            <CheckCircle2 size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 mb-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[9px] font-black uppercase tracking-widest">
                                                <Sparkles size={8} /> Protocol Review
                                            </div>
                                            <h3 className="text-2xl font-black tracking-tight leading-none">Household Survey Review</h3>
                                            <p className="text-white/70 text-xs font-medium mt-1">Review the target location, auto-detected GPS coordinates, and household details before submitting.</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Target Location</p>
                                            <p className="text-base font-black text-white">{formData.location.subcity || 'N/A'}, Woreda {formData.location.woreda || 'N/A'}</p>
                                            <p className="text-xs text-white/70 mt-1">Block: {formData.location.block || 'N/A'} • House: {formData.location.house_no || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Auto-Captured GPS</p>
                                            <p className="text-base font-black text-white font-mono">
                                                {formData.household_profile?.identity_location?.gps_latitude ?? 'N/A'}, {formData.household_profile?.identity_location?.gps_longitude ?? 'N/A'}
                                            </p>
                                            <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                                                <Navigation size={10} /> Device Sensor Captured
                                            </p>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Household Demographics</p>
                                            <p className="text-base font-black text-white">
                                                {formData.household_profile?.demographics?.total_household_members || 0} Total Members
                                            </p>
                                            <p className="text-xs text-white/70 mt-1">Primary Livelihood: {formData.household_profile?.livelihood_economy?.primary_livelihood_type || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ─── Footer Action Bar ────────────────────────────────────────── */}
                <div className="px-8 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between shadow-lg flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-[#465FFF]/30 hover:text-[#465FFF] transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>
                        )}

                        {step < totalSteps ? (
                            <button
                                type="button"
                                onClick={handleStepAdvance}
                                className="px-8 py-3.5 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)', boxShadow: '0 8px 24px rgba(70,95,255,0.35)' }}
                            >
                                Continue <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSaveWithCheck}
                                disabled={saving}
                                className="px-8 py-3.5 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #465FFF, #6B7FF5)', boxShadow: '0 8px 24px rgba(70,95,255,0.35)' }}
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                                {saving ? 'Saving...' : 'Save Household Survey'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Duplicate House Prompt Modal */}
                <DuplicateHousePromptModal
                    isOpen={conflictModalOpen}
                    conflict={conflictDetails}
                    onClose={() => setConflictModalOpen(false)}
                    onUpdateExisting={handleUpdateExistingConflict}
                    onRegisterNewHouseNo={handleRegisterNewHouseNo}
                    onRegisterAsNoHouseNo={handleRegisterAsNoHouseNo}
                />
            </motion.div>
        </motion.div>
    );
};

export default FormWizard;

