import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Role, getRoles, createRole, updateRole, deleteRole, assignPermissionToRole, removePermissionFromRole, getRolePermissions } from '../../api/roleService';
import { Permission, getPermissions } from '../../api/permissionService';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, Plus, Shield, Key, Eye, Edit2, Trash2, Lock } from 'lucide-react';
import { RoleCard } from '../../components/admin/RoleCard';
import { RoleStats } from '../../components/admin/RoleStats';

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

export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [editRole, setEditRole] = useState<Role | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [initialPermissions, setInitialPermissions] = useState<string[]>([]);

    const [viewRole, setViewRole] = useState<Role | null>(null);
    const [viewPermissions, setViewPermissions] = useState<Permission[]>([]);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [permissionSearchTerm, setPermissionSearchTerm] = useState('');



    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                getRoles(),
                getPermissions()
            ]);
            setRoles(rolesRes?.data || rolesRes || []);
            setPermissions(permsRes?.data || permsRes || []);
        } catch (error) {
            console.error("Failed to fetch roles/permissions", error);
        }
    };

    const handleOpenModal = async (role?: any) => {
        setPermissionSearchTerm('');
        if (role) {
            setEditRole(role);
            setFormData({ name: role.name, description: role.description });
            try {
                const roleId = role.id || role._id;
                const perms = await getRolePermissions(roleId);
                const permIds = perms.map((p: any) => p.id || p._id);
                setSelectedPermissions(permIds);
                setInitialPermissions(permIds);
            } catch (e) {
                console.error("Failed to fetch permissions for role", e);
                toast.error("Could not load role permissions");
                setSelectedPermissions([]);
                setInitialPermissions([]);
            }
        } else {
            setEditRole(null);
            setFormData({ name: '', description: '' });
            setSelectedPermissions([]);
            setInitialPermissions([]);
        }
        openModal();
    };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let savedRole;
            let roleId;
            if (editRole) {
                // Update Role
                savedRole = await updateRole(editRole.id, formData);
                roleId = savedRole.id;
            } else {
                // Create Role
                savedRole = await createRole(formData);
                roleId = savedRole.id || savedRole._id;
            }

            // Handle Permissions Assignment
            // Find added permissions
            const added = selectedPermissions.filter(id => !initialPermissions.includes(id));
            // Find removed permissions
            const removed = initialPermissions.filter(id => !selectedPermissions.includes(id));

            // Execute assignments (sequentially or parallel)
            const promises = [
                ...added.map(permId => assignPermissionToRole(roleId, permId)),
                ...removed.map(permId => removePermissionFromRole(roleId, permId))
            ];

            await Promise.all(promises);

            closeModal();
            toast.success(editRole ? 'Role updated successfully' : 'Role created successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to save role", error);
            toast.error("Failed to save role");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this role?")) {
            try {
                await deleteRole(id);
                toast.success('Role deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Failed to delete role", error);
                toast.error("Failed to delete role");
            }
        }
    };

    const togglePermission = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    // Helper functions for Select All functionality
    const filteredPermissionsForAssignment = permissions.filter(perm => 
        perm.name.toLowerCase().includes(permissionSearchTerm.toLowerCase()) || 
        (perm.resource || '').toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
        (perm.action || '').toLowerCase().includes(permissionSearchTerm.toLowerCase())
    );

    const groupedPermissions = filteredPermissionsForAssignment.reduce((acc, perm) => {
        const resource = perm.resource || 'Other';
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const isAllSelected = filteredPermissionsForAssignment.length > 0 && filteredPermissionsForAssignment.every(p => selectedPermissions.includes(p.id || (p as any)._id));
    const isSomeSelected = filteredPermissionsForAssignment.length > 0 && !isAllSelected && filteredPermissionsForAssignment.some(p => selectedPermissions.includes(p.id || (p as any)._id));

    const handleSelectAll = (checked: boolean) => {
        const visibleIds = filteredPermissionsForAssignment.map(p => p.id || (p as any)._id);
        if (checked) {
            setSelectedPermissions(prev => [...new Set([...prev, ...visibleIds])]);
        } else {
            setSelectedPermissions(prev => prev.filter(id => !visibleIds.includes(id)));
        }
    };

    const handleSelectResource = (resource: string, checked: boolean) => {
        const resourcePermIds = groupedPermissions[resource].map(p => p.id || (p as any)._id);
        if (checked) {
            setSelectedPermissions(prev => [...new Set([...prev, ...resourcePermIds])]);
        } else {
            setSelectedPermissions(prev => prev.filter(id => !resourcePermIds.includes(id)));
        }
    };

    const isResourceFullySelected = (resource: string) => {
        const resourcePermIds = groupedPermissions[resource].map(p => p.id || (p as any)._id);
        return resourcePermIds.length > 0 && resourcePermIds.every(id => selectedPermissions.includes(id));
    };

    const isResourcePartiallySelected = (resource: string) => {
        const resourcePermIds = groupedPermissions[resource].map(p => p.id || (p as any)._id);
        const selectedInResource = resourcePermIds.filter(id => selectedPermissions.includes(id));
        return selectedInResource.length > 0 && selectedInResource.length < resourcePermIds.length;
    };

    const handleViewRole = async (role: Role) => {
        setViewRole(role);
        setIsViewModalOpen(true);
        try {
            const perms = await getRolePermissions(role.id || (role as any)._id);
            setViewPermissions(perms);
        } catch (error) {
            console.error("Failed to fetch permissions for role", error);
            setViewPermissions([]);
        }
    };

    // Group view permissions by resource
    const groupedViewPermissions = viewPermissions.reduce((acc, perm) => {
        const resource = perm.resource || 'Other';
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const closeViewModal = () => {
        setViewRole(null);
        setViewPermissions([]);
        setIsViewModalOpen(false);
    };

    return (
        <>
            <PageMeta
                title="Role Management | IDRMIS"
                description="Manage system roles and permissions"
            />
            <PageBreadcrumb pageTitle="Roles" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />
                {/* Stats Overview */}
                <RoleStats roles={roles} permissions={permissions} />

                {/* Main Content Area */}
                <div className="rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Roles Directory
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">Manage system roles and their permissions</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Unified Search & Actions */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search roles..."
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

                            <button
                                onClick={() => handleOpenModal()}
                                className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] dark:bg-primary dark:shadow-primary/20"
                            >
                                <Plus size={18} />
                                Add Role
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-slate-500 dark:text-white/40">
                        Showing {roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length} roles
                    </div>

                    <AnimatePresence mode="wait">
                        {viewMode === 'grid' ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            >
                                {roles
                                    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((role) => (
                                        <RoleCard
                                            key={role.id || (role as any)._id}
                                            role={role}
                                            onEdit={handleOpenModal}
                                            onView={handleViewRole}
                                            onDelete={handleDelete}
                                        />
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
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Role Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Description</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {roles
                                                .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((role) => (
                                                    <tr key={role.id || (role as any)._id} className="group hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.02]">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                                                    {role.name.charAt(0)}
                                                                </div>
                                                                <div className="font-medium text-slate-900 group-hover:text-primary transition-colors dark:text-white">{role.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-[400px] truncate text-sm text-slate-600 dark:text-white/60">
                                                                {role.description || "No description"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => handleViewRole(role)} title="View Permissions" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button onClick={() => handleOpenModal(role)} title="Edit Role" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button onClick={() => handleDelete(role.id || (role as any)._id)} title="Delete Role" className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
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

            {/* Existing Modal for Edit/Add is kept but styled slightly better if needed, 
              but the core structure is preserved for functionality */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                            {editRole ? 'Edit Role' : 'Add New Role'}
                        </h4>
                        <p className="text-sm text-slate-500">Configure role details and permissions</p>
                    </div>
                    <form onSubmit={handleSave} className="flex flex-col">
                        <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label>Role Name</Label>
                                        <Input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Regional Manager"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description of the role"
                                        />
                                    </div>
                                </div>

                                {/* Permissions Selection */}
                                <div className="space-y-8">
                                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                                        <Label className="!mb-0 text-xl font-bold">Permissions</Label>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                            {/* Permission Search */}
                                            <div className="relative group/search">
                                                <Search 
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary transition-colors" 
                                                    size={16} 
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Search permissions..."
                                                    value={permissionSearchTerm}
                                                    onChange={(e) => setPermissionSearchTerm(e.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-64"
                                                />
                                            </div>

                                            <label className="flex items-center space-x-2 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                        className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all"
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700 dark:text-white/80 group-hover:text-primary transition-colors">
                                                    Select {permissionSearchTerm ? 'Filtered' : 'All'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {Object.entries(groupedPermissions).length > 0 ? (
                                            Object.entries(groupedPermissions).map(([resource, perms]) => (
                                                <div 
                                                    key={resource} 
                                                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/[0.02]"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" />
                                                            <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                                                {resource} <span className="ml-1 text-[10px] text-slate-400 font-normal">({perms.length})</span>
                                                            </h5>
                                                        </div>
                                                        <label className="flex items-center space-x-2 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={isResourceFullySelected(resource)}
                                                                ref={el => { if (el) el.indeterminate = isResourcePartiallySelected(resource); }}
                                                                onChange={(e) => handleSelectResource(resource, e.target.checked)}
                                                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all"
                                                            />
                                                            <span className="text-xs font-medium text-slate-500 group-hover:text-primary dark:text-slate-400">
                                                                Select {resource}
                                                            </span>
                                                        </label>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {perms.map(perm => (
                                                            <label
                                                                key={perm.id || (perm as any)._id}
                                                                className={`flex items-start space-x-3 p-3 border rounded-xl transition-all cursor-pointer hover:shadow-sm ${
                                                                    selectedPermissions.includes(perm.id || (perm as any)._id)
                                                                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 dark:bg-primary/10'
                                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPermissions.includes(perm.id || (perm as any)._id)}
                                                                    onChange={() => togglePermission(perm.id || (perm as any)._id)}
                                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition-colors"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-semibold text-slate-900 dark:text-white block text-xs truncate">
                                                                        {perm.name}
                                                                    </span>
                                                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-medium">
                                                                        {perm.action}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 dark:bg-white/[0.02] dark:border-white/10">
                                                <div className="h-16 w-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <Search className="text-slate-400" size={28} />
                                                </div>
                                                <h6 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No permissions found</h6>
                                                <p className="text-slate-500 text-sm max-w-[300px] text-center">
                                                    We couldn't find any permissions matching "{permissionSearchTerm}". Try a different term.
                                                </p>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPermissionSearchTerm('')}
                                                    className="mt-4 text-primary text-sm font-bold hover:underline"
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-8 lg:justify-end">
                            <Button variant="outline" onClick={closeModal} type="button" className="rounded-xl">
                                Cancel
                            </Button>
                            <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20">
                                Save Role
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* View Role Modal */}
            <Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {viewRole?.name}
                                </h4>
                                <p className="text-sm text-slate-500">Resource access and permission details</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <Label className="mb-2 block opacity-60">Role Description</Label>
                            <p className="text-slate-700 dark:text-white/80 leading-relaxed italic">
                                "{viewRole?.description || "No description provided"}"
                            </p>
                        </div>

                        {/* Permissions Display */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Label className="opacity-60 text-lg">Assigned Permissions</Label>
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full">{viewPermissions.length} TOTAL</span>
                            </div>
                            <div className="space-y-6 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                                {viewPermissions.length > 0 ? (
                                    Object.entries(groupedViewPermissions).map(([resource, perms]) => (
                                        <div key={resource} className="space-y-3">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1 dark:border-white/5">
                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    {resource}
                                                </h5>
                                                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-white/5" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {perms.map(perm => (
                                                    <div key={perm.id || (perm as any)._id} className="group p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-primary/30 transition-all dark:bg-white/[0.02] dark:border-white/5 dark:hover:border-white/10">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Key size={12} className="text-primary/70" />
                                                            <span className="font-bold text-slate-900 dark:text-white text-xs">{perm.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-blue-50/50 px-1.5 py-0.5 rounded text-[8px] font-bold text-blue-500 uppercase tracking-tighter dark:bg-blue-500/10">
                                                                {perm.action}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 dark:bg-white/5 dark:border-white/10">
                                        <Lock className="text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-500 text-sm">No permissions assigned to this role.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button className="rounded-xl px-10" onClick={closeViewModal}>
                                Perfect, Close
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
