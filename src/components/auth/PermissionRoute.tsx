import React from 'react';
import { Navigate } from 'react-router';
import { usePermission, PermissionAction } from '../../hooks/usePermissions';

interface PermissionRouteProps {
    resource: string;
    action: PermissionAction;
    element: React.ReactElement;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ resource, action, element }) => {
    const hasPermission = usePermission(resource, action);

    if (!hasPermission) {
        // Redirect to dashboard if they don't have the permission to view the page
        return <Navigate to="/dashboard" replace />;
    }

    return element;
};

export default PermissionRoute;
