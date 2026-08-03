import React from 'react';

export type StatusType = 'active' | 'pending' | 'submitted' | 'reviewed' | 'draft' | 'inactive' | 'rejected' | 'approved' | string;

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    pulse?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label,
    pulse,
    size = 'sm',
    className = ''
}) => {
    const statusLower = (status || 'draft').toString().toLowerCase();

    let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotClass = 'bg-slate-500';

    if (['active', 'approved', 'published'].includes(statusLower)) {
        bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotClass = 'bg-emerald-500';
    } else if (['pending', 'submitted', 'in progress'].includes(statusLower)) {
        bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
        dotClass = 'bg-amber-500';
    } else if (['reviewed', 'verified', 'processing'].includes(statusLower)) {
        bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
        dotClass = 'bg-blue-500';
    } else if (['rejected', 'inactive', 'failed', 'deleted'].includes(statusLower)) {
        bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
        dotClass = 'bg-rose-500';
    } else if (['draft', 'archived'].includes(statusLower)) {
        bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
        dotClass = 'bg-slate-400';
    }

    const isPulse = pulse !== undefined ? pulse : ['pending', 'submitted', 'processing'].includes(statusLower);

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-wider ${
            size === 'sm' ? 'px-3 py-1 text-[9px]' : 'px-4 py-1.5 text-[10px]'
        } ${bgClass} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass} ${isPulse ? 'animate-ping' : ''}`} />
            {label || status}
        </span>
    );
};
