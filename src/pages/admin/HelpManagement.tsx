import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpArticle,
  CreateHelpArticlePayload,
  fetchAdminHelpArticles,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
} from '@/services/helpService';
import { toast } from 'react-toastify';
import {
  HelpCircle,
  Plus,
  Search,
  Lock,
  Globe,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  X,
  BookOpen,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlertTriangle,
  Lightbulb,
  Info,
  Minus,
  Eye,
  Code,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

// ─── Markdown Toolbar Actions ───────────────────────────────────────────────
interface ToolbarAction {
  label: string;
  icon: React.ReactNode;
  action: (text: string, selStart: number, selEnd: number) => { newText: string; newCursor: number };
  title: string;
  group?: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: 'H2', icon: <Heading2 className="w-4 h-4" />, title: 'Heading 2', group: 'heading',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'Heading';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\n## ${sel}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'H3', icon: <Heading3 className="w-4 h-4" />, title: 'Heading 3', group: 'heading',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'Section';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\n### ${sel}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'H4', icon: <span className="text-[11px] font-black">H4</span>, title: 'Heading 4', group: 'heading',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'Subsection';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\n#### ${sel}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Bold', icon: <Bold className="w-4 h-4" />, title: 'Bold text (Ctrl+B)', group: 'format',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'bold text';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `**${sel}**`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Italic', icon: <Italic className="w-4 h-4" />, title: 'Italic text (Ctrl+I)', group: 'format',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'italic text';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `*${sel}*`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Code', icon: <Code className="w-4 h-4" />, title: 'Inline code', group: 'format',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'code';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\`${sel}\``;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Bullet', icon: <List className="w-4 h-4" />, title: 'Bullet list', group: 'list',
    action: (text, s, e) => {
      const sel = text.slice(s, e);
      const before = text.slice(0, s);
      const after = text.slice(e);
      const lines = sel ? sel.split('\n').map(l => `- ${l}`).join('\n') : '- List item';
      const inserted = `\n${lines}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Ordered', icon: <ListOrdered className="w-4 h-4" />, title: 'Numbered list', group: 'list',
    action: (text, s, e) => {
      const sel = text.slice(s, e);
      const before = text.slice(0, s);
      const after = text.slice(e);
      const lines = sel ? sel.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n') : '1. Step one\n2. Step two\n3. Step three';
      const inserted = `\n${lines}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Note', icon: <Info className="w-4 h-4 text-sky-500" />, title: 'Info / Note block', group: 'alert',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'Important note or information here.';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\n> **Note:** ${sel}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Warning', icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, title: 'Warning block', group: 'alert',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'Warning: describe the caution or risk here.';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\n> **Warning:** ${sel}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Tip', icon: <Lightbulb className="w-4 h-4 text-amber-500" />, title: 'Tip / Hint block', group: 'alert',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'Helpful tip or best practice here.';
      const before = text.slice(0, s);
      const after = text.slice(e);
      const inserted = `\n> **Tip:** ${sel}\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
  {
    label: 'Divider', icon: <Minus className="w-4 h-4" />, title: 'Horizontal divider', group: 'misc',
    action: (text, s) => {
      const before = text.slice(0, s);
      const after = text.slice(s);
      const inserted = `\n---\n`;
      return { newText: before + inserted + after, newCursor: s + inserted.length };
    },
  },
];

// Reuse the same preview renderer logic from HelpCenterModal
const renderPreview = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const els: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) { els.push(<div key={i} className="h-2" />); i++; continue; }

    if (t.startsWith('### ')) {
      els.push(
        <h3 key={i} className="flex items-center gap-2 mt-6 mb-3 pb-2.5 border-b border-blue-100 dark:border-blue-900/40 text-base font-black text-slate-900 dark:text-white">
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" /> {t.slice(4)}
        </h3>
      );
    } else if (t.startsWith('#### ')) {
      els.push(<h4 key={i} className="mt-4 mb-1.5 text-sm font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{t.slice(5)}</h4>);
    } else if (t.startsWith('## ')) {
      els.push(<h2 key={i} className="mt-8 mb-3 text-xl font-black text-slate-900 dark:text-white">{t.slice(3)}</h2>);
    } else if (t.startsWith('> ')) {
      const inner = t.slice(2);
      const isW = inner.toLowerCase().includes('warning');
      const isTip = inner.toLowerCase().includes('tip');
      const style = isW
        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400/50 text-rose-800 dark:text-rose-200'
        : isTip
        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400/50 text-amber-800 dark:text-amber-200'
        : 'bg-sky-50 dark:bg-sky-950/40 border-sky-400/50 text-sky-800 dark:text-sky-200';
      const Icon = isW ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : isTip ? <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />;
      els.push(
        <div key={i} className={`flex items-start gap-2 my-2 p-3.5 rounded-xl border-l-4 ${style}`}>
          {Icon}<span className="text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: inner.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      );
    } else if (t.startsWith('- ') || t.startsWith('* ')) {
      els.push(
        <div key={i} className="flex items-start gap-2.5 py-0.5">
          <div className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-slate-900 dark:text-white">$1</strong>') }} />
        </div>
      );
    } else if (/^(\d+)\.\s/.test(t)) {
      const m = t.match(/^(\d+)\.\s+(.+)$/)!;
      els.push(
        <div key={i} className="flex items-start gap-2.5 py-0.5">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{m[1]}</div>
          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">{m[2]}</span>
        </div>
      );
    } else if (t === '---') {
      els.push(<hr key={i} className="my-4 border-slate-200 dark:border-slate-800" />);
    } else {
      els.push(
        <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-slate-900 dark:text-white">$1</strong>').replace(/\`([^`]+)\`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-mono">$1</code>') }} />
      );
    }
    i++;
  }
  return <>{els}</>;
};

// ─── Rich Markdown Editor Component ────────────────────────────────────────
interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const applyAction = useCallback((action: ToolbarAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const result = action.action(value, s, e);
    onChange(result.newText);
    // Restore cursor
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(result.newCursor, result.newCursor);
    }, 0);
  }, [value, onChange]);

  // Keyboard shortcuts inside textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); applyAction(TOOLBAR_ACTIONS.find(a => a.label === 'Bold')!); }
      if (e.key === 'i') { e.preventDefault(); applyAction(TOOLBAR_ACTIONS.find(a => a.label === 'Italic')!); }
    }
    // Auto-indent lists
    if (e.key === 'Enter') {
      const ta = e.currentTarget;
      const pos = ta.selectionStart;
      const currentLine = value.slice(0, pos).split('\n').pop() || '';
      const bulletMatch = currentLine.match(/^(\s*)(-|\*)\s/);
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (bulletMatch) {
        e.preventDefault();
        const insert = `\n${bulletMatch[1]}- `;
        const newVal = value.slice(0, pos) + insert + value.slice(pos);
        onChange(newVal);
        setTimeout(() => { ta.setSelectionRange(pos + insert.length, pos + insert.length); }, 0);
      } else if (numMatch) {
        e.preventDefault();
        const nextNum = parseInt(numMatch[2]) + 1;
        const insert = `\n${numMatch[1]}${nextNum}. `;
        const newVal = value.slice(0, pos) + insert + value.slice(pos);
        onChange(newVal);
        setTimeout(() => { ta.setSelectionRange(pos + insert.length, pos + insert.length); }, 0);
      }
    }
    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const pos = ta.selectionStart;
      const newVal = value.slice(0, pos) + '  ' + value.slice(pos);
      onChange(newVal);
      setTimeout(() => { ta.setSelectionRange(pos + 2, pos + 2); }, 0);
    }
  }, [value, onChange, applyAction]);

  const toolbarGroups = ['heading', 'format', 'list', 'alert', 'misc'];

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950/60">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolbarGroups.map((group, gi) => (
            <React.Fragment key={group}>
              {gi > 0 && <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />}
              {TOOLBAR_ACTIONS.filter(a => a.group === group).map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => { setTab('write'); applyAction(action); }}
                  title={action.title}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs font-bold"
                >
                  {action.icon}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Write / Preview toggle */}
        <div className="flex items-center rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 text-[11px] font-bold gap-0.5">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-2.5 py-1 rounded-md transition ${tab === 'write' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${tab === 'preview' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      {/* Editor / Preview body */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          required
          rows={18}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start writing markdown content...&#10;&#10;### Section Heading&#10;- Bullet point&#10;1. Numbered step&#10;> Note: Important note here."
          className="w-full p-4 text-[13px] font-mono leading-relaxed resize-none focus:outline-none bg-white dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 placeholder-slate-400 min-h-[400px]"
          spellCheck
        />
      ) : (
        <div className="p-5 min-h-[400px] overflow-y-auto space-y-1">
          {value.trim() ? (
            renderPreview(value)
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Eye className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">Write some content to see the preview</p>
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-mono">
        <span>{value.length} characters · {value.split('\n').length} lines</span>
        <span>Ctrl+B Bold · Ctrl+I Italic · Tab → indent</span>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const HelpManagement: React.FC = () => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateHelpArticlePayload>({
    title: '',
    category: 'General',
    summary: '',
    content: '',
    visibility: 'everyone',
    status: 'published',
    order: 0,
    tags: '',
  });

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminHelpArticles();
      setArticles(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load help articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => { if (a.category) set.add(a.category); });
    return ['all', ...Array.from(set)];
  }, [articles]);

  const stats = useMemo(() => ({
    total: articles.length,
    everyone: articles.filter((a) => a.visibility === 'everyone').length,
    adminOnly: articles.filter((a) => a.visibility === 'admin_only').length,
    drafts: articles.filter((a) => a.status === 'draft').length,
    published: articles.filter((a) => a.status === 'published').length,
  }), [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchCat = selectedCategory === 'all' || art.category === selectedCategory;
      const matchVis = selectedVisibility === 'all' || art.visibility === selectedVisibility;
      if (!matchCat || !matchVis) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return art.title.toLowerCase().includes(q) || (art.summary || '').toLowerCase().includes(q) || art.category.toLowerCase().includes(q);
    });
  }, [articles, selectedCategory, selectedVisibility, search]);

  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      category: 'General',
      summary: '',
      content: `### Overview\n\nDescribe what this guide covers and who it is for.\n\n### Step-by-Step Instructions\n\n1. Navigate to the relevant section in the sidebar\n2. Fill in the required fields\n3. Click **Save** or **Submit** to apply changes\n\n> **Note:** Add any important operational notes or cautions here.\n\n### Tips & Best Practices\n\n- Keep configurations consistent across sessions\n- Validate all inputs before saving`,
      visibility: 'everyone',
      status: 'published',
      order: articles.length + 1,
      tags: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: HelpArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      category: article.category || 'General',
      summary: article.summary || '',
      content: article.content,
      visibility: article.visibility,
      status: article.status,
      order: article.order || 0,
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning('Title and content are required');
      return;
    }
    try {
      setIsSubmitting(true);
      if (editingArticle) {
        await updateHelpArticle(editingArticle._id, formData);
        toast.success('Help guide updated successfully!');
      } else {
        await createHelpArticle(formData);
        toast.success('Help guide published successfully!');
      }
      setIsModalOpen(false);
      loadArticles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save help guide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"?`)) return;
    try {
      await deleteHelpArticle(id);
      toast.success('Help guide deleted');
      loadArticles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ─── Full-Screen Modal via Portal ─────────────────────────────────────────
  const modal = isModalOpen ? createPortal(
    <div className="fixed inset-0 z-[9999999] flex bg-black/60 backdrop-blur-sm overflow-hidden">
      {/* Sidebar Panel: Meta Fields */}
      <div className="w-80 xl:w-96 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-blue-500 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black">{editingArticle ? 'Edit Help Guide' : 'New Help Guide'}</h2>
              <p className="text-[11px] text-blue-100">Configure metadata and visibility</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/20 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id="help-guide-form" onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 flex-1">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Article Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. How to Conduct a Site Inspection"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 font-semibold transition"
            />
          </div>

          {/* Short Summary */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Short Summary</label>
            <textarea
              rows={2}
              placeholder="1-2 sentence description shown in article previews"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-300 resize-none transition"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Category <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Live Dashboard, Admin Guides, Surveys..."
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-200 transition"
            />
            {/* Quick category chips */}
            <div className="flex flex-wrap gap-1">
              {['General', 'Live Dashboard', 'Admin Guides', 'Surveys', 'DRM Operations'].map((cat) => (
                <button key={cat} type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition border ${formData.category === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. disaster, maps, field-survey"
              value={formData.tags as string}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-700 dark:text-slate-200 font-mono transition"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Sort Order Weight</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono transition"
            />
          </div>

          {/* Audience Visibility */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Audience Visibility <span className="text-rose-500">*</span></label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${formData.visibility === 'everyone' ? 'border-blue-500/60 bg-blue-500/8 dark:bg-blue-500/10 ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <input type="radio" name="visibility" value="everyone" checked={formData.visibility === 'everyone'}
                  onChange={() => setFormData({ ...formData, visibility: 'everyone' })} className="mt-1 accent-blue-600" />
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Visible to Everyone
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">All portal users, field staff, and visitors</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${formData.visibility === 'admin_only' ? 'border-amber-500/60 bg-amber-500/8 dark:bg-amber-500/10 ring-1 ring-amber-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <input type="radio" name="visibility" value="admin_only" checked={formData.visibility === 'admin_only'}
                  onChange={() => setFormData({ ...formData, visibility: 'admin_only' })} className="mt-1 accent-amber-500" />
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 dark:text-amber-400">
                    <Lock className="w-3.5 h-3.5" /> Restricted: Only Admin
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hidden from standard users, API-filtered</p>
                </div>
              </label>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Publication Status</label>
            <div className="flex gap-2">
              {(['published', 'draft'] as const).map((s) => (
                <button key={s} type="button"
                  onClick={() => setFormData({ ...formData, status: s })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${formData.status === s ? s === 'published' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-500 text-white border-slate-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>
                  {s === 'published' ? '✓ Published' : '○ Draft'}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Main Panel: Rich Markdown Editor */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {formData.title || 'Untitled Guide'}
              </p>
              <p className="text-[10px] text-slate-400">Markdown content editor — supports headings, lists, alerts, and bold text</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Cancel
            </button>
            <button type="submit" form="help-guide-form" disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              {isSubmitting ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /><span>{editingArticle ? 'Save Changes' : 'Publish Guide'}</span></>
              )}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <MarkdownEditor
            value={formData.content}
            onChange={(val) => setFormData({ ...formData, content: val })}
          />
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            <span className="font-bold">Markdown supported:</span> Use <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">### Heading</code>, <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">- bullet</code>, <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">1. step</code>, <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">**bold**</code>, <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">`code`</code>, and <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono">{`> Note/Warning/Tip`}</code> blocks.
          </p>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  // ─── Page Layout ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-screen-xl mx-auto">
      {modal}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Help &amp; Knowledge Base
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Author, categorize, and manage visibility for all documentation guides
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadArticles} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-2 shadow-md shadow-blue-500/25">
            <Plus className="w-4 h-4" />
            <span>New Help Guide</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Guides', value: stats.total, color: 'text-slate-900 dark:text-white', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Published', value: stats.published, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Drafts', value: stats.drafts, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900' },
          { label: 'Everyone', value: stats.everyone, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Admin Only', value: stats.adminOnly, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input type="text" placeholder="Search guides..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200">
          <option value="all">All Categories</option>
          {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={selectedVisibility} onChange={(e) => setSelectedVisibility(e.target.value)}
          className="text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200">
          <option value="all">All Visibility</option>
          <option value="everyone">🌐 Everyone</option>
          <option value="admin_only">🔒 Only Admin</option>
        </select>
        {(search || selectedCategory !== 'all' || selectedVisibility !== 'all') && (
          <button onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedVisibility('all'); }}
            className="text-xs font-bold text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap">
            ← Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:block">
          {filteredArticles.length} of {articles.length} guides
        </span>
      </div>

      {/* Articles Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-5 w-12 text-center">#</th>
                <th className="py-4 px-5">Title &amp; Summary</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Visibility</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Updated</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="w-6 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-4 px-5"><div className="space-y-1.5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" /><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" /></div></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 opacity-40 text-blue-400" />
                      </div>
                      <p className="font-bold text-slate-600 dark:text-slate-400">No help guides found</p>
                      <p className="text-sm">Try different search terms or create a new guide</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => (
                  <tr key={art._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition group">
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-300 dark:text-slate-700 text-xs">{art.order ?? 0}</td>
                    <td className="py-4 px-5 max-w-xs">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{art.title}</p>
                      {art.summary && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{art.summary}</p>}
                      <p className="text-[10px] text-slate-300 dark:text-slate-700 font-mono mt-0.5">/help/{art.slug}</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{art.category}</span>
                    </td>
                    <td className="py-4 px-5">
                      {art.visibility === 'admin_only' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-800/40">
                          <Lock className="w-3 h-3" /> Admin Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-800/40">
                          <Globe className="w-3 h-3" /> Everyone
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {art.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs font-mono text-slate-400">
                      {new Date(art.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleOpenEditModal(art)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(art._id, art.title)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition" title="Delete">
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
      </div>
    </div>
  );
};

export default HelpManagement;
