import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { ExternalLink, Image, Video, X } from "lucide-react";

export type ReportAttachment = {
  url?: string;
  type?: string;
  name?: string;
  uploadedBy?: 'user' | 'admin';
};

export type ReviewReport = {
  _id: string;
  reportCode?: string;
  reportType?: "incident" | "concern";
  status: "submitted" | "received" | "dispatched" | "closed";
  category?: string;
  severity?: string;
  details?: string;
  concernCategory?: string;
  concernDetails?: string;
  concernInfo?: { nature?: string; peopleAffected?: string };
  fireInfo?: { smellOfGas?: boolean; estimatedSize?: string };
  floodInfo?: { waterDepth?: string; fastRising?: boolean };
  collapseInfo?: { peopleTrapped?: boolean; buildingType?: string };
  medicalInfo?: { injuriesCount?: string; needsAmbulance?: boolean };
  powerInfo?: { liveWires?: boolean; outageArea?: string };
  securityInfo?: { ongoingThreat?: boolean; incidentType?: string };
  trafficInfo?: { lanesBlocked?: string; injuries?: boolean };
  animalInfo?: { animalType?: string; aggressive?: boolean };
  otherInfo?: { categoryNote?: string };
  location?: { addressLine?: string; city?: string; region?: string; country?: string; latitude?: number | null; longitude?: number | null };
  contact?: { phone?: string; email?: string };
  anonymous?: boolean;
  resolutionDescription?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  attachments?: ReportAttachment[];
  createdAt?: string;
  updatedAt?: string;
};

type ReportReviewModalProps = {
  open: boolean;
  report: ReviewReport | null;
  onClose: () => void;
  onSave?: (reportId: string, updates: Partial<ReviewReport>) => Promise<void> | void;
  saving?: boolean;
};

type ResolutionDraft = {
  status: ReviewReport["status"];
  resolutionDescription: string;
  resolvedBy: string;
  resolvedAt: string;
  resolutionNotes: string;
};

const getAttachmentKind = (attachment: ReportAttachment): 'image' | 'video' => {
  const hint = `${attachment.type || ""} ${attachment.name || ""} ${attachment.url || ""}`.toLowerCase();
  if (hint.includes("video") || /\.(mp4|mov|webm|avi|mkv)$/i.test(attachment.url || "")) {
    return "video";
  }
  return "image";
};

const joinLocation = (location?: ReviewReport["location"]) =>
  [location?.addressLine, location?.city, location?.region, location?.country].filter(Boolean).join(", ") || "N/A";

const formatCoordinate = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "N/A";

const titleCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const humanizeValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "N/A";
  if (value == null || value === "") return "N/A";
  return String(value);
};

const toDatetimeLocalValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const formatDisplayDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

const normalizeCategory = (value?: string) => (value || "").trim().toLowerCase();

const hasMeaningfulValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) => hasMeaningfulValue(item));
  }
  if (value == null) return false;
  return String(value).trim().length > 0;
};

const renderObjectFields = (value?: Record<string, unknown>) => {
  if (!value) return null;
  const entries = Object.entries(value).filter(([, item]) => hasMeaningfulValue(item));
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, item]) => (
        <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {titleCase(key)}
          </div>
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">{humanizeValue(item)}</div>
        </div>
      ))}
    </div>
  );
};

const InfoCard = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white break-words">{value}</p>
  </div>
);

const SummaryPill = ({ label, value }: { label: string; value: string }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span>{value}</span>
  </div>
);

