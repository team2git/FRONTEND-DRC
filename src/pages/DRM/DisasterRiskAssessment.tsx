import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageMeta from "../../components/common/PageMeta";
import api from '@/api/axios';
import { 
    ShieldCheck, Activity, Users, HelpCircle,
    ArrowRight, ClipboardCheck, Database,
    Landmark, HeartHandshake, Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DisasterRiskAssessment() {
    const navigate = useNavigate();
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get('/templates');
                const matched = response.data.find((t: any) => t.name === 'Household Assessment Questionnaire');
                if (matched) {
                    setTemplate(matched);
                }
            } catch (error) {
                console.error("Failed to load Household template:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, []);

    const modules = [
        {
            title: "Household identity & location",
            icon: Landmark,
            color: "from-teal-400 to-emerald-500",
            bg: "bg-emerald-50/40 border-emerald-100/50",
            fields: [
                { name: "Woreda, sub-city, kebele, block, house number", type: "text / number" },
                { name: "GPS latitude & longitude", type: "decimal coordinates" },
                { name: "Enumerator name & date", type: "text / date autofill" },
                { name: "Respondent consent status", type: "yes/no check" }
            ]
        },
        {
            title: "Demographics",
            icon: Users,
            color: "from-blue-400 to-indigo-500",
            bg: "bg-blue-50/40 border-blue-100/50",
            fields: [
                { name: "Total household members", type: "headcount" },
                { name: "Male / female members", type: "gender counts" },
                { name: "Children (0-17), youth (18-29), elderly (60+)", type: "cohort counts" },
                { name: "Female-headed household status", type: "yes/no check" },
                { name: "IDP status & reason", type: "yes/no + category" },
                { name: "Education level & employment status", type: "demographic categories" }
            ]
        },
        {
            title: "Livelihood & economy",
            icon: Activity,
            color: "from-amber-400 to-orange-500",
            bg: "bg-amber-50/40 border-amber-100/50",
            fields: [
                { name: "Primary & secondary livelihood type", type: "economic category" },
                { name: "Household income level", type: "income bracket" },
                { name: "Small business ownership & type", type: "yes/no + description" },
                { name: "Daily labour dependency & disruption", type: "vulnerability index" },
                { name: "Insurance coverage & credit access", type: "financial access level" }
            ]
        },
        {
            title: "Housing & physical conditions",
            icon: ShieldCheck,
            color: "from-purple-400 to-pink-500",
            bg: "bg-purple-50/40 border-purple-100/50",
            fields: [
                { name: "Wall & roof material type", type: "structural durability" },
                { name: "Building age (years) & compliance", type: "code safety check" },
                { name: "Informal / squatter settlement", type: "yes/no check" },
                { name: "Number of sleeping rooms & hazards", type: "density count" },
                { name: "Drainage, water, electricity access", type: "basic services quality" }
            ]
        },
        {
            title: "Preparedness",
            icon: HelpCircle,
            color: "from-cyan-400 to-blue-500",
            bg: "bg-cyan-50/40 border-cyan-100/50",
            fields: [
                { name: "Emergency shelter & evacuation route knowledge", type: "yes/no check" },
                { name: "DRM training received & type", type: "capacity check" },
                { name: "Family emergency plan & stockpiles", type: "readiness index" },
                { name: "Early warning channel access", type: "media type" },
                { name: "Community awareness self-rating", type: "score 1-5" }
            ]
        },
        {
            title: "Recovery capacity",
            icon: HeartHandshake,
            color: "from-rose-400 to-red-500",
            bg: "bg-rose-50/40 border-rose-100/50",
            fields: [
                { name: "Past disaster experience & recovery duration", type: "resilience timeline" },
                { name: "Self-help & savings group membership", type: "yes/no check" },
                { name: "Government safety net access", type: "vulnerability status" },
                { name: "Income diversification (2+ sources)", type: "economic buffer check" },
                { name: "Overall household resilience score", type: "assessment 1-5" }
            ]
        }
    ];

    return (
        <>
            <PageMeta
                title="Disaster Risk Assessment | IDRMIS"
                description="Perform advanced household assessments to evaluate vulnerability and resilience."
            />
            
            <div className="max-w-7xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
                {/* Hero Section */}
                <div className="relative rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 text-white shadow-2xl overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />
                    
                    <div className="relative max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                            <Sparkles size={12} />
                            National Protocol Standard
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                            Household Assessment Protocol
                        </h1>
                        <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
                            Evaluate raw individual data per household dwelling and its occupants. 
                            Aggregated results roll up automatically from block coordinates to national strategic vulnerability index dashboards.
                        </p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                            {loading ? (
                                <button className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 rounded-2xl font-bold border border-white/10 transition-all outline-none" disabled>
                                    <Loader2 className="animate-spin text-emerald-400" size={20} />
                                    Loading Assessment Template...
                                </button>
                            ) : template ? (
                                <button 
                                    onClick={() => window.open(`/responses/${template._id}`, '_blank')}
                                    className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all outline-none"
                                >
                                    <ClipboardCheck size={20} />
                                    Launch Assessment Survey
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 bg-red-500/10 text-red-400 px-6 py-4 rounded-2xl border border-red-500/25">
                                    <AlertCircle size={20} />
                                    <span className="text-sm font-bold">Standard template not active. Please check the Template Library.</span>
                                </div>
                            )}

                            <button 
                                onClick={() => navigate('/woreda-profile')}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold border border-white/10 transition-all text-sm outline-none"
                            >
                                <Database size={18} />
                                View Risk Database
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Modules Section */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Assessment Modules & Spec Fields
                        </h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                            The standard protocol captures 6 core categories to build spatial risk indices (H·E·V / C).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map((mod, index) => {
                            const IconComp = mod.icon;
                            return (
                                <motion.div 
                                    key={index}
                                    whileHover={{ y: -5 }}
                                    className={`bg-white dark:bg-gray-900 border ${mod.bg} rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-lg`}>
                                                <IconComp size={22} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Module {index + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                                {mod.title}
                                            </h3>
                                            <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700 mt-2" />
                                        </div>

                                        <ul className="space-y-3 pt-2">
                                            {mod.fields.map((f, fIdx) => (
                                                <li key={fIdx} className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                                                        {f.name}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">
                                                        {f.type}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-medium">Capture Method</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">Enumerator Interview</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Workflow Summary / Tutorial */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-200/50 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                            1
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Deploy Survey</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                            Enumerators launch the digital interview questionnaire, perform on-site GPS verification, capture consent and survey all raw household indicators.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black">
                            2
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Sync & Validate</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                            Once responses are uploaded, navigators open the sync dashboard to map responses directly into Woreda profiles using the automated 1-to-1 template mapping.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black">
                            3
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Rollup Analytics</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                            The spatial engine immediately rolls up hazard intensity, exposure levels, vulnerability averages and response capacity to generate overall strategic indexes.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
