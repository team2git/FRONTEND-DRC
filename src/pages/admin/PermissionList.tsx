import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import {
    Permission,
    getPermissions,
    createPermission,
    updatePermission,
    deletePermission
} from '../../api/permissionService';
import { PermissionForm } from './PermissionForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Key, Database, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
import { PermissionStats } from '../../components/admin/PermissionStats';

const DiamondBackground = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0A0A0B]" />
        {[...Array(10)].map((_, i) => (
            <motion.div
                key={i}
                initial={{
                    opacity: 0,
                    rotate: 45,
                    x: Math.random() * 100 + "%",
                    y: Math.random() * 100 + "%"
                }}
                animate={{
                    opacity: [0.15, 0.45, 0.15],
                    y: ["-20%", "120%"],
                    rotate: [45, 225],
                }}
                transition={{
                    duration: 20 + Math.random() * 20,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * -4
                }}
                className="absolute h-64 w-64 rounded-[48px] border border-white/40 bg-white/10 backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.04]"
                style={{
                    left: `${(i * 12) % 95}%`,
                }}
            />
        ))}
    </div>
);

export default function PermissionList() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editPerm, setEditPerm] = useState<Permission | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

    const toast = useToast();
    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getPermissions();
            setPermissions(data || []);
        } catch (error) {
            console.error("Failed to fetch permissions", error);
            toast.error("Failed to load permissions");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (perm?: Permission) => {
        setEditPerm(perm || null);
        openModal();
    };

    const handleSave = async (data: any) => {
        try {
            if (editPerm) {
                await updatePermission(editPerm.id, data);
            } else {
                await createPermission(data);
            }
            closeModal();
            toast.success(editPerm ? 'Permission updated successfully' : 'Permission created successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to save permission", error);
            toast.error("Failed to save permission");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this permission? This may affect assigned roles.")) {
            try {
                await deletePermission(id);
                toast.success('Permission deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Failed to delete permission", error);
                toast.error("Failed to delete permission");
            }
        }
    };

    const filteredPermissions = permissions.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
        const resource = perm.resource || 'Other';
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <>
            <PageMeta
                title="Permission Management | IDRMIS"
                description="Manage system permissions"
            />
            <PageBreadcrumb pageTitle="Permissions" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />
                
                {/* Stats Overview */}
                <PermissionStats permissions={permissions} />

                {/* Main Content Area */}
                <div className="rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Permissions Library
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">Configure granular system access controls</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search permissions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-11 w-full rounded-2xl border border-white/20 bg-white/40 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white min-w-[280px]"
                                />
                            </div>

                            <div className="flex items-center rounded-2xl border border-slate-200 bg-white/40 p-1 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                                <button
                                    onClick={() => setViewMode('grouped')}
                                    className={`flex h-9 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'grouped' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'}`}
                                    title="Grouped View"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex h-9 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'}`}
                                    title="Table View"
                                >
                                    <List size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => handleOpenModal()}
                                className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] dark:bg-primary dark:shadow-primary/20"
                            >
                                <Plus size={18} />
                                Add Permission
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-slate-500 dark:text-white/40">
                        Showing {filteredPermissions.length} permissions
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : viewMode === 'grouped' ? (
                            <motion.div
                                key="grouped"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                    <div key={resource} className="rounded-3xl border border-slate-200 bg-white/40 p-6 dark:border-white/5 dark:bg-white/[0.02]">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <Database size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{resource}</h4>
                                                <p className="text-xs text-slate-500 dark:text-white/40">{perms.length} Permissions defined</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {perms.map((perm) => (
                                                <div 
                                                    key={perm.id}
                                                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Key size={14} className="text-primary/70" />
                                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">{perm.action}</span>
                                                        </div>
                                                        <h5 className="font-bold text-slate-900 dark:text-white mb-4 line-clamp-1">{perm.name}</h5>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-50 dark:border-white/5">
                                                        <button 
                                                            onClick={() => handleOpenModal(perm)}
                                                            className="p-2 text-slate-400 hover:bg-primary/10 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(perm.id)}
                                                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="table"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="overflow-hidden rounded-2xl border border-white/20 bg-white/40 dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="max-w-full overflow-x-auto">
                                    <table className="w-full table-auto">
                                        <thead>
                                            <tr className="bg-slate-50 text-left dark:bg-white/5">
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Permission Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Resource</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Action</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {filteredPermissions.map((perm) => (
                                                <tr key={perm.id} className="group hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900 dark:text-white">{perm.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {perm.resource}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                            {perm.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => handleOpenModal(perm)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(perm.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
                <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-8 text-center sm:text-left">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto sm:mx-0">
                            <Key size={28} />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {editPerm ? 'Configure Permission' : 'New Permission'}
                        </h4>
                        <p className="text-sm text-slate-500">Define how users interact with system resources</p>
                    </div>

                    <PermissionForm
                        initialData={editPerm}
                        onSave={handleSave}
                        onCancel={closeModal}
                    />
                </div>
            </Modal>
        </>
    );
}
