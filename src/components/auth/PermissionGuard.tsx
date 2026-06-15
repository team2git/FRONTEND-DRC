import React from 'react';
import { usePermission, PermissionAction } from '../../hooks/usePermissions';

interface PermissionGuardProps {
    resource: string;
    action: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Component that only renders children if user has the required permission
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    resource,
    action,
    children,
    fallback = null
}) => {
    const hasPermission = usePermission(resource, action);

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

interface CanProps {
    resource: string;
    action: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Shorter alias for PermissionGuard
 * Usage: <Can resource="User" action="create">...</Can>
 */
export const Can: React.FC<CanProps> = ({ resource, action, children, fallback }) => {
    return (
        <PermissionGuard resource={resource} action={action} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};
