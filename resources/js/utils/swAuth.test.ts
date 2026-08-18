import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { syncSwAuth, openPdfDirect } from "./swAuth";

function okResponse(blob: Blob = new Blob(["pdf"])) {
    return {
        ok: true,
        status: 200,
        json: async () => ({}),
        blob: async () => blob,
    };
}

function errorResponse(status: number, body: unknown) {
    return {
        ok: false,
        status,
        json: async () => body,
    };
}

function fakeWin() {
    return { close: vi.fn(), location: { href: "" } };
}

// Fake MessageChannel: postMessage di port2 memicu onmessage di port1 (seperti
// channel asli), sehingga ack dari SW bisa disimulasikan.
class FakeMessageChannel {
    port1: { onmessage: ((msg?: unknown) => void) | null; postMessage: ReturnType<typeof vi.fn> };
    port2: { postMessage: ReturnType<typeof vi.fn> };
    constructor() {
        this.port1 = { onmessage: null, postMessage: vi.fn() };
        this.port2 = {
            postMessage: vi.fn((msg?: unknown) => {
                this.port1.onmessage?.(msg);
            }),
        };
    }
}

function stubServiceWorker(sw: { ready?: Promise<unknown>; controller?: unknown } | undefined) {
    Object.defineProperty(navigator, "serviceWorker", {
        value: sw,
        configurable: true,
    });
}

function removeServiceWorker() {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
}

let winMock: ReturnType<typeof fakeWin>;
let onFail: ReturnType<typeof vi.fn>;

beforeEach(() => {
    localStorage.clear();
    onFail = vi.fn();
    winMock = fakeWin();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    removeServiceWorker();
    delete (URL as { createObjectURL?: unknown }).createObjectURL;
    delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
});

describe("syncSwAuth", () => {
    it("posts the token to the SW controller once ready", async () => {
        localStorage.setItem("token", "tok-sw");
        const postMessage = vi.fn();
        stubServiceWorker({ ready: Promise.resolve(), controller: { postMessage } });

        syncSwAuth();

        await vi.waitFor(() =>
            expect(postMessage).toHaveBeenCalledWith({ type: "AUTH", token: "tok-sw" })
        );
    });

    it("does nothing when service worker is unsupported", () => {
        removeServiceWorker();

        expect(() => syncSwAuth()).not.toThrow();
    });

    it("does not post when the controller is missing", async () => {
        const postMessage = vi.fn();
        stubServiceWorker({ ready: Promise.resolve(), controller: null });

        syncSwAuth();

        // beri microtask flush — postMessage tidak boleh pernah muncul
        await Promise.resolve();
        expect(postMessage).not.toHaveBeenCalled();
    });
});

describe("openPdfDirect", () => {
    it("navigates straight to the URL when fetch succeeds and SW acks", async () => {
        localStorage.setItem("token", "tok");
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
        vi.stubGlobal("MessageChannel", FakeMessageChannel);
        vi.spyOn(window, "open").mockReturnValue(winMock as unknown as Window);
        const swPost = vi.fn((_msg: unknown, ports: MessagePort[]) => ports[0].postMessage("ack"));
        stubServiceWorker({ ready: Promise.resolve(), controller: { postMessage: swPost } });

        await openPdfDirect("/pdf/1", onFail);

        expect(swPost).toHaveBeenCalledWith({ type: "AUTH", token: "tok" }, expect.any(Array));
        expect(winMock.location.href).toBe("/pdf/1");
        expect(winMock.close).not.toHaveBeenCalled();
        expect(onFail).not.toHaveBeenCalled();
    });

    it("sends the bearer header and falls back to an objectURL when no SW", async () => {
        localStorage.setItem("token", "tok");
        const blob = new Blob(["pdf"]);
        const fetchMock = vi.fn().mockResolvedValue(okResponse(blob));
        vi.stubGlobal("fetch", fetchMock);
        vi.spyOn(window, "open").mockReturnValue(winMock as unknown as Window);
        removeServiceWorker();
        const createObjectURL = vi.fn(() => "blob:pdf-1");
        Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });

        await openPdfDirect("/pdf/1", onFail);

        expect(fetchMock).toHaveBeenCalledWith("/pdf/1", {
            headers: { Authorization: "Bearer tok" },
        });
        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(winMock.location.href).toBe("blob:pdf-1");
        expect(onFail).not.toHaveBeenCalled();
    });

    it("closes the window and reports the backend message on 401", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(errorResponse(401, { message: "Sesi berakhir." }))
        );
        vi.spyOn(window, "open").mockReturnValue(winMock as unknown as Window);

        await openPdfDirect("/pdf/1", onFail);

        expect(winMock.close).toHaveBeenCalled();
        expect(onFail).toHaveBeenCalledWith("Sesi berakhir.");
        expect(winMock.location.href).toBe("");
    });

    it("falls back to a status message when the error body is not valid JSON", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(500, "oops")));
        vi.spyOn(window, "open").mockReturnValue(winMock as unknown as Window);
        // status body bukan JSON — json() menolak
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => {
                throw new SyntaxError("Unexpected token o");
            },
        });
        vi.stubGlobal("fetch", fetchMock);

        await openPdfDirect("/pdf/1", onFail);

        expect(winMock.close).toHaveBeenCalled();
        expect(onFail).toHaveBeenCalledWith("Gagal memuat PDF (500)");
    });

    it("closes the window and reports failure when the fetch itself throws", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network Error")));
        vi.spyOn(window, "open").mockReturnValue(winMock as unknown as Window);

        await openPdfDirect("/pdf/1", onFail);

        expect(winMock.close).toHaveBeenCalled();
        expect(onFail).toHaveBeenCalledWith("Gagal memuat PDF.");
    });

    it("reports a popup-blocked window without fetching", async () => {
        vi.spyOn(window, "open").mockReturnValue(null);

        await openPdfDirect("/pdf/1", onFail);

        expect(onFail).toHaveBeenCalledWith("Izinkan popup untuk membuka PDF.");
        expect(winMock.close).not.toHaveBeenCalled();
    });

    it("falls back to the objectURL when the SW does not ack within the timeout", async () => {
        vi.useFakeTimers();
        localStorage.setItem("token", "tok");
        const blob = new Blob(["pdf"]);
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(blob)));
        vi.stubGlobal("MessageChannel", FakeMessageChannel);
        vi.spyOn(window, "open").mockReturnValue(winMock as unknown as Window);
        const swPost = vi.fn(); // tidak pernah membalas ack
        stubServiceWorker({ ready: Promise.resolve(), controller: { postMessage: swPost } });
        const createObjectURL = vi.fn(() => "blob:pdf-2");
        Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });

        const promise = openPdfDirect("/pdf/1", onFail);
        await vi.advanceTimersByTimeAsync(300);
        await promise;

        expect(swPost).toHaveBeenCalledWith({ type: "AUTH", token: "tok" }, expect.any(Array));
        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(winMock.location.href).toBe("blob:pdf-2");
        expect(onFail).not.toHaveBeenCalled();
    });
});