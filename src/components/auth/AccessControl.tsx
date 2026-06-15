import React from 'react';
import { useHierarchy } from '../../context/HierarchyContext';

interface AccessControlProps {
    requiredLevel: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Component to control access based on hierarchy level
 */
export const AccessControl: React.FC<AccessControlProps> = ({
    requiredLevel,
    children,
    fallback = null
}) => {
    const { accessLevel } = useHierarchy();

    const levels = Array.isArray(requiredLevel) ? requiredLevel : [requiredLevel];

    if (levels.includes(accessLevel)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

/**
 * Show content only for Head Office users
 */
export const HeadOfficeOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { organizationType } = useHierarchy();
    return organizationType === 'head_office' ? <>{children}</> : <>{fallback}</>;
};

/**
 * Show content only for Branch users
 */
export const BranchOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { organizationType } = useHierarchy();
    return organizationType === 'branch' ? <>{children}</> : <>{fallback}</>;
};

/**
 * Show content only for Super Admin
 */
export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { accessLevel } = useHierarchy();
    return accessLevel === 'super_admin' ? <>{children}</> : <>{fallback}</>;
};

/**
 * Show content only for Manager and above
 */
export const ManagerAndAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { accessLevel } = useHierarchy();
    const allowedLevels = ['super_admin', 'manager'];
    return allowedLevels.includes(accessLevel) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Show content only for Directorate and above
 */
export const DirectorateAndAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { accessLevel } = useHierarchy();
    const allowedLevels = ['super_admin', 'manager', 'deputy', 'branch_admin', 'directorate'];
    return allowedLevels.includes(accessLevel) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Show content only for Team Leader and above
 */
export const TeamLeaderAndAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { accessLevel } = useHierarchy();
    const allowedLevels = ['super_admin', 'manager', 'deputy', 'branch_admin', 'directorate', 'team_leader'];
    return allowedLevels.includes(accessLevel) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Show content if user has delegated authority
 */
export const WithDelegatedAuthority: React.FC<{
    authority: 'canManageTeams' | 'canManageDepartments' | 'canApproveReports';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}> = ({ authority, children, fallback = null }) => {
    const { delegatedAuthority } = useHierarchy();

    const hasAuthority = delegatedAuthority &&
        delegatedAuthority[authority] &&
        (!delegatedAuthority.expiresAt ||
            new Date(delegatedAuthority.expiresAt) > new Date());

    return hasAuthority ? <>{children}</> : <>{fallback}</>;
};

/**
 * Get access level badge component
 */
export const AccessLevelBadge: React.FC<{ level: string }> = ({ level }) => {
    const getBadgeColor = (level: string) => {
        switch (level) {
            case 'super_admin':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'manager':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'deputy':
                return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
            case 'branch_admin':
                return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
            case 'directorate':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'team_leader':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'expert':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getDisplayName = (level: string) => {
        return level.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(level)}`}>
            {getDisplayName(level)}
        </span>
    );
};
