import { describe, it, expect } from "vitest";
import {
    capFirst,
    fmtWaktu,
    normDate,
    todayDisplay,
    wfhDayNumber,
} from "./wfhDate";

describe("wfhDayNumber", () => {
    it("maps Monday..Sunday to 1..7", () => {
        // 10 Agustus 2026 = Senin, 16 = Minggu, 15 = Sabtu
        expect(wfhDayNumber("2026-08-10")).toBe(1);
        expect(wfhDayNumber("2026-08-11")).toBe(2);
        expect(wfhDayNumber("2026-08-15")).toBe(6);
        expect(wfhDayNumber("2026-08-16")).toBe(7);
    });
});

describe("capFirst", () => {
    it("uppercases the first letter only", () => {
        expect(capFirst("pagi")).toBe("Pagi");
        expect(capFirst("Pagi")).toBe("Pagi");
        expect(capFirst("sore")).toBe("Sore");
        expect(capFirst("")).toBe("");
    });
});

describe("fmtWaktu", () => {
    it("returns - when undefined", () => {
        expect(fmtWaktu(undefined)).toBe("-");
    });

    it("falls back to trimming invalid input", () => {
        expect(fmtWaktu("08:30:00")).toBe("08.30");
        expect(fmtWaktu("zzz")).toBe("zzz");
    });

    it("formats a valid ISO datetime as HH.MM", () => {
        expect(fmtWaktu("2026-08-10T01:05:00.000000Z")).toMatch(/^\d{2}\.\d{2}$/);
    });
});

describe("normDate", () => {
    it("converts ISO UTC to the WIB calendar date", () => {
        // 2026-07-30 17:00 UTC = 2026-07-31 00:00 WIB
        expect(normDate("2026-07-30T17:00:00.000000Z")).toBe("2026-07-31");
    });

    it("leaves a plain date untouched", () => {
        expect(normDate("2026-08-10")).toBe("2026-08-10");
    });
});

describe("todayDisplay", () => {
    it("formats a date in Indonesian long form", () => {
        expect(todayDisplay("2026-08-10")).toMatch(/^Senin,\s*10 Agustus 2026$/);
    });
});