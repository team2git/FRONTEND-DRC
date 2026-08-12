import { useState } from 'react';
import { publishNews, pinNews, deleteNews } from '../../api/newsService';
import { resolvePortalAssetUrl } from '@/utils/resolvePortalAssetUrl';
import { toast } from 'react-toastify';
import { Pin, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface NewsCardProps {
  item: any;
  onReact?: (id: string) => void;
  onOpen?: (item: any) => void;
  onUpdate?: () => void;
}

export default function NewsCard({ item, onOpen, onUpdate }: NewsCardProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleTogglePublish = async () => {
    setActionLoading(true);
    try {
      await publishNews(item._id);
      toast.success(item.isPublished ? 'Article unpublished' : 'Article published live to public news page!');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update publish status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async () => {
    setActionLoading(true);
    try {
      await pinNews(item._id, item.isPinned ? 'unpin' : 'pin');
      toast.success(item.isPinned ? 'Article unpinned' : 'Article pinned to top');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update pin status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this news article?')) return;
    setActionLoading(true);
    try {
      await deleteNews(item._id);
      toast.success('News article deleted');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete news article');
    } finally {
      setActionLoading(false);
    }
  };

  const reactionSum = (Object.values(item.reactionCounts || {}) as number[]).reduce(
    (s: number, n: number) => s + (n || 0),
    0
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <img
          src={item.author?.profileImage || '/images/user/user-01.jpg'}
          alt="avatar"
          className="w-11 h-11 rounded-full object-cover border border-slate-200"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{item.author?.fullname || 'System Admin'}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {item.category || 'General'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {new Date(item.createdAt).toLocaleString()} · Audience: <span className="font-semibold text-slate-600">{item.visibility}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.isPublished ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Draft
                </span>
              )}

              {item.isPinned && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  <Pin className="w-3 h-3 fill-current" /> Pinned
                </span>
              )}
            </div>
          </div>

          <h4 className="mt-3 font-bold text-slate-900 text-lg leading-snug">{item.title?.trim() || 'Untitled Post'}</h4>
          
          <div
            className="mt-2 text-slate-600 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: item.content || '' }}
          />

          {item.attachments && item.attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {item.attachments.map((a: any, idx: number) => (
                <div key={idx} className="h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  {a.type?.startsWith('image/') || a.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                    <img
                      src={resolvePortalAssetUrl(a.url)}
                      alt={a.name || 'attachment'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs p-2">
                      <span>{a.name || 'Document attachment'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Controls Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-3">
              <span>👍 {reactionSum}</span>
              <span>💬 {item.commentsCount || 0}</span>
              <span>👁 {item.viewsCount || 0} views</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleTogglePublish}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  item.isPublished
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                }`}
              >
                {item.isPublished ? 'Unpublish' : 'Publish Live'}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleTogglePin}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {item.isPinned ? 'Unpin' : 'Pin Top'}
              </button>

              <button
                type="button"
                onClick={() => onOpen && onOpen(item)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
              >
                View / Comment
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDelete}
                className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                title="Delete News Article"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
