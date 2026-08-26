import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import Header from './components/Header';
import Footer from './components/Footer';
import { usePortalContent } from '@/hooks/usePortalContent';
import { resolvePortalAssetUrl } from '@/utils/resolvePortalAssetUrl';
import {
  getPublicNewsDetail,
  getRelatedPublicNews,
  listComments,
  addComment,
  replyToComment,
  reactToNews,
  shareNews,
  getYouTubeEmbedUrl,
  NewsItem,
  NewsCommentItem
} from '@/api/newsService';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  Send,
  Newspaper,
  Sparkles,
  Tag,
  Bookmark,
  Reply,
  CornerDownRight,
  Loader2,
  Video
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageMeta from '@/components/common/PageMeta';

export default function NewsDetailPage() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const articleIdOrSlug = slug || id || '';

  const { portalContent } = usePortalContent();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsItem[]>([]);
  const [comments, setComments] = useState<NewsCommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;

  const fetchArticle = useCallback(async () => {
    if (!articleIdOrSlug) return;
    setLoading(true);
    try {
      const data = await getPublicNewsDetail(articleIdOrSlug);
      setItem(data);

      if (data) {
        // Fetch Related News safely
        try {
          const related = await getRelatedPublicNews(data._id, {
            category: data.category,
            tags: (data.tags || []).join(',')
          });
          setRelatedArticles(related || []);
        } catch (rErr) {
          console.warn('Could not load related news:', rErr);
        }

        // Fetch Comments safely
        try {
          const commData = await listComments(data._id, { page: 1, limit: 50 });
          setComments(commData.comments || []);
        } catch (cErr) {
          console.warn('Could not load comments:', cErr);
        }
      }
    } catch (err) {
      console.error('Error loading news detail:', err);
      toast.error('Failed to load news article');
    } finally {
      setLoading(false);
    }
  }, [articleIdOrSlug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleReact = async () => {
    if (!item) return;
    try {
      const res = await reactToNews(item._id, 'like');
      const added = res.action === 'added';
      setIsLiked(added);
      setItem(prev => (prev ? { ...prev, likes: (prev.likes || 0) + (added ? 1 : -1) } : prev));
      toast.success(added ? 'Liked article!' : 'Unliked');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit reaction');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(item._id, {
        content: commentText.trim(),
        guestName: guestName.trim() || 'Public Visitor'
      });
      toast.success('Comment posted successfully!');
      setCommentText('');
      const commData = await listComments(item._id, { page: 1, limit: 50 });
      setComments(commData.comments || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!item || !replyText.trim()) return;
    try {
      await replyToComment(commentId, {
        content: replyText.trim(),
        guestName: guestName.trim() || 'Public Visitor'
      });
      toast.success('Reply posted successfully!');
      setReplyText('');
      setReplyingToId(null);
      const commData = await listComments(item._id, { page: 1, limit: 50 });
      setComments(commData.comments || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to post reply');
    }
  };

  const handleShare = () => {
    if (!item) return;
    shareNews(item._id).catch(() => {});
    navigator.clipboard.writeText(window.location.href);
    toast.success('Article link copied to clipboard!');
  };

  const rawCover = item?.coverImage || (item?.attachments && item.attachments.length > 0 ? item.attachments[0].url : undefined);
  const coverUrl = resolvePortalAssetUrl(rawCover);

  return (
    <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden flex flex-col justify-between">
      <PageMeta
        title={`${item?.title || 'News Article'} | DRMIS Official News`}
        description={item?.summary || item?.title || 'Read official news updates'}
      />

      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} variant="light" /> : null}

      <main className="pt-24 pb-20 container mx-auto px-4 sm:px-6 max-w-7xl w-full flex-1">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-4 pb-6">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to News Feed
          </Link>

          {item && (
            <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-full border border-blue-100">
              {item.category}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Article Details...</span>
          </div>
        ) : !item ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
            <Newspaper className="w-16 h-16 text-slate-300 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Article Not Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              The requested news article could not be found or has not been published yet.
            </p>
          </div>
        ) : (
          /* YouTube-Style 2-Column Theater Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* --- LEFT PRIMARY COLUMN (8 COLS): MEDIA PLAYER, ARTICLE DETAILS & COMMENTS --- */}
            <div className="lg:col-span-8 space-y-6">
              {/* Media Player Showcase (YouTube Video / Direct Video / Image Cover) */}
              <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                {(item.youtubeUrl || item.mediaType === 'youtube') && getYouTubeEmbedUrl(item.youtubeUrl) ? (
                  <div className="w-full aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(item.youtubeUrl)}
                      title={item.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : item.videoUrl ? (
                  <div className="w-full bg-black">
                    <video
                      src={item.videoUrl}
                      controls
                      poster={coverUrl}
                      className="w-full max-h-[520px] object-contain"
                    />
                  </div>
                ) : coverUrl ? (
                  <div className="w-full max-h-[480px] overflow-hidden">
                    <img
                      src={coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-slate-600">
                    <Newspaper className="w-16 h-16 opacity-30" />
                  </div>
                )}
              </div>

              {/* Title, Author & Social Action Toolbar */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                    {item.title}
                  </h1>

                  {item.subtitle && (
                    <p className="text-base text-slate-600 font-medium leading-relaxed">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  {/* Author Card */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-md">
                      {item.author?.fullname ? item.author.fullname.charAt(0) : 'D'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm leading-none flex items-center gap-1">
                        <span>{item.author?.fullname || 'DRMIS Mediadesk'}</span>
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-current" />
                      </p>
                      <p className="text-[11px] text-slate-400 pt-1">
                        {new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {item.readingTime || 4} min read
                      </p>
                    </div>
                  </div>

                  {/* Reaction Buttons Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReact}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs transition-all shadow-sm ${
                        isLiked
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                      <span>{item.likes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isBookmarked
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-600 text-blue-600' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Article Body Content */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div
                  className="prose prose-blue max-w-none text-slate-800 text-base leading-relaxed space-y-4 font-normal"
                  dangerouslySetInnerHTML={{ __html: item.content || item.summary || '' }}
                />

                {/* Gallery Images */}
                {item.gallery && item.gallery.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Article Image Gallery
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {item.gallery.map((img, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-100 shadow-sm group">
                          <img
                            src={resolvePortalAssetUrl(img.url)}
                            alt={img.caption || 'gallery image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                    <Tag className="w-4 h-4 text-blue-600" />
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
                        #{t.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Discussion Thread & Comments Section */}
              <div id="comments" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" /> Comments ({comments.length})
                </h3>

                {/* Comment Post Form */}
                <form onSubmit={handleAddComment} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Your Display Name (Optional)"
                    className="w-full sm:w-1/2 p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />

                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a public comment..."
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[90px]"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                    </button>
                  </div>
                </form>

                {/* Comment List */}
                <div className="space-y-4 pt-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-6 text-center bg-slate-50/50 rounded-2xl">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map(c => (
                      <div key={c._id} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-[10px]">
                              {(c.user?.fullname || c.guestName || 'P').charAt(0)}
                            </div>
                            {c.user?.fullname || c.guestName || 'Public Visitor'}
                          </span>
                          <span className="text-slate-400 font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal pl-8">{c.content}</p>

                        <div className="flex items-center justify-end pt-1">
                          <button
                            onClick={() => setReplyingToId(replyingToId === c._id ? null : c._id)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        </div>

                        {/* Reply Form */}
                        {replyingToId === c._id && (
                          <div className="pt-2 pl-4 border-l-2 border-blue-200 space-y-2">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setReplyingToId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-600 font-bold text-[11px] rounded-xl"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReplySubmit(c._id)}
                                className="px-4 py-1.5 bg-blue-600 text-white font-bold text-[11px] rounded-xl shadow"
                              >
                                Submit Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Nested Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="pl-4 pt-2 border-l-2 border-slate-200 space-y-2">
                            {c.replies.map(r => (
                              <div key={r._id} className="p-3 bg-white rounded-2xl border border-slate-100 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 flex items-center gap-1">
                                    <CornerDownRight className="w-3 h-3 text-blue-600" />
                                    {r.user?.fullname || r.guestName || 'Public Visitor'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-600">{r.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* --- RIGHT SIDEBAR COLUMN (4 COLS): YOUTUBE-STYLE RECOMMENDED / UP NEXT CARDS --- */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Up Next & Recommended
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{relatedArticles.length} Related</span>
                </div>

                <div className="space-y-3.5">
                  {relatedArticles.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No related news available.</p>
                  ) : (
                    relatedArticles.map(rel => {
                      const relCover = resolvePortalAssetUrl(rel.coverImage || (rel.attachments && rel.attachments[0]?.url));
                      const isVideo = rel.youtubeUrl || rel.mediaType === 'youtube';

                      return (
                        <Link
                          key={rel._id}
                          to={`/news/${rel.slug || rel._id}`}
                          className="group flex gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/60"
                        >
                          {/* Compact Horizontal Thumbnail (YouTube style) */}
                          <div className="w-32 h-20 bg-slate-900 rounded-xl overflow-hidden relative shrink-0 shadow-sm">
                            {relCover ? (
                              <img
                                src={relCover}
                                alt={rel.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Newspaper className="w-8 h-8 opacity-30" />
                              </div>
                            )}

                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30">
                                <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md">
                                  <Video className="w-3.5 h-3.5 ml-0.5" />
                                </div>
                              </div>
                            )}

                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-950/80 text-white text-[9px] font-bold rounded">
                              {rel.readingTime || 3}m
                            </span>
                          </div>

                          {/* Short Card Text (Right Side) */}
                          <div className="space-y-1 flex-1 overflow-hidden">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                              {rel.category}
                            </span>

                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {rel.title}
                            </h4>

                            <p className="text-[10px] text-slate-400 font-medium">
                              {new Date(rel.publishedAt || rel.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Emergency Assistance Sidebar Card */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white space-y-3 shadow-xl">
                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Emergency Information
                </div>
                <h4 className="text-base font-black leading-tight">Need Urgent Field Assistance?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Access official woreda contact directories and report disaster incidents directly.
                </p>
                <div className="pt-1 flex gap-2">
                  <Link
                    to="/incident-reporting"
                    className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Report Incident
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showFooter ? <Footer branding={portalContent?.branding} footer={portalContent?.footer} /> : null}
    </div>
  );
}
