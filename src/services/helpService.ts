import api from '@/api/axios';

export interface HelpArticle {
  _id: string;
  title: string;
  slug: string;
  category: string;
  summary?: string;
  content: string;
  visibility: 'everyone' | 'admin_only';
  status: 'published' | 'draft';
  order: number;
  tags?: string[];
  author?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHelpArticlePayload {
  title: string;
  category: string;
  summary?: string;
  content: string;
  visibility: 'everyone' | 'admin_only';
  status: 'published' | 'draft';
  order?: number;
  tags?: string[] | string;
}

export const fetchHelpArticles = async (params?: { category?: string; search?: string }): Promise<HelpArticle[]> => {
  const response = await api.get('/help', { params });
  return response.data;
};

export const fetchAdminHelpArticles = async (): Promise<HelpArticle[]> => {
  const response = await api.get('/help/admin/all');
  return response.data;
};

export const fetchHelpArticleBySlugOrId = async (slugOrId: string): Promise<HelpArticle> => {
  const response = await api.get(`/help/${slugOrId}`);
  return response.data;
};

export const createHelpArticle = async (data: CreateHelpArticlePayload): Promise<HelpArticle> => {
  const response = await api.post('/help', data);
  return response.data;
};

export const updateHelpArticle = async (id: string, data: Partial<CreateHelpArticlePayload>): Promise<HelpArticle> => {
  const response = await api.put(`/help/${id}`, data);
  return response.data;
};

export const deleteHelpArticle = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/help/${id}`);
  return response.data;
};
