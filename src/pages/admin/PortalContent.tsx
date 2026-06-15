import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import PageMeta from "@/components/common/PageMeta";
import { toast } from "react-toastify";
import { invalidatePortalContentCache } from "@/hooks/usePortalContent";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";
import RichTextEditor from "@/components/common/RichTextEditor";

type Disableable = { disabled?: boolean };
type HeroSlide = { title: string; subtitle: string; image: string; iconKey?: string; disabled?: boolean };
type PortalFeature = { title: string; description: string; iconKey?: string; color?: string; shadow?: string; disabled?: boolean };
type PortalService = {
  title: string;
  description: string;
  slug: string;
  templateSearch?: string;
  moduleContextType?: string;
  iconKey?: string;
  color?: string;
  disabled?: boolean;
};

type PortalContent = {
  branding?: { orgName?: string; portalName?: string; logoUrl?: string };
  header?: { navLinks?: { label: string; href: string; disabled?: boolean }[]; ctaLabel?: string; ctaHref?: string };
  sectionsVisibility?: {
    header?: boolean;
    hero?: boolean;
    about?: boolean;
    services?: boolean;
    features?: boolean;
    feedback?: boolean;
    contact?: boolean;
    footer?: boolean;
  };
  hero?: {
    slides?: HeroSlide[];
    primaryCta?: { label?: string; href?: string };
    secondaryCta?: { label?: string; href?: string };
  };
  about?: {
    badge?: string;
    title?: string;
    description?: string;
    image?: string;
    items?: { title: string; description: string; iconKey?: string; disabled?: boolean }[];
  };
  featuresSection?: { heading?: string; subheading?: string; badge?: string; features?: PortalFeature[] };
  servicesSection?: { heading?: string; subheading?: string; services?: PortalService[] };
  features?: PortalFeature[]; // legacy
  services?: PortalService[]; // legacy
  contact?: { email?: string; phone?: string; address?: string };
  footer?: {
    headings?: { quickLinks?: string; connect?: string; newsletter?: string };
    blurb?: string;
    newsletter?: { text?: string; placeholder?: string; buttonLabel?: string };
    badges?: { text: string; iconKey?: string; disabled?: boolean }[];
    quickLinks?: { label: string; href: string; highlight?: boolean; disabled?: boolean }[];
    socials?: { label: string; href: string; iconKey?: string; disabled?: boolean }[];
    bottomLinks?: { label: string; href: string; disabled?: boolean }[];
    copyrightText?: string;
  };
  pages?: { feedback?: { title?: string; subtitle?: string; templateSearch?: string; heroImage?: string } };
};

