import { useEffect, useState, useRef, type FormEvent } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import {
  getWfhSessionConfig,
  createWfhReport,
  listWfhReports,
  getWfhReport,
  addReportAttendance,
  deleteReportAttendance,
  type WfhReport,
  type WfhSessionConfig,
  extractWfhError,
} from "../../api/wfh";

type PageStatus = "loading" | "ready" | "error";

interface SessionState {
  name: string;
  label: string;
  checkedIn: boolean;
  photoUrl: string | null;
  attendanceId?: number;
  file?: File;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WfhAbsensi() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [config, setConfig] = useState<WfhSessionConfig | null>(null);
  const [report, setReport] = useState<WfhReport | null>(null);
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setStatus("loading");
    setErrMsg("");
    try {
      const cfgRes = await getWfhSessionConfig();
      setConfig(cfgRes.data);

      const sessionNames = cfgRes.data.sessions;
      const labels: Record<string, string> = { pagi: "Pagi", siang: "Siang", sore: "Sore" };
      const today = todayStr();

      // Find today's report from list
      let currentReport: WfhReport | null = null;
      try {
        const listRes = await listWfhReports({ per_page: 100 });
        const todayReport = listRes.data.find((r) => r.report_date === today);
        if (todayReport) {
          const detailRes = await getWfhReport(todayReport.id);
          currentReport = detailRes.data;
        }
      } catch {
        // No report yet today
      }

      // Initialize sessions
      const initSessions: SessionState[] = sessionNames.map((name) => ({
        name,
        label: labels[name] ?? name,
        checkedIn: false,
        photoUrl: null,
      }));

      // If we found today's report, check its attendances
      if (currentReport?.attendances) {
        for (const att of currentReport.attendances) {
          const idx = initSessions.findIndex((s) => s.name === att.session);
          if (idx >= 0) {
            initSessions[idx].checkedIn = att.checked_in;
            initSessions[idx].photoUrl = att.photo_url;
            initSessions[idx].attendanceId = att.id;
          }
        }
        setReport(currentReport);
      }

      setSessions(initSessions);
      setStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal memuat data absensi."));
      setStatus("error");
    }
  }

  function handleSelectFile(sessionName: string) {
    setActiveSession(sessionName);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;

    setSaving(true);
    setErrMsg("");
    setSuccessMsg("");
    try {
      const today = todayStr();

      if (!report) {
        // Create report with this attendance
        const createRes = await createWfhReport({
          report_date: today,
          status: "draft",
          attendances: { [activeSession]: file },
        });
        setReport(createRes.data);
        if (createRes.data.attendances) {
          const att = createRes.data.attendances.find((a) => a.session === activeSession);
          if (att) {
            updateSessionState(activeSession, true, att.photo_url, att.id);
          }
        }
        setSuccessMsg("Absensi " + activeSession + " berhasil.");
      } else {
        // Append attendance to existing report
        const attRes = await addReportAttendance(report.id, {
          session: activeSession,
          photo: file,
        });
        updateSessionState(activeSession, true, attRes.data.photo_url, attRes.data.id);
        setSuccessMsg("Absensi " + activeSession + " berhasil.");
      }
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal upload absensi."));
    } finally {
      setSaving(false);
      setActiveSession(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateSessionState(
    sessionName: string,
    checkedIn: boolean,
    photoUrl: string | null,
    attendanceId?: number
  ) {
    setSessions((prev) =>
      prev.map((s) =>
        s.name === sessionName ? { ...s, checkedIn, photoUrl, attendanceId } : s
      )
    );
  }

  async function handleDeleteAttendance(session: SessionState) {
    if (!session.attendanceId || !report) return;
    setSaving(true);
    setErrMsg("");
    try {
      await deleteReportAttendance(report.id, session.attendanceId);
      updateSessionState(session.name, false, null, undefined);
      setSuccessMsg("Absensi " + session.name + " dihapus.");
    } catch (e: unknown) {
      setErrMsg(extractWfhError(e, "Gagal hapus absensi."));
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <AppLayout breadcrumbs={[{ label: "WFH Absensi" }]}>
        <div className="text-center py-12 text-sm text-[#767676]">Memuat...</div>
      </AppLayout>
    );
  }

  if (status === "error") {
    return (
      <AppLayout breadcrumbs={[{ label: "WFH Absensi" }]}>
        <div className="text-center py-12 text-sm text-red-500">{errMsg}</div>
      </AppLayout>
    );
  }

  const today = todayStr();
  const todayDisplay = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout breadcrumbs={[{ label: "WFH" }, { label: "Absensi" }]}>
      <PageTitle title="Absensi Work From Home" subtitle={todayDisplay} />

      {/* Info Card */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 flex flex-col gap-2">
        <p className="text-sm text-[#333]">
          <span className="font-medium">Nama:</span> {user?.name}
        </p>
        <p className="text-sm text-[#333]">
          <span className="font-medium">Tanggal:</span> {todayDisplay}
        </p>
      </div>

      {/* Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session.name}
            className={`bg-white rounded-[10px] shadow-sm p-6 flex flex-col items-center gap-4 ${
              session.checkedIn ? "border-2 border-green-400" : ""
            }`}
          >
            <h3 className="text-lg font-semibold text-[#333] capitalize">
              Sesi {session.label}
            </h3>

            {session.checkedIn && session.photoUrl ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={session.photoUrl}
                  alt={`Foto ${session.label}`}
                  className="w-48 h-36 object-cover rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleDeleteAttendance(session)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="w-48 h-36 border-2 border-dashed border-[#CBD5E1] rounded-lg flex items-center justify-center text-[#94A3B8] text-sm cursor-pointer hover:border-[#256EEF] transition-colors"
                onClick={() => handleSelectFile(session.name)}
              >
                Klik untuk upload foto
              </div>
            )}

            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                session.checkedIn
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {session.checkedIn ? "Sudah absen" : "Belum absen"}
            </span>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {successMsg}
        </div>
      )}
      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errMsg}
        </div>
      )}
    </AppLayout>
  );
}
