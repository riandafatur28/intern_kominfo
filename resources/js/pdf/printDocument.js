/**
 * Utilitas cetak/unduh dokumen PDF dari sisi frontend.
 *
 * Pendekatan: membuka dokumen HTML lengkap (dengan CSS cetak A4) di window baru,
 * menunggu gambar termuat, lalu memanggil dialog print browser. Pengguna memilih
 * "Save as PDF" untuk mengunduh. Hasil teks tajam (vektor), tanpa dependency.
 *
 * PENTING: harus dipanggil dari dalam handler klik pengguna agar tidak diblokir popup.
 */

/** Escape teks agar aman dimasukkan ke HTML (mencegah HTML injection). */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Buka HTML lengkap di window baru dan jalankan print (Save as PDF).
 * @param {string} html - dokumen HTML lengkap (mulai <!DOCTYPE html> ... </html>)
 * @param {Object} [opts]
 * @param {boolean} [opts.autoClose=true] - tutup window setelah print
 */
export function printHtmlDocument(html, opts = {}) {
    const { autoClose = true } = opts;
    const win = window.open('', '_blank');

    if (!win) {
        alert('Popup diblokir oleh browser. Izinkan popup untuk situs ini agar dapat mengunduh PDF.');
        return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();

    const triggerPrint = () => {
        win.focus();
        win.print();
        if (autoClose) {
            // beri jeda agar dialog print sempat tampil sebelum window ditutup
            win.onafterprint = () => win.close();
            setTimeout(() => { try { win.close(); } catch { /* ignore */ } }, 60000);
        }
    };

    // Tunggu seluruh aset (gambar/QR) termuat sebelum mencetak.
    if (win.document.readyState === 'complete') {
        setTimeout(triggerPrint, 400);
    } else {
        win.onload = () => setTimeout(triggerPrint, 400);
    }
}
