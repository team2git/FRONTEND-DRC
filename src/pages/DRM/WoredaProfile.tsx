import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    MapPin, Users, ShieldCheck, Plus, X, Home, Heart, Wheat, Zap,
    Search, RefreshCw, ChevronRight, ChevronLeft, Loader2, BarChart3,
    FileText, CheckCircle, Clock, Edit3, Trash2, Eye,
    AlertTriangle,
    Upload, FileSpreadsheet, ArrowRightLeft, AlertCircle,
    Database, Layers, Filter, Box, Sparkles, Calculator, Info,
    Activity, TrendingUp, ArrowRight, Map as MapIcon
} from 'lucide-react';
import {
    getWoredaProfiles, getWoredaProfileStats, createWoredaProfile,
    updateWoredaProfile, deleteWoredaProfile, importWoredaProfile,
    syncFromInterview,
    type WoredaProfile as WProfile,
    type WoredaProfileInput as WProfileInput,
    type WoredaProfileStats
} from '../../api/woredaProfileService';
import { getProfileMappings, type ProfileMapping } from '../../api/profileMappingService';
import { Can } from '../../components/auth/PermissionGuard';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    addisAbabaGeoData, ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM, ADDIS_ABABA_BOUNDS,
    RISK_LEVELS, getRiskLevel, getRiskColor
} from './addisAbabaGeoData';


//  helpers 


const FACILITY_TYPES = ['Health Center', 'School', 'Police Station', 'Fire Station', 'Emergency Shelter'];
const LIVELIHOOD_TYPES = ['Agriculture', 'Livestock', 'Trade', 'Labor', 'Other'];
const EDUCATION_CATS = ['No Education', 'Primary', 'Secondary', 'Higher Education', 'Vocational'];
const VG_TYPES = ['Women-headed HH', 'Persons with Disability (PWD)', 'Elderly living alone', 'Orphans', 'Chronically ill'];
const CAPACITY_TYPES = ['Kebele DRM Committee', 'Community Volunteers', 'Early Warning System', 'Search & Rescue Team', 'First Aid Team'];


const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; strip: string }> = {
    Submitted: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', strip: 'bg-gradient-to-r from-emerald-400 to-teal-500' },
    Reviewed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', strip: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
    Draft: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', strip: 'bg-gradient-to-r from-amber-400 to-orange-500' },
};

const statusColor = (s?: string) => {
    const sc = STATUS_CONFIG[s || 'Draft'] || STATUS_CONFIG.Draft;
    return `${sc.bg} ${sc.text} border-transparent`;
};

const getProfileTitle = (profile: WProfile) => {
    const level = profile.aggregation_level || profile.hierarchy_summary?.aggregation_level || 'household';
    if (level === 'city') return 'City';
    if (level === 'subcity') return `${profile.location.subcity || 'Sub-city'} Sub-city`;
    if (level === 'woreda') return `Woreda ${profile.location.woreda || ''}`.trim();
    if (level === 'block') return `Block-${profile.location.block || ''}`.trim();
    if (level === 'household' && profile.location.house_no) {
        return `House ${profile.location.house_no}`;
    }
    return 'Household';
};

const getProfileSubtitle = (profile: WProfile) => {
    const level = profile.aggregation_level || profile.hierarchy_summary?.aggregation_level || 'household';
    if (level === 'city') return 'City Level Summary';
    if (level === 'subcity') return `${profile.location.subcity || 'Sub-city'} summary`;
    if (level === 'woreda') return `${profile.location.subcity || 'Sub-city'} â€¢ Woreda ${profile.location.woreda || ''}`.trim();
    if (level === 'block') return `${profile.location.subcity || 'Sub-city'} â€¢ Woreda ${profile.location.woreda || ''} â€¢ Block-${profile.location.block || ''}`.trim();
    if (level === 'household') {
        const blockLabel = profile.location.block !== 'Unknown' && profile.location.block !== 'All Blocks' ? `Block-${profile.location.block} â€¢ ` : '';
        return `${blockLabel}Woreda ${profile.location.woreda}`.trim();
    }
    return profile.location.subcity || 'Survey record';
};



const emptyHouseholdProfile = () => ({
    identity_location: {
        subcity: '',
        woreda: '',
        // kebele: '',
        block: '',
        house_no: '',
        gps_latitude: undefined as number | undefined,
        gps_longitude: undefined as number | undefined,
        enumerator_name: '',
        survey_date: new Date().toISOString().split('T')[0],
        respondent_consent_status: 'Pending' as const
    },
    demographics: {
        total_household_members: 0,
        male_members: 0,
        female_members: 0,
        children_0_17: 0,
        youth_18_29: 0,
        elderly_60_plus: 0,
        female_headed_household: 'No' as const,
        idp_status: 'Unknown' as const,
        idp_reason: '',
        education_level_of_head: '',
        employment_status: ''
    },
    livelihood_economy: {
        primary_livelihood_type: '',
        secondary_livelihood_type: '',
        household_income_level: '',
        small_business_ownership: 'No' as const,
        small_business_type: '',
        daily_labour_dependency: 'No' as const,
        income_disruption_by_disaster: '',
        insurance_coverage: 'No' as const,
        access_to_credit_safety_nets: ''
    },
    housing_physical_conditions: {
        wall_material_type: '',
        roof_material_type: '',
        building_age_years: 0,
        building_code_compliance: '',
        informal_settlement: 'No' as const,
        sleeping_rooms: 0,
        fire_resistant_materials: '',
        proximity_to_hazard_zone: '',
        drainage_water_electricity_access: ''
    },
    preparedness: {
        knows_nearest_emergency_shelter: 'No' as const,
        knows_local_evacuation_route: 'No' as const,
        drm_training_received_type: '',
        family_emergency_plan_exists: 'No' as const,
        emergency_supplies_stockpiled: 'No' as const,
        early_warning_received_channel: '',
        community_awareness_self_rated_1_5: 0
    },
    recovery_capacity: {
        past_disaster_experience_type: '',
        recovery_duration_months: 0,
        self_help_savings_group_membership: 'No' as const,
        government_safety_net_access: 'No' as const,
        income_diversification_2plus_sources: 'No' as const,
        resilience_enumerator_assessment_1_5: 0
    }
});

const emptyProfile = (): WProfileInput => ({
    location: { subcity: '', woreda: '', kebele: '', block: '', house_no: '' },
    assessment_date: new Date().toISOString().split('T')[0],
    remarks: '',
    household_profile: emptyHouseholdProfile(),
    survey_metadata: {
        source_type: 'Site Survey',
        source_id: '',
        institution_name: '',
        assessor: '',
        version: '',
        gps_coordinates: '',
        location_reference: '',
        captured_at: new Date().toISOString()
    },
    raw_survey: {
        household_level: { responses: {}, notes: '', captured_at: new Date().toISOString() },
        community_group_discussion: { responses: {}, notes: '', captured_at: new Date().toISOString() },
        key_informant_interview: { responses: {}, notes: '', captured_at: new Date().toISOString() }
    },
    demographics: { total_population: 0, male_population: 0, female_population: 0, children_0_17: 0, youth_18_29: 0, adults_30_59: 0, elderly_60_plus: 0, total_households: 0, female_headed_households: 0, informal_settlement_population: 0, low_income_households: 0, unemployment_rate: 0, internally_displaced_population: 0, education_levels: EDUCATION_CATS.map(c => ({ category: c, count: 0 })) },
    livelihoods: LIVELIHOOD_TYPES.map(t => ({ livelihood_type: t, households: 0, percentage: 0 })),
    basic_services: { water_source: '', electricity: false, road_access: '', drainage_system_coverage: false, solid_waste_management_coverage: false, telecommunications_access: false, critical_lifeline_redundancy: false },
    critical_facilities: FACILITY_TYPES.map(f => ({ facility_type: f, distance_to_nearest_emergency_service: 0, structural_safety: '', emergency_equipment_available: false })),
    vulnerable_groups: VG_TYPES.map(t => ({ group_type: t, number: 0 })),
    community_capacity: CAPACITY_TYPES.map(t => ({ capacity_type: t, available: false, remarks: '' })),
    hazards: [],
    vulnerability_assessments: [],
    capacity_assessments: [],
    risk_assessments: [],
    risk_index: { hazard_index: 0, vulnerability_index: 0, exposure_index: 0, capacity_index: 0, overall_woreda_risk_score: 0 },
    economic_risk_indicators: {
        concentration_small_informal_businesses: '',
        market_exposure: '',
        daily_labor_dependency: '',
        business_interruption_risk: '',
        industrial_hazard_exposure: '',
        insurance_coverage_level: ''
    },
    environmental_indicators: {
        green_space_per_capita: '',
        wetland_encroachment: '',
        soil_sealing_coverage: '',
        waste_dumping_sites: '',
        urban_drainage_blockage_frequency: '',
        pollution_hotspots: ''
    },
    infrastructure_exposure: {
        road_network_status: '',
        health_facility_access: '',
        water_supply_coverage: '',
        sanitation_infrastructure_coverage: '',
        shelter_exposure: ''
    },
    community_voice_interventions: {
        priority_needs: '',
        local_response_capacity: '',
        early_warning_feedback: '',
        suggested_interventions: '',
        social_cohesion_level: ''
    },
    preparedness_indicators: {
        emergency_shelters_availability: '',
        evacuation_routes_mapped: '',
        firefighting_equipment_availability: '',
        ambulance_coverage: '',
        emergency_drills_frequency: '',
        community_awareness_level: '',
        stockpiled_emergency_supplies: ''
    },
    recovery_indicators: {
        post_disaster_recovery_plans: '',
        livelihood_diversification: '',
        access_to_credit_safety_nets: '',
        community_self_help_groups: '',
        urban_upgrading_programs: '',
        climate_adaptation_initiatives: ''
    },
    status: 'Draft',
});

