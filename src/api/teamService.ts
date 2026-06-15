import api from './axios';

// Team API Service

export interface Team {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    department: string;
    organization?: string;
    teamLeader?: any;
    members?: any[];
    status?: 'active' | 'inactive';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateTeamRequest {
    name: string;
    description?: string;
    department: string;
}

/**
 * Create a new team
 */
export const createTeam = async (data: CreateTeamRequest): Promise<Team> => {
    const response = await api.post('/teams', data);
    return response.data.data;
};

/**
 * Get all teams
 */
export const getTeams = async (): Promise<Team[]> => {
    const response = await api.get('/teams');
    return response.data.data;
};

/**
 * Get team by ID
 */
export const getTeamById = async (teamId: string): Promise<Team> => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data.data;
};

/**
 * Update team
 */
export const updateTeam = async (teamId: string, data: Partial<Team>): Promise<Team> => {
    const response = await api.put(`/teams/${teamId}`, data);
    return response.data.data;
};

/**
 * Delete team
 */
export const deleteTeam = async (teamId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}`);
};

/**
 * Assign team leader
 */
export const assignTeamLeader = async (teamId: string, userId: string) => {
    const response = await api.put(`/teams/${teamId}/leader`, { userId });
    return response.data.data;
};

/**
 * Add team member
 */
export const addTeamMember = async (teamId: string, userId: string) => {
    const response = await api.post(`/teams/${teamId}/members`, { userId });
    return response.data.data;
};

/**
 * Remove team member
 */
export const removeTeamMember = async (teamId: string, userId: string) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data.data;
};

/**
 * Get teams by department
 */
export const getTeamsByDepartment = async (departmentId: string): Promise<Team[]> => {
    const response = await api.get(`/teams/department/${departmentId}`);
    return response.data.data;
};

/**
 * Get teams by organization
 */
export const getTeamsByOrganization = async (organizationId: string): Promise<Team[]> => {
    const response = await api.get(`/teams/organization/${organizationId}`);
    return response.data.data;
};

/**
 * Get team statistics
 */
export const getTeamStats = async (teamId: string) => {
    const response = await api.get(`/teams/${teamId}/stats`);
    return response.data.data;
};
