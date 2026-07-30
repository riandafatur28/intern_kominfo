import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import { useAuth } from "../../hooks/useAuth";
import {
  getWfhMonitoring,
  type WfhMonitoringData,
  type MonitoringUser,
  extractWfhError,
} from "../../api/wfh";

type PageStatus = "loading" | "ready" | "error";

export default function WfhMonitoring() {
  const { user } = useAuth();

  const [status, setStatus] = useState<PageStatus>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [data, setData] = useState<WfhMonitoringData | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "not_checked_in" | "no_report">("all");

  useEffect(() => {
    loadData();
  }, [date, selectedTeam]);

  async function loadData() {
    setStatus("loading");
    setErrMsg("");
    try {
      const params: { date?: string; team_id?: number } = { date };
      if (selectedTeam) params.team_id = Number(selectedTeam);
      const res = await getWfhMonitoring(params);
      setData(res.data);
      setStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat data monitoring."));
      setStatus("error");
    }
  }

  function renderUserTable(users: MonitoringUser[], label: string) {
    if (users.length === 0) {
      return (
        <p className="text-sm text-[#767676] py-4 text-center">
          Tidak ada pegawai {label}.
        </p>
      );
    }

    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
            <th className="text-left px-4 py-3 font-medium text-[#333]">No</th>
            <th className="text-left px-4 py-3 font-medium text-[#333]">Nama</th>
            <th className="text-left px-4 py-3 font-medium text-[#333]">NIP</th>
            <th className="text-left px-4 py-3 font-medium text-[#333]">Tim</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
              <td className="px-4 py-3 text-[#767676]">{i + 1}</td>
              <td className="px-4 py-3 text-[#333]">{u.name}</td>
              <td className="px-4 py-3 text-[#767676]">{u.nip}</td>
              <td className="px-4 py-3 text-[#767676]">
                {u.team?.name ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (status === "loading") {
    return (
      <AppLayout breadcrumbs={[{ label: "WFH Monitoring" }]}>
        <div className="text-center py-12 text-sm text-[#767676]">Memuat...</div>
      </AppLayout>
    );
  }

  if (status === "error") {
    return (
      <AppLayout breadcrumbs={[{ label: "WFH Monitoring" }]}>
        <div className="text-center py-12 text-sm text-red-500">{errMsg}</div>
      </AppLayout>
    );
  }

  const tabCounts = {
    all: (data?.not_checked_in?.length ?? 0) + (data?.no_report?.length ?? 0),
    not_checked_in: data?.not_checked_in?.length ?? 0,
    no_report: data?.no_report?.length ?? 0,
  };

  return (
    <AppLayout breadcrumbs={[{ label: "WFH" }, { label: "Monitoring" }]}>
      <PageTitle title="Monitoring WFH" subtitle="Pemantauan absensi dan laporan WFH" />

      {/* Filters */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#767676]">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <ButtonFilter onClick={loadData}>Perbarui</ButtonFilter>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total"
          value={tabCounts.all}
          color="text-[#256EEF]"
          bg="bg-blue-50"
        />
        <SummaryCard
          title="Belum Absen"
          value={tabCounts.not_checked_in}
          color="text-yellow-600"
          bg="bg-yellow-50"
        />
        <SummaryCard
          title="Belum Laporan"
          value={tabCounts.no_report}
          color="text-red-600"
          bg="bg-red-50"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E0E9F2]">
          {(["all", "not_checked_in", "no_report"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-[#256EEF] border-b-2 border-[#256EEF]"
                  : "text-[#767676] hover:text-[#333]"
              }`}
            >
              {tab === "all"
                ? "Semua"
                : tab === "not_checked_in"
                  ? "Belum Absen"
                  : "Belum Laporan"}{" "}
              ({tabCounts[tab]})
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "not_checked_in" &&
            renderUserTable(data?.not_checked_in ?? [], "yang belum absen")}
          {activeTab === "no_report" &&
            renderUserTable(data?.no_report ?? [], "yang belum laporan")}
          {activeTab === "all" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-semibold text-yellow-700 mb-2">
                  Belum Absen ({tabCounts.not_checked_in})
                </h3>
                {renderUserTable(
                  data?.not_checked_in ?? [],
                  "yang belum absen"
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-2">
                  Belum Laporan ({tabCounts.no_report})
                </h3>
                {renderUserTable(data?.no_report ?? [], "yang belum laporan")}
              </div>
            </div>
          )}
        </div>
      </div>

      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errMsg}
        </div>
      )}
    </AppLayout>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function SummaryCard({
  title,
  value,
  color,
  bg,
}: {
  title: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-[10px] p-6 flex flex-col gap-1`}>
      <span className="text-sm text-[#767676]">{title}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

function ButtonFilter({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[#256EEF] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      {children}
    </button>
  );
}