// â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// â”€â”€â”€ Profile Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ProfileCard: React.FC<{
    profile: WProfile;
    onView: () => void;
    onDrillDown?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    drillDownLabel?: string;
    level: string;
}> = ({ profile, onView, onDrillDown, onEdit, onDelete, drillDownLabel, level }) => {
    const population = profile.demographics?.total_population ||
        profile.household_profile?.demographics?.total_household_members || 0;

    const riskScore = profile.risk_index?.overall_woreda_risk_score ||
        profile.hierarchy_summary?.dr_risk_score || 0;

    const levelConfig: Record<string, { gradient: string; lightBg: string; border: string; accent: string; icon: React.ElementType }> = {
        city: { gradient: 'from-indigo-500 to-blue-600', lightBg: 'bg-indigo-50/50', border: 'border-indigo-100', accent: 'text-indigo-600', icon: Database },
        subcity: { gradient: 'from-violet-500 to-purple-600', lightBg: 'bg-violet-50/50', border: 'border-violet-100', accent: 'text-violet-600', icon: Layers },
        woreda: { gradient: 'from-amber-500 to-orange-600', lightBg: 'bg-amber-50/50', border: 'border-amber-100', accent: 'text-amber-600', icon: Filter },
        block: { gradient: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50/50', border: 'border-emerald-100', accent: 'text-emerald-600', icon: Box },
        household: { gradient: 'from-rose-500 to-pink-600', lightBg: 'bg-rose-50/50', border: 'border-rose-100', accent: 'text-rose-600', icon: ShieldCheck },
    };

    const cfg = levelConfig[level] || levelConfig.household;
    const LevelIcon = cfg.icon;

    const getRiskStyle = (score: number) => {
        if (score >= 7.5) return { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50/50 hover:bg-rose-50 border-rose-100/50 hover:border-rose-100', bar: 'bg-rose-500', label: 'High' };
        if (score >= 4.5) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50/50 hover:bg-amber-50 border-amber-100/50 hover:border-amber-100', bar: 'bg-amber-500', label: 'Medium' };
        return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100/50 hover:border-emerald-100', bar: 'bg-emerald-500', label: 'Low' };
    };
    const riskStyle = getRiskStyle(riskScore);

    const hevcs = [
        { label: 'H', value: profile.risk_index?.hazard_index || 0, title: 'Hazard Index', color: 'text-red-600', bg: 'bg-red-50/60' },
        { label: 'E', value: profile.risk_index?.exposure_index || 0, title: 'Exposure Index', color: 'text-orange-600', bg: 'bg-orange-50/60' },
        { label: 'V', value: profile.risk_index?.vulnerability_index || 0, title: 'Vulnerability Index', color: 'text-amber-600', bg: 'bg-amber-50/60' },
        { label: 'C', value: profile.risk_index?.capacity_index || 0, title: 'Capacity Index', color: 'text-emerald-600', bg: 'bg-emerald-50/60' },
    ];

    const fallbackDrillDownLabel = drillDownLabel || (
        level === 'city' ? 'Explore Sub-Cities' :
            level === 'subcity' ? 'Explore Woredas' :
                level === 'woreda' ? 'Explore Blocks' :
                    level === 'block' ? 'Explore Households' : 'Explore'
    );

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onView}
            className="bg-white rounded-3xl border border-slate-100/80 shadow-md hover:shadow-2xl hover:border-indigo-100/80 transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[380px]"
        >
            {/* Top Color Accent Strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />

            {profile.hierarchy_summary?.rank_in_parent ? (
                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 z-10">
                    <Sparkles size={10} className="text-indigo-400 animate-pulse" />
                    Rank #{profile.hierarchy_summary.rank_in_parent}
                </div>
            ) : null}

            <div className="p-6 flex flex-col flex-1">
                {/* Header Section */}
                <div className="flex items-start gap-3.5 mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white shadow-lg shadow-black/10 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <LevelIcon size={20} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${cfg.lightBg} ${cfg.accent} border ${cfg.border}`}>
                                {(profile.aggregation_level || level).toUpperCase()}
                            </span>
                            {profile.hierarchy_summary?.source_profiles ? (
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                    {profile.hierarchy_summary.source_profiles} items
                                </span>
                            ) : null}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 truncate tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                            {getProfileTitle(profile)}
                        </h3>
                        <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                            {getProfileSubtitle(profile)}
                        </p>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100/60 hover:bg-white hover:border-indigo-50 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Users size={10} className="text-slate-400" />
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Population</p>
                        </div>
                        <p className="text-xl font-black text-slate-900 tracking-tight">
                            {population.toLocaleString()}
                        </p>
                    </div>
                    <div className={`${riskStyle.light} rounded-2xl p-3.5 border border-transparent transition-all duration-200`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <AlertTriangle size={10} className={riskStyle.text} />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DR Risk</p>
                            </div>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md ${riskStyle.bg} text-white`}>
                                {riskStyle.label}
                            </span>
                        </div>
                        <p className={`text-xl font-black ${riskStyle.text} tracking-tight`}>
                            {riskScore > 0 ? riskScore.toFixed(2) : '—'}
                        </p>
                        {/* Mini risk progress bar */}
                        <div className="mt-2 h-1 bg-white/80 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full ${riskStyle.bar} rounded-full`} style={{ width: `${Math.min((riskScore / 10) * 100, 100)}%` }} />
                        </div>
                    </div>
                </div>

                {/* HEVC Scorecard */}
                {level !== 'household' && (
                    <div className="mb-4 bg-slate-50/30 p-2.5 rounded-2xl border border-slate-100/50">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Risk Components (HEVC)</p>
                            <Calculator size={9} className="text-slate-400" />
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {hevcs.map(c => (
                                <div key={c.label} className={`${c.bg} rounded-xl p-2 text-center transition-all hover:scale-105 hover:bg-white border border-white hover:border-slate-100 shadow-sm`} title={`${c.title}: ${c.value}`}>
                                    <p className={`text-xs font-black ${c.color}`}>{typeof c.value === 'number' ? c.value.toFixed(1) : '0'}</p>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{c.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status & Date strip */}
                <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50/80 rounded-2xl border border-slate-100/60 mb-4 mt-auto">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[profile.status || 'Draft']?.dot || 'bg-slate-400'} shadow-sm`} />
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{profile.status || 'Draft'}</span>
                    </div>
                    {profile.assessment_date ? (
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={9} />
                            {new Date(profile.assessment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    ) : null}
                </div>

                {/* Action Button Row */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center gap-1.5"
                    >
                        <Eye size={11} />
                        Details
                    </button>
                    {onDrillDown ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDrillDown(); }}
                            className={`flex-1 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 flex items-center justify-center gap-1.5`}
                        >
                            {fallbackDrillDownLabel}
                            <ArrowRight size={11} />
                        </button>
                    ) : null}
                    {level === 'household' && (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {onEdit ? (
                                <button onClick={onEdit} className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center">
                                    <Edit3 size={13} />
                                </button>
                            ) : null}
                            {onDelete ? (
                                <button onClick={onDelete} className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 flex items-center justify-center">
                                    <Trash2 size={13} />
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// â”€â”€â”€ Hierarchy Summary View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HierarchySummaryView: React.FC<{ profile: WProfile }> = ({ profile }) => {
    const summary = profile.hierarchy_summary || {
        aggregation_level: 'woreda',
        source_profiles: 0,
        total_population: 0,
        hazard_score: 0,
        exposure_score: 0,
        vulnerability_score: 0,
        capacity_score: 0,
        dr_risk_score: 0,
        rank_in_parent: 0
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Aggregation Level', value: (summary.aggregation_level || 'household').toUpperCase(), icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Source Items', value: summary.source_profiles, icon: Database, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Hierarchy Rank', value: `#${summary.rank_in_parent || '—'}`, icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Risk Percentile', value: 'Top 15%', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((item, i) => (
                    <div key={i} className={`${item.bg} rounded-[2rem] p-6 border border-white/50 shadow-sm`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${item.color} shadow-sm`}>
                                <item.icon size={20} />
                            </div>
                            <TrendingUp size={16} className="text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                        <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.4),_transparent_40%)]" />

                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Calculator className="text-indigo-400" />
                    Risk Index Disclosure
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {[
                            { label: 'Hazard Index (H)', value: summary.hazard_score || 0, formula: 'Average of top 3 localized hazards', desc: 'Measures physical threat intensity based on historical frequency and predicted severity.', color: 'from-rose-500 to-pink-500' },
                            { label: 'Exposure Index (E)', value: summary.exposure_score || 0, formula: '(Pop * 0.6) + (Infrastructure * 0.4)', desc: 'Rolls up individual household proximity to hazard zones and critical facility distance.', color: 'from-amber-500 to-orange-500' }
                        ].map((metric, i) => (
                            <div key={i} className="group">
                                <div className="flex items-end justify-between mb-2">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                                        <p className="text-sm font-bold text-white mt-1">{metric.formula}</p>
                                    </div>
                                    <p className="text-3xl font-black text-white">{metric.value}</p>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(metric.value / 10) * 100}%` }}
                                        className={`h-full bg-gradient-to-r ${metric.color}`}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium group-hover:text-slate-300 transition-colors">{metric.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'Vulnerability Index (V)', value: summary.vulnerability_score || 0, formula: 'Weighted average of social & physical indicators', desc: 'Aggregates household wall material, income levels, and presence of vulnerable groups.', color: 'from-indigo-500 to-violet-500' },
                            { label: 'Capacity Index (C)', value: summary.capacity_score || 0, formula: '1 - (Active Response Teams / Total Needed)', desc: 'Calculated as the inverse of available mitigation resources at the aggregated level.', color: 'from-emerald-500 to-teal-500' }
                        ].map((metric, i) => (
                            <div key={i} className="group">
                                <div className="flex items-end justify-between mb-2">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                                        <p className="text-sm font-bold text-white mt-1">{metric.formula}</p>
                                    </div>
                                    <p className="text-3xl font-black text-white">{metric.value}</p>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(metric.value / 10) * 100}%` }}
                                        className={`h-full bg-gradient-to-r ${metric.color}`}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium group-hover:text-slate-300 transition-colors">{metric.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Composite Disaster Risk Score</p>
                            <p className="text-4xl font-black text-white tracking-tighter">DR {summary.dr_risk_score || 0}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/10 max-w-sm">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info size={12} /> Aggregation Logic
                        </p>
                        <p className="text-xs text-slate-300 font-medium">This score rolls up from {summary.source_profiles} individual {summary.aggregation_level === 'block' ? 'households' : 'areas'}. Rank compared against all other units at the same level in the hierarchy.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ——— Strategic City Map (Choropleth) ————————————————————————————————————————
export const StrategicCityMap: React.FC<{ profiles: WProfile[] }> = ({ profiles }) => {
    const mapRef = React.useRef<L.Map | null>(null);
    const geoLayerRef = React.useRef<L.GeoJSON | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [hoveredSubCity, setHoveredSubCity] = React.useState<string | null>(null);

    // Build a lookup: subcity name -> risk data from profiles
    const subcityRiskMap = React.useMemo(() => {
        const map: Record<string, { risk: number; population: number; hazard: number; exposure: number; vulnerability: number; capacity: number; profiles: number }> = {};
        profiles.forEach(p => {
            const name = p.location.subcity;
            if (!name) return;
            const risk = p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 0;
            const pop = p.demographics?.total_population || p.hierarchy_summary?.total_population || 0;
            if (!map[name]) {
                map[name] = {
                    risk: risk,
                    population: pop,
                    hazard: p.risk_index?.hazard_index || p.hierarchy_summary?.hazard_score || 0,
                    exposure: p.risk_index?.exposure_index || p.hierarchy_summary?.exposure_score || 0,
                    vulnerability: p.risk_index?.vulnerability_index || p.hierarchy_summary?.vulnerability_score || 0,
                    capacity: p.risk_index?.capacity_index || p.hierarchy_summary?.capacity_score || 0,
                    profiles: 1
                };
            } else {
                // Average scores across multiple profiles for same sub-city
                const existing = map[name];
                const total = existing.profiles + 1;
                existing.risk = ((existing.risk * existing.profiles) + risk) / total;
                existing.population += pop;
                existing.hazard = ((existing.hazard * existing.profiles) + (p.risk_index?.hazard_index || 0)) / total;
                existing.exposure = ((existing.exposure * existing.profiles) + (p.risk_index?.exposure_index || 0)) / total;
                existing.vulnerability = ((existing.vulnerability * existing.profiles) + (p.risk_index?.vulnerability_index || 0)) / total;
                existing.capacity = ((existing.capacity * existing.profiles) + (p.risk_index?.capacity_index || 0)) / total;
                existing.profiles = total;
            }
        });
        return map;
    }, [profiles]);

    React.useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 11,
            maxZoom: 15,
            maxBounds: L.latLngBounds(ADDIS_ABABA_BOUNDS[0], ADDIS_ABABA_BOUNDS[1]),
            maxBoundsViscosity: 1.0
        }).setView(ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM);

        // Light-themed tile layer for better contrast with colored polygons
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Add zoom control to bottom-left
        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        // Create GeoJSON layer with choropleth coloring
        const geoLayer = L.geoJSON(addisAbabaGeoData as any, {
            style: (feature) => {
                const name = (feature as any)?.properties?.name || '';
                const data = subcityRiskMap[name];
                const riskScore = data ? data.risk : 0;
                const fillColor = data ? getRiskColor(riskScore) : '#94a3b8';

                return {
                    fillColor,
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    dashArray: '',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                const name = (feature as any)?.properties?.name || '';
                const data = subcityRiskMap[name];
                const riskScore = data ? data.risk : 0;
                const riskLevel = getRiskLevel(riskScore);
                const population = data ? data.population : 0;

                // Tooltip
                layer.bindTooltip(`
                    <div style="min-width: 220px; font-family: 'Outfit', sans-serif; padding: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${riskLevel.color}; flex-shrink: 0;"></div>
                            <span style="font-weight: 900; color: #0f172a; font-size: 14px; letter-spacing: -0.5px;">${name}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Risk Score</div>
                                <div style="font-size: 16px; font-weight: 900; color: ${riskLevel.color};">${riskScore.toFixed(1)}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Status</div>
                                <div style="font-size: 11px; font-weight: 900; color: ${riskLevel.color};">${riskLevel.label}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Population</div>
                                <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${population.toLocaleString()}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Profiles</div>
                                <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${data?.profiles || 0}</div>
                            </div>
                        </div>
                        ${data ? `
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Risk Components</div>
                            <div style="display: flex; gap: 4px;">
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.hazard)};">H</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.hazard.toFixed(1)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.exposure)};">E</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.exposure.toFixed(1)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.vulnerability)};">V</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.vulnerability.toFixed(1)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.capacity)};">C</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.capacity.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `, {
                    permanent: false,
                    direction: 'top',
                    className: 'risk-map-tooltip',
                    offset: [0, -10]
                });

                // Sub-city name labels at center
                const bounds = (layer as any).getBounds?.();
                if (bounds) {
                    const center = bounds.getCenter();
                    L.marker(center, {
                        icon: L.divIcon({
                            className: 'subcity-label',
                            html: `<div style="
                                font-family: 'Outfit', sans-serif;
                                font-weight: 900;
                                font-size: 10px;
                                color: #0f172a;
                                text-shadow: 0 0 4px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.8);
                                white-space: nowrap;
                                text-transform: uppercase;
                                letter-spacing: 1.5px;
                                pointer-events: none;
                            ">${name}</div>`,
                            iconSize: [0, 0],
                            iconAnchor: [0, 0]
                        }),
                        interactive: false
                    }).addTo(map);
                }

                // Hover effects
                layer.on({
                    mouseover: (e) => {
                        const target = e.target;
                        target.setStyle({
                            weight: 3,
                            color: '#1e293b',
                            fillOpacity: 0.9
                        });
                        target.bringToFront();
                        setHoveredSubCity(name);
                    },
                    mouseout: (e) => {
                        geoLayer.resetStyle(e.target);
                        setHoveredSubCity(null);
                    }
                });
            }
        }).addTo(map);

        geoLayerRef.current = geoLayer;
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            geoLayerRef.current = null;
        };
    }, [profiles, subcityRiskMap]);

    // Compute overall city stats
    const cityStats = React.useMemo(() => {
        const names = Object.keys(subcityRiskMap);
        if (names.length === 0) return { assessed: 0, avgRisk: 0, highRisk: 0, totalPop: 0 };
        const totalRisk = names.reduce((sum, n) => sum + subcityRiskMap[n].risk, 0);
        const highRisk = names.filter(n => subcityRiskMap[n].risk >= 7).length;
        const totalPop = names.reduce((sum, n) => sum + subcityRiskMap[n].population, 0);
        return {
            assessed: names.length,
            avgRisk: totalRisk / names.length,
            highRisk,
            totalPop
        };
    }, [subcityRiskMap]);

    return (
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl bg-white">
            {/* Map Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <MapPin size={22} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white tracking-tight">Addis Ababa Risk Map</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sub-City Choropleth &middot; Disaster Risk Distribution</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{cityStats.assessed} Sub-cities</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Avg Risk: <span className={`${cityStats.avgRisk >= 7 ? 'text-rose-400' : cityStats.avgRisk >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>{cityStats.avgRisk.toFixed(1)}</span></span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative h-[550px]">
                <div ref={containerRef} className="w-full h-full" />

                {/* Risk Legend - Bottom Right */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-slate-200 shadow-2xl max-w-[200px]">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
                        <Activity size={12} className="text-indigo-600" />
                        Risk Classification
                    </p>
                    <div className="space-y-1.5">
                        {RISK_LEVELS.map(level => (
                            <div key={level.label} className="flex items-center gap-3 group cursor-default">
                                <div
                                    className="w-5 h-3 rounded-sm flex-shrink-0 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: level.color }}
                                />
                                <div className="flex items-center justify-between flex-1 gap-2">
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{level.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{level.min}&ndash;{level.max}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-3 rounded-sm bg-slate-300 flex-shrink-0" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">No Data</span>
                        </div>
                    </div>
                </div>

                {/* Hovered Sub-city Quick Info - Top Right */}
                <AnimatePresence>
                    {hoveredSubCity && subcityRiskMap[hoveredSubCity] && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-6 right-6 z-[1000] bg-slate-900/95 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl min-w-[220px]"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getRiskColor(subcityRiskMap[hoveredSubCity].risk) }}
                                />
                                <h5 className="text-sm font-black text-white tracking-tight">{hoveredSubCity}</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Risk</p>
                                    <p className="text-lg font-black" style={{ color: getRiskColor(subcityRiskMap[hoveredSubCity].risk) }}>
                                        {subcityRiskMap[hoveredSubCity].risk.toFixed(1)}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pop</p>
                                    <p className="text-lg font-black text-white">
                                        {subcityRiskMap[hoveredSubCity].population.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
                                    style={{
                                        backgroundColor: getRiskColor(subcityRiskMap[hoveredSubCity].risk) + '22',
                                        color: getRiskColor(subcityRiskMap[hoveredSubCity].risk)
                                    }}
                                >
                                    {getRiskLevel(subcityRiskMap[hoveredSubCity].risk).label}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Map Attribution */}
                <div className="absolute bottom-6 left-6 z-[1000]">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400">Addis Ababa City Administration &middot; PDRM</p>
                    </div>
                </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-white border-t border-slate-100 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Total Population', value: cityStats.totalPop.toLocaleString(), color: 'text-indigo-600' },
                        { label: 'High Risk Areas', value: `${cityStats.highRisk} sub-cities`, color: 'text-rose-600' },
                        { label: 'Avg Risk Score', value: cityStats.avgRisk.toFixed(1), color: cityStats.avgRisk >= 7 ? 'text-rose-600' : cityStats.avgRisk >= 4 ? 'text-amber-600' : 'text-emerald-600' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            {i > 0 && <div className="w-px h-6 bg-slate-200" />}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{item.label}</p>
                                <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                    <Info size={12} />
                    <span>Hover over sub-cities for detailed risk breakdown</span>
                </div>
            </div>
        </div>
    );
};

// â”€â”€â”€ Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DetailView: React.FC<{ profile: WProfile; onClose: () => void }> = ({ profile, onClose }) => {
    const isHousehold = profile.aggregation_level === 'household' ||
        (profile.location.house_no && profile.location.house_no !== 'Aggregated Data' && profile.location.house_no !== '');

    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        setActiveTab('overview');
    }, [profile]);

    const tabs = isHousehold ? [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'hh_demographics', label: 'HH Profile & Livelihood', icon: Users },
        { id: 'hh_housing', label: 'Housing Conditions', icon: Home },
        { id: 'hh_preparedness', label: 'Preparedness & Recovery', icon: ShieldCheck },
    ] : [
        { id: 'overview', label: 'Overview & Risk', icon: BarChart3 },
        { id: 'demographics', label: 'Demographics', icon: Users },
        { id: 'livelihoods', label: 'Livelihoods & Economy', icon: Wheat },
        { id: 'services', label: 'Services & Facilities', icon: Zap },
        { id: 'vulnerable', label: 'Vulnerability & Capacity', icon: Heart },
        { id: 'hazards', label: 'Hazards & Risks', icon: AlertTriangle },
    ];

    const renderProgressBar = (value: number, max: number, colorClass: string, label?: string) => {
        const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
        return (
            <div className="space-y-1">
                {label && (
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <span>{label}</span>
                        <span>{pct.toFixed(0)}%</span>
                    </div>
                )}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        );
    };

    const hh = profile.household_profile || {
        identity_location: {},
        demographics: {},
        livelihood_economy: {},
        housing_physical_conditions: {},
        preparedness: {},
        recovery_capacity: {}
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-4xl h-full bg-slate-50 shadow-2xl flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                            <Eye size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{getProfileTitle(profile)}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getProfileSubtitle(profile)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs Row */}
                <div className="bg-white border-b border-slate-200 px-8 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600 font-black'
                                        : 'border-transparent text-slate-400 font-bold hover:text-slate-600'
                                    }`}
                            >
                                <Icon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* ADMINISTRATIVE OVERVIEW */}
                    {!isHousehold && activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Metadata & Summary widgets */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <Info size={16} className="text-indigo-600" />
                                            Identity & Meta Details
                                        </h3>
                                        <div className="space-y-3.5">
                                            {[
                                                { label: 'Sub-city', value: profile.location.subcity },
                                                { label: 'Woreda', value: profile.location.woreda },
                                                { label: 'Kebele', value: profile.location.kebele },
                                                { label: 'Block', value: profile.location.block },
                                                { label: 'Status', value: profile.status, isBadge: true }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                    {item.isBadge ? (
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${statusColor(item.value as string)}`}>{item.value}</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-900">{item.value || '—'}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-black mb-6 flex items-center gap-2">
                                            <Activity size={16} className="text-indigo-400 animate-pulse" />
                                            Overall Risk Summary
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DR Risk Score</p>
                                                <p className="text-4xl font-black text-indigo-400 tracking-tight">{(profile.risk_index?.overall_woreda_risk_score || profile.hierarchy_summary?.dr_risk_score || 0).toFixed(2)}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { label: 'Hazard', value: profile.risk_index?.hazard_index || profile.hierarchy_summary?.hazard_score, color: 'text-rose-400' },
                                                    { label: 'Exposure', value: profile.risk_index?.exposure_index || profile.hierarchy_summary?.exposure_score, color: 'text-amber-400' },
                                                    { label: 'Vulnerability', value: profile.risk_index?.vulnerability_index || profile.hierarchy_summary?.vulnerability_score, color: 'text-indigo-400' },
                                                    { label: 'Capacity', value: profile.risk_index?.capacity_index || profile.hierarchy_summary?.capacity_score, color: 'text-emerald-400' }
                                                ].map((m, i) => (
                                                    <div key={i} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                                                        <p className={`text-lg font-black ${m.color}`}>{m.value ? m.value.toFixed(2) : '0.00'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Aggregation Formulas */}
                            <HierarchySummaryView profile={profile} />
                        </div>
                    )}

                    {/* ADMINISTRATIVE DEMOGRAPHICS */}
                    {!isHousehold && activeTab === 'demographics' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Users className="text-indigo-600" size={18} />
                                    Aggregated Demographics
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: 'Total Population', value: (profile.demographics?.total_population || 0).toLocaleString(), desc: 'Sum of all residents' },
                                        { label: 'Total Households', value: (profile.demographics?.total_households || 0).toLocaleString(), desc: 'Total family units' },
                                        { label: 'Low Income HHs', value: (profile.demographics?.low_income_households || 0).toLocaleString(), desc: 'Below poverty line' },
                                        { label: 'IDP Residents', value: (profile.demographics?.internally_displaced_population || 0).toLocaleString(), desc: 'Displaced population' },
                                        { label: 'Unemployment Rate', value: `${profile.demographics?.unemployment_rate || 0}%`, desc: 'Average active labor gap' },
                                        { label: 'Informal Settlement Pop', value: (profile.demographics?.informal_settlement_population || 0).toLocaleString(), desc: 'Residing in slums' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Gender Split (Visual progress bar) */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-4">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Gender Distribution</h4>
                                    {(() => {
                                        const tot = profile.demographics?.total_population || 1;
                                        const male = profile.demographics?.male_population || 0;
                                        const female = profile.demographics?.female_population || 0;
                                        const malePct = (male / tot) * 100;
                                        const femalePct = (female / tot) * 100;
                                        return (
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[11px] font-black uppercase text-slate-500">
                                                    <span className="text-indigo-600">Male: {male.toLocaleString()} ({malePct.toFixed(1)}%)</span>
                                                    <span className="text-rose-500">Female: {female.toLocaleString()} ({femalePct.toFixed(1)}%)</span>
                                                </div>
                                                <div className="h-4 w-full bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                                                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${malePct}%` }} />
                                                    <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${femalePct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Age Categories */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-4">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Age Group Demographics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Children (0–17)', val: profile.demographics?.children_0_17 || 0, color: 'bg-emerald-500' },
                                            { label: 'Youth (18–29)', val: profile.demographics?.youth_18_29 || 0, color: 'bg-indigo-500' },
                                            { label: 'Adults (30–59)', val: profile.demographics?.adults_30_59 || 0, color: 'bg-amber-500' },
                                            { label: 'Elderly (60+)', val: profile.demographics?.elderly_60_plus || 0, color: 'bg-rose-500' }
                                        ].map((g, idx) => (
                                            <div key={idx} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{g.label}</span>
                                                    <span className="text-xs font-black text-slate-900">{g.val.toLocaleString()}</span>
                                                </div>
                                                {renderProgressBar(g.val, profile.demographics?.total_population || 1, g.color)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Education Statistics */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Aggregated Education Levels</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {(profile.demographics?.education_levels || []).map((e, i) => (
                                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black text-slate-900">{e.count.toLocaleString()}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5 tracking-wider truncate" title={e.category}>{e.category}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADMINISTRATIVE LIVELIHOODS */}
                    {!isHousehold && activeTab === 'livelihoods' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Wheat className="text-indigo-600" size={18} />
                                    Livelihoods & Livelihood Economy
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Livelihood Type Distribution</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(profile.livelihoods || []).map((l, i) => (
                                            <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800">{l.livelihood_type}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{(l.households ?? 0).toLocaleString()} households</p>
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-600">{(l.percentage ?? 0).toFixed(1)}%</span>
                                                </div>
                                                <div className="mt-2">
                                                    {renderProgressBar(l.percentage ?? 0, 100, 'bg-indigo-500')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Economic Risk Indicators</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Informal Businesses', value: profile.economic_risk_indicators?.concentration_small_informal_businesses, desc: 'Small/informal operations concentration' },
                                            { label: 'Market Exposure', value: profile.economic_risk_indicators?.market_exposure, desc: 'Market supply disruption risk' },
                                            { label: 'Daily Labor Dependency', value: profile.economic_risk_indicators?.daily_labor_dependency, desc: 'Relying on daily manual labor wages' },
                                            { label: 'Interruption Risk', value: profile.economic_risk_indicators?.business_interruption_risk, desc: 'Vulnerability to business closure' },
                                            { label: 'Industrial Hazard Exposure', value: profile.economic_risk_indicators?.industrial_hazard_exposure, desc: 'Proximity to factories/hazardous sites' },
                                            { label: 'Insurance Level', value: profile.economic_risk_indicators?.insurance_coverage_level, desc: 'Active insurance safety buffers' }
                                        ].map((indicator, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{indicator.label}</p>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${indicator.value === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                        indicator.value === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>{indicator.value || 'Low'}</span>
                                                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{indicator.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADMINISTRATIVE BASIC SERVICES & INFRASTRUCTURE */}
                    {!isHousehold && activeTab === 'services' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Zap className="text-indigo-600" size={18} />
                                    Services & Critical Infrastructure
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Service Coverage List */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Infrastructure Coverage</h4>
                                        <div className="space-y-3.5">
                                            {[
                                                { label: 'Electricity Access', value: profile.basic_services?.electricity ? 100 : 0 },
                                                { label: 'Drainage System Coverage', value: profile.basic_services?.drainage_system_coverage ? 100 : 0 },
                                                { label: 'Solid Waste Mgmt Coverage', value: profile.basic_services?.solid_waste_management_coverage ? 100 : 0 },
                                                { label: 'Telecommunications Access', value: profile.basic_services?.telecommunications_access ? 100 : 0 },
                                                { label: 'Critical Lifeline Redundancy', value: profile.basic_services?.critical_lifeline_redundancy ? 100 : 0 }
                                            ].map((svc, i) => (
                                                <div key={i} className="bg-white rounded-xl p-3.5 border border-slate-100 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{svc.label}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${svc.value === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200/50'
                                                        }`}>{svc.value === 100 ? 'Available' : 'Unavailable'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Primary Providers */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Service Types</h4>
                                            <div className="space-y-3.5">
                                                <div className="bg-white rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Water Source</p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">{profile.basic_services?.water_source || 'Piped Network Connection'}</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Road Access Grade</p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">{profile.basic_services?.road_access || 'All-Weather Paved Road'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 border border-indigo-100/50 rounded-xl p-4.5 mt-4">
                                            <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider mb-1">Infrastructure Resilience</p>
                                            <p className="text-[10px] text-indigo-600 leading-snug">Average distance to critical utility networks and backup lifelines at this administrative boundary.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Critical Facilities Table */}
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Distance & Safety of Emergency Facilities</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="py-2.5">Facility Type</th>
                                                    <th className="py-2.5">Avg Distance</th>
                                                    <th className="py-2.5">Structural Safety</th>
                                                    <th className="py-2.5">Emergency Equipment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-xs text-slate-800 font-bold">
                                                {(profile.critical_facilities || []).map((f, i) => (
                                                    <tr key={i}>
                                                        <td className="py-3.5">{f.facility_type}</td>
                                                        <td className="py-3.5 text-slate-900">{(f.distance_to_nearest_emergency_service ?? 0).toFixed(1)} km</td>
                                                        <td className="py-3.5">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${f.structural_safety === 'Good' ? 'bg-emerald-50 text-emerald-600' :
                                                                    f.structural_safety === 'Fair' ? 'bg-amber-50 text-amber-600' :
                                                                        'bg-rose-50 text-rose-600'
                                                                }`}>{f.structural_safety || 'Fair'}</span>
                                                        </td>
                                                        <td className="py-3.5">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black ${f.emergency_equipment_available ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                <CheckCircle size={10} /> {f.emergency_equipment_available ? 'Ready' : 'Not Found'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADMINISTRATIVE VULNERABLE GROUPS & CAPACITY */}
                    {!isHousehold && activeTab === 'vulnerable' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Heart className="text-indigo-600" size={18} />
                                    Social Vulnerability & DRM Capacity
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Vulnerable Groups list */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Social Vulnerability Index</h4>
                                        <div className="space-y-3">
                                            {(profile.vulnerable_groups || []).map((vg, i) => (
                                                <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Type</p>
                                                        <p className="text-xs font-black text-slate-800 mt-0.5">{vg.group_type}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-rose-500">{(vg.number ?? 0).toLocaleString()}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Residents</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* DRM Preparedness buffer list */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Community DRM Capacity</h4>
                                        <div className="space-y-3">
                                            {(profile.community_capacity || []).map((c, i) => (
                                                <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-xs font-black text-slate-800">{c.capacity_type}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${c.available ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                            }`}>{c.available ? 'Active' : 'Inactive'}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 leading-snug">{c.remarks || 'No remarks provided.'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADMINISTRATIVE HAZARDS & INDICATORS */}
                    {!isHousehold && activeTab === 'hazards' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <AlertTriangle className="text-indigo-600" size={18} />
                                    Active Localized Hazards & Indicators
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Hazard Assessments</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(profile.hazards || []).map((h, i) => (
                                            <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between shadow-sm">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hazard Type</p>
                                                    <p className="text-sm font-black text-slate-900 mt-0.5">{h.hazard_name}</p>
                                                </div>
                                                <div className="mt-4 flex justify-between gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${h.severity === 'Critical' || h.severity === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            h.severity === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        }`}>{h.severity} Sev</span>
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-slate-500">{h.frequency} Freq</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Environmental Sustainability</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Green Space', value: profile.environmental_indicators?.green_space_per_capita, desc: 'Average public green space ratio' },
                                            { label: 'Wetlands Encroachment', value: profile.environmental_indicators?.wetland_encroachment, desc: 'Rate of wetland degradation' },
                                            { label: 'Soil Sealing', value: profile.environmental_indicators?.soil_sealing_coverage, desc: 'Coverage of paved/concrete surfaces' },
                                            { label: 'Waste Dumping Sites', value: profile.environmental_indicators?.waste_dumping_sites, desc: 'Informal dumping and waste issues' },
                                            { label: 'Drainage Blockage', value: profile.environmental_indicators?.urban_drainage_blockage_frequency, desc: 'Blockage frequency in main canals' },
                                            { label: 'Pollution Hotspots', value: profile.environmental_indicators?.pollution_hotspots, desc: 'Localized air/water pollution status' }
                                        ].map((indicator, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{indicator.label}</p>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${indicator.value === 'Critical' || indicator.value === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                        indicator.value === 'Fair' || indicator.value === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>{indicator.value || 'Good'}</span>
                                                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{indicator.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HOUSEHOLD OVERVIEW */}
                    {isHousehold && activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <Info size={16} className="text-indigo-600" />
                                            Administrative Boundaries
                                        </h3>
                                        <div className="space-y-3.5">
                                            {[
                                                { label: 'Sub-city', value: profile.location.subcity },
                                                { label: 'Woreda', value: profile.location.woreda },
                                                { label: 'Kebele', value: profile.location.kebele },
                                                { label: 'Block', value: profile.location.block },
                                                { label: 'House No', value: profile.location.house_no },
                                                { label: 'Status', value: profile.status, isBadge: true }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                    {item.isBadge ? (
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${statusColor(item.value as string)}`}>{item.value}</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-900">{item.value || '—'}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <Clock size={16} className="text-indigo-600" />
                                        Survey Metadata
                                    </h3>
                                    <div className="space-y-3.5">
                                        {[
                                            { label: 'Source Protocol Type', value: profile.survey_metadata?.source_type },
                                            { label: 'Assessor Name', value: profile.survey_metadata?.assessor || hh.identity_location?.enumerator_name },
                                            { label: 'Institution Name', value: profile.survey_metadata?.institution_name || 'Addis Ababa DRM Agency' },
                                            { label: 'Assessment Date', value: profile.assessment_date ? new Date(profile.assessment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                                            { label: 'GPS Location', value: profile.survey_metadata?.gps_coordinates || (hh.identity_location?.gps_latitude ? `${hh.identity_location.gps_latitude}, ${hh.identity_location.gps_longitude}` : 'No coordinates') },
                                            { label: 'Consent Status', value: hh.identity_location?.respondent_consent_status as any, isBadge: true }
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                {item.isBadge ? (
                                                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${item.value === 'Yes' || item.value === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}>{item.value || 'Approved'}</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-900">{item.value || '—'}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Risk score details */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                                <h3 className="text-sm font-black mb-6 flex items-center gap-2">
                                    <Activity size={16} className="text-indigo-400" />
                                    DRM Risk Index Metrics
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Overall Hazard Index', value: profile.risk_index?.hazard_index || 0, desc: 'Level of localized physical threats' },
                                            { label: 'Exposure Index', value: profile.risk_index?.exposure_index || 0, desc: 'Proximity of building structures to hazards' }
                                        ].map((item, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-2xl font-black text-white">{item.value.toFixed(1)}</p>
                                                </div>
                                                {renderProgressBar(item.value, 10, 'bg-gradient-to-r from-rose-500 to-amber-500')}
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Vulnerability Index', value: profile.risk_index?.vulnerability_index || 0, desc: 'Social & physical vulnerability indicators' },
                                            { label: 'Response Capacity Index', value: profile.risk_index?.capacity_index || 0, desc: 'Available resilience and recovery assets' }
                                        ].map((item, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-2xl font-black text-white">{item.value.toFixed(1)}</p>
                                                </div>
                                                {renderProgressBar(item.value, 10, 'bg-gradient-to-r from-indigo-500 to-emerald-500')}
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HOUSEHOLD DEMOGRAPHICS & LIVELIHOOD */}
                    {isHousehold && activeTab === 'hh_demographics' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Users className="text-indigo-600" size={18} />
                                    Household Members & Demographics
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: 'Total HH Members', value: hh.demographics?.total_household_members || 0 },
                                        { label: 'Children (0-17)', value: hh.demographics?.children_0_17 || 0 },
                                        { label: 'Youth (18-29)', value: hh.demographics?.youth_18_29 || 0 },
                                        { label: 'Elderly (60+)', value: hh.demographics?.elderly_60_plus || 0 }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">General Specifications</h4>
                                        <div className="space-y-2.5 text-xs text-slate-800 font-bold">
                                            {[
                                                { label: 'Female-headed Household', value: hh.demographics?.female_headed_household },
                                                { label: 'IDP Displacement Status', value: hh.demographics?.idp_status },
                                                { label: 'Displacement Reason', value: hh.demographics?.idp_reason || 'Not Displaced' },
                                                { label: 'Education Level of Head', value: hh.demographics?.education_level_of_head },
                                                { label: 'Employment Status of Head', value: hh.demographics?.employment_status }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between py-2 border-b border-white last:border-0">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                    <span className="text-slate-900">{item.value || 'N/A'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gender visual breakdown */}
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Household Gender Distribution</h4>
                                            {(() => {
                                                const tot = hh.demographics?.total_household_members || 1;
                                                const male = hh.demographics?.male_members || 0;
                                                const female = hh.demographics?.female_members || 0;
                                                const malePct = (male / tot) * 100;
                                                const femalePct = (female / tot) * 100;
                                                return (
                                                    <div className="space-y-3.5 pt-2">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                                            <span className="text-indigo-600">Male: {male} ({malePct.toFixed(0)}%)</span>
                                                            <span className="text-rose-500">Female: {female} ({femalePct.toFixed(0)}%)</span>
                                                        </div>
                                                        <div className="h-3.5 w-full bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                                                            <div className="h-full bg-indigo-500" style={{ width: `${malePct}%` }} />
                                                            <div className="h-full bg-rose-500" style={{ width: `${femalePct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-snug mt-4">Gender indicators are utilized for planning specific health, safety and emergency shelter facilities.</p>
                                    </div>
                                </div>

                                {/* Livelihoods of Household */}
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Livelihood & Economic Buffer</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Primary Livelihood', value: hh.livelihood_economy?.primary_livelihood_type },
                                            { label: 'Secondary Livelihood', value: hh.livelihood_economy?.secondary_livelihood_type || 'None' },
                                            { label: 'HH Income Level', value: hh.livelihood_economy?.household_income_level },
                                            { label: 'Small Business Owner', value: hh.livelihood_economy?.small_business_ownership, sub: hh.livelihood_economy?.small_business_type },
                                            { label: 'Daily Labor Dependency', value: hh.livelihood_economy?.daily_labour_dependency },
                                            { label: 'Disaster Income Shock', value: hh.livelihood_economy?.income_disruption_by_disaster },
                                            { label: 'Credit Safety Net Access', value: hh.livelihood_economy?.access_to_credit_safety_nets },
                                            { label: 'Active Insurance Policies', value: hh.livelihood_economy?.insurance_coverage }
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                                <p className="text-xs font-bold text-slate-800">{item.value || 'No'}</p>
                                                {item.sub && <p className="text-[9px] text-slate-400 mt-0.5">{item.sub}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HOUSEHOLD HOUSING CONDITIONS */}
                    {isHousehold && activeTab === 'hh_housing' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <MapPin className="text-indigo-600" size={18} />
                                    Housing & Building Infrastructure
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    {[
                                        { label: 'Wall Material', value: hh.housing_physical_conditions?.wall_material_type },
                                        { label: 'Roof Material', value: hh.housing_physical_conditions?.roof_material_type },
                                        { label: 'Proximity to Hazard Zone', value: hh.housing_physical_conditions?.proximity_to_hazard_zone },
                                        { label: 'Building Code Compliance', value: hh.housing_physical_conditions?.building_code_compliance },
                                        { label: 'Informal Settlement Status', value: hh.housing_physical_conditions?.informal_settlement },
                                        { label: 'Fire Resistant Materials', value: hh.housing_physical_conditions?.fire_resistant_materials },
                                        { label: 'Sleeping Rooms count', value: hh.housing_physical_conditions?.sleeping_rooms },
                                        { label: 'Building Age (years)', value: hh.housing_physical_conditions?.building_age_years ? `${hh.housing_physical_conditions.building_age_years} years` : 'Unknown' },
                                        { label: 'Basic Utility Access', value: hh.housing_physical_conditions?.drainage_water_electricity_access }
                                    ].map((spec, i) => (
                                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{spec.label}</p>
                                            <p className="text-xs font-bold text-slate-800">{spec.value || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HOUSEHOLD PREPAREDNESS & RECOVERY */}
                    {isHousehold && activeTab === 'hh_preparedness' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="text-indigo-600" size={18} />
                                    Preparedness & Recovery Buffers
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Preparedness Checklist */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Preparedness Buffers</h4>
                                        <div className="space-y-2.5 text-xs text-slate-800 font-bold">
                                            {[
                                                { label: 'Knows Nearest Shelter', value: hh.preparedness?.knows_nearest_emergency_shelter },
                                                { label: 'Knows Local Evacuation Route', value: hh.preparedness?.knows_local_evacuation_route },
                                                { label: 'Family Emergency Plan Exists', value: hh.preparedness?.family_emergency_plan_exists },
                                                { label: 'Emergency Supplies Stockpiled', value: hh.preparedness?.emergency_supplies_stockpiled },
                                                { label: 'DRM Training Received', value: hh.preparedness?.drm_training_received_type || 'None' },
                                                { label: 'Early Warning channel', value: hh.preparedness?.early_warning_received_channel || 'None' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between py-2 border-b border-white last:border-0">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                    <span className="text-slate-900">{item.value || 'No'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Awareness and self rating indicators */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between shadow-sm">
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Self-Rated Awareness & Resilience</h4>

                                            <div className="bg-white rounded-xl p-4.5 border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Community DRM Awareness</span>
                                                    <span className="text-xs font-black text-indigo-600">{(hh.preparedness?.community_awareness_self_rated_1_5 || 3)} / 5</span>
                                                </div>
                                                {renderProgressBar(hh.preparedness?.community_awareness_self_rated_1_5 || 3, 5, 'bg-indigo-500')}
                                            </div>

                                            <div className="bg-white rounded-xl p-4.5 border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resilience (Assessor Score)</span>
                                                    <span className="text-xs font-black text-emerald-600">{(hh.recovery_capacity?.resilience_enumerator_assessment_1_5 || 3)} / 5</span>
                                                </div>
                                                {renderProgressBar(hh.recovery_capacity?.resilience_enumerator_assessment_1_5 || 3, 5, 'bg-emerald-500')}
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-slate-400 leading-snug mt-4">Awareness score reflects community drills frequency and preparedness levels self-reported by the household.</p>
                                    </div>
                                </div>

                                {/* Recovery Capacity */}
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Disaster Recovery Capacity</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Past Disaster Experience', value: hh.recovery_capacity?.past_disaster_experience_type || 'None' },
                                            { label: 'Recovery Duration', value: hh.recovery_capacity?.recovery_duration_months ? `${hh.recovery_capacity.recovery_duration_months} months` : 'No disaster history' },
                                            { label: 'Self-Help Savings Member', value: hh.recovery_capacity?.self_help_savings_group_membership },
                                            { label: 'Government Safety Net Access', value: hh.recovery_capacity?.government_safety_net_access },
                                            { label: 'Income Diversification (2+)', value: hh.recovery_capacity?.income_diversification_2plus_sources }
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                                <p className="text-xs font-bold text-slate-800">{item.value || 'No'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
// â”€â”€â”€ Form Wizard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FormWizard: React.FC<{ initial: WProfile | null; onSave: (p: WProfileInput) => void; onClose: () => void; saving: boolean }> = ({ initial, onSave, onClose, saving }) => {
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState<'demographics' | 'livelihood' | 'housing' | 'preparedness' | 'recovery'>('demographics');
    const [formData, setFormData] = useState<WProfileInput>(initial ? {
        location: initial.location,
        assessment_date: initial.assessment_date,
        remarks: initial.remarks,
        household_profile: initial.household_profile || emptyHouseholdProfile(),
        survey_metadata: initial.survey_metadata,
        raw_survey: initial.raw_survey || emptyProfile().raw_survey,
        demographics: initial.demographics,
        livelihoods: initial.livelihoods,
        basic_services: initial.basic_services,
        critical_facilities: initial.critical_facilities,
        vulnerable_groups: initial.vulnerable_groups,
        community_capacity: initial.community_capacity,
        hazards: initial.hazards,
        vulnerability_assessments: initial.vulnerability_assessments,
        capacity_assessments: initial.capacity_assessments,
        risk_assessments: initial.risk_assessments,
        risk_index: initial.risk_index,
        economic_risk_indicators: initial.economic_risk_indicators,
        environmental_indicators: initial.environmental_indicators,
        infrastructure_exposure: initial.infrastructure_exposure || emptyProfile().infrastructure_exposure,
        community_voice_interventions: initial.community_voice_interventions || emptyProfile().community_voice_interventions,
        preparedness_indicators: initial.preparedness_indicators,
        recovery_indicators: initial.recovery_indicators,
        status: initial.status
    } : emptyProfile());

    const updateNested = (path: string, val: any) => {
        const keys = path.split('.');
        setFormData(prev => {
            const next = { ...prev };
            let current = next as any;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = val;
            return next;
        });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-5xl h-[85vh] bg-white rounded-[3rem] shadow-2xl flex overflow-hidden border border-slate-100">
                {/* Left Sidebar Steps */}
                <div className="w-72 bg-slate-900 p-8 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <Edit3 size={20} />
                            </div>
                            <h2 className="text-white font-black tracking-tight">{initial ? 'Update' : 'New'} Protocol</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { s: 1, l: 'Location & Meta', i: MapPin },
                                { s: 2, l: 'Household Profile', i: Users },
                                { s: 3, l: 'Risk Indicators', i: AlertTriangle },
                                { s: 4, l: 'Review & Sync', i: CheckCircle }
                            ].map(item => (
                                <button key={item.s} onClick={() => setStep(item.s)} className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all ${step === item.s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                                    <item.i size={18} className={step === item.s ? 'text-white' : 'text-slate-500'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.l}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info size={12} /> Data Standards
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Ensure all location fields are validated against the standard registry to maintain hierarchy integrity.</p>
                    </div>
                </div>

                {/* Right Form Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/50">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Location Identity</h3>
                                    <p className="text-slate-400 text-sm font-medium">Define the administrative boundaries for this assessment.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    {(['subcity', 'woreda', 'kebele', 'block', 'house_no'] as const).map(f => (
                                        <div key={f} className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{f.replace('_', ' ')}</label>
                                            <input
                                                type="text"
                                                value={formData.location[f] || ''}
                                                onChange={e => updateNested(`location.${f}`, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                placeholder={`Enter ${f.replace('_', ' ')}...`}
                                            />
                                        </div>
                                    ))}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assessment Date</label>
                                        <input
                                            type="date"
                                            value={formData.assessment_date}
                                            onChange={e => setFormData(prev => ({ ...prev, assessment_date: e.target.value }))}
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
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
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth gap-1 border border-slate-200/50">
                                    {[
                                        { id: 'demographics', label: 'Demographics' },
                                        { id: 'livelihood', label: 'Livelihood & Economy' },
                                        { id: 'housing', label: 'Housing Conditions' },
                                        { id: 'preparedness', label: 'Preparedness' },
                                        { id: 'recovery', label: 'Recovery Capacity' }
                                    ].map(sub => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => setSubStep(sub.id as any)}
                                            className={`px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${subStep === sub.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>

                                {subStep === 'demographics' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Members & Cohort Headcounts</h4>
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
                                                        type="number"
                                                        value={(formData.household_profile?.demographics as any)?.[item.f] ?? 0}
                                                        onChange={e => updateNested(`household_profile.demographics.${item.f}`, parseInt(e.target.value) || 0)}
                                                        className="w-24 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-sm font-black text-slate-900 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Vulnerabilities & Head Details</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Female-headed?</label>
                                                    <select
                                                        value={formData.household_profile?.demographics?.female_headed_household || 'No'}
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
                                                        value={formData.household_profile?.demographics?.idp_status || 'No'}
                                                        onChange={e => updateNested('household_profile.demographics.idp_status', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Unknown" className="text-slate-900">Unknown</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {formData.household_profile?.demographics?.idp_status === 'Yes' && (
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">IDP Reason</label>
                                                    <input
                                                        type="text"
                                                        value={formData.household_profile?.demographics?.idp_reason || ''}
                                                        onChange={e => updateNested('household_profile.demographics.idp_reason', e.target.value)}
                                                        placeholder="e.g. Drought, Conflict..."
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Education level of Head</label>
                                                <select
                                                    value={formData.household_profile?.demographics?.education_level_of_head || ''}
                                                    onChange={e => updateNested('household_profile.demographics.education_level_of_head', e.target.value)}
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                >
                                                    <option value="" className="text-slate-900">Select Education...</option>
                                                    {EDUCATION_CATS.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Employment status of Head</label>
                                                <select
                                                    value={formData.household_profile?.demographics?.employment_status || ''}
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
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Livelihood Sources</h4>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Livelihood</label>
                                                <select
                                                    value={formData.household_profile?.livelihood_economy?.primary_livelihood_type || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.primary_livelihood_type', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                >
                                                    <option value="">Select Primary livelihood...</option>
                                                    {LIVELIHOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Secondary Livelihood</label>
                                                <select
                                                    value={formData.household_profile?.livelihood_economy?.secondary_livelihood_type || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.secondary_livelihood_type', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                >
                                                    <option value="None">None</option>
                                                    {LIVELIHOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Income Level</label>
                                                <select
                                                    value={formData.household_profile?.livelihood_economy?.household_income_level || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.household_income_level', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                >
                                                    <option value="">Select Income Level...</option>
                                                    {['Low', 'Medium', 'High'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Economic Vulnerabilities</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Small Business Owner?</label>
                                                    <select
                                                        value={formData.household_profile?.livelihood_economy?.small_business_ownership || 'No'}
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
                                                        value={formData.household_profile?.livelihood_economy?.daily_labour_dependency || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.daily_labour_dependency', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {formData.household_profile?.livelihood_economy?.small_business_ownership === 'Yes' && (
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Business Type</label>
                                                    <input
                                                        type="text"
                                                        value={formData.household_profile?.livelihood_economy?.small_business_type || ''}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.small_business_type', e.target.value)}
                                                        placeholder="e.g. Retail Shop, Tailoring..."
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Income disruption by disaster</label>
                                                <input
                                                    type="text"
                                                    value={formData.household_profile?.livelihood_economy?.income_disruption_by_disaster || ''}
                                                    onChange={e => updateNested('household_profile.livelihood_economy.income_disruption_by_disaster', e.target.value)}
                                                    placeholder="e.g. Yes - 3 months, No"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Insurance?</label>
                                                    <select
                                                        value={formData.household_profile?.livelihood_economy?.insurance_coverage || 'No'}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.insurance_coverage', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                        <option value="Partial" className="text-slate-900">Partial</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Credit / Safety Net Access</label>
                                                    <select
                                                        value={formData.household_profile?.livelihood_economy?.access_to_credit_safety_nets || ''}
                                                        onChange={e => updateNested('household_profile.livelihood_economy.access_to_credit_safety_nets', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="" className="text-slate-900">Select access level...</option>
                                                        {['Good Access', 'Limited Access', 'No Access'].map(opt => (
                                                            <option key={opt} value={opt} className="text-slate-900">{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'housing' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Structure Characteristics</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Wall Material</label>
                                                    <input
                                                        type="text"
                                                        value={formData.household_profile?.housing_physical_conditions?.wall_material_type || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.wall_material_type', e.target.value)}
                                                        placeholder="e.g. Brick, Wood and Mud"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Roof Material</label>
                                                    <input
                                                        type="text"
                                                        value={formData.household_profile?.housing_physical_conditions?.roof_material_type || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.roof_material_type', e.target.value)}
                                                        placeholder="e.g. Corrugated Iron"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Building Age (years)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.household_profile?.housing_physical_conditions?.building_age_years ?? 0}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.building_age_years', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Sleeping Rooms</label>
                                                    <input
                                                        type="number"
                                                        value={formData.household_profile?.housing_physical_conditions?.sleeping_rooms ?? 0}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.sleeping_rooms', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Hazards & Legality</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Informal / Squatter?</label>
                                                    <select
                                                        value={formData.household_profile?.housing_physical_conditions?.informal_settlement || 'No'}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.informal_settlement', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Building Compliance</label>
                                                    <select
                                                        value={formData.household_profile?.housing_physical_conditions?.building_code_compliance || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.building_code_compliance', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="" className="text-slate-900">Select compliance...</option>
                                                        {['Yes', 'No', 'Unsure'].map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Fire Resistant Mat.?</label>
                                                    <select
                                                        value={formData.household_profile?.housing_physical_conditions?.fire_resistant_materials || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.fire_resistant_materials', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="" className="text-slate-900">Select level...</option>
                                                        {['Yes', 'No', 'Partial'].map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Services Access</label>
                                                    <select
                                                        value={formData.household_profile?.housing_physical_conditions?.drainage_water_electricity_access || ''}
                                                        onChange={e => updateNested('household_profile.housing_physical_conditions.drainage_water_electricity_access', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="" className="text-slate-900">Select access...</option>
                                                        {['Full Access', 'Partial Access', 'No Access'].map(opt => (
                                                            <option key={opt} value={opt} className="text-slate-900">{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Proximity to Hazard Zone</label>
                                                <input
                                                    type="text"
                                                    value={formData.household_profile?.housing_physical_conditions?.proximity_to_hazard_zone || ''}
                                                    onChange={e => updateNested('household_profile.housing_physical_conditions.proximity_to_hazard_zone', e.target.value)}
                                                    placeholder="e.g. Yes - 50m to River, No"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'preparedness' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">DRM Mitigation Awareness</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Knows Shelter?</label>
                                                    <select
                                                        value={formData.household_profile?.preparedness?.knows_nearest_emergency_shelter || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.knows_nearest_emergency_shelter', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Knows Evac Route?</label>
                                                    <select
                                                        value={formData.household_profile?.preparedness?.knows_local_evacuation_route || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.knows_local_evacuation_route', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Emergency Plan?</label>
                                                    <select
                                                        value={formData.household_profile?.preparedness?.family_emergency_plan_exists || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.family_emergency_plan_exists', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Emergency Stockpiles</label>
                                                    <select
                                                        value={formData.household_profile?.preparedness?.emergency_supplies_stockpiled || 'No'}
                                                        onChange={e => updateNested('household_profile.preparedness.emergency_supplies_stockpiled', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                        <option value="Partial">Partial</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">DRM Capacity Details</h4>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">DRM Training Received & Type</label>
                                                <input
                                                    type="text"
                                                    value={formData.household_profile?.preparedness?.drm_training_received_type || ''}
                                                    onChange={e => updateNested('household_profile.preparedness.drm_training_received_type', e.target.value)}
                                                    placeholder="e.g. Yes - Fire drill, No"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Early Warning Channel</label>
                                                <input
                                                    type="text"
                                                    value={formData.household_profile?.preparedness?.early_warning_received_channel || ''}
                                                    onChange={e => updateNested('household_profile.preparedness.early_warning_received_channel', e.target.value)}
                                                    placeholder="e.g. Yes - Kebele SMS, No"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Community Awareness self-rated (1-5)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={formData.household_profile?.preparedness?.community_awareness_self_rated_1_5 ?? 0}
                                                    onChange={e => updateNested('household_profile.preparedness.community_awareness_self_rated_1_5', Math.min(5, Math.max(1, parseInt(e.target.value) || 0)))}
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {subStep === 'recovery' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Coping Capabilities</h4>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Past Disaster Experience</label>
                                                <input
                                                    type="text"
                                                    value={formData.household_profile?.recovery_capacity?.past_disaster_experience_type || ''}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.past_disaster_experience_type', e.target.value)}
                                                    placeholder="e.g. Yes - 2024 Flood, No"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Recovery (months)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.household_profile?.recovery_capacity?.recovery_duration_months ?? 0}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.recovery_duration_months', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Savings Group Member?</label>
                                                    <select
                                                        value={formData.household_profile?.recovery_capacity?.self_help_savings_group_membership || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.self_help_savings_group_membership', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    >
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Safety Nets & Resilience Score</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Safety Net Access?</label>
                                                    <select
                                                        value={formData.household_profile?.recovery_capacity?.government_safety_net_access || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.government_safety_net_access', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Income Diversified?</label>
                                                    <select
                                                        value={formData.household_profile?.recovery_capacity?.income_diversification_2plus_sources || 'No'}
                                                        onChange={e => updateNested('household_profile.recovery_capacity.income_diversification_2plus_sources', e.target.value)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                    >
                                                        <option value="Yes" className="text-slate-900">Yes</option>
                                                        <option value="No" className="text-slate-900">No</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Resilience Index (Enumerator 1-5)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={formData.household_profile?.recovery_capacity?.resilience_enumerator_assessment_1_5 ?? 0}
                                                    onChange={e => updateNested('household_profile.recovery_capacity.resilience_enumerator_assessment_1_5', Math.min(5, Math.max(1, parseInt(e.target.value) || 0)))}
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:bg-white/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Woreda Assessment & Risk Inputs</h3>
                                    <p className="text-slate-400 text-sm font-medium">Capture the required CGD/KII assessments for hazard profile, exposure, capacity and community voice.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Hazard Profile (CGD)</h4>
                                        {(formData.hazards || []).map((hazard, index) => (
                                            <div key={index} className="space-y-3 p-4 rounded-3xl border border-slate-100 bg-slate-50">
                                                <div className="grid grid-cols-12 gap-4">
                                                    <div className="col-span-12 sm:col-span-6">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hazard</label>
                                                        <input
                                                            type="text"
                                                            value={hazard.hazard_name || ''}
                                                            onChange={e => updateNested(`hazards.${index}.hazard_name`, e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                            placeholder="e.g. Flood"
                                                        />
                                                    </div>
                                                    <div className="col-span-6 sm:col-span-3">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Frequency</label>
                                                        <input
                                                            type="text"
                                                            value={hazard.frequency || ''}
                                                            onChange={e => updateNested(`hazards.${index}.frequency`, e.target.value)}
                                                            placeholder="Daily / Monthly"
                                                            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                    <div className="col-span-6 sm:col-span-3">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Severity</label>
                                                        <input
                                                            type="text"
                                                            value={hazard.severity || ''}
                                                            onChange={e => updateNested(`hazards.${index}.severity`, e.target.value)}
                                                            placeholder="Major / Moderate"
                                                            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Seasonality</label>
                                                        <input
                                                            type="text"
                                                            value={hazard.seasonality || ''}
                                                            onChange={e => updateNested(`hazards.${index}.seasonality`, e.target.value)}
                                                            placeholder="Yearly / Seasonal"
                                                            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Historical Events</label>
                                                        <input
                                                            type="text"
                                                            value={hazard.historical_events || ''}
                                                            onChange={e => updateNested(`hazards.${index}.historical_events`, e.target.value)}
                                                            placeholder="e.g. 2023 flood"
                                                            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                hazards: [...(prev.hazards || []), { hazard_name: '', frequency: '', severity: '', seasonality: '', historical_events: '' }]
                                            }))}
                                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-widest rounded-2xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all"
                                        >
                                            <Plus size={16} /> Add hazard
                                        </button>
                                    </div>

                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Capacity Index (KII)</h4>
                                        <div className="space-y-4">
                                            {(formData.community_capacity || []).map((capacity, index) => (
                                                <div key={capacity.capacity_type || index} className="rounded-3xl border border-white/10 p-4 bg-slate-950/80">
                                                    <div className="flex items-center justify-between gap-3 mb-3">
                                                        <p className="text-sm font-black">{capacity.capacity_type}</p>
                                                        <label className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                                            <input
                                                                type="checkbox"
                                                                checked={capacity.available || false}
                                                                onChange={e => updateNested(`community_capacity.${index}.available`, e.target.checked)}
                                                                className="form-checkbox h-4 w-4 rounded border-slate-300 text-indigo-600"
                                                            />
                                                            Available
                                                        </label>
                                                    </div>
                                                    <textarea
                                                        value={capacity.remarks || ''}
                                                        onChange={e => updateNested(`community_capacity.${index}.remarks`, e.target.value)}
                                                        className="w-full min-h-[90px] bg-slate-900 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                        placeholder="Notes on capacity condition or supporting services..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Infrastructure Exposure (KII)</h4>
                                        {[
                                            { label: 'Road Network Status', path: 'infrastructure_exposure.road_network_status', placeholder: 'Good / Poor / Limited' },
                                            { label: 'Health Facility Access', path: 'infrastructure_exposure.health_facility_access', placeholder: 'Near / Distant / Limited' },
                                            { label: 'Water Supply Coverage', path: 'infrastructure_exposure.water_supply_coverage', placeholder: 'High / Medium / Low' },
                                            { label: 'Sanitation Coverage', path: 'infrastructure_exposure.sanitation_infrastructure_coverage', placeholder: 'Available / Partial / None' },
                                            { label: 'Shelter Exposure', path: 'infrastructure_exposure.shelter_exposure', placeholder: 'High / Medium / Low' }
                                        ].map(item => (
                                            <div key={item.path} className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{item.label}</label>
                                                <input
                                                    type="text"
                                                    value={(formData as any)[item.path.split('.')[0]]?.[item.path.split('.')[1]] || ''}
                                                    onChange={e => updateNested(item.path, e.target.value)}
                                                    placeholder={item.placeholder}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        ))}
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Green space per capita</label>
                                            <input
                                                type="text"
                                                value={formData.environmental_indicators?.green_space_per_capita || ''}
                                                onChange={e => updateNested('environmental_indicators.green_space_per_capita', e.target.value)}
                                                placeholder="Good / Moderate / Low"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={formData.environmental_indicators?.wetland_encroachment || ''}
                                                onChange={e => updateNested('environmental_indicators.wetland_encroachment', e.target.value)}
                                                placeholder="Wetland encroachment"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                            <input
                                                type="text"
                                                value={formData.environmental_indicators?.soil_sealing_coverage || ''}
                                                onChange={e => updateNested('environmental_indicators.soil_sealing_coverage', e.target.value)}
                                                placeholder="Soil sealing coverage"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={formData.environmental_indicators?.waste_dumping_sites || ''}
                                                onChange={e => updateNested('environmental_indicators.waste_dumping_sites', e.target.value)}
                                                placeholder="Waste dumping sites"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                            <input
                                                type="text"
                                                value={formData.environmental_indicators?.urban_drainage_blockage_frequency || ''}
                                                onChange={e => updateNested('environmental_indicators.urban_drainage_blockage_frequency', e.target.value)}
                                                placeholder="Drainage blockage frequency"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Community Voice & Interventions (CGD)</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Local priority needs</label>
                                                <textarea
                                                    value={formData.community_voice_interventions?.priority_needs || ''}
                                                    onChange={e => updateNested('community_voice_interventions.priority_needs', e.target.value)}
                                                    placeholder="Key needs raised by the community"
                                                    className="w-full min-h-[110px] bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Local response capacity</label>
                                                <textarea
                                                    value={formData.community_voice_interventions?.local_response_capacity || ''}
                                                    onChange={e => updateNested('community_voice_interventions.local_response_capacity', e.target.value)}
                                                    placeholder="Community and local authority capacity"
                                                    className="w-full min-h-[110px] bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Suggested interventions</label>
                                                <textarea
                                                    value={formData.community_voice_interventions?.suggested_interventions || ''}
                                                    onChange={e => updateNested('community_voice_interventions.suggested_interventions', e.target.value)}
                                                    placeholder="Community recommended actions or interventions"
                                                    className="w-full min-h-[110px] bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.4),_transparent_50%)]" />
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 flex items-center justify-center">
                                            <CheckCircle size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tight">Final Protocol Review</h3>
                                            <p className="text-white/60 text-sm font-medium">Review and commit to the disaster risk database.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Target Location</p>
                                            <p className="text-lg font-black">{formData.location.subcity}, Woreda {formData.location.woreda}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Data Depth</p>
                                            <p className="text-lg font-black">{formData.household_profile?.demographics?.total_household_members || 0} Members • Household Protocol</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-slate-200 p-8 flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-4">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="px-8 py-4 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                            )}
                            {step < 4 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 hover:shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                    Continue <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => onSave(formData)}
                                    disabled={saving}
                                    className={`px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 hover:shadow-indigo-100 transition-all flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    {saving ? 'Syncing...' : 'Apply Protocol'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// â”€â”€â”€ Utility Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ImportModal: React.FC<{ onClose: () => void; onImport: (file: File) => void; importing: boolean }> = ({ onClose, onImport, importing }) => {
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

// â”€â”€â”€ Sync Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SyncInterviewModal: React.FC<{
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

const SyncPreviewModal: React.FC<{
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Block {data.profileData.location.block} â€¢ {data.profileData.location.house_no}</p>
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


// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WoredaProfile: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [profiles, setProfiles] = useState<WProfile[]>([]);
    const [stats, setStats] = useState<WoredaProfileStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState<'city' | 'subcity' | 'woreda' | 'block' | 'household'>('city');
    const [path, setPath] = useState<{ subcity: string | null; woreda: string | null; block: string | null }>({ subcity: null, woreda: null, block: null });
    const [showCityOverview, setShowCityOverview] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showSync, setShowSync] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Draft' | 'Submitted' | 'Reviewed'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const searchParams = new URLSearchParams(location.search);
    const initialSyncId = searchParams.get('syncResponseId');

    useEffect(() => {
        if (initialSyncId) {
            setShowSync(true);
        }
    }, [initialSyncId]);
    const [mappings, setMappings] = useState<ProfileMapping[]>([]);
    const [editProfile, setEditProfile] = useState<WProfile | null>(null);
    const [viewProfile, setViewProfile] = useState<WProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [syncPreviewData, setSyncPreviewData] = useState<any | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { level };
            if (path.subcity) params.subcity = path.subcity;
            if (path.woreda) params.woreda = path.woreda;
            if (path.block) params.block = path.block;

            const [pList, pStats, mList] = await Promise.all([
                getWoredaProfiles(params),
                getWoredaProfileStats(),
                getProfileMappings()
            ]);
            setProfiles(pList);
            setStats(pStats);
            setMappings(mList);
        } catch {
            toast.error('Failed to load Woreda Profiles');
        } finally {
            setLoading(false);
        }
    }, [path, level]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = profiles.filter(p => {
        const matchesSearch = getProfileTitle(p).toLowerCase().includes(search.toLowerCase()) ||
            getProfileSubtitle(p).toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSave = async (input: WProfileInput) => {
        try {
            setSaving(true);
            if (editProfile) {
                await updateWoredaProfile(editProfile._id, input);
                toast.success('Profile updated successfully');
            } else {
                await createWoredaProfile(input);
                toast.success('Profile created successfully');
            }
            setShowForm(false);
            setEditProfile(null);
            fetchData();
        } catch {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this profile?')) return;
        try {
            await deleteWoredaProfile(id);
            toast.success('Profile deleted');
            fetchData();
        } catch {
            toast.error('Failed to delete profile');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await updateWoredaProfile(id, { status } as any);
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleImport = async (file: File) => {
        try {
            setImporting(true);
            await importWoredaProfile(file);
            toast.success('Profiles imported successfully');
            setShowImport(false);
            fetchData();
        } catch {
            toast.error('Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleSync = async (params: any) => {
        try {
            setSaving(true);
            const res = await syncFromInterview(params);
            if (params.dryRun) {
                setSyncPreviewData({ ...res, requestData: params });
                setShowSync(false);
            } else {
                toast.success('Data synchronized successfully');
                setSyncPreviewData(null);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Sync failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-outfit">
            <PageMeta title="DRM Assessment Dashboard" description="Hierarchical disaster risk assessment and spatial aggregation dashboard." />

            <div className="max-w-[1600px] mx-auto p-8 space-y-8">
                {/* Modern Hero & Navigation Header */}
                <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <MapIcon size={200} />
                    </div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-3xl rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                                <Sparkles size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">DRM Assessment Dashboard</span>
                            </div>

                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                                    {level === 'city' && "Addis Ababa City"}
                                    {level === 'subcity' && !path.subcity && "Addis Ababa — Sub-Cities"}
                                    {level === 'subcity' && path.subcity && `${path.subcity} Sub-City`}
                                    {level === 'woreda' && `${path.subcity} — Woredas`}
                                    {level === 'block' && `Woreda ${path.woreda} — Blocks`}
                                    {level === 'household' && `Block ${path.block} — Households`}
                                </h1>
                                <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed">
                                    Navigate through the hierarchical disaster risk assessment data. Monitor resilience metrics, evaluate vulnerabilities, and plan strategic interventions across different administrative levels.
                                </p>
                            </div>

                            {/* Beautiful Breadcrumbs */}
                            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 inline-flex">
                                {/* City crumb — always resets to top */}
                                <button
                                    onClick={() => { setLevel('city'); setPath({ subcity: null, woreda: null, block: null }); setShowCityOverview(true); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'city' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}
                                >
                                    <Activity size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">City</span>
                                </button>
                                {/* Sub-Cities crumb */}
                                {(level === 'subcity' || level === 'woreda' || level === 'block' || level === 'household') && (
                                    <>
                                        <ChevronRight size={14} className="text-slate-300" />
                                        <button
                                            onClick={() => { setLevel('subcity'); setPath({ subcity: null, woreda: null, block: null }); setShowCityOverview(false); }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'subcity' && !path.subcity ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sub-Cities</span>
                                        </button>
                                    </>
                                )}
                                {/* Selected sub-city crumb */}
                                {path.subcity && (
                                    <>
                                        <ChevronRight size={14} className="text-slate-300" />
                                        <button
                                            onClick={() => { setLevel('woreda'); setPath({ subcity: path.subcity, woreda: null, block: null }); }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'woreda' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{path.subcity}</span>
                                        </button>
                                    </>
                                )}
                                {/* Selected woreda crumb */}
                                {path.woreda && (
                                    <>
                                        <ChevronRight size={14} className="text-slate-300" />
                                        <button
                                            onClick={() => { setLevel('block'); setPath({ subcity: path.subcity, woreda: path.woreda, block: null }); }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${level === 'block' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Woreda {path.woreda}</span>
                                        </button>
                                    </>
                                )}
                                {/* Selected block crumb */}
                                {path.block && (
                                    <>
                                        <ChevronRight size={14} className="text-slate-300" />
                                        <button
                                            onClick={() => { setLevel('household'); }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all bg-white shadow-sm text-indigo-600"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Block {path.block}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 min-w-max">
                            <button
                                onClick={() => navigate('/woreda-profile/map')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group"
                            >
                                <MapIcon size={16} className="group-hover:scale-110 transition-transform" />
                                Open GIS Map
                            </button>

                            {level === 'household' && (
                                <>
                                    <Can resource="WoredaProfile" action="create">
                                        <button onClick={() => setShowSync(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                            <ArrowRightLeft size={16} /> Sync Protocol
                                        </button>
                                    </Can>
                                    <Can resource="WoredaProfile" action="create">
                                        <button onClick={() => { setEditProfile(null); setShowForm(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
                                            <Plus size={16} /> New Assessment
                                        </button>
                                    </Can>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Map is available in the General Map sidebar — not shown here */}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Assessments', value: stats?.total || 0, sub: 'All levels', icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
                        { label: 'Residents Protected', value: (stats?.totalPopulation || 0).toLocaleString(), sub: 'Across hierarchy', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Avg Risk Score', value: '4.82', sub: 'City mean', icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
                        { label: 'Sync Efficiency', value: '94.2%', sub: 'Last 7 days', icon: RefreshCw, color: 'bg-amber-50 text-amber-600' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <h4 className="text-2xl font-black text-slate-900">{s.value}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{s.sub}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                <s.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & View Switches */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-3 shadow-sm flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${level}...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-[2.5rem] pl-16 pr-8 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        />
                    </div>

                    <div className="h-10 w-px bg-slate-100 mx-2" />

                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button onClick={() => setViewMode('grid')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Grid</button>
                        <button onClick={() => setViewMode('table')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Table</button>
                    </div>

                    {level === 'household' && (
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 ml-2">
                            {[
                                { label: 'All', value: 'ALL', color: 'bg-white text-slate-900 border-slate-200' },
                                { label: 'Draft', value: 'Draft', color: 'bg-amber-500 text-white border-transparent' },
                                { label: 'Submitted', value: 'Submitted', color: 'bg-emerald-500 text-white border-transparent' }
                            ].map(tab => (
                                <button
                                    key={tab.value}

                                    onClick={() => setStatusFilter(tab.value as any)}
                                    className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${statusFilter === tab.value
                                        ? `${tab.color} shadow-sm border ring-1 ring-slate-100`
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <span className="text-xs font-bold text-slate-400 px-2 whitespace-nowrap md:ml-auto">
                        {showCityOverview ? '1 city overview' : `${filtered.length} ${level !== 'household' ? 'aggregated zones' : 'profiles'}`}
                    </span>
                </div>

                {/* Profile Grid */}
                {showCityOverview ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            <ProfileCard
                                key="city-overview"
                                profile={{
                                    _id: 'city-overview',
                                    location: { subcity: 'Addis Ababa', woreda: '', block: '', house_no: '' },
                                    status: 'Reviewed',
                                    aggregation_level: 'city',
                                    assessment_date: new Date().toISOString(),
                                    demographics: { total_population: stats?.totalPopulation || 0, total_households: 0, internally_displaced_population: 0 },
                                    hierarchy_summary: { source_profiles: stats?.total || 0, dr_risk_score: 4.8 },
                                    risk_index: { hazard_index: 0, vulnerability_index: 0, exposure_index: 0, capacity_index: 0, overall_woreda_risk_score: 4.8 }
                                } as any}
                                level="city"
                                onView={() => { setShowCityOverview(false); setLevel('subcity'); }}
                                onDrillDown={() => { setShowCityOverview(false); setLevel('subcity'); }}
                            />
                        </AnimatePresence>
                    </motion.div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium text-sm animate-pulse">Loading profilesâ€¦</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                            <MapPin size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No profiles found</p>
                        <p className="text-slate-400 text-sm">Create your first Woreda Profile to get started</p>
                        <Can resource="WoredaProfile" action="create">
                            <button onClick={() => { setEditProfile(null); setShowForm(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold mt-2">
                                <Plus size={16} /> Create Profile
                            </button>
                        </Can>
                    </div>
                ) : viewMode === 'grid' ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filtered.map(p => (
                                <ProfileCard key={p._id} profile={p} level={level}
                                    onView={() => setViewProfile(p)}
                                    onDrillDown={level !== 'household' ? () => {
                                        if (level === 'subcity') { setPath({ subcity: p.location.subcity || null, woreda: null, block: null }); setLevel('woreda'); }
                                        else if (level === 'woreda') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: null }); setLevel('block'); }
                                        else if (level === 'block') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: p.location.block && p.location.block !== 'All Blocks' ? p.location.block : 'Unknown' }); setLevel('household'); }
                                    } : undefined}
                                    onEdit={level === 'household' ? () => { setEditProfile(p); setShowForm(true); } : undefined}
                                    onDelete={level === 'household' ? () => handleDelete(p._id) : undefined} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Index</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Buffer</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 relative">
                                    {paginated.map((p) => {
                                        const statusKey = p.status || 'Draft';
                                        const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Draft;
                                        return (
                                            <tr key={p._id} className={`group transition-all border-l-4 ${p.status === 'Submitted' ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-500' :
                                                p.status === 'Reviewed' ? 'bg-blue-50/20 hover:bg-blue-50/40 border-blue-500' :
                                                    'bg-amber-50/20 hover:bg-amber-50/40 border-amber-500'
                                                }`}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-[10px] font-bold group-hover:scale-110 transition-all ${p.status === 'Submitted' ? 'bg-emerald-100/50 text-emerald-700' :
                                                            p.status === 'Reviewed' ? 'bg-blue-100/50 text-blue-700' :
                                                                'bg-amber-100/50 text-amber-700'
                                                            }`}>
                                                            #{p._id.slice(-4).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 leading-tight">{getProfileTitle(p)}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{getProfileSubtitle(p)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800">{(p.demographics?.total_population || 0).toLocaleString()}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total Residents</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${p.status === 'Submitted' ? 'bg-emerald-100 text-emerald-600' :
                                                            p.status === 'Reviewed' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            <BarChart3 size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 leading-tight">{p.risk_index?.overall_woreda_risk_score || '0.0'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Composite Score</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const next: Record<string, string> = { 'Draft': 'Submitted', 'Submitted': 'Reviewed', 'Reviewed': 'Draft' };
                                                            handleStatusChange(p._id, next[p.status || 'Draft'] || 'Draft');
                                                        }}
                                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${sc.bg} ${sc.text} border border-transparent hover:border-current shadow-sm`}>
                                                        <div className={`w-2 h-2 rounded-full ${sc.dot} ${p.status === 'Submitted' ? 'animate-pulse' : ''}`} />
                                                        {p.status}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                                                            {new Date(p.assessment_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                                                            <Clock size={12} />
                                                            Assessment date
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right relative z-10">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {level !== 'household' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (level === 'city') { setPath({ subcity: null, woreda: null, block: null }); setLevel('subcity'); }
                                                                    else if (level === 'subcity') { setPath({ subcity: p.location.subcity || null, woreda: null, block: null }); setLevel('woreda'); }
                                                                    else if (level === 'woreda') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: null }); setLevel('block'); }
                                                                    else if (level === 'block') { setPath({ subcity: p.location.subcity || null, woreda: p.location.woreda || null, block: p.location.block && p.location.block !== 'All Blocks' ? p.location.block : 'Unknown' }); setLevel('household'); }
                                                                }}
                                                                className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                                title="Explore Logic Layer"
                                                            >
                                                                <ChevronRight size={18} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setViewProfile(p)}
                                                            className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg"
                                                            title="Inspect Payload"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        {level === 'household' && (
                                                            <Can resource="WoredaProfile" action="update">
                                                                <button
                                                                    onClick={() => { setEditProfile(p); setShowForm(true); }}
                                                                    className="w-10 h-10 rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white flex items-center justify-center transition-all shadow-sm"
                                                                    title="Modify Protocol"
                                                                >
                                                                    <Edit3 size={18} />
                                                                </button>
                                                            </Can>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer (The Sync Engine Style) */}
                        {totalPages > 1 && (
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buffer Page</span>
                                    <div className="flex items-center gap-1">
                                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900 shadow-sm">{currentPage}</span>
                                        <span className="text-[10px] font-bold text-slate-300">/</span>
                                        <span className="text-[10px] font-bold text-slate-500">{totalPages}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-xl border transition-all ${currentPage === 1
                                            ? 'bg-slate-50 text-slate-300 border-slate-100'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                                            }`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="hidden sm:flex items-center gap-1 mx-2">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                                            if (pageNum > totalPages) pageNum = totalPages - (Math.min(5, totalPages) - i - 1);
                                            if (pageNum < 1) pageNum = i + 1;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded-xl border transition-all ${currentPage === totalPages
                                            ? 'bg-slate-50 text-slate-300 border-slate-100'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                                            }`}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Detail Overlay */}
            <AnimatePresence>
                {viewProfile && (
                    <DetailView profile={viewProfile} onClose={() => setViewProfile(null)} />
                )}
            </AnimatePresence>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <FormWizard initial={editProfile} onSave={handleSave} onClose={() => { setShowForm(false); setEditProfile(null); }} saving={saving} />
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImport && (
                    <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} importing={importing} />
                )}
                {showSync && (
                    <SyncInterviewModal
                        onClose={() => setShowSync(false)}
                        onSync={handleSync}
                        mappings={mappings}
                        syncing={saving}
                        initialResponseId={initialSyncId || undefined}
                    />
                )}
                {syncPreviewData && (
                    <SyncPreviewModal
                        data={syncPreviewData}
                        onClose={() => setSyncPreviewData(null)}
                        onConfirm={() => handleSync({ ...syncPreviewData.requestData, dryRun: false })}
                        syncing={saving}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default WoredaProfile;

