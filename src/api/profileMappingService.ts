import api from './axios';

export interface ProfileMappingItem {
    targetFieldPath: string;
    sourceKey: string;
    transformation: 'direct' | 'cast_number' | 'boolean_map' | 'lookup' | 'calculation';
    sourceKeys?: string[]; // Used for calculations
    operation?: 'sum' | 'average' | 'min' | 'max' | 'formula' | 'concat' | 'and' | 'or' | 'count';
    formula?: string;
    separator?: string; // For concat operation
    lookupOptions?: { sourceValue: any; targetValue: any }[];
    validation?: {
        required: boolean;
        type?: 'string' | 'number' | 'boolean' | 'date';
    };
}

export interface ProfileMapping {
    _id: string;
    name: string;
    description?: string;
    sourceType: 'InterviewTemplate' | 'SiteSurveyTemplate';
    sourceId?: any;
    version: number;
    mappings: ProfileMappingItem[];
    status: 'Draft' | 'Published' | 'Archived';
    isActive: boolean;
    createdBy?: { _id: string; fullname: string };
    createdAt: string;
    updatedAt: string;
}

export interface ProfileMappingInput {
    name: string;
    description?: string;
    sourceType: 'InterviewTemplate' | 'SiteSurveyTemplate';
    sourceId?: any;
    mappings: ProfileMappingItem[];
    status?: 'Draft' | 'Published' | 'Archived';
}

export const getProfileMappings = async (): Promise<ProfileMapping[]> => {
    const response = await api.get('/profile-mappings');
    return response.data;
};

export const getMappingBySource = async (sourceId: string): Promise<ProfileMapping> => {
    const response = await api.get(`/profile-mappings/source/${sourceId}`);
    return response.data;
};

export const createProfileMapping = async (data: ProfileMappingInput): Promise<ProfileMapping> => {
    const response = await api.post('/profile-mappings', data);
    return response.data;
};

export const updateProfileMapping = async (id: string, data: Partial<ProfileMappingInput>): Promise<ProfileMapping> => {
    const response = await api.put(`/profile-mappings/${id}`, data);
    return response.data;
};

export const deleteProfileMapping = async (id: string): Promise<void> => {
    await api.delete(`/profile-mappings/${id}`);
};

export const permanentlyDeleteProfileMapping = async (id: string): Promise<void> => {
    await api.delete(`/profile-mappings/${id}/permanent`);
};
