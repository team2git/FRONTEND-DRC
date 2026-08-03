import { useEffect, useState } from "react";
import { getDashboardStats, DashboardStats } from "../../api/dashboardService";
import { Map, ClipboardList, Layers, FileText } from "lucide-react";

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Woreda Profiles */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-900/20">
          <Map className="text-red-600 size-6 dark:text-red-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Woreda Profiles
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.totalWoredaProfiles || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Surveys */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl dark:bg-emerald-900/20">
          <ClipboardList className="text-emerald-600 size-6 dark:text-emerald-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-medium">
              Total Surveys
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.totalSurveys || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Mappings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-center w-12 h-12 bg-brand-100 rounded-xl dark:bg-brand-900/20">
          <Layers className="text-brand-600 size-6 dark:text-brand-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-medium">
              Total Mappings
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.totalMappings || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Total Templates */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl dark:bg-amber-900/20">
          <FileText className="text-amber-600 size-6 dark:text-amber-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-medium">
              Total Templates
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.totalTemplates || 0}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
