import React, { useEffect, useState, useRef } from "react"
import {
  Hash,
  Building2,
  Briefcase,
  Shield,
  ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { getProfile, updateProfile, uploadPhoto } from "../../api/profile"
import { useAuth } from "../../context/AuthContext"
import { SkeletonBlock, SkeletonLine } from "../../components/ui/Skeleton"

export default function ProfilSaya() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)

  const [form, setForm] = useState({
    name: "", email: "", phone: "", nip: "", rank: "", position: "", field: "",
  })

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await getProfile()
        setProfile(data)
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          nip: data.nip ?? "",
          rank: data.rank ?? "",
          position: data.position ?? "",
          field: data.team?.field?.name ?? "",
        })
      } catch (err) {
        setError(err.response?.data?.message || "Gagal memuat profil")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await updateProfile({ phone: form.phone, position: form.position, rank: form.rank })
      const fresh = await getProfile()
      setProfile(fresh)
      showToast("success", "Profil berhasil diperbarui")
    } catch (err) {
      showToast("error", err.response?.data?.message || "Gagal memperbarui profil")
    } finally {
      setSaving(false)
    }
  }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhotoLoading(true)
      const fd = new FormData()
      fd.append("photo", file)
      await uploadPhoto(fd)
      const fresh = await getProfile()
      setProfile(fresh)
      showToast("success", "Foto profil berhasil diunggah")
    } catch (err) {
      showToast("error", err.response?.data?.message || "Gagal mengunggah foto")
    } finally {
      setPhotoLoading(false)
    }
  }

  // Loading — skeleton
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-36 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-56" />
        </div>
        <SkeletonBlock className="h-32 w-full mb-6" />
        <SkeletonBlock className="h-80 w-full" />
      </main>
    )
  }

  // Error
  if (error && !profile) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-xs text-gray-400">Kelola informasi profil dan foto Anda</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Foto + Info Ringkas */}
      <div className="rounded-2xl border border-gray-200 bg-white mb-6 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt="Foto Profil"
                className="w-24 h-24 rounded-2xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-brand-100 flex items-center justify-center">
                <ImageIcon size={32} className="text-brand-400" />
              </div>
            )}
            {photoLoading && (
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{form.name}</h2>
            <p className="text-sm text-gray-500">{form.field || "-"}</p>
            <p className="text-xs text-gray-400">{form.email}</p>
          </div>
          <div className="sm:ml-auto">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Upload size={14} />
              {profile?.photo_url ? "Ganti Foto" : "Upload Foto"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} ref={fileInputRef} />
            </label>
          </div>
        </div>
      </div>

      {/* Form Data Diri */}
      <form onSubmit={handleSave}>
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Data Diri</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                <Briefcase size={14} className="text-gray-400 shrink-0" />
                <input value={form.name} readOnly className="w-full bg-transparent text-sm text-gray-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                <Hash size={14} className="text-gray-400 shrink-0" />
                <input value={form.email} readOnly className="w-full bg-transparent text-sm text-gray-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">NIP</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                <Hash size={14} className="text-gray-400 shrink-0" />
                <input value={form.nip} readOnly className="w-full bg-transparent text-sm text-gray-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bidang</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                <input value={form.field} readOnly className="w-full bg-transparent text-sm text-gray-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pangkat / Golongan</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5">
                <Shield size={14} className="text-gray-400 shrink-0" />
                <input
                  value={form.rank}
                  onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
                  className="w-full bg-transparent text-sm text-gray-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jabatan</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5">
                <Briefcase size={14} className="text-gray-400 shrink-0" />
                <input
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="w-full bg-transparent text-sm text-gray-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">No. Telepon</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5">
                <Hash size={14} className="text-gray-400 shrink-0" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-transparent text-sm text-gray-800 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-8 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </main>
  )
}
