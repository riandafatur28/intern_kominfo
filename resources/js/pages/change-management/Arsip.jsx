import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Loader2, FileDown, X } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { demoInitiations } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SkeletonTable } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function Arsip() {
    const { demoMode } = useAuth();
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, per_page: 10 };
            if (search.trim()) params.search = search.trim();
            const res = await changesApi.getInitiations(params);
            setData(res.data.data);
            setMeta(res.data.meta);
        } catch {
            if (demoMode) {
                let filtered = demoInitiations.filter((i) => i.status === 'approved' || i.status === 'rejected');
                if (search.trim()) filtered = filtered.filter((i) =>
                    (i.description || '').toLowerCase().includes(search.toLowerCase()) ||
                    (i.doc_number || '').toLowerCase().includes(search.toLowerCase())
                );
                setData(filtered);
                setMeta({ current_page: 1, last_page: 1, total: filtered.length });
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, demoMode]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search]);

    const totalPages = meta?.last_page ?? 1;
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    // Stats
    const approvedCount = data.filter(i => i.status === 'approved').length;
    const rejectedCount = data.filter(i => i.status === 'rejected').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Arsip</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Riwayat pengajuan yang telah selesai &bull; Total {meta?.total ?? data.length} data
                    </p>
                </div>
                <Button variant="secondary" onClick={fetchData} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-error-bg border border-error-border rounded-lg text-sm text-error">
                    <AlertCircle size={18} />{error}
                    <button onClick={fetchData} className="ml-auto underline">Ulangi</button>
                </div>
            )}

            {demoMode && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">Mode demo — data contoh.</div>
            )}

            {/* Stats summary */}
            <div className="flex gap-4">
                <div className="bg-white border border-border rounded-xl px-5 py-4 flex-1">
                    <p className="text-[32px] font-normal text-success">{approvedCount}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">Disetujui</p>
                </div>
                <div className="bg-white border border-border rounded-xl px-5 py-4 flex-1">
                    <p className="text-[32px] font-normal text-error">{rejectedCount}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">Ditolak</p>
                </div>
                <div className="bg-white border border-border rounded-xl px-5 py-4 flex-1">
                    <p className="text-[32px] font-normal text-brand-500">{data.length}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">Total Arsip</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari berdasarkan nomor CR atau deskripsi..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-border-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={16} /></button>}
                </div>
            </div>

            {/* Table */}
            <Card padding={false}>
                {loading ? (
                    <SkeletonTable rows={6} cols={5} />
                ) : data.length === 0 ? (
                    <EmptyState message="Belum ada arsip pengajuan" />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b bg-bg-page">
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">NO. CR</th>
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">DESKRIPSI</th>
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">BIDANG</th>
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">TANGGAL</th>
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">STATUS</th>
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">PDF</th>
                                        <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, i) => (
                                        <tr key={row.id} className={`${i < data.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-bg-hover transition-colors`}>
                                            <td className="px-6 py-4 text-sm font-bold text-brand-500">{row.doc_number}</td>
                                            <td className="px-6 py-4 text-sm text-text-primary max-w-[300px] truncate">{row.description}</td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">{row.field?.name ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">{row.initiation_date ?? '-'}</td>
                                            <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                                            <td className="px-6 py-4">
                                                {row.status === 'approved' ? (
                                                    <span className="text-[11px] font-medium text-[#00419e]">Tersedia</span>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {row.status === 'approved' && (
                                                        <button onClick={async () => {
                                                            try {
                                                                const res = await changesApi.getInitiationPdf(row.id);
                                                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `CR-${row.doc_number || row.id}.pdf`;
                                                                document.body.appendChild(a); a.click(); a.remove();
                                                                window.URL.revokeObjectURL(url);
                                                            } catch { alert('Gagal download PDF'); }
                                                        }} className="p-1.5 hover:bg-gray-100 rounded-md text-brand-500 transition-colors" title="Download PDF">
                                                            <FileDown size={16} />
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-bg-page">
                            <span className="text-sm text-text-secondary">Menampilkan {data.length} dari {meta?.total ?? 0} data</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ChevronLeft size={18} /></button>
                                {pages.map((p) => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded text-sm font-medium ${page === p ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
                                ))}
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
