import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Workflow,
  CheckCircle,
  BarChart3,
  CloudIcon,
  Smartphone,
} from "lucide-react";
import RichTextDisplay from "@/components/common/RichTextDisplay";

type PortalFeature = {
  title: string;
  description: string;
  iconKey?: string;
  color?: string;
  shadow?: string;
  disabled?: boolean;
};

const defaultFeatures: PortalFeature[] = [
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
];

const iconFor = (iconKey?: string) => {
  switch ((iconKey || "").toLowerCase()) {
    case "workflow":
      return <Workflow className="w-10 h-10 text-white" />;
    case "check_circle":
      return <CheckCircle className="w-10 h-10 text-white" />;
    case "bar_chart":
      return <BarChart3 className="w-10 h-10 text-white" />;
    case "cloud":
      return <CloudIcon className="w-10 h-10 text-white" />;
    case "mobile":
      return <Smartphone className="w-10 h-10 text-white" />;
    case "shield_check":
    default:
      return <ShieldCheck className="w-10 h-10 text-white" />;
  }
};

const Features: React.FC<{
  badge?: string;
  heading?: string;
  subheading?: string;
  features?: PortalFeature[];
}> = ({ badge, heading, subheading, features }) => {
  const resolved = useMemo(() => {
    if (Array.isArray(features)) {
      return features.filter((feature) => feature?.disabled !== true);
    }
    return defaultFeatures;
  }, [features]);

  return (
    <section className="py-24 bg-white dark:bg-slate-900 overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-bold text-sm mb-4"
          >
            {badge || "Capabilities"}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
          >
            {heading || "Comprehensive Ecosystem for Resilience"}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <RichTextDisplay
              html={subheading}
              fallback="Built by experts in disaster management and data technology, the IDRMIS provides end-to-end functionality for risk mitigation."
              className="text-lg text-slate-500 dark:text-slate-400 [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resolved.map((feature, index) => (
            <motion.div
              key={`${feature.title}-${index}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              whileHover={{
                y: -10,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
              className="group p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full ${
                  feature.color || "bg-brand-600"
                }`}
              />

              <div
                className={`w-16 h-16 ${feature.color || "bg-brand-600"} ${
                  feature.shadow || "shadow-brand-500/30"
                } rounded-2xl flex items-center justify-center mb-8 shadow-lg transform group-hover:rotate-6 transition-transform duration-500`}
              >
                {iconFor(feature.iconKey)}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <RichTextDisplay
                html={feature.description}
                className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 group-hover:text-slate-600 dark:group-hover:text-slate-300 [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0"
              />
              <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center group-hover:gap-2 transition-all cursor-pointer">
                <span className="text-brand-600 font-bold text-sm">Read Details</span>
                <div className="w-0 group-hover:w-4 overflow-hidden transition-all text-brand-600">
                  →
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10 overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </section>
  );
};

export default Features;

