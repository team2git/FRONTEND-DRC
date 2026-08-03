import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Users, CheckCircle, Edit3, ChevronLeft, ChevronRight,
    Loader2, ShieldCheck, Info, FileText, Building, Shield, Heart
} from 'lucide-react';
import {
    type WoredaProfile as WProfile,
    type WoredaProfileInput as WProfileInput
} from '../../../api/woredaProfileService';
import {
    emptyHouseholdProfile, emptyProfile,
    EDUCATION_CATS, LIVELIHOOD_TYPES
} from './constants';
import { getLocationHierarchy, type LocationHierarchyItem } from '../../../api/locationService';

type HHSubStep = 'demographics' | 'livelihood' | 'housing' | 'preparedness' | 'recovery';

export const FormWizard: React.FC<{
    initial: WProfile | null;
    onSave: (data: WProfileInput) => void;
    onClose: () => void;
    saving: boolean;
}> = ({ initial, onSave, onClose, saving }) => {
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState<HHSubStep>('demographics');
    const totalSteps = 3;

    // Location hierarchy for dropdowns
    const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchyItem[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

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

    const sidebarSteps = [
        { s: 1, l: 'Location & Meta', i: MapPin },
        { s: 2, l: 'Household details', i: Users },
        { s: 3, l: 'Review & Submit', i: CheckCircle }
    ];

    const demographics = formData.household_profile?.demographics || {};
    const livelihood = formData.household_profile?.livelihood_economy || {};
    const housing = formData.household_profile?.housing_physical_conditions || {};
    const preparedness = formData.household_profile?.preparedness || {};
    const recovery = formData.household_profile?.recovery_capacity || {};

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-slate-955/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-6xl h-[85vh] bg-white rounded-[3rem] shadow-2xl flex overflow-hidden border border-slate-100">
                {/* Left Sidebar Steps */}
                <div className="w-72 bg-slate-900 p-8 flex flex-col justify-between overflow-hidden relative">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
                                <Edit3 size={20} />
                            </div>
                            <h2 className="text-white font-black tracking-tight">{initial ? 'Update' : 'New'} Household Survey</h2>
                        </div>
                        <div className="space-y-3">
                            {sidebarSteps.map(item => (
                                <button key={item.s} type="button" onClick={() => setStep(item.s)} className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all ${step === item.s ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                                    <item.i size={18} className={step === item.s ? 'text-white' : 'text-slate-500'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.l}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info size={12} /> Household Survey
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            Recording individual household data — location, demographics, livelihood, housing physical condition, preparedness, and recovery capacity.
                        </p>
                    </div>
                </div>

                {/* Right Form Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/50">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Location & Metadata</h3>
                                    <p className="text-slate-400 text-sm font-medium">Define the exact household location including block and house number, and respondent metadata.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Subcity Dropdown */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sub-city</label>
                                        {loadingLocations ? (
                                            <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-2 text-slate-400">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span className="text-sm">Loading...</span>
                                            </div>
                                        ) : (
                                            <select
                                                value={formData.location.subcity || ''}
                                                onChange={e => {
                                                    updateNested('location.subcity', e.target.value);
                                                    updateNested('location.woreda', '');
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none border-slate-200"
                                            >
                                                <option value="">-- Select Sub-city --</option>
                                                {locationHierarchy.map(s => (
                                                    <option key={s._id} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    {/* Woreda Dropdown */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Woreda</label>
                                        <select
                                            value={formData.location.woreda || ''}
                                            onChange={e => {
                                                updateNested('location.woreda', e.target.value);
                                                updateNested('household_profile.identity_location.woreda', e.target.value);
                                                updateNested('household_profile.identity_location.subcity', formData.location.subcity);
                                            }}
                                            disabled={!formData.location.subcity || availableWoredas.length === 0}
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed border-slate-200"
                                        >
                                            <option value="">{!formData.location.subcity ? '-- Select sub-city first --' : '-- Select Woreda --'}</option>
                                            {availableWoredas.map((w: any) => (
                                                <option key={w._id} value={w.name}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Kebele */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kebele</label>
                                        <input
                                            type="text"
                                            value={formData.location.kebele || ''}
                                            onChange={e => {
                                                updateNested('location.kebele', e.target.value);
                                                updateNested('household_profile.identity_location.kebele', e.target.value);
                                            }}
                                            placeholder="e.g. 05"
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    {/* Block */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Block</label>
                                        <input
                                            type="text"
                                            value={formData.location.block || ''}
                                            onChange={e => {
                                                updateNested('location.block', e.target.value);
                                                updateNested('household_profile.identity_location.block', e.target.value);
                                            }}
                                            placeholder="e.g. 12"
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    {/* House Number */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">House Number</label>
                                        <input
                                            type="text"
                                            value={formData.location.house_no || ''}
                                            onChange={e => {
                                                updateNested('location.house_no', e.target.value);
                                                updateNested('household_profile.identity_location.house_no', e.target.value);
                                            }}
                                            placeholder="e.g. 1045"
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    {/* Enumerator Name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Enumerator Name</label>
                                        <input
                                            type="text"
                                            value={formData.household_profile?.identity_location?.enumerator_name || ''}
                                            onChange={e => updateNested('household_profile.identity_location.enumerator_name', e.target.value)}
                                            placeholder="e.g. Abebe Kebede"
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    {/* GPS Coordinates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">GPS Lat</label>
                                            <input
                                                type="number" step="any"
                                                value={formData.household_profile?.identity_location?.gps_latitude ?? ''}
                                                onChange={e => updateNested('household_profile.identity_location.gps_latitude', parseFloat(e.target.value) || undefined)}
                                                placeholder="e.g. 9.03"
                                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">GPS Long</label>
                                            <input
                                                type="number" step="any"
                                                value={formData.household_profile?.identity_location?.gps_longitude ?? ''}
                                                onChange={e => updateNested('household_profile.identity_location.gps_longitude', parseFloat(e.target.value) || undefined)}
                                                placeholder="e.g. 38.74"
                                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                            />
                                        </div>
                                    </div>
                                    {/* Assessment / Survey Date */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Survey Date</label>
                                        <input
                                            type="date"
                                            value={formData.assessment_date ? new Date(formData.assessment_date).toISOString().split('T')[0] : ''}
                                            onChange={e => {
                                                updateNested('assessment_date', e.target.value);
                                                updateNested('household_profile.identity_location.survey_date', e.target.value);
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    {/* Consent status */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Respondent Consent Status</label>
                                        <select
                                            value={formData.household_profile?.identity_location?.respondent_consent_status || ''}
                                            onChange={e => updateNested('household_profile.identity_location.respondent_consent_status', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20"
                                        >
                                            <option value="">Select status...</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Household Details</h3>
                                        <p className="text-slate-400 text-sm font-medium">Capture granular demographics, livelihood, housing physical conditions, preparedness and recovery buffers.</p>
                                    </div>
                                </div>

                                {/* Category Sub-tabs Selector */}
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto gap-1 border border-slate-200/50">
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
                                            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${subStep === sub.id ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                        >
                                            <sub.icon size={14} />
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Sub-Tab Contents */}
                                {subStep === 'demographics' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Members & Headcounts</h4>
                                            {[
                                                { l: 'Total members', f: 'total_household_members' },
                                                { l: 'Male members', f: 'male_members' },
                                                { l: 'Female members', f: 'female_members' },
                                                { l: 'Children (0-17)', f: 'children_0_17' },
                                                { l: 'Youth (18-29)', f: 'youth_18_29' },
                                                { l: 'Elderly (60+)', f: 'elderly_60_plus' }
                                            ].map(item => (
                                                <div key={item.f} className="flex items-center justify-between gap-4">
                                                    <span className="text-xs font-bold text-slate-500">{item.l}</span>
                                                    <input
                                                        type="number" min="0"
                                                        value={(demographics as any)[item.f] ?? 0}
                                                        onChange={e => updateNested(`household_profile.demographics.${item.f}`, Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="w-24 border rounded-xl p-2 text-center text-sm font-black outline-none bg-slate-50 border-slate-200 text-slate-900"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4">Vulnerabilities & Head Details</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Female-headed?</label>
                                                    <select
                                                        value={demographics.female_headed_household || 'No'}
                                                        onChange={e => updateNested('household_profile.demographics.female_headed_household', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">IDP Status</label>
                                                    <select
                                                        value={demographics.idp_status || 'No'}
                                                        onChange={e => updateNested('household_profile.demographics.idp_status', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Unknown" className="text-slate-900">Unknown</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {demographics.idp_status === 'Yes' && (
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">IDP Reason</label>
                                                    <input
                                                        type="text"
                                                        value={demographics.idp_reason || ''}
                                                        onChange={e => updateNested('household_profile.demographics.idp_reason', e.target.value)}
                                                        placeholder="e.g. Drought, Conflict..."
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Education of Head</label>
                                                <select
                                                    value={demographics.education_level_of_head || ''}
                                                    onChange={e => updateNested('household_profile.demographics.education_level_of_head', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                >
                                                    <option value="" className="text-slate-900">Select Education...</option>
                                                    {EDUCATION_CATS.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Employment of Head</label>
                                                <select
                                                    value={demographics.employment_status || ''}
                                                    onChange={e => updateNested('household_profile.demographics.employment_status', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Livelihood Sources</h4>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Livelihood</label>
                                                <select
                                                    value={livelihood.primary_livelihood_type || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.primary_livelihood_type', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                                >
                                                    <option value="">Select Primary livelihood...</option>
                                                    {LIVELIHOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Secondary Livelihood</label>
                                                <select
                                                    value={livelihood.secondary_livelihood_type || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.secondary_livelihood_type', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                                >
                                                    <option value="None">None</option>
                                                    {LIVELIHOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Household Income Level</label>
                                                <select
                                                    value={livelihood.household_income_level || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.household_income_level', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                                >
                                                    <option value="">Select Income Level...</option>
                                                    {['Low', 'Medium', 'High'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4">Economic Vulnerabilities</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Small Business Owner?</label>
                                                    <select
                                                        value={livelihood.small_business_ownership || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.small_business_ownership', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Daily Labor Dependent?</label>
                                                    <select
                                                        value={livelihood.daily_labour_dependency || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.daily_labour_dependency', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {livelihood.small_business_ownership === 'Yes' && (
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Business Type</label>
                                                    <input
                                                        type="text"
                                                        value={livelihood.small_business_type || ''}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.small_business_type', e.target.value)}
                                                        placeholder="e.g. Retail Shop, Tailoring..."
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Disaster Income Disruption</label>
                                                <input
                                                    type="text"
                                                    value={livelihood.income_disruption_by_disaster || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.income_disruption_by_disaster', e.target.value)}
                                                    placeholder="e.g. Yes - 3 months, No"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Insurance?</label>
                                                    <select
                                                        value={livelihood.insurance_coverage || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.insurance_coverage', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Partial" className="text-slate-900">Partial</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Safety Net / Credit Access</label>
                                                    <select
                                                        value={livelihood.access_to_credit_safety_nets || ''}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.access_to_credit_safety_nets', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Structure Characteristics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Wall Material</label>
                                                    <input
                                                        type="text"
                                                        value={housing.wall_material_type || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.wall_material_type', e.target.value)}
                                                        placeholder="e.g. Brick, Wood and Mud"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Roof Material</label>
                                                    <input
                                                        type="text"
                                                        value={housing.roof_material_type || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.roof_material_type', e.target.value)}
                                                        placeholder="e.g. Corrugated Iron"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Building Age (years)</label>
                                                    <input
                                                        type="number" min="0"
                                                        value={housing.building_age_years ?? 0}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.building_age_years', Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Sleeping Rooms</label>
                                                    <input
                                                        type="number" min="0"
                                                        value={housing.sleeping_rooms ?? 0}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.sleeping_rooms', Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4">Compliance & Hazard Exposure</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Informal Settlement?</label>
                                                    <select
                                                        value={housing.informal_settlement || 'No'}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.informal_settlement', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Building Compliance</label>
                                                    <select
                                                        value={housing.building_code_compliance || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.building_code_compliance', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select compliance...</option>
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Unsure" className="text-slate-900">Unsure</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Fire Resistant?</label>
                                                    <select
                                                        value={housing.fire_resistant_materials || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.fire_resistant_materials', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select fire resistant...</option>
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Partial" className="text-slate-900">Partial</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Utilities Access</label>
                                                    <select
                                                        value={housing.drainage_water_electricity_access || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.drainage_water_electricity_access', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="" className="text-slate-900">Select utility access...</option>
                                                        <option value="Full Access" className="text-slate-900">Full Access</option>
                                                        <option value="Partial Access" className="text-slate-900">Partial Access</option>
                                                        <option value="No Access" className="text-slate-900">No Access</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Proximity to Hazard Zone</label>
                                                <input
                                                    type="text"
                                                    value={housing.proximity_to_hazard_zone || ''}
                                                    onChange={e => updateNested('household_profile.housing_physical_conditions.proximity_to_hazard_zone', e.target.value)}
                                                    placeholder="e.g. Yes - 50m to River, No"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'preparedness' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Emergency Preparedness</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Knows emergency shelter?</label>
                                                    <select
                                                        value={preparedness.knows_nearest_emergency_shelter || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.knows_nearest_emergency_shelter', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Knows evacuation route?</label>
                                                    <select
                                                        value={preparedness.knows_local_evacuation_route || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.knows_local_evacuation_route', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Emergency plan exists?</label>
                                                    <select
                                                        value={preparedness.family_emergency_plan_exists || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.family_emergency_plan_exists', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Stockpiled supplies?</label>
                                                    <select
                                                        value={preparedness.emergency_supplies_stockpiled || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.emergency_supplies_stockpiled', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="Partial">Partial</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4">DRM training & communication</h4>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">DRM Training Received</label>
                                                <input
                                                    type="text"
                                                    value={preparedness.drm_training_received_type || ''}
                                                    onChange={e => updateNested('household_profile.preparedness.drm_training_received_type', e.target.value)}
                                                    placeholder="e.g. First Aid, Kebele Fire Drills"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Early Warning Channel</label>
                                                <input
                                                    type="text"
                                                    value={preparedness.early_warning_received_channel || ''}
                                                    onChange={e => updateNested('household_profile.preparedness.early_warning_received_channel', e.target.value)}
                                                    placeholder="e.g. SMS, Kebele Megaphone"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Awareness self-rated (1-5)</label>
                                                <input
                                                    type="range" min="1" max="5"
                                                    value={preparedness.community_awareness_self_rated_1_5 || 3}
                                                    onChange={e => updateNested('household_profile.preparedness.community_awareness_self_rated_1_5', parseInt(e.target.value) || 3)}
                                                    className="w-full accent-brand-500"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Past Disaster Experience</h4>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Type of disaster experienced</label>
                                                <input
                                                    type="text"
                                                    value={recovery.past_disaster_experience_type || ''}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.past_disaster_experience_type', e.target.value)}
                                                    placeholder="e.g. Flood, House fire"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Recovery duration (months)</label>
                                                <input
                                                    type="number" min="0"
                                                    value={recovery.recovery_duration_months ?? 0}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.recovery_duration_months', Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4">Financial & Social Buffers</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Savings group member?</label>
                                                    <select
                                                        value={recovery.self_help_savings_group_membership || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.self_help_savings_group_membership', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Safety net access?</label>
                                                    <select
                                                        value={recovery.government_safety_net_access || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.government_safety_net_access', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Income diversification (2+ sources)?</label>
                                                <select
                                                    value={recovery.income_diversification_2plus_sources || 'No'}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.income_diversification_2plus_sources', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20"
                                                >
                                                    <option value="Yes" className="text-slate-900">Yes</option>
                                                    <option value="No" className="text-slate-900">No</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Resilience self-assessment (1-5)</label>
                                                <input
                                                    type="range" min="1" max="5"
                                                    value={recovery.resilience_enumerator_assessment_1_5 || 3}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.resilience_enumerator_assessment_1_5', parseInt(e.target.value) || 3)}
                                                    className="w-full accent-brand-500"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                    <span>1 (Extremely vulnerable)</span>
                                                    <span>5 (Highly resilient)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div className="bg-brand-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.4),_transparent_50%)]" />
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/25 flex items-center justify-center">
                                            <CheckCircle size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tight">Final Protocol Review</h3>
                                            <p className="text-white/60 text-sm font-medium">Review the survey metadata and location before submitting.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-brand-100 uppercase tracking-widest mb-1">Target Location</p>
                                            <p className="text-lg font-black">{formData.location.subcity || 'N/A'}, Woreda {formData.location.woreda || 'N/A'}</p>
                                            <p className="text-xs text-white/50">Block: {formData.location.block || 'N/A'} • House: {formData.location.house_no || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-brand-100 uppercase tracking-widest mb-1">Data Depth</p>
                                            <p className="text-lg font-black">
                                                {`${formData.household_profile?.demographics?.total_household_members || 0} Members • Household Protocol`}
                                            </p>
                                            <p className="text-xs text-white/50">Primary livelihood: {formData.household_profile?.livelihood_economy?.primary_livelihood_type || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-slate-200 p-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-8 py-4 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                            )}
                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="px-10 py-4 text-white bg-slate-900 hover:bg-brand-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
                                >
                                    Continue <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onSave(formData)}
                                    disabled={saving}
                                    className={`px-10 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''} bg-brand-600 hover:bg-brand-700 hover:shadow-brand-100`}
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    {saving ? 'Saving...' : 'Save Household Survey'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
export default FormWizard;
