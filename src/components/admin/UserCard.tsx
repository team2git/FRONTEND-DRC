import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Shield, MapPin, Edit2, Trash2, Eye, KeyRound } from 'lucide-react';
import { Can } from '../auth/PermissionGuard';

interface User {
    id: string;
    fullname: string;
    email: string;
    phone?: string;
    roles?: { id: string; name: string }[];
    department?: { id: string; name: string };
    organization?: { id: string; name: string };
    sector?: { id: string; name: string };
    team?: { id: string; name: string };
    status: string;
    profileImage?: string;
    accessLevel: string;
}

interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onView: (user: User) => void;
    onDelete: (id: string) => void;
    onStatusToggle: (user: User) => void;
    onManageRoles?: (user: User) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-500';
        case 'pending': return 'bg-yellow-500';
        case 'suspended': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
};

const getAccessLevelStyles = (level: string) => {
    const map: Record<string, string> = {
        super_admin: 'from-purple-600 to-indigo-600 shadow-purple-500/20',
        branch_admin: 'from-pink-600 to-rose-600 shadow-pink-500/20',
        manager: 'from-amber-500 to-orange-600 shadow-amber-500/20',
        expert: 'from-blue-500 to-cyan-600 shadow-blue-500/20',
        team_leader: 'from-cyan-500 to-teal-600 shadow-cyan-500/20',
    };
    return map[level] || 'from-slate-500 to-slate-600 shadow-slate-500/20';
};

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onView, onDelete, onStatusToggle, onManageRoles }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl transition-all hover:border-primary/20 hover:shadow-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-none"
        >

            <div className="relative flex flex-col gap-5">
                {/* Header: Avatar & Status */}
                <div className="flex items-start justify-between">
                    <div className="relative">
                        <div className={`h-20 w-20 overflow-hidden rounded-2xl border-2 border-slate-100 p-1 shadow-sm transition-transform group-hover:scale-105 dark:border-white/20`}>
                            {user.profileImage ? (
                                <img src={user.profileImage} alt={user.fullname} className="h-full w-full rounded-xl object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary">
                                    {user.fullname.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div
                            className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white dark:border-[#121212] ${getStatusColor(user.status)} shadow-lg cursor-pointer`}
                            onClick={() => onStatusToggle(user)}
                            title={`Toggle status (currently ${user.status})`}
                        />
                    </div>

                    <div className="flex gap-2 transition-opacity">
                        <Can resource="User" action="view">
                            <button onClick={() => onView(user)} title="View Profile" className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-primary/10 hover:text-primary dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white">
                                <Eye size={18} />
                            </button>
                        </Can>
                        {onManageRoles ? (
                            <Can resource="User" action="update">
                                <button
                                    onClick={() => onManageRoles(user)}
                                    title="Manage Roles"
                                    className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-primary/10 hover:text-primary dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white"
                                >
                                    <KeyRound size={18} />
                                </button>
                            </Can>
                        ) : null}
                        <Can resource="User" action="update">
                            <button onClick={() => onEdit(user)} title="Edit User" className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-primary/10 hover:text-primary dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white">
                                <Edit2 size={18} />
                            </button>
                        </Can>
                        <Can resource="User" action="delete">
                            <button onClick={() => onDelete(user.id)} title="Delete User" className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500 dark:bg-white/10 dark:text-white/70 dark:hover:bg-red-500/20 dark:hover:text-red-400">
                                <Trash2 size={18} />
                            </button>
                        </Can>
                    </div>
                </div>

                {/* Name & Access Level */}
                <div>
                    <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                        {user.fullname}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white shadow-lg ${getAccessLevelStyles(user.accessLevel)}`}>
                            <Shield size={12} />
                            {user.accessLevel.replace('_', ' ').toUpperCase()}
                        </span>
                        {user.roles?.map(role => (
                            <span key={role.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                                {role.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-white/5">
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-white/50">
                        <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                            <Mail size={14} className="text-primary/70" />
                        </div>
                        <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-white/50">
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                                <Phone size={14} className="text-primary/70" />
                            </div>
                            <span>{user.phone}</span>
                        </div>
                    )}
                    {(user.organization || user.department) && (
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-white/50">
                            <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                                <MapPin size={14} className="text-primary/70" />
                            </div>
                            <span className="truncate">
                                {user.organization?.name} {user.department ? `| ${user.department.name}` : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
