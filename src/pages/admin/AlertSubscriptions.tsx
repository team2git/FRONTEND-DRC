import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import ReportDashboardCards from "../../components/admin/ReportDashboardCards";
import { Pause, Play, Trash2 } from "lucide-react";
import { RowActionMenu } from "../../components/common/RowActionMenu";
import {
  AlertHexaIcon,
  ArrowRightIcon,
  CalenderIcon,
  CheckCircleIcon,
  ChatIcon,
  EyeIcon,
  PaperPlaneIcon,
  PlusIcon,
  TimeIcon,
} from "@/icons";
import { ALERT_HAZARD_GROUPS, formatAlertCategory } from "@/constants/alertCategories";
const SubscriptionReviewModal = lazy(() => import("./SubscriptionReviewModal"));

type AlertSubscription = {
  _id: string;
  status: "active" | "paused" | "unsubscribed";
  contact?: { fullName?: string; email?: string; phone?: string; altPhone?: string };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    subCity?: string;
    woreda?: string;
    addressLine?: string;
    latitude?: number | null;
    longitude?: number | null;
    radiusKm?: number;
    additionalLocations?: Array<{ label?: string; addressLine?: string; latitude?: number | null; longitude?: number | null }>;
  };
  preferences?: {
    categories?: string[];
    severities?: string[];
    minAlertLevel?: string;
    language?: string;
    quietHours?: { enabled?: boolean; start?: string; end?: string };
  };
  household?: {
    householdSize?: number;
    specialNeeds?: string[];
    assetsAtRisk?: string[];
    notes?: string;
  };
  delivery?: {
    channels?: string[];
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    // whatsappEnabled?: boolean;
    // inAppEnabled?: boolean;
    // voiceCallEnabled?: boolean;
    // emergencyContact?: string;
  };
  consent?: { accepted?: boolean; acceptedAt?: string };
  updatedAt?: string;
  createdAt?: string;
};

type TabKey = "compose" | "subscribers";

type ComposeState = {
  title: string;
  message: string;
  smsMessage: string;
  hazard: string;
  severity: string;
  channel: string;
  audience: string;
  sourceAuthority: string;
  scheduleDate: string;
  scheduleTime: string;
};

type BroadcastItem = {
  date: string;
  time: string;
  title: string;
  recipients: number;
};

type SegmentSummary = {
  key: string;
  label: string;
  count: number;
};

type ChannelPreset = {
  label: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  characterLimit: number;
  shortHint: string;
  recipientLabel: string;
};

const STATUS_OPTIONS = ["all", "active", "paused", "unsubscribed"] as const;
const TABS: Array<{ key: TabKey; label: string; description: string }> = [
  { key: "compose", label: "Send Alert", description: "Compose and send messages to subscribers" },
  { key: "subscribers", label: "Subscribers", description: "View and manage subscriber list and preferences" },
];

const RECENT_BROADCASTS: BroadcastItem[] = [
  { date: "2026-07-15", time: "14:30", title: "Heatwave advisory", recipients: 980 },
  { date: "2026-07-14", time: "09:15", title: "Road closure - Highway 7", recipients: 1102 },
  { date: "2026-07-12", time: "06:45", title: "Water restriction notice", recipients: 1247 },
];

const CHANNEL_PRESETS: Record<string, ChannelPreset> = {
  email: {
    label: "Email",
    bodyLabel: "Full Message (Email / Push)",
    bodyPlaceholder:
      "The Meteorological Department has issued a Flood Warning for all coastal areas effective immediately. Residents in low-lying zones should evacuate to designated shelters.",
    characterLimit: 1000,
    shortHint: "Long-form bulletin for email and push delivery.",
    recipientLabel: "Recipients",
  },
  sms: {
    label: "SMS",
    bodyLabel: "SMS Message",
    bodyPlaceholder:
      "Flood warning for coastal areas. Evacuate low-lying zones now. Avoid flood-prone roads and wait for official updates.",
    characterLimit: 160,
    shortHint: "Short alert optimized for SMS delivery.",
    recipientLabel: "SMS recipients",
  },
};

