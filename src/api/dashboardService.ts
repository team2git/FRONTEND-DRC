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
