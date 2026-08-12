import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { createNews, uploadNewsMedia } from '../../api/newsService';
import { toast } from 'react-toastify';
import { Image, X, Send, FileText } from 'lucide-react';
import { resolvePortalAssetUrl } from '@/utils/resolvePortalAssetUrl';

interface NewsComposerProps {
  onCreated?: (news: any) => void;
}

export default function NewsComposer({ onCreated }: NewsComposerProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Announcement');
  const [visibility, setVisibility] = useState('Public');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadNewsMedia(file);
        if (res && res.url) {
          setAttachments(prev => [
            ...prev,
            {
              url: res.url,
              type: file.type,
              name: file.name,
              size: file.size,
            }
          ]);
        }
      }
      toast.success('Media attachment uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload media attachment');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (publish = false) => {
    if (!title.trim() && !content.trim()) {
      toast.error('Please enter a title or news content');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        content,
        category,
        visibility,
        attachments,
        isPublished: publish,
      };
      const res = await createNews(payload);
      setTitle('');
      setContent('');
      setAttachments([]);
      
      if (publish) {
        toast.success('News published successfully! It is now live on the public news page.');
      } else {
        toast.info('News saved as draft.');
      }

      if (onCreated) onCreated(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save news post');
    } finally {
      setLoading(false);
    }
  };

  const storedUserRaw = localStorage.getItem('user');
  let userProfileImage = '/images/user/user-01.jpg';
  if (storedUserRaw) {
    try {
      const parsed = JSON.parse(storedUserRaw);
      if (parsed && parsed.profileImage) {
        userProfileImage = parsed.profileImage;
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={userProfileImage}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover border border-slate-200"
        />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Post Official News & Announcement</h3>
          <p className="text-xs text-slate-500">Publish announcements directly to the public news desk</p>
        </div>
      </div>

      <div className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Article Title (e.g. Weather Alert, Policy Update)..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-slate-900">
                {att.type?.startsWith('image/') || att.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <img
                    src={resolvePortalAssetUrl(att.url)}
                    alt={att.name || 'Attachment'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs p-1 text-center">
                    <FileText className="w-6 h-6 mb-1" />
                    <span className="truncate w-full">{att.name || 'File'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option>Announcement</option>
                <option>Emergency</option>
                <option>Training</option>
                <option>Event</option>
                <option>Press Release</option>
                <option>General</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Target Audience</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="Public">Public (Portal News Desk)</option>
                <option value="Organization">Organization Only</option>
                <option value="Department">Department Only</option>
              </select>
            </div>

            <div className="pt-4">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
                <Image className="w-4 h-4 text-indigo-600" />
                <span>{uploading ? 'Uploading...' : 'Attach Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || uploading}
              onClick={() => onSubmit(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={loading || uploading}
              onClick={() => onSubmit(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Publishing...' : 'Publish to News Page'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
