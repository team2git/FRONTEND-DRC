import React from "react";
import PageMeta from "@/components/common/PageMeta";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PublicServices from "./components/PublicServices";
import { usePortalContent } from "@/hooks/usePortalContent";

const ServicePortalPage: React.FC = () => {
  const { portalContent } = usePortalContent();
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;
  const showServices = sectionsVisibility?.services !== false;

  return (
    <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
      <PageMeta
        title="Service Portal | IDRMIS Portal"
        description="Browse public services and launch the service you need."
      />
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
      <main className="pt-24">
        {showServices ? (
          <PublicServices
            heading={portalContent?.servicesSection?.heading}
            subheading={portalContent?.servicesSection?.subheading}
            services={portalContent?.servicesSection?.services || portalContent?.services}
          />
        ) : (
          <div className="px-6 py-24">
            <div className="mx-auto max-w-3xl rounded-[40px] border border-slate-100 bg-white p-10 text-center shadow-sm">
              <h1 className="text-3xl font-black text-slate-900">Services are turned off</h1>
              <p className="mt-4 text-slate-500 font-medium">
                This service portal is currently hidden in site settings.
              </p>
            </div>
          </div>
        )}
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

export default ServicePortalPage;
