import api from './axios';

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
}

export interface PermissionInput {
    name: string;
    resource: string;
    action: string;
}

export const getPermissions = async () => {
    const response = await api.get('/permissions');
    return response.data;
};

export const getPermissionById = async (id: string) => {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
};

export const createPermission = async (data: PermissionInput) => {
    const response = await api.post('/permissions', data);
    return response.data;
};

export const updatePermission = async (id: string, data: PermissionInput) => {
    const response = await api.put(`/permissions/${id}`, data);
    return response.data;
};

export const deletePermission = async (id: string) => {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
};
