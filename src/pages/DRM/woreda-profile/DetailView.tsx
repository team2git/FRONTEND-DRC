import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Users, Home, ShieldCheck, Wheat, Zap, Heart, AlertTriangle,
    Activity, Info, MapPin, Maximize2, Minimize2, X, Eye, CheckCircle
} from 'lucide-react';
import { type WoredaProfile as WProfile } from '../../../api/woredaProfileService';
import { statusColor, getProfileTitle, getProfileSubtitle } from './constants';
import { RadialProgress } from './RadialProgress';
import { HierarchySummaryView } from './HierarchySummaryView';

export const DetailView: React.FC<{ profile: WProfile; onClose: () => void }> = ({ profile, onClose }) => {
    const isHousehold = profile.aggregation_level === 'household' ||
        (profile.location.house_no && profile.location.house_no !== 'Aggregated Data' && profile.location.house_no !== '');

    const [activeTab, setActiveTab] = useState('overview');
    const [isMaximized, setIsMaximized] = useState(false);

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
            className={`fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center transition-all duration-300 ${isMaximized ? 'justify-center p-0' : 'justify-end'}`}
            onClick={onClose}
        >
            <motion.div
                initial={{ x: isMaximized ? 0 : '100%', scale: isMaximized ? 0.95 : 1 }}
                animate={{ x: 0, scale: 1 }}
                exit={{ x: isMaximized ? 0 : '100%', scale: isMaximized ? 0.95 : 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`h-full bg-slate-50 shadow-2xl flex flex-col relative transition-all duration-300 ${
                    isMaximized ? 'w-full max-w-full' : 'w-full max-w-4xl'
                }`}
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center"
                            title={isMaximized ? "Restore view" : "Maximize view"}
                        >
                            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs Row */}
                <div className="bg-white border-b border-slate-200 relative">
                    {/* Left fade mask */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent z-10" />
                    {/* Right fade mask */}
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent z-10" />
                    <div
                        className="flex flex-nowrap items-center gap-2 px-8 py-3 overflow-x-auto scroll-smooth custom-scrollbar"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}
                    >
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all duration-200 whitespace-nowrap text-xs font-black uppercase tracking-wider flex-shrink-0 ${
                                        active
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* ADMINISTRATIVE OVERVIEW */}
                    {!isHousehold && activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Radial scorecard grid */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
                                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.35),_transparent_50%)]" />
                                <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-wider text-indigo-300">
                                    <Activity size={16} className="text-indigo-400 animate-pulse" />
                                    DRM Risk Index & Scorecard
                                </h3>
                                <div className={`grid gap-6 ${isMaximized ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-3'}`}>
                                    <RadialProgress 
                                        value={profile.risk_index?.overall_woreda_risk_score || profile.hierarchy_summary?.dr_risk_score || 0} 
                                        max={25} 
                                        label="Risk Score" 
                                        sublabel="Composite" 
                                        color="#6366f1" 
                                        dark={true}
                                        size={120}
                                    />
                                    <RadialProgress 
                                        value={profile.risk_index?.hazard_index || profile.hierarchy_summary?.hazard_score || 0} 
                                        max={10} 
                                        label="Hazard" 
                                        sublabel="H" 
                                        color="#f43f5e" 
                                        dark={true}
                                    />
                                    <RadialProgress 
                                        value={profile.risk_index?.exposure_index || profile.hierarchy_summary?.exposure_score || 0} 
                                        max={10} 
                                        label="Exposure" 
                                        sublabel="E" 
                                        color="#f59e0b" 
                                        dark={true}
                                    />
                                    <RadialProgress 
                                        value={profile.risk_index?.vulnerability_index || profile.hierarchy_summary?.vulnerability_score || 0} 
                                        max={10} 
                                        label="Vulnerability" 
                                        sublabel="V" 
                                        color="#8b5cf6" 
                                        dark={true}
                                    />
                                    <RadialProgress 
                                        value={profile.risk_index?.capacity_index || profile.hierarchy_summary?.capacity_score || 0} 
                                        max={10} 
                                        label="Capacity" 
                                        sublabel="C" 
                                        color="#10b981" 
                                        dark={true}
                                    />
                                </div>
                            </div>

                            <div className={`grid gap-6 ${isMaximized ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                                <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between md:col-span-2">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <Info size={16} className="text-indigo-600" />
                                            Identity & Meta Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { label: 'Sub-city', value: profile.location.subcity },
                                                { label: 'Woreda', value: profile.location.woreda },
                                                { label: 'Block', value: profile.location.block },
                                                { label: 'House No', value: profile.location.house_no },
                                                { label: 'Status', value: profile.status, isBadge: true }
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 col-span-2 sm:col-span-1">
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
                            </div>

                            {/* Aggregation Formulas */}
                            <HierarchySummaryView profile={profile} />
                        </div>
                    )}

                    {/* ADMINISTRATIVE DEMOGRAPHICS */}
                    {!isHousehold && activeTab === 'demographics' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Users className="text-indigo-600" size={18} />
                                    Aggregated Demographics
                                </h3>
                                
                                <div className={`grid gap-4 mb-8 ${isMaximized ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                                    {[
                                        { label: 'Total Population', value: (profile.demographics?.total_population || 0).toLocaleString(), desc: 'Sum of all residents' },
                                        { label: 'Total Households', value: (profile.demographics?.total_households || 0).toLocaleString(), desc: 'Total family units' },
                                        { label: 'Low Income HHs', value: (profile.demographics?.low_income_households || 0).toLocaleString(), desc: 'Below poverty line' },
                                        { label: 'IDP Residents', value: (profile.demographics?.internally_displaced_population || 0).toLocaleString(), desc: 'Displaced population' },
                                        { label: 'Unemployment Rate', value: `${profile.demographics?.unemployment_rate || 0}%`, desc: 'Average active labor gap' },
                                        { label: 'Informal Settlement Pop', value: (profile.demographics?.informal_settlement_population || 0).toLocaleString(), desc: 'Residing in slums' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className={`grid gap-6 mb-8 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {/* Gender Split (Visual progress bar) */}
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100/60 shadow-sm space-y-4">
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
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100/60 shadow-sm space-y-4">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Age Group Demographics</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Children (0–17)', val: profile.demographics?.children_0_17 || 0, color: 'bg-emerald-500' },
                                                { label: 'Youth (18–29)', val: profile.demographics?.youth_18_29 || 0, color: 'bg-indigo-500' },
                                                { label: 'Adults (30–59)', val: profile.demographics?.adults_30_59 || 0, color: 'bg-amber-500' },
                                                { label: 'Elderly (60+)', val: profile.demographics?.elderly_60_plus || 0, color: 'bg-rose-500' }
                                            ].map((g, idx) => (
                                                <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{g.label}</span>
                                                        <span className="text-xs font-black text-slate-900">{g.val.toLocaleString()}</span>
                                                    </div>
                                                    {renderProgressBar(g.val, profile.demographics?.total_population || 1, g.color)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Education Statistics */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Aggregated Education Levels</h4>
                                    <div className={`grid gap-3 ${isMaximized ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                        {(profile.demographics?.education_levels || []).map((e, i) => (
                                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shadow-sm">
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Wheat className="text-indigo-600" size={18} />
                                    Livelihoods & Livelihood Economy
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Livelihood Type Distribution</h4>
                                    <div className={`grid gap-4 ${isMaximized ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                                        {(profile.livelihoods || []).map((l, i) => (
                                            <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between shadow-sm">
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
                                    <div className={`grid gap-4 ${isMaximized ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                        {[
                                            { label: 'Informal Businesses', value: profile.economic_risk_indicators?.concentration_small_informal_businesses, desc: 'Small/informal operations concentration' },
                                            { label: 'Market Exposure', value: profile.economic_risk_indicators?.market_exposure, desc: 'Market supply disruption risk' },
                                            { label: 'Daily Labor Dependency', value: profile.economic_risk_indicators?.daily_labor_dependency, desc: 'Relying on daily manual labor wages' },
                                            { label: 'Interruption Risk', value: profile.economic_risk_indicators?.business_interruption_risk, desc: 'Vulnerability to business closure' },
                                            { label: 'Industrial Hazard Exposure', value: profile.economic_risk_indicators?.industrial_hazard_exposure, desc: 'Proximity to factories/hazardous sites' },
                                            { label: 'Insurance Level', value: profile.economic_risk_indicators?.insurance_coverage_level, desc: 'Active insurance safety buffers' }
                                        ].map((indicator, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{indicator.label}</p>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${indicator.value === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            indicator.value === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        }`}>{indicator.value || 'Low'}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 leading-snug">{indicator.desc}</p>
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Zap className="text-indigo-600" size={18} />
                                    Services & Critical Infrastructure
                                </h3>

                                <div className={`grid gap-6 mb-8 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                                    {/* Service Coverage List */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Infrastructure Coverage</h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Electricity Access', value: profile.basic_services?.electricity ? 100 : 0 },
                                                { label: 'Drainage System Coverage', value: profile.basic_services?.drainage_system_coverage ? 100 : 0 },
                                                { label: 'Solid Waste Mgmt Coverage', value: profile.basic_services?.solid_waste_management_coverage ? 100 : 0 },
                                                { label: 'Telecommunications Access', value: profile.basic_services?.telecommunications_access ? 100 : 0 },
                                                { label: 'Critical Lifeline Redundancy', value: profile.basic_services?.critical_lifeline_redundancy ? 100 : 0 }
                                            ].map((svc, i) => (
                                                <div key={i} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{svc.label}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${svc.value === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200/50'
                                                        }`}>{svc.value === 100 ? 'Available' : 'Unavailable'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Primary Providers */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between shadow-sm">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-bold">Service Types</h4>
                                            <div className="space-y-3">
                                                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Water Source</p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">{profile.basic_services?.water_source || 'Piped Network Connection'}</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Road Access Grade</p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">{profile.basic_services?.road_access || 'All-Weather Paved Road'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 border border-indigo-100/55 rounded-2xl p-4 mt-4 shadow-sm">
                                            <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider mb-1">Infrastructure Resilience</p>
                                            <p className="text-[10px] text-indigo-600 leading-snug">Average distance to critical utility networks and backup lifelines at this administrative boundary.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Critical Facilities Table */}
                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Distance & Safety of Emergency Facilities</h4>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-4">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="py-2.5 px-2">Facility Type</th>
                                                    <th className="py-2.5 px-2">Avg Distance</th>
                                                    <th className="py-2.5 px-2">Structural Safety</th>
                                                    <th className="py-2.5 px-2">Emergency Equipment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-bold bg-white">
                                                {(profile.critical_facilities || []).map((f, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3 px-3">{f.facility_type}</td>
                                                        <td className="py-3 px-3 text-slate-900">{(f.distance_to_nearest_emergency_service ?? 0).toFixed(1)} km</td>
                                                        <td className="py-3 px-3">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${f.structural_safety === 'Good' ? 'bg-emerald-50 text-emerald-600' :
                                                                    f.structural_safety === 'Fair' ? 'bg-amber-50 text-amber-600' :
                                                                        'bg-rose-50 text-rose-600'
                                                                }`}>{f.structural_safety || 'Fair'}</span>
                                                        </td>
                                                        <td className="py-3 px-3">
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Heart className="text-indigo-600" size={18} />
                                    Social Vulnerability & DRM Capacity
                                </h3>

                                <div className={`grid gap-6 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                                    {/* Vulnerable Groups list */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 shadow-sm">
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
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-bold">Community DRM Capacity</h4>
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <AlertTriangle className="text-indigo-600" size={18} />
                                    Active Localized Hazards & Indicators
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Hazard Assessments</h4>
                                    <div className={`grid gap-4 ${isMaximized ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
                                    <div className={`grid gap-4 ${isMaximized ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                        {[
                                            { label: 'Green Space', value: profile.environmental_indicators?.green_space_per_capita, desc: 'Average public green space ratio' },
                                            { label: 'Wetlands Encroachment', value: profile.environmental_indicators?.wetland_encroachment, desc: 'Rate of wetland degradation' },
                                            { label: 'Soil Sealing', value: profile.environmental_indicators?.soil_sealing_coverage, desc: 'Coverage of paved/concrete surfaces' },
                                            { label: 'Waste Dumping Sites', value: profile.environmental_indicators?.waste_dumping_sites, desc: 'Informal dumping and waste issues' },
                                            { label: 'Drainage Blockage', value: profile.environmental_indicators?.urban_drainage_blockage_frequency, desc: 'Blockage frequency in main canals' },
                                            { label: 'Pollution Hotspots', value: profile.environmental_indicators?.pollution_hotspots, desc: 'Localized air/water pollution status' }
                                        ].map((indicator, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{indicator.label}</p>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${indicator.value === 'Critical' || indicator.value === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            indicator.value === 'Fair' || indicator.value === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        }`}>{indicator.value || 'Good'}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 leading-snug">{indicator.desc}</p>
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Users className="text-indigo-600" size={18} />
                                    Household Members & Demographics
                                </h3>

                                <div className={`grid gap-4 mb-6 ${isMaximized ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
                                    {[
                                        { label: 'Total HH Members', value: hh.demographics?.total_household_members || 0 },
                                        { label: 'Children (0-17)', value: hh.demographics?.children_0_17 || 0 },
                                        { label: 'Youth (18-29)', value: hh.demographics?.youth_18_29 || 0 },
                                        { label: 'Elderly (60+)', value: hh.demographics?.elderly_60_plus || 0 }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className={`grid gap-6 mb-6 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-bold">General Specifications</h4>
                                        <div className="space-y-2 text-xs text-slate-800 font-bold">
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
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between shadow-sm">
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-bold">Household Gender Distribution</h4>
                                            {(() => {
                                                const tot = hh.demographics?.total_household_members || 1;
                                                const male = hh.demographics?.male_members || 0;
                                                const female = hh.demographics?.female_members || 0;
                                                const malePct = (male / tot) * 100;
                                                const femalePct = (female / tot) * 100;
                                                return (
                                                    <div className="space-y-3 pt-2">
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
                                    <div className={`grid gap-4 ${isMaximized ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                                    <p className="text-xs font-bold text-slate-800">{item.value || 'No'}</p>
                                                </div>
                                                {item.sub && <p className="text-[9px] text-slate-400 mt-1 leading-tight">{item.sub}</p>}
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <MapPin className="text-indigo-600" size={18} />
                                    Housing & Building Infrastructure
                                </h3>

                                <div className={`grid gap-4 mb-6 ${isMaximized ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="text-indigo-600" size={18} />
                                    Preparedness & Recovery Buffers
                                </h3>

                                <div className={`grid gap-6 mb-8 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                                    {/* Preparedness Checklist */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-bold mb-2">Preparedness Buffers</h4>
                                        <div className="space-y-1.5 text-xs text-slate-800 font-bold">
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
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-bold">Self-Rated Awareness & Resilience</h4>

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
                                    <div className={`grid gap-4 ${isMaximized ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
export default DetailView;
