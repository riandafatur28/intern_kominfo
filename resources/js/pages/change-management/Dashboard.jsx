import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Clock, CheckCircle, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { demoInitiations } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/ui/Card';
import { SkeletonCard, SkeletonBlock } from '../../components/ui/Skeleton';


const statIcons = {
    pending: { icon: FileText, bg: 'bg-stat-pending', color: 'text-[#A65A00]' },
    approved: { icon: CheckCircle, bg: 'bg-stat-approved', color: 'text-[#0B7A3E]' },
    rejected: { icon: XCircle, bg: 'bg-stat-rejected', color: 'text-[#B91C1C]' },
    waiting: { icon: Clock, bg: 'bg-stat-waiting', color: 'text-[#A65A00]' },
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { demoMode, hasPermission } = useAuth();
    const [initiations, setInitiations] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, thisWeek: 0 });
    const [loading, setLoading] = useState(true);


    const isThisWeek = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return d >= start && d < end;
    };

    const fetchData = async () => {
        setLoading(true);
        if (!hasPermission('change.initiation.view')) {
            setLoading(false);
            return;
        }
        try {
            const res = await changesApi.getInitiations({ per_page: 10 });
            const all = res.data.data;
            setStats({
                total: res.data.meta.total,
                pending: all.filter((i) => i.status === 'pending').length,
                approved: all.filter((i) => i.status === 'approved').length,
                rejected: all.filter((i) => i.status === 'rejected').length,
                thisWeek: all.filter((i) => i.status === 'approved' && isThisWeek(i.reviewed_at)).length,
            });
            setInitiations(all.slice(0, 5));
        } catch {
            const all = demoInitiations;
            setStats({
                total: all.length,
                pending: all.filter((i) => i.status === 'pending').length,
                approved: all.filter((i) => i.status === 'approved').length,
                rejected: all.filter((i) => i.status === 'rejected').length,
                thisWeek: all.filter((i) => i.status === 'approved' && isThisWeek(i.reviewed_at)).length,
            });
            setInitiations(all.slice(0, 5));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const statCards = [
        { label: 'Permohonan Pending', value: stats.pending, icon: FileText, bg: 'bg-stat-pending', color: 'text-orange-600' },
        { label: 'Disetujui', value: stats.approved, icon: CheckCircle, bg: 'bg-stat-approved', color: 'text-green-600' },
        { label: 'Ditolak', value: stats.rejected, icon: XCircle, bg: 'bg-stat-rejected', color: 'text-red-600' },
        { label: 'Menunggu Persetujuan', value: stats.pending, icon: Clock, bg: 'bg-stat-waiting', color: 'text-orange-600' },
    ];

    const pipelineItems = [
        { label: 'Diajukan', count: initiations.length, color: 'bg-brand-500' },
        { label: 'Menunggu TL', count: stats.pending, color: 'bg-warning' },
        { label: 'Disetujui TL', count: stats.approved, color: 'bg-success' },
        { label: 'Ditolak TL', count: stats.rejected, color: 'bg-error' },
        { label: 'Arsip', count: initiations.filter(i => i.status === 'approved' || i.status === 'rejected').length, color: 'bg-gray-400' },
    ];

    return (
        <div className="space-y-8">
            {/* Page Title — Figma: 24px Bold */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard Admin Inisiasi Perubahan</h1>
                    <p className="text-sm text-text-secondary mt-1">Kelola seluruh permohonan inisiasi perubahan</p>
                </div>
                <button onClick={fetchData} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-brand-500 border border-brand-200 rounded-lg hover:bg-brand-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {demoMode && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                    Mode demo — data contoh.
                </div>
            )}

            {loading ? (
                <>
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                    <div className="flex gap-8">
                        <div className="flex-1 space-y-4">
                            <SkeletonBlock className="h-10 w-48" />
                            <SkeletonBlock className="h-64" />
                        </div>
                        <div className="w-80 space-y-4">
                            <SkeletonBlock className="h-48" />
                            <SkeletonBlock className="h-48" />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Stats Grid — Figma: 4 cards row */}
                    <div className="grid grid-cols-4 gap-4">
                        {statCards.map((s, i) => (
                            <Card key={i}>
                                <div className={`${s.bg} p-3 rounded-lg w-fit`}>
                                    <s.icon className={s.color} size={24} strokeWidth={2} />
                                </div>
                                <p className="text-3xl font-bold text-text-primary mt-4">{s.value}</p>
                                <p className="text-sm text-text-secondary mt-1">{s.label}</p>
                                {i === 1 && stats.thisWeek > 0 && (
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-success-bg text-success text-[11px] font-medium rounded-full border border-success-border">
                                        +{stats.thisWeek} minggu ini
                                    </span>
                                )}
                            </Card>
                        ))}
                    </div>

                    {/* Latest Submissions + Sidebar Widgets — Figma: two columns */}
                    <div className="flex gap-8">
                        {/* Table */}
                        <div className="flex-1">
                            <Card padding={false}>
                                <div className="flex items-center justify-between px-8 py-6 border-b border-border">
                                    <h2 className="text-base font-bold text-text-primary">Permohonan Masuk Terbaru</h2>
                                    <button onClick={() => navigate('/monitoring-inisiasi')}
                                        className="text-sm text-brand-500 font-semibold flex items-center gap-1 hover:underline">
                                        Lihat Semua <ArrowRight size={16} />
                                    </button>
                                </div>
                                {initiations.length === 0 ? (
                                    <p className="text-center py-12 text-sm text-gray-400">Belum ada pengajuan</p>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-bg-page">
                                                <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">NO.</th>
                                                <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">PEMOHON</th>
                                                <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">BIDANG</th>
                                                <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">TGL MASUK</th>
                                                <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">STATUS</th>
                                                <th className="text-left text-xs font-bold text-text-secondary uppercase tracking-wider px-6 py-4">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {initiations.slice(0, 5).map((row) => (
                                                <tr key={row.id} className="border-b border-gray-50 hover:bg-bg-hover transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-brand-500">{row.doc_number}</td>
                                                    <td className="px-6 py-4 text-sm text-text-primary">{row.initiator?.name ?? '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-text-secondary">{row.field?.name ?? '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-text-secondary">{row.initiation_date ?? '-'}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                                                    <td className="px-6 py-4">
                                                        <button className="text-sm text-brand-500 hover:underline font-bold">Detail</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </Card>
                        </div>

                        {/* Sidebar Widgets — Figma: 215px */}
                        <div className="w-[215px] space-y-8">
                            {/* Status Pipeline */}
                            <Card>
                                <h3 className="text-sm font-bold text-text-primary mb-6">Status Pipeline</h3>
                                <div className="space-y-4">
                                    {pipelineItems.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-[10px] h-[10px] rounded-full ${item.color}`} />
                                                <span className="text-sm text-text-secondary">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-bold text-text-primary">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>


                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
