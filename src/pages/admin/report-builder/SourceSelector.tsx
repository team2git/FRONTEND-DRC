import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Home,
  MapPin,
  Users,
  Users2,
  Building2,
  Phone,
  Bell,
  FileText,
  ClipboardList,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FolderKanban,
  Activity,
} from 'lucide-react';
import type { DataSource } from './types';

interface Props {
  sources: DataSource[];
  selected: string;
  onSelect: (key: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  AlertTriangle,
  Home,
  MapPin,
  Users,
  Users2,
  Building2,
  Phone,
  Bell,
  FileText,
  ClipboardList,
  Search,
};

const CATEGORIES = [
  { id: 'all', label: 'All Modules', icon: Sparkles },
  { id: 'emergency', label: 'Emergency & Incidents', icon: ShieldAlert, keys: ['incident_reports', 'emergency_contacts', 'alert_subscriptions', 'inspection_requests'] },
  { id: 'assessments', label: 'Surveys & Field Data', icon: FolderKanban, keys: ['household_profiles', 'woreda_assessments', 'form_responses'] },
  { id: 'admin', label: 'Organization & Users', icon: Activity, keys: ['users', 'teams', 'organizations', 'audit_logs'] },
];

export const SourceSelector: React.FC<Props> = ({ sources, selected, onSelect }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSources = useMemo(() => {
    return sources.filter((src) => {
      // Category filter
      if (activeCategory !== 'all') {
        const cat = CATEGORIES.find((c) => c.id === activeCategory);
        if (cat?.keys && !cat.keys.includes(src.key)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          src.label.toLowerCase().includes(q) ||
          src.description.toLowerCase().includes(q) ||
          src.fields.some((f) => f.label.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sources, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Select System Dataset</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {sources.length} Available
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose any data domain to start querying records, building visual charts, or exporting data.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets or fields..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer
                ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dataset Grid */}
      {filteredSources.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <p className="text-sm font-semibold text-slate-500">No datasets found matching "{searchQuery}"</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-2 text-xs font-bold text-brand-600 hover:underline cursor-pointer"
          >
            Reset search &amp; filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSources.map((src) => {
            const Icon = ICON_MAP[src.icon] || FileText;
            const isSelected = selected === src.key;

            return (
              <div
                key={src.key}
                onClick={() => onSelect(src.key)}
                className={`
                  group relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between
                  hover:scale-[1.02] hover:shadow-xl
                  ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 shadow-lg shadow-brand-900/10 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50/60 dark:hover:bg-slate-800'
                  }
                `}
              >
                <div>
                  {/* Top Bar: Icon + Status */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs"
                      style={{ backgroundColor: `${src.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: src.color }} />
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/60 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${src.color}15`, color: src.color }}
                      >
                        {src.fields.length} Fields
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`font-black text-sm mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors ${
                      isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {src.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {src.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {src.filters.length} Filter Options
                  </span>
                  <span className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                    Configure <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
