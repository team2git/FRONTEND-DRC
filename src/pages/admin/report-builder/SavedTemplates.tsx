import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bookmark,
  Trash2,
  Search,
  Users,
  Sparkles,
  Play,
  SlidersHorizontal,
  UserCheck,
  Share2,
} from 'lucide-react';
import type { ReportTemplate, DataSource } from './types';
import { deleteTemplate } from '../../../api/reportBuilderApi';
import { toast } from 'react-toastify';

interface Props {
  templates: ReportTemplate[];
  sources: DataSource[];
  onLoadTemplate: (template: ReportTemplate, autoRun?: boolean) => void;
  onRefresh: () => void;
  currentUserId?: string;
}

export const SavedTemplates: React.FC<Props> = ({
  templates,
  sources,
  onLoadTemplate,
  onRefresh,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'shared' | 'mine'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCreatorId = (t: ReportTemplate) => {
    if (typeof t.createdBy === 'object' && t.createdBy !== null) {
      return t.createdBy._id;
    }
    return t.createdBy;
  };

  const getCreatorName = (t: ReportTemplate) => {
    if (typeof t.createdBy === 'object' && t.createdBy !== null && t.createdBy.fullname) {
      return t.createdBy.fullname;
    }
    return null;
  };

  const filtered = templates.filter((t) => {
    const creatorId = getCreatorId(t);
    const isMine = Boolean(currentUserId && creatorId === currentUserId);
    const isShared = t.isShared;

    if (tab === 'mine' && !isMine) return false;
    if (tab === 'shared' && (!isShared || isMine)) return false;

    const query = search.toLowerCase();
    const creatorName = getCreatorName(t)?.toLowerCase() || '';
    return (
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      t.source.toLowerCase().includes(query) ||
      creatorName.includes(query)
    );
  });

  const sharedCount = templates.filter((t) => t.isShared && getCreatorId(t) !== currentUserId).length;
  const myCount = templates.filter((t) => getCreatorId(t) === currentUserId).length;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      setDeletingId(id);
      await deleteTemplate(id);
      toast.success('Template deleted');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 shadow-sm space-y-3 font-outfit">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">Report Presets</h3>
            <p className="text-[10px] text-slate-400">Saved &amp; Shared Reports</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
          {templates.length}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
            tab === 'all'
              ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          All ({templates.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('shared')}
          className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
            tab === 'shared'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Share2 className="w-3 h-3" /> Shared ({sharedCount})
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
            tab === 'mine'
              ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Mine ({myCount})
        </button>
      </div>

      {/* Search Filter */}
      {templates.length > 2 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates or authors..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500">
            <Sparkles className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-brand-500" />
            <p className="text-xs font-semibold">No templates found</p>
            <p className="text-[10px] mt-0.5">
              {tab === 'shared'
                ? 'No shared templates from team members yet'
                : 'Build a report and click "Save as Preset"'}
            </p>
          </div>
        ) : (
          filtered.map((tmpl) => {
            const src = sources.find((s) => s.key === tmpl.source);
            const creatorId = getCreatorId(tmpl);
            const isMine = Boolean(currentUserId && creatorId === currentUserId);
            const creatorName = getCreatorName(tmpl);

            return (
              <div
                key={tmpl._id}
                className="group relative p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 hover:border-brand-300 dark:hover:border-brand-700 transition"
              >
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {tmpl.name}
                      </h4>
                      {tmpl.isShared && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                          <Users className="w-2.5 h-2.5" />
                          Shared
                        </span>
                      )}
                    </div>

                    {creatorName && !isMine && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5 text-brand-600 shrink-0" />
                        Shared by <strong className="font-medium text-slate-700 dark:text-slate-300">{creatorName}</strong>
                      </p>
                    )}

                    {tmpl.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {tmpl.description}
                      </p>
                    )}
                  </div>

                  {isMine && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(tmpl._id, e)}
                      disabled={deletingId === tmpl._id}
                      title="Delete your template"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap text-[10px]">
                  <span
                    className="font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${src?.color || '#143f84'}18`,
                      color: src?.color || '#143f84',
                    }}
                  >
                    {src?.label || tmpl.source}
                  </span>
                  {tmpl.groupBy && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium">
                      By: {tmpl.groupBy}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium uppercase">
                    {tmpl.chartType || 'Table'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => onLoadTemplate(tmpl, true)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] shadow-xs transition cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Run Report
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadTemplate(tmpl, false)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5" />
                    Config
                  </button>
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/report-builder/edit/${tmpl._id}`)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold text-[10px] hover:bg-brand-50 dark:hover:bg-brand-950/40 transition cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
