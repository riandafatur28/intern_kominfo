import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, fetchMe, logout, forgotPassword, verifyOtp, resetPassword, changePassword } from "./auth";
import type { UserPayload } from "./auth";

// auth.ts imports `client` (default export) from "./client" — mock full module.
const clientMocks = vi.hoisted(() => ({
    post: vi.fn(),
    get: vi.fn(),
}));

vi.mock("./client", () => ({
    default: { post: clientMocks.post, get: clientMocks.get },
}));

const baseUser: UserPayload = {
    id: 1,
    name: "Andi Pratama",
    nip: "199001012024001",
    email: "andi@example.com",
    rank: null,
    position: null,
    phone: null,
    signature_path: null,
    signature_url: null,
    must_change_password: false,
    is_active: true,
    roles: ["staf"],
    permissions: [],
};

beforeEach(() => {
    clientMocks.post.mockReset();
    clientMocks.get.mockReset();
});

describe("login", () => {
    it("posts credentials and returns token + user", async () => {
        clientMocks.post.mockResolvedValue({
            data: { success: true, message: "ok", data: { token: "tok-123", user: baseUser } },
        });

        const result = await login("andi@example.com", "secret123");

        expect(clientMocks.post).toHaveBeenCalledWith("/auth/login", {
            email: "andi@example.com",
            password: "secret123",
        });
        expect(result).toEqual({ token: "tok-123", user: baseUser });
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("Network Error"));

        await expect(login("andi@example.com", "secret123")).rejects.toThrow("Network Error");
    });
});

describe("fetchMe", () => {
    it("gets /auth/me and returns the user", async () => {
        clientMocks.get.mockResolvedValue({ data: { success: true, data: baseUser } });

        const result = await fetchMe();

        expect(clientMocks.get).toHaveBeenCalledWith("/auth/me");
        expect(result).toEqual(baseUser);
    });

    it("rethrows a rejected request", async () => {
        clientMocks.get.mockRejectedValue(new Error("Unauthenticated."));

        await expect(fetchMe()).rejects.toThrow("Unauthenticated.");
    });
});

describe("logout", () => {
    it("posts /auth/logout", async () => {
        clientMocks.post.mockResolvedValue({ data: { success: true } });

        await expect(logout()).resolves.toBeUndefined();

        expect(clientMocks.post).toHaveBeenCalledWith("/auth/logout");
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("Network Error"));

        await expect(logout()).rejects.toThrow("Network Error");
    });
});

describe("forgotPassword", () => {
    it("posts the email and returns the response message", async () => {
        clientMocks.post.mockResolvedValue({
            data: { success: true, message: "Email reset terkirim." },
        });

        const result = await forgotPassword("andi@example.com");

        expect(clientMocks.post).toHaveBeenCalledWith("/auth/forgot-password", {
            email: "andi@example.com",
        });
        expect(result).toBe("Email reset terkirim.");
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("Email tidak ditemukan."));

        await expect(forgotPassword("nobody@example.com")).rejects.toThrow("Email tidak ditemukan.");
    });
});

describe("verifyOtp", () => {
    it("posts email + code and returns the reset token", async () => {
        clientMocks.post.mockResolvedValue({
            data: { success: true, data: { reset_token: "rt-456" } },
        });

        const result = await verifyOtp("andi@example.com", "123456");

        expect(clientMocks.post).toHaveBeenCalledWith("/auth/verify-otp", {
            email: "andi@example.com",
            code: "123456",
        });
        expect(result).toBe("rt-456");
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("Kode OTP salah."));

        await expect(verifyOtp("andi@example.com", "000000")).rejects.toThrow("Kode OTP salah.");
    });
});

describe("resetPassword", () => {
    it("posts reset token + passwords and returns the response message", async () => {
        clientMocks.post.mockResolvedValue({
            data: { success: true, message: "Password berhasil direset." },
        });

        const result = await resetPassword("rt-456", "newpass123", "newpass123");

        expect(clientMocks.post).toHaveBeenCalledWith("/auth/reset-password", {
            reset_token: "rt-456",
            new_password: "newpass123",
            new_password_confirmation: "newpass123",
        });
        expect(result).toBe("Password berhasil direset.");
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("Token reset kedaluwarsa."));

        await expect(resetPassword("rt-expired", "newpass123", "newpass123")).rejects.toThrow(
            "Token reset kedaluwarsa."
        );
    });
});

describe("changePassword", () => {
    it("posts current + new passwords with snake_case fields", async () => {
        clientMocks.post.mockResolvedValue({ data: { success: true, message: "ok" } });

        await expect(changePassword("oldpass", "newpass123", "newpass123")).resolves.toBeUndefined();

        expect(clientMocks.post).toHaveBeenCalledWith("/auth/change-password", {
            current_password: "oldpass",
            new_password: "newpass123",
            new_password_confirmation: "newpass123",
        });
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("Password saat ini salah."));

        await expect(changePassword("wrong", "newpass123", "newpass123")).rejects.toThrow(
            "Password saat ini salah."
        );
    });
});