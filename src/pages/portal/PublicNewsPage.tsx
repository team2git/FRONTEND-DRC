import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  Search,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  ArrowRight,
  Sparkles,
  Clock,
  X,
  Loader2,
  RefreshCw,
  Video
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageMeta from '@/components/common/PageMeta';
import Header from './components/Header';
import Footer from './components/Footer';
import ServiceExitButton from './components/ServiceExitButton';
import { usePortalContent } from '@/hooks/usePortalContent';
import { resolvePortalAssetUrl } from '@/utils/resolvePortalAssetUrl';
import {
  listPublicNews,
  getFeaturedPublicNews,
  getPublicCategories,
  reactToNews,
  shareNews,
  NewsItem
} from '@/api/newsService';

export default function PublicNewsPage() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { portalContent } = usePortalContent();

  const [items, setItems] = useState<NewsItem[]>([]);
  const [featuredItem, setFeaturedItem] = useState<NewsItem | null>(null);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All', 'Announcements', 'Disaster Risk Management', 'Emergency Response', 'Training', 'Events']);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Sync URL search param category when navigation occurs
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setPage(1);
    }
  }, [categoryParam]);

  // Social Share & Bookmarks state
  const [shareModalItem, setShareModalItem] = useState<NewsItem | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bookmarked_news') || '[]');
    } catch {
      return [];
    }
  });

  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  // Dynamic breaking news ticker content loaded from DB or Admin site settings
  const tickerTextContent = useMemo(() => {
    if (portalContent?.newsSection?.tickerText && portalContent.newsSection.tickerText.trim()) {
      return portalContent.newsSection.tickerText.trim();
    }
    const dbArticles = (latestNews && latestNews.length > 0) ? latestNews : items;
    if (dbArticles && dbArticles.length > 0) {
      return dbArticles.map(item => `🔴 ${item.title} (${item.category})`).join('   •   ');
    }
    return "🔴⚠️ Seasonal Flood Alert & Early Warning Guidelines Available Online • "
  }, [portalContent?.newsSection?.tickerText, latestNews, items]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch News Feed
  const fetchNewsFeed = useCallback(async (pageNum = 1, category = 'All', query = '') => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await listPublicNews({
        page: pageNum,
        limit: 9,
        category: category !== 'All' ? category : undefined,
        q: query || undefined
      });

      if (pageNum === 1) {
        setItems(res.docs || []);
      } else {
        setItems(prev => [...prev, ...(res.docs || [])]);
      }

      setTotalCount(res.total || 0);
      setHasMore(pageNum < (res.totalPages || 1));
    } catch (err: any) {
      console.error('Error fetching public news:', err);
      setError('Unable to load news. Please check your network connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch Categories, Featured & Latest Sidebar News dynamically from DB
  useEffect(() => {
    const loadCategoriesFeaturedAndLatest = async () => {
      try {
        const catRes = await getPublicCategories();
        if (catRes && catRes.categories && catRes.categories.length > 0) {
          setCategories(catRes.categories);
          setCategoryCounts(catRes.countMap || {});
        }

        const feat = await getFeaturedPublicNews();
        setFeaturedItem(feat);

        const latestRes = await listPublicNews({ limit: 5 });
        setLatestNews(latestRes.docs || []);
      } catch (err) {
        console.error('Error loading news metadata:', err);
      }
    };
    loadCategoriesFeaturedAndLatest();
  }, []);

  // Re-fetch feed when category or debounced search changes
  useEffect(() => {
    fetchNewsFeed(1, selectedCategory, debouncedSearch);
  }, [selectedCategory, debouncedSearch, fetchNewsFeed]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNewsFeed(nextPage, selectedCategory, debouncedSearch);
  };

  const handleLike = async (item: NewsItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await reactToNews(item._id, 'like');
      const isAdded = res.action === 'added';
      setItems(prev =>
        prev.map(i => {
          if (i._id === item._id) {
            const currentLikes = i.likes || 0;
            return {
              ...i,
              likes: isAdded ? currentLikes + 1 : Math.max(0, currentLikes - 1)
            };
          }
          return i;
        })
      );
      if (featuredItem?._id === item._id) {
        setFeaturedItem(prev => (prev ? { ...prev, likes: (prev.likes || 0) + (isAdded ? 1 : -1) } : prev));
      }
      toast.success(isAdded ? 'Liked news article!' : 'Unliked');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register reaction');
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (bookmarkedIds.includes(id)) {
      updated = bookmarkedIds.filter(bId => bId !== id);
      toast.info('Removed from saved bookmarks');
    } else {
      updated = [...bookmarkedIds, id];
      toast.success('Saved to your bookmarks!');
    }
    setBookmarkedIds(updated);
    localStorage.setItem('bookmarked_news', JSON.stringify(updated));
  };

  const handleShareClick = (item: NewsItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalItem(item);
    shareNews(item._id).catch(() => { });
  };

  const shareToPlatform = (platform: 'facebook' | 'telegram' | 'whatsapp' | 'x' | 'copy') => {
    if (!shareModalItem) return;
    const articleUrl = `${window.location.origin}/news/${shareModalItem.slug || shareModalItem._id}`;
    const text = encodeURIComponent(shareModalItem.title);

    let targetUrl = '';
    if (platform === 'facebook') {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
    } else if (platform === 'telegram') {
      targetUrl = `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${text}`;
    } else if (platform === 'whatsapp') {
      targetUrl = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(articleUrl)}`;
    } else if (platform === 'x') {
      targetUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(articleUrl)}`;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(articleUrl);
      toast.success('Article link copied to clipboard!');
      setShareModalItem(null);
      return;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setShareModalItem(null);
    }
  };

  return (
    <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden flex flex-col justify-between">
      <PageMeta
        title="Disaster Risk Management Newsroom & Bulletin | DRMIS Portal"
        description="Official public disaster risk management news, emergency alerts, preparedness announcements and community updates."
      />


      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}


      {/* --- LIVE BREAKING NEWS TICKER (LOADED FROM DB, SCROLLS RIGHT TO LEFT) --- */}
      <div className="bg-slate-950 text-white text-xs border-b border-slate-800/90 py-2.5 px-4 overflow-hidden pt-20">
        <div className="container mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 backdrop-blur-md rounded-full text-white text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-md shadow-red-600/30 z-10">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span>Breaking News</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-slate-300 font-medium text-xs flex-1 relative">
            <div className="animate-marquee-rtl cursor-pointer hover:text-white transition-colors">
              {tickerTextContent}
            </div>
          </div>
        </div>
      </div>
      {/* --- SEARCH BAR BELOW BREAKING NEWS TICKER --- */}
      <div className="bg-white border-b border-slate-200/90 py-4 px-4 sm:px-6 shadow-sm relative z-20">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/80">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-none">Newsroom Feed</h2>
              <p className="text-xs text-slate-500 font-medium pt-0.5">Explore official announcements, early warnings & community updates</p>
            </div>
          </div>

          <div className="w-full md:w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles by keyword, title, or topic..."
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- FEATURED HERO ARTICLE SECTION --- */}
      {featuredItem && !debouncedSearch && selectedCategory === 'All' && (
        <div className="container mx-auto px-4 sm:px-6 mt-6 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xl hover:shadow-blue-900/10 transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Media Container */}
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
                  {featuredItem.coverImage ? (
                    <img
                      src={resolvePortalAssetUrl(featuredItem.coverImage)}
                      alt={featuredItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                      <Newspaper className="w-16 h-16 opacity-30" />
                    </div>
                  )}

                  {/* YouTube Video Badge */}
                  {(featuredItem.youtubeUrl || featuredItem.mediaType === 'youtube') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/40 group-hover:scale-110 transition-transform">
                        <Video className="w-8 h-8 ml-1" />
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3.5 py-1.5 bg-blue-600/90 backdrop-blur-md text-white text-xs font-black rounded-full uppercase tracking-wider shadow-lg">
                      ⭐ Featured Story
                    </span>
                  </div>

                  <button
                    onClick={e => toggleBookmark(featuredItem._id, e)}
                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    <Bookmark className={`w-5 h-5 ${bookmarkedIds.includes(featuredItem._id) ? "fill-blue-600 text-blue-600" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Story Details */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span className="px-3 py-1 bg-slate-100 text-blue-700 rounded-lg">
                    {featuredItem.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {featuredItem.readingTime || 4} min read
                  </span>
                </div>

                <Link to={`/news/${featuredItem.slug || featuredItem._id}`}>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 hover:text-blue-600 transition-colors leading-tight">
                    {featuredItem.title}
                  </h2>
                </Link>

                <p className="text-slate-600 text-sm font-medium line-clamp-3 leading-relaxed">
                  {featuredItem.summary || (featuredItem.content ? featuredItem.content.replace(/<[^>]*>?/gm, '').substring(0, 180) + '...' : '')}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                      {featuredItem.author?.fullname ? featuredItem.author.fullname.charAt(0) : 'D'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-none">{featuredItem.author?.fullname || 'DRMIS Team'}</p>
                      <p className="text-[10px] text-slate-400 pt-0.5">{new Date(featuredItem.publishedAt || featuredItem.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={e => handleLike(featuredItem, e)}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-red-500/10 text-red-500" />
                      <span>{featuredItem.likes || 0}</span>
                    </button>
                    <button
                      onClick={e => handleShareClick(featuredItem, e)}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Link
                  to={`/news/${featuredItem.slug || featuredItem._id}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all group"
                >
                  <span>Read Full Coverage</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- CATEGORY NAVIGATOR & MAIN CONTENT --- */}
      <div className="container mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1">
        {/* Dynamic Category Pill Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Filter By News Topic</span>
            <span className="text-xs font-bold text-slate-500">{totalCount} Approved Articles</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
            {categories.map(cat => {
              const active = selectedCategory === cat;
              const count = cat === 'All' ? totalCount : categoryCounts[cat];

              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                >
                  <span>{cat}</span>
                  {count !== undefined && count > 0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT WITH SIDEBAR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed Grid Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {loading ? (
              // Skeleton Shimmer Loaders
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 animate-pulse">
                    <div className="h-48 bg-slate-200 rounded-2xl w-full" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-6 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-8 bg-slate-100 rounded-xl w-full pt-2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error State
              <div className="p-12 text-center bg-white rounded-3xl border border-red-100 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Failed to Load News Feed</h3>
                <p className="text-xs text-slate-500">{error}</p>
                <button
                  onClick={() => fetchNewsFeed(1, selectedCategory, debouncedSearch)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            ) : items.length === 0 ? (
              // Empty State
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <Newspaper className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">No Approved News Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {debouncedSearch
                    ? `No articles matched "${debouncedSearch}". Try searching a different keyword.`
                    : 'There are currently no published news articles under this category.'}
                </p>
                {(selectedCategory !== 'All' || debouncedSearch) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearch('');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              // Main Article Cards Grid
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map(item => {
                  const rawCover = item.coverImage || (item.attachments && item.attachments.length > 0 ? item.attachments[0].url : undefined);
                  const coverUrl = resolvePortalAssetUrl(rawCover);
                  const isSaved = bookmarkedIds.includes(item._id);

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover Image Container */}
                        <div className="relative h-48 bg-slate-900 overflow-hidden">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                              <Newspaper className="w-12 h-12 opacity-30" />
                            </div>
                          )}

                          {/* YouTube Video Play Badge Overlay */}
                          {(item.youtubeUrl || item.mediaType === 'youtube') && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Video className="w-6 h-6 ml-0.5" />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={e => toggleBookmark(item._id, e)}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                          </button>
                        </div>

                        {/* Article Text Content */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.readingTime || 3} min read</span>
                          </div>

                          <Link to={`/news/${item.slug || item._id}`}>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                          </Link>

                          <p className="text-slate-500 text-xs font-medium line-clamp-2 leading-relaxed">
                            {item.summary || (item.content ? item.content.replace(/<[^>]*>?/gm, '').substring(0, 110) + '...' : '')}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={e => handleLike(item, e)}
                            className="flex items-center gap-1 text-slate-600 hover:text-red-500 transition-colors"
                          >
                            <Heart className="w-3.5 h-3.5 fill-red-500/10 text-red-500" />
                            <span>{item.likes || 0}</span>
                          </button>

                          <Link
                            to={`/news/${item.slug || item._id}#comments`}
                            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{item.commentsCount || 0}</span>
                          </Link>

                          <button
                            onClick={e => handleShareClick(item, e)}
                            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <Link
                          to={`/news/${item.slug || item._id}`}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 group/link"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Load More Button */}
            {hasMore && !loading && items.length > 0 && (
              <div className="text-center pt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading Articles...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More News</span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Sidebar Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Live Bulletins Widget */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  Latest Bulletins
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Real-time</span>
              </div>

              <div className="space-y-4">
                {latestNews.slice(0, 5).map((ln, idx) => (
                  <Link
                    key={ln._id}
                    to={`/news/${ln.slug || ln._id}`}
                    className="group flex gap-3 items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <span className="text-lg font-black text-slate-300 group-hover:text-blue-600 transition-colors w-5">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {ln.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {ln.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {new Date(ln.publishedAt || ln.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Emergency Hotline Callout Card */}
            <div className="bg-gradient-to-br from-red-600 via-rose-700 to-amber-700 p-6 rounded-3xl text-white shadow-xl space-y-4">
              <div className="flex items-center gap-2 font-black uppercase text-xs tracking-wider text-amber-200">
                <span className="w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
                Emergency Hotline & Alerts
              </div>
              <h3 className="text-xl font-black leading-tight">Need Urgent Assistance?</h3>
              <p className="text-xs text-red-100 font-medium leading-relaxed">
                Contact the Disaster Risk Management Operation Center 24/7 or submit a field incident report.
              </p>
              <div className="pt-2 flex gap-3">
                <Link
                  to="/incident-reporting"
                  className="px-4 py-2.5 bg-white text-red-700 font-extrabold text-xs rounded-xl shadow-md hover:bg-red-50 transition-colors"
                >
                  Report Incident
                </Link>
                <Link
                  to="/emergency-contacts"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/20 transition-colors"
                >
                  Directory
                </Link>
              </div>
            </div>

            {/* Newsletter / Alert Subscription Card */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white space-y-4 shadow-xl">
              <h3 className="text-base font-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" /> Subscribe to Emergency Alerts
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Receive instant email notifications for published disaster alerts, early warnings and woreda news updates.
              </p>
              <Link
                to="/alert-subscription"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Subscribe for Email Alerts</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- SOCIAL SHARE MODAL --- */}
      <AnimatePresence>
        {shareModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" /> Share News Article
                </h3>
                <button
                  onClick={() => setShareModalItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-semibold line-clamp-2">
                {shareModalItem.title}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => shareToPlatform('facebook')}
                  className="p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => shareToPlatform('telegram')}
                  className="p-3 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Telegram</span>
                </button>
                <button
                  onClick={() => shareToPlatform('whatsapp')}
                  className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => shareToPlatform('x')}
                  className="p-3 bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <span>X (Twitter)</span>
                </button>
              </div>

              <button
                onClick={() => shareToPlatform('copy')}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Direct Article Link</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ServiceExitButton />

      {showFooter ? (
        <Footer
          branding={portalContent?.branding}
          contact={portalContent?.contact}
          footer={portalContent?.footer}
          showContact={showContact}
        />
      ) : null}
    </div>
  );
}
