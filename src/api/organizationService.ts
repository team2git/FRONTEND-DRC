import api from './axios';

export interface Organization {
    id: string; // or _id depending on backend response, dto says id
    name: string;
    type: string;
    parentId?: string | null;
}

export interface OrganizationInput {
    name: string;
    type: string;
    parentId?: string | null;
}

export const getOrganizations = async () => {
    const response = await api.get('/organizations');
    return response.data;
};

export const getOrganizationById = async (id: string) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
};

export const createOrganization = async (data: OrganizationInput) => {
    const response = await api.post('/organizations', data);
    return response.data;
};

export const updateOrganization = async (id: string, data: OrganizationInput) => {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
};

export const deleteOrganization = async (id: string) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
};
