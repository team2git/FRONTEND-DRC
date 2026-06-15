import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle,
  Flame,
  Hospital,
  MapPin,
  PhoneCall,
  Shield,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ServiceExitButton from "./components/ServiceExitButton";
// import PortalServiceFormSection from "./components/PortalServiceFormSection";
import { usePortalContent } from "@/hooks/usePortalContent";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";
import {
  emergencyContactService,
  type EmergencyContact,
  type EmergencyDirectoryResponse,
} from "@/api/emergencyContactService";

const cardIcon = (iconKey?: EmergencyContact["iconKey"]) => {
  switch (iconKey) {
    case "police":
      return Shield;
    case "fire":
      return Flame;
    case "hospital":
      return Hospital;
    case "phone":
    default:
      return PhoneCall;
  }
};

const phoneHref = (phoneNumber: string) => `tel:${phoneNumber.replace(/\s+/g, "")}`;

const EmergencyContactDirectoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRegion = searchParams.get("region") || "";

  const { portalContent, loading: portalLoading } = usePortalContent();
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  const [directory, setDirectory] = useState<EmergencyDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        setLoading(true);
        const response = await emergencyContactService.getPublicDirectory(selectedRegion || undefined);
        setDirectory(response);
      } catch (error) {
        console.error("Failed to load emergency directory", error);
        setDirectory(null);
      } finally {
        setLoading(false);
      }
    };

    loadDirectory();
  }, [selectedRegion]);

  const availableRegions = useMemo(() => directory?.availableRegions || [], [directory]);

  return (
    <div className="portal-theme min-h-screen overflow-x-hidden bg-[#F8FAFF] font-outfit">
      <PageMeta
        title="Emergency Contact Directory | IDRMIS Portal"
        description="View emergency support numbers and quick access contacts."
      />
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

      <div className="relative overflow-hidden bg-slate-950 pb-28 pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-[10s] scale-105"
          style={{
            backgroundImage: `url('${resolvePortalAssetUrl(portalContent?.pages?.feedback?.heroImage) || "/assets/images/hero1.png"}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)]" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-brand-50 bg-white px-6 py-2 shadow-xl shadow-brand-100/50">
              <div className="h-2 w-2 rounded-full bg-[#D7000F] animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-600">
                Rapid response
              </span>
            </div>

            <div>
              <div className="mb-6">
               
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Emergency Contact
                <br />
                <span className="bg-gradient-to-br from-brand-400 via-brand-400 to-accent-400 bg-clip-text text-transparent">
                  Directory.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl">
                Reach police, fire, ambulance, and other emergency support lines quickly when every second matters.
              </p>
            </div>
             <ServiceExitButton
                  onClick={() => navigate("/portal/services")}
                  className="border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
                />
          </div>
        </div>
      </div>

      <main className="-mt-16 px-4 pb-20 relative z-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-[40px] border border-white/80 bg-white shadow-[0_60px_120px_-30px_rgba(15,23,42,0.2)]">
            {loading || portalLoading ? (
              <div className="py-16 text-center text-slate-500">Loading emergency directory...</div>
            ) : !directory ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Directory unavailable</h1>
                <p className="mt-3 text-slate-500">
                  We could not load the emergency directory right now. Please try again shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="relative flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 px-6 py-5 text-white sm:px-9">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent)]" />
                  <div className="relative">
                    <h1 className="text-xl font-black tracking-tight sm:text-2xl">{directory.title}</h1>
                    <p className="mt-1 text-sm font-medium text-slate-300 sm:text-base">
                      {directory.description}
                    </p>
                  </div>
                  <div className="relative hidden rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 sm:block">
                    {directory.contacts.length} contacts
                  </div>
                </div>

                <div className="px-5 py-6 sm:px-8 sm:py-8">
                  {availableRegions.length > 0 ? (
                    <div className="rounded-[28px] border border-brand-100 bg-brand-50/70 px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 text-slate-700">
                          <MapPin className="h-5 w-5 text-brand-600" />
                          <div>
                            <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                              Filter by region
                            </div>
                            <div className="text-base font-semibold text-slate-800">
                              {selectedRegion || "Showing all available emergency contacts"}
                            </div>
                          </div>
                        </div>
                        <select
                          value={selectedRegion}
                          onChange={(e) => {
                            const nextRegion = e.target.value;
                            if (!nextRegion) {
                              setSearchParams({});
                              return;
                            }
                            setSearchParams({ region: nextRegion });
                          }}
                          className="min-h-14 w-full rounded-[18px] border border-brand-100 bg-white px-5 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 sm:w-[260px]"
                        >
                          <option value="">All regions</option>
                          {availableRegions.map((region) => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-4">
                  {directory.contacts.map((contact) => {
                    const Icon = cardIcon(contact.iconKey);
                    return (
                      <a
                        key={contact._id}
                        href={phoneHref(contact.phoneNumber)}
                        className="flex items-center gap-4 rounded-[22px] bg-[#F7F7F8] px-5 py-5 transition hover:translate-y-[-1px] hover:bg-[#F1F2F4] sm:px-6"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)]">
                          <Icon
                            className="h-7 w-7"
                            style={{ color: contact.accentColor || "#D7000F" }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-2xl font-black tracking-tight text-slate-950">
                            {contact.title}
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-500">
                            {contact.description || contact.availabilityText || "Emergency response contact"}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-2xl font-black text-[#D7000F] underline decoration-2 underline-offset-4">
                            {contact.phoneNumber}
                          </div>
                          {contact.alternatePhoneNumber ? (
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              Alt: {contact.alternatePhoneNumber}
                            </div>
                          ) : null}
                        </div>
                      </a>
                    );
                  })}
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-7">
                    {/* <div className="flex items-start gap-3 text-slate-500">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="text-lg font-medium">{directory.helperText}</p>
                    </div> */}
                    <div className="mt-6 flex items-start gap-3 text-[#D7000F]">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="text-[1.45rem] font-black tracking-tight">{directory.crisisText}</p>
                    </div>
                  </div>

                  {/* <div className="mt-10">
                  <PortalServiceFormSection
                    service={{
                      title: "Emergency Contact Directory",
                      description: "View key emergency contacts and directories.",
                      slug: "emergency-contacts",
                      templateSearch: "Emergency Contact Directory",
                      moduleContextType: "EmergencyContactDirectory",
                    }}
                    cardClassName="rounded-[24px] border border-slate-200 bg-[#FBFCFC] p-4 shadow-[0_24px_45px_-35px_rgba(15,23,42,0.25)] sm:p-6"
                    title="Request assistance or directory updates"
                    subtitle="Use the form below if you need a callback, local service guidance, or want to suggest directory updates."
                    emptyTitle="Request form unavailable"
                    emptyDescription="A published request form has not been configured for the emergency directory yet."
                  />
                </div> */}
                </div>
              </>
            )}
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

export default EmergencyContactDirectoryPage;
