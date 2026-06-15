import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Edit2, Trash2, Eye, Key } from 'lucide-react';
import { Can } from '../auth/PermissionGuard';

interface Role {
    id: string;
    _id?: string;
    name: string;
    description?: string;
}

interface RoleCardProps {
    role: Role;
    onEdit: (role: Role) => void;
    onView: (role: Role) => void;
    onDelete: (id: string) => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onEdit, onView, onDelete }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl transition-all hover:border-primary/20 hover:shadow-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-none"
        >

            <div className="relative flex flex-col gap-5">
                {/* Header: Icon & Actions */}
                <div className="flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                        <Shield size={32} />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onView(role)}
                            title="View Permissions"
                            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-primary/10 hover:text-primary dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white"
                        >
                            <Eye size={18} />
                        </button>
                        <Can resource="Role" action="update">
                            <button
                                onClick={() => onEdit(role)}
                                title="Edit Role"
                                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-primary/10 hover:text-primary dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white"
                            >
                                <Edit2 size={18} />
                            </button>
                        </Can>
                        <Can resource="Role" action="delete">
                            <button
                                onClick={() => onDelete(role.id || (role as any)._id)}
                                title="Delete Role"
                                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500 dark:bg-white/10 dark:text-white/70 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                            >
                                <Trash2 size={18} />
                            </button>
                        </Can>
                    </div>
                </div>

                {/* Name & Description */}
                <div>
                    <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                        {role.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2 dark:text-white/60">
                        {role.description || "No description provided for this role."}
                    </p>
                </div>

                {/* Footer Info */}
                <div className="mt-2 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-white/30 uppercase tracking-wider">
                        <Key size={14} className="text-primary/70" />
                        Permissions Managed
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
