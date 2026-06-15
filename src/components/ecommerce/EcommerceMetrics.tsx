import { useEffect, useState } from "react";
import {
  GridIcon,
  GroupIcon,
  TaskIcon,
} from "../../icons";
import { getDashboardStats, DashboardStats } from "../../api/dashboardService";

export default function EcommerceMetrics() {
  const [stats, setStats] = useState<DashboardStats>({
    permissions: {
      canViewOrganizations: false,
      canViewSectors: false,
      canViewDepartments: false,
      canViewUsers: false,
      canViewRoles: false,
      canViewAdvancedStats: false,
    },
    totalDepartments: 0,
    totalUsers: 0,
    totalRoles: 0,
    totalOrganizations: 0,
    totalSectors: 0,
    userInfo: {
      accessLevel: '',
      organizationType: '',
      organizationName: 'N/A',
      sectorName: 'N/A',
      departmentName: 'N/A',
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setError(null);
      } catch (error: any) {
        console.error("Failed to fetch dashboard stats", error);
        setError(error?.response?.data?.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/10 md:p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Context Info */}
      {stats.userInfo && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/10 md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
            Your Dashboard Context
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Access Level:</span>
              <p className="font-medium text-gray-800 dark:text-white/90 capitalize">
                {stats.userInfo.accessLevel.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Organization Type:</span>
              <p className="font-medium text-gray-800 dark:text-white/90 capitalize">
                {stats.userInfo.organizationType.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Organization:</span>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {stats.userInfo.organizationName}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Sector:</span>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {stats.userInfo.sectorName}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Department:</span>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {stats.userInfo.departmentName}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
        {/* Total Organizations - Only show if user has permission */}
        {stats.permissions.canViewOrganizations && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-800/20">
              <GridIcon className="text-purple-600 size-6 dark:text-purple-400" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Organizations
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats.totalOrganizations || 0}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Total Sectors - Only show if user has permission */}
        {stats.permissions.canViewSectors && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl dark:bg-indigo-800/20">
              <GridIcon className="text-indigo-600 size-6 dark:text-indigo-400" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Sectors
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats.totalSectors || 0}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Total Departments - Only show if user has permission */}
        {stats.permissions.canViewDepartments && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-800/20">
              <GridIcon className="text-blue-600 size-6 dark:text-blue-400" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Departments
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats.totalDepartments || 0}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Total Users - Only show if user has permission */}
        {stats.permissions.canViewUsers && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-800/20">
              <GroupIcon className="text-green-600 size-6 dark:text-green-400" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Users
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats.totalUsers || 0}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Total Roles - Only show if user has permission */}
        {stats.permissions.canViewRoles && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-800/20">
              <TaskIcon className="text-orange-600 size-6 dark:text-orange-400" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Roles
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats.totalRoles || 0}
                </h4>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Advanced Statistics for Admins/Managers */}
      {stats.permissions.canViewAdvancedStats && stats.usersByAccessLevel && stats.usersByAccessLevel.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Users by Access Level
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.usersByAccessLevel.map((item) => (
              <div key={item.accessLevel} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {item.accessLevel.replace(/_/g, ' ')}
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white/90 mt-1">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.permissions.canViewAdvancedStats && stats.usersByOrganization && stats.usersByOrganization.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Users by Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.usersByOrganization.map((item) => (
              <div key={item.organizationId} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.organizationName || 'Unknown Organization'}
                </p>
                <p className="text-xl font-bold text-gray-800 dark:text-white/90 mt-1">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
