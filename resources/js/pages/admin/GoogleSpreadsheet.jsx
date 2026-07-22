import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { getSpreadsheetSync } from '../../api/admin';
import Modal from '../../components/ui/Modal';

const STATUS_BADGE = {
    terkirim: { label: 'Terkirim', cls: 'bg-green-100 text-green-700' },
    berhasil: { label: 'Berhasil', cls: 'bg-green-100 text-green-700' },
    gagal: { label: 'Gagal', cls: 'bg-red-100 text-red-600' },
};

export default function GoogleSpreadsheet() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const load = () => {
        setLoading(true);
        setError('');
        getSpreadsheetSync()
            .then(setData)
            .catch((e) => setError(e.response?.data?.message || 'Gagal memuat status sinkronisasi.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm max-w-[1200px] mx-auto">
                {error}
            </div>
        );
    }

    const { connection, stats, synced_data: syncedData, history, structure } = data;
    const openSpreadsheet = () => window.open(connection.spreadsheet_url, '_blank', 'noopener');
    const visibleHistory = history.slice(0, 4);

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Sinkronisasi Google Spreadsheets</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Status Koneksi */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
                        <div className="mb-5">
                            <h2 className="text-base font-bold text-gray-800">Status Koneksi</h2>
                            <p className="text-xs text-gray-400">{connection.sheet_label}</p>
                        </div>

                        <div className="border border-gray-100 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={22} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-green-600">{connection.title}</p>
                                        <p className="text-sm text-gray-500">{connection.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 break-all">
                                            ID Spreadsheet: {connection.spreadsheet_id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={openSpreadsheet}
                                    className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors shrink-0"
                                >
                                    <ExternalLink size={15} />
                                    Buka Spreadsheet
                                </button>
                            </div>

                            {/* Stats bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 bg-gray-50 rounded-xl p-4">
                                <StatItem label="Terakhir Disinkronkan" value={stats.last_synced_label} />
                                <StatItem label="Total Data Tersinkron" value={`${formatNum(stats.total_rows)} baris`} />
                                <StatItem label="Sheet Aktif" value={stats.active_sheet} />
                            </div>
                        </div>

                        <div className="flex justify-end mt-5">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                            >
                                <RefreshCw size={15} />
                                Lihat Semua
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Data yang Disinkron */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-800 text-center mb-4">Data yang Disinkron</h2>
                        <div className="space-y-4">
                            {syncedData.map((d) => (
                                <div key={d.key} className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                                        <p className="text-xs text-gray-400">{formatNum(d.rows)} Baris</p>
                                    </div>
                                    <StatusBadge status={d.status} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Riwayat Sinkronisasi Data */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-800 text-center mb-4">Riwayat Sinkronisasi Data</h2>
                        <div className="relative">
                            {visibleHistory.map((h, i) => (
                                <HistoryItem key={i} item={h} isLast={i === visibleHistory.length - 1} />
                            ))}
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Lihat Semua Riwayat
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Struktur Spreadsheet */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800">Struktur Spreadsheet</h2>
                <p className="text-xs text-gray-400 mb-4">Struktur yang disinkronkan ke Google Sheets</p>
                <div className="flex flex-wrap gap-2">
                    {structure.map((col) => (
                        <span
                            key={col}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
                        >
                            {col}
                        </span>
                    ))}
                </div>
            </div>

            {/* Full history modal */}
            {showHistory && (
                <Modal open onClose={() => setShowHistory(false)} title="Riwayat Sinkronisasi Data" width="max-w-lg">
                    <div className="relative">
                        {history.map((h, i) => (
                            <HistoryItem key={i} item={h} isLast={i === history.length - 1} />
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
}

function StatItem({ label, value }) {
    return (
        <div>
            <p className="text-[11px] text-gray-400">{label}</p>
            <p className="text-sm font-bold text-gray-800">{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const meta = STATUS_BADGE[status] ?? STATUS_BADGE.terkirim;
    return (
        <span className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

function HistoryItem({ item, isLast }) {
    const failed = item.status === 'gagal';
    return (
        <div className="flex gap-3 pb-4 relative">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center pt-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${failed ? 'bg-red-500' : 'bg-indigo-500'}`} />
                {!isLast && <span className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>
            <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0">
                    {!failed && <p className="text-[11px] text-gray-400">{item.label}</p>}
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400">{failed ? item.error : `${formatNum(item.rows)} Baris`}</p>
                </div>
                <StatusBadge status={item.status} />
            </div>
        </div>
    );
}

function formatNum(n) {
    return new Intl.NumberFormat('id-ID').format(n ?? 0);
}
