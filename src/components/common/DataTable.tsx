import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Filter, SlidersHorizontal, Download, RefreshCw, 
    ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
    Plus, Check, X, Trash2, FileSpreadsheet, FileText, AlertCircle,
    Building2, Layers
} from 'lucide-react';
import { StatusBadge, StatusType } from './StatusBadge';
import { RowActionMenu, ActionItem } from './RowActionMenu';

export interface ColumnDef<T> {
    key: string;
    header: string;
    sortable?: boolean;
    hidden?: boolean;
    render?: (row: T, index: number) => React.ReactNode;
}

export interface SummaryCard {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: React.ReactNode;
    color?: string;
}

export interface BulkAction<T> {
    label: string;
    icon?: React.ReactNode;
    action: (selectedRows: T[]) => void;
    danger?: boolean;
}

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
    parentKey?: string;
}

interface DataTableProps<T> {
    title?: string;
    description?: string;
    primaryAction?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
    };
    summaryCards?: SummaryCard[];
    data: T[];
    columns: ColumnDef<T>[];
    rowIdKey?: keyof T | ((row: T) => string);
    searchable?: boolean;
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[];
    filterConfigs?: FilterConfig[];
    activeFilters?: Record<string, string>;
    onFilterChange?: (filters: Record<string, string>) => void;
    rowActions?: (row: T) => ActionItem[];
    bulkActions?: BulkAction<T>[];
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    onExportCSV?: () => void;
    onExportExcel?: () => void;
    onExportPDF?: () => void;
    pageSizeOptions?: number[];
    defaultPageSize?: number;
    onRowClick?: (row: T) => void;
    emptyText?: string;
}

