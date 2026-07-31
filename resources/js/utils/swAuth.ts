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

/**
 * Buka PDF langsung di tab baru. Panggil sinkron dari click handler (lolos popup blocker).
 * - SW aktif → window.open URL murni, auth header dipasang SW (tanpa blob).
 * - SW belum aktif (fresh load / http non-secure) → fetch + blob otomatis, PDF tetap kebuka.
 * Klik SELALU langsung membuka — tanpa syarat reload.
 */
export function openPdfDirect(url: string, onFail?: (msg: string) => void): void {
  const win = window.open("", "_blank"); // sync — lolos popup blocker
  if (!win) {
    onFail?.("Izinkan popup untuk membuka PDF.");
    return;
  }

  const sw = "serviceWorker" in navigator && navigator.serviceWorker.controller;
  if (sw) {
    win.location.href = url; // SW pasang Authorization — tanpa blob
    return;
  }

  // Fallback: SW belum siap → ambil dgn header Bearer manual, tampilkan via objectURL
  const token = localStorage.getItem("token");
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.blob();
    })
    .then((blob) => {
      const u = URL.createObjectURL(blob);
      win.location.href = u;
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    })
    .catch(() => {
      win.close();
      onFail?.("Gagal memuat PDF.");
    });
}
