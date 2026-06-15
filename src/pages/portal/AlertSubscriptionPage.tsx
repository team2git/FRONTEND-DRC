import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import {
  Bell,
  CheckCircle2,
  Mail,
  MapPin,
  // MessageSquare,
  Phone,
  Shield,
  // Smartphone,
  Users,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import api from "@/api/axios";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ServiceExitButton from "./components/ServiceExitButton";
import { usePortalContent } from "@/hooks/usePortalContent";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";
import { ALERT_CATEGORY_LABELS, ALERT_HAZARD_GROUPS } from "@/constants/alertCategories";

type StepKey = "contact_location" | "preferences" | "household" | "delivery_review";

type AdditionalLocation = {
  label: string;
  addressLine: string;
};

type AlertSubscriptionDraft = {
  contact: { fullName: string; email: string; phone: string; altPhone: string };
  location: {
    country: string;
    region: string;
    city: string;
    addressLine: string;
    latitude: string;
    longitude: string;
    radiusKm: number;
    additionalLocations: AdditionalLocation[];
  };
  preferences: {
    categories: string[];
    severities: string[];
    minAlertLevel: string;
    language: string;
    quietHours: { enabled: boolean; start: string; end: string };
  };
  household: {
    householdSize: number;
    specialNeeds: string[];
    assetsAtRisk: string[];
    notes: string;
  };
  delivery: { channels: string[]; voiceCallEnabled: boolean; emergencyContact: string };
  consent: { accepted: boolean };
};

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_DRAFT: AlertSubscriptionDraft = {
  contact: { fullName: "", email: "", phone: "", altPhone: "" },
  location: {
    country: "",
    region: "",
    city: "",
    addressLine: "",
    latitude: "",
    longitude: "",
    radiusKm: 5,
    additionalLocations: [],
  },
  preferences: {
    categories: ["floods"],
    severities: ["warning", "emergency"],
    minAlertLevel: "warning",
    language: "en",
    quietHours: { enabled: false, start: "22:00", end: "06:00" },
  },
  household: { householdSize: 1, specialNeeds: [], assetsAtRisk: [], notes: "" },
  delivery: { channels: ["sms", "email"], voiceCallEnabled: false, emergencyContact: "" },
  consent: { accepted: false },
};

const SPECIAL_NEEDS = [
  { key: "limited_mobility", label: "Resident with limited mobility" },
  { key: "hearing", label: "Resident who is deaf/hard of hearing" },
  { key: "vision", label: "Resident who is blind/visually impaired" },
  { key: "medical_power", label: "Resident requiring medical electricity (e.g., respirator)" },
];

const ASSETS_AT_RISK = [
  { key: "boat", label: "I own a boat (need flood relocation)" },
  { key: "livestock", label: "I have livestock" },
  { key: "multi_story", label: "I live in a multi-story building (need vertical evacuation)" },
];

const ALERT_LEVELS = [
  {
    key: "advisory",
    label: "Advisory (Yellow)",
    description: "Stay informed - potential risk developing",
  },
  {
    key: "alert",
    label: "Alert (Orange)",
    description: "Be prepared - conditions are favorable for disaster",
  },
  {
    key: "warning",
    label: "Warning (Red)",
    description: "Take immediate action - life-threatening emergency",
  },
];

const CHANNEL_OPTIONS = [
  { key: "sms", label: "SMS", description: "Fastest, best for cell areas", icon: Phone },
  // { key: "voice", label: "Voice Call", description: "Robocall for elderly", icon: Phone },
  // { key: "push", label: "Mobile Push", description: "Via mobile app", icon: Smartphone },
  { key: "email", label: "Email", description: "Detailed instructions", icon: Mail },
  // { key: "whatsapp", label: "WhatsApp/Telegram", description: "Social messaging", icon: MessageSquare },
];

const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const StepBubble: React.FC<{
  active: boolean;
  done: boolean;
  label: string;
  icon: React.ReactNode;
}> = ({ active, done, label, icon }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      className={[
        "h-12 w-12 rounded-full flex items-center justify-center border-2",
        done
          ? "bg-accent-600 text-white border-accent-600"
          : active
          ? "bg-accent-600 text-white border-accent-600"
          : "bg-white text-slate-400 border-slate-200",
      ].join(" ")}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div className={active ? "text-brand-600 font-semibold" : "text-slate-500"}>
      {label}
    </div>
  </div>
);

const AlertSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { portalContent } = usePortalContent();
  const [step, setStep] = useState<StepKey>("contact_location");
  const [draft, setDraft] = useState<AlertSubscriptionDraft>(DEFAULT_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  const steps = useMemo(
    () =>
      [
        {
          key: "contact_location" as const,
          label: "Contact & Location",
          icon: <MapPin className="h-5 w-5" />,
        },
        {
          key: "preferences" as const,
          label: "Alert Preferences",
          icon: <Shield className="h-5 w-5" />,
        },
        {
          key: "household" as const,
          label: "Household Info",
          icon: <Users className="h-5 w-5" />,
        },
        {
          key: "delivery_review" as const,
          label: "Delivery & Review",
          icon: <Bell className="h-5 w-5" />,
        },
      ] as const,
    []
  );

  const stepIndex = steps.findIndex((s) => s.key === step);

  const canGoNext = () => {
    if (step === "contact_location") {
      if (!draft.contact.phone.trim()) return false;
      if (!draft.contact.email.trim() || !isEmailLike(draft.contact.email)) return false;
      if (!draft.preferences.language) return false;
      return Boolean(draft.location.addressLine.trim());
    }
    if (step === "preferences") {
      return draft.preferences.categories.length > 0 && draft.preferences.minAlertLevel.length > 0;
    }
    if (step === "household") {
      return draft.household.householdSize >= 1;
    }
    if (step === "delivery_review") {
      return draft.delivery.channels.length > 0 && draft.consent.accepted;
    }
    return false;
  };

  const goNext = () => {
    if (!canGoNext()) {
      toast.error("Please complete the required fields to continue.");
      return;
    }
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].key);
  };

  const goBack = () => setStep(steps[Math.max(stepIndex - 1, 0)].key);

  const onSubmit = async () => {
    if (!canGoNext()) {
      toast.error("Please review and accept consent to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        contact: {
          fullName: draft.contact.fullName,
          email: draft.contact.email || "",
          phone: draft.contact.phone || "",
          altPhone: draft.contact.altPhone || "",
        },
        location: {
          country: draft.location.country,
          region: draft.location.region,
          city: draft.location.city,
          addressLine: draft.location.addressLine,
          latitude: draft.location.latitude ? Number(draft.location.latitude) : null,
          longitude: draft.location.longitude ? Number(draft.location.longitude) : null,
          radiusKm: draft.location.radiusKm,
          additionalLocations: draft.location.additionalLocations,
        },
        preferences: draft.preferences,
        household: draft.household,
        delivery: {
          channels: draft.delivery.channels,
          emailEnabled: draft.delivery.channels.includes("email"),
          smsEnabled: draft.delivery.channels.includes("sms"),
          whatsappEnabled: draft.delivery.channels.includes("whatsapp"),
          inAppEnabled: draft.delivery.channels.includes("push"),
          voiceCallEnabled: draft.delivery.voiceCallEnabled || draft.delivery.channels.includes("voice"),
          emergencyContact: draft.delivery.emergencyContact,
        },
        consent: { accepted: draft.consent.accepted },
      };

      await api.post("/alert-subscriptions", payload);
      toast.success("Successfully subscribed. You will receive a test alert shortly.");
      setShowSuccess(true);
      setDraft(DEFAULT_DRAFT);
      setStep("contact_location");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (key: string) => {
    setDraft((prev) => {
      const selected = prev.preferences.categories.includes(key);
      const categories = selected
        ? prev.preferences.categories.filter((c) => c !== key)
        : [...prev.preferences.categories, key];
      return { ...prev, preferences: { ...prev.preferences, categories } };
    });
  };

  const toggleNeed = (key: string) => {
    setDraft((prev) => {
      const selected = prev.household.specialNeeds.includes(key);
      const specialNeeds = selected
        ? prev.household.specialNeeds.filter((c) => c !== key)
        : [...prev.household.specialNeeds, key];
      return { ...prev, household: { ...prev.household, specialNeeds } };
    });
  };

  const toggleAsset = (key: string) => {
    setDraft((prev) => {
      const selected = prev.household.assetsAtRisk.includes(key);
      const assetsAtRisk = selected
        ? prev.household.assetsAtRisk.filter((c) => c !== key)
        : [...prev.household.assetsAtRisk, key];
      return { ...prev, household: { ...prev.household, assetsAtRisk } };
    });
  };

  const toggleChannel = (key: string) => {
    setDraft((prev) => {
      const selected = prev.delivery.channels.includes(key);
      const channels = selected
        ? prev.delivery.channels.filter((c) => c !== key)
        : [...prev.delivery.channels, key];
      return {
        ...prev,
        delivery: {
          ...prev.delivery,
          channels,
          voiceCallEnabled: key === "voice" ? !selected : prev.delivery.voiceCallEnabled,
        },
      };
    });
  };

  const updateAdditionalLocation = (index: number, field: keyof AdditionalLocation, value: string) => {
    setDraft((prev) => {
      const additionalLocations = [...prev.location.additionalLocations];
      additionalLocations[index] = { ...additionalLocations[index], [field]: value };
      return { ...prev, location: { ...prev.location, additionalLocations } };
    });
  };

  const addLocation = () => {
    setDraft((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        additionalLocations: [...prev.location.additionalLocations, { label: "Additional Location", addressLine: "" }],
      },
    }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    if (!window.isSecureContext) {
      toast.info("GPS requires HTTPS. Tap the map to set your location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setDraft((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: lat,
            longitude: lng,
          },
        }));
        if (mapRef.current) {
          mapRef.current.setView([Number(lat), Number(lng)], 14);
        }
        await reverseGeocode(lat, lng);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        if (error?.code === 1) {
          toast.info("Location permission denied. Enable access in your browser settings.");
          return;
        }
        if (error?.code === 2) {
          toast.error("Location unavailable. Check GPS or network.");
          return;
        }
        if (error?.code === 3) {
          toast.error("Location request timed out. Try again.");
          return;
        }
        toast.error("Unable to access your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  const reverseGeocode = async (lat: string, lng: string) => {
    if (!lat || !lng) return;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      const address = data?.address || {};
      const addressLine =
        data?.display_name ||
        [address.road, address.neighbourhood, address.suburb].filter(Boolean).join(", ");
      setDraft((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          addressLine: addressLine || prev.location.addressLine,
          city: address.city || address.town || address.village || prev.location.city,
          country: address.country || prev.location.country,
        },
      }));
    } catch (error) {
      toast.error("Failed to reverse geocode location.");
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView([9.03, 38.74], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    // Ensure tiles render after the container is fully laid out
    setTimeout(() => {
      map.invalidateSize();
    }, 0);

    map.on("click", (event) => {
      setDraft((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: event.latlng.lat.toFixed(6),
          longitude: event.latlng.lng.toFixed(6),
        },
      }));
      reverseGeocode(event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6));
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (step !== "contact_location") return;
    if (!mapRef.current) return;
    // Recalculate size when returning to the step
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 50);
  }, [step]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!draft.location.latitude || !draft.location.longitude) return;
    const lat = Number(draft.location.latitude);
    const lng = Number(draft.location.longitude);
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [draft.location.latitude, draft.location.longitude]);

  return (
    <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

      <div className="relative pt-24 pb-28 overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-[10s] scale-105"
          style={{
            backgroundImage: `url('${resolvePortalAssetUrl(portalContent?.pages?.feedback?.heroImage) || "/assets/images/hero1.png"}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgb(254, 254, 255),transparent)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 transition-all duration-700">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              {/* <div className="inline-flex items-center gap-3 px-6 py-2 bg-white shadow-xl shadow-brand-100/50 rounded-2xl border border-brand-50">
                <div className="w-2 h-2 bg-accent-600 rounded-full animate-ping" />
                <span className="text-brand-600 text-[11px] font-black uppercase tracking-[0.25em]">Alert Ready</span>
              </div> */}
            
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                Disaster Ready, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-400 to-accent-400">Anytime.</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                Subscribe to targeted alerts and stay informed with life-saving updates when it matters most.
              </p>
            </div>
             
          </div>
           <ServiceExitButton
                onClick={() => navigate("/portal/services")}
                className="border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
              />
        </div>
      </div>

      <main className="relative z-20 pb-16 px-4 -mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3">
              <Shield className="mt-20 h-10 w-10 text-red-600" />
                <h1 className="mt-20 relative text-xl font-black tracking-tight text-black">Disaster Ready</h1>
            </div>
            <div className="mt-5 text-lg text-slate-900">Alert Subscription & Management</div>
            <div className="mt-2 text-slate-500">
              "Just-in-Time, Just-for-Me" - Receive targeted, life-saving information without alert fatigue
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex flex-col items-center">
                <StepBubble active={step === s.key} done={idx < stepIndex} label={s.label} icon={s.icon} />
                {idx < steps.length - 1 ? <div className="hidden sm:block h-[2px] w-full bg-slate-200 mt-4" /> : null}
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white rounded-[28px] border border-slate-100 shadow-xl p-6 sm:p-10">
            {step === "contact_location" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>
                  <p className="text-slate-500">Where should we send your alerts?</p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="text-sm text-slate-600">
                      Primary Mobile Number <span className="text-brand-500">*</span>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full outline-none text-slate-700"
                          value={draft.contact.phone}
                          onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))}
                          placeholder="+251 000-000-000"
                          inputMode="tel"
                        />
                      </div>
                    </label>
                    <label className="text-sm text-slate-600">
                      Alternative / Home Phone <span className="text-slate-400">(Optional)</span>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full outline-none text-slate-700"
                          value={draft.contact.altPhone}
                          onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, altPhone: e.target.value } }))}
                          placeholder="+1 (555) 987-6543"
                          inputMode="tel"
                        />
                      </div>
                    </label>
                    <label className="text-sm text-slate-600 md:col-span-2">
                      Email Address <span className="text-brand-500">*</span>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full outline-none text-slate-700"
                          value={draft.contact.email}
                          onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))}
                          placeholder="your.email@example.com"
                          inputMode="email"
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        For detailed PDF reports and safety checklists
                      </div>
                    </label>
                    <label className="text-sm text-slate-600">
                      Preferred Language <span className="text-brand-500">*</span>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                        value={draft.preferences.language}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, preferences: { ...p.preferences, language: e.target.value } }))
                        }
                      >
                        <option value="en">English</option>
                        <option value="am">Amharic</option>
                        <option value="om">Afaan Oromo</option>
                        <option value="ti">Tigrinya</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-slate-600 mt-6">
                      <input
                        type="checkbox"
                        checked={draft.delivery.voiceCallEnabled}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, delivery: { ...p.delivery, voiceCallEnabled: e.target.checked } }))
                        }
                      />
                      I require voice calls for text alerts (Accessibility)
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h2 className="text-2xl font-bold text-slate-900">Location Management</h2>
                  <p className="text-slate-500">
                    Pin your exact location for hyper-local alerts. Disasters are location-specific.
                  </p>

                  <div className="mt-6 rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 text-slate-800 font-semibold">
                      <MapPin className="h-5 w-5 text-brand-600" />
                      Primary Residence
                    </div>
                    <label className="text-sm text-slate-600 block mt-4">
                      Address
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                        value={draft.location.addressLine}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, location: { ...p.location, addressLine: e.target.value } }))
                        }
                        placeholder="123 Main Street, City, State ZIP"
                      />
                    </label>
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 overflow-hidden">
                      <div ref={mapContainerRef} className="h-56 w-full cursor-crosshair" />
                      <div className="px-4 py-3 text-center text-sm text-slate-500 bg-gradient-to-r from-brand-50 to-accent-50">
                        Click to drop pin on map
                        <div className="text-xs text-slate-400">Use GPS or tap on the map to set your exact point</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="text-xs text-slate-500">
                        Latitude
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={draft.location.latitude}
                          readOnly
                          placeholder="Click on map"
                        />
                      </label>
                      <label className="text-xs text-slate-500">
                        Longitude
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={draft.location.longitude}
                          readOnly
                          placeholder="Click on map"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={locating}
                        className={[
                          "h-10 mt-5 rounded-lg text-sm font-semibold border transition",
                          locating
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed border-slate-200"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
                        ].join(" ")}
                      >
                        {locating ? "Locating..." : "Use My Location"}
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                      Alert Radius: <span className="text-brand-600 font-semibold">{draft.location.radiusKm}km</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={draft.location.radiusKm}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          location: { ...p.location, radiusKm: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-2 accent-accent-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1km</span>
                      <span>50km</span>
                    </div>
                  </div>

                  {draft.location.additionalLocations.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      {draft.location.additionalLocations.map((loc, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 p-4">
                          <label className="text-sm text-slate-600 block">
                            Location Label
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                              value={loc.label}
                              onChange={(e) => updateAdditionalLocation(idx, "label", e.target.value)}
                            />
                          </label>
                          <label className="text-sm text-slate-600 block mt-3">
                            Address
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                              value={loc.addressLine}
                              onChange={(e) => updateAdditionalLocation(idx, "addressLine", e.target.value)}
                              placeholder="Workplace, School, etc."
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={addLocation}
                    className="mt-6 w-full rounded-2xl border border-dashed border-slate-300 py-3 text-slate-600 hover:border-slate-400"
                  >
                    + Add Another Location (e.g., Workplace, School)
                  </button>
                </div>
              </div>
            ) : null}

            {step === "preferences" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Step 2 of 4: What dangers concern you?</h2>
                  <p className="text-slate-500">Choose disaster types to avoid alert fatigue</p>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5 flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={draft.preferences.categories.length === Object.keys(ALERT_CATEGORY_LABELS).length}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        preferences: {
                          ...p.preferences,
                          categories: e.target.checked ? Object.keys(ALERT_CATEGORY_LABELS) : [],
                        },
                      }))
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">All Hazards</div>
                    <div className="text-sm text-slate-500">Subscribe to every possible alert type</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {ALERT_HAZARD_GROUPS.map((group) => {
                    const Icon = group.icon;
                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-3 text-slate-800 font-semibold mb-3">
                          <Icon className="h-5 w-5 text-brand-600" />
                          {group.title}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.items.map((item) => (
                            <label
                              key={item}
                              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={draft.preferences.categories.includes(item)}
                                onChange={() => toggleCategory(item)}
                              />
                              <span className="text-slate-800">{ALERT_CATEGORY_LABELS[item]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900">How urgent? (Minimum Alert Level)</h3>
                  <div className="mt-4 space-y-4">
                    {ALERT_LEVELS.map((level) => (
                      <label
                        key={level.key}
                        className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${draft.preferences.minAlertLevel === level.key
                          ? "border-brand-500 bg-brand-50/50"
                          : "border-slate-200 bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="minAlertLevel"
                          checked={draft.preferences.minAlertLevel === level.key}
                          onChange={() =>
                            setDraft((p) => ({ ...p, preferences: { ...p.preferences, minAlertLevel: level.key } }))
                          }
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{level.label}</div>
                          <div className="text-sm text-slate-500">{level.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === "household" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Household Profile</h2>
                  <p className="text-slate-500">Help emergency services prioritize response and tailor instructions</p>
                </div>

                <label className="text-sm text-slate-600 block">
                  How many people typically live in your household?
                  <input
                    type="number"
                    min={1}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                    value={draft.household.householdSize}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, household: { ...p.household, householdSize: Number(e.target.value || 1) } }))
                    }
                  />
                </label>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Special Needs / Accessibility
                  </h3>
                  <p className="text-slate-500 text-sm">
                    If a power outage is coming, residents with special needs require different alerts
                  </p>
                  <div className="mt-4 space-y-3">
                    {SPECIAL_NEEDS.map((item) => (
                      <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <input type="checkbox" checked={draft.household.specialNeeds.includes(item.key)} onChange={() => toggleNeed(item.key)} />
                        <span className="text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-brand-600" /> Assets at Risk
                  </h3>
                  <div className="mt-4 space-y-3">
                    {ASSETS_AT_RISK.map((item) => (
                      <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <input type="checkbox" checked={draft.household.assetsAtRisk.includes(item.key)} onChange={() => toggleAsset(item.key)} />
                        <span className="text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="text-sm text-slate-600 block">
                  Notes (optional)
                  <textarea
                    className="mt-2 w-full min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                    value={draft.household.notes}
                    onChange={(e) => setDraft((p) => ({ ...p, household: { ...p.household, notes: e.target.value } }))}
                  />
                </label>
              </div>
            ) : null}

            {step === "delivery_review" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Delivery Preferences</h2>
                  <p className="text-slate-500">How and when should we contact you?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHANNEL_OPTIONS.map((channel) => {
                    const Icon = channel.icon;
                    const selected = draft.delivery.channels.includes(channel.key);
                    return (
                      <button
                        key={channel.key}
                        type="button"
                        onClick={() => toggleChannel(channel.key)}
                        className={`text-left rounded-2xl border p-4 transition ${selected ? "border-brand-500 bg-brand-50/50" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={selected} readOnly className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                              <Icon className="h-4 w-4 text-slate-500" />
                              {channel.label}
                            </div>
                            <div className="text-sm text-slate-500">{channel.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.preferences.quietHours.enabled}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, preferences: { ...p.preferences, quietHours: { ...p.preferences.quietHours, enabled: e.target.checked } } }))
                    }
                  /> */}
                  {/* Enable Quiet Hours */}
                {/* </label> */}

                {/* <label className="text-sm text-slate-600 block">
                  Emergency Contact / Family Coordinator (Optional)
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full outline-none text-slate-700"
                      value={draft.delivery.emergencyContact}
                      onChange={(e) => setDraft((p) => ({ ...p, delivery: { ...p.delivery, emergencyContact: e.target.value } }))}
                      placeholder="Family member's phone number"
                      inputMode="tel"
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    An adult child or family member in another city who can coordinate
                  </div>
                </label> */}

                <div className="rounded-2xl border border-accent-200 bg-accent-50/60 p-5">
                  <div className="flex items-center gap-2 font-semibold text-accent-700">
                    <CheckCircle2 className="h-5 w-5" /> Subscription Summary
                  </div>
                  <div className="mt-3 text-sm text-accent-800 space-y-1">
                    <div>We will receive alerts at {draft.location.additionalLocations.length + 1} location(s)</div>
                    <div>Monitoring {draft.preferences.categories.length} disaster type(s)</div>
                    <div>Via {draft.delivery.channels.length} notification channel(s)</div>
                    <div>Preferred language: {draft.preferences.language}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5 text-sm text-slate-700">
                  <div className="font-semibold mb-1">What happens next?</div>
                  After subscribing, you will receive a test alert to confirm everything is working.
                  You can update your preferences anytime using the link we will send to your email.
                </div>

                <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.consent.accepted}
                    onChange={(e) => setDraft((p) => ({ ...p, consent: { accepted: e.target.checked } }))}
                    className="mt-1"
                  />
                  I agree to receive safety alerts via my selected channels. I can unsubscribe at any time.
                </label>
              </div>
            ) : null}

            <div className="mt-10 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className={[
                  "px-6 py-3 rounded-xl border transition text-sm font-semibold",
                  stepIndex === 0
                    ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-400"
                    : "border-slate-200 text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                Previous
              </button>

              {step !== "delivery_review" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-8 py-3 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition text-sm font-semibold"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onSubmit}
                  className={[
                    "px-8 py-3 rounded-xl text-white transition text-sm font-semibold",
                    submitting ? "bg-slate-400 cursor-not-allowed" : "bg-accent-600 hover:bg-accent-700",
                  ].join(" ")}
                >
                  {submitting ? "Saving..." : "Save subscription"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {showSuccess ? (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">
              Subscription Confirmed
            </div>
            <div className="px-5 py-5 text-slate-600">
              Successfully subscribed. You will receive a test alert shortly.
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="px-5 py-2 rounded-lg bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFooter ? (
        <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
      ) : null}
    </div>
  );
};

export default AlertSubscriptionPage;
