import React, { useRef, useState } from 'react';
import { Calendar, ImageIcon, Plus, Trash2, Check, X } from 'lucide-react';

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
function SessionCard({ title, status, photo, onUpload, onRemove }) {
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
                onClick={() => !photo && inputRef.current?.click()}
                className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                    isEmpty
                        ? 'border-amber-300 text-amber-500 hover:bg-amber-50/50'
                        : 'border-green-300 text-green-500 bg-white'
                }`}
            >
                {photo ? (
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
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload?.(URL.createObjectURL(file));
                }}
            />

            {photo && (
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

const HISTORY = [
    { tgl: 'Jum, 10 Juli 2026', pagi: true, siang: false, sore: true, catatan: 'Tidak absen siang' },
    { tgl: 'Jum, 10 Juli 2026', pagi: true, siang: true, sore: false, catatan: 'Tidak absen sore' },
    { tgl: 'Jum, 10 Juli 2026', pagi: true, siang: true, sore: true, catatan: 'Absen lengkap' },
    { tgl: 'Jum, 10 Juli 2026', pagi: false, siang: false, sore: false, catatan: 'Tidak absen semua' },
    { tgl: 'Jum, 10 Juli 2026', pagi: false, siang: true, sore: true, catatan: 'Tidak absen pagi' },
];

export default function AbsensiWfh() {
    const [sessions, setSessions] = useState({
        pagi: { status: 'terkirim', photo: null },
        siang: { status: 'terkirim', photo: null },
        sore: { status: 'belum', photo: null },
    });

    const setPhoto = (key, photo) =>
        setSessions((s) => ({ ...s, [key]: { status: photo ? 'terkirim' : 'belum', photo } }));

    const doneCount = Object.values(sessions).filter((s) => s.status === 'terkirim').length;
    const percent = Math.round((doneCount / 3) * 100);

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Absensi WFH</h1>

            {/* Status kehadiran */}
            <div className="mt-6">
                <h2 className="text-base font-bold text-gray-800">Status Kehadiran Hari Ini</h2>
                <p className="text-sm text-gray-500">{today}</p>

                {/* Progress bar */}
                <div className="mt-5">
                    <div className="relative flex items-center">
                        <div className="h-1.5 bg-gray-200 rounded-full w-full" />
                        <div
                            className="h-1.5 bg-brand-600 rounded-full absolute top-0 left-0 transition-all"
                            style={{ width: `${percent}%` }}
                        />
                        {/* dots */}
                        <div className="absolute inset-0 flex items-center justify-between">
                            <span className="w-5 h-5 rounded-full bg-brand-600 border-4 border-white shadow" />
                            <span className={`w-5 h-5 rounded-full border-4 border-white shadow ${percent >= 50 ? 'bg-brand-600' : 'bg-gray-300'}`} />
                            <span className={`w-5 h-5 rounded-full border-4 border-white shadow ${percent >= 100 ? 'bg-brand-600' : 'bg-brand-600'}`} />
                        </div>
                        <span className="absolute -top-7 right-0 text-lg font-extrabold text-brand-600">{percent}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <span>Pagi</span>
                        <span>Siang</span>
                        <span>Sore</span>
                    </div>
                </div>

                {/* Session cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                    <SessionCard title="Sesi Pagi" status={sessions.pagi.status} photo={sessions.pagi.photo}
                        onUpload={(p) => setPhoto('pagi', p)} onRemove={() => setPhoto('pagi', null)} />
                    <SessionCard title="Sesi Siang" status={sessions.siang.status} photo={sessions.siang.photo}
                        onUpload={(p) => setPhoto('siang', p)} onRemove={() => setPhoto('siang', null)} />
                    <SessionCard title="Sesi Sore" status={sessions.sore.status} photo={sessions.sore.photo}
                        onUpload={(p) => setPhoto('sore', p)} onRemove={() => setPhoto('sore', null)} />
                </div>
            </div>

            {/* Riwayat Absensi */}
            <div className="mt-10">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <h2 className="text-base font-bold text-gray-800">Riwayat Absensi</h2>
                    <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="date" defaultValue="2026-07-10" className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-brand-100" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
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
                                {HISTORY.map((r, i) => (
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
        </div>
    );
}
