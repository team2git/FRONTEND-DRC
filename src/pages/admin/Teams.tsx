import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import {
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    Team
} from '../../api/teamService';
import { getDepartments, Department } from '../../api/departmentService';
import { Can } from '../../components/auth/PermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, Plus, Eye, Edit2, Trash2, Users, User, Shield } from 'lucide-react';

const DiamondBackground = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Mesh Gradient Base */}
        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0A0A0B]" />

        {/* Floating Glassy Diamonds */}
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

export default function Teams() {
    const { user } = useAuth();
    // ... existing state
    const [teams, setTeams] = useState<Team[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [editTeam, setEditTeam] = useState<Team | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', department: '' });
    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [searchTerm, setSearchTerm] = useState('');

    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchData();
    }, [user]); // Add user dependence

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teamsData, depsData] = await Promise.all([
                getTeams(),
                getDepartments()
            ]);
            setTeams(teamsData || []);

            // Filter Departments if Branch Admin
            const isBranchAdmin = user?.accessLevel === 'branch_admin' ||
                user?.roles?.some(r => ['Branch Admin', 'branch_admin'].includes(r.name));

            const isSuperAdmin = user?.accessLevel === 'super_admin' ||
                user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name));

            if (isBranchAdmin && !isSuperAdmin && user?.organization && depsData) {
                const orgId = typeof user.organization === 'object' ? (user.organization as any)._id || (user.organization as any).id : user.organization;

                const filteredDeps = depsData.filter((d: any) => {
                    const dOrgId = typeof d.organizationId === 'object' ? d.organizationId._id || d.organizationId.id : d.organizationId;
                    return dOrgId === orgId;
                });
                setDepartments(filteredDeps);
            } else {
                setDepartments(depsData || []);
            }

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (team?: Team, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');
        if (team) {
            setEditTeam(team);
            setFormData({
                name: team.name,
                description: team.description || '',
                department: team.department as string
            });
        } else {
            setEditTeam(null);
            setFormData({ name: '', description: '', department: '' });
        }
        openModal();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editTeam) {
                await updateTeam(editTeam._id || editTeam.id!, formData);
            } else {
                await createTeam(formData);
            }
            closeModal();
            toast.success(editTeam ? 'Team updated successfully' : 'Team created successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to save team', error);
            toast.error('Failed to save team');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this team?')) {
            try {
                await deleteTeam(id);
                toast.success('Team deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Failed to delete team', error);
                toast.error('Failed to delete team');
            }
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const filteredTeams = (teams || []).filter(team => {
        const term = searchTerm.toLowerCase();
        const deptName = team.department && typeof team.department === 'object' ? (team.department as any).name : '';
        const leaderName = team.teamLeader ? team.teamLeader.fullname : '';

        return (
            team.name.toLowerCase().includes(term) ||
            (team.description || '').toLowerCase().includes(term) ||
            deptName.toLowerCase().includes(term) ||
            leaderName.toLowerCase().includes(term)
        );
    });

    return (
        <>
            <PageMeta
                title="Team Management | IDRMIS"
                description="Manage teams and team members"
            />
            <PageBreadcrumb pageTitle="Teams" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />

                {/* Main Content Area */}
                <div className="rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Teams Directory
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">Manage operational teams and personnel assignments</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search teams..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-11 w-full rounded-2xl border border-white/20 bg-white/40 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white min-w-[280px]"
                                />
                            </div>

                            <div className="flex items-center rounded-2xl border border-slate-200 bg-white/40 p-1 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex h-9 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex h-9 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>

                            <Can resource="Team" action="create">
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] dark:bg-primary dark:shadow-primary/20"
                                >
                                    <Plus size={18} />
                                    Add Team
                                </button>
                            </Can>
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-slate-500 dark:text-white/40">
                        Showing {filteredTeams.length} teams
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                <p className="mt-4 text-slate-500 dark:text-white/40">Loading teams...</p>
                            </motion.div>
                        ) : viewMode === 'grid' ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            >
                                {filteredTeams.map((team) => (
                                    <motion.div
                                        key={team._id || team.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl transition-all hover:border-primary/20 hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
                                    >
                                        <div className="relative z-10">
                                            <div className="mb-4 flex items-start justify-between">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300">
                                                    <Users size={24} />
                                                </div>
                                                <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <Can resource="Team" action="view">
                                                        <button onClick={() => handleOpenModal(team, 'view')} className="p-2 text-slate-400 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                            <Eye size={16} />
                                                        </button>
                                                    </Can>
                                                    <Can resource="Team" action="update">
                                                        <button onClick={() => handleOpenModal(team, 'edit')} className="p-2 text-slate-400 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </Can>
                                                    <Can resource="Team" action="delete">
                                                        <button onClick={() => handleDelete(team._id || team.id!)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </Can>
                                                </div>
                                            </div>

                                            <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                                                {team.name}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-white/60 mb-4 line-clamp-2">
                                                {team.description || 'No description provided'}
                                            </p>

                                            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1 text-slate-500"><Shield size={12} /> Leader</span>
                                                    <span className="font-medium text-slate-700 dark:text-white/70">
                                                        {team.teamLeader ? team.teamLeader.fullname : 'Unassigned'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1 text-slate-500"><User size={12} /> Members</span>
                                                    <span className="font-medium text-slate-700 dark:text-white/70">
                                                        {team.members?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Department</span>
                                                    <span className="font-medium text-slate-700 dark:text-white/70 truncate max-w-[120px]">
                                                        {team.department && typeof team.department === 'object' ? (team.department as any).name : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
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
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Team Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Department</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Leader</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Members</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {filteredTeams.map((team) => (
                                                <tr key={team._id || team.id} className="group hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold uppercase transition-all group-hover:scale-110">
                                                                {team.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-slate-900 group-hover:text-primary transition-colors dark:text-white">{team.name}</div>
                                                                <div className="text-[10px] text-slate-400 dark:text-white/30 truncate max-w-[200px]">{team.description}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-slate-600 dark:text-white/60">
                                                            {team.department && typeof team.department === 'object' ? (team.department as any).name : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px]">
                                                                {team.teamLeader ? team.teamLeader.fullname.charAt(0) : '?'}
                                                            </div>
                                                            <span className="text-sm text-slate-600 dark:text-white/70">
                                                                {team.teamLeader ? team.teamLeader.fullname : 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-white/50">
                                                            {team.members?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Can resource="Team" action="view">
                                                                <button onClick={() => handleOpenModal(team, 'view')} title="View" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                    <Eye size={16} />
                                                                </button>
                                                            </Can>
                                                            <Can resource="Team" action="update">
                                                                <button onClick={() => handleOpenModal(team, 'edit')} title="Edit" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                            </Can>
                                                            <Can resource="Team" action="delete">
                                                                <button onClick={() => handleDelete(team._id || team.id!)} title="Delete" className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </Can>
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
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View Team' : editTeam ? 'Edit Team' : 'Add New Team'}
                        </h4>
                    </div>
                    <form onSubmit={handleSave} className="flex flex-col">
                        <div className="custom-scrollbar h-auto overflow-y-auto px-2 pb-3">
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Team Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={isViewMode}
                                        className="w-full rounded-lg border-[1.5px] border-slate-200 bg-white/40 px-5 py-3 font-medium text-slate-900 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={isViewMode}
                                        className="w-full rounded-lg border-[1.5px] border-slate-200 bg-white/40 px-5 py-3 font-medium text-slate-900 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                        disabled={isViewMode}
                                        className="w-full rounded-lg border-[1.5px] border-slate-200 bg-white/40 px-5 py-3 font-medium text-slate-900 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <button
                                onClick={closeModal}
                                type="button"
                                className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                            >
                                {isViewMode ? 'Close' : 'Cancel'}
                            </button>
                            {!isViewMode && (
                                <button
                                    type="submit"
                                    className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 dark:bg-primary dark:shadow-primary/20"
                                >
                                    Save Team
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
