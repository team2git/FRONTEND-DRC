import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ClipboardPenLine, Download, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

import PageMeta from "@/components/common/PageMeta";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ServiceExitButton from "./components/ServiceExitButton";
import { usePortalContent } from "@/hooks/usePortalContent";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";
import {
  inspectionRequestService,
  type CreateInspectionPayload,
  type InspectionRequest,
  type InspectionType,
} from "@/api/inspectionRequestService";

const inspectionOptions: { value: InspectionType; label: string }[] = [
  { value: "building_safety", label: "Building Safety" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "electrical", label: "Electrical Inspection" },
  { value: "sanitation", label: "Sanitation Inspection" },
  { value: "structural", label: "Structural Assessment" },
  { value: "occupancy", label: "Occupancy Approval" },
  { value: "other", label: "Other" },
];

const initialForm: CreateInspectionPayload = {
  propertyAddress: "",
  inspectionType: "building_safety",
  preferredDate: "",
  additionalNotes: "",
  requesterName: "",
  requesterPhone: "",
  requesterEmail: "",
};

const statusTone: Record<string, string> = {
  Submitted: "bg-amber-50 text-amber-700 border-amber-100",
  "Under Review": "bg-blue-50 text-blue-700 border-blue-100",
  Assigned: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Scheduled: "bg-purple-50 text-purple-700 border-purple-100",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Rejected: "bg-rose-50 text-rose-700 border-rose-100",
};

