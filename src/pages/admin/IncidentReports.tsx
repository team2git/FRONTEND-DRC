import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";

type IncidentReport = {
  _id: string;
  reportCode?: string;
  reportType?: "incident";
  status: "submitted" | "received" | "dispatched" | "closed";
  category?: string;
  severity?: string;
  details?: string;
  location?: { addressLine?: string; city?: string; region?: string };
  createdAt?: string;
  updatedAt?: string;
};

const STATUS_OPTIONS = ["all", "submitted", "received", "dispatched", "closed"] as const;

export default function IncidentReports() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/incident-reports", {
        params: { reportType: "incident" },
      });
      setReports(response.data || []);
    } catch (error) {
      console.error("Failed to fetch incident reports", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        report.reportCode,
        report.category,
        report.severity,
        report.details,
        report.location?.addressLine,
        report.location?.city,
        report.location?.region,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [reports, searchTerm, statusFilter]);

  const handleStatusChange = async (id: string, status: IncidentReport["status"]) => {
    try {
      await api.put(`/incident-reports/${id}`, { status, reportType: "incident" });
      setReports((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      );
    } catch (error) {
      console.error("Failed to update report status", error);
      alert("Failed to update report status");
    }
  };

  return (
    <>
      <PageMeta
        title="Incident Reports | IDRMIS"
        description="Manage public incident reports"
      />
      <PageBreadcrumb pageTitle="Incident Reports" />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pb-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
              Incident Reports
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and manage public incident reports
            </p>
          </div>
          <div className="flex gap-3">
            <Button size="sm" onClick={fetchReports}>Refresh</Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${statusFilter === status
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                  }`}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-full md:w-80">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by report ID, category, severity, or location"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Report ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">No incident reports found</td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {report.reportCode || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {report.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {report.severity || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {[report.location?.addressLine, report.location?.city, report.location?.region]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        value={report.status}
                        onChange={(e) => handleStatusChange(report._id, e.target.value as IncidentReport["status"])}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="received">Received</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                      {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
