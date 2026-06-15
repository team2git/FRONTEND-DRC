import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserPlus, UserX } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, description }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl transition-all dark:border-white/10 dark:bg-white/5 dark:shadow-none"
    >

        <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-600 dark:text-white/50">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                    <span className="text-[10px] text-slate-500 dark:text-white/30 uppercase tracking-wider">{description}</span>
                </div>
            </div>
        </div>

        {/* Decorative Line */}
        <div className="mt-4 h-[2px] w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className={`h-full w-1/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent`}
            />
        </div>
    </motion.div>
);

export const UserStats: React.FC<{ users: any[] }> = ({ users }) => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const pending = users.filter(u => u.status === 'pending').length;
    const suspended = users.filter(u => u.status === 'suspended').length;

    const stats = [
        {
            title: 'Total Users',
            value: total,
            icon: <Users size={24} />,
            color: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
            description: 'System wide'
        },
        {
            title: 'Active Now',
            value: active,
            icon: <UserCheck size={24} />,
            color: 'from-green-500 to-emerald-600 shadow-green-500/20',
            description: 'Verified accounts'
        },
        {
            title: 'Pending',
            value: pending,
            icon: <UserPlus size={24} />,
            color: 'from-amber-500 to-orange-600 shadow-amber-500/20',
            description: 'Awaiting approval'
        },
        {
            title: 'Suspended',
            value: suspended,
            icon: <UserX size={24} />,
            color: 'from-red-500 to-rose-600 shadow-red-500/20',
            description: 'Restricted access'
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
            ))}
        </div>
    );
};
