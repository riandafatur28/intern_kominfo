/**
 * Display helpers for the User Management module.
 * Maps backend role names to friendly labels/badges and builds avatars.
 */

/** Friendly Indonesian label for a backend role name. */
export function roleLabel(role: string): string {
    switch (role) {
        case "admin":
            return "Admin";
        case "kepala_bidang":
            return "Kepala Bidang";
        case "kepala_tim":
            return "Team Lead";
        case "staf":
            return "Pegawai";
        default:
            return role;
    }
}

/** Tailwind classes for a role badge. */
export function roleBadgeClass(role: string): string {
    switch (role) {
        case "admin":
            return "bg-[#F3E8FF] text-[#7E22CE]";
        case "kepala_bidang":
            return "bg-[#DBEAFE] text-[#256EEF]";
        case "kepala_tim":
            return "bg-[#DCFCE7] text-[#15803D]";
        case "staf":
            return "bg-[#F1F5F9] text-[#475569]";
        default:
            return "bg-[#F1F5F9] text-[#475569]";
    }
}

/** Two-letter initials from a full name. */
export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
    "bg-[#256EEF]",
    "bg-[#15803D]",
    "bg-[#DB2777]",
    "bg-[#EA580C]",
    "bg-[#7E22CE]",
    "bg-[#0891B2]",
    "bg-[#CA8A04]",
    "bg-[#DC2626]",
];

/** Deterministic avatar background color based on the name. */
export function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Format an ISO date string to e.g. "10 Jan 2024". */
export function formatDate(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/** Format an ISO date string to e.g. "27 Juli 2026" (long Indonesian month, tz-safe). */
export function formatTanggalLengkap(iso: string | null): string {
    if (!iso) return "-";
    const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return formatDate(iso);
    const [, y, mo, d] = m;
    const BULAN = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return `${Number(d)} ${BULAN[Number(mo) - 1]} ${y}`;
}

/** Generate a reasonably strong random password. */
export function generatePassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    const cryptoObj = window.crypto;
    const values = new Uint32Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
        out += chars[values[i] % chars.length];
    }
    return out;
}
