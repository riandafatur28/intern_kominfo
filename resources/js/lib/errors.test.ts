import { describe, it, expect } from "vitest";
import { extractErrorMessage } from "./errors";

const FALLBACK = "Terjadi kesalahan.";

describe("extractErrorMessage", () => {
    it("returns the first message of the first validation error key", () => {
        const e = {
            response: {
                data: {
                    errors: {
                        email: ["Email wajib diisi."],
                        password: ["Password minimal 8 karakter."],
                    },
                },
            },
        };
        expect(extractErrorMessage(e, FALLBACK)).toBe("Email wajib diisi.");
    });

    it("returns the response message when there are no errors", () => {
        const e = { response: { data: { message: "Kredensial salah." } } };
        expect(extractErrorMessage(e, FALLBACK)).toBe("Kredensial salah.");
    });

    it("ignores an errors key with empty value and falls back to message", () => {
        const e = {
            response: {
                data: {
                    errors: { email: [] },
                    message: "Validasi gagal.",
                },
            },
        };
        expect(extractErrorMessage(e, FALLBACK)).toBe("Validasi gagal.");
    });

    it("ignores an empty errors object and falls back to message", () => {
        const e = {
            response: {
                data: {
                    errors: {},
                    message: "Validasi gagal.",
                },
            },
        };
        expect(extractErrorMessage(e, FALLBACK)).toBe("Validasi gagal.");
    });

    it("falls back when errors and message are absent", () => {
        const e = { response: { data: {} } };
        expect(extractErrorMessage(e, FALLBACK)).toBe(FALLBACK);
    });

    it("falls back for a plain Error (network failure)", () => {
        expect(extractErrorMessage(new Error("Network Error"), FALLBACK)).toBe(FALLBACK);
    });

    it("falls back for non-error values", () => {
        expect(extractErrorMessage(null, FALLBACK)).toBe(FALLBACK);
        expect(extractErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
        expect(extractErrorMessage("oops", FALLBACK)).toBe(FALLBACK);
        expect(extractErrorMessage(42, FALLBACK)).toBe(FALLBACK);
    });

    it("falls back when response has no data", () => {
        expect(extractErrorMessage({ response: {} }, FALLBACK)).toBe(FALLBACK);
    });
});