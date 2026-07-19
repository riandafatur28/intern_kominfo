import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { demoInitiations } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../common/StatusBadge';
import Card from './Card';
import Button from './Button';

const actionConfig = {
    draft: [{ label: 'Submit ke Approver', action: 'submit', variant: 'primary' }],
    pending: [
        { label: 'Setujui', action: 'approve', variant: 'success' },
        { label: 'Tolak', action: 'reject', variant: 'danger' },
    ],
    rejected: [{ label: 'Revisi (Kembali ke Draft)', action: 'revise', variant: 'primary' }],
};

export default function DetailPermohonan({ id, open, onClose, onActionDone }) {
    const { demoMode } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    useEffect(() => {
        if (!open || !id) return;
        setLoading(true);
        setError(null);
        setShowRejectInput(false);
        setRejectReason('');

        const fetchDetail = async () => {
            try {
                const res = await changesApi.getInitiation(id);
                setData(res.data.data);
            } catch {
                if (demoMode) {
                    const found = demoInitiations.find((i) => i.id === id);
                    if (found) setData(found);
                    else setError('Data tidak ditemukan');
                } else {
                    setError('Gagal memuat detail');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, open, demoMode]);

    const handleAction = async (action) => {
        setActionLoading(action);
        setError(null);
        try {
            if (action === 'reject' && !rejectReason.trim()) {
                setError('Alasan penolakan wajib diisi');
                setActionLoading(null);
                return;
            }

            if (demoMode) {
                // Simulate success in demo mode
                await new Promise((r) => setTimeout(r, 500));
                setData((prev) => ({
                    ...prev,
                    status: action === 'submit' ? 'pending'
                        : action === 'approve' ? 'approved'
                        : action === 'reject' ? 'rejected'
                        : 'draft',
                    reviewer: action === 'approve' || action === 'reject' ? { name: 'Budi Santoso' } : prev.reviewer,
                    review_reason: action === 'reject' ? rejectReason : null,
                }));
            } else {
                if (action === 'submit') await changesApi.submitInitiation(id);
                else if (action === 'approve') await changesApi.approveInitiation(id);
                else if (action === 'reject') await changesApi.rejectInitiation(id, rejectReason);
                else if (action === 'revise') await changesApi.reviseInitiation(id);
                const res = await changesApi.getInitiation(id);
                setData(res.data.data);
            }

            setShowRejectInput(false);
            setRejectReason('');
            if (onActionDone) onActionDone();
        } catch (err) {
            setError(err.response?.data?.message || `Gagal ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-[720px] max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-text-primary">Detail Permohonan</h2>
                        {data && <StatusBadge status={data.status} />}
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-brand-500" />
                        </div>
                    ) : error && !data ? (
                        <p className="text-center py-16 text-sm text-error">{error}</p>
                    ) : data ? (
                        <>
                            {error && (
                                <div className="flex items-start gap-3 p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-brand-500 font-medium mb-1">{data.doc_number}</p>
                                <h3 className="text-xl font-bold text-text-primary">{data.description}</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-y-5 gap-x-8">
                                {[
                                    { label: 'Bidang', value: data.field?.name ?? '-' },
                                    { label: 'Inisiator', value: data.initiator?.name ?? '-' },
                                    { label: 'Tanggal Inisiasi', value: data.initiation_date ?? '-' },
                                    { label: 'Dibutuhkan Tanggal', value: data.needed_by_date ?? '-' },
                                    { label: 'Status Review', value: data.review_status ?? '-' },
                                    { label: 'Reviewer', value: data.reviewer?.name ?? '-' },
                                    { label: 'Latar Belakang', value: data.reason ?? '-', full: true },
                                    { label: 'Alasan Review', value: data.review_reason ?? '-', full: true },
                                ].map((f, i) => (
                                    <div key={i} className={f.full ? 'col-span-3' : ''}>
                                        <p className="text-xs text-text-secondary mb-1">{f.label}</p>
                                        <p className="text-sm font-semibold text-text-primary">{f.value}</p>
                                    </div>
                                ))}
                            </div>

                            {data.implementations?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-text-primary mb-4">Implementasi</h4>
                                    {data.implementations.map((impl) => (
                                        <div key={impl.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                                            <p className="text-sm font-semibold">Prioritas: {impl.priority || '-'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Status: {impl.status}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showRejectInput && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                                    <label className="text-xs font-medium text-orange-800 block">
                                        Alasan Penolakan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        rows={3} placeholder="Masukkan alasan penolakan..."
                                        className="w-full border border-orange-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <Button variant="danger" onClick={() => handleAction('reject')} loading={actionLoading === 'reject'}>
                                            Konfirmasi Tolak
                                        </Button>
                                        <Button variant="secondary" onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {data && !showRejectInput && (actionConfig[data.status] || []).length > 0 && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between rounded-b-2xl">
                        <div />
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={onClose}>Tutup</Button>
                            {(actionConfig[data.status] || []).map((btn) => (
                                <Button key={btn.action} variant={btn.variant}
                                    onClick={() => btn.action === 'reject' ? setShowRejectInput(true) : handleAction(btn.action)}
                                    loading={actionLoading === btn.action}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
