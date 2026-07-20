import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { getAdminReports } from '../../api/admin';
import { SkeletonTable } from '../../components/ui/Skeleton';

const STATUS_META = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
};

const STATUS_FILTERS = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'draft', label: 'Draft' },
];

export default function StatusLaporanWfh() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [meta, setMeta] = useState(null);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        getAdminReports({ status: status || undefined, page })
            .then((res) => {
                setReports(res.data || []);
                setMeta(res.meta || null);
            })
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat data laporan.'))
            .finally(() => setLoading(false));
    }, [status, page]);

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Status Laporan WFH</h1>
                    <p className="text-sm text-gray-400">Daftar seluruh laporan WFH pada bidang Anda</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => {
                            setStatus(f.value);
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            status === f.value
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <SkeletonTable rows={6} cols={5} />
                ) : error ? (
                    <div className="p-6 text-red-600 text-sm bg-red-50">{error}</div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <FileText size={40} className="mb-3" />
                        <p>Tidak ada laporan ditemukan.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-3 font-semibold">Pegawai</th>
                                    <th className="px-6 py-3 font-semibold">NIP</th>
                                    <th className="px-6 py-3 font-semibold">Jabatan</th>
                                    <th className="px-6 py-3 font-semibold">Tanggal</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((r) => {
                                    const meta = STATUS_META[r.status] ?? STATUS_META.draft;
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {r.user?.name ?? '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{r.user?.nip ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{r.user?.position ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.report_date)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {reports.map((r) => {
                                const meta = STATUS_META[r.status] ?? STATUS_META.draft;
                                return (
                                    <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{r.user?.name ?? '-'}</p>
                                            <p className="text-xs text-gray-500 truncate">{r.user?.nip ?? '-'} · {formatDate(r.report_date)}</p>
                                        </div>
                                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Halaman {meta.current_page} dari {meta.last_page} · {meta.total} laporan
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Sebelumnya
                        </button>
                        <button
                            disabled={page >= meta.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
