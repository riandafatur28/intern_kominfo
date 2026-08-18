import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthContext, AuthProvider } from "./AuthContext";
import type { UserPayload } from "../api/auth";

const authMocks = vi.hoisted(() => ({
    login: vi.fn(),
    fetchMe: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    verifyOtp: vi.fn(),
    resetPassword: vi.fn(),
}));

vi.mock("../api/auth", () => authMocks);
// syncSwAuth menyentuh navigator.serviceWorker — iso-kan supaya test deterministik.
vi.mock("../utils/swAuth", () => ({ syncSwAuth: vi.fn() }));

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
    permissions: ["wfh.view"],
};

const adminUser: UserPayload = {
    ...baseUser,
    roles: ["admin"],
    permissions: ["users.manage", "wfh.view"],
};

let replaceMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
    replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
        writable: true,
        value: { replace: replaceMock, href: "http://localhost/" },
    });
});

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    replaceMock.mockReset();
    (["login", "fetchMe", "logout", "changePassword"] as const).forEach((k) =>
        authMocks[k].mockReset()
    );
});

function renderAuth() {
    return renderHook(() => useContext(AuthContext), { wrapper: AuthProvider });
}

describe("login", () => {
    it("stores token, permissions, roles and sets user on success", async () => {
        authMocks.login.mockResolvedValue({ token: "tok-123", user: baseUser });

        const { result } = renderAuth();
        await act(async () => {
            await result.current?.login("andi@example.com", "secret123");
        });

        expect(authMocks.login).toHaveBeenCalledWith("andi@example.com", "secret123");
        expect(localStorage.getItem("token")).toBe("tok-123");
        expect(JSON.parse(localStorage.getItem("permissions")!)).toEqual(["wfh.view"]);
        expect(JSON.parse(localStorage.getItem("roles")!)).toEqual(["staf"]);
        expect(localStorage.getItem("must_change_password")).toBeNull();
        expect(result.current?.user).toEqual(baseUser);
        expect(result.current?.loading).toBe(false);
        expect(result.current?.error).toBeNull();
    });

    it("sets needsPasswordChange + storage flag when user must change password", async () => {
        authMocks.login.mockResolvedValue({
            token: "tok-123",
            user: { ...baseUser, must_change_password: true },
        });

        const { result } = renderAuth();
        await act(async () => {
            await result.current?.login("andi@example.com", "secret123");
        });

        expect(result.current?.needsPasswordChange).toBe(true);
        expect(localStorage.getItem("must_change_password")).toBe("true");
    });

    it("sets error message and rethrows on failure", async () => {
        const err = Object.assign(
            new Error("Request failed with status code 422"),
            { response: { data: { message: "Kredensial salah." } } }
        );
        authMocks.login.mockRejectedValue(err);

        const { result } = renderAuth();
        await act(async () => {
            await expect(result.current!.login("andi@example.com", "wrong")).rejects.toBe(err);
        });

        expect(result.current?.error).toBe("Kredensial salah.");
        expect(localStorage.getItem("token")).toBeNull();
        expect(result.current?.loading).toBe(false);
    });
});

describe("logout", () => {
    it("clears storage and redirects to /login", async () => {
        localStorage.setItem("token", "tok-123");
        localStorage.setItem("permissions", JSON.stringify(["wfh.view"]));
        localStorage.setItem("roles", JSON.stringify(["staf"]));
        sessionStorage.setItem("foo", "bar");
        authMocks.logout.mockResolvedValue(undefined);

        const { result } = renderAuth();
        await act(async () => {
            await result.current?.logout();
        });

        expect(authMocks.logout).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("permissions")).toBeNull();
        expect(localStorage.getItem("roles")).toBeNull();
        expect(localStorage.getItem("must_change_password")).toBeNull();
        expect(sessionStorage.length).toBe(0);
        expect(replaceMock).toHaveBeenCalledWith("/login");
        expect(result.current?.user).toBeNull();
    });

    it("still cleans up and redirects when the API call fails", async () => {
        localStorage.setItem("token", "tok-123");
        authMocks.logout.mockRejectedValue(new Error("Network Error"));

        const { result } = renderAuth();
        await expect(
            act(async () => {
                await result.current?.logout();
            })
        ).resolves.toBeUndefined();

        expect(localStorage.getItem("token")).toBeNull();
        expect(replaceMock).toHaveBeenCalledWith("/login");
    });
});

