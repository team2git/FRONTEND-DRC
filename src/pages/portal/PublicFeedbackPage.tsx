import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '@/api/axios';
import FormRenderer from '@/components/TemplateEngine/FormRenderer/FormRenderer';
import { toast } from 'react-toastify';
import {
    CheckCircle2,
    Sparkles, Send, ShieldCheck, HelpCircle,
    UserPlus, Heart, Zap, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageMeta from '@/components/common/PageMeta';
import RichTextDisplay from '@/components/common/RichTextDisplay';
import { stripRichTextHtml } from '@/components/common/richText';
import Header from './components/Header';
import Footer from './components/Footer';
import ServiceExitButton from './components/ServiceExitButton';
import { usePortalContent } from '@/hooks/usePortalContent';
import { resolvePortalAssetUrl } from '@/utils/resolvePortalAssetUrl';

const PublicFeedbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [template, setTemplate] = useState<any>(null);
    const { portalContent, loading: portalLoading } = usePortalContent();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const sectionsVisibility = portalContent?.sectionsVisibility;
    const showHeader = sectionsVisibility?.header !== false;
    const showFooter = sectionsVisibility?.footer !== false;
    const showContact = sectionsVisibility?.contact !== false;
    const showFeedbackPage = sectionsVisibility?.feedback !== false;

    useEffect(() => {
        const findFeedbackTemplate = async () => {
            try {
                setLoading(true);
                if (!portalContent && portalLoading) return;

                const templateSearch =
                    portalContent?.pages?.feedback?.templateSearch || 'Portal Feedback';

                const response = await api.get(`/templates?status=Published&search=${encodeURIComponent(templateSearch)}`);

                if (response.data && response.data.length > 0) {
                    setTemplate(response.data[0]);
                } else {
                    setTemplate(null);
                }
            } catch (error: any) {
                console.error("Error finding feedback template:", error);
            } finally {
                setLoading(false);
            }
        };

        findFeedbackTemplate();
    }, [portalContent, portalLoading]);

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            const payload = {
                templateId: template._id,
                templateVersion: template.version,
                moduleContextId: template._id,
                moduleContextType: 'Feedback',
                answers: data,
                respondentMetadata: {
                    fullName: "Portal User",
                    submittedAt: new Date().toISOString(),
                    source: "Public Portal"
                }
            };

            await api.post('/responses', payload);
            toast.success('Thank you for your feedback!');
            setSubmitted(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="portal-theme min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-600 w-6 h-6 animate-pulse" />
                </div>
                <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Dynamic Portal...</p>
            </div>
        );
    }

    if (!showFeedbackPage) {
        return (
            <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit">
                <PageMeta title="Feedback | IDRMIS Portal" description="Feedback is currently unavailable" />
                {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
                <main className="pt-28 px-6 pb-24">
                    <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-rose-500">
                            <HelpCircle size={44} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-3">Feedback is turned off</h1>
                        <p className="text-slate-500 font-medium mb-8">
                            This section is currently hidden in site settings.
                        </p>
                        <button
                            onClick={() => navigate("/portal")}
                            className="px-10 py-4 bg-accent-600 text-white rounded-2xl font-black hover:bg-accent-700 transition-all"
                        >
                            Back to portal
                        </button>
                    </div>
                </main>
                {showFooter ? (
                    <Footer
                        branding={portalContent?.branding}
                        contact={portalContent?.contact}
                        footer={portalContent?.footer}
                        showContact={showContact}
                    />
                ) : null}
            </div>
        );
    }

    return (
        <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
            <PageMeta
                title={`${portalContent?.pages?.feedback?.title || "Feedback"} | IDRMIS Portal`}
                description={stripRichTextHtml(portalContent?.pages?.feedback?.subtitle || "Give us your feedback")}
            />

            {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

            {/* --- HERO SECTION --- */}
            <div className="relative pt-24 pb-28 overflow-hidden bg-slate-950">
                {/* Background Image with Gradient Overlay (Same as Home Page) */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-[10s] scale-105"
                    style={{
                        backgroundImage: `url('${resolvePortalAssetUrl(portalContent?.pages?.feedback?.heroImage) || "/assets/images/hero1.png"}')`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                </div>

                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10 transition-all duration-700">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-3 px-6 py-2 bg-white shadow-xl shadow-brand-100/50 rounded-2xl border border-brand-50"
                            >
                                <div className="w-2 h-2 bg-accent-600 rounded-full animate-ping" />
                                <span className="text-brand-600 text-[11px] font-black uppercase tracking-[0.25em]">Community First</span>
                            </motion.div>
                            <ServiceExitButton
                                onClick={() => navigate("/portal/services")}
                                className="border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
                            />

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight"
                            >
                                Your Voice, Our <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-400 to-accent-400">Innovation.</span>
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <RichTextDisplay
                                    html={portalContent?.pages?.feedback?.subtitle}
                                    fallback="Help us perfect the IDRMIS ecosystem. Your feedback directly influences the tools we build for national resilience."
                                    className="text-lg text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium [&_a]:text-brand-300 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4"
                            >
                                <div className="flex flex-col items-center lg:items-start">
                                    <span className="text-xl font-black text-white">2min</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Time</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/20 hidden sm:block" />
                                <div className="flex flex-col items-center lg:items-start">
                                    <span className="text-xl font-black text-white">Direct</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Admin Access</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/20 hidden sm:block" />
                                <div className="flex flex-col items-center lg:items-start">
                                    <span className="text-xl font-black text-white">Secure</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Encrypted</span>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, rotate: 3, scale: 0.95 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="hidden lg:block relative group"
                        >
                            <div className="absolute inset-0 bg-accent-600 rounded-[32px] rotate-3 blur-2xl opacity-10 group-hover:rotate-1 transition-transform duration-700" />
                            <div className="relative w-[380px] aspect-[1.4] rounded-[32px] overflow-hidden border-4 border-white shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]">
                                <img
                                    src="/src/assets/images/feedback_banner.png"
                                    alt="Innovation UI"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000"; }}
                                />
                            </div>

                            {/* Floating glass card */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-8 -right-8 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 max-w-[200px]"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-accent-500 text-white rounded-xl flex items-center justify-center">
                                        <Zap size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 leading-tight">Fast<br />Response</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-500 w-[85%]" />
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* --- CORE FORM SECTION (HOVERING ABOVE) --- */}
            <main className="relative z-20 pb-24 px-6 -mt-16">
                <div className="max-w-4xl mx-auto">
                    {!template ? (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[48px] p-20 text-center shadow-[0_40px_100px_-30px_rgba(15,23,42,0.15)] border border-slate-100"
                        >
                            <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-rose-500 rotate-12">
                                <HelpCircle size={48} />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Portal Standby</h2>
                            <p className="text-slate-500 mb-12 text-xl max-w-md mx-auto leading-relaxed font-medium">
                                The Feedback Labs are currently undergoing maintenance. Please return shortly.
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-12 py-5 bg-accent-600 text-white rounded-2xl font-bold hover:bg-accent-700 transition-all shadow-2xl hover:shadow-accent-500/40 transform hover:-translate-y-1"
                            >
                                Return to Portal
                            </button>
                        </motion.div>
                    ) : submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[56px] p-24 text-center shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] border border-accent-50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-500 via-accent-400 to-accent-400" />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                                className="w-32 h-32 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-10 text-accent-500"
                            >
                                <CheckCircle2 size={72} />
                            </motion.div>
                            <h2 className="text-5xl font-black text-slate-950 mb-6 tracking-tight">Mission Accomplished.</h2>
                            <p className="text-slate-500 mb-14 text-2xl font-medium leading-relaxed max-w-xl mx-auto">
                                Thank you for your contribution. Your strategy-shaping feedback has been safely received.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-14 py-5 bg-accent-600 text-white rounded-2xl font-black hover:bg-slate-950 transition-all shadow-xl shadow-accent-200"
                                >
                                    Finish & Exit
                                </button>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="px-14 py-5 bg-white text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all border-2 border-slate-100"
                                >
                                    Send More
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, type: "spring", damping: 20 }}
                            className="bg-white rounded-[64px] shadow-[0_80px_160px_-40px_rgba(15,23,42,0.2)] border border-white/80 overflow-hidden"
                        >
                            {/* Form Top Banner */}
                            <div className="relative p-12 lg:p-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 blur-[120px] rounded-full pointer-events-none" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3 text-brand-400 font-black text-[10px] uppercase tracking-[0.3em]">
                                        <Sparkles size={14} className="animate-spin-slow" />
                                        Input Module Active
                                    </div>
                                    <h3 className="text-5xl font-black tracking-tight">{template.name}</h3>
                                    <p className="text-slate-400 text-lg max-w-2xl font-medium">
                                        {template.description || "Every field you fill contributes to a safer, more resilient Ethiopia."}
                                    </p>
                                </div>
                            </div>

                            {/* Form Area */}
                            <div className="p-10 lg:p-20 bg-[#F6F8FF]/50">
                                <div className="bg-white rounded-[40px] p-8 lg:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-white relative">
                                    <FormRenderer
                                        template={template}
                                        onSubmit={onSubmit}
                                    />

                                    {/* Small aesthetic corner accent */}
                                    <div className="absolute top-0 left-0 w-2 h-20 bg-accent-600 rounded-full -translate-x-full mt-20 opacity-0 lg:opacity-100" />
                                </div>

                                <div className="mt-16 pt-10 border-t border-slate-200/50 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest">
                                            <ShieldCheck size={16} className="text-brand-600" />
                                            Privacy
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium">Your data is stored using AES-256 standard encryption for complete anonymity.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest">
                                            <Globe size={16} className="text-accent-500" />
                                            Impact
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium">Responses are reviewed by the National Innovation Committee every 24 hours.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest">
                                            <Heart size={16} className="text-rose-500" />
                                            Openness
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium">We appreciate every honest critique. It's how we build better systems for all.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* --- EXTRA VALUE SECTION --- */}
            <div className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Frequently Asked <br />Questions?</h4>
                            <div className="space-y-4">
                                {[{
                                    q: "Who reads my feedback?",
                                    a: "Every submission goes directly to our Product Design and Community Engagement teams."
                                }, {
                                    q: "Is it anonymous?",
                                    a: "Unless you choose to provide contact details, all feedback is recorded as anonymous metadata."
                                }].map((item, i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors uppercase text-[10px] tracking-widest mb-1">{item.q}</p>
                                        <p className="text-sm text-slate-500">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-brand-50 rounded-[40px] p-10 space-y-6 border border-brand-100/50 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-600/5 rounded-full blur-3xl" />
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-brand-600">
                                    <UserPlus size={24} />
                                </div>
                                <h5 className="font-black text-slate-900">Want to join the test panel?</h5>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                We are looking for early adopters to test and break our newest disaster management modules before they go live nationwide.
                            </p>
                            <button className="w-full py-4 bg-white border border-accent-200 text-accent-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-600 hover:text-white transition-all shadow-sm">
                                Register as Tester
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showFooter ? (
                <Footer
                    branding={portalContent?.branding}
                    contact={portalContent?.contact}
                    footer={portalContent?.footer}
                    showContact={showContact}
                />
            ) : null}

            {/* --- SUBMISSION OVERLAY --- */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center flex-col"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 border-2 border-white/5 border-t-brand-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-3xl animate-bounce">
                                    <Send size={40} />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-white mt-12 tracking-tight">Syncing Data Gateway</h2>
                        <p className="text-brand-400 font-black text-[10px] uppercase tracking-[0.5em] mt-4 animate-pulse">Establishing Secure Socket Link</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}} />
        </div>
    );
};

export default PublicFeedbackPage;

