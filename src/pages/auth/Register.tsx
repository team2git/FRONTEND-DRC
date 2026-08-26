import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../../api/axios';
import { Mail, CheckCircle2, AlertCircle, User, Phone, KeyRound, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePortalContent } from "../../hooks/usePortalContent";
import { resolvePortalAssetUrl } from "../../utils/resolvePortalAssetUrl";
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';

// Quick inline SVG components for social logins
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
);

const LinkedInIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077b5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
    const navigate = useNavigate();

    // Fetch portal configuration for dynamic branding
    const { portalContent } = usePortalContent();
    const logoUrl = resolvePortalAssetUrl(portalContent?.branding?.logoUrl) || "/images/logo/logo.png";
    const portalName = portalContent?.branding?.portalName || "IDRMIS";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload: any = {
                fullname: formData.fullname.trim(),
                email: formData.email.trim()
            };
            if (formData.phone && formData.phone.trim() !== '') {
                payload.phone = formData.phone.trim();
            }

            await api.post('/auth/register', payload);
            // Redirect to Verify page, passing email state for convenience
            navigate('/verify', { state: { email: formData.email } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        setIsGoogleModalOpen(true);
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
                    className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#e11d2d] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"
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
                            Create your account to access the {portalName} portal. Standard accounts require email verification for security and data integrity.
                        </p>
                        <div className="flex items-center justify-center space-x-6 text-sm font-medium text-slate-300">
                            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-[#e11d2d]" /> Simple Onboarding</span>
                            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-[#e11d2d]" /> Automated Credentials</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16 relative overflow-y-auto">
                {/* Mobile Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 -z-10" />
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#e11d2d]/10 dark:bg-[#e11d2d]/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-50 -z-10" />

                {/* Header Logo (Mobile mostly, visible on desktop too) */}
                <div className="flex items-center space-x-3 mb-8">
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
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 text-[#e11d2d] dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Quick Registration</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
                        <p className="text-slate-500 dark:text-slate-400">Join {portalName} today in seconds</p>
                    </div>

                    {/* Notice about password delivery */}
                    <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 backdrop-blur-md flex items-start space-x-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                            <span className="font-bold">Password-Free Sign Up:</span> No password is required now. After verifying your email, your default login password will be delivered directly to your inbox.
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start p-4 text-sm text-[#e11d2d] bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/20"
                        >
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    name="fullname"
                                    type="text"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#e11d2d] focus:border-transparent dark:text-white transition-all shadow-sm"
                                    placeholder="Your full name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#e11d2d] focus:border-transparent dark:text-white transition-all shadow-sm"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number (Optional)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#e11d2d] focus:border-transparent dark:text-white transition-all shadow-sm"
                                    placeholder="Optional phone number"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#e11d2d]/20 text-sm font-semibold text-white bg-[#e11d2d] hover:bg-[#bf1124] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e11d2d] transition-all duration-200 overflow-hidden ${loading ? 'opacity-90 cursor-not-allowed' : 'hover:-translate-y-0.5'} mt-4`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registering...
                                </div>
                            ) : (
                                'Create Account & Receive Code'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium">OR Sign Up With</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <button 
                            type="button" 
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            className="flex justify-center items-center py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:-translate-y-0.5 group cursor-pointer"
                            title="Register with Google"
                        >
                            <span className="sr-only">Sign up with Google</span>
                            <GoogleIcon />
                        </button>
                        <button type="button" className="flex justify-center items-center py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm opacity-60 cursor-not-allowed" title="Microsoft Login (Coming Soon)">
                            <span className="sr-only">Sign up with Microsoft</span>
                            <MicrosoftIcon />
                        </button>
                        <button type="button" className="flex justify-center items-center py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm opacity-60 cursor-not-allowed" title="LinkedIn Login (Coming Soon)">
                            <span className="sr-only">Sign up with LinkedIn</span>
                            <LinkedInIcon />
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-[#e11d2d] hover:text-[#bf1124] dark:text-[#e11d2d] hover:underline transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Footer Links */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <p>© {new Date().getFullYear()} {portalName}. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Help Center</a>
                    </div>
                </div>
            </div>

            {/* Google Authentication Modal */}
            <GoogleAuthModal
                isOpen={isGoogleModalOpen}
                onClose={() => setIsGoogleModalOpen(false)}
                mode="signup"
                defaultEmail={formData.email}
                defaultName={formData.fullname}
            />
        </div>
    );
};

export default Register;
