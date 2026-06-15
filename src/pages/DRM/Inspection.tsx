import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FileSearch, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";

import PageMeta from "../../components/common/PageMeta";
import {
  inspectionRequestService,
  type InspectionRequest,
  type InspectionStatus,
} from "@/api/inspectionRequestService";

const statusOptions: InspectionStatus[] = [
  "Submitted",
  "Under Review",
  "Assigned",
  "Scheduled",
  "Completed",
  "Rejected",
];

const Inspection = () => {
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<InspectionRequest | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await inspectionRequestService.list({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setRequests(data);
      if (selected) {
        const refreshed = data.find((item) => item._id === selected._id) || null;
        setSelected(refreshed);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load inspection requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((request) => !["Completed", "Rejected"].includes(request.status)).length;
    const assigned = requests.filter((request) => ["Assigned", "Scheduled", "Completed"].includes(request.status)).length;
    const completed = requests.filter((request) => request.status === "Completed").length;
    return { total, open, assigned, completed };
  }, [requests]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await inspectionRequestService.update(selected._id, {
        status: selected.status,
        assignedInspector: selected.assignedInspector || "",
        assignedInspectorContact: selected.assignedInspectorContact || "",
        certificateUrl: selected.certificateUrl || "",
        adminNotes: selected.adminNotes || "",
      });
      setSelected(updated);
      setRequests((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success("Inspection request updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update inspection request");
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async (file: File) => {
    if (!selected) return;
    try {
      setSaving(true);
      const url = await inspectionRequestService.uploadCertificate(file);
      setSelected((current) => (current ? { ...current, certificateUrl: url } : current));
      toast.success("Certificate uploaded");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload certificate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Inspection Management | IDRMIS" description="Manage public inspection requests." />
      <div className="space-y-6">
        <div className="rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,#FFF4D8_0%,#FFF8EE_100%)] px-6 py-7 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-[#5A3613]">Inspection Management System</h1>
          <p className="mt-2 max-w-3xl text-base font-medium text-[#8D602A]">
            Review incoming inspection requests, assign inspectors, update request status, and upload completion certificates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Requests", value: stats.total, icon: FileSearch, tone: "text-blue-600 bg-blue-50" },
            { label: "Open Requests", value: stats.open, icon: CalendarDays, tone: "text-amber-600 bg-amber-50" },
            { label: "Assigned", value: stats.assigned, icon: ShieldCheck, tone: "text-indigo-600 bg-indigo-50" },
            { label: "Completed", value: stats.completed, icon: UploadCloud, tone: "text-emerald-600 bg-emerald-50" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 text-3xl font-black text-slate-900">{card.value}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{card.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Inspection Requests</h2>
                <p className="text-sm font-medium text-slate-500">Search and open a request to manage its workflow.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by tracking, property, requester..."
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-400"
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={loadRequests}
                  className="h-11 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-slate-500">
                  Loading inspection requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-slate-500">
                  No inspection requests found.
                </div>
              ) : (
                requests.map((request) => (
                  <button
                    key={request._id}
                    type="button"
                    onClick={() => setSelected(request)}
                    className={`w-full rounded-[22px] border px-5 py-4 text-left transition ${
                      selected?._id === request._id
                        ? "border-brand-300 bg-brand-50/60"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                          {request.trackingNumber}
                        </div>
                        <div className="mt-1 text-lg font-black text-slate-900">{request.propertyAddress}</div>
                        <div className="mt-1 text-sm font-medium text-slate-500">
                          {request.inspectionTypeLabel} · {new Date(request.preferredDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-600">
                        {request.requesterName || "Portal requester"}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Selected request
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{selected.trackingNumber}</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{selected.propertyAddress}</p>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </label>
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        setSelected((current) =>
                          current ? { ...current, status: e.target.value as InspectionStatus } : current
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-400"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Assigned Inspector
                    </label>
                    <input
                      value={selected.assignedInspector || ""}
                      onChange={(e) =>
                        setSelected((current) =>
                          current ? { ...current, assignedInspector: e.target.value } : current
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Inspector Contact
                    </label>
                    <input
                      value={selected.assignedInspectorContact || ""}
                      onChange={(e) =>
                        setSelected((current) =>
                          current ? { ...current, assignedInspectorContact: e.target.value } : current
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Admin Notes
                    </label>
                    <textarea
                      rows={4}
                      value={selected.adminNotes || ""}
                      onChange={(e) =>
                        setSelected((current) =>
                          current ? { ...current, adminNotes: e.target.value } : current
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Certificate
                    </label>
                    <div className="flex flex-col gap-3">
                      <input
                        value={selected.certificateUrl || ""}
                        onChange={(e) =>
                          setSelected((current) =>
                            current ? { ...current, certificateUrl: e.target.value } : current
                          )
                        }
                        placeholder="https://... or upload a certificate file"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-400"
                      />
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleCertificateUpload(file);
                        }}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div><span className="font-black text-slate-900">Requester:</span> {selected.requesterName || "N/A"}</div>
                  <div className="mt-1"><span className="font-black text-slate-900">Phone:</span> {selected.requesterPhone || "N/A"}</div>
                  <div className="mt-1"><span className="font-black text-slate-900">Email:</span> {selected.requesterEmail || "N/A"}</div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-slate-500">
                Select an inspection request from the list to manage assignment, status, and certificate delivery.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Inspection;
