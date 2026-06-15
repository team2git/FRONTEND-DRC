import React, { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  BellRing,
  FileWarning,
  Database,
  Users,
  BookOpen,
  PhoneCall,
  ClipboardCheck,
} from "lucide-react";
import RichTextDisplay from "@/components/common/RichTextDisplay";

type PortalService = {
  title: string;
  description: string;
  slug: string;
  iconKey?: string;
  color?: string;
  disabled?: boolean;
};

const defaultServices: PortalService[] = [
  {
    title: "Alert Subscription & Management",
    description: "Subscribe to alerts and manage notification preferences.",
    slug: "alert-subscription",
    iconKey: "bell",
    color: "bg-brand-500",
  },
  {
    title: "Concern/Incident Reporting",
    description: "Report incidents or concerns quickly and securely.",
    slug: "incident-reporting",
    iconKey: "warning",
    color: "bg-accent-500",
  },
  {
    title: "Disaster Risk Information Access",
    description: "Access disaster risk information and resources.",
    slug: "risk-information",
    iconKey: "database",
    color: "bg-brand-600",
  },
  {
    title: "Community Participation Registration",
    description: "Register to participate in community initiatives.",
    slug: "community-registration",
    iconKey: "users",
    color: "bg-accent-600",
  },
  {
    title: "Training Material Access",
    description: "Browse and request access to training materials.",
    slug: "training-materials",
    iconKey: "book",
    color: "bg-brand-700",
  },
  {
    title: "Emergency Contact Directory",
    description: "View key emergency contacts and directories.",
    slug: "emergency-contacts",
    iconKey: "phone",
    color: "bg-accent-700",
  },
  {
    title: "Request For Inspection",
    description: "Submit a request for inspection and follow up.",
    slug: "inspection-request",
    iconKey: "clipboard",
    color: "bg-brand-800",
  },
];

const iconFor = (iconKey?: string) => {
  switch ((iconKey || "").toLowerCase()) {
    case "warning":
      return FileWarning;
    case "database":
      return Database;
    case "users":
      return Users;
    case "book":
      return BookOpen;
    case "phone":
      return PhoneCall;
    case "clipboard":
      return ClipboardCheck;
    case "bell":
    default:
      return BellRing;
  }
};

const PublicServices: React.FC<{
  heading?: string;
  subheading?: string;
  services?: PortalService[];
}> = ({ heading, subheading, services }) => {
  const resolved = useMemo(() => {
    if (Array.isArray(services)) {
      return services.filter((service) => service?.disabled !== true);
    }
    return defaultServices;
  }, [services]);

  return (
    <section id="services" className="py-24 bg-[#F8FAFF]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight"
          >
            {heading || "Public Portal Services"}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <RichTextDisplay
              html={subheading}
              fallback="Use the portal to access services and submit requests without signing in."
              className="text-lg text-slate-500 font-medium [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resolved.map((service, index) => {
            const Icon = iconFor(service.iconKey);
            return (
              <motion.div
                key={service.slug || `${service.title}-${index}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              >
                <Link
                  to={
                    service.slug === "alert-subscription"
                      ? "/alert-subscription"
                      : service.slug === "incident-reporting"
                      ? "/incident-reporting"
                      : service.slug === "inspection-request"
                      ? "/inspection-request"
                      : `/portal/services/${service.slug}`
                  }
                  className="block h-full rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 p-8 group"
                >
                  <div className="flex items-start gap-5">
                    <div
                      className={`w-14 h-14 ${service.color || "bg-brand-500"} rounded-2xl flex items-center justify-center shadow-lg shrink-0`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 mb-2 leading-snug">
                        {service.title}
                      </h3>
                      <RichTextDisplay
                        html={service.description}
                        className="text-slate-500 font-medium leading-relaxed [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0"
                      />
                      <div className="mt-5 text-brand-600 font-bold text-sm flex items-center gap-2">
                        Open service <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PublicServices;