const initialComposeState: ComposeState = {
  title: "Flood Warning - Coastal Areas",
  message:
    "The Meteorological Department has issued a Flood Warning for all coastal areas effective immediately. Residents in low-lying zones should evacuate to designated shelters. Avoid all flood-prone roads and do not attempt to cross flooded streams or bridges.",
  smsMessage: "Flood warning for coastal areas. Evacuate low-lying zones now. Avoid flood roads.",
  hazard: "floods",
  severity: "high",
  channel: "email",
  audience: "all",
  sourceAuthority: "Meteorological Dept",
  scheduleDate: "2026-07-18",
  scheduleTime: "06:00",
};

const formatCount = (value: number) => new Intl.NumberFormat("en-US").format(value);

const LOCATION_GROUP_ALL = "all";
const HAZARD_GROUP_ALL = "all";

const normalizeText = (value?: string | null) => (value || "").trim().toLowerCase();

const buildLocationLabel = (subscription: AlertSubscription) => {
  const parts = [
    subscription.location?.woreda,
    subscription.location?.subCity,
    subscription.location?.city,
    subscription.location?.region,
    subscription.location?.country,
  ].filter(Boolean);
  return parts.join(", ") || "Unknown location";
};

const formatPin = (latitude?: number | null, longitude?: number | null) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") return "Pin not set";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

const buildLocationKey = (subscription: AlertSubscription) =>
  [
    normalizeText(subscription.location?.woreda),
    normalizeText(subscription.location?.subCity),
    normalizeText(subscription.location?.city),
    normalizeText(subscription.location?.region),
    normalizeText(subscription.location?.country),
  ]
    .filter(Boolean)
    .join("|") || "unknown";

const buildHazardLabel = (categories: string[] | undefined) =>
  (categories || []).map(formatAlertCategory).filter(Boolean).join(", ") || "Unspecified";

const matchesHazard = (subscription: AlertSubscription, hazard: string) => {
  if (!hazard || hazard === HAZARD_GROUP_ALL) return true;
  return (subscription.preferences?.categories || []).some((category) => normalizeText(category) === normalizeText(hazard));
};

const matchesLocation = (subscription: AlertSubscription, locationKey: string) => {
  if (!locationKey || locationKey === LOCATION_GROUP_ALL) return true;
  return buildLocationKey(subscription) === locationKey;
};

