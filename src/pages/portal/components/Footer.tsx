import React, { useMemo } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Send,
  ShieldIcon,
  HelpCircle,
} from "lucide-react";
import { resolvePortalAssetUrl } from "@/utils/resolvePortalAssetUrl";
import RichTextDisplay from "@/components/common/RichTextDisplay";

type LinkItem = { label: string; href: string; highlight?: boolean; disabled?: boolean };
type SocialItem = { label: string; href: string; iconKey?: string; disabled?: boolean };
type BadgeItem = { text: string; iconKey?: string; disabled?: boolean };

const defaultQuickLinks: LinkItem[] = [
  { label: "Home", href: "/" },
  { label: "Give Feedback", href: "/feedback", highlight: true },
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/#contact" },
  { label: "My Portal", href: "/login", highlight: true },
  { label: "Privacy Policy", href: "#" },
  { label: "Services", href: "/portal/services" },
];

const defaultBottomLinks: LinkItem[] = [
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

const defaultSocials: SocialItem[] = [
  { label: "Facebook", href: "#", iconKey: "facebook" },
  { label: "Twitter", href: "#", iconKey: "twitter" },
  { label: "LinkedIn", href: "#", iconKey: "linkedin" },
  { label: "Instagram", href: "#", iconKey: "instagram" },
];

const iconForSocial = (iconKey?: string) => {
  switch ((iconKey || "").toLowerCase()) {
    case "twitter":
      return Twitter;
    case "linkedin":
      return Linkedin;
    case "instagram":
      return Instagram;
    case "facebook":
    default:
      return Facebook;
  }
};

const Footer: React.FC<{
  branding?: { portalName?: string; logoUrl?: string };
  contact?: { address?: string; phone?: string; email?: string };
  footer?: {
    headings?: { quickLinks?: string; connect?: string; newsletter?: string };
    blurb?: string;
    newsletter?: { text?: string; placeholder?: string; buttonLabel?: string };
    badges?: BadgeItem[];
    quickLinks?: LinkItem[];
    socials?: SocialItem[];
    bottomLinks?: LinkItem[];
    copyrightText?: string; // supports "{year}"
  };
  showContact?: boolean;
}> = ({ branding, contact, footer, showContact = true }) => {
  const portalName = branding?.portalName || "PDRM";
  const logoUrl = resolvePortalAssetUrl(branding?.logoUrl) || "/images/logo/logo.png";

  const address = contact?.address || "Addis Ababa, Ethiopia";
  const phone = contact?.phone || "+251 911 22 33 44";
  const email = contact?.email || "support@idrms.org";

  const blurb =
    footer?.blurb ||
    "Pioneering disaster management technology for safer and more resilient future. Our platform connects data with decision making.";

  const quickLinks = useMemo(() => {
    if (Array.isArray(footer?.quickLinks)) {
      return footer.quickLinks.filter((link) => link?.disabled !== true);
    }
    return defaultQuickLinks;
  }, [footer?.quickLinks]);

  const socials = useMemo(() => {
    if (Array.isArray(footer?.socials)) {
      return footer.socials.filter((social) => social?.disabled !== true);
    }
    return defaultSocials;
  }, [footer?.socials]);

  const bottomLinks = useMemo(() => {
    if (Array.isArray(footer?.bottomLinks)) {
      return footer.bottomLinks.filter((link) => link?.disabled !== true);
    }
    return defaultBottomLinks;
  }, [footer?.bottomLinks]);

  const footerHeadings = {
    quickLinks: footer?.headings?.quickLinks || "Quick Links",
    connect: footer?.headings?.connect || "Connect With us",
    newsletter: footer?.headings?.newsletter || "Stay Updated",
  };

  const newsletter = {
    text:
      footer?.newsletter?.text ||
      "Subscribe to our newsletter for the latest updates in disaster management technology and insights.",
    placeholder: footer?.newsletter?.placeholder || "Your email address",
    buttonLabel: footer?.newsletter?.buttonLabel || "Submit",
  };

  const badges = useMemo(() => {
    if (Array.isArray(footer?.badges)) {
      return footer.badges.filter((badge) => badge?.disabled !== true);
    }
    return [
      { text: "ISO 27001 Certified Security", iconKey: "shield" },
      { text: "24/7 Premium Support Desk", iconKey: "help" },
    ];
  }, [footer?.badges]);

  const copyrightText = useMemo(() => {
    const year = String(new Date().getFullYear());
    if (footer?.copyrightText) return footer.copyrightText.replace("{year}", year);
    return `© ${year} ${portalName}. All rights reserved by Innovation and Technology Development Bureau.`;
  }, [footer?.copyrightText, portalName]);

  return (
    <footer id="contact" className="bg-slate-950 text-slate-300 pt-24 pb-12 overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer inline-block">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-sm border border-slate-700">
                <img src={logoUrl} alt={`${portalName} Logo`} className="w-8 h-8 object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">{portalName}</span>
            </div>

            <RichTextDisplay
              html={blurb}
              className="text-slate-500 leading-relaxed max-w-xs [&_a]:text-brand-300 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />

            {showContact ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 group">
                  <div className="p-2 rounded-lg bg-brand-500/20 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Location</h4>
                    <p className="text-slate-500 text-sm">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-2 rounded-lg bg-accent-900/40 text-accent-400 group-hover:bg-accent-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Contact</h4>
                    <p className="text-slate-500 text-sm">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="p-2 rounded-lg bg-brand-900/40 text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Email</h4>
                    <p className="text-slate-500 text-sm">{email}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-bold text-white relative inline-block pb-2 border-b-2 border-accent-500">
              {footerHeadings.quickLinks}
            </h3>
            <ul className="grid grid-cols-2 gap-y-4 gap-x-8">
              {quickLinks.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <a
                    href={l.href}
                    className={`hover:text-brand-300 transition-colors flex items-center gap-2 group ${
                      l.highlight ? "font-bold text-accent-400" : ""
                    }`}
                  >
                    <span className="w-1 h-1 bg-accent-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="pt-8">
              <h4 className="text-white font-semibold mb-4">{footerHeadings.connect}</h4>
              <div className="flex gap-4">
                {socials.map((s) => {
                  const Icon = iconForSocial(s.iconKey);
                  return (
                    <a
                      key={`${s.label}-${s.href}`}
                      href={s.href}
                      aria-label={s.label}
                      className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-accent-500 hover:text-white hover:border-accent-500 transition-all transform hover:-translate-y-1"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xl font-bold text-white relative inline-block pb-2 border-b-2 border-accent-500">
              {footerHeadings.newsletter}
            </h3>
            <RichTextDisplay
              html={newsletter.text}
              className="text-slate-500 text-sm leading-relaxed mb-4 [&_a]:text-brand-300 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />

            <form className="relative group">
              <input
                type="email"
                placeholder={newsletter.placeholder}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-4 pr-14 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500 transition-all"
              />
              <button
                aria-label={newsletter.buttonLabel}
                className="absolute right-2 top-2 bottom-2 w-10 bg-accent-500 text-white rounded-lg flex items-center justify-center group-hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="grid grid-cols-1 gap-4 pt-4">
              {badges.map((b, idx) => (
                <div
                  key={`${b.text}-${idx}`}
                  className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {(b.iconKey || "").toLowerCase() === "help" ? (
                    <HelpCircle className="w-5 h-5 text-accent-500" />
                  ) : (
                    <ShieldIcon className="w-5 h-5 text-brand-300" />
                  )}
                  <span className="text-xs text-white">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-600 text-sm">{copyrightText}</p>
          <div className="flex gap-8 text-xs text-slate-600">
            {bottomLinks.map((l) => (
              <a key={`${l.label}-${l.href}`} href={l.href} className="hover:text-brand-300">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-900/10 blur-[120px] rounded-full pointer-events-none" />
    </footer>
  );
};

export default Footer;