describe("hasPermission / hasRole", () => {
    it("returns correct results based on the logged-in user", async () => {
        authMocks.login.mockResolvedValue({ token: "tok-123", user: adminUser });

        const { result } = renderAuth();
        await act(async () => {
            await result.current?.login("admin@example.com", "secret123");
        });

        expect(result.current?.hasPermission("users.manage")).toBe(true);
        expect(result.current?.hasPermission("wfh.view")).toBe(true);
        expect(result.current?.hasPermission("settings.edit")).toBe(false);
        expect(result.current?.hasRole("admin")).toBe(true);
        expect(result.current?.hasRole("staf")).toBe(false);
    });

    it("returns false for everything when no user is logged in", () => {
        const { result } = renderAuth();

        expect(result.current?.hasPermission("wfh.view")).toBe(false);
        expect(result.current?.hasRole("admin")).toBe(false);
    });
});

describe("session restore on mount", () => {
    it("fetches /auth/me and populates the user when a token exists", async () => {
        localStorage.setItem("token", "tok-restore");
        localStorage.setItem("permissions", JSON.stringify(["wfh.view"]));
        localStorage.setItem("roles", JSON.stringify(["staf"]));
        authMocks.fetchMe.mockResolvedValue(baseUser);

        const { result } = renderAuth();

        await waitFor(() => expect(result.current?.user).toEqual(baseUser));
        expect(authMocks.fetchMe).toHaveBeenCalledTimes(1);
        expect(result.current?.loading).toBe(false);
    });

    it("clears stale storage when /auth/me fails", async () => {
        localStorage.setItem("token", "tok-stale");
        localStorage.setItem("permissions", JSON.stringify(["wfh.view"]));
        localStorage.setItem("roles", JSON.stringify(["staf"]));
        authMocks.fetchMe.mockRejectedValue(new Error("Unauthenticated."));

        const { result } = renderAuth();

        await waitFor(() => expect(result.current?.loading).toBe(false));
        expect(result.current?.user).toBeNull();
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("permissions")).toBeNull();
        expect(localStorage.getItem("roles")).toBeNull();
    });

    it("removes legacy keys on boot", () => {
        localStorage.setItem("auth_token", "x");
        localStorage.setItem("auth_user", "x");
        localStorage.setItem("sidebar_collapsed", "1");

        renderAuth();

        expect(localStorage.getItem("auth_token")).toBeNull();
        expect(localStorage.getItem("auth_user")).toBeNull();
        expect(localStorage.getItem("sidebar_collapsed")).toBeNull();
    });
});

describe("must_change_password", () => {
    it("skips /auth/me and flags needsPasswordChange when the flag is set", async () => {
        localStorage.setItem("token", "tok-x");
        localStorage.setItem("must_change_password", "true");

        const { result } = renderAuth();

        await waitFor(() => expect(result.current?.loading).toBe(false));
        expect(authMocks.fetchMe).not.toHaveBeenCalled();
        expect(result.current?.needsPasswordChange).toBe(true);
        expect(result.current?.user).toBeNull();
    });
});

describe("refreshUser", () => {
    it("refetches the user and updates state + storage", async () => {
        authMocks.login.mockResolvedValue({ token: "tok-123", user: baseUser });
        const nextUser: UserPayload = { ...adminUser, name: "Andi Pratama (Updated)" };
        authMocks.fetchMe.mockResolvedValue(nextUser);

        const { result } = renderAuth();
        await act(async () => {
            await result.current?.login("andi@example.com", "secret123");
        });

        let returned: UserPayload | undefined;
        await act(async () => {
            returned = await result.current?.refreshUser();
        });

        expect(authMocks.fetchMe).toHaveBeenCalledWith();
        expect(result.current?.user).toEqual(nextUser);
        expect(JSON.parse(localStorage.getItem("permissions")!)).toEqual(nextUser.permissions);
        expect(JSON.parse(localStorage.getItem("roles")!)).toEqual(nextUser.roles);
        expect(returned).toEqual(nextUser);
    });

    it("sets needsPasswordChange when the refreshed user must change password", async () => {
        authMocks.login.mockResolvedValue({ token: "tok-123", user: baseUser });
        authMocks.fetchMe.mockResolvedValue({ ...baseUser, must_change_password: true });

        const { result } = renderAuth();
        await act(async () => {
            await result.current?.login("andi@example.com", "secret123");
        });
        await act(async () => {
            await result.current?.refreshUser();
        });

        expect(result.current?.needsPasswordChange).toBe(true);
        expect(localStorage.getItem("must_change_password")).toBe("true");
    });
});