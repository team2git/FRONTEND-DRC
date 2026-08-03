import api from './axios';

export interface DashboardStats {
    permissions: {
        canViewOrganizations: boolean;
        canViewSectors: boolean;
        canViewDepartments: boolean;
        canViewUsers: boolean;
        canViewRoles: boolean;
        canViewAdvancedStats: boolean;
    };
    totalDepartments?: number;
    totalUsers?: number;
    totalRoles?: number;
    totalOrganizations?: number;
    totalSectors?: number;
    totalWoredaProfiles?: number;
    totalSurveys?: number;
    totalMappings?: number;
    totalTemplates?: number;
    // Status breakdowns
    woredaByStatus?: { Draft: number; Submitted: number; Reviewed: number };
    templatesByStatus?: { Draft: number; Published: number; Archived: number };
    mappingsByStatus?: { Draft: number; Published: number; Archived: number };
    surveysBySyncStatus?: { SYNCED: number; UNSYNCED: number; UPDATED: number };
    recentDatabaseChanges?: Array<{
        _id: string;
        userId?: {
            _id: string;
            fullname: string;
            email: string;
        };
        action: string;
        resource: string;
        resourceId?: string;
        severity?: string;
        status?: string;
        timestamp: string;
    }>;
    userInfo: {
        accessLevel: string;
        organizationType: string;
        organizationName: string;
        sectorName: string;
        departmentName: string;
    };
    usersByAccessLevel?: Array<{
        accessLevel: string;
        count: number;
    }>;
    usersByOrganization?: Array<{
        organizationId: string;
        organizationName: string;
        count: number;
    }>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};
