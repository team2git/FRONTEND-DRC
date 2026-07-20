import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, MapPin, Building, Activity, Layers, Loader2 } from 'lucide-react';
import {
    getSubcities,
    createSubcity,
    deleteSubcity,
    getWoredas,
    createWoreda,
    deleteWoreda,
    Subcity,
    Woreda
} from '../../api/locationService';

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

export default function LocationManagement() {
    const [subcities, setSubcities] = useState<Subcity[]>([]);
    const [woredas, setWoredas] = useState<Woreda[]>([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [newSubcityName, setNewSubcityName] = useState('');
    const [newWoredaName, setNewWoredaName] = useState('');
    const [selectedSubcityId, setSelectedSubcityId] = useState('');
    const [submittingSubcity, setSubmittingSubcity] = useState(false);
    const [submittingWoreda, setSubmittingWoreda] = useState(false);

    // Filter/Search states
    const [activeTab, setActiveTab] = useState<'subcities' | 'woredas'>('subcities');
    const [searchSubcity, setSearchSubcity] = useState('');
    const [searchWoreda, setSearchWoreda] = useState('');
    const [filterWoredaSubcity, setFilterWoredaSubcity] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [currentPage, setCurrentPage] = useState(1);

    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subs, woredasData] = await Promise.all([
                getSubcities(),
                getWoredas()
            ]);
            setSubcities(subs);
            setWoredas(woredasData);
            if (subs.length > 0) {
                setSelectedSubcityId(subs[0]._id);
            }
        } catch (error) {
            console.error("Failed to load locations:", error);
            toast.error("Failed to load location registry data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubcity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubcityName.trim()) return;
        try {
            setSubmittingSubcity(true);
            const sub = await createSubcity({ name: newSubcityName });
            toast.success(`Subcity "${sub.name}" registered successfully`);
            setNewSubcityName('');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create subcity");
        } finally {
            setSubmittingSubcity(false);
        }
    };

    const handleAddWoreda = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWoredaName.trim() || !selectedSubcityId) return;
        try {
            setSubmittingWoreda(true);
            const woreda = await createWoreda({ name: newWoredaName, subcityId: selectedSubcityId });
            toast.success(`Woreda "${woreda.name}" registered successfully`);
            setNewWoredaName('');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create woreda");
        } finally {
            setSubmittingWoreda(false);
        }
    };

    const handleDeleteSubcity = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}" Subcity? This will also delete all woredas registered under it.`)) return;
        try {
            await deleteSubcity(id);
            toast.success(`Subcity "${name}" and associated woredas deleted`);
            fetchData();
        } catch (error) {
            toast.error("Failed to delete subcity");
        }
    };

    const handleDeleteWoreda = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete Woreda "${name}"?`)) return;
        try {
            await deleteWoreda(id);
            toast.success(`Woreda "${name}" deleted`);
            fetchData();
        } catch (error) {
            toast.error("Failed to delete woreda");
        }
    };

    const filteredSubcities = subcities.filter(s =>
        s.name.toLowerCase().includes(searchSubcity.toLowerCase())
    );

    const filteredWoredas = woredas.filter(w => {
        const subName = typeof w.subcity === 'object' ? w.subcity.name : '';
        const matchesSearch =
            w.name.toLowerCase().includes(searchWoreda.toLowerCase()) ||
            subName.toLowerCase().includes(searchWoreda.toLowerCase());
        const matchesFilter = !filterWoredaSubcity ||
            (typeof w.subcity === 'object' ? w.subcity._id === filterWoredaSubcity : false);
        return matchesSearch && matchesFilter;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchSubcity, searchWoreda, filterWoredaSubcity, itemsPerPage]);

    const totalItems = activeTab === 'subcities' ? filteredSubcities.length : filteredWoredas.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedSubcities = filteredSubcities.slice(indexOfFirstItem, indexOfLastItem);
    const paginatedWoredas = filteredWoredas.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <>
            <PageMeta
                title="Location Management | IDRMIS"
                description="Manage subcities and woredas geographic registry"
            />
            <PageBreadcrumb pageTitle="Location Registry" />

            <div className="relative space-y-8 pb-10 min-h-screen">
                <DiamondBackground />

                <section className="grid gap-6">
                    <div className="rounded-[2.5rem] border border-slate-200/70 dark:border-white/10 bg-white/90 dark:bg-[#070709]/90 shadow-xl shadow-slate-900/5 p-8 backdrop-blur-xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400 font-black mb-2">Administrative location registry</p>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Manage subcities and woredas with confidence</h1>
                                <p className="mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Use the quick forms to register new geographic units, keep the registry clean, and stay on top of location assignments.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-indigo-500/10">
                                    <Activity size={14} /> Live registry
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">
                                    {loading ? 'Syncing data' : 'Updated recently'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.05 }}
                                className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#09090B] p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 font-black">Subcities</p>
                                        <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{subcities.length}</p>
                                    </div>
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                                        <Building size={20} />
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.12 }}
                                className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#09090B] p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 font-black">Woredas</p>
                                        <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{woredas.length}</p>
                                    </div>
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300">
                                        <Layers size={20} />
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.18 }}
                                className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#09090B] p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 font-black">Current focus</p>
                                        <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{activeTab === 'subcities' ? 'Subcities' : 'Woredas'}</p>
                                    </div>
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                        <MapPin size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Forms column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Subcity Form */}
                        <div className="bg-white dark:bg-[#121214] rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="text-md font-black text-slate-900 dark:text-white">Register Subcity</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Add administrative sub-cities</p>
                                </div>
                            </div>
                            <form onSubmit={handleAddSubcity} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subcity Name</label>
                                    <input
                                        type="text"
                                        value={newSubcityName}
                                        onChange={e => setNewSubcityName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="e.g. Bole"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingSubcity || !newSubcityName.trim()}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    {submittingSubcity ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Register Subcity
                                </button>
                            </form>
                        </div>

                        {/* Woreda Form */}
                        <div className="bg-white dark:bg-[#121214] rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600">
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h3 className="text-md font-black text-slate-900 dark:text-white">Register Woreda</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Add woredas under sub-cities</p>
                                </div>
                            </div>
                            <form onSubmit={handleAddWoreda} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Subcity</label>
                                    <select
                                        value={selectedSubcityId}
                                        onChange={e => setSelectedSubcityId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">-- Choose Subcity --</option>
                                        {subcities.map(sub => (
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Woreda Name / Code</label>
                                    <input
                                        type="text"
                                        value={newWoredaName}
                                        onChange={e => setNewWoredaName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="e.g. Woreda 03"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingWoreda || !newWoredaName.trim() || !selectedSubcityId}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50"
                                >
                                    {submittingWoreda ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Register Woreda
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Registry listings */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#121214] rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
                            {/* Tab selector */}
                            <div className="flex bg-slate-100 dark:bg-[#1A1A1E] p-1.5 rounded-2xl gap-1 mb-6 max-w-xs">
                                <button
                                    onClick={() => setActiveTab('subcities')}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'subcities' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50'}`}
                                >
                                    Subcities ({subcities.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('woredas')}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'woredas' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50'}`}
                                >
                                    Woredas ({woredas.length})
                                </button>
                            </div>

                            {/* Search and filter toolbar */}
                            <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-end mb-6">
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder={activeTab === 'subcities' ? "Search registered subcities..." : "Search woredas, parent subcities..."}
                                        value={activeTab === 'subcities' ? searchSubcity : searchWoreda}
                                        onChange={e => activeTab === 'subcities' ? setSearchSubcity(e.target.value) : setSearchWoreda(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-white/5 rounded-[2.5rem] pl-16 pr-8 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                    {activeTab === 'woredas' && (
                                        <select
                                            value={filterWoredaSubcity}
                                            onChange={e => setFilterWoredaSubcity(e.target.value)}
                                            className="min-w-[180px] bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">Filter by subcity</option>
                                            {subcities.map(sub => (
                                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    <select
                                        value={itemsPerPage}
                                        onChange={e => setItemsPerPage(Number(e.target.value))}
                                        className="min-w-[140px] bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        {[8, 12, 20, 50].map(size => (
                                            <option key={size} value={size}>{size} rows per page</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 size={36} className="text-indigo-600 animate-spin" />
                                    <p className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-wider">Loading locations...</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-[#1A1A1E] border-b border-slate-200 dark:border-white/5">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                                {activeTab === 'woredas' && (
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Subcity</th>
                                                )}
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {activeTab === 'subcities' ? (
                                                paginatedSubcities.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={2} className="px-6 py-8 text-center text-slate-400 font-bold text-sm">No subcities registered.</td>
                                                    </tr>
                                                ) : (
                                                    paginatedSubcities.map(sub => (
                                                        <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-6 py-4 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                                                                    <Building size={14} />
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleDeleteSubcity(sub._id, sub.name)}
                                                                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 text-rose-600 rounded-xl transition-all"
                                                                    title="Delete Subcity"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )
                                            ) : (
                                                paginatedWoredas.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-bold text-sm">No woredas registered.</td>
                                                    </tr>
                                                ) : (
                                                    paginatedWoredas.map(w => (
                                                        <tr key={w._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-6 py-4 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600">
                                                                    <Layers size={14} />
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-lg uppercase tracking-wider">
                                                                    {typeof w.subcity === 'object' ? w.subcity.name : w.subcity}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleDeleteWoreda(w._id, w.name)}
                                                                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 text-rose-600 rounded-xl transition-all"
                                                                    title="Delete Woreda"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 mt-4 bg-slate-50 dark:bg-[#111115] border-t border-slate-200 dark:border-white/10 rounded-b-2xl">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Showing <span className="text-slate-900 dark:text-white font-black">{indexOfFirstItem + 1}</span> - <span className="text-slate-900 dark:text-white font-black">{Math.min(indexOfLastItem, totalItems)}</span> of <span className="text-slate-900 dark:text-white font-black">{totalItems}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`h-10 min-w-[80px] rounded-2xl border text-sm font-black transition-all ${currentPage === 1 ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white'}`}
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = currentPage <= 3 ? i + 1 : Math.min(totalPages - (Math.min(5, totalPages) - 1) + i, totalPages);
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`h-10 min-w-[45px] rounded-2xl border text-sm font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className={`h-10 min-w-[80px] rounded-2xl border text-sm font-black transition-all ${currentPage === totalPages ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white'}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
