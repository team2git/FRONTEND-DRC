import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn } from "lucide-react";
import { Link } from "react-router";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";

type NavLink = { label: string; href: string; disabled?: boolean };

const defaultNavLinks: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/#about" },
    { label: "Services", href: "/portal/services" },
    { label: "News", href: "/news" },
    { label: "Flood", href: "/flood-dashboard" },
    { label: "Feedback", href: "/feedback" },
    { label: "Contact Us", href: "/#contact" },
];

const Header: React.FC<{
    branding?: { portalName?: string; logoUrl?: string };
    header?: { navLinks?: NavLink[]; ctaLabel?: string; ctaHref?: string };
    variant?: "dark" | "light";
    solidBackground?: boolean;
}> = ({ branding, header, variant = "dark", solidBackground = false }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isLightMode = variant === "light" || solidBackground || isScrolled;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = useMemo(() => {
        let rawLinks: NavLink[] = defaultNavLinks;
        if (Array.isArray(header?.navLinks) && header.navLinks.length > 0) {
            rawLinks = header.navLinks.filter((link) => link?.disabled !== true);
        }

        let linksList = [...rawLinks];

        const hasNews = linksList.some(
            (link) => link.href === "/news" || link.label.toLowerCase() === "news"
        );

        if (!hasNews) {
            const feedbackIndex = linksList.findIndex(
                (link) => link.href === "/feedback" || link.label.toLowerCase() === "feedback"
            );
            const newsLink: NavLink = { label: "News", href: "/news" };

            if (feedbackIndex !== -1) {
                linksList.splice(feedbackIndex + 1, 0, newsLink);
            } else {
                linksList.push(newsLink);
            }
        }

        const hasFlood = linksList.some(
            (link) => link.label.toLowerCase() === "flood" || link.href.includes("category=Flood") || link.href.includes("category=Emergency")
        );

        if (!hasFlood) {
            const newsIndex = linksList.findIndex(
                (link) => link.href === "/news" || link.label.toLowerCase() === "news"
            );
            const floodLink: NavLink = { label: "Flood", href: "/flood-dashboard" };

            if (newsIndex !== -1) {
                linksList.splice(newsIndex + 1, 0, floodLink);
            } else {
                linksList.push(floodLink);
            }
        }

        return linksList;
    }, [header?.navLinks]);

    const ctaLabel = header?.ctaLabel || "My Portal";
    const ctaHref = header?.ctaHref || "/login";
    const portalName = branding?.portalName || "PDRM";
    const logoUrl = resolvePortalAssetUrl(branding?.logoUrl) || "/images/logo/logo.png";

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isLightMode
                    ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border-b border-slate-200/80 dark:border-slate-800 py-3.5"
                    : "bg-transparent py-5"
            }`}
        >
            <div className="container mx-auto px-4 md:px-6">
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-sm border border-slate-200 dark:border-slate-700">
                            <img
                                src={logoUrl}
                                alt="PDRM Logo"
                                className="w-8 h-8 object-contain"
                            />
                        </div>
                        <span className={`text-2xl font-black tracking-tight ${
                            isLightMode ? "text-slate-900 dark:text-white" : "text-slate-900 dark:text-white md:text-white"
                        }`}>
                            {portalName}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => {
                            const isInternalSpaRoute = link.href.startsWith("/") && !link.href.includes("#");
                            const linkClasses = `text-sm font-bold relative group transition-colors ${
                                isLightMode ? "text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400" : "text-white/90 hover:text-accent-200"
                            }`;

                            return isInternalSpaRoute ? (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    className={linkClasses}
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                                </Link>
                            ) : (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className={linkClasses}
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                                </a>
                            );
                        })}
                        <Link
                            to={ctaHref}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2"
                        >
                            {ctaLabel}
                            <LogIn className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${
                            isLightMode ? "text-slate-900 dark:text-white" : "text-white"
                        }`}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </nav>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-slate-800 border-t dark:border-slate-700 overflow-hidden"
                    >
                        <div className="flex flex-col p-4 gap-4">
                            {navLinks.map((link) => {
                                const isInternalSpaRoute = link.href.startsWith("/") && !link.href.includes("#");
                                const mobileClasses = "text-slate-600 dark:text-slate-300 font-medium py-2 px-4 hover:text-brand-600 hover:bg-brand-50/70 dark:hover:text-accent-300 dark:hover:bg-brand-500/15 rounded-lg transition-colors";

                                return isInternalSpaRoute ? (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        className={mobileClasses}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ) : (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        className={mobileClasses}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </a>
                                );
                            })}
                            <Link
                                to={ctaHref}
                                className="mx-4 mt-2 px-6 py-3 bg-gradient-to-r from-accent-600 via-accent-600 to-accent-500 text-white text-center font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {ctaLabel}
                                <LogIn className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;

