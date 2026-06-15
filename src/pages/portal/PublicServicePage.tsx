import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "framer-motion";
import { Sparkles, HelpCircle } from "lucide-react";

import PageMeta from "@/components/common/PageMeta";
import RichTextDisplay from "@/components/common/RichTextDisplay";
import { stripRichTextHtml } from "@/components/common/richText";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PortalServiceFormSection from "./components/PortalServiceFormSection";
import ServiceExitButton from "./components/ServiceExitButton";
import { usePortalContent } from "@/hooks/usePortalContent";

type PortalService = {
  title: string;
  description: string;
  slug: string;
  templateSearch?: string;
  moduleContextType?: string;
  disabled?: boolean;
};

const PublicServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { serviceSlug } = useParams();

  const { portalContent, loading: portalLoading } = usePortalContent();
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;
  const showServices = sectionsVisibility?.services !== false;

  const serviceConfig = useMemo<PortalService | null>(() => {
    if (!serviceSlug) return null;
    const services: PortalService[] =
      (portalContent?.servicesSection?.services || portalContent?.services || []).filter(
        (service: PortalService) => service?.disabled !== true
      );
    return services.find((s) => s.slug === serviceSlug) || null;
  }, [portalContent, serviceSlug]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateService = async () => {
      try {
        setLoading(true);

        if (!serviceSlug) return;
        if (serviceSlug === "alert-subscription") {
          navigate("/alert-subscription", { replace: true });
          return;
        }
        if (serviceSlug === "incident-reporting") {
          navigate("/incident-reporting", { replace: true });
          return;
        }
        if (serviceSlug === "emergency-contacts") {
          navigate("/emergency-contacts", { replace: true });
          return;
        }
        if (serviceSlug === "community-registration") {
          navigate("/community-registration", { replace: true });
          return;
        }
        if (serviceSlug === "inspection-request") {
          navigate("/inspection-request", { replace: true });
          return;
        }
        if (!portalContent && portalLoading) return;
        if (!serviceConfig) return;
      } catch (error) {
        console.error("Error loading portal template:", error);
      } finally {
        setLoading(false);
      }
    };

    validateService();
  }, [serviceSlug, portalContent, portalLoading, serviceConfig]);

  if (!showServices && !loading) {
    return (
      <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
        <PageMeta title="Service | IDRMIS Portal" description="Public portal service" />
        {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
        <main className="pt-28 px-6 pb-24">
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-rose-500">
              <HelpCircle size={44} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Services are turned off</h1>
            <p className="text-slate-500 font-medium mb-8">
              This section is currently hidden in site settings.
            </p>
            <button
              onClick={() => navigate("/portal")}
              className="px-10 py-4 bg-accent-600 text-white rounded-2xl font-black hover:bg-accent-700 transition-all"
            >
              Back to portal
            </button>
          </div>
        </main>
        {showFooter ? (
          <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
        ) : null}
      </div>
    );
  }

  if (!serviceConfig && !loading) {
    return (
      <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
        <PageMeta title="Service | IDRMIS Portal" description="Public portal service" />
        {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
        <main className="pt-28 px-6 pb-24">
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-rose-500">
              <HelpCircle size={44} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Service not found</h1>
            <p className="text-slate-500 font-medium mb-8">
              The requested service does not exist on the public portal.
            </p>
            <button
              onClick={() => navigate("/portal")}
              className="px-10 py-4 bg-accent-600 text-white rounded-2xl font-black hover:bg-accent-700 transition-all"
            >
              Back to portal
            </button>
          </div>
        </main>
        {showFooter ? (
          <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="portal-theme min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-600 w-6 h-6 animate-pulse" />
        </div>
        <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs">
          Loading portal service...
        </p>
      </div>
    );
  }

  return (
    <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
      <PageMeta
        title={`${serviceConfig?.title || "Service"} | IDRMIS Portal`}
        description={stripRichTextHtml(serviceConfig?.description || "Public portal service")}
      />
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

      <div className="pt-28 pb-10">
        <div className="container mx-auto px-6">
          <ServiceExitButton onClick={() => navigate("/portal/services")} />
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-950"
          >
            {serviceConfig?.title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RichTextDisplay
              html={serviceConfig?.description}
              className="mt-4 text-lg text-slate-500 font-medium max-w-3xl [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />
          </motion.div>
        </div>
      </div>

      <main className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {serviceConfig ? (
            <PortalServiceFormSection
              service={serviceConfig}
              title={`${serviceConfig.title} form`}
              subtitle="Complete the form below to continue with this service."
              emptyTitle="Service temporarily unavailable"
              emptyDescription="No published template is configured for this service yet. Please try again later."
            />
          ) : null}
        </div>
      </main>
      {showFooter ? (
        <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
      ) : null}
    </div>
  );
};

export default PublicServicePage;

