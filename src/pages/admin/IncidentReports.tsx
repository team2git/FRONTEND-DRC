import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";
import ReportDashboardCards from "../../components/admin/ReportDashboardCards";
import { Archive, CheckCircle2, Edit3, Eye, RotateCcw, Trash2 } from "lucide-react";
import { RowActionMenu } from "../../components/common/RowActionMenu";
import type { ReviewReport } from "./ReportReviewModal";
const ReportReviewModal = lazy(() => import("./ReportReviewModal").then((m) => ({ default: m.ReportReviewModal })));

type IncidentReport = ReviewReport & {
  reportType?: "incident";
  category?: string;
  details?: string;
};

const STATUS_OPTIONS = ["all", "new", "submitted", "received", "dispatched", "not_solved", "solved", "closed", "archived"] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
    case 'submitted': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'received': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
    case 'dispatched': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50';
    case 'not_solved': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
    case 'solved': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
    case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    case 'archived': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50';
    default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const getStatusFilterColor = (status: string) => {
  switch (status) {
    case "new": return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-300";
    case "submitted": return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
    case "received": return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300";
    case "dispatched": return "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/50 dark:bg-orange-500/10 dark:text-orange-300";
    case "not_solved": return "border-red-300 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300";
    case "solved": return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "closed": return "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300";
    case "archived": return "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-300";
    default: return "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-300";
  }
};

const getAvailableStatuses = (currentStatus: string) => {
  const statuses = ["new", "submitted", "received", "dispatched", "not_solved", "solved", "closed", "archived"];
  const currentIndex = statuses.indexOf(currentStatus || 'new');
  return statuses.map((status, index) => ({
    value: status,
    label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    disabled: currentStatus !== 'archived' && status !== 'archived' && index < currentIndex
  }));
};

export default function IncidentReports() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingReportId, setSavingReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);

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
      if (statusFilter === "all") {
        if (report.status === "archived") return false;
      } else if (report.status !== statusFilter) {
        return false;
      }
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

  const activeReports = useMemo(() => reports.filter((r) => r.status !== "archived"), [reports]);
  const openReports = activeReports.filter((report) => !["solved", "closed"].includes(report.status)).length;
  const notResolvedReports = activeReports.filter((report) => report.status === "not_solved").length;
  const highPriorityReports = activeReports.filter((report) => ["high", "critical"].includes(String(report.severity).toLowerCase())).length;
  const resolvedReports = activeReports.filter((report) => ["solved", "closed"].includes(report.status)).length;

  const handleStatusChange = async (id: string, status: IncidentReport["status"]) => {
    try {
      await api.put(`/incident-reports/${id}`, { status, reportType: "incident" });
      setReports((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      );
      setSelectedReport((prev) => (prev?._id === id ? { ...prev, status } : prev));
    } catch (error) {
      console.error("Failed to update report status", error);
      alert("Failed to update report status");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this incident report? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/incident-reports/${id}`);
      setReports((prev) => prev.filter((item) => item._id !== id));
      if (selectedReport?._id === id) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Failed to delete incident report", error);
      alert("Failed to delete incident report");
    }
  };

  const handleSaveReport = async (id: string, updates: Partial<ReviewReport>) => {
    setSavingReportId(id);
    try {
      const response = await api.put(`/incident-reports/${id}`, { ...updates, reportType: "incident" });
      const updated = response.data as IncidentReport;
      setReports((prev) => prev.map((item) => (item._id === id ? updated : item)));
      setSelectedReport((prev) => (prev?._id === id ? updated : prev));
    } catch (error) {
      console.error("Failed to save report details", error);
      alert("Failed to save report details");
    } finally {
      setSavingReportId(null);
    }
  };

  return (
    <>
      <PageMeta
        title="Incident Reports | IDRMIS"
        description="Manage public incident reports"
      />
      <PageBreadcrumb pageTitle="Incident Reports" />

      <ReportDashboardCards
        kind="incident"
        total={activeReports.length}
        open={openReports}
        priority={highPriorityReports}
        notResolved={notResolvedReports}
        completed={resolvedReports}
      />

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
                  ? getStatusFilterColor(status)
                  : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                  }`}
              >
                {status === "all" ? "All Active" : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Media</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Updated</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    {statusFilter === "archived" ? "No archived incident reports" : "No incident reports found"}
                  </td>
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
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none transition ${getStatusColor(report.status)}`}
                        value={report.status}
                        onChange={(e) => handleStatusChange(report._id, e.target.value as IncidentReport["status"])}
                      >
                        {getAvailableStatuses(report.status).map(s => (
                          <option key={s.value} value={s.value} disabled={s.disabled}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {(report.attachments?.length || 0) > 0 ? `${report.attachments?.length} file(s)` : "None"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                      {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-primary/50 hover:text-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                        <RowActionMenu
                          actions={[
                            { label: "Edit report", icon: <Edit3 size={15} />, onClick: () => setSelectedReport(report) },
                            {
                              label: "Mark as solved",
                              icon: <CheckCircle2 size={15} />,
                              onClick: () => handleStatusChange(report._id, "solved"),
                              hidden: ["solved", "closed", "archived"].includes(report.status),
                            },
                            {
                              label: "Archive report",
                              icon: <Archive size={15} />,
                              onClick: () => handleStatusChange(report._id, "archived"),
                              hidden: report.status === "archived",
                            },
                            {
                              label: "Restore / Unarchive",
                              icon: <RotateCcw size={15} />,
                              onClick: () => handleStatusChange(report._id, "new"),
                              hidden: report.status !== "archived",
                            },
                            {
                              label: "Delete permanently",
                              icon: <Trash2 size={15} className="text-red-500" />,
                              onClick: () => handleDeleteReport(report._id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Suspense fallback={null}>
        <ReportReviewModal
          open={!!selectedReport}
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onSave={handleSaveReport}
          saving={savingReportId === selectedReport?._id}
        />
      </Suspense>
    </>
  );
}
