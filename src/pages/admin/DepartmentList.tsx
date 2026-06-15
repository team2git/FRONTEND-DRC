import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import {
    Department,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../../api/departmentService';
import { DepartmentForm } from './DepartmentForm';
import { getOrganizations } from '../../api/organizationService';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, Plus, Eye, Edit2, Trash2, Layers } from 'lucide-react';

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

export default function DepartmentList() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [editDept, setEditDept] = useState<Department | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [orgMap, setOrgMap] = useState<Record<string, string>>({});
    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [searchTerm, setSearchTerm] = useState('');



    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    useEffect(() => {
        fetchData();
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        try {
            const orgs = await getOrganizations();
            const map: Record<string, string> = {};
            orgs.forEach((o: any) => map[o.id] = o.name);
            setOrgMap(map);
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        try {
            const data = await getDepartments();
            setDepartments(data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const handleOpenModal = (dept?: Department, mode: 'create' | 'edit' | 'view' = 'create') => {
        setIsViewMode(mode === 'view');
        setEditDept(dept || null);
        openModal();
    };

    const handleSave = async (data: any) => {
        try {
            if (editDept) {
                await updateDepartment(editDept.id, data);
            } else {
                await createDepartment(data);
            }
            closeModal();
            toast.success(editDept ? 'Department updated successfully' : 'Department created successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to save department", error);
            toast.error("Failed to save department");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this department?")) {
            try {
                await deleteDepartment(id);
                toast.success('Department deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Failed to delete department", error);
                toast.error("Failed to delete department");
            }
        }
    };

    const filteredDepartments = departments.filter(dept => {
        const term = searchTerm.toLowerCase();
        const orgName = typeof dept.organizationId === 'object' && dept.organizationId ? (dept.organizationId as any).name : (orgMap[dept.organizationId as string] || '');
        const sectorName = (dept as any).sector?.name || (dept as any).sectorId?.name || '';

        return (
            dept.name.toLowerCase().includes(term) ||
            orgName.toLowerCase().includes(term) ||
            sectorName.toLowerCase().includes(term)
        );
    });

    return (
        <>
            <PageMeta
                title="Department Management | IDRMIS"
                description="Manage departments"
            />
            <PageBreadcrumb pageTitle="Departments" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />

                {/* Main Content Area */}
                <div className="rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Departments Directory
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">Manage internal departments and organizational units</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
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
                                Add Department
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-slate-500 dark:text-white/40">
                        Showing {filteredDepartments.length} departments
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
                                {filteredDepartments.map((dept) => (
                                    <motion.div
                                        key={dept.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl transition-all hover:border-primary/20 hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
                                    >
                                        <div className="relative z-10">
                                            <div className="mb-4 flex items-start justify-between">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300">
                                                    <Layers size={24} />
                                                </div>
                                                <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(dept, 'view')} className="p-2 text-slate-400 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => handleOpenModal(dept, 'edit')} className="p-2 text-slate-400 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                                                {dept.name}
                                            </h4>

                                            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Org</span>
                                                    <span className="font-medium text-slate-700 dark:text-white/70">
                                                        {typeof dept.organizationId === 'object' && dept.organizationId ? (dept.organizationId as any).name : (orgMap[dept.organizationId as string] || dept.organizationId)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Sector</span>
                                                    <span className="font-medium text-slate-700 dark:text-white/70">
                                                        {(dept as any).sector?.name || (dept as any).sectorId?.name || 'Direct'}
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
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Department Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Organization</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Sector</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {filteredDepartments.map((dept) => (
                                                <tr key={dept.id} className="group hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold uppercase transition-all group-hover:scale-110">
                                                                {dept.name.charAt(0)}
                                                            </div>
                                                            <div className="font-medium text-slate-900 group-hover:text-primary transition-colors dark:text-white">{dept.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-slate-600 dark:text-white/60">
                                                            {typeof dept.organizationId === 'object' && dept.organizationId ? (dept.organizationId as any).name : (orgMap[dept.organizationId as string] || dept.organizationId)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-slate-600 dark:text-white/60">
                                                            {(dept as any).sector?.name || (dept as any).sectorId?.name || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => handleOpenModal(dept, 'view')} title="View" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button onClick={() => handleOpenModal(dept, 'edit')} title="Edit" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(dept.id)} title="Delete" className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
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
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View Department' : editDept ? 'Edit Department' : 'Add New Department'}
                        </h4>
                    </div>

                    <DepartmentForm
                        initialData={editDept}
                        isViewMode={isViewMode}
                        onSave={handleSave}
                        onCancel={closeModal}
                    />
                </div>
            </Modal>
        </>
    );
}
