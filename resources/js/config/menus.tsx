import type { SidebarMenuItem } from "../components/ui/Sidebar";

interface MenuDef {
  label: string;
  href: string;
  permissions?: string[];   // user needs ANY of these
  roles?: string[];         // user needs ANY of these
  icon?: React.ReactNode;
}

const icons = {
  Dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  "Manajemen Inisiasi": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L18 5.5L10 9L2 5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 10.5L10 14L18 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 15L10 18.5L18 15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  "Status & Arsip": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 6V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "Profil Saya": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 18C2.5 13.8579 5.85786 10.5 10 10.5C14.1421 10.5 17.5 13.8579 17.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

/**
 * All possible menus. Each entry declares which permissions or roles
 * grant access. Empty permissions = visible to everyone authenticated.
 */
const allMenuDefs: MenuDef[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: icons.Dashboard,
  },
  {
    label: "Manajemen Inisiasi",
    href: "/inisiasi",
    permissions: [
      "change.initiation.view",
      "change.initiation.create",
      "change.initiation.approve",
    ],
    icon: icons["Manajemen Inisiasi"],
  },
  {
    label: "Status & Arsip",
    href: "/status",
    permissions: ["change.initiation.view"],
    icon: icons["Status & Arsip"],
  },
  {
    label: "Profil Saya",
    href: "/profil",
    icon: icons["Profil Saya"],
  },
];

/**
 * Filter menus based on user's permissions and roles.
 */
export function getFilteredMenus(
  permissions: string[],
  roles: string[]
): SidebarMenuItem[] {
  return allMenuDefs
    .filter((def) => {
      // No permission/role gate → always show
      if (!def.permissions?.length && !def.roles?.length) return true;
      // Check permissions (ANY match)
      if (def.permissions?.length && def.permissions.some((p) => permissions.includes(p)))
        return true;
      // Check roles (ANY match)
      if (def.roles?.length && def.roles.some((r) => roles.includes(r)))
        return true;
      return false;
    })
    .map(({ label, href, icon }) => ({
      label,
      href,
      icon: icon as React.ReactNode,
    }));
}