const InspectionRequestPage = () => {
  const navigate = useNavigate();
  const { portalContent } = usePortalContent();
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  const [form, setForm] = useState<CreateInspectionPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [trackingLookup, setTrackingLookup] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedRequest, setTrackedRequest] = useState<InspectionRequest | null>(null);
  const [latestRequest, setLatestRequest] = useState<InspectionRequest | null>(null);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const response = await inspectionRequestService.createPublic(form);
      setLatestRequest(response.request);
      setTrackedRequest(response.request);
      setTrackingLookup(response.request.trackingNumber);
      setForm(initialForm);
      toast.success("Inspection request submitted successfully");
    } catch (error: any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        (status === 404
          ? "Inspection request API not found. Restart the backend server and try again."
          : !error?.response
            ? "Cannot reach the backend server. Please check that the API is running."
            : "Failed to submit inspection request");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trackingLookup.trim()) {
      toast.error("Enter a tracking number first");
      return;
    }

    try {
      setTrackingLoading(true);
      const request = await inspectionRequestService.trackPublic(trackingLookup.trim().toUpperCase());
      setTrackedRequest(request);
    } catch (error: any) {
      setTrackedRequest(null);
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        (status === 404
          ? "Tracking route not available yet. Restart the backend server and try again."
          : !error?.response
            ? "Cannot reach the backend server. Please check that the API is running."
            : "Tracking number not found");
      toast.error(message);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="portal-theme min-h-screen overflow-x-hidden bg-[#F8FAFF] font-outfit">
      <PageMeta
        title="Inspection Management System | IDRMIS Portal"
        description="Submit inspection requests, track status, and download completion certificates."
      />
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

      <div className="relative overflow-hidden bg-slate-950 pb-28 pt-24">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-40 transition-transform duration-[10s]"
          style={{
            backgroundImage: `url('${resolvePortalAssetUrl(portalContent?.pages?.feedback?.heroImage) || "/assets/images/hero1.png"}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent)]" />

        <div className="container relative z-10 mx-auto px-6 transition-all duration-700">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-brand-50 bg-white px-6 py-2 shadow-xl shadow-brand-100/50">
                <div className="h-2 w-2 animate-ping rounded-full bg-accent-600" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-600">
                  Inspection Services
                </span>
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl">
                Request an Inspection,
                <br />
                <span className="bg-gradient-to-br from-brand-400 via-brand-400 to-accent-400 bg-clip-text text-transparent">
                  Fast.
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-300 lg:mx-0">
                Submit a request in minutes, track status updates, and stay ready for the next inspection step.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="-mt-16 px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[40px] border border-white/80 bg-white shadow-[0_60px_120px_-30px_rgba(15,23,42,0.2)]">
            <div className="relative flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 px-6 py-5 text-white sm:px-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent)]" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                  <ClipboardPenLine className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black sm:text-[2rem]">New Inspection Request</h2>
              </div>
              <ServiceExitButton
                onClick={() => navigate("/portal/services")}
                label="Exit service"
                className="relative border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
              />
            </div>

            <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.25fr_0.85fr] lg:px-10">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-3 block text-lg font-bold text-[#223B7B]">
                    Property Address <span className="text-accent-600">*</span>
                  </label>
                  <input
                    value={form.propertyAddress}
                    onChange={(e) => setForm((current) => ({ ...current, propertyAddress: e.target.value }))}
                    placeholder="123 Main St, City, ZIP"
                    className="h-18 w-full rounded-[20px] border-2 border-[#D7E0F7] bg-white px-5 text-lg text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-lg font-bold text-[#223B7B]">
                    Inspection Type <span className="text-accent-600">*</span>
                  </label>
                  <select
                    value={form.inspectionType}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        inspectionType: e.target.value as InspectionType,
                      }))
                    }
                    className="h-18 w-full rounded-[20px] border-2 border-[#D7E0F7] bg-white px-5 text-lg text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    required
                  >
                    {inspectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-lg font-bold text-[#223B7B]">
                    Preferred Date <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={form.preferredDate}
                    onChange={(e) => setForm((current) => ({ ...current, preferredDate: e.target.value }))}
                    className="h-18 w-full rounded-[20px] border-2 border-[#D7E0F7] bg-white px-5 text-lg text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-3 block text-lg font-bold text-[#223B7B]">Additional Notes</label>
                  <textarea
                    rows={4}
                    value={form.additionalNotes}
                    onChange={(e) => setForm((current) => ({ ...current, additionalNotes: e.target.value }))}
                    placeholder="Describe access details, urgency, or the inspection purpose..."
                    className="w-full rounded-[20px] border-2 border-[#D7E0F7] bg-white px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-base font-bold text-[#223B7B]">Requester Name</label>
                    <input
                      value={form.requesterName}
                      onChange={(e) => setForm((current) => ({ ...current, requesterName: e.target.value }))}
                      placeholder="Full name"
                      className="h-15 w-full rounded-[18px] border-2 border-[#D7E0F7] bg-white px-5 text-base text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-base font-bold text-[#223B7B]">Phone Number</label>
                    <input
                      value={form.requesterPhone}
                      onChange={(e) => setForm((current) => ({ ...current, requesterPhone: e.target.value }))}
                      placeholder="+251 9XX XXX XXX"
                      className="h-15 w-full rounded-[18px] border-2 border-[#D7E0F7] bg-white px-5 text-base text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-base font-bold text-[#223B7B]">Email Address</label>
                  <input
                    type="email"
                    value={form.requesterEmail}
                    onChange={(e) => setForm((current) => ({ ...current, requesterEmail: e.target.value }))}
                    placeholder="name@example.com"
                    className="h-15 w-full rounded-[18px] border-2 border-[#D7E0F7] bg-white px-5 text-base text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-15 items-center justify-center rounded-full bg-accent-600 px-10 text-lg font-black text-white shadow-[0_18px_40px_-24px_rgba(220,38,38,0.9)] transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-brand-100 bg-brand-50/50 p-6">
                  <h3 className="text-xl font-black text-slate-900">Track Inspection Status</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    Enter your tracking number to check assignment progress or download a certificate.
                  </p>
                  <form className="mt-5 space-y-4" onSubmit={handleTrack}>
                    <input
                      value={trackingLookup}
                      onChange={(e) => setTrackingLookup(e.target.value)}
                      placeholder="INS-YYMMDD-1234"
                      className="h-14 w-full rounded-[18px] border-2 border-[#D7E0F7] bg-white px-4 text-base font-semibold uppercase tracking-[0.06em] text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                    <button
                      type="submit"
                      disabled={trackingLoading}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-slate-800 px-6 text-sm font-black text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {trackingLoading ? "Checking..." : "Track Request"}
                    </button>
                  </form>
                </div>

                {latestRequest ? (
                  <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-600" />
                      <div>
                        <h3 className="text-lg font-black text-emerald-800">Request submitted</h3>
                        <p className="mt-2 text-sm font-medium leading-6 text-emerald-700">
                          Keep this tracking number for follow-up:
                        </p>
                        <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-base font-black uppercase tracking-[0.14em] text-emerald-700">
                          {latestRequest.trackingNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {trackedRequest ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          Tracking number
                        </div>
                        <div className="mt-2 text-lg font-black text-slate-900">
                          {trackedRequest.trackingNumber}
                        </div>
                      </div>
                      <div className={`rounded-full border px-4 py-2 text-sm font-black ${statusTone[trackedRequest.status] || "bg-slate-50 text-slate-700 border-slate-100"}`}>
                        {trackedRequest.status}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm font-medium text-slate-600">
                      <p><span className="font-black text-slate-900">Property:</span> {trackedRequest.propertyAddress}</p>
                      <p><span className="font-black text-slate-900">Type:</span> {trackedRequest.inspectionTypeLabel}</p>
                      <p><span className="font-black text-slate-900">Preferred date:</span> {new Date(trackedRequest.preferredDate).toLocaleDateString()}</p>
                      <p><span className="font-black text-slate-900">Inspector:</span> {trackedRequest.assignedInspector || "Not assigned yet"}</p>
                      <p><span className="font-black text-slate-900">Inspector contact:</span> {trackedRequest.assignedInspectorContact || "Pending"}</p>
                    </div>

                    {trackedRequest.adminNotes ? (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600">
                        <span className="font-black text-slate-900">Update:</span> {trackedRequest.adminNotes}
                      </div>
                    ) : null}

                    {trackedRequest.certificateUrl ? (
                      <a
                        href={trackedRequest.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-3 text-sm font-black text-white transition hover:bg-accent-700"
                      >
                        <Download className="h-4 w-4" />
                        Download Certificate
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showFooter ? (
        <Footer
          branding={portalContent?.branding}
          contact={portalContent?.contact}
          footer={portalContent?.footer}
          showContact={showContact}
        />
      ) : null}
    </div>
  );
};

export default InspectionRequestPage;
