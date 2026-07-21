import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImageIcon, Plus, Trash2, Check, X, Loader2, CheckCircle2, XCircle, FileDown } from 'lucide-react';
import { checkIn, getAttendance } from '../../api/attendance';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../utils/url';
import { printWfhAttendance } from '../../pdf';

/* ---------------- Session status badge ---------------- */
function SessionBadge({ status }) {
    const map = {
        terkirim: 'bg-[#C9F2D6] text-[#15803D]',
        belum: 'bg-[#FEE9C7] text-[#B45309]',
    };
    const label = { terkirim: 'Terkirim', belum: 'Belum Diisi' };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
            {label[status]}
        </span>
    );
}

/* ---------------- Session card ---------------- */
function SessionCard({ title, status, photo, loading, onUpload, onRemove }) {
    const inputRef = useRef(null);
    const isEmpty = status === 'belum';
    const borderColor = isEmpty ? 'border-amber-200' : 'border-green-200';

    return (
        <div className={`bg-white rounded-2xl border ${borderColor} p-5 relative`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800">{title}</h3>
                <SessionBadge status={status} />
            </div>

            <button
                type="button"
                onClick={() => !photo && !loading && inputRef.current?.click()}
                disabled={loading}
                className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${isEmpty
                    ? 'border-amber-300 text-amber-500 hover:bg-amber-50/50'
                    : 'border-green-300 text-green-500 bg-white'
                    }`}
            >
                {loading ? (
                    <Loader2 size={40} className="animate-spin text-brand-500" />
                ) : photo ? (
                    <img src={photo} alt={title} className="w-full h-full object-cover rounded-lg" />
                ) : isEmpty ? (
                    <>
                        <Plus size={40} strokeWidth={2.5} />
                        <span className="text-sm font-medium text-gray-700">Unggah Foto</span>
                    </>
                ) : (
                    <ImageIcon size={44} strokeWidth={1.8} />
                )}
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload?.(file);
                    e.target.value = '';
                }}
            />

            {photo && !loading && (
                <button
                    onClick={onRemove}
                    className="absolute bottom-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                    title="Hapus foto"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
}

/* ---------------- History mark ---------------- */
function Mark({ ok }) {
    return ok ? (
        <Check size={18} className="text-green-500 inline" strokeWidth={3} />
    ) : (
        <X size={18} className="text-red-500 inline" strokeWidth={3} />
    );
}

// Backend hanya menerima sesi 'pagi' dan 'sore' (lihat CheckInRequest).
const SUPPORTED_SESSIONS = ['pagi', 'sore'];

const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtTgl = (d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AbsensiWfh() {
    const [sessions, setSessions] = useState({
        pagi: { status: 'belum', photo: null, loading: false },
        siang: { status: 'belum', photo: null, loading: false },
        sore: { status: 'belum', photo: null, loading: false },
    });
    const [history, setHistory] = useState([]);

    const { user } = useAuth();
    const [toast, setToast] = useState(null);
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const setSession = (key, patch) =>
        setSessions((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

    // Muat riwayat absensi + status sesi hari ini dari backend.
    const loadAttendance = useCallback(async () => {
        try {
            const items = await getAttendance();
            const byDate = {};
            items.forEach((a) => {
                byDate[a.date] = byDate[a.date] || { date: a.date, pagi: false, siang: false, sore: false, photos: {} };
                byDate[a.date][a.session] = true;
                byDate[a.date].photos[a.session] = a.photo_url;
            });

            const todayRec = byDate[todayISO()];
            if (todayRec) {
                setSessions((s) => ({
                    pagi: { ...s.pagi, status: todayRec.pagi ? 'terkirim' : 'belum', photo: todayRec.photos.pagi ?? s.pagi.photo },
                    siang: { ...s.siang, status: todayRec.siang ? 'terkirim' : 'belum', photo: todayRec.photos.siang ?? s.siang.photo },
                    sore: { ...s.sore, status: todayRec.sore ? 'terkirim' : 'belum', photo: todayRec.photos.sore ?? s.sore.photo },
                }));
            }

            const rows = Object.values(byDate)
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r) => {
                    const miss = SUPPORTED_SESSIONS.filter((s) => !r[s]);
                    let catatan;
                    if (miss.length === 0) catatan = 'Absen lengkap';
                    else if (miss.length === SUPPORTED_SESSIONS.length) catatan = 'Belum absen';
                    else catatan = 'Tidak absen ' + miss.map(cap).join(', ');
                    return { tgl: fmtTgl(r.date), pagi: r.pagi, siang: r.siang, sore: r.sore, catatan };
                });
            setHistory(rows);
        } catch {
            // abaikan; tabel riwayat tetap kosong bila gagal
        }
    }, []);

    useEffect(() => { loadAttendance(); }, [loadAttendance]);

    const handleUpload = async (key, file) => {
        if (!SUPPORTED_SESSIONS.includes(key)) {
            showToast('error', 'Sesi ini belum didukung sistem absensi. Gunakan sesi pagi atau sore.');
            return;
        }
        // Optimistic preview
        const preview = URL.createObjectURL(file);
        setSession(key, { loading: true, photo: preview });
        try {
            const res = await checkIn({ photo: file, session: key });
            setSession(key, { status: 'terkirim', photo: res.data?.photo_url ?? preview, loading: false });
            showToast('success', res.message || 'Absensi berhasil dikirim.');
            loadAttendance(); // refresh riwayat setelah absen berhasil
        } catch (err) {
            setSession(key, { status: 'belum', photo: null, loading: false });
            showToast('error', err.response?.data?.message || 'Gagal mengirim absensi.');
        }
    };

    const handleRemove = (key) => setSession(key, { status: 'belum', photo: null });

    const handleDownloadPdf = () => {
        printWfhAttendance({
            judul: 'Laporan Bukti Absensi WFH',
            tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
            unitKerja: user?.team?.field?.name,
            rows: [{
                no: 1,
                nama: user?.name ?? '-',
                pagi: sessions.pagi.photo ? assetUrl(sessions.pagi.photo) : null,
                siang: sessions.siang.photo ? assetUrl(sessions.siang.photo) : null,
                sore: sessions.sore.photo ? assetUrl(sessions.sore.photo) : null,
            }],
            makerName: (user?.name || '-').toUpperCase(),
            makerNip: user?.nip ?? '-',
            makerSignatureUrl: user?.signature_path ? assetUrl(`/storage/${user.signature_path}`) : null,
        });
    };

    const doneCount = Object.values(sessions).filter((s) => s.status === 'terkirim').length;
    const percent = Math.round((doneCount / 3) * 100);

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Absensi WFH</h1>
                <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    <FileDown size={16} />
                    Unduh Laporan Absensi
                </button>
            </div>

            {/* Status kehadiran */}
            <div className="mt-6">
                <h2 className="text-base font-bold text-gray-800">Status Kehadiran Hari Ini</h2>
                <p className="text-sm text-gray-500">{today}</p>

                {/* Progress bar */}
                <div className="mt-5">
                    <div className="relative flex items-center">
                        <div className="h-1.5 bg-gray-200 rounded-full w-full" />
                        <div
                            className="h-1.5 bg-indigo-500 rounded-full absolute top-0 left-0 transition-all"
                            style={{ width: `${percent}%` }}
                        />
                        {/* dots */}
                        <div className="absolute inset-0 flex items-center justify-between">
                            <span className="w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow" />
                            <span className={`w-5 h-5 rounded-full border-4 border-white shadow ${percent >= 50 ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                            <span className={`w-5 h-5 rounded-full border-4 border-white shadow ${percent >= 100 ? 'bg-indigo-500' : 'bg-indigo-500'}`} />
                        </div>
                        <span className="absolute -top-7 right-0 text-lg font-extrabold text-indigo-500">{percent}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <span>Pagi</span>
                        <span>Siang</span>
                        <span>Sore</span>
                    </div>
                </div>

                {/* Session cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                    <SessionCard title="Sesi Pagi" status={sessions.pagi.status} photo={sessions.pagi.photo} loading={sessions.pagi.loading}
                        onUpload={(f) => handleUpload('pagi', f)} onRemove={() => handleRemove('pagi')} />
                    <SessionCard title="Sesi Siang" status={sessions.siang.status} photo={sessions.siang.photo} loading={sessions.siang.loading}
                        onUpload={(f) => handleUpload('siang', f)} onRemove={() => handleRemove('siang')} />
                    <SessionCard title="Sesi Sore" status={sessions.sore.status} photo={sessions.sore.photo} loading={sessions.sore.loading}
                        onUpload={(f) => handleUpload('sore', f)} onRemove={() => handleRemove('sore')} />
                </div>
            </div>

            {/* Riwayat Absensi */}
            <div className="mt-10">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <h2 className="text-base font-bold text-gray-800">Riwayat Absensi</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Desktop table */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className="text-gray-700 text-sm font-semibold border-b border-gray-100">
                                    <th className="text-left px-6 py-4">Tanggal</th>
                                    <th className="text-center px-4 py-4">Pagi</th>
                                    <th className="text-center px-4 py-4">Siang</th>
                                    <th className="text-center px-4 py-4">Sore</th>
                                    <th className="text-center px-6 py-4">Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400">Belum ada riwayat absensi.</td></tr>
                                ) : history.map((r, i) => (
                                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 text-sm text-gray-600">
                                        <td className="px-6 py-4 whitespace-nowrap">{r.tgl}</td>
                                        <td className="px-4 py-4 text-center"><Mark ok={r.pagi} /></td>
                                        <td className="px-4 py-4 text-center"><Mark ok={r.siang} /></td>
                                        <td className="px-4 py-4 text-center"><Mark ok={r.sore} /></td>
                                        <td className="px-6 py-4 text-center">{r.catatan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-50">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-sm text-gray-400">Belum ada riwayat absensi.</div>
                        ) : history.map((r, i) => (
                            <div key={i} className="p-4 space-y-2 text-sm text-gray-600">
                                <p className="font-semibold text-gray-800">{r.tgl}</p>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Mark ok={r.pagi} /> Pagi</span>
                                    <span className="flex items-center gap-1"><Mark ok={r.siang} /> Siang</span>
                                    <span className="flex items-center gap-1"><Mark ok={r.sore} /> Sore</span>
                                </div>
                                <p className="text-xs text-gray-400">{r.catatan}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ketentuan */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 mb-4">
                <h3 className="text-base font-bold text-gray-800 mb-4">Ketentuan Absensi WFH</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-600">
                    <p className="flex gap-2"><span className="text-gray-400">•</span> WFH hanya dilaksanakan setiap hari Jumat</p>
                    <p className="flex gap-2"><span className="text-gray-400">•</span> Upload foto setiap sesi (pagi, siang, sore)</p>
                    <p className="flex gap-2"><span className="text-gray-400">•</span> Foto harus menampilkan wajah yang jelas</p>
                    <p className="flex gap-2"><span className="text-gray-400">•</span> Wajib isi kegiatan setelah absensi</p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}

