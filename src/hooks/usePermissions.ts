import { useAuth } from '../context/AuthContext';

export type PermissionAction = 'create' | 'view' | 'update' | 'delete' | 'import' | 'sync';

/**
 * Hook to check if the current user has a specific permission
 * @param resource - The resource name (e.g., 'User', 'Role', 'Organization')
 * @param action - The action to check (create, view, update, delete)
 * @returns boolean - true if user has permission, false otherwise
 */
export const usePermission = (resource: string, action: PermissionAction): boolean => {
    const { user } = useAuth();

    // Super admin has all permissions
    if (user?.accessLevel === 'super_admin' ||
        user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name))) {
        return true;
    }

    // Check if user has the specific permission
    const permissionName = `${resource.toLowerCase()}_${action}`;
    const hasPermission = user?.permissions?.some(
        (p: string) => p.toLowerCase() === permissionName.toLowerCase()
    );

    return hasPermission || false;
};

/**
 * Hook to get all permission checks for a resource at once
 * @param resource - The resource name (e.g., 'User', 'Role', 'Organization')
 * @returns object with boolean flags for each action
 */
export const useResourcePermissions = (resource: string) => {
    const canCreate = usePermission(resource, 'create');
    const canView = usePermission(resource, 'view');
    const canUpdate = usePermission(resource, 'update');
    const canDelete = usePermission(resource, 'delete');

    return {
        canCreate,
        canView,
        canUpdate,
        canDelete,
        hasAnyPermission: canCreate || canView || canUpdate || canDelete
    };
};
