import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import api from '../../api/axios';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePortalContent } from "../../hooks/usePortalContent";
import { resolvePortalAssetUrl } from "../../utils/resolvePortalAssetUrl";

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch portal configuration for dynamic branding
    const { portalContent } = usePortalContent();
    const logoUrl = resolvePortalAssetUrl(portalContent?.branding?.logoUrl) || "/images/logo/logo.png";
    const portalName = portalContent?.branding?.portalName || "IDRMIS";

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    // Basic password strength logic for UI display
    const getPasswordStrength = () => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const strength = getPasswordStrength();
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset', { token, newPassword: password });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !error) return null;

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
                            Create a secure new password for your {portalName} account. Choose a strong mix of letters, numbers, and symbols.
                        </p>
                        <div className="flex items-center justify-center space-x-6 text-sm font-medium text-slate-300">
                            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-[#C8102E]" /> Password Safety</span>
                            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2 text-[#C8102E]" /> Enhanced Privacy</span>
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
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h1>
                        <p className="text-slate-500 dark:text-slate-400">Enter your secure new password below</p>
                    </div>

                    {success ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center"
                        >
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 dark:bg-green-500/10 mb-6">
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Password Reset Successful</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Your password has been updated. You will be redirected to the login page shortly.
                            </p>
                            <Link 
                                to="/login" 
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#C8102E] hover:bg-[#a00d24] transition-all shadow-md"
                            >
                                Go to Login Now
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 flex items-start p-4 text-sm text-[#C8102E] bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/20"
                                >
                                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={!token}
                                            className="block w-full pl-10 pr-10 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent dark:text-white transition-all shadow-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {/* Password Strength Indicator */}
                                    {password.length > 0 && (
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="flex-1 flex space-x-1">
                                                {[1, 2, 3, 4].map((level) => (
                                                    <div 
                                                        key={level} 
                                                        className={`h-1.5 w-full rounded-full transition-colors duration-300 ${strength >= level ? strengthColors[strength - 1] : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
                                                {strength > 0 ? strengthLabels[strength - 1] : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={!token}
                                            className="block w-full pl-10 pr-10 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent dark:text-white transition-all shadow-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className={`relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#C8102E]/20 text-sm font-semibold text-white bg-[#C8102E] hover:bg-[#a00d24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] transition-all duration-200 overflow-hidden ${loading || !token ? 'opacity-90 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Resetting...
                                        </div>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
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

export default ResetPassword;
