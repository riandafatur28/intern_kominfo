import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { createUser, getRoles, getTeams } from '../../api/admin';

const emptyForm = {
    name: '',
    nip: '',
    email: '',
    team_id: '',
    rank: '',
    position: '',
    phone: '',
    password: '',
    roles: [],
};

export default function TambahPenggunaModal({ open, onClose, onSuccess }) {
    const [form, setForm] = useState(emptyForm);
    const [teams, setTeams] = useState([]);
    const [roles, setRoles] = useState([]);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        if (!open) return;
        // reset when opened
        setForm(emptyForm);
        setErrors({});
        setGeneralError('');
        setLoadingOptions(true);
        Promise.all([getTeams().catch(() => []), getRoles().catch(() => [])])
            .then(([teamsData, rolesData]) => {
                setTeams(teamsData || []);
                setRoles(rolesData || []);
                // default role = staf if available
                const staf = (rolesData || []).find((r) => r.name === 'staf');
                if (staf) setForm((f) => ({ ...f, roles: ['staf'] }));
            })
            .finally(() => setLoadingOptions(false));
    }, [open]);

    const setField = (key, value) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const toggleRole = (roleName) => {
        setForm((f) => ({
            ...f,
            roles: f.roles.includes(roleName)
                ? f.roles.filter((r) => r !== roleName)
                : [...f.roles, roleName],
        }));
        setErrors((e) => ({ ...e, roles: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setGeneralError('');
        setErrors({});

        const payload = {
            name: form.name,
            nip: form.nip,
            email: form.email,
            team_id: form.team_id || null,
            rank: form.rank || null,
            position: form.position || null,
            phone: form.phone || null,
            password: form.password,
            roles: form.roles,
        };

        try {
            await createUser(payload);
            onSuccess?.();
            onClose();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setGeneralError(err.response?.data?.message || 'Gagal menambah pengguna.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const fieldError = (key) => errors[key]?.[0];

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tambah Pengguna"
            width="max-w-2xl"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="tambah-pengguna-form"
                        disabled={submitting || loadingOptions}
                        className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </>
            }
        >
            {generalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {generalError}
                </div>
            )}

            <form id="tambah-pengguna-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Lengkap" required error={fieldError('name')}>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className={inputCls(fieldError('name'))}
                        placeholder="Nama pegawai"
                        required
                    />
                </Field>

                <Field label="NIP" required error={fieldError('nip')}>
                    <input
                        type="text"
                        value={form.nip}
                        onChange={(e) => setField('nip', e.target.value)}
                        className={inputCls(fieldError('nip'))}
                        placeholder="Nomor Induk Pegawai"
                        required
                    />
                </Field>

                <Field label="Email" required error={fieldError('email')}>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className={inputCls(fieldError('email'))}
                        placeholder="nama@kominfo.go.id"
                        required
                    />
                </Field>

                <Field label="Password" required error={fieldError('password')}>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setField('password', e.target.value)}
                        className={inputCls(fieldError('password'))}
                        placeholder="Minimal 8 karakter"
                        required
                    />
                </Field>

                <Field label="Tim" error={fieldError('team_id')}>
                    <select
                        value={form.team_id}
                        onChange={(e) => setField('team_id', e.target.value)}
                        className={inputCls(fieldError('team_id'))}
                    >
                        <option value="">— Pilih Tim —</option>
                        {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}{t.field ? ` (${t.field.name})` : ''}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Jabatan" error={fieldError('position')}>
                    <input
                        type="text"
                        value={form.position}
                        onChange={(e) => setField('position', e.target.value)}
                        className={inputCls(fieldError('position'))}
                        placeholder="Contoh: Staf"
                    />
                </Field>

                <Field label="Pangkat" error={fieldError('rank')}>
                    <input
                        type="text"
                        value={form.rank}
                        onChange={(e) => setField('rank', e.target.value)}
                        className={inputCls(fieldError('rank'))}
                        placeholder="Contoh: Penata Muda"
                    />
                </Field>

                <Field label="No. Telepon" error={fieldError('phone')}>
                    <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        className={inputCls(fieldError('phone'))}
                        placeholder="08xxxxxxxxxx"
                    />
                </Field>

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {roles.map((r) => {
                            const active = form.roles.includes(r.name);
                            return (
                                <button
                                    type="button"
                                    key={r.id}
                                    onClick={() => toggleRole(r.name)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        active
                                            ? 'bg-indigo-500 border-indigo-500 text-white'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {r.name}
                                </button>
                            );
                        })}
                        {loadingOptions && <span className="text-sm text-gray-400">Memuat role...</span>}
                    </div>
                    {fieldError('roles') && <p className="text-red-500 text-xs mt-1">{fieldError('roles')}</p>}
                </div>
            </form>
        </Modal>
    );
}

function inputCls(hasError) {
    return `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
        hasError
            ? 'border-red-300 focus:ring-red-200'
            : 'border-gray-200 focus:ring-blue-500 focus:border-transparent'
    }`;
}

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
