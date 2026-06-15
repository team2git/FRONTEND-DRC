import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyHierarchy } from '../api/hierarchyService';

interface HierarchyContextType {
    accessLevel: string;
    organizationType: string;
    subordinates: any[];
    managedDepartments: any[];
    managedTeams: any[];
    reportsTo: any;
    delegatedBy: any;
    delegatedAuthority: {
        canManageTeams: boolean;
        canManageDepartments: boolean;
        canApproveReports: boolean;
        expiresAt?: Date;
    };
    organization: any;
    department: any;
    team: any;
    loading: boolean;
    refreshHierarchy: () => Promise<void>;
}

const HierarchyContext = createContext<HierarchyContextType | null>(null);

export const HierarchyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hierarchyData, setHierarchyData] = useState<HierarchyContextType>({
        accessLevel: 'expert',
        organizationType: 'branch',
        subordinates: [],
        managedDepartments: [],
        managedTeams: [],
        reportsTo: null,
        delegatedBy: null,
        delegatedAuthority: {
            canManageTeams: false,
            canManageDepartments: false,
            canApproveReports: false
        },
        organization: null,
        department: null,
        team: null,
        loading: true,
        refreshHierarchy: async () => { }
    });

    const fetchHierarchyData = async () => {
        try {
            const response = await getMyHierarchy();

            setHierarchyData({
                accessLevel: response.user.accessLevel || 'expert',
                organizationType: response.user.organizationType || 'branch',
                subordinates: response.subordinates || [],
                managedDepartments: response.user.managedDepartments || [],
                managedTeams: response.user.managedTeams || [],
                reportsTo: response.user.reportsTo || null,
                delegatedBy: response.user.delegatedBy || null,
                delegatedAuthority: response.user.delegatedAuthority || {
                    canManageTeams: false,
                    canManageDepartments: false,
                    canApproveReports: false
                },
                organization: response.user.organization || null,
                department: response.user.department || null,
                team: response.user.team || null,
                loading: false,
                refreshHierarchy: fetchHierarchyData
            });
        } catch (error) {
            console.error('Failed to fetch hierarchy data', error);
            setHierarchyData(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchHierarchyData();
        } else {
            setHierarchyData(prev => ({ ...prev, loading: false }));
        }
    }, []);

    return (
        <HierarchyContext.Provider value={hierarchyData}>
            {children}
        </HierarchyContext.Provider>
    );
};

export const useHierarchy = () => {
    const context = useContext(HierarchyContext);
    if (!context) {
        throw new Error('useHierarchy must be used within HierarchyProvider');
    }
    return context;
};

// Helper hooks for common checks
export const useCanDelegate = () => {
    const { accessLevel } = useHierarchy();
    const allowedLevels = ['super_admin', 'manager', 'deputy', 'directorate', 'branch_admin'];
    return allowedLevels.includes(accessLevel);
};

export const useCanManageTeams = () => {
    const { accessLevel, delegatedAuthority } = useHierarchy();
    const allowedLevels = ['super_admin', 'manager', 'deputy', 'directorate', 'branch_admin'];
    return allowedLevels.includes(accessLevel) || delegatedAuthority.canManageTeams;
};

export const useCanManageDepartments = () => {
    const { accessLevel, delegatedAuthority } = useHierarchy();
    const allowedLevels = ['super_admin', 'manager', 'deputy', 'branch_admin'];
    return allowedLevels.includes(accessLevel) || delegatedAuthority.canManageDepartments;
};

export const useIsSuperAdmin = () => {
    const { accessLevel } = useHierarchy();
    return accessLevel === 'super_admin';
};

export const useIsManager = () => {
    const { accessLevel } = useHierarchy();
    return accessLevel === 'manager';
};

export const useIsHeadOffice = () => {
    const { organizationType } = useHierarchy();
    return organizationType === 'head_office';
};
