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
    { label: "Feedback", href: "/feedback" },
    { label: "Contact Us", href: "/#contact" },
];

const Header: React.FC<{
    branding?: { portalName?: string; logoUrl?: string };
    header?: { navLinks?: NavLink[]; ctaLabel?: string; ctaHref?: string };
}> = ({ branding, header }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = useMemo(() => {
        if (Array.isArray(header?.navLinks)) {
            return header.navLinks.filter((link) => link?.disabled !== true);
        }
        return defaultNavLinks;
    }, [header?.navLinks]);

    const ctaLabel = header?.ctaLabel || "My Portal";
    const ctaHref = header?.ctaHref || "/login";
    const portalName = branding?.portalName || "PDRM";
    const logoUrl = resolvePortalAssetUrl(branding?.logoUrl) || "/images/logo/logo.png";

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg py-3"
                : "bg-transparent py-5"
                }`}
        >
            <div className="container mx-auto px-4 md:px-6">
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-sm border border-slate-100 dark:border-slate-700">
                            <img
                                src={logoUrl}
                                alt="PDRM Logo"
                                className="w-8 h-8 object-contain"
                            />
                        </div>
                        <span className={`text-2xl font-black tracking-tight ${isScrolled ? "text-slate-900 dark:text-white" : "text-slate-900 dark:text-white md:text-white"
                            }`}>
                            {portalName}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className={`text-sm font-medium relative group transition-colors ${isScrolled ? "text-slate-600 hover:text-brand-600" : "text-white/90 hover:text-accent-200"
                                    }`}
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-500 to-accent-400 transition-all duration-300 group-hover:w-full"></span>
                            </a>
                        ))}
                            <Link
                                to={ctaHref}
                                className="px-6 py-2.5 bg-gradient-to-r from-accent-600 via-accent-600 to-accent-500 hover:from-accent-500 hover:via-accent-500 hover:to-accent-400 text-white text-sm font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-accent-500/25 flex items-center gap-2"
                            >
                                {ctaLabel}
                                <LogIn className="w-4 h-4" />
                            </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? "text-slate-900" : "text-white"
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
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-slate-600 dark:text-slate-300 font-medium py-2 px-4 hover:text-brand-600 hover:bg-brand-50/70 dark:hover:text-accent-300 dark:hover:bg-brand-500/15 rounded-lg transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
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