export default function AlertSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [activeTab, setActiveTab] = useState<TabKey>("compose");
  const [composeState, setComposeState] = useState<ComposeState>(initialComposeState);
  const [locationTarget, setLocationTarget] = useState(LOCATION_GROUP_ALL);
  const [hazardTarget, setHazardTarget] = useState(HAZARD_GROUP_ALL);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"attach" | "scheduled" | "test">("scheduled");
  const [selectedSubscription, setSelectedSubscription] = useState<AlertSubscription | null>(null);

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
        sub.contact?.altPhone,
        sub.location?.addressLine,
        sub.location?.woreda,
        sub.location?.subCity,
        sub.location?.city,
        sub.location?.region,
        sub.location?.country,
        sub.location?.latitude?.toString(),
        sub.location?.longitude?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [subscriptions, searchTerm, statusFilter]);

  const locationSegments = useMemo<SegmentSummary[]>(() => {
    const counts = new Map<string, SegmentSummary>();
    subscriptions.forEach((sub) => {
      const key = buildLocationKey(sub);
      const label = buildLocationLabel(sub);
      const current = counts.get(key);
      counts.set(key, {
        key,
        label,
        count: (current?.count || 0) + 1,
      });
    });
    return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [subscriptions]);

  const hazardSegments = useMemo<SegmentSummary[]>(() => {
    const counts = new Map<string, SegmentSummary>();
    subscriptions.forEach((sub) => {
      (sub.preferences?.categories || []).forEach((category) => {
        const key = normalizeText(category) || "unknown";
        const label = formatAlertCategory(category);
        const current = counts.get(key);
        counts.set(key, {
          key,
          label,
          count: (current?.count || 0) + 1,
        });
      });
    });
    return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [subscriptions]);

  const targetedSubscriptions = useMemo(() => {
    return filteredSubscriptions.filter((sub) => matchesLocation(sub, locationTarget) && matchesHazard(sub, hazardTarget));
  }, [filteredSubscriptions, hazardTarget, locationTarget]);

  const recipientCount = useMemo(() => {
    const audiencePool =
      composeState.audience === "active"
        ? subscriptions.filter((sub) => sub.status === "active")
        : composeState.audience === "paused"
          ? subscriptions.filter((sub) => sub.status === "paused")
          : composeState.audience === "unsubscribed"
            ? subscriptions.filter((sub) => sub.status === "unsubscribed")
            : subscriptions;

    return audiencePool.filter(
      (sub) => matchesLocation(sub, locationTarget) && matchesHazard(sub, hazardTarget)
    ).length;
  }, [composeState.audience, hazardTarget, locationTarget, subscriptions]);

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active").length;
  const pausedSubscriptions = subscriptions.filter((subscription) => subscription.status === "paused").length;
  const coveredSubscriptions = subscriptions.filter((subscription) => (subscription.preferences?.categories?.length || 0) > 0).length;
  const coveragePercentage = subscriptions.length ? Math.round((coveredSubscriptions / subscriptions.length) * 100) : 0;

  const hazardGroupLabel = useMemo(() => {
    const group = ALERT_HAZARD_GROUPS.find((item) =>
      item.items.some((hazard) => hazard === composeState.hazard)
    );
    return group?.title ?? "Other";
  }, [composeState.hazard]);

  const alertCategoryLabel = useMemo(() => formatAlertCategory(composeState.hazard), [composeState.hazard]);
  const targetedLocationLabel = useMemo(() => {
    if (locationTarget === LOCATION_GROUP_ALL) return "All locations";
    return locationSegments.find((segment) => segment.key === locationTarget)?.label ?? "Selected location";
  }, [locationSegments, locationTarget]);
  const targetedHazardLabel = useMemo(() => {
    if (hazardTarget === HAZARD_GROUP_ALL) return "All hazard interests";
    return hazardSegments.find((segment) => segment.key === hazardTarget)?.label ?? "Selected hazard group";
  }, [hazardSegments, hazardTarget]);

  const handleStatusChange = async (id: string, status: AlertSubscription["status"]) => {
    try {
      await api.put(`/alert-subscriptions/${id}`, { status });
      setSubscriptions((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
      setSelectedSubscription((prev) => (prev?._id === id ? { ...prev, status } : prev));
    } catch (error) {
      console.error("Failed to update subscription status", error);
      alert("Failed to update subscription status");
    }
  };

  const handleSaveSubscription = async (id: string, updates: Partial<AlertSubscription>) => {
    try {
      const response = await api.put(`/alert-subscriptions/${id}`, updates);
      const updated = response.data as AlertSubscription;
      setSubscriptions((prev) => prev.map((item) => (item._id === id ? updated : item)));
      setSelectedSubscription(updated);
    } catch (error) {
      console.error("Failed to save alert subscription", error);
      alert("Failed to save subscriber details");
    }
  };

  const handleDeleteSubscription = async (subscription: AlertSubscription) => {
    const name = subscription.contact?.fullName || subscription.contact?.email || "this subscriber";
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/alert-subscriptions/${subscription._id}`);
      setSubscriptions((prev) => prev.filter((item) => item._id !== subscription._id));
      setSelectedSubscription(null);
    } catch (error) {
      console.error("Failed to delete alert subscription", error);
      alert("Failed to delete subscriber");
    }
  };

  const handleSendAlert = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!composeState.title.trim() || !composeState.message.trim()) {
      setFeedbackMessage("Please enter both a subject line and a message before sending.");
      return;
    }

    setIsSending(true);
    setFeedbackMessage(
      `Draft alert prepared for ${formatCount(recipientCount)} recipients in ${targetedLocationLabel} under ${targetedHazardLabel}.`
    );

    setTimeout(() => {
      setComposeState(initialComposeState);
      setDeliveryMode("scheduled");
      setLocationTarget(LOCATION_GROUP_ALL);
      setHazardTarget(HAZARD_GROUP_ALL);
      setIsSending(false);
    }, 600);
  };

  const subjectCharacterCount = composeState.title.length;
  const messageCharacterCount = composeState.message.length;
  const smsCharacterCount = composeState.smsMessage.length;

  return (
    <>
      <PageMeta
        title="Alert Subscriptions | IDRMIS"
        description="Send alerts and manage subscriber preferences"
      />
      <PageBreadcrumb pageTitle="Alert Subscriptions" />

      <ReportDashboardCards
        kind="subscription"
        total={subscriptions.length}
        open={activeSubscriptions}
        priority={pausedSubscriptions}
        completed={coveragePercentage}
      />

      <div className="space-y-4">
        <section className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/20">
                <AlertHexaIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[1.35rem] font-semibold leading-none text-gray-900 dark:text-white">
                  AlertBroadcast
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                  Emergency Comms System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.65)]" />
              <span className="uppercase tracking-[0.24em]">System Online</span>
            </div>
          </div>

          {/* <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <span className="mr-2 font-semibold">Warning:</span>
            Active weather event: Flood Warning issued by Meteorological Dept - expires 2026-07-18 06:00 UTC
          </div> */}

          <div className="mt-6 flex flex-wrap gap-3">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-950"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "compose" ? (
            <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_0.82fr]">
              <form
                onSubmit={handleSendAlert}
                className="rounded-3xl border border-gray-200 bg-white p-0 shadow-sm dark:border-gray-800 dark:bg-slate-950/30"
              >
                <div className="border-b border-gray-200 px-5 py-4.5 dark:border-gray-800">
                  <h4 className="text-[15px] font-medium text-gray-900 dark:text-white">Compose Broadcast</h4>
                </div>

                <div className="space-y-5 px-5 py-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                          Hazard Type
                        </label>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Categorized as {alertCategoryLabel}
                        </span>
                      </div>
                      <div className="relative">
                        <select
                          value={composeState.hazard}
                          onChange={(event) =>
                            setComposeState((prev) => ({ ...prev, hazard: event.target.value }))
                          }
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          {ALERT_HAZARD_GROUPS.map((group) => (
                            <optgroup key={group.id} label={group.title}>
                              {group.items.map((hazard) => (
                                <option key={hazard} value={hazard}>
                                  {formatAlertCategory(hazard)}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                        Hazard group: {hazardGroupLabel}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Category Preview
                      </label>
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white">
                        {alertCategoryLabel}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Target Location
                      </label>
                      <div className="relative">
                        <select
                          value={locationTarget}
                          onChange={(event) => setLocationTarget(event.target.value)}
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          <option value={LOCATION_GROUP_ALL}>All locations</option>
                          {locationSegments.map((segment) => (
                            <option key={segment.key} value={segment.key}>
                              {segment.label} ({formatCount(segment.count)})
                            </option>
                          ))}
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Target Hazard Group
                      </label>
                      <div className="relative">
                        <select
                          value={hazardTarget}
                          onChange={(event) => setHazardTarget(event.target.value)}
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          <option value={HAZARD_GROUP_ALL}>All hazard interests</option>
                          {hazardSegments.map((segment) => (
                            <option key={segment.key} value={segment.key}>
                              {segment.label} ({formatCount(segment.count)})
                            </option>
                          ))}
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Email Version - Subject Line
                      </label>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {subjectCharacterCount} / 160 characters
                      </span>
                    </div>
                    <input
                      value={composeState.title}
                      maxLength={160}
                      onChange={(event) => setComposeState((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Flood Warning - Coastal Areas"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 text-[15px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Email Version - Full Message
                      </label>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {messageCharacterCount} / 1000 characters
                      </span>
                    </div>
                    <textarea
                      value={composeState.message}
                      onChange={(event) => setComposeState((prev) => ({ ...prev, message: event.target.value }))}
                      rows={6}
                      maxLength={1000}
                      placeholder={CHANNEL_PRESETS.email.bodyPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 text-[15px] leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                    />
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                      Long-form bulletin for email and push delivery.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        SMS Version - Max 160 chars
                      </label>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {smsCharacterCount} / 160 characters
                      </span>
                    </div>
                    <textarea
                      value={composeState.smsMessage}
                      onChange={(event) =>
                        setComposeState((prev) => ({ ...prev, smsMessage: event.target.value.slice(0, 160) }))
                      }
                      rows={3}
                      maxLength={160}
                      placeholder={CHANNEL_PRESETS.sms.bodyPlaceholder}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 text-[15px] leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                    />
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                      Short alert optimized for SMS delivery.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Audience
                      </label>
                      <div className="relative">
                        <select
                          value={composeState.audience}
                          onChange={(event) =>
                            setComposeState((prev) => ({ ...prev, audience: event.target.value }))
                          }
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          <option value="all">All Subscribers</option>
                          <option value="active">Active Subscribers</option>
                          <option value="paused">Paused Subscribers</option>
                          <option value="unsubscribed">Unsubscribed Contacts</option>
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                      <p className="mt-2 text-[13px] text-gray-500 dark:text-gray-400">
                        Recipients:{" "}
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {formatCount(recipientCount)}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Source Authority
                      </label>
                      <div className="relative">
                        <select
                          value={composeState.sourceAuthority}
                          onChange={(event) =>
                            setComposeState((prev) => ({ ...prev, sourceAuthority: event.target.value }))
                          }
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          <option>Meteorological Dept</option>
                          <option>Disaster Management</option>
                          <option>Local Administration</option>
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          value={composeState.severity}
                          onChange={(event) =>
                            setComposeState((prev) => ({ ...prev, severity: event.target.value }))
                          }
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Delivery Channel
                      </label>
                      <div className="relative">
                        <select
                          value={composeState.channel}
                          onChange={(event) => setComposeState((prev) => ({ ...prev, channel: event.target.value }))}
                          className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4.5 py-3.5 pr-11 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                        >
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="push">Push Notification</option>
                        </select>
                        <ArrowRightIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Schedule
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <CalenderIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            value={composeState.scheduleDate}
                            onChange={(event) =>
                              setComposeState((prev) => ({ ...prev, scheduleDate: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                          />
                        </div>
                        <div className="relative">
                          <TimeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          <input
                            type="time"
                            value={composeState.scheduleTime}
                            onChange={(event) =>
                              setComposeState((prev) => ({ ...prev, scheduleTime: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-[15px] text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMode("attach");
                          setFeedbackMessage("Attachment picker is not wired in this view yet.");
                        }}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4.5 py-2.5 text-[13px] font-medium transition ${
                          deliveryMode === "attach"
                            ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
                            : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Attach
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMode("scheduled")}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4.5 py-2.5 text-[13px] font-medium transition ${
                          deliveryMode === "scheduled"
                            ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
                            : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <CalenderIcon className="h-3.5 w-3.5" />
                        Scheduled
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMode("test");
                          setFeedbackMessage("A test broadcast preview is ready for review.");
                        }}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4.5 py-2.5 text-[13px] font-medium transition ${
                          deliveryMode === "test"
                            ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
                            : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <ChatIcon className="h-3.5 w-3.5" />
                        Test
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setFeedbackMessage("Draft saved locally for later review.")}
                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Save Draft
                      </button>
                      <button
                        type="submit"
                        disabled={isSending}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <PaperPlaneIcon className="h-3.5 w-3.5" />
                        {isSending ? "Sending..." : "Send Now"}
                      </button>
                    </div>
                  </div>

                  {feedbackMessage ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                      {feedbackMessage}
                    </div>
                  ) : null}
                </div>
              </form>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-slate-950/30">
                  <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <h4 className="text-[15px] font-medium text-gray-900 dark:text-white">Broadcast Summary</h4>
                  </div>
                  <div className="space-y-3.5 px-5 py-5 text-[13px] text-gray-600 dark:text-gray-300">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Audience
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white">
                        {composeState.audience === "all"
                          ? "All Subscribers"
                          : composeState.audience === "active"
                            ? "Active Subscribers"
                            : composeState.audience === "paused"
                              ? "Paused Subscribers"
                              : "Unsubscribed Contacts"}
                      </div>
                      <div className="mt-1 text-amber-600 dark:text-amber-400">
                        {formatCount(recipientCount)} recipients
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Target Location
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white">
                        {targetedLocationLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Target Hazard Group
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white">
                        {targetedHazardLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Channel
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white capitalize">
                        {composeState.channel === "sms" ? "sms" : "email"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Category
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white">
                        {alertCategoryLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Priority
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white capitalize">
                        {composeState.severity}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Hazard Group
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white">
                        {hazardGroupLabel}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Scheduled For
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-gray-900 dark:text-white">
                        {composeState.scheduleDate} {composeState.scheduleTime}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-slate-950/30">
                  <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <h4 className="text-[15px] font-medium text-gray-900 dark:text-white">Recent Broadcasts</h4>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {RECENT_BROADCASTS.map((item) => (
                      <div key={`${item.date}-${item.time}-${item.title}`} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                            {item.date}
                          </div>
                          <div className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">{item.time}</div>
                          <div className="mt-1.5 text-[14px] text-gray-900 dark:text-white">{item.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[16px] font-medium text-gray-500 dark:text-gray-400">
                            {formatCount(item.recipients)}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400">rcpt</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      View all
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                        statusFilter === status
                          ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="w-full md:w-80">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name, email, phone, or location"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-amber-500 dark:focus:ring-amber-500/10"
                    />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[15px] font-medium text-gray-900 dark:text-white">Top Locations</h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Subscriber distribution by reported location
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                      {formatCount(subscriptions.length)} total
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {locationSegments.slice(0, 5).map((segment) => (
                      <button
                        key={segment.key}
                        type="button"
                        onClick={() => setLocationTarget(segment.key)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          locationTarget === segment.key
                            ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-100"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                        }`}
                      >
                        <span className="text-sm font-medium">{segment.label}</span>
                        <span className="text-sm font-semibold">{formatCount(segment.count)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[15px] font-medium text-gray-900 dark:text-white">Top Hazard Groups</h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Subscriber distribution by alert preference
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                      {formatCount(subscriptions.length)} total
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {hazardSegments.slice(0, 5).map((segment) => (
                      <button
                        key={segment.key}
                        type="button"
                        onClick={() => setHazardTarget(segment.key)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          hazardTarget === segment.key
                            ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-100"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                        }`}
                      >
                        <span className="text-sm font-medium">{segment.label}</span>
                        <span className="text-sm font-semibold">{formatCount(segment.count)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-slate-950/30">
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Preferences
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Delivery
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Hazard Group
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                          Updated
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No subscriptions found
                          </td>
                        </tr>
                      ) : targetedSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No subscribers match the selected location and hazard group
                          </td>
                        </tr>
                      ) : (
                        targetedSubscriptions.map((sub) => (
                          <tr
                            key={sub._id}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-950"
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {sub.contact?.email || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {sub.contact?.phone || "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {[sub.location?.addressLine, sub.location?.city, sub.location?.region, sub.location?.country]
                                .filter(Boolean)
                                .join(", ") || "—"}
                              <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                                Pin: {formatPin(sub.location?.latitude, sub.location?.longitude)}
                              </div>
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
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                              {buildHazardLabel(sub.preferences?.categories)}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-amber-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                                value={sub.status}
                                onChange={(event) =>
                                  handleStatusChange(sub._id, event.target.value as AlertSubscription["status"])
                                }
                              >
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="unsubscribed">Unsubscribed</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                              {sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubscription(sub)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-amber-400/60 hover:text-amber-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                  <EyeIcon className="h-3.5 w-3.5" />
                                  View Details
                                </button>
                                <RowActionMenu
                                  actions={[
                                    { label: "Edit subscriber", onClick: () => setSelectedSubscription(sub) },
                                    { label: sub.status === "paused" ? "Activate subscriber" : "Pause subscriber", icon: sub.status === "paused" ? <Play size={15} /> : <Pause size={15} />, onClick: () => handleStatusChange(sub._id, sub.status === "paused" ? "active" : "paused"), hidden: sub.status === "unsubscribed" },
                                    { label: "Unsubscribe", onClick: () => handleStatusChange(sub._id, "unsubscribed"), hidden: sub.status === "unsubscribed" },
                                    { label: "Delete subscriber", icon: <Trash2 size={15} />, danger: true, onClick: () => handleDeleteSubscription(sub) },
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
                <div className="border-t border-gray-200 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Showing {formatCount(targetedSubscriptions.length)} of {formatCount(filteredSubscriptions.length)} filtered subscribers for{" "}
                  {targetedLocationLabel} and {targetedHazardLabel}.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <Suspense fallback={null}>
        <SubscriptionReviewModal
          open={!!selectedSubscription}
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
          onSave={handleSaveSubscription}
        />
      </Suspense>
    </>
  );
}
