import type { ReactNode } from "react";
import { X } from "lucide-react";

type SubscriptionReview = {
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

export default function SubscriptionReviewModal({ open, subscription, onClose }: Props) {
  if (!open || !subscription) return null;

  const locationLine = [
    subscription.location?.addressLine,
    subscription.location?.city,
    subscription.location?.region,
    subscription.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-white p-5 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subscription Details
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {subscription.contact?.fullName || "Alert Subscription"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {locationLine || "No location entered"}
            </p>
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-800"
            aria-label="Close subscription details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SectionCard title="Contact">
            <DetailRow label="Full Name" value={subscription.contact?.fullName || "N/A"} />
            <DetailRow label="Email" value={subscription.contact?.email || "N/A"} />
            <DetailRow label="Phone" value={subscription.contact?.phone || "N/A"} />
            <DetailRow label="Alt Phone" value={subscription.contact?.altPhone || "N/A"} />
          </SectionCard>

          <SectionCard title="Location">
            <DetailRow label="Address" value={locationLine || "N/A"} />
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
            <DetailRow label="Channels" value={valueText(subscription.delivery?.channels)} />
            <DetailRow label="Email Enabled" value={subscription.delivery?.emailEnabled} />
            <DetailRow label="SMS Enabled" value={subscription.delivery?.smsEnabled} />
            <DetailRow label="WhatsApp Enabled" value={subscription.delivery?.whatsappEnabled} />
            <DetailRow label="In-App Enabled" value={subscription.delivery?.inAppEnabled} />
            <DetailRow label="Voice Call Enabled" value={subscription.delivery?.voiceCallEnabled} />
            <DetailRow label="Emergency Contact" value={subscription.delivery?.emergencyContact || "N/A"} />
          </SectionCard>

          <SectionCard title="Consent">
            <DetailRow label="Accepted" value={subscription.consent?.accepted} />
            <DetailRow label="Accepted At" value={formatDateTime(subscription.consent?.acceptedAt)} />
            <DetailRow label="Created" value={formatDateTime(subscription.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(subscription.updatedAt)} />
          </SectionCard>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Location Snapshot
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Country</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{subscription.location?.country || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Region</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{subscription.location?.region || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">City</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{subscription.location?.city || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sub City</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{subscription.location?.subCity || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Woreda</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{subscription.location?.woreda || "N/A"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Address Line</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{subscription.location?.addressLine || "N/A"}</div>
            </div>
          </div>
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
