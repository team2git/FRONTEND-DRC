import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit3, Trash2, X, 
    CheckCircle, Database, Layers, ArrowRightLeft,
    Calculator, Hash, RefreshCw, 
    Info, Sparkles, Filter, Search,
    ArrowRight, Binary, Zap, ShieldCheck, Box, Send, RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
    getProfileMappings, 
    createProfileMapping, 
    updateProfileMapping, 
    deleteProfileMapping,
    permanentlyDeleteProfileMapping,
    type ProfileMapping,
    type ProfileMappingItem
} from '../../api/profileMappingService';
import api from '../../api/axios';

// ─── Constants ────────────────────────────────────────────────────────────────
const WOREDA_PROFILE_FIELDS = [
    { group: 'Location', path: 'location.subcity', label: 'Subcity' },
    { group: 'Location', path: 'location.woreda', label: 'Woreda' },
    { group: 'Location', path: 'location.block', label: 'Block' },
    { group: 'Location', path: 'location.house_no', label: 'House No' },
    { group: 'Survey Meta', path: 'survey_metadata.source_type', label: 'Source Type' },
    { group: 'Survey Meta', path: 'survey_metadata.source_id', label: 'Source ID' },
    { group: 'Survey Meta', path: 'survey_metadata.institution_name', label: 'Institution Name' },
    { group: 'Survey Meta', path: 'survey_metadata.assessor', label: 'Assessor' },
    { group: 'Survey Meta', path: 'survey_metadata.version', label: 'Survey Version' },
    { group: 'Survey Meta', path: 'survey_metadata.gps_coordinates', label: 'GPS Coordinates' },
    { group: 'Survey Meta', path: 'survey_metadata.location_reference', label: 'Location Reference' },

    { group: 'Demographics', path: 'demographics.total_population', label: 'Total Population' },
    { group: 'Demographics', path: 'demographics.male_population', label: 'Male Population' },
    { group: 'Demographics', path: 'demographics.female_population', label: 'Female Population' },
    { group: 'Demographics', path: 'demographics.children_0_17', label: 'Children (0-17)' },
    { group: 'Demographics', path: 'demographics.youth_18_29', label: 'Youth (18-29)' },
    { group: 'Demographics', path: 'demographics.adults_30_59', label: 'Adults (30-59)' },
    { group: 'Demographics', path: 'demographics.elderly_60_plus', label: 'Elderly (60+)' },
    { group: 'Demographics', path: 'demographics.total_households', label: 'Total Households' },
    { group: 'Demographics', path: 'demographics.female_headed_households', label: 'Female-headed HH' },
    { group: 'Demographics', path: 'demographics.informal_settlement_population', label: 'Informal Settlement' },
    { group: 'Demographics', path: 'demographics.low_income_households', label: 'Low Income HH' },
    { group: 'Demographics', path: 'demographics.unemployment_rate', label: 'Unemployment Rate (%)' },
    { group: 'Demographics', path: 'demographics.internally_displaced_population', label: 'IDP Population' },

    { group: 'Services', path: 'basic_services.water_source', label: 'Water Source' },
    { group: 'Services', path: 'basic_services.electricity', label: 'Electricity Access' },
    { group: 'Services', path: 'basic_services.road_access', label: 'Road Access' },
    { group: 'Services', path: 'basic_services.drainage_system_coverage', label: 'Drainage Coverage' },
    { group: 'Services', path: 'basic_services.solid_waste_management_coverage', label: 'Solid Waste Coverage' },
    { group: 'Services', path: 'basic_services.telecommunications_access', label: 'Telecom Access' },
    { group: 'Services', path: 'basic_services.critical_lifeline_redundancy', label: 'Critical Lifeline Redundancy' },

    { group: 'Housing', path: 'housing_indicators.percent_non_durable_materials', label: 'Non-Durable Materials (%)' },
    { group: 'Housing', path: 'housing_indicators.age_buildings_over_30_years', label: 'Buildings Over 30 Years (%)' },
    { group: 'Housing', path: 'housing_indicators.compliance_with_building_codes', label: 'Building Code Compliance' },
    { group: 'Housing', path: 'housing_indicators.housing_density_overcrowding', label: 'Housing Density / Overcrowding' },
    { group: 'Housing', path: 'housing_indicators.informal_housing_coverage', label: 'Informal Housing (%)' },
    { group: 'Housing', path: 'housing_indicators.proximity_to_hazard_zones', label: 'Proximity to Hazard Zones' },
    { group: 'Housing', path: 'housing_indicators.fire_resistant_materials_availability', label: 'Fire Resistant Materials' },

    { group: 'Risk Index', path: 'risk_index.overall_woreda_risk_score', label: 'Overall Risk Score' },
    { group: 'Risk Index', path: 'risk_index.hazard_index', label: 'Hazard Index' },
    { group: 'Risk Index', path: 'risk_index.vulnerability_index', label: 'Vulnerability Index' },
    { group: 'Risk Index', path: 'risk_index.exposure_index', label: 'Exposure Index' },
    { group: 'Risk Index', path: 'risk_index.capacity_index', label: 'Capacity Index' },

    { group: 'Economic Indicators', path: 'economic_risk_indicators.concentration_small_informal_businesses', label: 'Small Informal Businesses' },
    { group: 'Economic Indicators', path: 'economic_risk_indicators.market_exposure', label: 'Market Exposure' },
    { group: 'Economic Indicators', path: 'economic_risk_indicators.daily_labor_dependency', label: 'Daily Labor Dependency' },
    { group: 'Economic Indicators', path: 'economic_risk_indicators.business_interruption_risk', label: 'Business Interruption Risk' },
    { group: 'Economic Indicators', path: 'economic_risk_indicators.industrial_hazard_exposure', label: 'Industrial Hazard Exposure' },
    { group: 'Economic Indicators', path: 'economic_risk_indicators.insurance_coverage_level', label: 'Insurance Coverage' },

    { group: 'Environment', path: 'environmental_indicators.green_space_per_capita', label: 'Green Space per Capita' },
    { group: 'Environment', path: 'environmental_indicators.wetland_encroachment', label: 'Wetland Encroachment' },
    { group: 'Environment', path: 'environmental_indicators.soil_sealing_coverage', label: 'Soil Sealing Coverage' },
    { group: 'Environment', path: 'environmental_indicators.waste_dumping_sites', label: 'Waste Dumping Sites' },
    { group: 'Environment', path: 'environmental_indicators.urban_drainage_blockage_frequency', label: 'Drainage Blockage Frequency' },
    { group: 'Environment', path: 'environmental_indicators.pollution_hotspots', label: 'Pollution Hotspots' },

    { group: 'Preparedness', path: 'preparedness_indicators.emergency_shelters_availability', label: 'Emergency Shelters' },
    { group: 'Preparedness', path: 'preparedness_indicators.evacuation_routes_mapped', label: 'Evacuation Routes' },
    { group: 'Preparedness', path: 'preparedness_indicators.firefighting_equipment_availability', label: 'Firefighting Equipment' },
    { group: 'Preparedness', path: 'preparedness_indicators.ambulance_coverage', label: 'Ambulance Coverage' },
    { group: 'Preparedness', path: 'preparedness_indicators.emergency_drills_frequency', label: 'Emergency Drills' },
    { group: 'Preparedness', path: 'preparedness_indicators.community_awareness_level', label: 'Community Awareness' },
    { group: 'Preparedness', path: 'preparedness_indicators.stockpiled_emergency_supplies', label: 'Emergency Supplies' },

    { group: 'Recovery', path: 'recovery_indicators.post_disaster_recovery_plans', label: 'Recovery Plans' },
    { group: 'Recovery', path: 'recovery_indicators.livelihood_diversification', label: 'Livelihood Diversification' },
    { group: 'Recovery', path: 'recovery_indicators.access_to_credit_safety_nets', label: 'Access to Credit / Safety Nets' },
    { group: 'Recovery', path: 'recovery_indicators.community_self_help_groups', label: 'Self Help Groups' },
    { group: 'Recovery', path: 'recovery_indicators.urban_upgrading_programs', label: 'Urban Upgrading Programs' },
    { group: 'Recovery', path: 'recovery_indicators.climate_adaptation_initiatives', label: 'Climate Adaptation' },

    { group: 'Raw Survey', path: 'raw_survey.household_level.responses', label: 'Household Raw Responses' },
    { group: 'Raw Survey', path: 'raw_survey.household_level.notes', label: 'Household Notes' },
    { group: 'Raw Survey', path: 'raw_survey.community_group_discussion.responses', label: 'CGD Raw Responses' },
    { group: 'Raw Survey', path: 'raw_survey.community_group_discussion.notes', label: 'CGD Notes' },
    { group: 'Raw Survey', path: 'raw_survey.key_informant_interview.responses', label: 'KII Raw Responses' },
    { group: 'Raw Survey', path: 'raw_survey.key_informant_interview.notes', label: 'KII Notes' },
];

