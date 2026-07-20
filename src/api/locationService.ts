import api from './axios';

export interface Subcity {
    _id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Woreda {
    _id: string;
    name: string;
    subcity: string | { _id: string; name: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface LocationHierarchyItem extends Subcity {
    woredas: Woreda[];
}

export const getSubcities = async (): Promise<Subcity[]> => {
    const response = await api.get('/locations/subcities');
    return response.data;
};

export const createSubcity = async (data: { name: string }): Promise<Subcity> => {
    const response = await api.post('/locations/subcities', data);
    return response.data;
};

export const deleteSubcity = async (id: string): Promise<any> => {
    const response = await api.delete(`/locations/subcities/${id}`);
    return response.data;
};

export const getWoredas = async (subcityId?: string): Promise<Woreda[]> => {
    const params = subcityId ? { subcityId } : {};
    const response = await api.get('/locations/woredas', { params });
    return response.data;
};

export const createWoreda = async (data: { name: string; subcityId: string }): Promise<Woreda> => {
    const response = await api.post('/locations/woredas', data);
    return response.data;
};

export const deleteWoreda = async (id: string): Promise<any> => {
    const response = await api.delete(`/locations/woredas/${id}`);
    return response.data;
};

export const getLocationHierarchy = async (): Promise<LocationHierarchyItem[]> => {
    const response = await api.get('/locations/hierarchy');
    return response.data;
};
