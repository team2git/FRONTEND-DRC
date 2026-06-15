import React from 'react';
import { motion } from 'framer-motion';
import { Key, ShieldCheck, Database, Layout } from 'lucide-react';

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

interface Permission {
    id: string;
    resource: string;
    action: string;
}

export const PermissionStats: React.FC<{ permissions: Permission[] }> = ({ permissions }) => {
    const totalPermissions = permissions.length;
    const uniqueResources = new Set(permissions.map(p => p.resource)).size;
    const readActions = permissions.filter(p => p.action.toLowerCase().includes('read') || p.action.toLowerCase().includes('view')).length;
    const writeActions = totalPermissions - readActions;

    const stats = [
        {
            title: 'Total Permissions',
            value: totalPermissions,
            icon: <Key size={24} />,
            color: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
            description: 'Defined actions'
        },
        {
            title: 'Protected Resources',
            value: uniqueResources,
            icon: <Database size={24} />,
            color: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
            description: 'System tables'
        },
        {
            title: 'Data Access',
            value: readActions,
            icon: <Layout size={24} />,
            color: 'from-purple-500 to-indigo-600 shadow-purple-500/20',
            description: 'Read/View'
        },
        {
            title: 'Data Control',
            value: writeActions,
            icon: <ShieldCheck size={24} />,
            color: 'from-amber-500 to-orange-600 shadow-amber-500/20',
            description: 'Modify/Admin'
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
