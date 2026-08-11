import { describe, it, expect } from "vitest";
import {
    roleLabel,
    roleBadgeClass,
    initials,
    avatarColor,
    formatDate,
    formatTanggalLengkap,
} from "./userDisplay";

describe("roleLabel", () => {
    it("maps known backend roles to Indonesian labels", () => {
        expect(roleLabel("admin")).toBe("Admin");
        expect(roleLabel("kepala_bidang")).toBe("Kepala Bidang");
        expect(roleLabel("kepala_tim")).toBe("Team Lead");
        expect(roleLabel("staf")).toBe("Pegawai");
    });

    it("returns the raw name for unknown roles", () => {
        expect(roleLabel("superhero")).toBe("superhero");
    });
});

describe("roleBadgeClass", () => {
    it("returns a distinct class per known role", () => {
        expect(roleBadgeClass("admin")).toContain("#7E22CE");
        expect(roleBadgeClass("kepala_bidang")).toContain("#256EEF");
    });

    it("falls back to the neutral badge for unknown roles", () => {
        expect(roleBadgeClass("unknown")).toBe("bg-[#F1F5F9] text-[#475569]");
    });
});

describe("initials", () => {
    it("takes first + last initial for multi-word names", () => {
        expect(initials("Andi Pratama")).toBe("AP");
        expect(initials("Dewi Ayu Anggraini")).toBe("DA");
    });

    it("takes the first two letters for a single word", () => {
        expect(initials("Eko")).toBe("EK");
    });

    it("returns ? for an empty name", () => {
        expect(initials("   ")).toBe("?");
    });
});

describe("avatarColor", () => {
    it("is deterministic for the same name", () => {
        expect(avatarColor("Andi")).toBe(avatarColor("Andi"));
    });

    it("always returns a class from the palette", () => {
        expect(avatarColor("Whatever Name")).toMatch(/^bg-\[#[0-9A-F]{6}\]$/i);
    });
});

describe("formatDate", () => {
    it("returns '-' for null or invalid input", () => {
        expect(formatDate(null)).toBe("-");
        expect(formatDate("not-a-date")).toBe("-");
    });

    it("formats a valid ISO date", () => {
        // id-ID short month, e.g. "15 Jan 2024" (exact spacing/casing may vary by ICU).
        const out = formatDate("2024-01-15T00:00:00Z");
        expect(out).toMatch(/2024/);
        expect(out).not.toBe("-");
    });
});

describe("formatTanggalLengkap", () => {
    it("returns '-' for null", () => {
        expect(formatTanggalLengkap(null)).toBe("-");
    });

    it("formats a plain date with a long Indonesian month", () => {
        expect(formatTanggalLengkap("2026-07-27")).toBe("27 Juli 2026");
    });
});
