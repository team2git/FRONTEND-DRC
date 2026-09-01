import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import { toast } from "react-toastify";
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Phone,
} from "lucide-react";
import { formatAlertCategory } from "@/constants/alertCategories";

type SmsLog = {
  _id: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  category: string;
  severity: string;
  messageType: string;
  status: "pending" | "queued" | "sent" | "delivered" | "failed";
  messageId?: string;
  senderId?: string;
  broadcastBatchId?: string;
  errorDetails?: string;
  sentBy?: { name?: string; email?: string };
  createdAt: string;
};

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, categoryFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.get("/sms-logs", { params });
      setLogs(response.data?.logs || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch SMS logs", error);
      toast.error("Failed to fetch SMS logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const response = await api.post(`/sms-logs/resend/${id}`);
      toast.success(response.data?.message || "SMS resent successfully");
      fetchLogs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resend SMS");
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this SMS log record?")) return;
    try {
      await api.delete(`/sms-logs/${id}`);
      setLogs((prev) => prev.filter((item) => item._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("SMS log deleted");
    } catch (error: any) {
      toast.error("Failed to delete SMS log");
    }
  };

  const sentCount = logs.filter((l) => l.status === "sent" || l.status === "delivered").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  return (
    <>
      <PageMeta
        title="SMS Logs | IDRMIS"
        description="View outbound SMS alerts, delivery statuses, and broadcast dispatches"
      />
      <PageBreadcrumb pageTitle="SMS Logs & Broadcast History" />

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total SMS Logged
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
              {total}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Sent / Delivered
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
              {sentCount}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Failed Attempts
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
              {failedCount}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {["all", "sent", "delivered", "failed", "pending"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                    statusFilter === st
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {st}
                </button>
              ))}

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="all">All Categories</option>
                <option value="floods">Floods</option>
                <option value="drought">Drought</option>
                <option value="heat_wave">Heat Wave</option>
                <option value="earthquake">Earthquake</option>
                <option value="landslides">Landslides</option>
                <option value="structural_fire">Structural Fire</option>
                <option value="forest_fires">Forest Fires</option>
                <option value="test">Test</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search phone, message, sender..."
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950"
              >
                Search
              </button>
            </form>
          </div>

          {/* Logs Table */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/80 font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3.5">Recipient</th>
                    <th className="px-4 py-3.5">Message</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Time</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Loading SMS logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No SMS logs found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log._id}
                        className="transition hover:bg-gray-50/60 dark:hover:bg-slate-900/30"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{log.recipientPhone}</span>
                          </div>
                          {log.recipientName ? (
                            <div className="mt-0.5 text-[11px] text-gray-400">
                              {log.recipientName}
                            </div>
                          ) : null}
                        </td>

                        <td className="max-w-xs px-4 py-3">
                          <p className="line-clamp-2 text-gray-700 dark:text-gray-300">
                            {log.message}
                          </p>
                          {log.errorDetails ? (
                            <span className="mt-1 block text-[11px] text-rose-500">
                              Error: {log.errorDetails}
                            </span>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {formatAlertCategory(log.category)}
                          </span>
                        </td>

                        <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">
                          {log.messageType}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                              log.status === "sent" || log.status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : log.status === "failed"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                log.status === "sent" || log.status === "delivered"
                                  ? "bg-emerald-500"
                                  : log.status === "failed"
                                    ? "bg-rose-500"
                                    : "bg-amber-500"
                              }`}
                            />
                            {log.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {log.status === "failed" ? (
                              <button
                                type="button"
                                onClick={() => handleResend(log._id)}
                                disabled={resendingId === log._id}
                                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                title="Resend SMS"
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${
                                    resendingId === log._id ? "animate-spin" : ""
                                  }`}
                                />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleDelete(log._id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              title="Delete log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
