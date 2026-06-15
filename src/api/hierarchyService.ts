import api from './axios';

// Hierarchy API Service

export interface DelegationAuthority {
    canManageTeams?: boolean;
    canManageDepartments?: boolean;
    canApproveReports?: boolean;
}

export interface DelegateRequest {
    delegateeId: string;
    authority: DelegationAuthority;
    reason?: string;
    endDate?: Date;
}

export interface HierarchyInfo {
    user: any;
    subordinates: any[];
}

/**
 * Delegate authority to another user
 */
export const delegateAuthority = async (data: DelegateRequest) => {
    const response = await api.post('/hierarchy/delegate', data);
    return response.data;
};

/**
 * Revoke delegation
 */
export const revokeDelegation = async (delegateeId: string) => {
    const response = await api.delete(`/hierarchy/delegate/${delegateeId}`);
    return response.data;
};

/**
 * Get subordinates for current user
 */
export const getSubordinates = async () => {
    const response = await api.get('/hierarchy/subordinates');
    return response.data.data;
};

/**
 * Get hierarchy information for current user
 */
export const getMyHierarchy = async (): Promise<HierarchyInfo> => {
    const response = await api.get('/hierarchy/my-hierarchy');
    return response.data;
};

/**
 * Get delegation history
 */
export const getDelegationHistory = async () => {
    const response = await api.get('/hierarchy/delegation-history');
    return response.data;
};

/**
 * Assign reporting relationship
 */
export const assignReportingTo = async (userId: string, managerId: string) => {
    const response = await api.post('/hierarchy/assign-reporting', {
        userId,
        managerId
    });
    return response.data;
};

/**
 * Get organizational chart
 */
export const getOrganizationalChart = async (userId?: string) => {
    const url = userId ? `/hierarchy/organizational-chart/${userId}` : '/hierarchy/organizational-chart';
    const response = await api.get(url);
    return response.data;
};
