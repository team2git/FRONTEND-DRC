import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import {
  Ambulance,
  Flame,
  Droplet,
  Home,
  Zap,
  Shield,
  Car,
  PawPrint,
  Plus,
  MapPin,
  Mic,
  Camera,
  Video,
  CheckCircle2,
  LocateFixed,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import api from "@/api/axios";
import { getLocationHierarchy, type LocationHierarchyItem } from "@/api/locationService";
import { reverseLookupLocation } from "@/utils/geoReverseLookup";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ServiceExitButton from "./components/ServiceExitButton";
import { usePortalContent } from "@/hooks/usePortalContent";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";

type IncidentAttachment = { url: string; type: string; name: string };

type IncidentReportDraft = {
  reportType: "incident" | "concern";
  category: string;
  severity: "minor" | "moderate" | "critical";
  concernCategory: string;
  location: {
    addressLine: string;
    city: string;
    subCity: string;
    woreda: string;
    placeName: string;
    // region: string;
    country: string;
    latitude: string;
    longitude: string;
  };
  details: string;
  concernDetails: string;
  fireInfo: { smellOfGas: boolean; estimatedSize: string };
  floodInfo: { waterDepth: string; fastRising: boolean };
  collapseInfo: { peopleTrapped: boolean; buildingType: string };
  medicalInfo: { injuriesCount: string; needsAmbulance: boolean };
  powerInfo: { liveWires: boolean; outageArea: string };
  securityInfo: { ongoingThreat: boolean; incidentType: string };
  trafficInfo: { lanesBlocked: string; injuries: boolean };
  animalInfo: { animalType: string; aggressive: boolean };
  otherInfo: { categoryNote: string };
  concernInfo: { nature: string; peopleAffected: string };
  attachments: IncidentAttachment[];
  contact: { phone: string; email: string };
  anonymous: boolean;
};

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_DRAFT: IncidentReportDraft = {
  reportType: "incident",
  category: "",
  severity: "moderate",
  concernCategory: "",
  location: {
    addressLine: "",
    city: "",
    subCity: "",
    woreda: "",
    placeName: "",
    // region: "",
    country: "",
    latitude: "",
    longitude: "",
  },
  details: "",
  concernDetails: "",
  fireInfo: { smellOfGas: false, estimatedSize: "" },
  floodInfo: { waterDepth: "", fastRising: false },
  collapseInfo: { peopleTrapped: false, buildingType: "" },
  medicalInfo: { injuriesCount: "", needsAmbulance: false },
  powerInfo: { liveWires: false, outageArea: "" },
  securityInfo: { ongoingThreat: false, incidentType: "" },
  trafficInfo: { lanesBlocked: "", injuries: false },
  animalInfo: { animalType: "", aggressive: false },
  otherInfo: { categoryNote: "" },
  concernInfo: { nature: "", peopleAffected: "" },
  attachments: [],
  contact: { phone: "", email: "" },
  anonymous: false,
};

const CATEGORIES = [
  { key: "fire", label: "Fire", icon: Flame, color: "text-orange-500" },
  { key: "flood", label: "Flood", icon: Droplet, color: "text-brand-500" },
  { key: "collapse", label: "Collapse", icon: Home, color: "text-slate-600" },
  { key: "medical", label: "Medical", icon: Ambulance, color: "text-red-500" },
  { key: "power", label: "Power Line", icon: Zap, color: "text-amber-500" },
  { key: "security", label: "Security", icon: Shield, color: "text-accent-500" },
  { key: "traffic", label: "Traffic", icon: Car, color: "text-brand-500" },
  { key: "animal", label: "Animal", icon: PawPrint, color: "text-accent-500" },
  { key: "other", label: "Other", icon: Plus, color: "text-slate-500" },
];

const CONCERN_CATEGORIES = [
  { key: "sanitation", label: "Sanitation & Waste" },
  { key: "public_health", label: "Public Health" },
  { key: "infrastructure", label: "Infrastructure Risk" },
  { key: "environment", label: "Environmental Hazard" },
  { key: "safety", label: "Public Safety" },
  { key: "other", label: "Other" },
];

const SEVERITIES = [
  {
    key: "minor" as const,
    label: "Minor",
    description: "Small fire, one injured, slow leak",
    color: "text-rose-600",
    dot: "bg-rose-400",
    card: "border-slate-200",
  },
  {
    key: "moderate" as const,
    label: "Moderate",
    description: "Spreading fire, multiple injured, blocked road",
    color: "text-amber-700",
    dot: "bg-amber-400",
    card: "border-amber-300 bg-amber-50",
  },
  {
    key: "critical" as const,
    label: "Critical",
    description: "Trapped victims, explosion, imminent collapse",
    color: "text-accent-600",
    dot: "bg-accent-400",
    card: "border-slate-200",
  },
];

const IncidentReportingPage: React.FC = () => {
  const { portalContent } = usePortalContent();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<IncidentReportDraft>(DEFAULT_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [reportCode, setReportCode] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(true);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchyItem[]>([]);
  const [coordInputLat, setCoordInputLat] = useState<string>("");
  const [coordInputLng, setCoordInputLng] = useState<string>("");
  const [coordError, setCoordError] = useState<string | null>(null);
  const [previewFiles, setPreviewFiles] = useState<{ id: string; url: string; kind: 'image' | 'video'; uploading: boolean }[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const speechRef = useRef<any>(null);
  const locationHierarchyRef = useRef<LocationHierarchyItem[]>([]);

  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  useEffect(() => {
    getLocationHierarchy()
      .then((data) => {
        setLocationHierarchy(data);
        locationHierarchyRef.current = data;
      })
      .catch(() => {
        toast.error("Could not load subcities and woredas.");
      });
  }, []);

  useEffect(() => {
    locationHierarchyRef.current = locationHierarchy;
  }, [locationHierarchy]);

  const selectedSubcity = locationHierarchy.find((item) => item.name === draft.location.subCity);
  const availableWoredas = selectedSubcity?.woredas ?? [];

  useEffect(() => {
    if (!mapOpen || !mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView([9.03, 38.74], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.on("click", async (event) => {
      const lat = event.latlng.lat.toFixed(6);
      const lng = event.latlng.lng.toFixed(6);
      setDraft((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: lat,
          longitude: lng,
        },
      }));
      await reverseGeocode(lat, lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapOpen]);

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

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          transcript += result[0]?.transcript || "";
        }
      }
      if (transcript.trim()) {
        setDraft((prev) => ({
          ...prev,
          details:
            prev.reportType === "incident"
              ? `${prev.details ? `${prev.details} ` : ""}${transcript.trim()}`
              : prev.details,
          concernDetails:
            prev.reportType === "concern"
              ? `${prev.concernDetails ? `${prev.concernDetails} ` : ""}${transcript.trim()}`
              : prev.concernDetails,
        }));
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("We could not use your microphone. Please allow microphone access and try again.");
    };

    speechRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggleMic = async () => {
    const recognition = speechRef.current;
    if (!recognition) {
      toast.info("Speech recognition is not supported in this browser.");
      return;
    }
    if (!window.isSecureContext) {
      toast.info("Your browser needs a secure page to use your microphone.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.info("Your browser does not support microphone recording.");
      return;
    }
    if ((navigator as any).permissions?.query) {
      try {
        const status = await (navigator as any).permissions.query({ name: "microphone" });
        if (status?.state === "denied") {
          toast.info("We need your microphone to record your voice. Please allow microphone access in your browser.");
          return;
        }
      } catch {
        // ignore permission query failures
      }
    }
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      // Prompt for mic permission first to avoid opaque recognition errors
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      recognition.start();
      setIsListening(true);
    } catch (error) {
      toast.info("We could not use your microphone. Please allow microphone access and try again.");
      setIsListening(false);
    }
  };

  const reverseGeocode = async (lat: string, lng: string) => {
    if (!lat || !lng) return;
    try {
      setReverseGeocoding(true);
      let hierarchy = locationHierarchyRef.current;
      if (!hierarchy || hierarchy.length === 0) {
        try {
          hierarchy = await getLocationHierarchy();
          setLocationHierarchy(hierarchy);
          locationHierarchyRef.current = hierarchy;
        } catch {
          // fallback to empty
        }
      }

      const resolved = await reverseLookupLocation(lat, lng, hierarchy || []);

      setDraft((prev) => {
        const nextSubCity = resolved.subCity || prev.location.subCity;
        let nextWoreda = resolved.woreda;
        if (!nextWoreda && nextSubCity === prev.location.subCity) {
          nextWoreda = prev.location.woreda;
        }

        return {
          ...prev,
          location: {
            ...prev.location,
            latitude: lat,
            longitude: lng,
            addressLine: resolved.addressLine || prev.location.addressLine,
            placeName: resolved.placeName || prev.location.placeName,
            city: resolved.city || prev.location.city,
            subCity: nextSubCity,
            woreda: nextWoreda || "",
            country: resolved.country || prev.location.country,
          },
        };
      });

      if (resolved.subCity) {
        const detected = [resolved.city, resolved.subCity, resolved.woreda].filter(Boolean).join(" • ");
        toast.info(`📍 Location detected: ${detected}`, { autoClose: 3000 });
      }
    } catch (error) {
      toast.error("Failed to reverse geocode location.");
    } finally {
      setReverseGeocoding(false);
    }
  };

  const autoLocate = async () => {
    if (!navigator.geolocation) {
      toast.error("Your browser cannot get your location. Please tap the map instead.");
      setMapOpen(true);
      return;
    }
    if (!window.isSecureContext) {
      toast.info("Your browser needs a secure page to use your location. Please tap the map instead.");
      setMapOpen(true);
      return;
    }
    if ((navigator as any).permissions?.query) {
      try {
        const status = await (navigator as any).permissions.query({ name: "geolocation" });
        if (status?.state === "denied") {
          toast.info("We need your location to place the pin. Please allow location access in your browser.");
          setMapOpen(true);
          return;
        }
      } catch {
        // ignore permission query failures
      }
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setDraft((prev) => ({
          ...prev,
          location: { ...prev.location, latitude: lat, longitude: lng },
        }));
        if (mapRef.current) {
          mapRef.current.setView([Number(lat), Number(lng)], 14);
        } else {
          setMapOpen(true);
        }
        await reverseGeocode(lat, lng);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setMapOpen(true);
        if (error?.code === 1) {
          toast.info("We need your location to place the pin. Please allow location access in your browser.");
          return;
        }
        if (error?.code === 2) {
          toast.error("We could not get your location. Please try again or tap the map.");
          return;
        }
        if (error?.code === 3) {
          toast.error("Getting your location took too long. Please try again.");
          return;
        }
        toast.info("We could not access your location. Please allow access or tap the map.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  const uploadIncidentMedia = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/uploads/incident-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.url as string;
  };
  const handleFileUpload = async (file: File) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    const objectUrl = URL.createObjectURL(file);
    setPreviewFiles((p) => [...p, { id, url: objectUrl, kind, uploading: true }]);
    try {
      const url = await uploadIncidentMedia(file);
      setDraft((prev) => ({
        ...prev,
        attachments: [...prev.attachments, { url, type: kind, name: file.name }],
      }));
      setPreviewFiles((p) => p.filter((x) => x.id !== id));
      URL.revokeObjectURL(objectUrl);
      toast.success('Attachment uploaded');
    } catch (error) {
      // leave preview and mark not uploading
      setPreviewFiles((p) => p.map((x) => (x.id === id ? { ...x, uploading: false } : x)));
      toast.error('Failed to upload attachment');
    }
  };

  useEffect(() => {
    return () => {
      previewFiles.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previewFiles]);

  const handleSelectAndUpload = (file?: File | null) => {
    if (!file) return;
    handleFileUpload(file);
  };

  const setPinFromInputs = () => {
    setCoordError(null);
    const lat = coordInputLat.trim();
    const lng = coordInputLng.trim();
    if (!lat || !lng) {
      setCoordError('Please provide both latitude and longitude');
      return;
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
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
    const latFormatted = latNum.toFixed(6);
    const lngFormatted = lngNum.toFixed(6);
    setDraft((prev) => ({ ...prev, location: { ...prev.location, latitude: latFormatted, longitude: lngFormatted } }));
    setCoordInputLat('');
    setCoordInputLng('');
    setCoordError(null);
    reverseGeocode(latFormatted, lngFormatted);
  };

  const locationHeaderText = [
    draft.location.subCity,
    draft.location.woreda,
    draft.location.placeName,
  ].filter(Boolean).join(" • ") || draft.location.addressLine || "Tap to enter location";

  const submitReport = async () => {
    if (draft.reportType === "incident") {
      if (!draft.category) {
        toast.error("Please select what happened.");
        return;
      }
      if (!draft.severity) {
        toast.error("Please select severity.");
        return;
      }
      if (!draft.details.trim()) {
        toast.error("Please add details.");
        return;
      }
    } else {
      if (!draft.concernCategory) {
        toast.error("Please select a concern category.");
        return;
      }
      if (!draft.concernDetails.trim()) {
        toast.error("Please describe the concern.");
        return;
      }
    }

    if (!draft.anonymous && !draft.contact.phone.trim()) {
      toast.error("Please enter your contact phone number.");
      return;
    }

    const payload = {
      reportType: draft.reportType,
      category: draft.category,
      severity: draft.reportType === "incident" ? draft.severity : "moderate",
      concernCategory: draft.concernCategory,
      location: {
        addressLine: draft.location.addressLine,
        city: draft.location.city,
        subCity: draft.location.subCity,
        woreda: draft.location.woreda,
        placeName: draft.location.placeName,
        // region: draft.location.region,
        country: draft.location.country,
        latitude: draft.location.latitude ? Number(draft.location.latitude) : null,
        longitude: draft.location.longitude ? Number(draft.location.longitude) : null,
      },
      details: draft.reportType === "incident" ? draft.details : "",
      concernDetails: draft.reportType === "concern" ? draft.concernDetails : "",
      fireInfo: draft.category === "fire" ? draft.fireInfo : { smellOfGas: false, estimatedSize: "" },
      floodInfo: draft.category === "flood" ? draft.floodInfo : { waterDepth: "", fastRising: false },
      collapseInfo: draft.category === "collapse" ? draft.collapseInfo : { peopleTrapped: false, buildingType: "" },
      medicalInfo: draft.category === "medical" ? draft.medicalInfo : { injuriesCount: "", needsAmbulance: false },
      powerInfo: draft.category === "power" ? draft.powerInfo : { liveWires: false, outageArea: "" },
      securityInfo: draft.category === "security" ? draft.securityInfo : { ongoingThreat: false, incidentType: "" },
      trafficInfo: draft.category === "traffic" ? draft.trafficInfo : { lanesBlocked: "", injuries: false },
      animalInfo: draft.category === "animal" ? draft.animalInfo : { animalType: "", aggressive: false },
      otherInfo: draft.category === "other" ? draft.otherInfo : { categoryNote: "" },
      concernInfo: draft.concernInfo,
      attachments: draft.attachments,
      contact: draft.anonymous ? { phone: "", email: "" } : draft.contact,
      anonymous: draft.anonymous,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/incident-reports", payload);
      setReportCode(res.data?.reportCode || null);
      setUploaded(true);
      toast.success("Report submitted");
      setDraft(DEFAULT_DRAFT);
      setMapOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(20,63,132,0.1),transparent)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 transition-all duration-700">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-white shadow-xl shadow-brand-100/50 rounded-2xl border border-brand-50">
                <div className="w-2 h-2 bg-accent-600 rounded-full animate-ping" />
                <span className="text-brand-600 text-[11px] font-black uppercase tracking-[0.25em]">Rapid Response</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                Report an Incident or Concern, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-400 to-accent-400">Fast.</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                Share critical details in minutes. Your report helps responders act quickly and keep communities safe.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-20 pb-16 px-4 -mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[40px] border border-white/80 shadow-[0_60px_120px_-30px_rgba(15,23,42,0.2)] overflow-hidden">
            <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,63,132,0.2),transparent)]" />
              <h1 className="relative text-xl font-black tracking-tight">Report Incident or Concern</h1>
              <ServiceExitButton
                onClick={() => navigate("/portal/services")}
                label="Exit service"
                className="relative border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
              />
            </div>

            {uploaded ? (
              <div className="p-10 text-center bg-accent-50">
                <div className="w-20 h-20 rounded-full bg-accent-500 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 size={42} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-6">Report Submitted</h2>
                <p className="text-slate-600 mt-2">
                  Your report ID: <span className="text-accent-600 font-bold">{reportCode || "-"}</span>
                </p>
                <div className="mt-8 bg-white rounded-2xl p-6 border border-accent-100 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">What Happens Next</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-500 text-white text-sm font-bold flex items-center justify-center">
                        1
                      </div>
                      <span className="text-slate-700 font-medium">Submitted</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-500 text-white text-sm font-bold flex items-center justify-center">
                        2
                      </div>
                      <span className="text-slate-700 font-medium">Received & Verified</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center">
                        3
                      </div>
                      <span className="text-slate-700 font-medium">Dispatched to Responders</span>
                    </div>
                  </div>
                </div>
                <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" />
                  Notify me when status changes
                </label>
                <div>
                  <button
                    className="mt-6 px-8 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                    onClick={() => setUploaded(false)}
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 space-y-10">
                <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="text-brand-600" />
                    <div>
                      <div className="text-sm font-semibold">Location: {locationHeaderText}</div>
                      <div className="text-xs text-slate-500">
                        {draft.location.addressLine || draft.location.city || draft.location.country || ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                    // className="px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-semibold disabled:opacity-70 hover:bg-accent-700"
                    // onClick={forwardGeocode}
                    // disabled={geocoding}
                    >
                      {/* {geocoding ? "Locating..." : "Correct"} */}
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-slate-500 text-white text-sm font-semibold"
                      onClick={() => setMapOpen((prev) => !prev)}
                    >
                      {mapOpen ? "Hide Map" : "Show Map"}
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-semibold disabled:opacity-70 hover:bg-accent-600 flex items-center gap-2"
                      onClick={autoLocate}
                      disabled={locating}
                    >
                      <LocateFixed size={14} />
                      {locating ? "Locating..." : "Use GPS"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700 bg-white"
                    value={draft.location.subCity}
                    onChange={(e) => {
                      const nextSubCity = e.target.value;
                      setDraft((p) => ({
                        ...p,
                        location: {
                          ...p.location,
                          subCity: nextSubCity,
                          woreda: nextSubCity ? p.location.woreda : "",
                        },
                      }));
                    }}
                  >
                    <option value="">Select subcity</option>
                    {locationHierarchy.map((item) => (
                      <option key={item._id || item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    value={draft.location.woreda}
                    onChange={(e) => setDraft((p) => ({ ...p, location: { ...p.location, woreda: e.target.value } }))}
                    disabled={!draft.location.subCity || availableWoredas.length === 0}
                  >
                    <option value="">{draft.location.subCity ? "Select woreda" : "Select subcity first"}</option>
                    {availableWoredas.map((woreda) => (
                      <option key={woreda._id || woreda.name} value={woreda.name}>
                        {woreda.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                    placeholder="Place name"
                    value={draft.location.placeName}
                    onChange={(e) => setDraft((p) => ({ ...p, location: { ...p.location, placeName: e.target.value } }))}
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                    placeholder="Street / Landmark"
                    value={draft.location.addressLine}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, location: { ...p.location, addressLine: e.target.value } }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                    placeholder="City"
                    value={draft.location.city}
                    onChange={(e) => setDraft((p) => ({ ...p, location: { ...p.location, city: e.target.value } }))}
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                    placeholder="Country"
                    value={draft.location.country}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, location: { ...p.location, country: e.target.value } }))
                    }
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Use the address fields and click Correct to auto-fill the map.</span>
                  {reverseGeocoding ? <span>Updating address from map...</span> : null}
                </div>

                {mapOpen ? (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div ref={mapContainerRef} className="h-64 w-full" />
                    <div className="flex gap-4 p-4 bg-slate-50 text-xs text-slate-600">
                      <div>Lat: {draft.location.latitude || "-"}</div>
                      <div>Lng: {draft.location.longitude || "-"}</div>
                      <div className="ml-auto flex items-center gap-2">
                        <input
                          placeholder="lat"
                          value={coordInputLat}
                          onChange={(e) => setCoordInputLat(e.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-1 text-xs w-28"
                        />
                        <input
                          placeholder="lng"
                          value={coordInputLng}
                          onChange={(e) => setCoordInputLng(e.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-1 text-xs w-28"
                        />
                        <button onClick={setPinFromInputs} className="px-3 py-1 rounded-lg bg-accent-600 text-white text-xs">Set pin</button>
                      </div>
                    </div>
                    {coordError ? <div className="px-4 pb-4 text-xs text-rose-600">{coordError}</div> : null}
                  </div>
                ) : null}

                <div>
                  <h2 className="text-lg font-bold text-slate-900">REPORT TYPE</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { key: "incident", label: "Incident" },
                      { key: "concern", label: "Concern" },
                    ].map((option) => {
                      const active = draft.reportType === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              reportType: option.key as "incident" | "concern",
                            }))
                          }
                          className={`rounded-2xl border px-4 py-3 text-center font-semibold transition-all ${active ? "border-brand-500 shadow-md text-brand-600" : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {draft.reportType === "incident" ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">WHAT HAPPENED?</h2>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {CATEGORIES.map((category) => {
                          const Icon = category.icon;
                          const active = draft.category === category.key;
                          return (
                            <button
                              key={category.key}
                              type="button"
                              onClick={() => setDraft((p) => ({ ...p, category: category.key }))}
                              className={`rounded-2xl border p-4 text-center transition-all ${active ? "border-brand-500 shadow-md" : "border-slate-200 hover:border-slate-300"
                                }`}
                            >
                              <Icon className={`mx-auto mb-2 ${category.color}`} />
                              <div className="text-sm font-semibold text-slate-700">{category.label}</div>
                            </button>
                          );
                        })}
                      </div>
                      {draft.category === "other" ? (
                        <div className="mt-4">
                          <label className="text-sm font-semibold text-slate-700">Add another incident type</label>
                          <input
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                            value={draft.otherInfo.categoryNote}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, otherInfo: { categoryNote: e.target.value } }))
                            }
                            placeholder="e.g., Gas leak, Missing person"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">HOW BAD?</h2>
                      <div className="mt-4 space-y-3">
                        {SEVERITIES.map((sev) => (
                          <label
                            key={sev.key}
                            className={`flex items-center gap-4 border rounded-2xl px-4 py-4 ${sev.card}`}
                          >
                            <input
                              type="radio"
                              name="severity"
                              checked={draft.severity === sev.key}
                              onChange={() => setDraft((p) => ({ ...p, severity: sev.key }))}
                            />
                            <div>
                              <div className={`font-bold ${sev.color}`}>
                                <span className={`inline-block w-3 h-3 rounded-full ${sev.dot} mr-2`} />
                                {sev.label}
                              </div>
                              <div className="text-sm text-slate-500">{sev.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">CONCERN CATEGORY</h2>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          value={draft.concernCategory}
                          onChange={(e) => setDraft((p) => ({ ...p, concernCategory: e.target.value }))}
                        >
                          <option value="">Select category...</option>
                          {CONCERN_CATEGORIES.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {draft.concernCategory === "other" ? (
                        <div className="mt-4">
                          <label className="text-sm font-semibold text-slate-700">Specify concern</label>
                          <input
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                            value={draft.concernInfo.nature}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, concernInfo: { ...p.concernInfo, nature: e.target.value } }))
                            }
                            placeholder="e.g., Illegal dumping, unsafe structure"
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Nature of Concern</label>
                        <input
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                          value={draft.concernCategory === "other" ? draft.concernInfo.nature : draft.concernInfo.nature}
                          onChange={(e) =>
                            setDraft((p) => ({ ...p, concernInfo: { ...p.concernInfo, nature: e.target.value } }))
                          }
                          placeholder="e.g., Uncollected trash, open drain"
                          disabled={draft.concernCategory === "other"}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">People Affected (optional)</label>
                        <input
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                          value={draft.concernInfo.peopleAffected}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              concernInfo: { ...p.concernInfo, peopleAffected: e.target.value },
                            }))
                          }
                          placeholder="e.g., 10 families"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {/* 
                {draft.category === "fire" ? (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Fire-Specific Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.fireInfo.smellOfGas}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, fireInfo: { ...p.fireInfo, smellOfGas: e.target.checked } }))
                        }
                      />
                      Smell of Gas?
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Estimated Size</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.fireInfo.estimatedSize}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, fireInfo: { ...p.fireInfo, estimatedSize: e.target.value } }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "flood" ? (
                  <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Flood-Specific Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.floodInfo.fastRising}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, floodInfo: { ...p.floodInfo, fastRising: e.target.checked } }))
                        }
                      />
                      Water is rising fast
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Water Depth</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.floodInfo.waterDepth}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, floodInfo: { ...p.floodInfo, waterDepth: e.target.value } }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="ankle">Ankle deep</option>
                        <option value="knee">Knee deep</option>
                        <option value="waist">Waist deep</option>
                        <option value="chest">Chest deep+</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "collapse" ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Collapse-Specific Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.collapseInfo.peopleTrapped}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            collapseInfo: { ...p.collapseInfo, peopleTrapped: e.target.checked },
                          }))
                        }
                      />
                      People may be trapped
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Building Type</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.collapseInfo.buildingType}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            collapseInfo: { ...p.collapseInfo, buildingType: e.target.value },
                          }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="infrastructure">Infrastructure</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "medical" ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Medical-Specific Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.medicalInfo.needsAmbulance}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            medicalInfo: { ...p.medicalInfo, needsAmbulance: e.target.checked },
                          }))
                        }
                      />
                      Ambulance needed
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Estimated Injuries</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.medicalInfo.injuriesCount}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            medicalInfo: { ...p.medicalInfo, injuriesCount: e.target.value },
                          }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">1</option>
                        <option value="2-5">2-5</option>
                        <option value="6-10">6-10</option>
                        <option value="10+">10+</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "power" ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Power Line Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.powerInfo.liveWires}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, powerInfo: { ...p.powerInfo, liveWires: e.target.checked } }))
                        }
                      />
                      Live wires visible
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Outage Area</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.powerInfo.outageArea}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, powerInfo: { ...p.powerInfo, outageArea: e.target.value } }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="block">Single block</option>
                        <option value="neighborhood">Neighborhood</option>
                        <option value="district">District</option>
                        <option value="citywide">Citywide</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "security" ? (
                  <div className="bg-accent-50 border border-accent-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Security Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.securityInfo.ongoingThreat}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            securityInfo: { ...p.securityInfo, ongoingThreat: e.target.checked },
                          }))
                        }
                      />
                      Threat is ongoing
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Incident Type</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.securityInfo.incidentType}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            securityInfo: { ...p.securityInfo, incidentType: e.target.value },
                          }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="theft">Theft</option>
                        <option value="assault">Assault</option>
                        <option value="disturbance">Disturbance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "traffic" ? (
                  <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Traffic Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.trafficInfo.injuries}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            trafficInfo: { ...p.trafficInfo, injuries: e.target.checked },
                          }))
                        }
                      />
                      Injuries reported
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Lanes Blocked</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.trafficInfo.lanesBlocked}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            trafficInfo: { ...p.trafficInfo, lanesBlocked: e.target.value },
                          }))
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">1 lane</option>
                        <option value="2">2 lanes</option>
                        <option value="all">All lanes</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {draft.category === "animal" ? (
                  <div className="bg-accent-50 border border-accent-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Animal Information</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.animalInfo.aggressive}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            animalInfo: { ...p.animalInfo, aggressive: e.target.checked },
                          }))
                        }
                      />
                      Animal is aggressive
                    </label>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Animal Type</label>
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.animalInfo.animalType}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            animalInfo: { ...p.animalInfo, animalType: e.target.value },
                          }))
                        }
                        placeholder="e.g. Dog, Snake, Livestock"
                      />
                    </div>
                  </div>
                ) : null}

                {draft.category === "other" ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Other Information</h3>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Category Note</label>
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                        value={draft.otherInfo.categoryNote}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, otherInfo: { categoryNote: e.target.value } }))
                        }
                        placeholder="Briefly describe the incident type"
                      />
                    </div>
                  </div>
                ) : null} */}

                <div>
                  <h2 className="text-lg font-bold text-slate-900">DETAILS</h2>
                  <div className="mt-3 relative">
                    <textarea
                      className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                      placeholder={
                        draft.reportType === "incident"
                          ? "Use simple words: 'Fire on third floor, people waving from window.'"
                          : "Describe the concern clearly: what, where, and why it matters."
                      }
                      value={draft.reportType === "incident" ? draft.details : draft.concernDetails}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          details: p.reportType === "incident" ? e.target.value : p.details,
                          concernDetails: p.reportType === "concern" ? e.target.value : p.concernDetails,
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={toggleMic}
                      aria-pressed={isListening}
                      className={`absolute right-4 bottom-4 w-10 h-10 rounded-full text-white flex items-center justify-center transition ${isListening ? "bg-accent-700" : "bg-accent-600"
                        }`}
                    >
                      <Mic size={18} />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {isListening ? "Listening..." : "Tap microphone to add voice notes"}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">ATTACH PHOTO/VIDEO</h2>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-4 cursor-pointer">
                      <Camera size={18} />
                      <span className="font-semibold">Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSelectAndUpload(file);
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-4 cursor-pointer">
                      <Video size={18} />
                      <span className="font-semibold">Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSelectAndUpload(file);
                        }}
                      />
                    </label>
                  </div>
                  {previewFiles.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {previewFiles.map((p) => (
                        <div key={p.id} className="rounded-xl border border-slate-200 p-2 relative">
                          {p.kind === 'image' ? (
                            <img src={p.url} alt="preview" className="w-full h-24 object-cover rounded-lg opacity-80" />
                          ) : (
                            <video src={p.url} className="w-full h-24 object-cover rounded-lg" controls />
                          )}
                          <div className="absolute top-2 right-2 text-xs bg-white/80 rounded px-2 py-0.5">Uploading...</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {draft.attachments.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {draft.attachments.map((att, idx) => (
                        <div key={`${att.url}-${idx}`} className="rounded-xl border border-slate-200 p-2">
                          {att.type === "image" ? (
                            <img src={att.url} alt={att.name} className="w-full h-24 object-cover rounded-lg" />
                          ) : att.type === 'video' ? (
                            <video src={att.url} className="w-full h-24 object-cover rounded-lg" controls />
                          ) : (
                            <div className="h-24 flex items-center justify-center text-sm text-slate-500">
                              {att.name}
                            </div>
                          )}
                          <button
                            className="mt-2 w-full text-xs text-rose-600"
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                attachments: p.attachments.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="text-xs text-slate-500 mt-2">
                    Photos help responders assess the situation
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">YOUR CONTACT</h2>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                      placeholder="+1 555-1234"
                      value={draft.contact.phone}
                      onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))}
                      disabled={draft.anonymous}
                    />
                    {/* <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700"
                    placeholder="you@example.com"
                    value={draft.contact.email}
                    onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))}
                    disabled={draft.anonymous}
                    /> */}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Only for responders to ask clarifying questions. Not shared publicly.
                  </div>
                  <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                    // type="checkbox"
                    // checked={draft.anonymous}
                    // onChange={(e) => setDraft((p) => ({ ...p, anonymous: e.target.checked }))}
                    />
                    {/* Report Anonymously  */}
                  </label>
                </div>

                <button
                  type="button"
                  onClick={submitReport}
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-accent-600 text-white font-bold text-lg disabled:opacity-60 hover:bg-accent-700"
                >
                  {submitting ? "Submitting..." : "SUBMIT REPORT"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      {showFooter ? (
        <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
      ) : null}
    </div>
  );
};



export default IncidentReportingPage;
