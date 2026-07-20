import React, { useState, useEffect, useCallback } from "react"
import { Shield, CheckCircle2, XCircle, Save, Loader2, RefreshCw, Search } from "lucide-react"
import { getRoles, getPermissions, updateRolePermissions } from "../../api/admin"
import { SkeletonTable, SkeletonBlock } from "../../components/ui/Skeleton"

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  kepala_bidang: 'bg-blue-100 text-blue-700',
  kepala_tim: 'bg-cyan-100 text-cyan-700',
  staf: 'bg-gray-100 text-gray-700',
}

const ROLE_LABELS = {
  admin: 'Admin',
  kepala_bidang: 'Kepala Bidang',
  kepala_tim: 'Kepala Tim',
  staf: 'Staf',
}

export default function ManajemenRole() {
  const [roles, setRoles] = useState([])
  const [allPerms, setAllPerms] = useState([])
  const [selected, setSelected] = useState(null) // role id
  const [editedPerms, setEditedPerms] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getPermissions(),
      ])
      setRoles(rolesData || [])
      setAllPerms(permsData || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data role & permissions')
      setRoles([])
      setAllPerms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSelect = (role) => {
    if (selected === role.id) return
    setSelected(role.id)
    setEditedPerms(new Set(role.permissions || []))
    setSearch('')
  }

  const togglePerm = (permName) => {
    setEditedPerms((prev) => {
      const next = new Set(prev)
      if (next.has(permName)) next.delete(permName)
      else next.add(permName)
      return next
    })
  }

  const handleSave = async () => {
    if (!selected) return
    try {
      setSaving(true)
      const res = await updateRolePermissions(selected, [...editedPerms])
      // Update local roles state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selected ? { ...r, permissions: [...editedPerms] } : r
        )
      )
      showToast('success', res.message || 'Permissions berhasil diperbarui')
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Gagal memperbarui permissions')
    } finally {
      setSaving(false)
    }
  }

  const selectedRole = roles.find((r) => r.id === selected)
  const isProtected = selectedRole?.name === 'admin'
  const protectedPerms = ['role.manage', 'permission.manage', 'user.manage']

  const filteredPerms = selected
    ? allPerms.filter(
        (p) =>
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase())
      )
    : []

  // Group permissions by domain
  const groupedPerms = {}
  filteredPerms.forEach((p) => {
    const domain = p.name.split('.')[0] || 'other'
    if (!groupedPerms[domain]) groupedPerms[domain] = []
    groupedPerms[domain].push(p)
  })

  // ========== Skeleton ==========
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-56 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <SkeletonBlock className="h-12 w-full mb-3" />
            <SkeletonTable rows={4} cols={2} />
          </div>
          <div className="lg:col-span-3">
            <SkeletonBlock className="h-12 w-full mb-3" />
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Role & Permissions</h1>
          <p className="text-xs text-gray-400">Kelola permission setiap role pengguna</p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left — Role list */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roles</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleSelect(role)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selected === role.id ? 'bg-brand-50 border-l-2 border-brand-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={
                      role.name === 'admin' ? 'text-purple-500' :
                      role.name === 'kepala_bidang' ? 'text-blue-500' :
                      role.name === 'kepala_tim' ? 'text-cyan-500' : 'text-gray-400'
                    } />
                    <p className="text-xs font-bold text-gray-900">
                      {ROLE_LABELS[role.name] || role.name}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 ml-6">
                    {role.permissions?.length || 0} permission(s)
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Permission grid */}
        <div className="lg:col-span-3">
          {!selectedRole ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Pilih role dari daftar untuk mengelola permissions.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {ROLE_LABELS[selectedRole.name] || selectedRole.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedRole.permissions?.length || 0} permission saat ini
                    {isProtected && (
                      <span className="ml-2 text-amber-600 font-medium">
                        (beberapa permission dilindungi)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari permission..."
                      className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-48"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan
                  </button>
                </div>
              </div>

              {/* Permission groups */}
              <div className="p-5 max-h-[600px] overflow-y-auto">
                {Object.keys(groupedPerms).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Tidak ada permission ditemukan.</p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(groupedPerms).sort().map(([domain, perms]) => (
                      <div key={domain}>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
                          {domain}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {perms.sort((a, b) => a.name.localeCompare(b.name)).map((perm) => {
                            const isChecked = editedPerms.has(perm.name)
                            const isProtectedPerm = isProtected && protectedPerms.includes(perm.name)
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-brand-50 text-brand-800'
                                    : 'text-gray-600 hover:bg-gray-50'
                                } ${isProtectedPerm ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isProtectedPerm}
                                  onChange={() => togglePerm(perm.name)}
                                  className="accent-brand-600 rounded"
                                />
                                <span className="font-medium">{perm.name}</span>
                                {isProtectedPerm && (
                                  <span className="text-[9px] text-amber-600 ml-auto font-semibold">terlindungi</span>
                                )}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
