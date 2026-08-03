import React from 'react';
import { motion } from 'framer-motion';
import {
    Database, Layers, Filter, Box, ShieldCheck, Sparkles, Users,
    AlertTriangle, Calculator, Clock, Eye, Edit3, Trash2, ArrowRight, FileText
} from 'lucide-react';
import { type WoredaProfile as WProfile } from '../../../api/woredaProfileService';
import { STATUS_CONFIG, getProfileTitle, getProfileSubtitle } from './constants';

export const ProfileCard: React.FC<{
    profile: WProfile;
    onView: () => void;
    onDrillDown?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onAssess?: () => void;
    drillDownLabel?: string;
    level: string;
}> = ({ profile, onView, onDrillDown, onEdit, onDelete, onAssess, drillDownLabel, level }) => {
    const population = profile.demographics?.total_population ||
        profile.household_profile?.demographics?.total_household_members || 0;

    const riskScore = profile.risk_index?.overall_woreda_risk_score ||
        profile.hierarchy_summary?.dr_risk_score || 0;

    const levelConfig: Record<string, { gradient: string; lightBg: string; border: string; accent: string; icon: React.ElementType }> = {
        city: { gradient: 'from-brand-500 to-brand-600', lightBg: 'bg-brand-50/50', border: 'border-brand-100', accent: 'text-brand-600', icon: Database },
        subcity: { gradient: 'from-accent-500 to-accent-600', lightBg: 'bg-accent-50/50', border: 'border-accent-100', accent: 'text-accent-600', icon: Layers },
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
            className="bg-white rounded-3xl border border-slate-100/80 shadow-md hover:shadow-2xl hover:border-brand-100/80 transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[380px]"
        >
            {/* Top Color Accent Strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />

            {profile.hierarchy_summary?.rank_in_parent ? (
                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 z-10">
                    <Sparkles size={10} className="text-brand-400 animate-pulse" />
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
                        <h3 className="text-lg font-black text-slate-900 truncate tracking-tight leading-tight group-hover:text-brand-600 transition-colors">
                            {getProfileTitle(profile)}
                        </h3>
                        <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                            {getProfileSubtitle(profile)}
                        </p>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100/60 hover:bg-white hover:border-brand-50 hover:shadow-sm transition-all duration-200">
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
                        className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-600 hover:bg-brand-50/60 transition-all border border-transparent hover:border-brand-100 flex items-center justify-center gap-1.5"
                    >
                        <Eye size={11} />
                        Details
                    </button>
                    {onDrillDown ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDrillDown(); }}
                            className={`flex-1 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/10 flex items-center justify-center gap-1.5`}
                        >
                            {fallbackDrillDownLabel}
                            <ArrowRight size={11} />
                        </button>
                    ) : null}
                    {level === 'woreda' && onAssess && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAssess(); }}
                            className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100/80 hover:border-amber-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            title="Take Woreda Assessment"
                        >
                            <FileText size={11} />
                            Assess
                        </button>
                    )}
                    {level === 'household' && (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {onEdit ? (
                                <button onClick={onEdit} className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all border border-transparent hover:border-brand-100 flex items-center justify-center">
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
export default ProfileCard;
