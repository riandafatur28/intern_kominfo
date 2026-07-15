import { useState } from "react";
import {
  LayoutDashboard,
  Camera,
  FileText,
  Layers,
  User,
  LogOut,
  X,
  Menu,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Absensi WFH", icon: Camera, active: false },
  { label: "Laporan Kegiatan", icon: FileText, active: false },
  { label: "Inisiasi Perubahan", icon: Layers, active: false },
  { label: "Profil Saya", icon: User, active: false },
];

const stats = [
  { title: "Absensi bulan ini", value: "10", sub: "Dari 25 hari kerja" },
  { title: "Laporan terkirim", value: "5", sub: "Bulan Juli 2025" },
  { title: "Perubahan diinisiasi", value: "3", sub: "1 Menunggu persetujuan" },
  { title: "Persetujuan selesai", value: "2", sub: "Bulan ini" },
];

const activities = [
  { time: "07.30", text: "Absensi pagi berhasil terkirim" },
  {
    time: "11.50",
    text: 'Laporan kegiatan "Review UI Dashboard" disimpan sebagai draf',
  },
  { time: "13.00", text: 'Inisiasi perubahan "Fitur Export PDF" diajukan' },
  { time: "15.35", text: 'Persetujuan "Update Endpoint API" telah disetujui' },
];

const modules = [
  {
    title: "Absensi WFH",
    desc: "Unggah foto WFH hari ini",
    icon: Camera,
    iconBg: "bg-[#22c55e]",
    hoverBorder: "hover:border-[#22c55e]",
  },
  {
    title: "Laporan Kegiatan",
    desc: "Catat kegiatan anda hari ini",
    icon: FileText,
    iconBg: "bg-[#fb7185]",
    hoverBorder: "hover:border-[#fb7185]",
  },
  {
    title: "Inisiasi Perubahan",
    desc: "Ajukan perubahan Sistem",
    icon: Layers,
    iconBg: "bg-[#fbbf24]",
    hoverBorder: "hover:border-[#fbbf24]",
  },
];

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6">
          <div className="flex w-full flex-col items-center gap-1">
            <img
              src="/kominfo-jatim-logo.png"
              alt="Logo KOMINFO JATIM"
              className="h-16 w-auto object-contain"
            />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role pill */}
        <div className="flex justify-center border-b border-slate-100 px-6 py-4">
          <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-6 py-1 text-xs font-medium text-[#2563eb]">
            Pegawai
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-4" aria-label="Menu utama">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href="#"
                aria-current={item.active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#eff6ff] text-[#2563eb]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
              S
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                Susanti
              </p>
              <p className="truncate text-xs text-slate-400">Bidang Aplikasi</p>
            </div>
          </div>
          <button className="mt-3 flex items-center gap-2 text-sm font-medium text-red-500 transition-colors hover:text-red-600">
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stat cards                                                          */
/* ------------------------------------------------------------------ */

function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-semibold text-slate-700">{stat.title}</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{stat.value}</p>
          <p className="mt-2 text-xs text-slate-400">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity list                                                       */
/* ------------------------------------------------------------------ */

function ActivityList() {
  return (
    <section>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-800">
          Aktivitas hari ini
        </h2>
        <span className="text-sm font-bold text-slate-800">
          Rabu, 9 Juli 2026
        </span>
      </div>

      <ul>
        {activities.map((activity) => (
          <li
            key={activity.time}
            className="flex items-start gap-6 border-b border-slate-200 py-3.5"
          >
            <span className="w-12 shrink-0 text-sm text-slate-400">
              {activity.time}
            </span>
            <span className="text-sm text-slate-600">{activity.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Module access                                                       */
/* ------------------------------------------------------------------ */

function ModuleAccess() {
  return (
    <section>
      <h2 className="text-sm font-bold tracking-wide text-slate-700">
        AKSES MODUL
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.title}
              className={`flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:shadow-md ${mod.hoverBorder}`}
            >
              <div>
                <p className="text-base font-bold text-slate-900">
                  {mod.title}
                </p>
                <p className="mt-1 text-sm text-slate-400">{mod.desc}</p>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mod.iconBg}`}
              >
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-4 lg:px-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1 text-sm text-[#2563eb]"
            aria-label="Breadcrumb"
          >
            <span>Beranda</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span>Pegawai</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span>Dashboard</span>
          </nav>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-10">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

          <div className="mt-6">
            <StatCards />
          </div>

          <div className="mt-8">
            <ActivityList />
          </div>

          <div className="mt-10">
            <ModuleAccess />
          </div>
        </main>
      </div>
    </div>
  );
}
