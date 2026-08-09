import type { SidebarMenuItem } from "../components/ui/Sidebar";
import {
  UsersIcon,
  ShieldIcon,
  WfhAbsensiIcon,
  WfhMonitorIcon,
  ChangeMonitorIcon,
  ChangeApprovalIcon,
  ChangeInisiasiIcon,
} from "../components/ui/icons";

interface MenuDef {
  label: string;
  href: string;
  permissions?: string[];   // user needs ANY of these
  roles?: string[];         // user needs ANY of these
  excludeRoles?: string[];  // user with ANY of these roles will NOT see this menu
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  pngIcon?: boolean;        // icon uses embedded PNG → needs CSS filter for active state
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
    label: "Absensi WFH",
    href: "/wfh/absensi",
    permissions: ["wfh.report.create"],
    icon: WfhAbsensiIcon,
    pngIcon: true,
  },
  {
    label: "Monitoring WFH",
    href: "/wfh/monitoring",
    permissions: ["wfh.monitoring.view"],
    excludeRoles: ["staf"],
    icon: WfhMonitorIcon,
    pngIcon: true,
  },
 // Monitoring Perubahan (baris 50-64)
{
  label: "Monitoring Perubahan",
  href: "/change-management/monitoring",
  permissions: ["change.initiation.view"],
  // Sembunyikan dari Staf dan Kepala Tim (Kepala Bidang kini boleh lihat, seperti admin)
  excludeRoles: [
    "staf",
    "kepala_tim",
    "kepala-tim",
    "team_lead",
  ],
  icon: ChangeMonitorIcon,
},

  {
    label: "Persetujuan Perubahan",
    href: "/change-management/persetujuan",
    permissions: ["change.initiation.approve"],
    // Sembunyikan dari Admin / Administrator
    excludeRoles: ["admin", "administrator", "superadmin", "super_admin"],
    icon: ChangeApprovalIcon,
  },
{
  label: "Inisiasi Perubahan",
  href: "/change-management/inisiasi",
  permissions: ["change.initiation.create", "change.initiation.view"],
  // Sembunyikan dari Kepala Tim dan Kepala Bidang
  excludeRoles: ["kepala_tim", "kepala-tim", "team_lead", "kepala_bidang", "kepala-bidang", "kabid"],
  icon: ChangeInisiasiIcon,
},
  {
    label: "Kelola Hak Akses",
    href: "/admin/roles",
    permissions: ["role.manage"],
    icon: ShieldIcon,
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
      // Prioritas 1: Jika role user ada di excludeRoles, sembunyikan menu
      if (def.excludeRoles?.length && def.excludeRoles.some((r) => roles.includes(r))) {
        return false;
      }
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
    .map(({ label, href, icon, pngIcon }) => ({
      label,
      href,
      icon,
      pngIcon,
    }));
}