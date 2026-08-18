import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProfile, updateProfile, uploadSignature, deleteSignature } from "./profile";
import type { UserPayload } from "./auth";

const clientMocks = vi.hoisted(() => ({
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
}));

vi.mock("./client", () => ({ default: clientMocks }));

const profileUser: UserPayload = {
    id: 1,
    name: "Andi Pratama",
    nip: "199001012024001",
    email: "andi@example.com",
    rank: "Penata",
    position: "Analis",
    phone: "081234567890",
    signature_path: null,
    signature_url: null,
    must_change_password: false,
    is_active: true,
    roles: ["staf"],
    permissions: [],
};

const signatureData = {
    signature_path: "/storage/signatures/andi.png",
    signature_url: "/storage/signatures/andi.png",
};

beforeEach(() => {
    Object.values(clientMocks).forEach((fn) => fn.mockReset());
});

describe("fetchProfile", () => {
    it("gets /profile and returns the user", async () => {
        clientMocks.get.mockResolvedValue({ data: { success: true, data: profileUser } });

        const result = await fetchProfile();

        expect(clientMocks.get).toHaveBeenCalledWith("/profile");
        expect(result).toEqual(profileUser);
    });

    it("rethrows a rejected request", async () => {
        clientMocks.get.mockRejectedValue(new Error("Unauthenticated."));

        await expect(fetchProfile()).rejects.toThrow("Unauthenticated.");
    });
});

describe("updateProfile", () => {
    it("puts the payload and returns the updated user", async () => {
        const payload = { phone: "081111111111", position: "Analis Madya" };
        clientMocks.put.mockResolvedValue({
            data: { success: true, data: { ...profileUser, ...payload } },
        });

        const result = await updateProfile(payload);

        expect(clientMocks.put).toHaveBeenCalledWith("/profile", payload);
        expect(result).toEqual({ ...profileUser, ...payload });
    });

    it("rethrows a rejected request", async () => {
        clientMocks.put.mockRejectedValue(new Error("Validasi gagal."));

        await expect(updateProfile({ phone: "invalid" })).rejects.toThrow("Validasi gagal.");
    });
});

describe("uploadSignature", () => {
    it("posts a FormData with the 'signature' field and the upload config", async () => {
        const file = new File(["png-bytes"], "ttd.png", { type: "image/png" });
        clientMocks.post.mockResolvedValue({
            data: { success: true, message: "ok", data: signatureData },
        });

        const result = await uploadSignature(file);

        expect(clientMocks.post).toHaveBeenCalledTimes(1);
        const [url, body, config] = clientMocks.post.mock.calls[0];
        expect(url).toBe("/profile/signature");
        expect(body).toBeInstanceOf(FormData);
        expect(body.get("signature")).toBe(file);
        expect(config).toEqual({
            headers: { "Content-Type": "multipart/form-data" },
        });
        expect(result).toEqual(signatureData);
    });

    it("rethrows a rejected request", async () => {
        clientMocks.post.mockRejectedValue(new Error("File terlalu besar."));

        await expect(uploadSignature(new File(["x"], "ttd.png"))).rejects.toThrow(
            "File terlalu besar."
        );
    });
});

describe("deleteSignature", () => {
    it("deletes /profile/signature and returns the cleared signature data", async () => {
        clientMocks.delete.mockResolvedValue({
            data: { success: true, message: "ok", data: { signature_path: null, signature_url: null } },
        });

        const result = await deleteSignature();

        expect(clientMocks.delete).toHaveBeenCalledWith("/profile/signature");
        expect(result).toEqual({ signature_path: null, signature_url: null });
    });

    it("rethrows a rejected request", async () => {
        clientMocks.delete.mockRejectedValue(new Error("Terjadi kesalahan."));

        await expect(deleteSignature()).rejects.toThrow("Terjadi kesalahan.");
    });
});