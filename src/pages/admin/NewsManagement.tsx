import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Trash2,
  Edit,
  Eye,
  Send,
  Upload,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pin,
  FolderPlus,
  LayoutGrid,
  List,
  Video,
  Archive
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageMeta from '@/components/common/PageMeta';
import { useAuth } from '@/context/AuthContext';
import { resolvePortalAssetUrl } from '@/utils/resolvePortalAssetUrl';
import {
  listAdminNews,
  createNews,
  updateNews,
  deleteNews,
  deleteNewsPermanently,
  submitNews,
  approveNews,
  rejectNews,
  pinNews,
  uploadNewsMedia,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  NewsItem
} from '@/api/newsService';

const DEFAULT_CATEGORIES = [
  'Announcements',
  'Disaster Risk Management',
  'Emergency Response',
  'Training',
  'Events',
  'Community',
  'Early Warning',
  'Climate',
  'Preparedness',
  'Recovery',
  'Technology'
];

export default function NewsManagement() {
  const { user } = useAuth();

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0
  });

  // Dynamic Categories State
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_news_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
        }
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });

  // Category Manager Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showInlineAddCategory, setShowInlineAddCategory] = useState(false);
  const [inlineCategoryInput, setInlineCategoryInput] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [previewItem, setPreviewItem] = useState<NewsItem | null>(null);

  // Reject Modal state
  const [rejectingItem, setRejectingItem] = useState<NewsItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    summary: '',
    content: '',
    category: 'Announcements',
    tags: '',
    location: '',
    mediaType: 'image' as 'image' | 'youtube' | 'video',
    coverImage: '',
    youtubeUrl: '',
    videoUrl: '',
    status: 'draft' as 'draft' | 'pending' | 'approved',
    isFeatured: false,
    allowComments: true,
    publishedAt: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Management Handlers
  const handleAddCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    if (categoriesList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Category already exists!');
      return;
    }
    const updated = [...categoriesList, trimmed];
    setCategoriesList(updated);
    try {
      localStorage.setItem('admin_news_categories', JSON.stringify(updated));
    } catch (e) {}
    toast.success(`Category "${trimmed}" added!`);
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (DEFAULT_CATEGORIES.includes(catToRemove)) {
      toast.warning('Default categories cannot be deleted');
      return;
    }
    const updated = categoriesList.filter(c => c !== catToRemove);
    setCategoriesList(updated);
    try {
      localStorage.setItem('admin_news_categories', JSON.stringify(updated));
    } catch (e) {}
    toast.success(`Category "${catToRemove}" removed`);
  };

  // Check RBAC permissions
  const userPerms = user?.permissions?.map((p: any) => (typeof p === 'string' ? p : p?.name || '').toLowerCase()) || [];
  const isSuperAdmin = user?.accessLevel === 'super_admin' || user?.roles?.some(r => ['superadmin', 'super admin', 'super_admin'].includes(r.name.toLowerCase()));
  const canApprove = isSuperAdmin || userPerms.includes('news_approve');
  const canCreate = isSuperAdmin || userPerms.includes('news_create');

  const fetchAdminNews = useCallback(async (pageNum = 1, status = activeTab, cat = selectedCategory, q = search) => {
    setLoading(true);
    try {
      const res = await listAdminNews({
        page: pageNum,
        limit: 15,
        status: status !== 'all' ? status : undefined,
        category: cat !== 'All' ? cat : undefined,
        q: q || undefined
      });
      setItems(res.docs || []);
      setTotalPages(res.totalPages || 1);
      if (res.statusCounts) setStatusCounts(res.statusCounts);
    } catch (err) {
      console.error('Error fetching admin news:', err);
      toast.error('Failed to load news management data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, search]);

  useEffect(() => {
    fetchAdminNews(page, activeTab, selectedCategory, search);
  }, [page, activeTab, selectedCategory, search, fetchAdminNews]);

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      summary: '',
      content: '',
      category: 'Announcements',
      tags: '',
      location: '',
      mediaType: 'image',
      coverImage: '',
      youtubeUrl: '',
      videoUrl: '',
      status: 'draft',
      isFeatured: false,
      allowComments: true,
      publishedAt: new Date().toISOString().split('T')[0]
    });
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      subtitle: item.subtitle || '',
      summary: item.summary || '',
      content: item.content || '',
      category: item.category || 'Announcements',
      tags: (item.tags || []).join(', '),
      location: item.location || '',
      mediaType: item.mediaType || (item.youtubeUrl ? 'youtube' : item.videoUrl ? 'video' : 'image'),
      coverImage: item.coverImage || '',
      youtubeUrl: item.youtubeUrl || '',
      videoUrl: item.videoUrl || '',
      status: (item.status === 'approved' ? 'approved' : item.status === 'pending' ? 'pending' : 'draft') as any,
      isFeatured: !!item.isFeatured,
      allowComments: item.allowComments !== false,
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : ''
    });
    setShowCreateModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadNewsMedia(file);
      setFormData(prev => ({ ...prev, coverImage: res.url }));
      toast.success('Cover image uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Article title and content are required');
      return;
    }

    setSubmittingAction(true);
    try {
      let finalCoverImage = formData.coverImage.trim();
      if (!finalCoverImage && formData.mediaType === 'youtube' && formData.youtubeUrl) {
        finalCoverImage = getYouTubeThumbnail(formData.youtubeUrl);
      }

      const payload: Partial<NewsItem> = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        location: formData.location.trim(),
        mediaType: formData.mediaType,
        coverImage: finalCoverImage,
        youtubeUrl: formData.youtubeUrl.trim(),
        videoUrl: formData.videoUrl.trim(),
        status: formData.status,
        isFeatured: formData.isFeatured,
        allowComments: formData.allowComments,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : undefined
      };

      if (editingItem) {
        await updateNews(editingItem._id, payload);
        toast.success('News article updated successfully!');
      } else {
        await createNews(payload);
        toast.success('News article created successfully!');
      }

      setShowCreateModal(false);
      resetForm();
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save news article');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await submitNews(id);
      toast.success('Article submitted for approval!');
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err) {
      toast.error('Failed to submit article');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveNews(id);
      toast.success('Article approved and published to public page!');
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err) {
      toast.error('Failed to approve article');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    setSubmittingAction(true);
    try {
      await rejectNews(rejectingItem._id, rejectionReason.trim());
      toast.info('Article rejected');
      setRejectingItem(null);
      setRejectionReason('');
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err) {
      toast.error('Failed to reject article');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this article?')) return;
    try {
      await deleteNews(id);
      toast.success('Article archived!');
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err) {
      toast.error('Failed to archive article');
    }
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE WARNING:\nAre you sure you want to PERMANENTLY DELETE "${title}"?\n\nThis article, its comments, and reactions will be deleted forever from MongoDB. This action CANNOT be undone.`)) return;
    try {
      await deleteNewsPermanently(id);
      toast.success('Article permanently deleted!');
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err) {
      toast.error('Failed to permanently delete article');
    }
  };

  const handleTogglePin = async (id: string, currentPin?: boolean) => {
    try {
      await pinNews(id, currentPin ? 'unpin' : 'pin');
      toast.success(currentPin ? 'Article unpinned' : 'Article pinned to top');
      fetchAdminNews(page, activeTab, selectedCategory, search);
    } catch (err) {
      toast.error('Failed to update pin status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> Pending Approval</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'archived':
        return <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><FileText className="w-3.5 h-3.5" /> Archived</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><Edit className="w-3.5 h-3.5" /> Draft</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-outfit">
      <PageMeta title="News Management & Approval Workflow | DRMIS Admin" description="Manage news articles, approval queues, publishing and public feed." />

      {/* --- HEADER TITLE & GLOBAL ACTIONS --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Newspaper className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Newsroom Desk</h1>
              <p className="text-xs text-slate-500 font-medium pt-0.5">
                Approval Workflow: <span className="font-bold text-slate-800">Draft → Submitted → Pending Approval → Approved / Published</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* View Public Portal */}
          <a
            href="/news"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
          >
            <span>View Public Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Manage Categories Button */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-2 px-4.5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-2xl border border-indigo-200/80 transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Manage Categories ({categoriesList.length})</span>
          </button>

          {/* Post New Article */}
          {canCreate && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Post New Article
            </button>
          )}
        </div>
      </div>

      {/* --- STATS SUMMARY DASHBOARD --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: 'all', label: 'All News', count: statusCounts.all, color: 'text-slate-900', bg: 'bg-white' },
          { key: 'draft', label: 'Drafts', count: statusCounts.draft, color: 'text-slate-600', bg: 'bg-white' },
          { key: 'pending', label: 'Pending Approval', count: statusCounts.pending, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { key: 'approved', label: 'Approved (Public)', count: statusCounts.approved, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'text-rose-600', bg: 'bg-rose-50/50' },
          { key: 'archived', label: 'Archived', count: statusCounts.archived, color: 'text-slate-400', bg: 'bg-white' }
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => {
              setActiveTab(stat.key as any);
              setPage(1);
            }}
            className={`p-4.5 rounded-3xl border transition-all text-left ${stat.bg} ${
              activeTab === stat.key ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.count || 0}</span>
          </button>
        ))}
      </div>

      {/* --- FILTER, SEARCH & VIEW MODE SWITCHER --- */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, category, tag..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full md:w-56 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="All">All Categories ({categoriesList.length})</option>
              {categoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchAdminNews(page, activeTab, selectedCategory, search)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA: GRID VIEW OR TABLE VIEW --- */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          Loading News Articles...
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No News Articles Found</h3>
          <p className="text-xs text-slate-500">No records match the current filter or search criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* --- VISUAL GRID CARDS VIEW --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => {
            const cover = resolvePortalAssetUrl(item.coverImage || (item.attachments && item.attachments[0]?.url));
            const isVideo = item.youtubeUrl || item.mediaType === 'youtube';

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card Cover Preview */}
                  <div className="h-48 bg-slate-950 relative overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Newspaper className="w-12 h-12 opacity-30" />
                      </div>
                    )}

                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg">
                          <Video className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black rounded-full">
                        {item.category}
                      </span>
                      {item.isFeatured && (
                        <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full">
                          FEATURED
                        </span>
                      )}
                      {item.isPinned && (
                        <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full">
                          PINNED
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {item.summary}
                      </p>
                    )}

                    {item.status === 'rejected' && item.rejectionReason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200/60 rounded-xl text-[11px] text-rose-700 font-medium italic">
                        Rejection Reason: {item.rejectionReason}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                      <span>By {item.author?.fullname || 'Admin'}</span>
                      <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Draft'}</span>
                      <span>{item.views || item.viewsCount || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2 hover:bg-white text-slate-600 rounded-xl transition-colors"
                      title="Preview Article"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Article */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 hover:bg-white text-blue-600 rounded-xl transition-colors"
                      title="Edit Article"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Archive (Soft Delete) */}
                    <button
                      onClick={() => handleArchive(item._id)}
                      className="p-2 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors"
                      title="Archive Article (Soft Delete)"
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    {/* Permanent Delete */}
                    <button
                      onClick={() => handlePermanentDelete(item._id, item.title)}
                      className="p-2 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                      title="Delete Permanently from Database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Workflow Action Button */}
                  <div>
                    {(item.status === 'draft' || item.status === 'rejected') && (
                      <button
                        onClick={() => handleSubmitForApproval(item._id)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit
                      </button>
                    )}

                    {canApprove && item.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(item._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectingItem(item)}
                          className="px-2.5 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-xs rounded-xl"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {item.status === 'approved' && (
                      <button
                        onClick={() => handleTogglePin(item._id, item.isPinned)}
                        className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors ${
                          item.isPinned
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" /> {item.isPinned ? 'Pinned' : 'Pin'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- STRUCTURED TABLE VIEW --- */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Article</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Author</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Views</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {items.map(item => {
                  const cover = resolvePortalAssetUrl(item.coverImage || (item.attachments && item.attachments[0]?.url));

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/60">
                            {cover ? (
                              <img src={cover} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Newspaper className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              {item.isFeatured && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-md">FEATURED</span>
                              )}
                              {item.isPinned && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-md">PINNED</span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 truncate leading-snug">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 font-mono truncate">/news/{item.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {item.category}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(item.status)}
                          {item.status === 'rejected' && item.rejectionReason && (
                            <p className="text-[10px] text-rose-600 font-medium italic line-clamp-1 max-w-[150px]">
                              Reason: {item.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {item.author?.fullname || 'Admin'}
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '-'}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {item.views || item.viewsCount || 0}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Preview Article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(item.status === 'draft' || item.status === 'rejected') && (
                            <button
                              onClick={() => handleSubmitForApproval(item._id)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                              title="Submit for Approval"
                            >
                              <Send className="w-3.5 h-3.5" /> Submit
                            </button>
                          )}

                          {canApprove && item.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(item._id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-sm"
                                title="Approve & Publish"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => setRejectingItem(item)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                                title="Reject Article"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}

                          {item.status === 'approved' && (
                            <button
                              onClick={() => handleTogglePin(item._id, item.isPinned)}
                              className={`p-2 rounded-lg transition-colors ${item.isPinned ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100 text-slate-500'}`}
                              title={item.isPinned ? 'Unpin article' : 'Pin article to top'}
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Archive (Soft Delete) */}
                          <button
                            onClick={() => handleArchive(item._id)}
                            className="p-2 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                            title="Archive Article (Soft Delete)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          {/* Permanent Delete */}
                          <button
                            onClick={() => handlePermanentDelete(item._id, item.title)}
                            className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Delete Permanently from Database"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- DYNAMIC CATEGORY MANAGER MODAL --- */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FolderPlus className="w-6 h-6 text-blue-600" /> Category Manager
                </h3>
                <button onClick={() => setShowCategoryModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Add New Category Input Form */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAddCategory(newCategoryName);
                  setNewCategoryName('');
                }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-slate-700">Add New Category Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Humanitarian Logistics"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim()}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md disabled:opacity-50 whitespace-nowrap"
                  >
                    + Add Category
                  </button>
                </div>
              </form>

              {/* Categories Pills List */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">Existing Categories ({categoriesList.length})</label>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  {categoriesList.map(cat => {
                    const isDefault = DEFAULT_CATEGORIES.includes(cat);

                    return (
                      <span
                        key={cat}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                          isDefault
                            ? 'bg-white text-slate-800 border border-slate-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        <span>{cat}</span>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="p-0.5 text-blue-600 hover:text-rose-600 rounded-full"
                            title="Remove Category"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-2xl"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CREATE / EDIT NEWS ARTICLE MODAL --- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">
                  {editingItem ? 'Edit News Article' : 'Create New Article'}
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Article Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Major Disaster Preparedness Campaign Launched"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Subtitle / Tagline</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g. Nationwide initiative launched by emergency authorities"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Category Picker with Inline Adder */}
                  <div className="space-y-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Category *</label>
                      <button
                        type="button"
                        onClick={() => setShowInlineAddCategory(!showInlineAddCategory)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>{showInlineAddCategory ? 'Select from list' : '+ Add Custom Category'}</span>
                      </button>
                    </div>

                    {showInlineAddCategory ? (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={inlineCategoryInput}
                          onChange={e => setInlineCategoryInput(e.target.value)}
                          placeholder="Type new category name..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (inlineCategoryInput.trim()) {
                              handleAddCategory(inlineCategoryInput.trim());
                              setFormData(prev => ({ ...prev, category: inlineCategoryInput.trim() }));
                              setInlineCategoryInput('');
                              setShowInlineAddCategory(false);
                            }
                          }}
                          className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-2xl whitespace-nowrap shadow-sm"
                        >
                          Save & Select
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        {categoriesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Addis Ababa / Regional HQ"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={e => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="DisasterManagement, Preparedness, EarlyWarning"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Media Type Selector & Uploads */}
                  <div className="sm:col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <label className="text-xs font-bold text-slate-700 block">Featured Media Type</label>
                    <div className="flex gap-2 pb-1">
                      {[
                        { id: 'image', label: '📷 Cover Image' },
                        { id: 'youtube', label: '🎬 YouTube Video' },
                        { id: 'video', label: '🎥 Direct Video URL' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, mediaType: m.id as any })}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                            formData.mediaType === m.id
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {formData.mediaType === 'youtube' && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="text-xs font-bold text-slate-700">YouTube Video URL *</label>
                        <input
                          type="url"
                          value={formData.youtubeUrl}
                          onChange={e => {
                            const yUrl = e.target.value;
                            const autoThumb = getYouTubeThumbnail(yUrl);
                            setFormData(prev => ({
                              ...prev,
                              youtubeUrl: yUrl,
                              coverImage: prev.coverImage || autoThumb
                            }));
                          }}
                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                        {formData.youtubeUrl && getYouTubeEmbedUrl(formData.youtubeUrl) && (
                          <div className="rounded-xl overflow-hidden aspect-video max-h-48 border border-slate-300 shadow-sm mt-2">
                            <iframe
                              src={getYouTubeEmbedUrl(formData.youtubeUrl)}
                              title="YouTube preview"
                              className="w-full h-full"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {formData.mediaType === 'video' && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="text-xs font-bold text-slate-700">Direct Video File URL (MP4 / WebM)</label>
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                          placeholder="https://domain.com/video.mp4"
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1 pt-2 border-t border-slate-200">
                      <label className="text-xs font-bold text-slate-700">Cover / Poster Image (Upload or URL)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.coverImage}
                          onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                          placeholder="https://... or upload image"
                          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                        <label className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                          <Upload className="w-4 h-4" />
                          <span>{uploadingImage ? '...' : 'Upload'}</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary / Excerpt */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Short Summary / Excerpt</label>
                  <textarea
                    rows={2}
                    value={formData.summary}
                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief description displayed on public feed cards..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                {/* Rich Content */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Article Content (Rich HTML / Text) *</label>
                  <textarea
                    rows={8}
                    required
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="<p>Full article body content...</p>"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                {/* Settings & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending">Submit for Approval</option>
                      {canApprove && <option value="approved">Approve & Publish Immediately</option>}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Featured News Card
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="allowComments"
                      checked={formData.allowComments}
                      onChange={e => setFormData({ ...formData, allowComments: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="allowComments" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Allow Comments
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md disabled:opacity-50"
                  >
                    {submittingAction ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Article'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REJECTION MODAL --- */}
      <AnimatePresence>
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" /> Reject Article
                </h3>
                <button onClick={() => setRejectingItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                Rejecting: <span className="font-bold text-slate-900">"{rejectingItem.title}"</span>
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="State why this news article is being rejected..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={submittingAction}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  {submittingAction ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PREVIEW MODAL --- */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Public Article Preview
                </span>
                <button onClick={() => setPreviewItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <span className="px-3.5 py-1.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">
                  {previewItem.category}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {previewItem.title}
                </h2>

                {previewItem.subtitle && (
                  <p className="text-base text-slate-600 font-medium">{previewItem.subtitle}</p>
                )}

                {(previewItem.coverImage || (previewItem.attachments && previewItem.attachments[0]?.url)) && (
                  <div className="rounded-2xl overflow-hidden max-h-[350px] bg-slate-900">
                    <img
                      src={resolvePortalAssetUrl(previewItem.coverImage || previewItem.attachments![0].url)}
                      alt={previewItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className="prose prose-blue max-w-none text-slate-800 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewItem.content || '' }}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-6 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
