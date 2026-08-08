import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  AlertIcon,
  BoxCubeIcon,
  BoxIconLine,
  CheckCircleIcon,
  ChevronDownIcon,
  DocsIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  PencilIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SidebarWidget from "./SidebarWidget";

// ─── Inline Map Icons (no map SVG exists in the icons folder) ─────────────────
const MapNavIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const RiskMapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const GISIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
type SubItem = {
  name: string;
  path: string;
  icon?: React.ReactNode;
  pro?: boolean;
  new?: boolean;
  permission?: string;
  target?: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
  permission?: string;
  superAdminOnly?: boolean;
  target?: string;
};

// ─── Navigation Items ─────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
    permission: "dashboard_view",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Woreda Profile",
    path: "/woreda-profile",
    permission: "woredaprofile_view",
  },
  {
    icon: <DocsIcon />,
    name: "Site Survey",
    subItems: [
      {
        name: "Offline Site Survey",
        path: "/site-survey",
        permission: "sitesurvey_view|site_view",
      },
      {
        name: "Survey Templates",
        path: "/survey-library",
        permission: "template_view",
      }
    ]
  },
  {
    icon: <MapNavIcon />,
    name: "Maps",
    subItems: [
      
      {
        name: "GIS Map",
        path: "/woreda-profile/map",
        icon: <GISIcon />,
        permission: "woredaprofile_view",
        target: "_blank",
      },
      {
        name: "General Risk Map",
        path: "/woreda-profile/general-map",
        icon: <RiskMapIcon />,
        permission: "woredaprofile_view",
        target: "_blank",
      }
    ],
  },
  {
    icon: <ListIcon />,
    name: "Portal ",
    subItems: [
      {
        name: "Alert Subscriptions",
        path: "/admin/alert-subscriptions",
        icon: <MailIcon />,
        permission: "alertsubscription_view",
      },
      {
        name: "Emergency Contacts",
        path: "/admin/emergency-contacts",
        icon: <ListIcon />,
        permission: "emergencycontact_view",
      },
      {
        name: "Incident Reports",
        path: "/admin/incident-reports",
        icon: <AlertIcon />,
        permission: "incidentreport_view",
      },
      {
        name: "Concern Reports",
        path: "/admin/concern-reports",
        icon: <DocsIcon />,
        permission: "incidentreport_view",
      },
      {
        name: "Inspection Requests",
        path: "/inspection",
        icon: <CheckCircleIcon />,
      },
    ],
  },
];

