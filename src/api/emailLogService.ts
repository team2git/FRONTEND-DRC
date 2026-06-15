import api from './axios';

export interface EmailLog {
    _id: string;
    recipient: string;
    subject: string;
    body: string;
    type: string;
    status: 'pending' | 'sent' | 'failed' | 'read' | 'unread';
    folder: 'inbox' | 'sent' | 'draft' | 'trash';
    error?: string;
    retryCount: number;
    openedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export const getEmailLogs = async (params: any = {}) => {
    const response = await api.get('/email-logs', { params });
    return response.data;
};

export const createManualEmail = async (data: { to: string, subject: string, body: string, action?: 'send' | 'draft' }) => {
    const response = await api.post('/email-logs/manual', data);
    return response.data;
};

export const resendEmail = async (id: string) => {
    const response = await api.post(`/email-logs/${id}/resend`);
    return response.data;
};

export const updateLogStatus = async (id: string, status: string) => {
    const response = await api.patch(`/email-logs/${id}/status`, { status });
    return response.data;
};

export const moveToFolder = async (id: string, folder: string) => {
    const response = await api.patch(`/email-logs/${id}/folder`, { folder });
    return response.data;
};
