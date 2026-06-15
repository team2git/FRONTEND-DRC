import React from "react";
import { motion } from "framer-motion";
import { Info, Target, Users, Layout } from "lucide-react";
import RichTextDisplay from "@/components/common/RichTextDisplay";

type AboutItem = { title: string; description: string; iconKey?: string; disabled?: boolean };

const defaultAboutItems: AboutItem[] = [
    {
        iconKey: "target",
        title: "Mission",
        description: "To build resilient communities through advanced data management and strategic risk mitigation.",
    },
    {
        iconKey: "users",
        title: "Community First",
        description: "Centering disaster management around people, ensuring rapid response and inclusive safety measures.",
    },
    {
        iconKey: "layout",
        title: "Smart Integration",
        description: "Seamlessly connecting various disaster management modules for a unified visibility and control.",
    },
];

const iconFor = (iconKey?: string) => {
    switch ((iconKey || "").toLowerCase()) {
        case "users":
            return <Users className="w-8 h-8 text-brand-600" />;
        case "layout":
            return <Layout className="w-8 h-8 text-brand-600" />;
        case "target":
        default:
            return <Target className="w-8 h-8 text-brand-600" />;
    }
};

const About: React.FC<{ badge?: string; title?: string; description?: string; items?: AboutItem[]; image?: string }> = ({
    badge,
    title,
    description,
    items,
    image
}) => {
    const resolvedItems = Array.isArray(items)
        ? items.filter((item) => item?.disabled !== true)
        : defaultAboutItems;
    const aboutImageSrc = image || "/assets/images/disas.png";
    return (
        <section id="about" className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 font-semibold text-sm border border-brand-100 dark:bg-brand-900/40 dark:text-brand-400 dark:border-brand-800">
                            <Info className="w-4 h-4" />
                            <span>{badge || "About IDRMIS"}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                          {title ? (
                            title
                          ) : (
                            <>
                              Welcome to Addis Ababa City{" "}
                              <span className="text-brand-600">Disaster Management System</span> Solutions
                            </>
                          )}
                        </h2>
                        <RichTextDisplay
                          html={description}
                          fallback="Our platform provides a comprehensive ecosystem for managing disaster risks, ensuring that organizations can respond faster, plan smarter, and save lives through data-driven decisions."
                          className="text-lg text-slate-600 leading-relaxed max-w-xl [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                            {resolvedItems.map((item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ x: 10 }}
                                    className="flex items-start gap-5 p-6 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300"
                                >
                                    <div className="flex-shrink-0 p-3 rounded-xl bg-brand-50">
                                        {iconFor(item.iconKey)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-xl mb-1">{item.title}</h3>
                                        <RichTextDisplay
                                          html={item.description}
                                          className="text-slate-500 text-sm leading-relaxed [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Graphic */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="flex-1 relative perspective-1000 hidden lg:block"
                    >
                        <div className="relative z-10 rounded-3xl overflow-hidden shadow-[0_22px_70px_-15px_rgba(79,70,229,0.3)] transform hover:rotate-3 transition-transform duration-500">
                            <img
                                src={aboutImageSrc}
                                alt="IDRMIS dashboard"
                                className="w-full h-[600px] object-cover object-top bg-white"
                            />
                            <div className="absolute inset-0 bg-brand-600/10 mix-blend-overlay"></div>
                        </div>
                        {/* Soft Neumorphism accents */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-400/20 blur-3xl rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-600/20 blur-3xl rounded-full" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
