import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Edit3, X } from "lucide-react";

type SubscriptionReview = {
  _id: string;
  status: "active" | "paused" | "unsubscribed";
  contact?: { fullName?: string; email?: string; phone?: string; altPhone?: string };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    subCity?: string;
    subcity?: string;
    woreda?: string;
    addressLine?: string;
    placeName?: string;
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
    whatsappEnabled?: boolean;
    inAppEnabled?: boolean;
    voiceCallEnabled?: boolean;
    emergencyContact?: string;
  };
  consent?: { accepted?: boolean; acceptedAt?: string };
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  open: boolean;
  subscription: SubscriptionReview | null;
  onClose: () => void;
  onSave?: (id: string, updates: Partial<SubscriptionReview>) => Promise<void> | void;
};

const formatNumber = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "N/A";

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

const valueText = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null || value === "") return "N/A";
  return String(value);
};

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
    <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">{children}</div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="min-w-0">
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
    <div className="mt-1 text-sm break-words">{value}</div>
  </div>
);

const SummaryPill = ({ label, value }: { label: string; value: string }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span>{value}</span>
  </div>
);

const normalizeLocationPart = (value?: string | null) => (value || "").trim();

const buildLocationLine = (location?: SubscriptionReview["location"]) => {
  const primaryParts = [
    normalizeLocationPart(location?.subCity),
    normalizeLocationPart(location?.subcity),
    normalizeLocationPart(location?.woreda),
    normalizeLocationPart(location?.placeName),
    normalizeLocationPart(location?.addressLine),
  ].filter(Boolean);

  if (primaryParts.length > 0) return primaryParts.join(", ");

  return [
    normalizeLocationPart(location?.city),
    normalizeLocationPart(location?.region),
    normalizeLocationPart(location?.country),
  ]
    .filter(Boolean)
    .join(", ");
};

export default function SubscriptionReviewModal({ open, subscription, onClose, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ email: "", phone: "", addressLine: "", city: "", region: "" });

  useEffect(() => {
    if (!subscription) return;
    setEditing(false);
    setDraft({
      email: subscription.contact?.email || "",
      phone: subscription.contact?.phone || "",
      addressLine: subscription.location?.addressLine || "",
      city: subscription.location?.city || "",
      region: subscription.location?.region || "",
    });
  }, [subscription]);

  if (!open || !subscription) return null;

  const saveDraft = async () => {
    if (!onSave) return;
    await onSave(subscription._id, {
      contact: { ...subscription.contact, email: draft.email.trim(), phone: draft.phone.trim() },
      location: { ...subscription.location, addressLine: draft.addressLine.trim(), city: draft.city.trim(), region: draft.region.trim() },
    });
    setEditing(false);
  };

  const locationLine = buildLocationLine(subscription.location);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-white p-5 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subscription Details
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {subscription.contact?.email || subscription.contact?.phone || "Alert Subscription"}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <SummaryPill label="Status" value={subscription.status} />
              <SummaryPill
                label="Pin"
                value={`${formatNumber(subscription.location?.latitude)}, ${formatNumber(subscription.location?.longitude)}`}
              />
              <SummaryPill
                label="Household"
                value={`${subscription.household?.householdSize ?? "N/A"} people`}
              />
              <SummaryPill
                label="Consent"
                value={subscription.consent?.accepted ? "Accepted" : "Pending"}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSave ? <button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300"><Edit3 className="h-3.5 w-3.5" />{editing ? "Hide Edit" : "Edit"}</button> : null}
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-800" aria-label="Close subscription details"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {editing ? (
          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-500/30 dark:bg-amber-500/5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Edit Subscriber</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(["email", "phone", "addressLine", "city", "region"] as const).map((field) => (
                <label key={field} className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {field === "addressLine" ? "Address" : field.replace(/([A-Z])/g, " $1")}
                  <input value={draft[field]} onChange={(event) => setDraft((previous) => ({ ...previous, [field]: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-700" />
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><button type="button" onClick={saveDraft} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">Save subscriber</button></div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SectionCard title="Contact">
            <DetailRow label="Email" value={subscription.contact?.email || "N/A"} />
            <DetailRow label="Phone" value={subscription.contact?.phone || "N/A"} />
            <DetailRow label="Alt Phone" value={subscription.contact?.altPhone || "N/A"} />
          </SectionCard>

          <SectionCard title="Location">
            <DetailRow label="Location" value={locationLine || "N/A"} />
            <DetailRow
              label="Exact Pin"
              value={`${formatNumber(subscription.location?.latitude)}, ${formatNumber(subscription.location?.longitude)}`}
            />
            <DetailRow label="Radius" value={`${subscription.location?.radiusKm ?? "N/A"} km`} />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Additional Locations
              </div>
              <div className="mt-2 space-y-2">
                {(subscription.location?.additionalLocations || []).length === 0 ? (
                  <div className="text-sm text-slate-700 dark:text-slate-300">N/A</div>
                ) : (
                  (subscription.location?.additionalLocations || []).map((item, index) => (
                    <div key={`${item.label || "location"}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.label || `Location ${index + 1}`}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {item.addressLine || "No address entered"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Pin: {formatNumber(item.latitude)}, {formatNumber(item.longitude)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Preferences">
            <DetailRow label="Categories" value={valueText(subscription.preferences?.categories)} />
            <DetailRow label="Severities" value={valueText(subscription.preferences?.severities)} />
            <DetailRow label="Min Alert Level" value={subscription.preferences?.minAlertLevel || "N/A"} />
            <DetailRow label="Language" value={subscription.preferences?.language || "N/A"} />
            <DetailRow
              label="Quiet Hours"
              value={
                subscription.preferences?.quietHours?.enabled
                  ? `${subscription.preferences.quietHours.start || "--:--"} to ${subscription.preferences.quietHours.end || "--:--"}`
                  : "Disabled"
              }
            />
          </SectionCard>

          <SectionCard title="Household Profile">
            <DetailRow label="Household Size" value={subscription.household?.householdSize ?? "N/A"} />
            <DetailRow label="Special Needs" value={valueText(subscription.household?.specialNeeds)} />
            <DetailRow label="Assets At Risk" value={valueText(subscription.household?.assetsAtRisk)} />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Note
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {subscription.household?.notes || "N/A"}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Delivery">
            <DetailRow label="Selected Channels" value={valueText(subscription.delivery?.channels)} />
            <DetailRow label="Emergency Contact" value={subscription.delivery?.emergencyContact || "N/A"} />
          </SectionCard>

          <SectionCard title="Consent">
            <DetailRow label="Accepted" value={subscription.consent?.accepted} />
            <DetailRow label="Accepted At" value={formatDateTime(subscription.consent?.acceptedAt)} />
            <DetailRow label="Created" value={formatDateTime(subscription.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(subscription.updatedAt)} />
          </SectionCard>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
