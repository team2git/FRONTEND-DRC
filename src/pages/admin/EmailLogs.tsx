import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Mail, Inbox, Send, Edit3, Trash2, Search, RefreshCw,
  Plus, AlertCircle, Clock, User, X, CheckCircle,
  ChevronDown, AtSign, FileText,
  Tag, Users, Paperclip, Hash
} from 'lucide-react';
import PageMeta from '../../components/common/PageMeta';
import {
  getEmailLogs,
  resendEmail,
  createManualEmail,
  moveToFolder,
  EmailLog,
} from '../../api/emailLogService';
import { Modal } from '../../components/ui/modal';
import { toast } from 'react-toastify';

// ─── Email Tag Input Component ────────────────────────────────────────────────
function EmailTagInput({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
  error,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (email: string) => void;
  onRemove: (index: number) => void;
  error?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const addTag = (value: string) => {
    const emails = value.split(/[,;\s]+/).filter(Boolean);
    emails.forEach((email) => {
      const trimmed = email.trim();
      if (trimmed && validateEmail(trimmed) && !tags.includes(trimmed)) {
        onAdd(trimmed);
      } else if (trimmed && !validateEmail(trimmed)) {
        toast.warning(`"${trimmed}" is not a valid email address`);
      }
    });
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', 'Tab', ' '].includes(e.key)) {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        className={`flex flex-wrap gap-2 min-h-[48px] px-3 py-2 rounded-xl border cursor-text transition-all ${
          error
            ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/15'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[12px] font-medium"
          >
            <AtSign className="w-3 h-3 opacity-60" />
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              className="w-3.5 h-3.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-center transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
          placeholder={tags.length === 0 ? placeholder : 'Add another...'}
          className="flex-1 min-w-[160px] outline-none bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-[11px] text-slate-400 mt-1">
        Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">Enter</kbd> or{' '}
        <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">,</kbd> to add each email
      </p>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string; dot: string }> = {
    sent:    { label: 'Sent',    cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    failed:  { label: 'Failed',  cls: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
    pending: { label: 'Pending', cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-400' },
    read:    { label: 'Read',    cls: 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
    unread:  { label: 'Unread',  cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'draft' | 'trash'>('sent');
  const [refresh, setRefresh] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [sendMode, setSendMode] = useState<'single' | 'multiple'>('single');
  const [singleTo, setSingleTo] = useState('');
  const [multiTo, setMultiTo] = useState<string[]>([]);
  const [ccTags, setCcTags] = useState<string[]>([]);
  const [bccTags, setBccTags] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => { fetchLogs(); }, [refresh, activeFolder]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getEmailLogs({ folder: activeFolder, search: searchTerm || undefined });
      setLogs(data);
    } catch {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const resetCompose = () => {
    setSingleTo(''); setMultiTo([]); setCcTags([]); setBccTags([]);
    setSubject(''); setBody(''); setShowCcBcc(false);
    setSendMode('single'); setFieldErrors({});
  };

  const validateCompose = () => {
    const errors: Record<string, string> = {};
    const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    if (sendMode === 'single') {
      if (!singleTo.trim()) errors.to = 'Recipient is required';
      else if (!isEmailValid(singleTo)) errors.to = 'Enter a valid email address';
    } else {
      if (multiTo.length === 0) errors.to = 'Add at least one recipient';
    }
    if (!subject.trim()) errors.subject = 'Subject is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildToField = () => {
    const primary = sendMode === 'single' ? [singleTo.trim()] : multiTo;
    return [...primary, ...ccTags, ...bccTags].join(', ');
  };

  const handleComposeAction = async (action: 'send' | 'draft') => {
    if (!validateCompose()) return;
    setSending(true);
    try {
      await createManualEmail({ to: buildToField(), subject: subject.trim(), body, action });
      toast.success(action === 'send' ? '✉️ Email sent successfully' : '💾 Draft saved');
      setShowCompose(false);
      resetCompose();
      setRefresh((p) => p + 1);
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleMoveFolder = async (id: string, folder: string) => {
    try {
      await moveToFolder(id, folder);
      toast.info(`Moved to ${folder}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
      if (selectedLog?._id === id) setSelectedLog(null);
    } catch { toast.error('Move failed'); }
  };

  const handleResend = async (id: string) => {
    try {
      await resendEmail(id);
      toast.success('Email resent successfully');
      setRefresh((p) => p + 1);
    } catch { toast.error('Resend failed'); }
  };

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === 'sent').length,
    pending: logs.filter((l) => l.status === 'pending' || l.folder === 'draft').length,
    failed: logs.filter((l) => l.status === 'failed').length,
  };

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent',  label: 'Sent',  icon: Send  },
    { id: 'draft', label: 'Drafts', icon: Edit3 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ] as const;

  const statCards = [
    { label: 'Total',   value: stats.total,   icon: Mail,        color: 'blue'    },
    { label: 'Sent',    value: stats.sent,     icon: CheckCircle, color: 'emerald' },
    { label: 'Pending', value: stats.pending,  icon: Clock,       color: 'amber'   },
    { label: 'Failed',  value: stats.failed,   icon: AlertCircle, color: 'rose'    },
  ];

  const colorMap: Record<string, string> = {
    blue:    'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    rose:    'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <PageMeta title="Email Logs | IDRMIS" description="Email communication management" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Email Logs
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-12">
              Track and manage all outbound email communications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              onClick={() => { setShowCompose(true); resetCompose(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Compose Email
            </button>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[s.color]}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Controls: Search + Folder Tabs ─────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-4 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient or subject…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-600 transition"
            />
          </div>

          {/* Folder Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeFolder === f.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Email Table ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-0 text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[100px]">ID</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[30%]">Recipient</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Subject</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[130px] hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[100px] text-center">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full w-14" /></td>
                      <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4" /></td>
                      <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full w-full" /></td>
                      <td className="px-5 py-4 hidden sm:table-cell"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full w-20" /></td>
                      <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full w-16 mx-auto" /></td>
                      <td className="px-5 py-4" />
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400">No emails in this folder</p>
                        <p className="text-sm text-slate-400">Emails will appear here once they are sent</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          <Hash className="w-3 h-3" />
                          {log._id.slice(-5).toUpperCase()}
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {log.recipient.split(',')[0].trim()}
                              {log.recipient.split(',').length > 1 && (
                                <span className="ml-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                  +{log.recipient.split(',').length - 1}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 capitalize">{log.type}</p>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate font-medium">
                          {log.subject}
                        </p>
                      </td>

                      {/* Date — hidden on mobile */}
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[12px] font-medium">
                            {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          {log.status === 'failed' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResend(log._id); }}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition"
                              title="Resend"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveFolder(log._id, 'trash'); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {logs.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{logs.length}</span> emails
              </p>
              <span className="text-xs text-slate-400 capitalize">Folder: {activeFolder}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── View Email Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} className="max-w-2xl w-[95%]">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Details</h3>
                {selectedLog && <StatusBadge status={selectedLog.status} />}
              </div>
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedLog && (
            <div className="p-6 space-y-4">
              {/* Subject line */}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedLog.subject}</h2>

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedLog.recipient}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="capitalize">{selectedLog.type}</span>
                </span>
              </div>

              {/* Body */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-[1.8] whitespace-pre-wrap">
                  {selectedLog.body || 'No message body'}
                </p>
              </div>

              {/* Error block */}
              {selectedLog.error && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-1">Delivery Error</p>
                    <code className="text-xs text-rose-500 dark:text-rose-400 font-mono">{selectedLog.error}</code>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Close
                </button>
                {selectedLog.status === 'failed' && (
                  <button
                    onClick={() => { handleResend(selectedLog._id); setSelectedLog(null); }}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                  >
                    Resend Email
                  </button>
                )}
                <button
                  onClick={() => { handleMoveFolder(selectedLog._id, 'trash'); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Compose Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showCompose} onClose={() => { setShowCompose(false); resetCompose(); }} className="max-w-2xl w-[95%]">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">

          {/* Compose Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Compose Email</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Send to one or multiple recipients</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Send mode toggle */}
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSendMode('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    sendMode === 'single'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('multiple')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    sendMode === 'multiple'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  Multiple
                </button>
              </div>
              <button
                onClick={() => { setShowCompose(false); resetCompose(); }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compose Body */}
          <div className="p-6 space-y-5">

            {/* To Field */}
            {sendMode === 'single' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  To
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={singleTo}
                    onChange={(e) => { setSingleTo(e.target.value); setFieldErrors((p) => ({ ...p, to: '' })); }}
                    placeholder="recipient@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${
                      fieldErrors.to
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-400 dark:focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.to && <p className="text-xs text-red-500 mt-1">{fieldErrors.to}</p>}
              </div>
            ) : (
              <EmailTagInput
                label="To"
                placeholder="Type email and press Enter…"
                tags={multiTo}
                onAdd={(e) => { setMultiTo((p) => [...p, e]); setFieldErrors((p) => ({ ...p, to: '' })); }}
                onRemove={(i) => setMultiTo((p) => p.filter((_, idx) => idx !== i))}
                error={fieldErrors.to}
              />
            )}

            {/* CC / BCC Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCcBcc ? 'rotate-180' : ''}`} />
                {showCcBcc ? 'Hide' : 'Add'} CC / BCC
              </button>
            </div>

            {/* CC / BCC fields */}
            {showCcBcc && (
              <div className="space-y-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                <EmailTagInput
                  label="CC"
                  placeholder="cc@example.com"
                  tags={ccTags}
                  onAdd={(e) => setCcTags((p) => [...p, e])}
                  onRemove={(i) => setCcTags((p) => p.filter((_, idx) => idx !== i))}
                />
                <EmailTagInput
                  label="BCC"
                  placeholder="bcc@example.com"
                  tags={bccTags}
                  onAdd={(e) => setBccTags((p) => [...p, e])}
                  onRemove={(i) => setBccTags((p) => p.filter((_, idx) => idx !== i))}
                />
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setFieldErrors((p) => ({ ...p, subject: '' })); }}
                  placeholder="Email subject line"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${
                    fieldErrors.subject
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-400 dark:focus:border-blue-600'
                  }`}
                />
              </div>
              {fieldErrors.subject && <p className="text-xs text-red-500 mt-1">{fieldErrors.subject}</p>}
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Message
                </label>
                <span className="text-[11px] text-slate-400">{body.length} chars</span>
              </div>
              <textarea
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-600 resize-none transition leading-relaxed"
              />
            </div>

            {/* Summary bar */}
            {(sendMode === 'multiple' && multiTo.length > 0) || ccTags.length > 0 || bccTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-slate-500 dark:text-slate-400">
                {sendMode === 'multiple' && multiTo.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <strong>{multiTo.length}</strong> recipient{multiTo.length > 1 ? 's' : ''}
                  </span>
                )}
                {ccTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">CC:</span> {ccTags.length}
                  </span>
                )}
                {bccTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">BCC:</span> {bccTags.length}
                  </span>
                )}
              </div>
            ) : null}

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Paperclip className="w-4 h-4" />
                <span className="text-xs">No attachments</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleComposeAction('draft')}
                  disabled={sending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleComposeAction('send')}
                  disabled={sending}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-md shadow-blue-500/25 transition disabled:opacity-70"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
