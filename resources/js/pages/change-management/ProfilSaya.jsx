import React, { useState, useRef, useEffect } from "react"
import axios from "axios" 
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
  Trash2
} from "lucide-react"
import { useAuth } from "../../context/AuthContext" 

export default function ProfilSaya() {
  const { user } = useAuth() 

  const roleKey = user?.roles?.[0]
  const roleLabel = roleKey === 'kepala_tim' ? 'Team Lead' : (roleKey ?? 'WFH Admin')

  // State Data Profil
  const [profileData, setProfileData] = useState({
    nama: "",
    email: "",
    telpon: "",
    nip: "",
    pangkat: "",
    jabatan: "",
    bidang: "",
  })

  const [loading, setLoading] = useState(true) 
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef(null)

  // 🛠️ HELPER: Memastikan URL Gambar Menuju ke Storage Laravel
  const getFullImageUrl = (url) => {
    if (!url) return null;
    
    // Jika berupa Blob local atau URL eksternal penuh
    if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // Bersihkan slash di awal
    let path = url.startsWith("/") ? url : `/${url}`;

    // Otomatis tambahkan /storage jika backend hanya memberikan path folder (contoh: /signatures/xxx.jpg)
    if (!path.startsWith("/storage/")) {
      path = `/storage${path}`;
    }

    return `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const response = await axios.get("/api/profile")
        const resData = response.data.data || response.data

        setProfileData({
          nama: resData.name || resData.nama || "",
          email: resData.email || "",
          telpon: resData.phone || resData.telpon || "",
          nip: resData.nip || "",
          pangkat: resData.rank || resData.pangkat || "",
          jabatan: resData.position || resData.jabatan || "",
          bidang: resData.department || resData.bidang || "",
        })

        const rawSignature = resData.signature_url || resData.signature_path || resData.signature;
        if (rawSignature) {
          setSignaturePreview(getFullImageUrl(rawSignature))
        }
      } catch (err) {
        console.error("Gagal mengambil data profil:", err)
        setErrorMessage("Gagal mengambil data profil dari server.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const handleInputChange = (key, value) => {
    setProfileData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveChanges = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await axios.put("/api/profile", {
        name: profileData.nama,
        email: profileData.email,
        phone: profileData.telpon,
        nip: profileData.nip,
        rank: profileData.pangkat,
        position: profileData.jabatan,
        department: profileData.bidang,
      })

      setNotificationMessage("Perubahan profil berhasil disimpan!")
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } catch (err) {
      console.error("Gagal menyimpan profil:", err)
      setErrorMessage("Gagal menyimpan perubahan ke server. Periksa koneksi Anda.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resizeImageIfNeeded = (file, maxPx = 1500) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxPx) {
              height = Math.round((height * maxPx) / width)
              width = maxPx
            }
          } else {
            if (height > maxPx) {
              width = Math.round((width * maxPx) / height)
              height = maxPx
            }
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")

          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, width, height)

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(resizedFile)
            },
            "image/jpeg",
            0.95
          )
        }
      }
    })
  }

  const handleFileChange = async (event) => {
    const rawFile = event.target.files[0]
    if (!rawFile) return

    if (!rawFile.type.startsWith("image/")) {
      setErrorMessage("File harus berupa gambar (PNG, JPG, atau JPEG)!")
      return
    }

    setErrorMessage("")
    
    // 🖼️ LANGSUNG TAMPILKAN PREVIEW LOKAL (Pasti muncul tanpa nunggu server)
    const objectUrl = URL.createObjectURL(rawFile)
    setSignaturePreview(objectUrl)

    setIsUploadingSignature(true)

    try {
      const fileToUpload = await resizeImageIfNeeded(rawFile, 1500)

      const formData = new FormData()
      formData.append("signature", fileToUpload)

      const response = await axios.post("/api/profile/signature", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const resSignature = response.data?.data?.signature_url || response.data?.signature_url || response.data?.data?.path || response.data?.path
      
      if (resSignature) {
        setSignaturePreview(getFullImageUrl(resSignature))
      }

      setNotificationMessage("Tanda tangan digital berhasil diunggah!")
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } catch (err) {
      console.error("Gagal mengunggah tanda tangan:", err)
      const apiErrorMsg = err.response?.data?.errors?.signature?.[0] || err.response?.data?.message
      setErrorMessage(apiErrorMsg || "Gagal mengunggah tanda tangan ke server.")
    } finally {
      setIsUploadingSignature(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveSignature = async () => {
    setIsUploadingSignature(true)
    setErrorMessage("")

    try {
      await axios.post("/api/profile/signature", { 
        _method: "DELETE",
        action: "delete" 
      })

      setSignaturePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      setNotificationMessage("Tanda tangan digital berhasil dihapus!")
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } catch (err) {
      console.error("Gagal menghapus tanda tangan:", err)
      const apiErrorMsg = err.response?.data?.message
      setErrorMessage(apiErrorMsg || "Gagal menghapus tanda tangan dari server.")
    } finally {
      setIsUploadingSignature(false)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Memuat data profil...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 md:py-8">
      
      {showNotification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-lg bg-emerald-500 px-4 py-3 text-white shadow-lg animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">{notificationMessage}</span>
        </div>
      )}

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

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="flex flex-col items-center text-center">
              {user?.photo_url ? (
                  <img src={user.photo_url} alt="Profile" className="h-24 w-24 rounded-full object-cover shadow-sm" />
              ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white select-none">
                    {profileData.nama ? profileData.nama.charAt(0).toUpperCase() : "U"}
                  </div>
              )}
              
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
                { icon: Shield, label: "Peran", value: roleLabel } 
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
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Section Tanda Tangan Digital */}
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
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
            />

            <div 
              onClick={() => !isUploadingSignature && fileInputRef.current?.click()}
              className="flex h-24 w-32 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-500 transition-all cursor-pointer overflow-hidden relative"
            >
              {isUploadingSignature ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              ) : signaturePreview ? (
                <img 
                  src={signaturePreview} 
                  alt="Tanda Tangan" 
                  className="h-full w-full object-contain p-1"
                />
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
                  ? "Tanda tangan digital tersimpan di server. Klik tombol di bawah untuk mengganti atau menghapus." 
                  : "Upload berkas tanda tangan (.png/.jpg). Sistem akan otomatis menyesuaikan ukuran dan memberi latar belakang putih solid."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isUploadingSignature}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {signaturePreview ? "Ganti" : "Upload Gambar"}
                </button>
                {signaturePreview && (
                  <button
                    type="button"
                    disabled={isUploadingSignature}
                    onClick={handleRemoveSignature}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
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