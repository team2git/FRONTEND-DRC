import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, X, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';

interface GoogleAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'signup' | 'signin';
    defaultEmail?: string;
    defaultName?: string;
}

const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
    isOpen,
    onClose,
    mode = 'signup',
    defaultEmail = '',
    defaultName = ''
}) => {
    const [email, setEmail] = useState(defaultEmail);
    const [fullname, setFullname] = useState(defaultName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // Reset fields when opened
    React.useEffect(() => {
        if (isOpen) {
            setEmail(defaultEmail);
            setFullname(defaultName);
            setError('');
        }
    }, [isOpen, defaultEmail, defaultName]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid Google email address.');
            return;
        }

        setLoading(true);

        try {
            const userEmail = email.trim().toLowerCase();
            const response = await api.post('/auth/google', {
                email: userEmail,
                fullname: fullname.trim() || userEmail.split('@')[0]
            });

            if (response.data.requiresVerification) {
                onClose();
                navigate('/verify', { state: { email: userEmail } });
                return;
            }

            if (response.data.token && response.data.user) {
                const { token, user } = response.data;
                login(token, user);
                onClose();
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('Google Auth Error:', err);
            setError(err.response?.data?.message || 'Authentication with Google failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
                >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/20 rounded-full filter blur-2xl pointer-events-none" />
                    
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                            <GoogleIcon />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {mode === 'signup' ? 'Sign Up with Google' : 'Sign In with Google'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Fast, secure authentication with your Google email
                            </p>
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="mb-5 p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300">
                        <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span>Instant access — no manual password required</span>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Your Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullname}
                                        onChange={(e) => setFullname(e.target.value)}
                                        placeholder="Full Name"
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Google Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="yourname@gmail.com"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-75 cursor-pointer"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Connecting to Google...</span>
                                </div>
                            ) : (
                                <>
                                    <span>{mode === 'signup' ? 'Complete Sign Up' : 'Continue with Google'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GoogleAuthModal;
