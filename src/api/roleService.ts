import api from './axios';
import { Permission } from './permissionService';

// Role Interface 
export interface Role {
    id: string;
    name: string;
    type?: string;
    description?: string;
}

// Role Input Interface 
export interface RoleInput {
    name: string;
    type?: string;
    description?: string;
}

// Get All Roles
export const getRoles = async () => {
    const response = await api.get('/roles');
    return response.data;
};

// Get Role By ID
export const getRoleById = async (id: string) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
};

// Create Role
export const createRole = async (data: RoleInput) => {
    const response = await api.post('/roles', data);
    return response.data;
};

// Update Role
export const updateRole = async (id: string, data: RoleInput) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
};

// Delete Role
export const deleteRole = async (id: string) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
};

// Role Permission Assignments
export const getRolePermissions = async (roleId: string) => {
    const response = await api.get(`/roles/${roleId}/permissions`);
    return response.data as Permission[];
};

// Assign Permission To Role
export const assignPermissionToRole = async (roleId: string, permissionId: string) => {
    const response = await api.post(`/roles/${roleId}/permissions`, { permissionId });
    return response.data;
};

// Remove Permission From Role
export const removePermissionFromRole = async (roleId: string, permissionId: string) => {
    const response = await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
};