export function DataTable<T extends Record<string, any>>({
    title,
    description,
    primaryAction,
    summaryCards,
    data,
    columns: initialColumns,
    rowIdKey = '_id',
    searchable = true,
    searchPlaceholder = 'Search records by name, ID, status...',
    searchKeys,
    filterConfigs = [],
    activeFilters: externalFilters,
    onFilterChange,
    rowActions,
    bulkActions = [],
    loading = false,
    error = null,
    onRefresh,
    onExportCSV,
    onExportExcel,
    onExportPDF,
    pageSizeOptions = [10, 20, 50, 100],
    defaultPageSize = 10,
    onRowClick,
    emptyText = 'No records matching your search or filters'
}: DataTableProps<T>) {

    // Helper to get row ID
    const getRowId = (row: T, idx: number): string => {
        if (typeof rowIdKey === 'function') return rowIdKey(row);
        if (row[rowIdKey] !== undefined) return String(row[rowIdKey]);
        return String(idx);
    };

    // Search term & debounce state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Sorting state
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Filtering state
    const [internalFilters, setInternalFilters] = useState<Record<string, string>>({});
    const currentFilters = externalFilters || internalFilters;

    const handleFilterUpdate = (key: string, val: string) => {
        const next = { ...currentFilters };
        if (!val || val === 'ALL') {
            delete next[key];
        } else {
            next[key] = val;
        }

        // Reset dependent child filters if any
        filterConfigs.forEach(fc => {
            if (fc.parentKey === key && next[fc.key]) {
                delete next[fc.key];
            }
        });

        if (onFilterChange) {
            onFilterChange(next);
        } else {
            setInternalFilters(next);
        }
    };

    const handleClearAllFilters = () => {
        if (onFilterChange) {
            onFilterChange({});
        } else {
            setInternalFilters({});
        }
        setSearchTerm('');
    };

    // Filter popover state
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // Column visibility state
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const vis: Record<string, boolean> = {};
        initialColumns.forEach(col => {
            vis[col.key] = !col.hidden;
        });
        return vis;
    });
    const [showColumnPicker, setShowColumnPicker] = useState(false);

    // Export menu state
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Selection state for Bulk actions
    const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // Visible columns
    const visibleColumns = useMemo(() => {
        return initialColumns.filter(c => columnVisibility[c.key] !== false);
    }, [initialColumns, columnVisibility]);

    // Filtered data calculation
    const filteredData = useMemo(() => {
        return data.filter(row => {
            // Search matching
            if (debouncedSearch.trim()) {
                const query = debouncedSearch.toLowerCase().trim();
                const keysToSearch = searchKeys || (Object.keys(row) as (keyof T)[]);
                const matchesSearch = keysToSearch.some(key => {
                    const val = row[key];
                    if (val === null || val === undefined) return false;
                    return String(val).toLowerCase().includes(query);
                });
                if (!matchesSearch) return false;
            }

            // Filter matching
            for (const [fKey, fVal] of Object.entries(currentFilters)) {
                if (!fVal) continue;
                const rowVal = row[fKey] || row.location?.[fKey];
                if (rowVal && String(rowVal).toLowerCase() !== String(fVal).toLowerCase()) {
                    return false;
                }
            }

            return true;
        });
    }, [data, debouncedSearch, currentFilters, searchKeys]);

    // Sorted data calculation
    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData;

        return [...filteredData].sort((a, b) => {
            const valA = a[sortKey] ?? a.location?.[sortKey] ?? '';
            const valB = b[sortKey] ?? b.location?.[sortKey] ?? '';

            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
            if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortKey, sortOrder]);

    // Paginated data calculation
    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Reset page on filter or search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, currentFilters, pageSize]);

    // Select All Toggle
    const allCurrentSelected = paginatedData.length > 0 && paginatedData.every((r, idx) => selectedRowIds.has(getRowId(r, idx)));
    const toggleSelectAll = () => {
        const next = new Set(selectedRowIds);
        if (allCurrentSelected) {
            paginatedData.forEach((r, idx) => next.delete(getRowId(r, idx)));
        } else {
            paginatedData.forEach((r, idx) => next.add(getRowId(r, idx)));
        }
        setSelectedRowIds(next);
    };

    const toggleSelectRow = (id: string) => {
        const next = new Set(selectedRowIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedRowIds(next);
    };

    const selectedRowsList = useMemo(() => {
        return data.filter((r, idx) => selectedRowIds.has(getRowId(r, idx)));
    }, [data, selectedRowIds]);

    const activeFilterCount = Object.keys(currentFilters).length + (debouncedSearch ? 1 : 0);

    // Handle column sort header click
    const handleSortClick = (key: string) => {
        if (sortKey === key) {
            if (sortOrder === 'asc') setSortOrder('desc');
            else setSortKey(null);
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    return (
        <div className="space-y-6 w-full text-slate-800">
            {/* 1. Page Header */}
            {(title || primaryAction) && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                    <div>
                        {title && <h1 className="text-2xl font-black text-[#172358] tracking-tight">{title}</h1>}
                        {description && <p className="text-xs font-semibold text-slate-500 mt-1">{description}</p>}
                    </div>
                    {primaryAction && (
                        <button
                            type="button"
                            onClick={primaryAction.onClick}
                            className="px-6 py-3 bg-[#172358] hover:bg-[#111a42] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#172358]/20 cursor-pointer self-start md:self-auto"
                        >
                            {primaryAction.icon || <Plus size={16} />}
                            {primaryAction.label}
                        </button>
                    )}
                </div>
            )}

            {/* 2. Summary KPI Cards (Optional) */}
            {summaryCards && summaryCards.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summaryCards.map((card, i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-xl font-black text-slate-900">{card.value}</p>
                                {card.subtext && <p className="text-[9px] font-bold text-slate-500 mt-0.5">{card.subtext}</p>}
                            </div>
                            {card.icon && (
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${card.color || 'bg-[#172358]/10 text-[#172358]'}`}>
                                    {card.icon}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 3. Table Container Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">

                {/* Table Toolbar */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    
                    {/* Search Input */}
                    {searchable && (
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#172358] focus:ring-2 focus:ring-[#172358]/20 transition-all shadow-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Toolbar Action Buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">

                        {/* Filter Panel Toggle */}
                        {filterConfigs.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                        activeFilterCount > 0
                                            ? 'bg-[#172358] text-white border-[#172358] shadow-md shadow-[#172358]/20'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#172358]/40 hover:bg-slate-50'
                                    }`}
                                >
                                    <Filter size={14} />
                                    <span>Filters</span>
                                    {activeFilterCount > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-white text-[#172358] font-black text-[10px] flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Filters Panel */}
                                {showFilterPanel && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 z-[150] p-5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <h4 className="text-xs font-black text-[#172358] uppercase tracking-wider">Filter Records</h4>
                                            {activeFilterCount > 0 && (
                                                <button onClick={handleClearAllFilters} className="text-[10px] font-black text-rose-600 hover:underline">
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                        {filterConfigs.map(fc => {
                                            // Check cascading dependency
                                            let opts = fc.options;
                                            if (fc.parentKey && !currentFilters[fc.parentKey]) {
                                                opts = [];
                                            }

                                            return (
                                                <div key={fc.key} className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{fc.label}</label>
                                                    <select
                                                        value={currentFilters[fc.key] || 'ALL'}
                                                        onChange={e => handleFilterUpdate(fc.key, e.target.value)}
                                                        disabled={fc.parentKey ? !currentFilters[fc.parentKey] : false}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#172358] disabled:bg-slate-100 disabled:text-slate-400"
                                                    >
                                                        <option value="ALL">All {fc.label}s</option>
                                                        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Column Visibility Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnPicker(!showColumnPicker)}
                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:border-[#172358]/40 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <SlidersHorizontal size={14} />
                                <span>Columns</span>
                            </button>

                            {showColumnPicker && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-200 z-[150] p-4 space-y-2">
                                    <h4 className="text-[10px] font-black text-[#172358] uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Toggle Columns</h4>
                                    {initialColumns.map(col => (
                                        <label key={col.key} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-[#172358] cursor-pointer py-1">
                                            <input
                                                type="checkbox"
                                                checked={columnVisibility[col.key] !== false}
                                                onChange={e => setColumnVisibility(prev => ({ ...prev, [col.key]: e.target.checked }))}
                                                className="w-4 h-4 rounded text-[#172358] focus:ring-[#172358]"
                                            />
                                            <span>{col.header}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Export Menu */}
                        {(onExportCSV || onExportExcel || onExportPDF) && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:border-[#172358]/40 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                                >
                                    <Download size={14} />
                                    <span>Export</span>
                                </button>

                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[150] py-2">
                                        {onExportCSV && (
                                            <button
                                                onClick={() => { setShowExportMenu(false); onExportCSV(); }}
                                                className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#172358] flex items-center gap-2 text-left"
                                            >
                                                <FileText size={14} /> Export CSV
                                            </button>
                                        )}
                                        {onExportExcel && (
                                            <button
                                                onClick={() => { setShowExportMenu(false); onExportExcel(); }}
                                                className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#172358] flex items-center gap-2 text-left"
                                            >
                                                <FileSpreadsheet size={14} /> Export Excel
                                            </button>
                                        )}
                                        {onExportPDF && (
                                            <button
                                                onClick={() => { setShowExportMenu(false); onExportPDF(); }}
                                                className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#172358] flex items-center gap-2 text-left"
                                            >
                                                <Download size={14} /> Export PDF
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Refresh Button */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-[#172358] hover:border-[#172358]/40 hover:bg-slate-50 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                                title="Refresh Table"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions Banner */}
                {selectedRowIds.size > 0 && (
                    <div className="bg-[#172358] text-white px-8 py-3.5 flex items-center justify-between animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center">
                                {selectedRowIds.size}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider">{selectedRowIds.size} Records Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {bulkActions.map((ba, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => ba.action(selectedRowsList)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                                        ba.danger
                                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                            : 'bg-white/15 hover:bg-white/25 text-white'
                                    }`}
                                >
                                    {ba.icon}
                                    {ba.label}
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedRowIds(new Set())}
                                className="text-xs font-bold text-blue-200 hover:text-white ml-2 underline cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Table Content */}
                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="p-12 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-12 bg-slate-100/80 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 p-6 text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <AlertCircle size={28} />
                            </div>
                            <h4 className="text-base font-black text-slate-900">Unable to load data</h4>
                            <p className="text-xs text-slate-500 max-w-md font-medium">{error}</p>
                            {onRefresh && (
                                <button onClick={onRefresh} className="px-5 py-2.5 bg-[#172358] text-white rounded-xl text-xs font-black uppercase tracking-wider mt-2">
                                    Try Again
                                </button>
                            )}
                        </div>
                    ) : sortedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 p-6 text-center space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                <Search size={28} />
                            </div>
                            <h4 className="text-base font-black text-slate-900">No Records Found</h4>
                            <p className="text-xs text-slate-500 max-w-sm font-medium">{emptyText}</p>
                            {activeFilterCount > 0 && (
                                <button onClick={handleClearAllFilters} className="px-5 py-2 bg-[#172358]/10 text-[#172358] rounded-xl text-xs font-black uppercase tracking-wider mt-2">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#172358] text-white border-b border-[#172358]">
                                    {bulkActions.length > 0 && (
                                        <th className="px-6 py-4 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                checked={allCurrentSelected}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-slate-300 text-[#172358] focus:ring-[#172358]"
                                            />
                                        </th>
                                    )}
                                    {visibleColumns.map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => col.sortable && handleSortClick(col.key)}
                                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-wider text-blue-200 ${
                                                col.sortable ? 'cursor-pointer select-none hover:text-white' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>{col.header}</span>
                                                {col.sortable && (
                                                    <span className="text-blue-300">
                                                        {sortKey === col.key ? (
                                                            sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                        ) : (
                                                            <ArrowUpDown size={12} className="opacity-40" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    {rowActions && <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-wider text-blue-200">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedData.map((row, idx) => {
                                    const rId = getRowId(row, idx);
                                    const isSelected = selectedRowIds.has(rId);

                                    return (
                                        <tr
                                            key={rId}
                                            onClick={() => onRowClick && onRowClick(row)}
                                            className={`group transition-all hover:bg-[#172358]/[0.03] ${
                                                onRowClick ? 'cursor-pointer' : ''
                                            } ${isSelected ? 'bg-[#172358]/5 border-l-4 border-l-[#172358]' : ''}`}
                                        >
                                            {bulkActions.length > 0 && (
                                                <td className="px-6 py-4 w-12 text-center" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectRow(rId)}
                                                        className="w-4 h-4 rounded border-slate-300 text-[#172358] focus:ring-[#172358]"
                                                    />
                                                </td>
                                            )}

                                            {visibleColumns.map(col => (
                                                <td key={col.key} className="px-6 py-4 text-xs font-semibold text-slate-800">
                                                    {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                                                </td>
                                            ))}

                                            {rowActions && (
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <RowActionMenu actions={rowActions(row)} />
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                {sortedData.length > 0 && (
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-500">
                                Showing <span className="font-black text-slate-900">{(currentPage - 1) * pageSize + 1}</span>–
                                <span className="font-black text-slate-900">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
                                <span className="font-black text-slate-900">{sortedData.length}</span> records
                            </span>

                            {/* Page size dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Per Page:</span>
                                <select
                                    value={pageSize}
                                    onChange={e => setPageSize(Number(e.target.value))}
                                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#172358]"
                                >
                                    {pageSizeOptions.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Page Selector Pills */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#172358] hover:text-[#172358] transition-all cursor-pointer"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                                    if (pNum > totalPages) pNum = totalPages - (Math.min(5, totalPages) - i - 1);
                                    if (pNum < 1) pNum = i + 1;

                                    return (
                                        <button
                                            key={pNum}
                                            onClick={() => setCurrentPage(pNum)}
                                            className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                currentPage === pNum
                                                    ? 'bg-[#172358] text-white shadow-md shadow-[#172358]/20'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-[#172358]/40'
                                            }`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#172358] hover:text-[#172358] transition-all cursor-pointer"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
