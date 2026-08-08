import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import PackageDetailView from "./components/PackageDetailView";
import DropdownMenu from "../../components/ui/DropdownMenu";
import { DownloadIcon, EyeIcon, MoreVerticalIcon } from "../../components/ui/AdminActionIcons";
import {
  listChangePackages,
  getChangePackage,
  getChangeInitiationPdfUrl,
  getChangeImplementationPdfUrl,
  type ChangePackage,
  type ChangeStatus,
  extractChangeError,
} from "../../api/changeManagement";
import { statusBadge, priorityBadge } from "./shared";
import { openPdfDirect } from "../../utils/swAuth";

type PageStatus = "loading" | "ready" | "error";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function AdminMonitoring() {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [packages, setPackages] = useState<ChangePackage[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChangeStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ChangePackage | null>(null);

  const PAGE_SIZE = 15;

  async function load() {
    setStatus("loading");
    setErrMsg("");
    try {
      const params: { per_page: number; status?: ChangeStatus } = { per_page: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await listChangePackages(params);
      setPackages(res.data);
      setStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat data monitoring."));
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // listChangePackages() is a light "summary" read (no attachment rows) so the table
  // stays cheap; fetch the full package (with lampiran) when a row is opened, same as
  // staf's detail view does via getChangePackage().
  async function handleViewDetail(id: number) {
    setErrMsg("");
    try {
      const res = await getChangePackage(id);
      setSelected(res.data);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat detail permohonan."));
    }
  }

  const counts = useMemo(() => {
    const c = { total: packages.length, pending: 0, approved: 0, rejected: 0 };
    for (const p of packages) {
      if (p.initiation.status === "pending") c.pending++;
      else if (p.initiation.status === "approved") c.approved++;
      else if (p.initiation.status === "rejected") c.rejected++;
    }
    return c;
  }, [packages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (p) =>
        p.initiation.doc_number.toLowerCase().includes(q) ||
        (p.initiation.initiator?.name ?? "").toLowerCase().includes(q)
    );
  }, [packages, search]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = new Date();

  if (selected) {
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: "Admin" }, { label: "Detail Permohonan" }]}>
        <button
          className="inline-flex items-center gap-1 text-[#256EEF] text-sm hover:underline mb-4"
          onClick={() => setSelected(null)}
        >
          <ArrowLeftIcon size={16} /> Kembali
        </button>
        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errMsg}</div>
        )}
        <PackageDetailView pkg={selected} />
        {selected.initiation.status === "approved" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => openPdfDirect(getChangeInitiationPdfUrl(selected.initiation.id), setErrMsg)}
            >
              <DownloadIcon size={17} /> Unduh PDF Inisiasi
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => openPdfDirect(getChangeImplementationPdfUrl(selected.initiation.id), setErrMsg)}
            >
              <DownloadIcon size={17} /> Unduh PDF Implementasi
            </Button>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: "Admin" }, { label: "Monitoring" }]}>
      <PageTitle
        title="Monitoring Inisiasi Perubahan"
        subtitle={`Total ${counts.total} permohonan • Bulan ${BULAN[now.getMonth()]} ${now.getFullYear()}`}
      />

      <div className="grid grid-cols-4 gap-5">
        <StatCard value={counts.total} label="Total" color="text-[#141D23]" />
        <StatCard value={counts.pending} label="Menunggu" color="text-yellow-600" />
        <StatCard value={counts.approved} label="Disetujui" color="text-green-600" />
        <StatCard value={counts.rejected} label="Ditolak" color="text-red-600" />
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-5 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari no. atau pemohon..."
          className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm min-w-[260px] flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ChangeStatus | "");
            setPage(1);
          }}
          className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draf</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        {status === "loading" ? (
          <div className="text-center py-12 text-sm text-[#767676]">Memuat...</div>
        ) : status === "error" ? (
          <div className="text-center py-12 text-sm text-red-500">{errMsg}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                <th className="text-left px-4 py-3 font-medium text-[#767676]">No. Permohonan</th>
                <th className="text-left px-4 py-3 font-medium text-[#767676]">Pemohon</th>
                <th className="text-left px-4 py-3 font-medium text-[#767676]">Bidang</th>
                <th className="text-left px-4 py-3 font-medium text-[#767676]">Tipe Perubahan</th>
                <th className="text-left px-4 py-3 font-medium text-[#767676]">Prioritas</th>
                <th className="text-left px-4 py-3 font-medium text-[#767676]">Status</th>
                <th className="text-right px-4 py-3 font-medium text-[#767676]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-[#767676]">
                    Tidak ada permohonan.
                  </td>
                </tr>
              )}
              {pageRows.map((p) => {
                const st = statusBadge(p.initiation.status);
                const prio = p.implementation ? priorityBadge(p.implementation.priority) : null;
                const typeNames = (p.implementation?.change_types ?? []).map((t) => t.name).join(", ");
                return (
                  <tr key={p.initiation.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[#333] font-medium">{p.initiation.doc_number}</td>
                    <td className="px-4 py-3">
                      <div className="text-[#333] font-medium">{p.initiation.initiator?.name ?? "-"}</div>
                      <div className="text-xs text-[#767676]">{p.initiation.field?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-[#333]">{p.initiation.field?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-[#333]">{typeNames || "-"}</td>
                    <td className="px-4 py-3">
                      {prio && (
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${prio.color}`}>
                          {prio.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        align="end"
                        trigger={
                          <button
                            type="button"
                            aria-label={`Aksi untuk ${p.initiation.doc_number}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#424655] hover:bg-[#F6FAFF]"
                          >
                            <MoreVerticalIcon size={18} />
                          </button>
                        }
                        items={[
                          { label: "Lihat Detail", icon: <EyeIcon size={16} />, onClick: () => handleViewDetail(p.initiation.id) },
                          ...(p.initiation.status === "approved"
                            ? [
                                { label: "Unduh PDF Inisiasi", icon: <DownloadIcon size={16} />, separator: true, onClick: () => openPdfDirect(getChangeInitiationPdfUrl(p.initiation.id), setErrMsg) },
                                { label: "Unduh PDF Implementasi", icon: <DownloadIcon size={16} />, onClick: () => openPdfDirect(getChangeImplementationPdfUrl(p.initiation.id), setErrMsg) },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-[#E0E9F2]">
            <Pagination currentPage={page} lastPage={lastPage} total={filtered.length} onPageChange={setPage} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-[10px] shadow-sm p-5">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-[#767676] mt-1">{label}</p>
    </div>
  );
}

function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}