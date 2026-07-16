import React, { useState, useRef, useEffect } from "react"
import {
  Hash,
  Building2,
  Briefcase,
  Shield,
  ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

// Data Default jika localStorage masih kosong
const defaultProfile = {
  nama: "Susanti",
  email: "Susanti@jatimprov.go.id",
  telpon: "0895377689890",
  nip: "1985021520100112002",
  pangkat: "Penata Tingkat 1",
  jabatan: "Administrator WFH",
  bidang: "Bidang Aplikasi",
}

export default function ProfilSaya() {
  // 1. AMBIL DATA DARI LOCAL STORAGE (Jika ada) saat pertama kali load
  const [profileData, setProfileData] = useState(() => {
    const savedData = localStorage.getItem("user_profile")
    return savedData ? JSON.parse(savedData) : defaultProfile
  })

  const [signaturePreview, setSignaturePreview] = useState(() => {
    return localStorage.getItem("user_signature") || null
  })

  const [showNotification, setShowNotification] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef(null)

  const handleInputChange = (key, value) => {
    setProfileData((prev) => ({ ...prev, [key]: value }))
  }

  // 2. SIMPAN DATA PROFIL KE LOCAL STORAGE SAAT TOMBOL DIKLIK
  const handleSaveChanges = (e) => {
    e.preventDefault()
    localStorage.setItem("user_profile", JSON.stringify(profileData))
    
    setErrorMessage("")
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  // 3. VALIDASI DAN PROSES UPLOAD TANDA TANGAN
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validasi tipe file (Harus gambar)
    if (!file.type.startsWith("image/")) {
      setErrorMessage("File harus berupa gambar (PNG, JPG, atau JPEG)!")
      return
    }

    // Validasi ukuran file (Maksimal 2MB)
    const maxSizeInBytes = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSizeInBytes) {
      setErrorMessage("Ukuran file terlalu besar! Maksimal 2MB.")
      return
    }

    // Bersihkan error jika validasi lolos
    setErrorMessage("")

    // Konversi gambar ke Base64 agar bisa disimpan di localStorage
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setSignaturePreview(base64String)
      localStorage.setItem("user_signature", base64String) // Simpan TTD di browser
    }
    reader.readAsDataURL(file)
  }

  // Fungsi untuk menghapus tanda tangan
  const handleRemoveSignature = () => {
    setSignaturePreview(null)
    localStorage.removeItem("user_signature")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      
      {/* Toast Notification Sukses */}
      {showNotification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-lg bg-emerald-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Perubahan profil berhasil disimpan!</span>
        </div>
      )}

      {/* Alert Error Validation */}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full">
        
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Profil Saya
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">

          {/* CARD RINGKASAN PROFIL */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white select-none">
                {profileData.nama ? profileData.nama.charAt(0).toUpperCase() : "U"}
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">{profileData.nama}</h2>
              <p className="mt-1 text-sm font-medium text-gray-600">{profileData.jabatan}</p>
              <p className="text-xs text-gray-400">{profileData.bidang}</p>
              <span className="mt-3 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 select-none">
                {profileData.pangkat}
              </span>
            </div>

            <hr className="my-6 border-gray-100" />

            <ul className="space-y-4">
              {[
                { icon: Hash, label: "NIP", value: profileData.nip },
                { icon: Building2, label: "Bidang", value: profileData.bidang },
                { icon: Briefcase, label: "Jabatan", value: profileData.jabatan },
                { icon: Shield, label: "Peran", value: "WFH Admin" }
              ].map((info, idx) => {
                const Icon = info.icon
                return (
                  <li key={idx} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{info.label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{info.value}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* FORM EDIT PROFIL */}
          <section className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Edit Informasi Profil
              </h2>
              <p className="text-xs text-gray-400">Perbarui Data Profil Anda</p>
            </div>

            <form onSubmit={handleSaveChanges} className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 items-end">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Nama Lengkap</label>
                <input
                  type="text"
                  value={profileData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Email Dinas</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">No Telpon</label>
                <input
                  type="text"
                  value={profileData.telpon}
                  onChange={(e) => handleInputChange("telpon", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">NIP</label>
                <input
                  type="text"
                  value={profileData.nip}
                  onChange={(e) => handleInputChange("nip", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Pangkat/Golongan</label>
                <input
                  type="text"
                  value={profileData.pangkat}
                  onChange={(e) => handleInputChange("pangkat", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Jabatan</label>
                <input
                  type="text"
                  value={profileData.jabatan}
                  onChange={(e) => handleInputChange("jabatan", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Bidang/Unit Kerja</label>
                <input
                  type="text"
                  value={profileData.bidang}
                  onChange={(e) => handleInputChange("bidang", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  required
                />
              </div>
              
              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 shadow-sm cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* SEKSI TANDA TANGAN DIGITAL */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tanda Tangan Digital
            </h2>
            <p className="text-xs text-gray-400">
              Upload tanda tangan untuk persetujuan resmi
            </p>
          </div>

          <hr className="mb-6 border-gray-100" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current.click()}
              className="flex h-20 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-500 transition-all cursor-pointer overflow-hidden"
            >
              {signaturePreview ? (
                <img src={signaturePreview} alt="Preview TTD" className="h-full w-full object-contain p-1" />
              ) : (
                <>
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-[10px] font-medium">Upload TTD</span>
                </>
              )}
            </div>
            
            <div className="flex flex-col items-center sm:items-start">
              <p className="mb-3 text-sm text-gray-500 max-w-md">
                {signaturePreview 
                  ? "Tanda tangan berhasil disimpan secara lokal! Klik tombol di bawah untuk mengganti atau menghapus." 
                  : "Tanda tangan akan disimpan di memori browser dan siap digunakan untuk simulasi dokumen."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 shadow-sm cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  {signaturePreview ? "Ganti" : "Upload Gambar"}
                </button>
                {signaturePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}