// ─── Admin Items ──────────────────────────────────────────────────────────────
const adminItems: NavItem[] = [
  {
    icon: <FolderIcon />,
    name: "Portal Site Management",
    subItems: [
      {
        name: "Site Settings",
        path: "/admin/site-settings",
        icon: <DocsIcon />,
        permission: "portalcontent_view",
      },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Structure",
    subItems: [
      {
        name: "Organizations",
        path: "/admin/organizations",
        icon: <BoxCubeIcon />,
        permission: "organization_view",
      },
      {
        name: "Sectors",
        path: "/admin/sectors",
        icon: <BoxIconLine />,
        permission: "sector_view",
      },
      {
        name: "Departments",
        path: "/admin/departments",
        icon: <FolderIcon />,
        permission: "department_view",
      },
      {
        name: "Teams",
        path: "/admin/teams",
        icon: <GroupIcon />,
        permission: "team_view",
      },
      {
        name: "Graph",
        path: "/admin/structure-graph",
        icon: <GridIcon />,
        permission: "organization_view",
      },
      {
        name: "Locations",
        path: "/admin/locations",
        icon: <GISIcon />,
        permission: "organization_view",
      },
    ],
  },
  {
    icon: <LockIcon />,
    name: "Auth",
    subItems: [
      {
        name: "Permissions",
        path: "/admin/permissions",
        icon: <LockIcon />,
        permission: "permission_view",
      },
      {
        name: "Roles",
        path: "/admin/roles",
        icon: <CheckCircleIcon />,
        permission: "role_view",
      },
      {
        name: "Users",
        path: "/admin/users",
        icon: <UserIcon />,
        permission: "user_view",
      },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Audit",
    subItems: [
      {
        name: "Audit Logs",
        path: "/admin/audit-logs",
        icon: <ListIcon />,
        permission: "audit_log_view",
      },
      {
        name: "Admin Logs",
        path: "/admin/admin-logs",
        icon: <LockIcon />,
        permission: "adminlog_view",
      },
      {
        name: "Email Logs",
        path: "/admin/email-logs",
        icon: <MailIcon />,
        permission: "audit_log_view",
      },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Template Engine",
    subItems: [
      {
        name: "Form Builder",
        path: "/admin/form-builder",
        icon: <PencilIcon />,
        permission: "template_create",
      },
      {
        name: "Template Library",
        path: "/admin/template-library",
        icon: <GroupIcon />,
        permission: "template_create",
      },
      
      {
        name: "Profile Mapping",
        path: "/admin/profile-mapping",
        icon: <GroupIcon />,
        permission: "profilemapping_view",
      },
      {
        name: "All Responses",
        path: "/admin/responses/all",
        icon: <FolderIcon />,
        permission: "formresponse_view",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "admin";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const checkPermission = (permission?: string) => {
    if (user?.roles?.some(r => ['superadmin', 'super admin', 'super_admin'].includes(r.name.toLowerCase()))) {
      return true;
    }
    if (!permission) return true;
    const userPerms = user?.permissions?.map((p: any) => (typeof p === 'string' ? p : p?.name || '').toLowerCase()) || [];
    if (permission.includes('|')) {
      const perms = permission.split('|').map(p => p.trim().toLowerCase());
      return perms.some(p => userPerms.includes(p));
    }
    return userPerms.includes(permission.toLowerCase());
  };

  const filterItems = (items: NavItem[]) => {
    const isSuperAdmin = user?.roles?.some(r =>
      ['superadmin', 'super admin', 'super_admin'].includes(r.name.toLowerCase())
    );

    return items.map(item => {
      if (item.superAdminOnly && !isSuperAdmin) return null;

      if (item.subItems) {
        const filteredSub = item.subItems.filter(sub => checkPermission(sub.permission));
        if (filteredSub.length > 0) return { ...item, subItems: filteredSub };
        return null;
      }

      return checkPermission(item.permission) ? item : null;
    }).filter(Boolean) as NavItem[];
  };

  const isAdminUser = Boolean(
    user?.roles?.some(r => {
      const roleName = (r.name || '').toLowerCase();
      return (
        roleName.includes('superadmin') ||
        roleName.includes('super admin') ||
        roleName.includes('super_admin') ||
        roleName.includes('branch admin') ||
        roleName.includes('branch_admin') ||
        roleName.includes('branchadmin') ||
        roleName === 'admin'
      );
    }) ||
    ['super_admin', 'superadmin', 'branch_admin', 'admin'].includes(((user as any)?.accessLevel || '').toLowerCase())
  );

  const filteredNavItems = filterItems(navItems);
  const filteredAdminItems = isAdminUser ? filterItems(adminItems) : [];
  const hasAdminAccess = isAdminUser && filteredAdminItems.length > 0;

  useEffect(() => {
    let submenuMatched = false;
    ["main", "admin"].forEach((menuType) => {
      const items = menuType === "main" ? filteredNavItems : filteredAdminItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "admin", index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "admin") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "admin") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-arrow-active"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                target={nav.target}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      target={subItem.target}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.icon && (
                        <span className="[&>svg]:w-5 [&>svg]:h-5">{subItem.icon}</span>
                      )}
                      <span>{subItem.name}</span>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-brand-700/70 shadow-[0_24px_80px_rgba(8,29,60,0.35)] 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex items-center gap-3 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/dashboard" className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm shadow-lg shadow-black/15">
                <img src="/images/logo/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-[0.16em] text-white">PDRM</h3>
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-200">Fire & DRM</p>
              </div>
            </>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm shadow-lg shadow-black/15">
              <img src="/images/logo/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-brand-200 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>

            <div>
              {hasAdminAccess && (
                <>
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-brand-200 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      "Admin"
                    ) : (
                      <HorizontaLDots />
                    )}
                  </h2>
                  {renderMenuItems(filteredAdminItems, "admin")}
                </>
              )}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
