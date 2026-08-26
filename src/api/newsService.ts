import api from './axios';

export interface NewsAttachment {
  type?: string;
  url: string;
  thumbnail?: string;
  name?: string;
  size?: number;
}

export interface NewsGalleryItem {
  url: string;
  caption?: string;
}

export const getYouTubeVideoId = (url: string = ''): string => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

export const getYouTubeEmbedUrl = (url: string = ''): string => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export const getYouTubeThumbnail = (url: string = ''): string => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

export interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'youtube' | 'video';
  gallery?: NewsGalleryItem[];
  category: string;
  tags?: string[];
  location?: string;
  visibility?: string;

  attachments?: NewsAttachment[];

  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  isFeatured?: boolean;
  rejectionReason?: string;

  author?: {
    _id: string;
    fullname?: string;
    profileImage?: string;
    email?: string;
    roles?: any[];
  };
  approvedBy?: {
    _id: string;
    fullname?: string;
    email?: string;
  };
  createdBy?: {
    _id: string;
    fullname?: string;
    email?: string;
  };

  reactionCounts?: Record<string, number>;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  views?: number;
  likes?: number;
  readingTime?: number;
  allowComments?: boolean;

  isPinned?: boolean;
  isPublished?: boolean;
  isArchived?: boolean;

  publishedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsCommentItem {
  _id: string;
  news: string;
  user?: {
    _id: string;
    fullname?: string;
    profileImage?: string;
  };
  guestName?: string;
  parentComment?: string | null;
  content: string;
  replies?: NewsCommentItem[];
  createdAt: string;
}

export interface NewsListResponse {
  docs: NewsItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts?: {
    all: number;
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    archived: number;
  };
}

// --- PUBLIC APIS ---

export const listPublicNews = (params?: any): Promise<NewsListResponse> =>
  api.get('/news/public', { params }).then(res => res.data);

export const listNews = listPublicNews;

export const getPublicNewsDetail = (slugOrId: string): Promise<NewsItem> =>
  api.get(`/news/detail/${slugOrId}`).then(res => res.data).catch(() =>
    api.get(`/news/${slugOrId}`).then(res => res.data)
  );

export const getNewsDetail = getPublicNewsDetail;

export const getFeaturedPublicNews = (): Promise<NewsItem | null> =>
  api.get('/news/featured').then(res => res.data);

export const getPublicCategories = (): Promise<{ categories: string[]; countMap: Record<string, number> }> =>
  api.get('/news/categories').then(res => res.data);

export const getRelatedPublicNews = (id: string, params?: { category?: string; tags?: string }): Promise<NewsItem[]> =>
  api.get(`/news/related/${id}`, { params }).then(res => res.data);

export const reactToNews = (id: string, reactionType: string, guestIdentifier?: string) =>
  api.post(`/news/${id}/reactions`, { reactionType, guestIdentifier }).then(res => res.data);

export const addComment = (id: string, payload: { content: string; guestName?: string; parentComment?: string }) =>
  api.post(`/news/${id}/comments`, payload).then(res => res.data);

export const replyToComment = (commentId: string, payload: { content: string; guestName?: string }) =>
  api.post(`/news/comments/${commentId}/replies`, payload).then(res => res.data);

export const listComments = (id: string, params?: any): Promise<{ comments: NewsCommentItem[]; total: number; page: number; limit: number }> =>
  api.get(`/news/${id}/comments`, { params }).then(res => res.data);

export const shareNews = (id: string) =>
  api.post(`/news/${id}/share`).then(res => res.data);

export const searchNews = (params?: any): Promise<NewsListResponse> =>
  api.get('/news/search', { params }).then(res => res.data);

// --- ADMIN APIS ---

export const listAdminNews = (params?: any): Promise<NewsListResponse> =>
  api.get('/news/admin', { params }).then(res => res.data);

export const getNews = (id: string): Promise<NewsItem> =>
  api.get(`/news/admin/${id}`).then(res => res.data);

export const createNews = (payload: Partial<NewsItem>): Promise<NewsItem> =>
  api.post('/news/admin', payload).then(res => res.data);

export const updateNews = (id: string, payload: Partial<NewsItem>): Promise<NewsItem> =>
  api.put(`/news/admin/${id}`, payload).then(res => res.data);

export const deleteNews = (id: string) =>
  api.delete(`/news/admin/${id}`).then(res => res.data);

export const deleteNewsPermanently = (id: string) =>
  api.delete(`/news/admin/${id}/permanent`).then(res => res.data);

export const submitNews = (id: string) =>
  api.post(`/news/admin/${id}/submit`).then(res => res.data);

export const approveNews = (id: string) =>
  api.post(`/news/admin/${id}/approve`).then(res => res.data);

export const rejectNews = (id: string, rejectionReason: string) =>
  api.post(`/news/admin/${id}/reject`, { rejectionReason }).then(res => res.data);

export const publishNews = (id: string) =>
  api.post(`/news/admin/${id}/publish`).then(res => res.data);

export const unpublishNews = (id: string) =>
  api.post(`/news/admin/${id}/unpublish`).then(res => res.data);

export const archiveNews = (id: string) =>
  api.post(`/news/admin/${id}/archive`).then(res => res.data);

export const pinNews = (id: string, action = 'pin') =>
  api.post(`/news/admin/${id}/pin`, { action }).then(res => res.data);

export const uploadNewsMedia = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/uploads/news-media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export default {
  listNews,
  listPublicNews,
  getNewsDetail,
  getPublicNewsDetail,
  getFeaturedPublicNews,
  getPublicCategories,
  getRelatedPublicNews,
  reactToNews,
  addComment,
  replyToComment,
  listComments,
  shareNews,
  searchNews,
  listAdminNews,
  getNews,
  createNews,
  updateNews,
  deleteNews,
  submitNews,
  approveNews,
  rejectNews,
  publishNews,
  unpublishNews,
  archiveNews,
  pinNews,
  uploadNewsMedia
};