export const ReportReviewModal = ({ open, report, onClose, onSave, saving = false }: ReportReviewModalProps) => {
  const [draft, setDraft] = useState<ResolutionDraft>({
    status: "submitted",
    resolutionDescription: "",
    resolvedBy: "",
    resolvedAt: "",
    resolutionNotes: "",
  });
  const [resolvedLatitude, setResolvedLatitude] = useState<string>("");
  const [resolvedLongitude, setResolvedLongitude] = useState<string>("");
  const [resolvedFiles, setResolvedFiles] = useState<File[]>([]);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<{ id: string; url: string; kind: 'image' | 'video' }[]>([]);

  useEffect(() => {
    if (!report) return;
    setDraft({
      status: report.status,
      resolutionDescription:
        report.resolutionDescription ||
        report.details ||
        report.concernDetails ||
        "",
      resolvedBy: report.resolvedBy || "",
      resolvedAt: toDatetimeLocalValue(report.resolvedAt),
      resolutionNotes: report.resolutionNotes || "",
    });
    setResolvedLatitude(report.location?.latitude != null ? String(report.location?.latitude) : "");
    setResolvedLongitude(report.location?.longitude != null ? String(report.location?.longitude) : "");
    setResolvedFiles([]);
    setFilePreviews([]);
  }, [report]);

  const incidentDescription =
    report?.reportType === "incident" ? report.details : report?.concernDetails;
  const categoryLabel =
    report?.reportType === "incident" ? report.category : report?.concernCategory;

  const selectedHazardDetail = useMemo(() => {
    if (!report || report.reportType !== "incident") return null;

    const category = normalizeCategory(report.category);
    switch (category) {
      case "fire":
        return { label: "Fire Info", value: report.fireInfo };
      case "flood":
        return { label: "Flood Info", value: report.floodInfo };
      case "collapse":
        return { label: "Collapse Info", value: report.collapseInfo };
      case "medical":
        return { label: "Medical Info", value: report.medicalInfo };
      case "power":
        return { label: "Power Info", value: report.powerInfo };
      case "security":
        return { label: "Security Info", value: report.securityInfo };
      case "traffic":
        return { label: "Traffic Info", value: report.trafficInfo };
      case "animal":
        return { label: "Animal Info", value: report.animalInfo };
      case "other":
        return { label: "Other Info", value: report.otherInfo };
      default:
        return null;
    }
  }, [report]);

  // Manage object URLs for previews
  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [filePreviews]);

  if (!open || !report) return null;

  const userAttachments = report.attachments?.filter(a => a.uploadedBy !== 'admin') || [];
  const adminAttachments = report.attachments?.filter(a => a.uploadedBy === 'admin') || [];

  const handleSave = async () => {
    if (!onSave) return;

    const resolvedAtValue = draft.resolvedAt || (draft.status === "closed" ? new Date().toISOString() : "");

    // Validate coordinates if provided
    setCoordError(null);
    const latStr = resolvedLatitude?.trim();
    const lngStr = resolvedLongitude?.trim();
    if (latStr || lngStr) {
      const latNum = Number(latStr);
      const lngNum = Number(lngStr);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        setCoordError('Latitude and longitude must be valid numbers');
        return;
      }
      if (latNum < -90 || latNum > 90) {
        setCoordError('Latitude must be between -90 and 90');
        return;
      }
      if (lngNum < -180 || lngNum > 180) {
        setCoordError('Longitude must be between -180 and 180');
        return;
      }
    }
    // Upload any resolved media first and gather attachment objects
    const newAttachments: { url: string; type?: string; name?: string; uploadedBy?: 'admin' }[] = [];
    if (resolvedFiles.length > 0) {
      for (const file of resolvedFiles) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await api.post('/upload/incident-media', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res && res.data && res.data.url) {
            newAttachments.push({
              url: res.data.url,
              type: file.type?.startsWith('video') ? 'video' : 'image',
              name: file.name,
              uploadedBy: 'admin',
            });
            // remove preview for this file if exists
            setFilePreviews((prev) => prev.filter((p) => p.url !== URL.createObjectURL(file)));
          }
        } catch (err) {
          console.error('Failed to upload resolved media', err);
          alert('Failed to upload one of the resolved media files');
        }
      }
    }

    // Build update payload
    const updates: Partial<ReviewReport> & Record<string, unknown> = {
      status: draft.status,
      resolutionDescription: draft.resolutionDescription.trim(),
      resolvedBy: draft.resolvedBy.trim(),
      resolvedAt: resolvedAtValue || undefined,
      resolutionNotes: draft.resolutionNotes.trim(),
    };

    // If user provided exact pin coordinates, include them in location
    const lat = resolvedLatitude?.trim();
    const lng = resolvedLongitude?.trim();
    if (lat || lng) {
      const location = { ...(report.location || {}) } as Record<string, unknown>;
      if (lat) location.latitude = Number(lat);
      if (lng) location.longitude = Number(lng);
      updates.location = location;
    }

    // Append newly uploaded attachments to existing ones
    if (newAttachments.length > 0) {
      updates.attachments = [ ...(report.attachments || []), ...newAttachments ];
    }

    await onSave(report._id, updates);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    setResolvedFiles(list);
    const previews = list.map((f) => ({ id: String(Math.random()), url: URL.createObjectURL(f), kind: (f.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video' }));
    setFilePreviews(previews);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-white p-5 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Report Review
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {report.reportCode || "Report Details"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {joinLocation(report.location)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SummaryPill label="Status" value={report.status} />
              <SummaryPill label="Type" value={report.reportType || "N/A"} />
              <SummaryPill
                label="Pin"
                value={`${formatCoordinate(report.location?.latitude)}, ${formatCoordinate(report.location?.longitude)}`}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-800"
            aria-label="Close report review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoCard label="Report Type" value={report.reportType || "N/A"} />
          <InfoCard label="Category" value={categoryLabel || "N/A"} />
          <InfoCard label="Severity / Status" value={`${report.severity || "N/A"} / ${report.status}`} />
          <InfoCard label="Created" value={formatDisplayDate(report.createdAt)} />
          <InfoCard label="Updated" value={formatDisplayDate(report.updatedAt)} />
          <InfoCard label="Anonymous" value={report.anonymous ? "Yes" : "No"} />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Report Details
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
              {incidentDescription || "No details were provided for this report."}
            </p>
          </div>

          {report.reportType === "concern" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Concern Breakdown
              </p>
              <div className="mt-2 grid gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nature
                  </span>
                  <span>{report.concernInfo?.nature || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    People Affected
                  </span>
                  <span>{report.concernInfo?.peopleAffected || "N/A"}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Location
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Address
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{joinLocation(report.location)}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Exact Pin
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {formatCoordinate(report.location?.latitude)}, {formatCoordinate(report.location?.longitude)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Contact
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phone
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{report.contact?.phone || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Email
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{report.contact?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {report.reportType === "incident" ? (
            selectedHazardDetail ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {selectedHazardDetail.label}
                </p>
                <div className="mt-3">{renderObjectFields(selectedHazardDetail.value as Record<string, unknown>)}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400 md:col-span-2">
                No hazard-specific details were captured for this incident.
              </div>
            )
          ) : null}
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resolution
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add how it was solved, who solved it, and when it was closed.
              </p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
              {draft.status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                value={draft.status}
                onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as ReviewReport["status"] }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="submitted">Submitted</option>
                <option value="received">Received</option>
                <option value="dispatched">Dispatched</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resolved By
              </label>
              <input
                value={draft.resolvedBy}
                onChange={(event) => setDraft((prev) => ({ ...prev, resolvedBy: event.target.value }))}
                placeholder="Responder name or team"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resolved At
              </label>
              <input
                type="datetime-local"
                value={draft.resolvedAt}
                onChange={(event) => setDraft((prev) => ({ ...prev, resolvedAt: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Latitude
              </label>
              <input
                type="text"
                value={resolvedLatitude}
                onChange={(e) => setResolvedLatitude(e.target.value)}
                placeholder="e.g. 9.0095"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Longitude
              </label>
              <input
                type="text"
                value={resolvedLongitude}
                onChange={(e) => setResolvedLongitude(e.target.value)}
                placeholder="e.g. 38.7626"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resolution Note
              </label>
              <input
                value={draft.resolutionNotes}
                onChange={(event) => setDraft((prev) => ({ ...prev, resolutionNotes: event.target.value }))}
                placeholder="Optional note for follow-up"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resolution Description
            </label>
            <textarea
              rows={4}
              value={draft.resolutionDescription}
              onChange={(event) => setDraft((prev) => ({ ...prev, resolutionDescription: event.target.value }))}
              placeholder="Describe what was done to solve the report"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>
          <div className="mt-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upload Resolved Photo/Video
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="mt-2 w-full text-sm text-slate-700 dark:text-slate-200"
            />
            {coordError ? <div className="mt-2 text-xs text-rose-600">{coordError}</div> : null}
            {filePreviews.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {filePreviews.map((p) => (
                  <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {p.kind === 'video' ? (
                      <video src={p.url} className="h-28 w-full object-cover" controls />
                    ) : (
                      <img src={p.url} className="h-28 w-full object-cover" alt="preview" />
                    )}
                  </div>
                ))}
              </div>
            ) : resolvedFiles.length > 0 ? (
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{resolvedFiles.length} file(s) selected</div>
            ) : null}
          </div>
          {(report.resolutionDescription || report.resolvedBy || report.resolvedAt || report.resolutionNotes) ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-950 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-200">
                Current Resolution Snapshot
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-200/80">
                    Solved By
                  </div>
                  <div className="mt-1 font-medium">{report.resolvedBy || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-200/80">
                    Solved At
                  </div>
                  <div className="mt-1 font-medium">{formatDisplayDate(report.resolvedAt)}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-200/80">
                    Description
                  </div>
                  <div className="mt-1 whitespace-pre-wrap leading-6">{report.resolutionDescription || "N/A"}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-200/80">
                    Notes
                  </div>
                  <div className="mt-1 whitespace-pre-wrap leading-6">{report.resolutionNotes || "N/A"}</div>
                </div>
                {adminAttachments.length > 0 ? (
                  <div className="sm:col-span-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-200/80 mb-2">
                      Admin Uploaded Media
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {adminAttachments.map((att, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-rose-200 bg-white/50 dark:border-rose-800 dark:bg-black/20">
                          {getAttachmentKind(att) === 'video' ? (
                            <video src={att.url} className="h-24 w-full object-cover" controls />
                          ) : (
                            <a href={att.url} target="_blank" rel="noreferrer">
                              <img src={att.url} className="h-24 w-full object-cover" alt="admin upload" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Saved resolution time: {formatDisplayDate(report.resolvedAt)}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Attached Photos / Videos
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">{userAttachments.length} file(s)</span>
          </div>

          {userAttachments.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No attached media was submitted with this report.
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {userAttachments.map((attachment, index) => {
                const kind = getAttachmentKind(attachment);
                const label = attachment.name || `Attachment ${index + 1}`;

                return (
                  <div
                    key={`${attachment.url || label}-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                      <div className="flex min-w-0 items-center gap-2">
                        {kind === "video" ? (
                          <Video className="h-4 w-4 shrink-0 text-indigo-500" />
                        ) : (
                          <Image className="h-4 w-4 shrink-0 text-rose-500" />
                        )}
                        <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {label}
                        </span>
                      </div>
                      {attachment.url ? (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 transition hover:text-slate-900 dark:hover:text-white"
                          aria-label={`Open ${label}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>

                    {kind === "video" ? (
                      <video controls className="h-56 w-full bg-black object-contain" src={attachment.url} />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-slate-100 dark:bg-slate-950">
                        {attachment.url ? (
                          <img
                            src={attachment.url}
                            alt={label}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <p className="text-sm text-slate-500">Preview unavailable</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Close
          </button>
          {onSave ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
