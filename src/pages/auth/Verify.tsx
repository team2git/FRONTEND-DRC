import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import api from '../../api/axios';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePortalContent } from "../../hooks/usePortalContent";
import { resolvePortalAssetUrl } from "../../utils/resolvePortalAssetUrl";

const Verify: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [code, setCode] = useState('');

    // Try to get email from navigation state or localStorage, otherwise empty
    const [email, setEmail] = useState<string>(location.state?.email || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch portal configuration for dynamic branding
    const { portalContent } = usePortalContent();
    const logoUrl = resolvePortalAssetUrl(portalContent?.branding?.logoUrl) || "/images/logo/logo.png";
    const portalName = portalContent?.branding?.portalName || "IDRMIS";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.post('/auth/verify', { email, code });
            setSuccess('Account verified successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Please enter your email to resend code');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/resend', { email });
            setSuccess('Verification code resent! Please check your email.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden">
            {/* Left Side - Visual/Branding (Deep Red and Navy Blue theme) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a1128] overflow-hidden items-center justify-center">
                {/* Animated gradient background and shapes */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1128] via-[#111827] to-[#800000] opacity-90" />
                
                {/* Floating Red Accents */}
                <motion.div 
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C8102E] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"
                />
                {/* Floating Navy/Blue Accents */}
                <motion.div 
                    animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }} 
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1e3a8a] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"
                />
                
                <div className="relative z-10 p-12 text-white max-w-xl text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col items-center"
                    >
                        {/* Dynamic Logo from DB */}
                        <div className="w-32 h-32 bg-white rounded-full p-2 mb-8 shadow-2xl flex items-center justify-center shadow-black/50 ring-4 ring-white/10">
                            <img src={logoUrl} alt={`${portalName} Logo`} className="w-full h-full object-contain" />
                        </div>
                        
                        <h2 className="text-4xl font-bold mb-6 tracking-tight text-white">{portalName}</h2>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                            Verify your registration. We need to confirm your email address to active your profile on the secure {portalName} portal.
                        </p>
                        <div className="flex items-center justify-center space-x-6 text-sm font-medium text-slate-300">
                            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-[#C8102E]" /> Email Validation</span>
                            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-[#C8102E]" /> Secure Registration</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16 relative">
                {/* Mobile Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 -z-10" />
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#C8102E]/10 dark:bg-[#C8102E]/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-50 -z-10" />

                {/* Header Logo */}
                <div className="flex items-center space-x-3 mb-10">
                    <img src={logoUrl} alt={`${portalName} Logo`} className="w-10 h-10 object-contain" />
                    <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{portalName}</span>
                </div>

                {/* Main Form Container */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="mb-6">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-[#C8102E] hover:text-[#a00d24] dark:text-[#E31837] hover:underline mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Verify Your Account</h1>
                        <p className="text-slate-500 dark:text-slate-400">Enter the code sent to your email address</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start p-4 text-sm text-[#C8102E] bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/20"
                        >
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start p-4 text-sm text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-500/20"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent dark:text-white transition-all shadow-sm"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmation Code</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent dark:text-white transition-all shadow-sm text-center text-xl tracking-widest font-mono"
                                    placeholder="XXXXXX"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#C8102E]/20 text-sm font-semibold text-white bg-[#C8102E] hover:bg-[#a00d24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] transition-all duration-200 overflow-hidden ${loading ? 'opacity-90 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </div>
                            ) : (
                                'Verify Email'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">
                            Did not receive code?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={loading}
                                className="font-semibold text-[#C8102E] hover:text-[#a00d24] dark:text-[#E31837] hover:underline disabled:opacity-50 transition-colors"
                            >
                                Resend Code
                            </button>
                        </p>
                    </div>
                </motion.div>

                {/* Footer Links */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <p>© {new Date().getFullYear()} {portalName}. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Help Center</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify;