const DEFAULT_CONTENT: PortalContent = {
  sectionsVisibility: {
    header: true,
    hero: true,
    about: true,
    services: true,
    features: true,
    feedback: true,
    contact: true,
    footer: true,
  },
  branding: {
    orgName: "PDRM",
    portalName: "PDRM",
    logoUrl: "/images/logo/logo.png",
  },
  header: {
    navLinks: [
      { label: "Home", href: "/" },
      { label: "About", href: "/#about" },
      { label: "Services", href: "/#services" },
      { label: "Feedback", href: "/feedback" },
      { label: "Contact Us", href: "/#contact" },
    ],
    ctaLabel: "My Portal",
    ctaHref: "/login",
  },
  hero: {
    slides: [
      {
        title: "Secure Disaster Risk Management",
        subtitle: "Empowering communities with smart data and real-time response capabilities.",
        image: "/assets/images/hero1.png",
      },
      {
        title: "Digital Workflow & Efficiency",
        subtitle: "Streamlining complex administrative processes with automated approval systems.",
        image: "/assets/images/hero2.png",
      },
      {
        title: "Advanced Reporting & Analytics",
        subtitle: "Get deep insights into risks, mitigation strategies, and resource allocation.",
        image: "/assets/images/hero3.png",
      },
    ],
    primaryCta: { label: "Learn More", href: "/#about" },
    secondaryCta: { label: "Give Feedback", href: "/feedback" },
  },
  about: {
    title:
      "Welcome to Addis Ababa City Disaster Management System Solutions",
    description:
      "Our platform provides a comprehensive ecosystem for managing disaster risks, ensuring that organizations can respond faster, plan smarter, and save lives through data-driven decisions.",
    badge: "About IDRMIS",
    image: "/assets/images/disas.png",
    items: [
      {
        title: "Mission",
        description: "To build resilient communities through advanced data management and strategic risk mitigation.",
        iconKey: "target",
      },
      {
        title: "Community First",
        description: "Centering disaster management around people, ensuring rapid response and inclusive safety measures.",
        iconKey: "users",
      },
      {
        title: "Smart Integration",
        description: "Seamlessly connecting various disaster management modules for a unified visibility and control.",
        iconKey: "layout",
      },
    ],
  },
  featuresSection: {
    badge: "Capabilities",
    heading: "Comprehensive Ecosystem for Resilience",
    subheading:
      "Built by experts in disaster management and data technology, the IDRMIS provides end-to-end functionality for risk mitigation.",
    features: [
      {
        iconKey: "shield_check",
        title: "Secure Management",
        description:
          "Multi-layered encryption and role-based access control to keep sensitive data protected and compliant with global standards.",
        color: "bg-brand-500",
        shadow: "shadow-brand-500/30",
      },
      {
        iconKey: "workflow",
        title: "Digital Workflow",
        description:
          "Automate complex approval loops and reporting tasks, reducing manual errors and speeding up response times.",
        color: "bg-accent-500",
        shadow: "shadow-accent-500/30",
      },
      {
        iconKey: "check_circle",
        title: "Smart Approval System",
        description:
          "Dynamic approval routing based on hierarchy and department, ensuring the right people review at the right time.",
        color: "bg-brand-600",
        shadow: "shadow-brand-500/30",
      },
      {
        iconKey: "bar_chart",
        title: "Reporting & Analytics",
        description:
          "Real-time dashboards and detailed exporting features for audit-ready disaster reports and risk assessments.",
        color: "bg-accent-600",
        shadow: "shadow-accent-500/30",
      },
      {
        iconKey: "cloud",
        title: "Cloud Infrastructure",
        description:
          "Scalable cloud integration ensuring that disaster records are always available from any location, worldwide.",
        color: "bg-brand-700",
        shadow: "shadow-brand-500/30",
      },
      {
        iconKey: "mobile",
        title: "Mobile Accessibility",
        description:
          "Fully responsive platform enabling field officers and responders to report and manage data directly from mobiles.",
        color: "bg-accent-700",
        shadow: "shadow-accent-500/30",
      },
    ],
  },
  servicesSection: {
    heading: "Public Portal Services",
    subheading: "Use the portal to access services and submit requests without signing in.",
    services: [
      {
        title: "Alert Subscription & Management",
        description: "Subscribe to alerts and manage notification preferences.",
        slug: "alert-subscription",
        templateSearch: "Alert Subscription & Management",
        moduleContextType: "AlertSubscription",
        iconKey: "bell",
        color: "bg-brand-500",
      },
      {
        title: "Concern/Incident Reporting",
        description: "Report incidents or concerns quickly and securely.",
        slug: "incident-reporting",
        templateSearch: "Concern/Incident Reporting",
        moduleContextType: "IncidentReporting",
        iconKey: "warning",
        color: "bg-accent-500",
      },
      {
        title: "Disaster Risk Information Access",
        description: "Access disaster risk information and resources.",
        slug: "risk-information",
        templateSearch: "Disaster Risk Information Access",
        moduleContextType: "RiskInformationAccess",
        iconKey: "database",
        color: "bg-brand-600",
      },
      {
        title: "Community Participation Registration",
        description: "Register to participate in community initiatives.",
        slug: "community-registration",
        templateSearch: "Community Participation Registration",
        moduleContextType: "CommunityParticipationRegistration",
        iconKey: "users",
        color: "bg-accent-600",
      },
      {
        title: "Training Material Access",
        description: "Browse and request access to training materials.",
        slug: "training-materials",
        templateSearch: "Training Material Access",
        moduleContextType: "TrainingMaterialAccess",
        iconKey: "book",
        color: "bg-brand-700",
      },
      {
        title: "Emergency Contact Directory",
        description: "View key emergency contacts and directories.",
        slug: "emergency-contacts",
        templateSearch: "Emergency Contact Directory",
        moduleContextType: "EmergencyContactDirectory",
        iconKey: "phone",
        color: "bg-accent-700",
      },
      {
        title: "Request For Inspection",
        description: "Submit a request for inspection and follow up.",
        slug: "inspection-request",
        templateSearch: "Request For Inspection",
        moduleContextType: "InspectionRequest",
        iconKey: "clipboard",
        color: "bg-brand-800",
      },
    ],
  },
  contact: {
    address: "Addis Ababa, Ethiopia",
    phone: "+251 911 22 33 44",
    email: "support@idrms.org",
  },
  footer: {
    headings: {
      quickLinks: "Quick Links",
      connect: "Connect With us",
      newsletter: "Stay Updated",
    },
    blurb:
      "Pioneering disaster management technology for safer and more resilient future. Our platform connects data with decision making.",
    newsletter: {
      text: "Subscribe to our newsletter for the latest updates in disaster management technology and insights.",
      placeholder: "Your email address",
      buttonLabel: "Submit",
    },
    badges: [
      { text: "ISO 27001 Certified Security", iconKey: "shield" },
      { text: "24/7 Premium Support Desk", iconKey: "help" },
    ],
    quickLinks: [
      { label: "Home", href: "/" },
      { label: "Give Feedback", href: "/feedback", highlight: true },
      { label: "About Us", href: "/#about" },
      { label: "Contact", href: "/#contact" },
      { label: "My Portal", href: "/login", highlight: true },
      { label: "Privacy Policy", href: "#" },
      { label: "Services", href: "/#services" },
    ],
    socials: [
      { label: "Facebook", href: "#", iconKey: "facebook" },
      { label: "Twitter", href: "#", iconKey: "twitter" },
      { label: "LinkedIn", href: "#", iconKey: "linkedin" },
      { label: "Instagram", href: "#", iconKey: "instagram" },
    ],
    bottomLinks: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
    copyrightText:
      "© {year} PDRM. All rights reserved by Innovation and Technology Development Bureau.",
  },
  pages: {
    feedback: {
      title: "Feedback",
      subtitle: "Give us your feedback",
      templateSearch: "Portal Feedback",
      heroImage: "/assets/images/hero1.png",
    },
  },
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500";

const toggleDisabledAtIndex = <T extends Disableable>(items: T[], index: number) =>
  items.map((item, currentIndex) =>
    currentIndex === index ? { ...item, disabled: !item.disabled } : item
  );

const itemPanelClass = (disabled?: boolean) =>
  `rounded-2xl border p-4 ${disabled ? "border-amber-200 bg-amber-50/60" : "border-slate-100 bg-white"}`;

type SettingsTab =
  | "branding"
  | "header"
  | "hero"
  | "about"
  | "features"
  | "services"
  | "feedback"
  | "contact"
  | "footer";

const PortalContentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<PortalContent>(DEFAULT_CONTENT);
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");
  const [uploading, setUploading] = useState(false);

  const uploadPortalImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/uploads/portal-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.url as string;
  };

  const slides = useMemo(() => content.hero?.slides ?? [], [content.hero?.slides]);
  const services = useMemo(
    () => content.servicesSection?.services ?? content.services ?? [],
    [content.servicesSection?.services, content.services]
  );
  const features = useMemo(
    () => content.featuresSection?.features ?? content.features ?? [],
    [content.featuresSection?.features, content.features]
  );

  const sectionToggles = [
    { key: "header", label: "Header" },
    { key: "hero", label: "Hero" },
    { key: "about", label: "About" },
    { key: "services", label: "Services" },
    { key: "features", label: "Features" },
    { key: "feedback", label: "Feedback Page" },
    { key: "contact", label: "Contact Block" },
    { key: "footer", label: "Footer" },
  ] as const;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/site-settings");
        if (res.data) setContent(res.data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load site settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const res = await api.put("/site-settings", content);
      setContent(res.data);
      invalidatePortalContentCache();
      toast.success("Site settings saved");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save site settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageMeta title="Site Settings | Admin" description="Manage public portal website content" />
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          Loading site settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageMeta title="Site Settings | Admin" description="Manage public portal website content" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="text-slate-500 mt-1">
            Updates apply to the public landing page and services list.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setContent(DEFAULT_CONTENT)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Section Visibility</h2>
        <p className="text-slate-500 text-sm">Turn sections on or off for the public portal.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectionToggles.map((toggle) => (
            <label key={toggle.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">{toggle.label}</span>
              <input
                type="checkbox"
                checked={content.sectionsVisibility?.[toggle.key] !== false}
                onChange={(e) =>
                  setContent((c) => ({
                    ...c,
                    sectionsVisibility: {
                      ...(c.sectionsVisibility || {}),
                      [toggle.key]: e.target.checked,
                    },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-wrap gap-2 sticky top-[72px] z-10">
        {(
          [
            ["branding", "Branding"],
            ["header", "Header"],
            ["hero", "Hero"],
            ["about", "About"],
            ["features", "Features"],
            ["services", "Services"],
            ["feedback", "Feedback"],
            ["contact", "Contact"],
            ["footer", "Footer"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === key
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "hero" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Hero Slides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Primary CTA Label</label>
            <input
              className={inputClass}
              value={content.hero?.primaryCta?.label ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: {
                    ...(c.hero || {}),
                    primaryCta: { ...(c.hero?.primaryCta || {}), label: e.target.value },
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Primary CTA Href</label>
            <input
              className={inputClass}
              value={content.hero?.primaryCta?.href ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: {
                    ...(c.hero || {}),
                    primaryCta: { ...(c.hero?.primaryCta || {}), href: e.target.value },
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Secondary CTA Label</label>
            <input
              className={inputClass}
              value={content.hero?.secondaryCta?.label ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: {
                    ...(c.hero || {}),
                    secondaryCta: { ...(c.hero?.secondaryCta || {}), label: e.target.value },
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Secondary CTA Href</label>
            <input
              className={inputClass}
              value={content.hero?.secondaryCta?.href ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  hero: {
                    ...(c.hero || {}),
                    secondaryCta: { ...(c.hero?.secondaryCta || {}), href: e.target.value },
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-4">
          {slides.map((slide, idx) => (
            <div key={idx} className={`${itemPanelClass(slide.disabled)} grid grid-cols-1 gap-4 md:grid-cols-4`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  className={inputClass}
                  value={slide.title}
                  onChange={(e) => {
                    const next = [...slides];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Subtitle</label>
                <input
                  className={inputClass}
                  value={slide.subtitle}
                  onChange={(e) => {
                    const next = [...slides];
                    next[idx] = { ...next[idx], subtitle: e.target.value };
                    setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Icon Key</label>
                <input
                  className={inputClass}
                  value={slide.iconKey ?? ""}
                  onChange={(e) => {
                    const next = [...slides];
                    next[idx] = { ...next[idx], iconKey: e.target.value };
                    setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className={inputClass}
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploading(true);
                      const url = await uploadPortalImage(file);
                      const next = [...slides];
                      next[idx] = { ...next[idx], image: url };
                      setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
                      toast.success("Image uploaded");
                    } catch (error) {
                      toast.error("Failed to upload image");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                {slide.image ? (
                  <img
                    src={resolvePortalAssetUrl(slide.image)}
                    alt="Slide"
                    className="mt-2 h-16 w-full object-cover rounded-lg border border-slate-100"
                  />
                ) : null}
              </div>

              <div className="md:col-span-4 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${slide.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {slide.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(slides, idx);
                      setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      slide.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {slide.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = slides.filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...slides, { title: "", subtitle: "", image: "" }];
              setContent((c) => ({ ...c, hero: { ...(c.hero || {}), slides: next } }));
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add slide
          </button>
        </div>
      </div>
      )}

      {activeTab === "about" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">About Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Badge</label>
            <input
              className={inputClass}
              value={content.about?.badge ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, about: { ...(c.about || {}), badge: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Title</label>
            <input
              className={inputClass}
              value={content.about?.title ?? ""}
              onChange={(e) => setContent((c) => ({ ...c, about: { ...(c.about || {}), title: e.target.value } }))}
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-600">Description</label>
            <RichTextEditor
              value={content.about?.description ?? ""}
              onChange={(value) =>
                setContent((c) => ({ ...c, about: { ...(c.about || {}), description: value } }))
              }
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-600">About Image Upload</label>
            <input
              type="file"
              accept="image/*"
              className={inputClass}
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploading(true);
                  const url = await uploadPortalImage(file);
                  setContent((c) => ({ ...c, about: { ...(c.about || {}), image: url } }));
                  toast.success("Image uploaded");
                } catch (error) {
                  toast.error("Failed to upload image");
                } finally {
                  setUploading(false);
                }
              }}
            />
            {content.about?.image ? (
              <img
                src={resolvePortalAssetUrl(content.about.image)}
                alt="About preview"
                className="mt-2 h-24 w-full object-cover rounded-lg border border-slate-100"
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="text-sm font-bold text-slate-800">About Cards</div>
          {(content.about?.items || []).map((it, idx) => (
            <div key={idx} className={`${itemPanelClass(it.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  className={inputClass}
                  value={it.title}
                  onChange={(e) => {
                    const next = [...(content.about?.items || [])];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setContent((c) => ({ ...c, about: { ...(c.about || {}), items: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Description</label>
                <RichTextEditor
                  value={it.description}
                  onChange={(value) => {
                    const next = [...(content.about?.items || [])];
                    next[idx] = { ...next[idx], description: value };
                    setContent((c) => ({ ...c, about: { ...(c.about || {}), items: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Icon Key</label>
                <input
                  className={inputClass}
                  value={it.iconKey ?? ""}
                  onChange={(e) => {
                    const next = [...(content.about?.items || [])];
                    next[idx] = { ...next[idx], iconKey: e.target.value };
                    setContent((c) => ({ ...c, about: { ...(c.about || {}), items: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${it.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {it.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(content.about?.items || [], idx);
                      setContent((c) => ({ ...c, about: { ...(c.about || {}), items: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      it.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {it.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.about?.items || []).filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, about: { ...(c.about || {}), items: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => ({
                ...c,
                about: { ...(c.about || {}), items: [...(c.about?.items || []), { title: "", description: "" }] },
              }))
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add about card
          </button>
        </div>
      </div>
      )}

      {activeTab === "features" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Features Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Badge</label>
            <input
              className={inputClass}
              value={content.featuresSection?.badge ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  featuresSection: { ...(c.featuresSection || {}), badge: e.target.value, features },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Heading</label>
            <input
              className={inputClass}
              value={content.featuresSection?.heading ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  featuresSection: { ...(c.featuresSection || {}), heading: e.target.value, features },
                }))
              }
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-600">Subheading</label>
            <RichTextEditor
              value={content.featuresSection?.subheading ?? ""}
              onChange={(value) =>
                setContent((c) => ({
                  ...c,
                  featuresSection: { ...(c.featuresSection || {}), subheading: value, features },
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          {features.map((f, idx) => (
            <div key={idx} className={`${itemPanelClass(f.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  className={inputClass}
                  value={f.title}
                  onChange={(e) => {
                    const next = [...features];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setContent((c) => ({
                      ...c,
                      featuresSection: { ...(c.featuresSection || {}), features: next },
                      features: next,
                    }));
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Description</label>
                <RichTextEditor
                  value={f.description}
                  onChange={(value) => {
                    const next = [...features];
                    next[idx] = { ...next[idx], description: value };
                    setContent((c) => ({
                      ...c,
                      featuresSection: { ...(c.featuresSection || {}), features: next },
                      features: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Icon Key</label>
                <input
                  className={inputClass}
                  value={f.iconKey ?? ""}
                  onChange={(e) => {
                    const next = [...features];
                    next[idx] = { ...next[idx], iconKey: e.target.value };
                    setContent((c) => ({
                      ...c,
                      featuresSection: { ...(c.featuresSection || {}), features: next },
                      features: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Color Class</label>
                <input
                  className={inputClass}
                  value={f.color ?? ""}
                  onChange={(e) => {
                    const next = [...features];
                    next[idx] = { ...next[idx], color: e.target.value };
                    setContent((c) => ({
                      ...c,
                      featuresSection: { ...(c.featuresSection || {}), features: next },
                      features: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Shadow Class</label>
                <input
                  className={inputClass}
                  value={f.shadow ?? ""}
                  onChange={(e) => {
                    const next = [...features];
                    next[idx] = { ...next[idx], shadow: e.target.value };
                    setContent((c) => ({
                      ...c,
                      featuresSection: { ...(c.featuresSection || {}), features: next },
                      features: next,
                    }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${f.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {f.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(features, idx);
                      setContent((c) => ({
                        ...c,
                        featuresSection: { ...(c.featuresSection || {}), features: next },
                        features: next,
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      f.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {f.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = features.filter((_, i) => i !== idx);
                    setContent((c) => ({
                      ...c,
                      featuresSection: { ...(c.featuresSection || {}), features: next },
                      features: next,
                    }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...features, { title: "", description: "" }];
              setContent((c) => ({
                ...c,
                featuresSection: { ...(c.featuresSection || {}), features: next },
                features: next,
              }));
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add feature
          </button>
        </div>
      </div>
      )}

      {activeTab === "services" && (
      <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Services Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Heading</label>
            <input
              className={inputClass}
              value={content.servicesSection?.heading ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  servicesSection: { ...(c.servicesSection || {}), heading: e.target.value, services },
                }))
              }
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-600">Subheading</label>
            <RichTextEditor
              value={content.servicesSection?.subheading ?? ""}
              onChange={(value) =>
                setContent((c) => ({
                  ...c,
                  servicesSection: { ...(c.servicesSection || {}), subheading: value, services },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Services (Public Portal)</h2>
        <p className="text-slate-500 text-sm">
          Slug must match the route under <code className="px-1.5 py-0.5 bg-slate-50 rounded">/portal/services/:slug</code>.
        </p>
        <div className="space-y-4">
          {services.map((svc, idx) => (
            <div key={idx} className={`${itemPanelClass(svc.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  className={inputClass}
                  value={svc.title}
                  onChange={(e) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setContent((c) => ({ ...c, services: next }));
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Description</label>
                <RichTextEditor
                  value={svc.description}
                  onChange={(value) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], description: value };
                    setContent((c) => ({ ...c, services: next }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Slug</label>
                <input
                  className={inputClass}
                  value={svc.slug}
                  onChange={(e) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], slug: e.target.value };
                    setContent((c) => ({
                      ...c,
                      servicesSection: { ...(c.servicesSection || {}), services: next },
                      services: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Icon Key</label>
                <input
                  className={inputClass}
                  value={svc.iconKey ?? ""}
                  onChange={(e) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], iconKey: e.target.value };
                    setContent((c) => ({
                      ...c,
                      servicesSection: { ...(c.servicesSection || {}), services: next },
                      services: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Color Class</label>
                <input
                  className={inputClass}
                  value={svc.color ?? ""}
                  onChange={(e) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], color: e.target.value };
                    setContent((c) => ({
                      ...c,
                      servicesSection: { ...(c.servicesSection || {}), services: next },
                      services: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Template Search</label>
                <input
                  className={inputClass}
                  value={svc.templateSearch ?? ""}
                  onChange={(e) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], templateSearch: e.target.value };
                    setContent((c) => ({
                      ...c,
                      servicesSection: { ...(c.servicesSection || {}), services: next },
                      services: next,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Module Context Type</label>
                <input
                  className={inputClass}
                  value={svc.moduleContextType ?? ""}
                  onChange={(e) => {
                    const next = [...services];
                    next[idx] = { ...next[idx], moduleContextType: e.target.value };
                    setContent((c) => ({
                      ...c,
                      servicesSection: { ...(c.servicesSection || {}), services: next },
                      services: next,
                    }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${svc.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {svc.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(services, idx);
                      setContent((c) => ({
                        ...c,
                        servicesSection: { ...(c.servicesSection || {}), services: next },
                        services: next,
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      svc.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {svc.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = services.filter((_, i) => i !== idx);
                    setContent((c) => ({
                      ...c,
                      servicesSection: { ...(c.servicesSection || {}), services: next },
                      services: next,
                    }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => {
                const next = [...services, { title: "", description: "", slug: "" }];
                return {
                  ...c,
                  servicesSection: { ...(c.servicesSection || {}), services: next },
                  services: next,
                };
              })
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add service
          </button>
        </div>
      </div>
      </>
      )}

      {activeTab === "feedback" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Feedback Page</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Title</label>
            <input
              className={inputClass}
              value={content.pages?.feedback?.title ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  pages: { ...(c.pages || {}), feedback: { ...(c.pages?.feedback || {}), title: e.target.value } },
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-600">Subtitle</label>
            <RichTextEditor
              value={content.pages?.feedback?.subtitle ?? ""}
              onChange={(value) =>
                setContent((c) => ({
                  ...c,
                  pages: {
                    ...(c.pages || {}),
                    feedback: { ...(c.pages?.feedback || {}), subtitle: value },
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Template Search</label>
            <input
              className={inputClass}
              value={content.pages?.feedback?.templateSearch ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  pages: {
                    ...(c.pages || {}),
                    feedback: { ...(c.pages?.feedback || {}), templateSearch: e.target.value },
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Hero Image Upload</label>
            <input
              type="file"
              accept="image/*"
              className={inputClass}
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploading(true);
                  const url = await uploadPortalImage(file);
                  setContent((c) => ({
                    ...c,
                    pages: { ...(c.pages || {}), feedback: { ...(c.pages?.feedback || {}), heroImage: url } },
                  }));
                  toast.success("Image uploaded");
                } catch (error) {
                  toast.error("Failed to upload image");
                } finally {
                  setUploading(false);
                }
              }}
            />
            {content.pages?.feedback?.heroImage ? (
              <img
                src={resolvePortalAssetUrl(content.pages.feedback.heroImage)}
                alt="Feedback hero"
                className="mt-2 h-16 w-full object-cover rounded-lg border border-slate-100"
              />
            ) : null}
          </div>
        </div>
      </div>
      )}

      {activeTab === "branding" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Organization Name</label>
            <input
              className={inputClass}
              value={content.branding?.orgName ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, branding: { ...(c.branding || {}), orgName: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Portal Name</label>
            <input
              className={inputClass}
              value={content.branding?.portalName ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, branding: { ...(c.branding || {}), portalName: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Logo Upload</label>
            <input
              type="file"
              accept="image/*"
              className={inputClass}
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploading(true);
                  const url = await uploadPortalImage(file);
                  setContent((c) => ({ ...c, branding: { ...(c.branding || {}), logoUrl: url } }));
                  toast.success("Logo uploaded");
                } catch (error) {
                  toast.error("Failed to upload logo");
                } finally {
                  setUploading(false);
                }
              }}
            />
            {content.branding?.logoUrl ? (
              <img
                src={resolvePortalAssetUrl(content.branding.logoUrl)}
                alt="Logo preview"
                className="mt-2 h-12 object-contain"
              />
            ) : null}
          </div>
        </div>
      </div>
      )}

      {activeTab === "header" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Header</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">CTA Label</label>
            <input
              className={inputClass}
              value={content.header?.ctaLabel ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, header: { ...(c.header || {}), ctaLabel: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">CTA Href</label>
            <input
              className={inputClass}
              value={content.header?.ctaHref ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, header: { ...(c.header || {}), ctaHref: e.target.value } }))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-800">Navigation Links</div>
          {(content.header?.navLinks || []).map((l, idx) => (
            <div key={idx} className={`${itemPanelClass(l.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Label</label>
                <input
                  className={inputClass}
                  value={l.label}
                  onChange={(e) => {
                    const next = [...(content.header?.navLinks || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setContent((c) => ({ ...c, header: { ...(c.header || {}), navLinks: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Href</label>
                <input
                  className={inputClass}
                  value={l.href}
                  onChange={(e) => {
                    const next = [...(content.header?.navLinks || [])];
                    next[idx] = { ...next[idx], href: e.target.value };
                    setContent((c) => ({ ...c, header: { ...(c.header || {}), navLinks: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${l.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {l.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(content.header?.navLinks || [], idx);
                      setContent((c) => ({ ...c, header: { ...(c.header || {}), navLinks: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      l.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {l.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.header?.navLinks || []).filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, header: { ...(c.header || {}), navLinks: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => ({
                ...c,
                header: {
                  ...(c.header || {}),
                  navLinks: [...(c.header?.navLinks || []), { label: "", href: "" }],
                },
              }))
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add nav link
          </button>
        </div>
      </div>
      )}

      {activeTab === "contact" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Address</label>
            <input
              className={inputClass}
              value={content.contact?.address ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, contact: { ...(c.contact || {}), address: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Phone</label>
            <input
              className={inputClass}
              value={content.contact?.phone ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, contact: { ...(c.contact || {}), phone: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Email</label>
            <input
              className={inputClass}
              value={content.contact?.email ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, contact: { ...(c.contact || {}), email: e.target.value } }))
              }
            />
          </div>
        </div>
      </div>
      )}

      {activeTab === "footer" && (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Footer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Quick Links Heading</label>
            <input
              className={inputClass}
              value={content.footer?.headings?.quickLinks ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: { ...(c.footer || {}), headings: { ...(c.footer?.headings || {}), quickLinks: e.target.value } },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Connect Heading</label>
            <input
              className={inputClass}
              value={content.footer?.headings?.connect ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: { ...(c.footer || {}), headings: { ...(c.footer?.headings || {}), connect: e.target.value } },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Newsletter Heading</label>
            <input
              className={inputClass}
              value={content.footer?.headings?.newsletter ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: {
                    ...(c.footer || {}),
                    headings: { ...(c.footer?.headings || {}), newsletter: e.target.value },
                  },
                }))
              }
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600">Blurb</label>
          <RichTextEditor
            value={content.footer?.blurb ?? ""}
            onChange={(value) => setContent((c) => ({ ...c, footer: { ...(c.footer || {}), blurb: value } }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-600">Newsletter Text</label>
            <textarea
              className={inputClass}
              value={content.footer?.newsletter?.text ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: {
                    ...(c.footer || {}),
                    newsletter: { ...(c.footer?.newsletter || {}), text: e.target.value },
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Email Placeholder</label>
            <input
              className={inputClass}
              value={content.footer?.newsletter?.placeholder ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: {
                    ...(c.footer || {}),
                    newsletter: { ...(c.footer?.newsletter || {}), placeholder: e.target.value },
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Newsletter Button Label</label>
            <input
              className={inputClass}
              value={content.footer?.newsletter?.buttonLabel ?? ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  footer: {
                    ...(c.footer || {}),
                    newsletter: { ...(c.footer?.newsletter || {}), buttonLabel: e.target.value },
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-800">Footer Badges</div>
          {(content.footer?.badges || []).map((b, idx) => (
            <div key={idx} className={`${itemPanelClass(b.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Text</label>
                <input
                  className={inputClass}
                  value={b.text}
                  onChange={(e) => {
                    const next = [...(content.footer?.badges || [])];
                    next[idx] = { ...next[idx], text: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), badges: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Icon Key</label>
                <input
                  className={inputClass}
                  value={b.iconKey ?? ""}
                  onChange={(e) => {
                    const next = [...(content.footer?.badges || [])];
                    next[idx] = { ...next[idx], iconKey: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), badges: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${b.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {b.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(content.footer?.badges || [], idx);
                      setContent((c) => ({ ...c, footer: { ...(c.footer || {}), badges: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      b.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {b.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.footer?.badges || []).filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), badges: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => ({
                ...c,
                footer: { ...(c.footer || {}), badges: [...(c.footer?.badges || []), { text: "", iconKey: "" }] },
              }))
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add badge
          </button>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600">Copyright Text (use {'{year}'})</label>
          <input
            className={inputClass}
            value={content.footer?.copyrightText ?? ""}
            onChange={(e) =>
              setContent((c) => ({ ...c, footer: { ...(c.footer || {}), copyrightText: e.target.value } }))
            }
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-800">Quick Links</div>
          {(content.footer?.quickLinks || []).map((l, idx) => (
            <div key={idx} className={`${itemPanelClass(l.disabled)} grid grid-cols-1 gap-4 md:grid-cols-4`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Label</label>
                <input
                  className={inputClass}
                  value={l.label}
                  onChange={(e) => {
                    const next = [...(content.footer?.quickLinks || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), quickLinks: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Href</label>
                <input
                  className={inputClass}
                  value={l.href}
                  onChange={(e) => {
                    const next = [...(content.footer?.quickLinks || [])];
                    next[idx] = { ...next[idx], href: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), quickLinks: next } }));
                  }}
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!l.highlight}
                    onChange={(e) => {
                      const next = [...(content.footer?.quickLinks || [])];
                      next[idx] = { ...next[idx], highlight: e.target.checked };
                      setContent((c) => ({ ...c, footer: { ...(c.footer || {}), quickLinks: next } }));
                    }}
                  />
                  Highlight
                </label>
              </div>
              <div className="md:col-span-4 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${l.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {l.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(content.footer?.quickLinks || [], idx);
                      setContent((c) => ({ ...c, footer: { ...(c.footer || {}), quickLinks: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      l.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {l.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.footer?.quickLinks || []).filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), quickLinks: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => ({
                ...c,
                footer: {
                  ...(c.footer || {}),
                  quickLinks: [...(c.footer?.quickLinks || []), { label: "", href: "" }],
                },
              }))
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add quick link
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-800">Social Links</div>
          {(content.footer?.socials || []).map((s, idx) => (
            <div key={idx} className={`${itemPanelClass(s.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Label</label>
                <input
                  className={inputClass}
                  value={s.label}
                  onChange={(e) => {
                    const next = [...(content.footer?.socials || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), socials: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Href</label>
                <input
                  className={inputClass}
                  value={s.href}
                  onChange={(e) => {
                    const next = [...(content.footer?.socials || [])];
                    next[idx] = { ...next[idx], href: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), socials: next } }));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Icon Key</label>
                <input
                  className={inputClass}
                  value={s.iconKey ?? ""}
                  onChange={(e) => {
                    const next = [...(content.footer?.socials || [])];
                    next[idx] = { ...next[idx], iconKey: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), socials: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${s.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {s.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(content.footer?.socials || [], idx);
                      setContent((c) => ({ ...c, footer: { ...(c.footer || {}), socials: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      s.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {s.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.footer?.socials || []).filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), socials: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => ({
                ...c,
                footer: {
                  ...(c.footer || {}),
                  socials: [...(c.footer?.socials || []), { label: "", href: "", iconKey: "" }],
                },
              }))
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add social link
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-800">Bottom Links</div>
          {(content.footer?.bottomLinks || []).map((l, idx) => (
            <div key={idx} className={`${itemPanelClass(l.disabled)} grid grid-cols-1 gap-4 md:grid-cols-3`}>
              <div>
                <label className="text-xs font-bold text-slate-600">Label</label>
                <input
                  className={inputClass}
                  value={l.label}
                  onChange={(e) => {
                    const next = [...(content.footer?.bottomLinks || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), bottomLinks: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Href</label>
                <input
                  className={inputClass}
                  value={l.href}
                  onChange={(e) => {
                    const next = [...(content.footer?.bottomLinks || [])];
                    next[idx] = { ...next[idx], href: e.target.value };
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), bottomLinks: next } }));
                  }}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${l.disabled ? "text-amber-700" : "text-emerald-600"}`}>
                  {l.disabled ? "Disabled" : "Active"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleDisabledAtIndex(content.footer?.bottomLinks || [], idx);
                      setContent((c) => ({ ...c, footer: { ...(c.footer || {}), bottomLinks: next } }));
                    }}
                    className={`px-3 py-2 rounded-xl font-bold ${
                      l.disabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {l.disabled ? "Enable" : "Disable"}
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.footer?.bottomLinks || []).filter((_, i) => i !== idx);
                    setContent((c) => ({ ...c, footer: { ...(c.footer || {}), bottomLinks: next } }));
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                >
                  Remove
                </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setContent((c) => ({
                ...c,
                footer: {
                  ...(c.footer || {}),
                  bottomLinks: [...(c.footer?.bottomLinks || []), { label: "", href: "" }],
                },
              }))
            }
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            + Add bottom link
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default PortalContentPage;
