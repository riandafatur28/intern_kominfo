import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Loader2, FileDown, Eye, X, CheckCircle, Calendar } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { demoInitiations } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { SkeletonTable, SkeletonCard } from '../../components/ui/Skeleton';

// ── Mapping status_sistem dari data API ──
function getStatusSistem(item) {
    const s = item.status;
    const rs = item.review_status;
    if (s === 'draft') return 'Draft';
    if (s === 'pending' && !rs) return 'Menunggu Evaluasi';
    if (s === 'pending' && rs === 'approved') return 'Menunggu Persetujuan TL';
    if (s === 'pending' && rs === 'rejected') return 'Menunggu Persetujuan TL';
    if (s === 'approved') return 'Disetujui';
    if (s === 'rejected') return 'Ditolak';
    if (s === 'completed') return 'Selesai';
    return s;
}

function getTahap(item) {
    const s = item.status;
    const rs = item.review_status;
    if (s === 'draft') return 'Inisiasi';
    if (s === 'pending' && !rs) return 'Evaluasi';
    if (s === 'pending' && rs) return 'Persetujuan TL';
    if (s === 'approved') return 'Persetujuan TL';
    if (s === 'rejected') return 'Persetujuan TL';
    if (s === 'completed') return 'Selesai';
    return 'Inisiasi';
}

const statusSistemColors = {
    'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
    'Menunggu Evaluasi': 'bg-blue-100 text-blue-700 border-blue-200',
    'Menunggu Persetujuan TL': 'bg-orange-100 text-orange-700 border-orange-200',
    'Disetujui': 'bg-green-100 text-green-700 border-green-200',
    'Ditolak': 'bg-red-100 text-red-700 border-red-200',
    'Selesai': 'bg-green-100 text-green-700 border-green-200',
};

// ── Timeline builder ──
function getTimeline(item) {
    const t = [
        { tahap: 'Diajukan', tanggal: item.initiation_date || '-', pelaku: item.initiator?.name || '-', status: 'selesai' },
    ];
    if (item.implementations?.length > 0 && item.implementations[0]?.evaluator_signed_at) {
        t.push({
            tahap: 'Dievaluasi',
            tanggal: item.implementations[0].evaluator_signed_at || '-',
            pelaku: item.implementations[0]?.evaluator?.name || '-',
            status: 'selesai',
        });
    }
    if (item.review_status) {
        t.push({
            tahap: item.review_status === 'approved' ? 'Disetujui TL' : 'Ditolak TL',
            tanggal: item.reviewed_at || '-',
            pelaku: item.reviewer?.name || '-',
            status: item.review_status === 'approved' ? 'selesai' : 'ditolak',
        });
    }
    if (item.implementations?.length > 0 && item.status === 'completed') {
        t.push({
            tahap: 'Implementasi Selesai',
            tanggal: item.implementations[0]?.release_date || '-',
            pelaku: item.implementations[0]?.responsible?.name || '-',
            status: 'selesai',
        });
    }
    return t;
}

