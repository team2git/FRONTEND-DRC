import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    CheckCircle2, 
    AlertCircle, 
    ArrowLeft, 
    RefreshCw, 
    ShieldCheck, 
    Sparkles, 
    KeyRound, 
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Captcha States
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch portal configuration for dynamic branding
    const { portalContent } = usePortalContent();
    const logoUrl = resolvePortalAssetUrl(portalContent?.branding?.logoUrl) || "/images/logo/logo.png";
    const portalName = portalContent?.branding?.portalName || "IDRMIS";

    const handleGoogleSignIn = () => {
        setIsGoogleModalOpen(true);
    };

    // Generate Captcha Code
    const generateCaptcha = () => {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(code);
        setCaptchaInput('');
    };

    // Draw Captcha on Canvas
    useEffect(() => {
        if (canvasRef.current && captchaCode) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const isDark = document.documentElement.classList.contains('dark');
                ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Noise lines
                for (let i = 0; i < 6; i++) {
                    ctx.strokeStyle = `rgba(225, 29, 72, ${Math.random() * 0.4 + 0.15})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
                    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
                    ctx.stroke();
                }
                
                // Noise dots
                for (let i = 0; i < 35; i++) {
                    ctx.fillStyle = `rgba(30, 58, 138, ${Math.random() * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw captcha text
                ctx.font = 'bold 22px monospace';
                ctx.textBaseline = 'middle';
                
                for (let i = 0; i < captchaCode.length; i++) {
                    const char = captchaCode[i];
                    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
                    
                    ctx.save();
                    const x = 12 + i * 20;
                    const y = canvas.height / 2 + (Math.random() * 8 - 4);
                    const angle = (Math.random() * 30 - 15) * Math.PI / 180;
                    
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.fillText(char, 0, 0);
                    ctx.restore();
                }
            }
        }
    }, [captchaCode]);

    // Generate initial captcha and check remember me
    useEffect(() => {
        generateCaptcha();
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

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
    const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // CAPTCHA verification
        if (captchaInput.toUpperCase() !== captchaCode) {
            setError('Security code verification failed. Please try again.');
            generateCaptcha();
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            login(token, user);
            navigate('/dashboard'); 
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.response) {
                if (err.response.status === 403) {
                    setError('Account not verified. Please verify your email.');
                } else {
                    setError(err.response?.data?.message || `Login failed: Server error (${err.response.status})`);
                }
            } else if (err.request) {
                setError('Unable to connect to the server. Please ensure the backend is running.');
            } else {
                setError('Login failed: ' + (err.message || 'Unknown error'));
            }
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-red-500 selection:text-white overflow-hidden relative">
            
            {/* Left Side Visual Hero Banner (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#070d1e] overflow-hidden items-center justify-center p-12">
                
                {/* Layered Animated Background Mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-[#0b132b] to-[#1c080d] opacity-95" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-red-950/40 via-transparent to-indigo-950/40" />
                
                {/* Subtle Geometric Grid overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

                {/* Animated Floating Light Orbs */}
                <motion.div 
                    animate={{ y: [0, -25, 0], scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }} 
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/6 left-1/5 w-96 h-96 bg-gradient-to-tr from-red-600/30 to-rose-600/20 rounded-full mix-blend-screen filter blur-[100px]"
                />
                <motion.div 
                    animate={{ y: [0, 35, 0], scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }} 
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/5 right-1/6 w-[28rem] h-[28rem] bg-gradient-to-bl from-blue-700/25 to-indigo-800/20 rounded-full mix-blend-screen filter blur-[110px]"
                />

                {/* Hero Card Container */}
                <div className="relative z-10 max-w-lg w-full text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="flex flex-col items-center"
                    >
                        {/* Dynamic Logo with Glowing Backdrop */}
                        <div className="relative mb-8 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 animate-pulse" />
                            <div className="relative w-32 h-32 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-full p-4 shadow-2xl flex items-center justify-center ring-4 ring-white/20 dark:ring-slate-800/80">
                                <img src={logoUrl} alt={`${portalName} Logo`} className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                        </div>

                        {/* Title & Tagline */}
                        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 dark:bg-slate-800/60 border border-white/15 dark:border-slate-700/50 backdrop-blur-md mb-4 text-xs font-semibold tracking-wider text-red-300 uppercase">
                            <Sparkles className="w-3.5 h-3.5 text-red-400" />
                            <span>Enterprise Security Portal</span>
                        </div>

                        <h2 className="text-4xl xl:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                            {portalName}
                        </h2>

                        <p className="text-base xl:text-lg text-slate-300 mb-10 leading-relaxed max-w-md font-normal">
                            Access your disaster risk management portal securely with real-time encrypted data synchronization.
                        </p>

                        {/* Feature Badges Grid */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-md text-left">
                            <div className="flex items-center p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 mr-3">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-white">Encrypted Data</h4>
                                    <p className="text-[11px] text-slate-400">256-bit AES Shield</p>
                                </div>
                            </div>

                            <div className="flex items-center p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 mr-3">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-white">Compliance</h4>
                                    <p className="text-[11px] text-slate-400">WCAG & ISO 27001</p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>

            {/* Right Side Form Section */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 relative overflow-y-auto z-10">
                
                {/* Mobile Ambient Glow */}
                <div className="lg:hidden absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-600/15 rounded-full filter blur-3xl opacity-70 pointer-events-none" />
                
                {/* Header Logo Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-white/10 p-1.5 backdrop-blur-md border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                            <img src={logoUrl} alt={`${portalName} Logo`} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{portalName}</span>
                    </div>

                    <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 bg-white/50 dark:bg-slate-900/50">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Home
                    </Link>
                </div>

                {/* Form Card Container */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="w-full max-w-md mx-auto my-auto"
                >
                    <div className="mb-8">
                        <div className="flex items-center space-x-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Authentication</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Welcome back</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Enter your operational credentials to continue</p>
                    </div>

                    {/* Error Alert Box */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="mb-6 flex items-start p-4 text-xs sm:text-sm text-red-700 dark:text-red-300 bg-red-50/90 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-sm backdrop-blur-md"
                            >
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                                <span className="font-medium leading-snug">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Auth Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:focus:border-red-500 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium transition-all shadow-sm"
                                    placeholder="name@organization.gov.et"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full pl-11 pr-11 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:focus:border-red-500 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium transition-all shadow-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Password Strength Meter */}
                            {password.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-1.5 space-y-1"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 flex space-x-1.5">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div 
                                                    key={level} 
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                        strength >= level ? strengthColors[strength - 1] : 'bg-slate-200 dark:bg-slate-800'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 min-w-[45px] text-right">
                                            {strength > 0 ? strengthLabels[strength - 1] : ''}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Security CAPTCHA Card */}
                        <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
                                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-red-500" />
                                    Human Verification
                                </label>
                                <span className="text-[10px] text-slate-400 font-medium">Click code to refresh</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                {/* Captcha Display Canvas */}
                                <div 
                                    onClick={generateCaptcha}
                                    className="relative border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner h-12 w-32 flex-shrink-0 bg-slate-200 dark:bg-slate-900 cursor-pointer group"
                                    title="Click to generate new code"
                                >
                                    <canvas 
                                        ref={canvasRef} 
                                        width={128} 
                                        height={48} 
                                        className="w-full h-full block" 
                                        data-captcha={captchaCode}
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Refresh Button */}
                                <button
                                    type="button"
                                    onClick={generateCaptcha}
                                    className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm active:scale-95"
                                    title="Refresh verification code"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>

                                {/* Verification Input */}
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={captchaInput}
                                        onChange={(e) => setCaptchaInput(e.target.value)}
                                        required
                                        className="block w-full px-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-center uppercase tracking-widest font-mono text-base font-bold shadow-sm"
                                        placeholder="CODE"
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700 cursor-pointer accent-red-600 transition-colors"
                                />
                                <span className="ml-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                    Remember my email
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-4 px-4 rounded-2xl shadow-xl shadow-red-600/25 text-sm font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-950 transition-all duration-300 overflow-hidden ${
                                loading ? 'opacity-90 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-red-600/35 active:translate-y-0'
                            }`}
                        >
                            {/* Shimmer line effect on hover */}
                            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                            
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Verifying Credentials...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <span>Sign In to Dashboard</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Social Auth Divider */}
                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                            <span className="px-4 bg-slate-50 dark:bg-slate-950 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Logins */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <button 
                            type="button" 
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="flex justify-center items-center py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-sm hover:-translate-y-0.5 group cursor-pointer"
                            title="Sign in with Google"
                        >
                            <span className="sr-only">Sign in with Google</span>
                            <GoogleIcon />
                        </button>
                        <button type="button" className="flex justify-center items-center py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-sm opacity-60 cursor-not-allowed" title="Microsoft Login (Coming Soon)">
                            <span className="sr-only">Sign in with Microsoft</span>
                            <MicrosoftIcon />
                        </button>
                        <button type="button" className="flex justify-center items-center py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-sm opacity-60 cursor-not-allowed" title="LinkedIn Login (Coming Soon)">
                            <span className="sr-only">Sign in with LinkedIn</span>
                            <LinkedInIcon />
                        </button>
                    </div>

                    {/* Registration Link */}
                    <div className="mt-8 text-center text-sm font-medium">
                        <p className="text-slate-600 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors ml-1">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Footer Bar */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <p>© {new Date().getFullYear()} {portalName}. All rights reserved.</p>
                    <div className="flex space-x-5 mt-3 sm:mt-0 font-medium">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Help Desk</a>
                    </div>
                </div>
            </div>

            {/* Google Authentication Modal */}
            <GoogleAuthModal
                isOpen={isGoogleModalOpen}
                onClose={() => setIsGoogleModalOpen(false)}
                mode="signin"
                defaultEmail={email}
            />
        </div>
    );
};

export default Login;

