import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HelpArticle, fetchHelpArticles } from '@/services/helpService';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router';
import {
  X,
  Search,
  BookOpen,
  Lock,
  Globe,
  Tag,
  HelpCircle,
  Clock,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ChevronRight,
  FileText,
  AlertTriangle,
  Info,
  Lightbulb,
  List,
  Hash,
  CornerDownRight,
  User,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'General': <Info className="w-3.5 h-3.5" />,
  'Live Dashboard': <Hash className="w-3.5 h-3.5" />,
  'Admin Guides': <Settings className="w-3.5 h-3.5" />,
  'Surveys': <FileText className="w-3.5 h-3.5" />,
  'DRM Operations': <AlertTriangle className="w-3.5 h-3.5" />,
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'General': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  'Live Dashboard': 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  'Admin Guides': 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  'Surveys': 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  'DRM Operations': 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
};

export const HelpCenterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAdmin = useMemo(() => {
    return (
      user?.accessLevel === 'super_admin' ||
      user?.roles?.some((r) =>
        ['admin', 'super admin', 'superadmin', 'super_admin', 'branch admin', 'branch_admin'].includes(
          (r.name || '').toLowerCase()
        )
      )
    );
  }, [user]);

  // Load articles when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchHelpArticles();
        if (isMounted) {
          setArticles(data);
          if (data.length > 0) setSelectedArticle(data[0]);
        }
      } catch (err) {
        console.error('Failed to load help articles:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    // Focus search on open
    setTimeout(() => searchRef.current?.focus(), 100);

    return () => { isMounted = false; };
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const publishedArticles = useMemo(() => {
    return articles.filter((a) => !a.status || a.status === 'published');
  }, [articles]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    publishedArticles.forEach((a) => { if (a.category) cats.add(a.category); });
    return ['all', ...Array.from(cats)];
  }, [publishedArticles]);

  const filteredArticles = useMemo(() => {
    return publishedArticles.filter((art) => {
      const matchCat = selectedCategory === 'all' || art.category === selectedCategory;
      if (!matchCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        (art.summary || '').toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        (art.tags?.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [publishedArticles, selectedCategory, search]);

  useEffect(() => {
    if (filteredArticles.length > 0 && (!selectedArticle || !filteredArticles.some((a) => a._id === selectedArticle._id))) {
      setSelectedArticle(filteredArticles[0]);
    }
  }, [filteredArticles, selectedArticle]);

  // When article changes, scroll reader to top and clear highlight
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    setHighlightedText('');
  }, [selectedArticle]);

  // Track text selection for Copy Highlight
  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setHighlightedText(selection.toString().trim());
    } else {
      setHighlightedText('');
    }
  }, []);

  // Copy full article content
  const handleCopyArticle = useCallback(async () => {
    if (!selectedArticle) return;
    try {
      await navigator.clipboard.writeText(
        `${selectedArticle.title}\n\n${selectedArticle.summary ? selectedArticle.summary + '\n\n' : ''}${selectedArticle.content}`
      );
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2200);
    } catch { /* silent */ }
  }, [selectedArticle]);

  // Copy highlighted text
  const handleCopyHighlight = useCallback(async () => {
    if (!highlightedText) return;
    try {
      await navigator.clipboard.writeText(highlightedText);
      setCopiedId('highlight');
      setTimeout(() => { setCopiedId(null); setHighlightedText(''); }, 2000);
    } catch { /* silent */ }
  }, [highlightedText]);

  // Copy a specific code/step block
  const handleCopyBlock = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* silent */ }
  }, []);

  if (!isOpen) return null;

  // ─── Rich Markdown Renderer ────────────────────────────────────────────────
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();

      // Empty line → spacer
      if (!trimmed) {
        elements.push(<div key={i} className="h-3" />);
        i++;
        continue;
      }

      // H3 ###
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4);
        elements.push(
          <div key={i} className="flex items-center gap-3 mt-8 mb-4 pb-3 border-b-2 border-blue-100 dark:border-blue-900/50">
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">{text}</h3>
          </div>
        );
        i++;
        continue;
      }

      // H4 ####
      if (trimmed.startsWith('#### ')) {
        const text = trimmed.slice(5);
        elements.push(
          <h4 key={i} className="flex items-center gap-2 mt-5 mb-2 text-sm font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
            {text}
          </h4>
        );
        i++;
        continue;
      }

      // H2 ##
      if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3);
        elements.push(
          <h2 key={i} className="mt-10 mb-4 text-xl font-black text-slate-900 dark:text-white tracking-tight">{text}</h2>
        );
        i++;
        continue;
      }

      // Alert/Quote blocks > **NOTE**: or > **WARNING**: or plain >
      if (trimmed.startsWith('> ')) {
        const inner = trimmed.slice(2);
        const isWarning = inner.toLowerCase().includes('warning') || inner.toLowerCase().includes('caution');
        const isNote = inner.toLowerCase().includes('note') || inner.toLowerCase().includes('important');
        const isTip = inner.toLowerCase().includes('tip') || inner.toLowerCase().includes('hint');

        let blockStyle = 'bg-sky-50 dark:bg-sky-950/40 border-sky-400/50 text-sky-800 dark:text-sky-300';
        let Icon = <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;

        if (isWarning) {
          blockStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400/50 text-rose-800 dark:text-rose-300';
          Icon = <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
        } else if (isNote) {
          blockStyle = 'bg-amber-50 dark:bg-amber-950/40 border-amber-400/50 text-amber-800 dark:text-amber-300';
          Icon = <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
        } else if (isTip) {
          blockStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400/50 text-emerald-800 dark:text-emerald-300';
          Icon = <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
        }

        elements.push(
          <div key={i} className={`flex items-start gap-2.5 my-3 p-4 rounded-xl border-l-4 ${blockStyle}`}>
            {Icon}
            <span className="text-sm font-medium leading-relaxed">{inner}</span>
          </div>
        );
        i++;
        continue;
      }

      // Step bullets (- **Step N:** or - Number.)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.slice(2);
        const blockId = `block-${i}`;
        // Detect inline bold **text**
        const renderInline = (text: string) => {
          const parts = text.split(/(\*\*[^*]+\*\*)/g);
          return parts.map((p, idx) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">{p.slice(2, -2)}</strong>
              : <span key={idx}>{p}</span>
          );
        };

        elements.push(
          <div key={i} className="flex items-start gap-3 py-1 group">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <div className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {renderInline(itemText)}
            </div>
            <button
              type="button"
              onClick={() => handleCopyBlock(itemText, blockId)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              title="Copy this step"
            >
              {copiedId === blockId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
        i++;
        continue;
      }

      // Numbered list  1. 2. etc.
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        const text = numberedMatch[2];
        const blockId = `num-${i}`;
        elements.push(
          <div key={i} className="flex items-start gap-3 py-1.5 group">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-black mt-0.5 shadow-sm">
              {num}
            </div>
            <div className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
              {text}
            </div>
            <button
              type="button"
              onClick={() => handleCopyBlock(text, blockId)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              title="Copy this step"
            >
              {copiedId === blockId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
        i++;
        continue;
      }

      // Regular paragraph with inline bold support
      const renderInlinePara = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((p, idx) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">{p.slice(2, -2)}</strong>
            : <span key={idx}>{p}</span>
        );
      };

      elements.push(
        <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-[1.85] mb-1">
          {renderInlinePara(trimmed)}
        </p>
      );
      i++;
    }

    return <>{elements}</>;
  };

  // ─── Modal Layout ─────────────────────────────────────────────────────────

  const sidebarList = (
    <div className="w-full md:w-72 lg:w-80 xl:w-96 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Sidebar Search */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/60">
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search help articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm py-2.5 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition shadow-sm"
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const colorClass = cat !== 'all' ? CATEGORY_COLORS[cat] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : '';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize transition shrink-0 flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30'
                    : `${colorClass} hover:opacity-80`
                }`}
              >
                {cat !== 'all' && CATEGORY_ICONS[cat]}
                {cat === 'all' ? 'All Topics' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Article List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loading ? (
          <div className="space-y-2 px-2 pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="animate-pulse space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <HelpCircle className="w-7 h-7 opacity-50 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No guides found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try different keywords or clear filters</p>
            </div>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all'); }}
              className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
            >
              ← Clear all filters
            </button>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isSelected = selectedArticle?._id === art._id;
            const catColor = CATEGORY_COLORS[art.category] || 'bg-slate-100 dark:bg-slate-800 text-slate-500';
            return (
              <div
                key={art._id}
                onClick={() => setSelectedArticle(art)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 group ${
                  isSelected
                    ? 'border-blue-500/60 bg-blue-500/8 dark:bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/20'
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white dark:hover:bg-slate-900/80 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${catColor}`}>
                    {CATEGORY_ICONS[art.category]}
                    {art.category}
                  </span>
                  {art.visibility === 'admin_only' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <Lock className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>

                <h4 className={`text-[13px] font-bold leading-snug line-clamp-2 transition-colors ${
                  isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`}>
                  {art.title}
                </h4>

                {art.summary && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-normal">
                    {art.summary}
                  </p>
                )}

                {isSelected && (
                  <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    <span>Reading</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Stats */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>{filteredArticles.length} of {publishedArticles.length} guides</span>
        {isAdmin && (
          <Link
            to="/admin/help"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-bold hover:underline transition"
          >
            <Settings className="w-3 h-3" />
            <span>Manage</span>
          </Link>
        )}
      </div>
    </div>
  );

  const articleReader = (
    <div
      ref={contentRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 scroll-smooth"
      onMouseUp={handleTextSelect}
    >
      {selectedArticle ? (
        <div className="max-w-2xl mx-auto px-8 md:px-14 py-10 md:py-14">

          {/* Article Topbar: badges + copy */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wide ${CATEGORY_COLORS[selectedArticle.category] || 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                {CATEGORY_ICONS[selectedArticle.category]}
                {selectedArticle.category}
              </span>
              {selectedArticle.visibility === 'admin_only' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <Lock className="w-2.5 h-2.5" /> Admin Only
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <Globe className="w-2.5 h-2.5" /> Public
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyArticle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                copySuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Copy full article content"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Article Title */}
          <h1 className="text-[1.75rem] md:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
            {selectedArticle.title}
          </h1>

          {/* Summary */}
          {selectedArticle.summary && (
            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-[1.75] mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {selectedArticle.summary}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400 mb-8 pb-7 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Updated {new Date(selectedArticle.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 shrink-0" />
              {selectedArticle.authorName || 'System Administrator'}
            </span>
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <span className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3 h-3 shrink-0" />
                {selectedArticle.tags.map((t, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {t}
                  </span>
                ))}
              </span>
            )}
          </div>

          {/* Copy Highlight Floating Action */}
          {highlightedText && (
            <div className="sticky top-4 z-10 flex justify-center mb-5">
              <button
                type="button"
                onClick={handleCopyHighlight}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition animate-in slide-in-from-top-2 duration-150"
              >
                {copiedId === 'highlight' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedId === 'highlight' ? 'Copied!' : `Copy "${highlightedText.slice(0, 30)}${highlightedText.length > 30 ? '...' : ''}"`}
              </button>
            </div>
          )}

          {/* Article Content Body */}
          <div className="space-y-1">
            {renderContent(selectedArticle.content)}
          </div>

          {/* Footer Spacer */}
          <div className="h-20" />
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 p-10">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center">
            <BookOpen className="w-9 h-9 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-slate-600 dark:text-slate-400">Select a guide to start reading</p>
            <p className="text-sm text-slate-400 mt-1.5">Choose an article from the sidebar on the left</p>
          </div>
        </div>
      )}
    </div>
  );

  const innerModal = (
    <div
      className={`
        flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden
        ${isFullscreen ? 'h-screen w-screen' : 'h-full w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-black/20'}
      `}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              Help &amp; Knowledge Base
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
              {articles.length} guides available
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Maximize / Restore Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isFullscreen ? 'Restore to windowed view' : 'Maximize to full screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Breadcrumb row ─────────────────────────────────────────────────── */}
      {selectedArticle && (
        <div className="flex items-center gap-1.5 px-5 py-1.5 text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/30 shrink-0">
          <List className="w-3 h-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-400">All Topics</span>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-500 dark:text-slate-400">{selectedArticle.category}</span>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
          <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-xs">{selectedArticle.title}</span>
        </div>
      )}

      {/* ── Main Two-Column Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {sidebarList}
        {articleReader}
      </div>

      {/* ── Bottom status bar ───────────────────────────────────────────────── */}
      <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-400">
          Select text to copy a highlight &nbsp;·&nbsp; Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">Esc</kbd>{' '}
          to close
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999999]'
          : 'fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/50 backdrop-blur-sm'
      }
    >
      {isFullscreen ? innerModal : (
        <div className="w-full max-w-6xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {innerModal}
        </div>
      )}
    </div>,
    document.body
  );
};

export default HelpCenterModal;
