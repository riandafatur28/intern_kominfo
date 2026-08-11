import { describe, it, expect } from "vitest";
import type { MonitoringUser, WfhReport, WfhReportActivity } from "../api/wfh";
import { buildMonitoringRows, inisial } from "./wfhMonitoring";

function makeReport(
    id: number,
    name: string,
    status: WfhReport["status"]
): WfhReport {
    return {
        id,
        user_id: id,
        report_date: "2026-08-10",
        status,
        maker_signed_at: null,
        supervisor_signed_at: null,
        reject_reason: null,
        created_at: "2026-08-10T00:00:00.000000Z",
        updated_at: "2026-08-10T00:00:00.000000Z",
        user: { id, name, nip: "1990", position: null, rank: null, signature_path: null },
        supervisor: null,
        activities: [] as WfhReportActivity[],
        activity_count: 0,
    };
}

function makeUser(id: number, name: string, teamId: number | null): MonitoringUser {
    return {
        id,
        name,
        nip: "1990",
        email: "",
        rank: null,
        position: null,
        phone: null,
        is_active: true,
        team_id: teamId,
        team: teamId ? { id: teamId, name: "Tim " + teamId } : null,
    };
}

describe("inisial", () => {
    it("takes the first letter of the first two words", () => {
        expect(inisial("Andi Pratama")).toBe("AP");
        expect(inisial("Dewi Ayu Anggraini")).toBe("DA");
    });

    it("returns a single letter for one word", () => {
        expect(inisial("Eko")).toBe("E");
    });

    it("collapses whitespace and handles empty names", () => {
        expect(inisial("  Budi   Santoso  ")).toBe("BS");
        expect(inisial("")).toBe("?");
        expect(inisial(null)).toBe("?");
    });
});

describe("buildMonitoringRows", () => {
    const reports = [
        makeReport(1, "Andi Pratama", "approved"),
        makeReport(2, "Budi Santoso", "draft"),
    ];
    const missing = [makeUser(3, "Citra Lestari", 1), makeUser(4, "Dewi Ayu", null)];

    it("merges non-draft reports + missing users", () => {
        // draft di sini adalah laporan belum dikirim → tetap tampil sebagai Baris
        const rows = buildMonitoringRows(reports, missing, "", "", "");
        expect(rows).toHaveLength(4);
    });

    it("drops missing users when a status filter is active", () => {
        const rows = buildMonitoringRows(reports, missing, "approved", "", "");
        expect(rows).toHaveLength(2);
        expect(rows.every((r) => "status" in r)).toBe(true);
    });

    it("filters by search across report and missing rows", () => {
        const rows = buildMonitoringRows(reports, missing, "", "", "citra");
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ name: "Citra Lestari" });

        const byReport = buildMonitoringRows(reports, missing, "", "", "andi");
        expect(byReport).toHaveLength(1);
        expect(byReport[0]).toMatchObject({ user: { name: "Andi Pratama" } });
    });

    it("keeps all reports but scopes missing users by team", () => {
        const rows = buildMonitoringRows(reports, missing, "", "1", "");
        expect(rows).toHaveLength(3); // 2 laporan + 1 user tim 1
        expect(rows.some((r) => !("status" in r) && r.team_id === 1)).toBe(true);
    });
});