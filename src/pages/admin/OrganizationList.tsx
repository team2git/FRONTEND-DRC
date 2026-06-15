import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import { Organization, getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../../api/organizationService';
import { OrganizationForm } from './OrganizationForm';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, Plus, Eye, Edit2, Trash2, Building2 } from 'lucide-react';

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

export default function OrganizationList() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);



    // Use the toast hook
    const toast = useToast();

    const { isOpen, openModal, closeModal } = useModal();

    // Filter organizations based on search term
    const filteredOrganizations = organizations.filter(org => {
        const term = searchTerm.toLowerCase();
        return (
            org.name.toLowerCase().includes(term) ||
            org.type.toLowerCase().includes(term) ||
            (typeof org.parentId === 'object' && org.parentId && (org.parentId as any).name.toLowerCase().includes(term))
        );
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrganizations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getOrganizations();
            setOrganizations(data);
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        }
    };

    const handleOpenModal = (org?: Organization, mode: 'create' | 'edit' | 'view' = 'create') => {
        setEditOrg(org || null);
        setIsViewMode(mode === 'view');
        openModal();
    };

    const handleSave = async (data: any) => {
        try {
            if (editOrg) {
                await updateOrganization(editOrg.id, data);
            } else {
                await createOrganization(data);
            }
            closeModal();
            toast.success(editOrg ? 'Organization updated successfully' : 'Organization created successfully');
            fetchData();
        } catch (error) {
            console.error("Failed to save organization", error);
            toast.error("Failed to save organization");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this organization?")) {
            try {
                await deleteOrganization(id);
                toast.success('Organization deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Failed to delete organization", error);
                toast.error("Failed to delete organization. Ensure it has no dependencies.");
            }
        }
    };

    return (
        <>
            <PageMeta
                title="Organization Management | IDRMIS"
                description="Manage organizations structure"
            />
            <PageBreadcrumb pageTitle="Organizations" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />

                {/* Main Content Area */}
                <div className="rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Organizations Directory
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">Manage system organizations and their hierarchy</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Unified Search & Actions */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search organizations..."
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
                                Add Organization
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-slate-500 dark:text-white/40">
                        Showing {filteredOrganizations.length} organizations
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
                                {currentItems.map((org) => (
                                    <motion.div
                                        key={org.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-6 shadow-2xl backdrop-blur-3xl transition-all hover:border-primary/20 hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
                                    >
                                        <div className="relative z-10">
                                            <div className="mb-4 flex items-start justify-between">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300">
                                                    <Building2 size={24} />
                                                </div>
                                                <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(org, 'view')} className="p-2 text-slate-400 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => handleOpenModal(org, 'edit')} className="p-2 text-slate-400 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(org.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                                                {org.name}
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                                    {org.type.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Parent</span>
                                                    <span className="font-medium text-slate-700 dark:text-white/70">
                                                        {typeof org.parentId === 'object' && org.parentId ? (org.parentId as any).name : '-'}
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
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Organization</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Type</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Parent</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {currentItems.map((org) => (
                                                <tr key={org.id} className="group hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold uppercase transition-all group-hover:scale-110">
                                                                {org.name.charAt(0)}
                                                            </div>
                                                            <div className="font-medium text-slate-900 group-hover:text-primary transition-colors dark:text-white">{org.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/5 dark:text-white/70 uppercase tracking-wider">
                                                            {org.type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-slate-600 dark:text-white/60">
                                                            {typeof org.parentId === 'object' && org.parentId ? (org.parentId as any).name : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => handleOpenModal(org, 'view')} title="View" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button onClick={() => handleOpenModal(org, 'edit')} title="Edit" className="p-2 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-lg transition-all dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(org.id)} title="Delete" className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400">
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-white/5">
                            <div className="text-sm text-slate-500 dark:text-white/40">
                                Showing <span className="font-semibold text-slate-900 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(indexOfLastItem, filteredOrganizations.length)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{filteredOrganizations.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/40 text-slate-500 transition-all hover:bg-white hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <LayoutGrid size={18} className="rotate-90" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button
                                        key={number}
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${currentPage === number
                                            ? 'border-primary bg-slate-900 text-white shadow-lg scale-105'
                                            : 'border-slate-200 bg-white/40 text-slate-500 hover:bg-white hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10'
                                            }`}
                                        onClick={() => setCurrentPage(number)}
                                    >
                                        {number}
                                    </button>
                                ))}
                                <button
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/40 text-slate-500 transition-all hover:bg-white hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    <LayoutGrid size={18} className="-rotate-90" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
                <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {isViewMode ? 'View Organization' : editOrg ? 'Edit Organization' : 'Add New Organization'}
                        </h4>
                    </div>

                    <OrganizationForm
                        initialData={editOrg}
                        isViewMode={isViewMode}
                        onSave={handleSave}
                        onCancel={closeModal}
                    />
                </div>
            </Modal>
        </>
    );
}
