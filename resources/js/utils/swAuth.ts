/** Sinkronkan token auth ke Service Worker (utk window.open PDF tanpa blob). */
export function syncSwAuth(): void {
  if (!("serviceWorker" in navigator)) return;
  const token = localStorage.getItem("token");
  navigator.serviceWorker.ready
    .then(() => {
      const target = navigator.serviceWorker.controller;
      if (target) target.postMessage({ type: "AUTH", token });
    })
    .catch(() => {});
}


function postAuthAndWaitAck(controller: ServiceWorker, token: string | null, timeoutMs = 300): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      if (done) return;
      done = true;
      resolve(true);
    };
    controller.postMessage({ type: "AUTH", token }, [channel.port2]);
    setTimeout(() => {
      if (done) return;
      done = true;
      resolve(false);
    }, timeoutMs);
  });
}


export async function openPdfDirect(url: string, onFail?: (msg: string) => void): Promise<void> {
  const win = window.open("", "_blank"); // sync — lolos popup blocker
  if (!win) {
    onFail?.("Izinkan popup untuk membuka PDF.");
    return;
  }

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Pre-check: BE bisa tolak export (mis. signature belum diisi) →
  // tutup tab kosong, tampilkan pesan error asli dari BE.
  let check: Response;
  try {
    check = await fetch(url, { headers });
    if (!check.ok) {
      win.close();
      let msg = `Gagal memuat PDF (${check.status})`;
      try {
        const data = await check.json();
        if (data?.message) msg = data.message;
      } catch {
        /* body bukan JSON */
      }
      onFail?.(msg);
      return;
    }
  } catch {
    win.close();
    onFail?.("Gagal memuat PDF.");
    return;
  }

  const controller = "serviceWorker" in navigator ? navigator.serviceWorker.controller : null;
  if (controller && token) {
    const acked = await postAuthAndWaitAck(controller, token);
    if (acked) {
      win.location.href = url; // SW pasang Authorization — tanpa blob
      return;
    }
  }

  // SW belum siap / belum ack → pakai hasil pre-check, tampilkan via objectURL
  const blob = await check.blob();
  const u = URL.createObjectURL(blob);
  win.location.href = u;
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}
