import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link, useNavigate } from "react-router";
import api from "@/api/axios";
import {
  connectDashboardSocket,
  getDashboardSocket,
} from "@/features/live-dashboard/socket/dashboardSocket";
import {
  Bell,
  AlertTriangle,
  MessageSquareWarning,
  Check,
  CheckCheck,
  MapPin,
  Clock,
  ExternalLink,
  Flame,
  Droplets,
  HeartPulse,
  Car,
  Zap,
  RefreshCw,
  X,
  ShieldAlert,
  BellRing,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PublicReportNotification {
  _id: string;
  reportCode?: string;
  reportType?: "incident" | "concern";
  category?: string;
  concernCategory?: string;
  severity?: "minor" | "moderate" | "critical" | string;
  details?: string;
  concernDetails?: string;
  location?: {
    addressLine?: string;
    city?: string;
    region?: string;
  };
  status?: "submitted" | "received" | "dispatched" | "closed" | string;
  isRead?: boolean;
  createdAt: string;
}

interface LiveToast {
  id: string;
  report: PublicReportNotification;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getCategoryIcon = (category: string, type: string, cls = "w-3.5 h-3.5") => {
  const c = (category || "").toLowerCase();
  if (c.includes("fire")) return <Flame className={`${cls} text-rose-500`} />;
  if (c.includes("flood") || c.includes("water")) return <Droplets className={`${cls} text-sky-500`} />;
  if (c.includes("medical") || c.includes("health")) return <HeartPulse className={`${cls} text-emerald-500`} />;
  if (c.includes("traffic") || c.includes("accident")) return <Car className={`${cls} text-amber-500`} />;
  if (c.includes("power") || c.includes("electric")) return <Zap className={`${cls} text-yellow-500`} />;
  if (type === "concern") return <MessageSquareWarning className={`${cls} text-indigo-500`} />;
  return <AlertTriangle className={`${cls} text-orange-500`} />;
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return "recently";
  const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ─── Live Alert Toast ─────────────────────────────────────────────────────────
function LiveAlertToast({
  toast,
  onDismiss,
  onView,
}: {
  toast: LiveToast;
  onDismiss: () => void;
  onView: () => void;
}) {
  const { report } = toast;
  const isCritical = (report.severity || "").toLowerCase() === "critical";
  const isConcern = report.reportType === "concern";
  const categoryName =
    report.category || report.concernCategory || (isConcern ? "Public Concern" : "Incident");

  useEffect(() => {
    const timer = setTimeout(onDismiss, 7000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md
        ${
          isCritical
            ? "bg-red-50/98 dark:bg-red-950/95 border-red-200 dark:border-red-800"
            : isConcern
            ? "bg-indigo-50/98 dark:bg-indigo-950/95 border-indigo-200 dark:border-indigo-800"
            : "bg-white/98 dark:bg-slate-900/98 border-slate-200 dark:border-slate-700"
        }
      `}
      style={{ animation: "slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
          isCritical
            ? "bg-red-100 dark:bg-red-900/60 border-red-200 dark:border-red-800"
            : isConcern
            ? "bg-indigo-100 dark:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800"
            : "bg-amber-100 dark:bg-amber-900/60 border-amber-200 dark:border-amber-800"
        }`}
      >
        {getCategoryIcon(categoryName, report.reportType || "incident", "w-4 h-4")}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
              isConcern
                ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
            }`}
          >
            New {isConcern ? "Concern" : "Incident"}
          </span>
          {isCritical && (
            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-red-600 text-white animate-pulse">
              CRITICAL
            </span>
          )}
          {report.reportCode && (
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              #{report.reportCode}
            </span>
          )}
        </div>
        <p className="text-[12.5px] font-bold text-slate-900 dark:text-white truncate">{categoryName}</p>
        {report.location?.city && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">
              {[report.location.addressLine, report.location.city].filter(Boolean).join(", ")}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={onView}
          title="View report"
          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDismiss}
          title="Dismiss"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [reports, setReports] = useState<PublicReportNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "incident" | "concern" | "unread">("all");
  const [hasNewAlertAnimation, setHasNewAlertAnimation] = useState(false);
  const [liveToasts, setLiveToasts] = useState<LiveToast[]>([]);
  const [badgePop, setBadgePop] = useState(false);
  const navigate = useNavigate();

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/incident-reports/unread");
      if (res.data) {
        setReports(res.data.reports || []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch notification reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load + polling ──
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── WebSocket real-time events ──
  useEffect(() => {
    const socket = connectDashboardSocket();

    const handleNewNotification = (data: any) => {
      const payload: PublicReportNotification = data.payload || data;
      if (!payload || !payload._id) return;

      setReports((prev) => {
        if (prev.some((r) => r._id === payload._id)) return prev;
        return [{ ...payload, isRead: false }, ...prev];
      });

      // Increase badge count
      setUnreadCount((prev) => prev + 1);

      // Badge pop animation
      setBadgePop(true);
      setTimeout(() => setBadgePop(false), 500);

      // Bell animation
      setHasNewAlertAnimation(true);
      setTimeout(() => setHasNewAlertAnimation(false), 5000);

      // Live toast popup (max 3 stacked)
      const toastId = `${payload._id}-${Date.now()}`;
      setLiveToasts((prev) => [{ id: toastId, report: payload }, ...prev].slice(0, 3));
    };

    const handleIncidentCreated = (data: any) => {
      const payload = data.payload || data;
      if (!payload || !payload._id) return;
      handleNewNotification({ payload });
    };

    const handleIncidentUpdated = (data: any) => {
      const payload = data.payload || data;
      if (!payload || !payload._id) return;
      setReports((prev) =>
        prev.map((r) => (r._id === payload._id ? { ...r, ...payload } : r))
      );
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("incident:created", handleIncidentCreated);
    socket.on("incident:updated", handleIncidentUpdated);

    return () => {
      const s = getDashboardSocket();
      s.off("notification:new", handleNewNotification);
      s.off("incident:created", handleIncidentCreated);
      s.off("incident:updated", handleIncidentUpdated);
    };
  }, []);

  // ── Mark single report as read → decrements badge count ──
  const markAsRead = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    const wasUnread = reports.find((r) => r._id === id && !r.isRead);
    setReports((prev) => prev.map((r) => (r._id === id ? { ...r, isRead: true } : r)));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/incident-reports/${id}/read`);
    } catch (err) {
      console.error("Failed to mark report as read:", err);
      // Rollback on error
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, isRead: false } : r)));
      if (wasUnread) setUnreadCount((prev) => prev + 1);
    }
  }, [reports]);

  // ── Mark all as read → zeroes badge ──
  const markAllAsRead = useCallback(async () => {
    setReports((prev) => prev.map((r) => ({ ...r, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch("/incident-reports/mark-all-read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Click notification: mark as read + navigate ──
  const handleItemClick = useCallback(
    (report: PublicReportNotification) => {
      if (!report.isRead) markAsRead(report._id);
      setIsOpen(false);
      navigate(report.reportType === "concern" ? "/admin/concern-reports" : "/admin/incident-reports");
    },
    [markAsRead, navigate]
  );

  // ── Open/close dropdown ──
  const handleBellClick = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    setHasNewAlertAnimation(false);
  }, [isOpen]);

  // ── Dismiss live toast ──
  const dismissToast = useCallback((id: string) => {
    setLiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Filtered list ──
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (activeFilter === "unread") return !r.isRead || r.status === "submitted";
      if (activeFilter === "incident") return r.reportType !== "concern";
      if (activeFilter === "concern") return r.reportType === "concern";
      return true;
    });
  }, [reports, activeFilter]);

  const counts = useMemo(() => {
    const unread = reports.filter((r) => !r.isRead || r.status === "submitted").length;
    const incidents = reports.filter((r) => r.reportType !== "concern").length;
    const concerns = reports.filter((r) => r.reportType === "concern").length;
    return { all: reports.length, unread, incidents, concerns };
  }, [reports]);

  const FILTERS = [
    { id: "all", label: "All", count: counts.all },
    { id: "unread", label: "Unread", count: counts.unread },
    { id: "incident", label: "🚨 Incidents", count: counts.incidents },
    { id: "concern", label: "💬 Concerns", count: counts.concerns },
  ];

  return (
    <>
      {/* ── Slide-in Live Toast Stack (top-right) ── */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes badgePop {
          0% { transform: scale(1); }
          40% { transform: scale(1.6); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .badge-pop { animation: badgePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      <div className="fixed top-20 right-4 z-[99999] flex flex-col gap-2 w-[310px] pointer-events-none">
        {liveToasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <LiveAlertToast
              toast={t}
              onDismiss={() => dismissToast(t.id)}
              onView={() => {
                dismissToast(t.id);
                handleItemClick(t.report);
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Trigger Button ── */}
      <div className="relative">
        <button
          onClick={handleBellClick}
          className={`
            relative flex items-center justify-center transition-all duration-200
            bg-white border rounded-full h-11 w-11 shadow-theme-xs
            ${
              isOpen
                ? "text-blue-600 bg-blue-50/80 border-blue-200 dark:text-blue-400 dark:bg-slate-800 dark:border-blue-800"
                : "text-gray-500 border-gray-200 hover:text-blue-600 hover:bg-blue-50/60 hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
            }
          `}
          aria-label="Public Notifications"
          title="Public Incidents & Concerns"
        >
          {hasNewAlertAnimation ? (
            <BellRing className="w-5 h-5 text-blue-500" style={{ animation: "bellRing 0.6s ease infinite" }} />
          ) : (
            <Bell className="w-5 h-5" />
          )}

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-gray-900 shadow-sm ${badgePop ? "badge-pop" : ""}`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
              {hasNewAlertAnimation && (
                <span className="absolute -inset-1 rounded-full bg-rose-400 opacity-60 animate-ping" />
              )}
            </span>
          )}
        </button>

        {/* ── Notification Panel ── */}
        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="absolute -right-[230px] sm:-right-4 mt-2.5 flex h-[600px] w-[370px] sm:w-[440px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-900 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Panel Header */}
          <div className="relative px-4 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.06] via-transparent to-indigo-600/[0.04] dark:from-blue-500/10 dark:to-indigo-500/8 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      Public Reports
                    </h5>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Incidents &amp; concerns by citizens
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 shrink-0 overflow-x-auto no-scrollbar">
            {FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`min-w-[18px] text-center px-1 py-0.5 rounded-full text-[10px] font-black ${
                    activeFilter === tab.id
                      ? "bg-white/25 text-white"
                      : tab.id === "unread" && tab.count > 0
                      ? "bg-rose-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {loading && reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-slate-400">
                <div className="w-10 h-10 rounded-full border-2 border-blue-200 dark:border-blue-800 border-t-blue-500 animate-spin" />
                <p className="text-xs font-medium">Loading notifications…</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                  <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-slate-600 dark:text-slate-400">
                    {activeFilter === "unread" ? "All caught up!" : "No reports found"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeFilter === "unread"
                      ? "You've reviewed all public reports"
                      : "No reports in this category yet"}
                  </p>
                </div>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isUnread = !report.isRead || report.status === "submitted";
                const isConcern = report.reportType === "concern";
                const categoryName =
                  report.category ||
                  report.concernCategory ||
                  (isConcern ? "Public Concern" : "Incident");
                const detailsText =
                  report.details || report.concernDetails || "No additional description provided.";
                const isCritical = (report.severity || "").toLowerCase() === "critical";

                return (
                  <div
                    key={report._id}
                    onClick={() => handleItemClick(report)}
                    className={`relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 group ${
                      isUnread
                        ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.08] hover:bg-blue-500/[0.08] dark:hover:bg-blue-500/[0.13]"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Unread left accent bar */}
                    {isUnread && (
                      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-blue-500" />
                    )}

                    {/* Category icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                        isCritical
                          ? "bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800"
                          : isConcern
                          ? "bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800"
                          : "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {getCategoryIcon(categoryName, report.reportType || "incident")}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      {/* Meta row */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isConcern
                                ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
                                : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {isConcern ? "Concern" : "Incident"}
                          </span>

                          {report.reportCode && (
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              #{report.reportCode}
                            </span>
                          )}

                          {report.severity && !isConcern && (
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                isCritical
                                  ? "bg-rose-600 text-white animate-pulse"
                                  : report.severity === "moderate"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                  : "bg-sky-500/20 text-sky-700 dark:text-sky-300"
                              }`}
                            >
                              {report.severity}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 shrink-0 font-medium flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(report.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h6
                        className={`text-[12.5px] font-bold truncate ${
                          isUnread
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {categoryName}
                      </h6>

                      {/* Details */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {detailsText}
                      </p>

                      {/* Location */}
                      {report.location && (report.location.addressLine || report.location.city) && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5 truncate">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {[report.location.addressLine, report.location.city, report.location.region]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: unread dot + mark-read button */}
                    <div className="flex flex-col items-center justify-between self-stretch shrink-0 gap-1.5 pl-1">
                      {isUnread && (
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 mt-1.5 shrink-0"
                          title="Unread"
                        />
                      )}
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => markAsRead(report._id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all duration-150"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center gap-2 shrink-0">
            <Link
              to="/admin/incident-reports"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm flex items-center justify-center gap-1.5 group"
            >
              <AlertTriangle className="w-3.5 h-3.5 group-hover:text-blue-500 transition" />
              <span>Incident Manager</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition ml-auto" />
            </Link>
            <Link
              to="/admin/concern-reports"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm flex items-center justify-center gap-1.5 group"
            >
              <MessageSquareWarning className="w-3.5 h-3.5 transition" />
              <span>Public Concerns</span>
              <ExternalLink className="w-3 h-3 text-indigo-400 transition ml-auto" />
            </Link>
          </div>
        </Dropdown>
      </div>
    </>
  );
}