export default function MonitoringInisiasi() {
    const { demoMode, hasPermission } = useAuth();
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filterPdf, setFilterPdf] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [month, setMonth] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, per_page: 10 };
            if (search.trim()) params.search = search.trim();
            if (statusFilter) params.status = statusFilter;
            if (month) params.month = month;
            const res = await changesApi.getInitiations(params);
            setData(res.data.data);
            setMeta(res.data.meta);
        } catch {
            if (demoMode) {
                let filtered = [...demoInitiations];
                if (statusFilter) filtered = filtered.filter((i) => i.status === statusFilter);
                if (search.trim()) filtered = filtered.filter((i) =>
                    (i.description || '').toLowerCase().includes(search.toLowerCase()) ||
                    (i.doc_number || '').toLowerCase().includes(search.toLowerCase())
                );
                setData(filtered);
                setMeta({ current_page: 1, last_page: 1, total: filtered.length });
            } else setError('Gagal memuat data.');
        } finally { setLoading(false); }
    }, [page, search, statusFilter, month, demoMode]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search, statusFilter, month]);

    const filteredData = data.filter((item) => {
        if (filterPdf === 'ready') return item.status === 'approved';
        if (filterPdf === 'done') return item.status === 'completed';
        if (filterPdf === 'waiting') return item.status === 'pending' && !item.review_status;
        return true;
    });

    const readyForPdf = data.filter(i => i.status === 'approved').length;
    const alreadyGenerated = data.filter(i => i.status === 'completed').length;
    const waitingApproval = data.filter(i => i.status === 'pending' && !i.review_status).length;

    const pdfStatCards = [
        { key: 'ready', label: 'Siap Digenerate', value: readyForPdf, desc: 'Disetujui oleh Team Lead', color: 'text-brand-500' },
        { key: 'done', label: 'Sudah Digenerate', value: alreadyGenerated, desc: 'PDF tersedia', color: 'text-success' },
        { key: 'waiting', label: 'Menunggu Persetujuan', value: waitingApproval, desc: 'Belum dapat digenerate', color: 'text-[#CF4B00]' },
    ];

    const totalPages = meta?.last_page ?? 1;
    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    // ── Handle Generate PDF ──
    const handleGeneratePdf = async (id) => {
        setPdfLoading(true);
        try {
            const res = await changesApi.getInitiationPdf(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `CR-${id}-lengkap.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
            fetchData();
        } catch { alert('Gagal generate PDF (demo/backend tidak tersedia)'); }
        finally { setPdfLoading(false); }
    };

    return (
        <div className="space-y-6">
            {/* Header — no create button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Monitoring Inisiasi Perubahan</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Total {meta?.total ?? data.length} permohonan &bull; Pantau progres CR di bidang Anda
                    </p>
                </div>
                <Button variant="secondary" onClick={fetchData} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </Button>
            </div>

            {error && <div className="flex items-center gap-3 p-4 bg-error-bg border border-error-border rounded-lg text-sm text-error"><AlertCircle size={18} />{error}<button onClick={fetchData} className="ml-auto underline">Ulangi</button></div>}
            {demoMode && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">Mode demo — data contoh.</div>}

            {/* Summary Cards — clickable filter */}
            {loading ? (
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
            <div className="grid grid-cols-3 gap-4">
                {pdfStatCards.map((card) => (
                    <button key={card.key} onClick={() => setFilterPdf(filterPdf === card.key ? '' : card.key)}
                        className={`text-left bg-white border rounded-xl p-5 transition-all ${
                            filterPdf === card.key ? 'border-brand-500 ring-2 ring-brand-100' : 'border-border hover:border-brand-300'
                        }`}
                    >
                        <p className={`text-[32px] font-normal ${card.color}`}>{card.value}</p>
                        <p className="text-sm font-semibold text-text-primary mt-1">{card.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{card.desc}</p>
                    </button>
                ))}
            </div>
            )}

            {/* Search & Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-border-light rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-md">
                    <Search size={16} className="text-gray-400 shrink-0" />
                    <input type="text" placeholder="Cari nomor CR / nama pemohon..." value={search}
                        onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none w-full bg-transparent" />
                    {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border border-border-light rounded-lg px-3 py-2.5 bg-white text-text-secondary">
                    <option value="">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                </select>
                <div className="relative flex items-center">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none z-10" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => { setMonth(e.target.value); setPage(1); }}
                        title="Filter bulan"
                        className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table — read-only monitoring */}
            <Card padding={false}>
                {loading ? <SkeletonTable rows={6} cols={6} />
                : filteredData.length === 0 ? <p className="text-center py-20 text-sm text-gray-400">Tidak ada data ditemukan</p>
                : <>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b bg-bg-page">
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">NO. CR</th>
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">PEMOHON</th>
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">STATUS SISTEM</th>
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">STATUS TL</th>
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">TAHAP</th>
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">PDF</th>
                                    <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-4">AKSI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row) => {
                                    const statusSistem = getStatusSistem(row);
                                    const tahap = getTahap(row);
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-bg-hover transition-colors">
                                            <td className="px-4 py-4 text-sm font-bold text-brand-500">{row.doc_number}</td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-text-primary">{row.initiator?.name ?? '-'}</p>
                                                <p className="text-xs text-text-secondary">{row.field?.name ?? '-'}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap ${statusSistemColors[statusSistem] || ''}`}>
                                                    {statusSistem}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {row.review_status ? <StatusBadge status={row.review_status} /> : <span className="text-xs text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text-secondary">{tahap}</td>
                                            <td className="px-4 py-4">
                                                {row.status === 'approved' || row.status === 'completed'
                                                    ? <span className="text-[11px] font-medium text-[#00419e]">Tersedia</span>
                                                    : <span className="text-[11px] text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setSelectedItem(row); setShowDetail(true); }}
                                                        className="p-1.5 hover:bg-gray-100 rounded-md text-text-secondary hover:text-text-primary transition-colors" title="Lihat detail">
                                                        <Eye size={16} />
                                                    </button>
                                                    {row.status === 'approved' && hasPermission('change.initiation.export_pdf') && (
                                                        <button onClick={() => handleGeneratePdf(row.id)} disabled={pdfLoading}
                                                            className="text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-md transition-colors disabled:opacity-60 flex items-center gap-1">
                                                            <FileDown size={14} />
                                                            {pdfLoading ? '...' : 'Generate PDF'}
                                                        </button>
                                                    )}
                                                    {row.status === 'completed' && (
                                                        <span className="text-xs font-semibold text-success">Generated</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-bg-page">
                        <span className="text-sm text-text-secondary">Menampilkan {filteredData.length} dari {meta?.total ?? 0} data</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ChevronLeft size={18} /></button>
                            {pages.map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded text-sm font-medium ${page === p ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </>}
            </Card>

            {/* ── Detail Modal — read-only, timeline ── */}
            <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Detail Permohonan" width="max-w-2xl">
                {selectedItem && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm text-brand-500 font-bold">{selectedItem.doc_number}</p>
                            <p className="text-lg font-bold text-text-primary mt-1">{selectedItem.description}</p>
                        </div>

                        {/* Data CR read-only */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Inisiator', value: selectedItem.initiator?.name },
                                { label: 'Bidang', value: selectedItem.field?.name },
                                { label: 'Tanggal Diajukan', value: selectedItem.initiation_date },
                                { label: 'Dibutuhkan Tanggal', value: selectedItem.needed_by_date || '-' },
                                { label: 'Status Sistem', value: getStatusSistem(selectedItem) },
                                { label: 'Status TL', value: selectedItem.review_status || '-' },
                                { label: 'Deskripsi', value: selectedItem.description, full: true },
                                { label: 'Alasan', value: selectedItem.reason || '-', full: true },
                                { label: 'Alasan Review', value: selectedItem.review_reason || '-', full: true },
                            ].map((f, i) => (
                                <div key={i} className={f.full ? 'col-span-2' : ''}>
                                    <p className="text-xs text-text-secondary mb-1">{f.label}</p>
                                    <p className="text-sm font-semibold text-text-primary">{f.value || '-'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Hasil Evaluasi (read-only) */}
                        {selectedItem.implementations?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-text-primary mb-4">Hasil Evaluasi</h4>
                                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                                    {(() => {
                                        const impl = selectedItem.implementations[0];
                                        return <>
                                            <div><p className="text-xs text-text-secondary">Prioritas</p><p className="text-sm font-semibold mt-0.5">{impl.priority || '-'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Dampak</p><p className="text-sm font-semibold mt-0.5">{impl.impact || '-'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Dampak Produksi</p><p className="text-sm font-semibold mt-0.5">{impl.production_impact || '-'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Upaya</p><p className="text-sm font-semibold mt-0.5">{impl.required_effort || '-'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Biaya</p><p className="text-sm font-semibold mt-0.5">{impl.cost_needed ? `Rp ${impl.cost_amount}` : 'Tidak ada'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Sumber Daya</p><p className="text-sm font-semibold mt-0.5">{impl.resources || '-'}</p></div>
                                            <div className="col-span-2"><p className="text-xs text-text-secondary">Rencana Pengujian</p><p className="text-sm font-semibold mt-0.5">{impl.test_plan || '-'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Evaluator</p><p className="text-sm font-semibold mt-0.5">{impl.evaluator?.name || '-'}</p></div>
                                            <div><p className="text-xs text-text-secondary">Tanggal Evaluasi</p><p className="text-sm font-semibold mt-0.5">{impl.evaluator_signed_at || '-'}</p></div>
                                        </>;
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div>
                            <h4 className="text-sm font-bold text-text-primary mb-4">Timeline</h4>
                            <div className="space-y-0">
                                {getTimeline(selectedItem).map((t, i) => {
                                    const dotColor = t.status === 'selesai' ? 'bg-green-500' : t.status === 'ditolak' ? 'bg-red-500' : 'bg-orange-500';
                                    const timeline = getTimeline(selectedItem);
                                    return (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 ${dotColor} rounded-full flex items-center justify-center`}>
                                                    {t.status === 'selesai' ? <CheckCircle size={14} className="text-white" /> :
                                                     t.status === 'ditolak' ? <X size={14} className="text-white" /> :
                                                     <Loader2 size={14} className="text-white animate-spin" />}
                                                </div>
                                                {i < timeline.length - 1 && <div className="w-0.5 h-full bg-gray-200" />}
                                            </div>
                                            <div className={`pb-6 ${i === timeline.length - 1 ? 'pb-0' : ''}`}>
                                                <p className="text-sm font-semibold text-text-primary">{t.tahap}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">{t.tanggal} &bull; {t.pelaku}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {getTimeline(selectedItem).length <= 1 && !selectedItem.implementations?.length && (
                                    <p className="text-xs text-gray-400">Belum ada aktivitas evaluasi</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
