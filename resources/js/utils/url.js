/**
 * Normalize a backend asset URL so it always loads from the current origin.
 *
 * Backend menghasilkan URL absolut berbasis APP_URL (mis. http://localhost/storage/..).
 * Jika APP_URL tidak sama dengan alamat akses (mis. http://localhost:8000), gambar gagal
 * dimuat. Dengan mengambil pathname-nya saja, browser me-resolve terhadap origin saat ini.
 *
 * Object URL (blob:) dan data URL dibiarkan apa adanya.
 *
 * @param {string|null|undefined} url
 * @returns {string|null|undefined}
 */
export function assetUrl(url) {
    if (!url) return url;
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    try {
        const u = new URL(url, window.location.origin);
        return u.pathname + u.search;
    } catch {
        return url;
    }
}
