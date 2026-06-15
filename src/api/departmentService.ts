import api from './axios';

export interface Department {
    id: string;
    name: string;
    organizationId: string;
}

export interface DepartmentInput {
    name: string;
    organizationId: string;
}

export const getDepartments = async () => {
    const response = await api.get('/departments');
    return response.data;
};

export const getDepartmentById = async (id: string) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
};

export const createDepartment = async (data: DepartmentInput) => {
    const response = await api.post('/departments', data);
    return response.data;
};

export const updateDepartment = async (id: string, data: DepartmentInput) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
};

export const deleteDepartment = async (id: string) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
};

export const getDepartmentsByOrg = async (orgId: string) => {
    const response = await api.get(`/departments/organization/${orgId}`);
    return response.data;
};
