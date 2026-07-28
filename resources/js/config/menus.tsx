import type { SidebarMenuItem } from "../components/ui/Sidebar";
import { ProfilIcon, UsersIcon, SettingsIcon, ShieldIcon } from "../components/ui/icons";

interface MenuDef {
  label: string;
  href: string;
  permissions?: string[];   // user needs ANY of these
  roles?: string[];         // user needs ANY of these
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

/**
 * All possible menus. Each entry declares which permissions or roles
 * grant access. Empty permissions = visible to everyone authenticated.
 */
const allMenuDefs: MenuDef[] = [
  {
    label: "Manajemen Pengguna",
    href: "/admin/users",
    permissions: ["user.manage"],
    icon: UsersIcon,
  },
  {
    label: "Kelola Hak Akses",
    href: "/admin/roles",
    permissions: ["role.manage"],
    icon: ShieldIcon,
  },
  {
    label: "Pengaturan",
    href: "/admin/settings",
    permissions: ["setting.manage"],
    icon: SettingsIcon,
  },
  {
    label: "Profil Saya",
    href: "/profil",
    icon: ProfilIcon,
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
      icon,
    }));
}
