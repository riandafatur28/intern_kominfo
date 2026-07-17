import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { changesApi } from '../../api/changes';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

export default function FormInisiasi({ open, onClose, onCreated }) {
    const { demoMode } = useAuth();
    const [form, setForm] = useState({
        field_id: '',
        needed_by_date: '',
        description: '',
        reason: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (demoMode) {
                await new Promise((r) => setTimeout(r, 500));
            } else {
                await changesApi.createInitiation(form);
            }
            onCreated();
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal membuat inisiasi';
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors)[0]?.[0] || msg : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Buat Inisiasi Baru"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button type="submit" form="form-inisiasi" loading={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Draft'}
                    </Button>
                </div>
            }
        >
            <form id="form-inisiasi" onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="flex items-start gap-3 p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
                    </div>
                )}

                <Input label="Bidang" name="field_id" value={form.field_id} onChange={handleChange}
                    placeholder="Masukkan ID Bidang" required
                />
                <Input label="Dibutuhkan Tanggal" type="date" name="needed_by_date"
                    value={form.needed_by_date} onChange={handleChange} required
                />
                <div className="space-y-1.5">
                    <label className="text-xs text-text-secondary block font-medium">
                        Deskripsi Perubahan <span className="text-red-500">*</span>
                    </label>
                    <textarea name="description" value={form.description} onChange={handleChange}
                        placeholder="Jelaskan perubahan yang diajukan..." required rows={4}
                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 resize-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs text-text-secondary block font-medium">
                        Alasan / Latar Belakang <span className="text-red-500">*</span>
                    </label>
                    <textarea name="reason" value={form.reason} onChange={handleChange}
                        placeholder="Jelaskan alasan perubahan diperlukan..." required rows={3}
                        className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 resize-none"
                    />
                </div>
            </form>
        </Modal>
    );
}
