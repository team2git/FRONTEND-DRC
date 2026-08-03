import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Database, Sparkles, Activity, TrendingUp, Calculator, Info } from 'lucide-react';
import { type WoredaProfile as WProfile } from '../../../api/woredaProfileService';

export const HierarchySummaryView: React.FC<{ profile: WProfile }> = ({ profile }) => {
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
                    { label: 'Aggregation Level', value: (summary.aggregation_level || 'household').toUpperCase(), icon: Layers, color: 'text-brand-600', bg: 'bg-brand-50' },
                    { label: 'Source Items', value: summary.source_profiles, icon: Database, color: 'text-accent-600', bg: 'bg-accent-50' },
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
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(20,63,132,0.4),_transparent_40%)]" />

                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Calculator className="text-brand-400" />
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
                            { label: 'Vulnerability Index (V)', value: summary.vulnerability_score || 0, formula: 'Weighted average of social & physical indicators', desc: 'Aggregates household wall material, income levels, and presence of vulnerable groups.', color: 'from-brand-500 to-accent-500' },
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
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 border border-brand-500/30">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Composite Disaster Risk Score</p>
                            <p className="text-4xl font-black text-white tracking-tighter">DR {summary.dr_risk_score || 0}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/10 max-w-sm">
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info size={12} /> Aggregation Logic
                        </p>
                        <p className="text-xs text-slate-300 font-medium">This score rolls up from {summary.source_profiles} individual {summary.aggregation_level === 'block' ? 'households' : 'areas'}. Rank compared against all other units at the same level in the hierarchy.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HierarchySummaryView;
