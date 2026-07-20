import React from 'react';
import { motion } from 'framer-motion';

export const RadialProgress: React.FC<{
    value: number;
    max: number;
    label: string;
    sublabel: string;
    color: string;
    size?: number;
    dark?: boolean;
}> = ({ value, max, label, sublabel, color, size = 100, dark = false }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 group hover:-translate-y-1 w-full ${
            dark 
                ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 shadow-md' 
                : 'bg-white border-slate-100 hover:bg-white hover:border-indigo-100 shadow-sm'
        }`}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className={dark ? "stroke-slate-800/80" : "stroke-slate-100"}
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-800'}`}>
                        {value ? value.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{sublabel}</span>
                </div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider mt-3 text-center ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
        </div>
    );
};
export default RadialProgress;
