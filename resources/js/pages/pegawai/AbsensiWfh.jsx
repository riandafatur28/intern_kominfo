import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ImageIcon, Plus, Trash2, Check, X, Loader2 } from 'lucide-react';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { wfhApi } from '../../api/wfh';

/* ---------------- Session status badge ---------------- */
function SessionBadge({ status }) {
    const map = {
        hadir: 'bg-[#C9F2D6] text-[#15803D]',
        belum: 'bg-[#FEE9C7] text-[#B45309]',
    };
    const label = { hadir: 'Hadir', belum: 'Belum Absen' };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || map.belum}`}>
            {label[status] || label.belum}
        </span>
    );
}

/* ---------------- Session card ---------------- */
function SessionCard({ title, status, photo, loading, onUpload, onRemove }) {
    const inputRef = useRef(null);
    const isEmpty = status === 'belum' && !photo && !loading;
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
                className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                    loading
                        ? 'border-brand-200 text-brand-400 bg-brand-50'
                        : isEmpty
                            ? 'border-amber-300 text-amber-500 hover:bg-amber-50/50'
                            : 'border-green-300 text-green-500 bg-white'
                }`}
            >
                {loading ? (
                    <Loader2 size={40} className="animate-spin" />
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
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload?.(file);
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

/** Derive session name from current time */
function currentSession() {
    const h = new Date().getHours();
    if (h < 10) return 'pagi';
    if (h < 14) return 'siang';
    return 'sore';
}

const SESSION_LABEL = { pagi: 'Sesi Pagi', siang: 'Sesi Siang', sore: 'Sesi Sore' };
const SESSION_KEYS = ['pagi', 'siang', 'sore'];

export default function AbsensiWfh() {
    const [sessions, setSessions] = useState(() => {
        const obj = {};
        SESSION_KEYS.forEach((k) => { obj[k] = { status: 'belum', photo: null, checkInAt: null }; });
        return obj;
    });
    const [uploading, setUploading] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loaded, setLoaded] = useState(false);

    const doneCount = Object.values(sessions).filter((s) => s.status === 'hadir').length;
    const percent = SESSION_KEYS.length > 0 ? Math.round((doneCount / SESSION_KEYS.length) * 100) : 0;

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const todayStr = new Date().toISOString().slice(0, 10);

    // Load existing attendance on mount
    useEffect(() => {
        wfhApi.getTodayAttendance(todayStr).then((res) => {
            const data = res.data?.data;
            if (!data) return;
            const next = {};
            SESSION_KEYS.forEach((k) => {
                const s = data[k];
                if (s?.status === 'hadir') {
                    next[k] = { status: 'hadir', photo: s.photo_url, checkInAt: s.check_in_at };
                } else {
                    next[k] = { status: 'belum', photo: null, checkInAt: null };
                }
            });
            setSessions(next);
        }).catch(() => {}).finally(() => setLoaded(true));
    }, []);

    const handleUpload = async (session, file) => {
        setUploading(session);
        setError('');
        setSuccess('');
        try {
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('session', session);
            formData.append('date', todayStr);

            const res = await wfhApi.checkIn(formData);
            const photoUrl = res.data?.data?.photo_url;
            setSessions((s) => ({
                ...s,
                [session]: { status: 'hadir', photo: photoUrl, checkInAt: res.data?.data?.check_in_at },
            }));
            setSuccess(`Absen ${SESSION_LABEL[session]} berhasil`);
        } catch (e) {
            setError(e.response?.data?.message || `Gagal absen ${SESSION_LABEL[session]}`);
        } finally {
            setUploading(null);
        }
    };

    const handleRemove = (session) => {
        setSessions((s) => ({ ...s, [session]: { status: 'belum', photo: null, checkInAt: null } }));
    };

    if (!loaded) {
        return (
            <div className="max-w-[1200px] mx-auto">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="mt-6 space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                    <div className="mt-5 h-2 bg-gray-200 rounded-full w-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Absensi WFH</h1>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}
            {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
            )}

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
                        <div className="absolute inset-0 flex items-center justify-between">
                            {SESSION_KEYS.map((_, i) => (
                                <span key={i}
                                    className={`w-5 h-5 rounded-full border-4 border-white shadow ${
                                        percent >= ((i + 1) / SESSION_KEYS.length) * 100 ? 'bg-brand-600' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
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
                    {SESSION_KEYS.map((k) => (
                        <SessionCard
                            key={k}
                            title={SESSION_LABEL[k]}
                            status={sessions[k].status}
                            photo={sessions[k].photo}
                            loading={uploading === k}
                            onUpload={(file) => handleUpload(k, file)}
                            onRemove={() => handleRemove(k)}
                        />
                    ))}
                </div>
            </div>

            {/* Riwayat Absensi */}
            <div className="mt-10">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <h2 className="text-base font-bold text-gray-800">Riwayat Absensi</h2>
                    <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="date" defaultValue={todayStr} className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-brand-100" />
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
                                {[todayStr].map((d) => {
                                    const sn = SESSION_KEYS.map((k) => sessions[k].status === 'hadir');
                                    const allAbsent = sn.every((v) => !v);
                                    return (
                                        <tr key={d} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 text-sm text-gray-600">
                                            <td className="px-6 py-4 whitespace-nowrap">{today}</td>
                                            {sn.map((v, i) => (
                                                <td key={i} className="px-4 py-4 text-center"><Mark ok={v} /></td>
                                            ))}
                                            <td className="px-6 py-4 text-center">
                                                {allAbsent ? 'Belum absen' : doneCount === SESSION_KEYS.length ? 'Lengkap' : 'Sebagian'}
                                            </td>
                                        </tr>
                                    );
                                })}
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
