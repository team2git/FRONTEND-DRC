import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { formatAlertCategory } from "@/constants/alertCategories";

type AlertSubscription = {
  _id: string;
  status: "active" | "paused" | "unsubscribed";
  contact?: { fullName?: string; email?: string; phone?: string };
  location?: { country?: string; region?: string; city?: string };
  preferences?: { categories?: string[]; severities?: string[]; language?: string };
  delivery?: { channels?: string[] };
  updatedAt?: string;
  createdAt?: string;
};

const STATUS_OPTIONS = ["all", "active", "paused", "unsubscribed"] as const;

export default function AlertSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/alert-subscriptions");
      setSubscriptions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch alert subscriptions", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        sub.contact?.fullName,
        sub.contact?.email,
        sub.contact?.phone,
        sub.location?.city,
        sub.location?.region,
        sub.location?.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [subscriptions, searchTerm, statusFilter]);

  const handleStatusChange = async (id: string, status: AlertSubscription["status"]) => {
    try {
      await api.put(`/alert-subscriptions/${id}`, { status });
      setSubscriptions((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      );
    } catch (error) {
      console.error("Failed to update subscription status", error);
      alert("Failed to update subscription status");
    }
  };

  return (
    <>
      <PageMeta
        title="Alert Subscriptions | IDRMIS"
        description="Manage alert subscriptions and delivery preferences"
      />
      <PageBreadcrumb pageTitle="Alert Subscriptions" />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
              Alert Subscriptions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and manage public alert subscriptions
            </p>
          </div>
          <div className="flex gap-3">
            <Button size="sm" onClick={fetchSubscriptions}>Refresh</Button>
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
              placeholder="Search by name, email, phone, or location"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Preferences</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Delivery</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">Loading...</td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No subscriptions found</td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr
                    key={sub._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {sub.contact?.fullName || "—"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sub.contact?.email || "—"} · {sub.contact?.phone || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {[sub.location?.city, sub.location?.region, sub.location?.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      <div>
                        Categories: {(sub.preferences?.categories || []).map(formatAlertCategory).join(", ") || "—"}
                      </div>
                      <div>Severities: {(sub.preferences?.severities || []).join(", ") || "—"}</div>
                      <div>Lang: {sub.preferences?.language || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {(sub.delivery?.channels || []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub._id, e.target.value as AlertSubscription["status"])}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="unsubscribed">Unsubscribed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                      {sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : "—"}
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
