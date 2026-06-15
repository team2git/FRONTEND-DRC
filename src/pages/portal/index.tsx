import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import PublicServices from "./components/PublicServices";
import Features from "./components/Features";
import Footer from "./components/Footer";
import { usePortalContent } from "@/hooks/usePortalContent";

const LandingPage: React.FC = () => {
    const { portalContent } = usePortalContent();
    const sectionsVisibility = portalContent?.sectionsVisibility;
    const showHeader = sectionsVisibility?.header !== false;
    const showHero = sectionsVisibility?.hero !== false;
    const showAbout = sectionsVisibility?.about !== false;
    const showServices = sectionsVisibility?.services !== false;
    const showFeatures = sectionsVisibility?.features !== false;
    const showFooter = sectionsVisibility?.footer !== false;
    const showContact = sectionsVisibility?.contact !== false;

    return (
        <div className="portal-theme min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
            {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
            <main>
                {showHero ? (
                    <Hero
                        slides={portalContent?.hero?.slides}
                        primaryCta={portalContent?.hero?.primaryCta}
                        secondaryCta={portalContent?.hero?.secondaryCta}
                    />
                ) : null}
                {showAbout ? (
                    <About
                        badge={portalContent?.about?.badge}
                        title={portalContent?.about?.title}
                        description={portalContent?.about?.description}
                        items={portalContent?.about?.items}
                        image={portalContent?.about?.image}
                    />
                ) : null}
                {showServices ? (
                    <PublicServices
                        heading={portalContent?.servicesSection?.heading}
                        subheading={portalContent?.servicesSection?.subheading}
                        services={portalContent?.servicesSection?.services || portalContent?.services}
                    />
                ) : null}
                {showFeatures ? (
                    <Features
                        badge={portalContent?.featuresSection?.badge}
                        heading={portalContent?.featuresSection?.heading}
                        subheading={portalContent?.featuresSection?.subheading}
                        features={portalContent?.featuresSection?.features || portalContent?.features}
                    />
                ) : null}
            </main>
            {showFooter ? (
                <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
            ) : null}
        </div>
    );
};

export default LandingPage;