const SOURCE_TYPES = [
    { value: 'SiteSurveyTemplate', label: 'Site Survey' },
    { value: 'InterviewTemplate', label: 'Interview' },
];


// ─── Transformation Types ───────────────────────────────────────────────────
const TRANSFORMATION_TYPES = [
    { value: 'direct', label: 'Direct Entry', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { value: 'cast_number', label: 'Convert to Number', icon: Binary, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'boolean_map', label: 'Logic Map (Yes/No)', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
    { value: 'lookup', label: 'Lookup Table', icon: Filter, color: 'text-amber-500', bg: 'bg-amber-50' },
    { value: 'calculation', label: 'Calculation Engine', icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-50' },
];

// ─── Helper Components ────────────────────────────────────────────────────────
const MappingRow: React.FC<{ 
    item: ProfileMappingItem; 
    templateFields: any[];
    updateRow: (u: Partial<ProfileMappingItem>) => void;
    removeRow: () => void;
}> = ({ item, templateFields, updateRow, removeRow }) => {
    const transformation = TRANSFORMATION_TYPES.find(t => t.value === item.transformation) || TRANSFORMATION_TYPES[0];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid grid-cols-12 gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all items-center relative group/row"
        >
            <div className="col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Variable</label>
                <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <select 
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none"
                        value={item.sourceKey} onChange={e => updateRow({ sourceKey: e.target.value })}
                    >
                        <option value="">Choose Input...</option>
                        {templateFields.map((f: any) => (
                            <option key={f.code} value={f.code}>{f.code} — {f.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="col-span-3">
                <div className="flex flex-col items-center gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Transformer</label>
                    <button 
                        onClick={() => {
                            const currentIdx = TRANSFORMATION_TYPES.findIndex(t => t.value === item.transformation);
                            const nextIdx = (currentIdx + 1) % TRANSFORMATION_TYPES.length;
                            updateRow({ transformation: TRANSFORMATION_TYPES[nextIdx].value as any });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${transformation.bg} border-transparent hover:border-indigo-200 group/btn`}
                    >
                        <transformation.icon className={transformation.color} size={16} />
                        <div className="text-left flex-1 min-w-0">
                            <p className={`text-[10px] font-black truncate ${transformation.color}`}>{transformation.label}</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="col-span-4 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Target</label>
                <div className="relative">
                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <select 
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none"
                        value={item.targetFieldPath} onChange={e => updateRow({ targetFieldPath: e.target.value })}
                    >
                        <option value="">Choose Database Field...</option>
                        {Object.entries(
                            WOREDA_PROFILE_FIELDS.reduce((acc: any, curr) => {
                                if (!acc[curr.group]) acc[curr.group] = [];
                                acc[curr.group].push(curr);
                                return acc;
                            }, {})
                        ).map(([group, fields]: [string, any]) => (
                            <optgroup key={group} label={group}>
                                {fields.map((f: any) => (
                                    <option key={f.path} value={f.path}>{f.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            <div className="col-span-1 pt-6 flex justify-end">
                <button 
                    onClick={removeRow} 
                    className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {item.transformation === 'calculation' && (
                <div className="col-span-12 mt-4 p-8 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-indigo-100/50 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Calculator size={18} /></div>
                        <div>
                            <h5 className="text-sm font-black text-slate-900">Aggregation Logic</h5>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase">Sum, Average, Concat or Logic Across Multiple Inputs</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aggregate Mode</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl">
                                    {[
                                        { id: 'sum', label: 'Σ Sum' },
                                        { id: 'average', label: 'Ø Avg' },
                                        { id: 'concat', label: '& Concat' },
                                        { id: 'formula', label: 'ƒ Formula' },
                                        { id: 'and', label: 'AND' },
                                        { id: 'or', label: 'OR' },
                                        { id: 'count', label: '# Count' }
                                    ].map(op => (
                                        <button 
                                            key={op.id}
                                            onClick={() => updateRow({ operation: op.id as any })}
                                            className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all ${item.operation === op.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            {op.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Source Factors</label>
                                <select 
                                    className="w-full px-6 py-3 rounded-2xl bg-white border border-slate-100 text-[11px] font-bold text-slate-700 shadow-sm transition-all focus:border-indigo-200 outline-none"
                                    onChange={e => {
                                        if (!e.target.value) return;
                                        const keys = [...(item.sourceKeys || [])];
                                        if (!keys.includes(e.target.value)) keys.push(e.target.value);
                                        updateRow({ sourceKeys: keys, sourceKey: keys[0] || '' });
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">+ Add Variable...</option>
                                    {templateFields.map((f: any) => (
                                        <option key={f.code} value={f.code}>{f.code} — {f.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {item.operation === 'formula' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Formula (Use {"{{Q_CODE}}"})</label>
                                <input 
                                    className="w-full px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm focus:border-indigo-400 outline-none transition-all"
                                    placeholder="e.g. {{Q1}} + {{Q2}}"
                                    value={item.formula || ''}
                                    onChange={e => updateRow({ formula: e.target.value })}
                                />
                            </div>
                        ) : item.operation === 'concat' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Separator</label>
                                <input 
                                    className="w-full px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm focus:border-indigo-400 outline-none transition-all"
                                    placeholder="Fixed string separator (e.g. , or /)"
                                    value={item.separator || ' '}
                                    onChange={e => updateRow({ separator: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                                <Info size={14} className="text-indigo-600" />
                                <p className="text-[10px] font-medium text-slate-500 italic">This will combine all listed source variables using the selected operator.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2.5 p-4 mt-6 bg-white/50 rounded-2xl border border-dashed border-indigo-100 min-h-[60px]">
                        {(item.sourceKeys || []).map((key, kIdx) => (
                            <div key={kIdx} className="flex items-center gap-2.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black group">
                                <Hash size={12} className="text-indigo-400" /> {key}
                                <button onClick={() => {
                                    const keys = (item.sourceKeys || []).filter((_, i) => i !== kIdx);
                                    updateRow({ sourceKeys: keys, sourceKey: keys[0] || '' });
                                }} className="text-slate-500 hover:text-rose-400 transition-colors ml-1"><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {item.transformation === 'lookup' && (
                <div className="col-span-12 mt-4 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg"><Filter size={18} /></div>
                            <div>
                                <h5 className="text-sm font-black text-slate-900">Lookup Definition</h5>
                                <p className="text-[10px] font-bold text-amber-500 uppercase">Map specific values</p>
                            </div>
                        </div>
                        <button onClick={() => {
                            const opts = [...(item.lookupOptions || [])];
                            opts.push({ sourceValue: '', targetValue: '' });
                            updateRow({ lookupOptions: opts });
                        }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm"><Plus size={14} /> Add Pattern</button>
                    </div>

                    <div className="space-y-3">
                        {(item.lookupOptions || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm">
                                <input placeholder="Input" className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-50 text-[11px] font-bold" value={opt.sourceValue} onChange={e => {
                                    const newOpts = [...(item.lookupOptions || [])];
                                    newOpts[oIdx].sourceValue = e.target.value;
                                    updateRow({ lookupOptions: newOpts });
                                }} />
                                <ArrowRightLeft size={16} className="text-amber-500" />
                                <input placeholder="Target" className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-50 text-[11px] font-bold" value={opt.targetValue} onChange={e => {
                                    const newOpts = [...(item.lookupOptions || [])];
                                    newOpts[oIdx].targetValue = e.target.value;
                                    updateRow({ lookupOptions: newOpts });
                                }} />
                                <button onClick={() => {
                                    const newOpts = (item.lookupOptions || []).filter((_, i) => i !== oIdx);
                                    updateRow({ lookupOptions: newOpts });
                                }} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    Published: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    Draft: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    Archived: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const MappingCard: React.FC<{ 
    mapping: ProfileMapping; 
    onEdit: () => void; 
    onDelete: (permanent?: boolean) => void;
    onStatusChange: (status: ProfileMapping['status']) => void;
}> = ({ mapping, onEdit, onDelete, onStatusChange }) => (
    <motion.div 
        layout 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        whileHover={{ y: -5 }} 
        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group flex flex-col overflow-hidden"
    >
        {/* Top color strip */}
        <div className={`h-1.5 w-full ${mapping.status === 'Published' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : mapping.status === 'Draft' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-slate-200'}`} />

        <div className="p-6 flex-1">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {mapping.sourceType}
                    </div>
                    <div className={`
                        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase
                        ${STATUS_CONFIG[mapping.status]?.bg || STATUS_CONFIG.Draft.bg} 
                        ${STATUS_CONFIG[mapping.status]?.text || STATUS_CONFIG.Draft.text}
                    `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[mapping.status]?.dot || STATUS_CONFIG.Draft.dot} ${mapping.status === 'Published' ? 'animate-pulse' : ''}`} /> 
                        {mapping.status}
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{mapping.name}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed min-h-[40px]">
                {mapping.description || 'Seamlessly synchronize survey responses into your core database.'}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="text-center border-r border-slate-50">
                    <p className="text-xl font-black text-slate-900">{mapping.mappings.length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Transformers</p>
                </div>
                <div className="text-center">
                    <p className="text-xl font-black text-indigo-600">v{mapping.version}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Revision</p>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-t border-slate-100">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                <Box size={12} className="text-indigo-400" />
                {mapping.createdBy?.fullname || 'System'}
            </div>
            <div className="flex items-center gap-1">
                {mapping.status === 'Archived' ? (
                    <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onStatusChange('Draft'); }} 
                            className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all"
                            title="Restore Connector"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(true); }} 
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                            title="Delete Permanently"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                ) : (
                    <>
                        {mapping.status === 'Draft' ? (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onStatusChange('Published'); }} 
                                className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-all"
                                title="Publish Mapping"
                            >
                                <Send size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onStatusChange('Draft'); }} 
                                className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                title="Revert to Draft"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                        <button 
                            onClick={onEdit} 
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 transition-all"
                            title="Edit Connector"
                        >
                            <Edit3 size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(false); }} 
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-all"
                            title="Archive Connector"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    </motion.div>
);

const MappingForm: React.FC<{ 
    initial: ProfileMapping | null; 
    templates: any[]; 
    onClose: () => void; 
    onSave: () => void 
}> = ({ initial, templates, onClose, onSave }) => {
    const [name, setName] = useState(initial?.name || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [sourceId, setSourceId] = useState(initial?.sourceId || '');
    const [sourceType, setSourceType] = useState<ProfileMapping['sourceType']>(initial?.sourceType || 'SiteSurveyTemplate');
    const [mappings, setMappings] = useState<ProfileMappingItem[]>(initial?.mappings || []);
    const [status, setStatus] = useState<'Draft' | 'Published' | 'Archived'>(initial?.status || 'Draft');
    const [saving, setSaving] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'config' | 'mappings'>('config');

    useEffect(() => {
        if (sourceId) {
            const t = templates.find(temp => temp._id === sourceId);
            setSelectedTemplate(t);
        }
    }, [sourceId, templates]);

    const templateFields = useMemo(() => {
        if (!selectedTemplate) return [];
        return selectedTemplate.modules.flatMap((m: any) => 
            m.sections.flatMap((s: any) => s.fields.map((f: any) => ({
                code: f.questionCode,
                label: f.label
            })))
        );
    }, [selectedTemplate]);

    const handleSave = async () => {
        if (!name || !sourceId) return toast.error('Check your configuration settings');
        try {
            setSaving(true);
            const payload = { 
                name, description, 
                sourceType, 
                sourceId, mappings,
                status
            };
            if (initial) {
                await updateProfileMapping(initial._id, payload);
                toast.success('Connector updated');
            } else {
                await createProfileMapping(payload);
                toast.success('Connector established');
            }
            onSave();
        } catch (error) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const autoMap = () => {
        if (!selectedTemplate) return toast.info('Link a template first');
        const newMappings = [...mappings];
        let count = 0;
        templateFields.forEach((tf: any) => {
            if (newMappings.some(m => m.sourceKey === tf.code)) return;
            const match = WOREDA_PROFILE_FIELDS.find(pf => 
                tf.label.toLowerCase().includes(pf.label.toLowerCase()) || 
                pf.label.toLowerCase().includes(tf.label.toLowerCase()) ||
                tf.code.toLowerCase().includes(pf.path.split('.').pop() || '')
            );
            if (match) {
                newMappings.push({ targetFieldPath: match.path, sourceKey: tf.code, transformation: 'direct' });
                count++;
            }
        });
        setMappings(newMappings);
        toast.success(`Connected ${count} fields automatically`);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} className="relative bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
                <div className="px-10 py-7 bg-white flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <ArrowRightLeft size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{initial ? 'Update Connector' : 'Create Connector'}</h2>
                                <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{mappings.length} Fields</div>
                            </div>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Define how survey or interview data flows into your woreda profile.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex p-1 bg-slate-50 rounded-xl mr-2">
                            <button onClick={() => setActiveTab('config')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Settings</button>
                            <button onClick={() => setActiveTab('mappings')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'mappings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mapping</button>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    {activeTab === 'config' ? (
                        <div className="p-10 max-w-2xl mx-auto space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">General Settings</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Connector Identity</label>
                                        <input className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 font-bold placeholder:text-slate-300 shadow-sm focus:border-indigo-300 transition-all outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Woreda Profile Sync" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Documentation</label>
                                        <textarea className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 shadow-sm focus:border-indigo-300 transition-all outline-none min-h-[100px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the purpose of this mapping..." />
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Type</label>
                                        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                                            {SOURCE_TYPES.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setSourceType(option.value as ProfileMapping['sourceType'])}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sourceType === option.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Template</label>
                                        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 border-dashed">
                                            <select className="w-full px-5 py-3 rounded-xl bg-white border border-indigo-100 text-slate-900 font-black shadow-sm" value={sourceId} onChange={e => setSourceId(e.target.value)}>
                                                <option value="">Choose a Template...</option>
                                                {templates.map(t => <option key={t._id} value={t._id}>{t.name} (v{t.version})</option>)}
                                            </select>
                                            {selectedTemplate && (
                                                <div className="flex items-center gap-4 mt-3 px-1 text-[10px] font-bold uppercase tracking-tight text-indigo-400">
                                                    <span className="flex items-center gap-1.5"><Layers size={10} /> {selectedTemplate.modules.length} Modules</span>
                                                    <span className="flex items-center gap-1.5"><Database size={10} /> {templateFields.length} Data Points</span>
                                                    <span className="flex items-center gap-1.5"><ArrowRightLeft size={10} /> {SOURCE_TYPES.find(t => t.value === sourceType)?.label || 'Survey'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {initial && (
                                        <div className="space-y-4 pt-2 border-t border-slate-100 mt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Publication Status</p>
                                                    <p className="text-[10px] font-medium text-slate-400">Only published mappings can sync live data.</p>
                                                </div>
                                                <div className="flex p-0.5 bg-slate-100 rounded-lg">
                                                    <button onClick={() => setStatus('Draft')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${status === 'Draft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Draft</button>
                                                    <button onClick={() => setStatus('Published')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${status === 'Published' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Published</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-6">
                                    <button onClick={() => setActiveTab('mappings')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-600 transition-all">
                                        Next Step: Configuration <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 lg:p-10 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100 pb-6 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Binary size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Transformer Layer</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Configuring {mappings.length} point-to-point links</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={autoMap} className="flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black uppercase border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all">
                                        <Sparkles size={14} /> Auto-Sync
                                    </button>
                                    <div className="w-px h-8 bg-slate-200 mx-2" />
                                    <button onClick={() => setMappings([...mappings, { targetFieldPath: '', sourceKey: '', transformation: 'direct' }])} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all">
                                        <Plus size={14} /> New Link
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {mappings.map((m, idx) => <MappingRow key={idx} item={m} templateFields={templateFields} updateRow={(updates) => setMappings(mappings.map((row, i) => i === idx ? { ...row, ...updates } : row))} removeRow={() => setMappings(mappings.filter((_, i) => i !== idx))} />)}
                                </AnimatePresence>
                                {mappings.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200 border-4 border-white shadow-sm">
                                            <Info size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Canvas is Empty</p>
                                        <button onClick={() => setMappings([{ targetFieldPath: '', sourceKey: '', transformation: 'direct' }])} className="mt-4 text-[11px] font-black text-indigo-600 hover:underline px-4 py-2 bg-indigo-50 rounded-lg">Add First Link</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${name && sourceId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Status: {name && sourceId ? 'Ready' : 'Incomplete'}
                            </span>
                        </div>
                        {selectedTemplate && (
                            <div className="hidden lg:flex items-center gap-2">
                                <Box size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-600 uppercase">
                                    Template: {selectedTemplate.name}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Discard</button>
                        <button 
                            disabled={saving || !name || !sourceId} 
                            onClick={handleSave} 
                            className={`
                                px-10 py-3 rounded-xl text-sm font-black uppercase tracking-tight flex items-center gap-2 transition-all shadow-md
                                ${saving || !name || !sourceId ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-xl hover:-translate-y-0.5 shadow-indigo-100'}
                            `}
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            {saving ? 'Syncing...' : initial ? 'Update Configuration' : 'Establish Link'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MappingConfig: React.FC = () => {
    const [mappings, setMappings] = useState<ProfileMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMapping, setEditingMapping] = useState<ProfileMapping | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Published' | 'Archived'>('All');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [mList, tList] = await Promise.all([getProfileMappings(), api.get('/templates').then(r => r.data)]);
                setMappings(mList);
                setTemplates(tList);
            } catch (error) {
                toast.error('Failed to load mappings');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const fetchMappings = async () => {
        try {
            const data = await getProfileMappings();
            setMappings(data);
        } catch (error) {
            toast.error('Failed to update mappings list');
        }
    };

    const filteredMappings = mappings.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' ? m.status !== 'Archived' : m.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (id: string, isPermanent: boolean = false) => {
        const msg = isPermanent 
            ? 'This mapping will be gone forever. Continue?' 
            : 'Archive this mapping? You can restore it later.';
            
        if (!window.confirm(msg)) return;
        
        try {
            if (isPermanent) {
                await permanentlyDeleteProfileMapping(id);
                toast.success('Mapping permanently removed');
            } else {
                await deleteProfileMapping(id);
                toast.success('Mapping moved to Archive');
            }
            fetchMappings();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: ProfileMapping['status']) => {
        try {
            await updateProfileMapping(id, { status: newStatus });
            toast.success(`Mapping marked as ${newStatus}`);
            fetchMappings();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const stats = useMemo(() => {
        return {
            total: mappings.length,
            active: mappings.filter(m => m.isActive).length,
            fields: mappings.reduce((acc, m) => acc + m.mappings.length, 0)
        };
    }, [mappings]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-[1440px] mx-auto p-4 lg:p-10">
                {/* ── Page Header ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile Connectors</h1>
                        <p className="text-slate-500 mt-1 font-medium">Map survey data to your Woreda Profile database with precision.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => { setEditingMapping(null); setShowForm(true); }} 
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:shadow-indigo-100 transition-all"
                        >
                            <Plus size={20} />
                            Create New Link
                        </button>
                    </div>
                </header>

                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Layers size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connectors</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-emerald-700">{stats.active}</p>
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Active Channels</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <ArrowRightLeft size={24} />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{stats.fields}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mapped Fields</p>
                        </div>
                    </div>
                </div>

                {/* ── Search & Filters ── */}
                <div className="flex flex-col sm:flex-row gap-6 mb-10 items-center justify-between">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {['All', 'Draft', 'Published', 'Archived'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s as any)}
                                className={`px-6 py-2 text-xs font-black uppercase tracking-tight rounded-lg transition-all ${filterStatus === s
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-1 items-center gap-4 w-full">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search connectors by name or description..."
                                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm"
                            />
                        </div>
                        <button className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100/50">
                        <div className="relative"><div className="w-16 h-16 border-4 border-indigo-50 rounded-full" /><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0" /></div>
                        <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Layer</p>
                    </div>
                ) : filteredMappings.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"><ArrowRightLeft size={40} className="text-slate-300" /></div>
                        <h3 className="text-2xl font-black text-slate-800">No Mappings Found</h3>
                        <p className="mt-8 px-8 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold inline-block cursor-pointer" onClick={() => setShowForm(true)}>Configure Now</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMappings.map(m => (
                                <MappingCard 
                                    key={m._id} 
                                    mapping={m} 
                                    onEdit={() => { setEditingMapping(m); setShowForm(true); }} 
                                    onDelete={(permanent) => handleDelete(m._id, permanent)} 
                                    onStatusChange={(status) => handleStatusUpdate(m._id, status)}
                                />
                        ))}
                    </div>
                )}

                <AnimatePresence>{showForm && <MappingForm initial={editingMapping} templates={templates} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); fetchMappings(); }} />}</AnimatePresence>
            </div>
        </div>
    );
};

export default MappingConfig;
