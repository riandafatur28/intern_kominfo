import { useEffect, useRef, useState, type FormEvent } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import TextArea from "../../components/ui/TextArea";
import DatePicker from "../../components/ui/DatePicker";
import Checkbox from "../../components/ui/Checkbox";
import Pagination from "../../components/ui/Pagination";
import PackageDetailView from "./components/PackageDetailView";
import { useAuth } from "../../hooks/useAuth";
import {
  listChangeTypes,
  listChangePackages,
  getChangePackage,
  createChangePackage,
  updateChangePackage,
  deleteChangePackage,
  submitChangePackage,
  uploadChangePackageAttachments,
  getChangeInitiationPdfUrl,
  getChangeImplementationPdfUrl,
  extractChangeError,
  extractChangeFieldErrors,
  type ChangeType,
  type ChangePackage,
  type ChangeAttachment,
  type ChangePriority,
  type ChangeImpact,
  type ChangePackagePayload,
} from "../../api/changeManagement";
import { statusBadge, PRIORITY_OPTIONS, IMPACT_OPTIONS } from "./shared";
import { openPdfDirect } from "../../utils/swAuth";
import { formatTanggalLengkap } from "../../utils/userDisplay";

type Tab = "form" | "riwayat";

const emptyForm = {
  description: "",
  reason: "",
  typeIds: [] as number[],
  priority: "low" as ChangePriority,
  impact: "low" as ChangeImpact,
  productionImpact: "",
  requiredEffort: "",
  costNeeded: false,
  costAmount: "",
  resources: "",
  testPlan: "",
  releaseDate: "",
  reviewResponse: "",
};

export default function UserInisiasi() {
  const { user, hasPermission, hasRole } = useAuth();
  const fieldId = user?.team?.field?.id;
  const roleCrumb = hasRole("admin") ? "Admin" : "Pegawai";

  const [tab, setTab] = useState<Tab>("form");
  const [changeTypes, setChangeTypes] = useState<ChangeType[]>([]);

  /* ── Form state ──────────────────────────────────────────────── */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [existingAttachments, setExistingAttachments] = useState<ChangeAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");
  // Keyed by the backend's dotted field path (e.g. "initiation.needed_by_date"),
  // so each invalid input can show its own red message instead of leaving the
  // user to guess which one from the generic "...and 3 more errors" summary.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Riwayat state ───────────────────────────────────────────── */
  const [packages, setPackages] = useState<ChangePackage[]>([]);
  const [listStatus, setListStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  /* ── Detail state ────────────────────────────────────────────── */
  const [detailPkg, setDetailPkg] = useState<ChangePackage | null>(null);

  useEffect(() => {
    listChangeTypes()
      .then((res) => setChangeTypes(res.data))
      .catch(() => {});
  }, []);

  async function loadPackages() {
    setListStatus("loading");
    setErrMsg("");
    try {
      const res = await listChangePackages({ per_page: 15 });
      setPackages(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
      setListStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat riwayat permohonan."));
      setListStatus("error");
    }
  }

  useEffect(() => {
    if (tab === "riwayat" && !detailPkg) loadPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  /* ── Form helpers ────────────────────────────────────────────── */
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setExistingAttachments([]);
    setPendingFiles([]);
    setFormMsg("");
    setFormErr("");
    setFieldErrors({});
  }

  function loadIntoForm(pkg: ChangePackage) {
    const { initiation, implementation } = pkg;
    setEditingId(initiation.id);
    setForm({
      description: initiation.description ?? "",
      reason: initiation.reason ?? "",
      typeIds: (implementation?.change_types ?? []).map((t) => t.id),
      priority: implementation?.priority ?? "low",
      impact: implementation?.impact ?? "low",
      productionImpact: implementation?.production_impact ?? "",
      requiredEffort: implementation?.required_effort ?? "",
      costNeeded: Boolean(implementation?.cost_needed),
      costAmount: implementation?.cost_amount != null ? String(implementation.cost_amount) : "",
      resources: implementation?.resources ?? "",
      testPlan: implementation?.test_plan ?? "",
      releaseDate: implementation?.release_date ?? "",
      reviewResponse: implementation?.review_response ?? "",
    });
    setExistingAttachments(implementation?.attachments ?? []);
    setPendingFiles([]);
    setFormMsg("");
    setFormErr("");
    setFieldErrors({});
    setTab("form");
  }

  async function handleEditRow(id: number) {
    setErrMsg("");
    try {
      const res = await getChangePackage(id);
      loadIntoForm(res.data);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat permohonan."));
    }
  }

  async function handleViewDetail(id: number) {
    setErrMsg("");
    try {
      const res = await getChangePackage(id);
      setDetailPkg(res.data);
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat detail permohonan."));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus permohonan ini?")) return;
    try {
      await deleteChangePackage(id);
      loadPackages();
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal menghapus permohonan."));
    }
  }

  function openInitiationPdf(id: number) {
    openPdfDirect(getChangeInitiationPdfUrl(id), (msg) => setErrMsg(msg));
  }

  function openImplementationPdf(id: number) {
    openPdfDirect(getChangeImplementationPdfUrl(id), (msg) => setErrMsg(msg));
  }

  function toggleType(id: number) {
    setForm((f) => ({
      ...f,
      typeIds: f.typeIds.includes(id) ? f.typeIds.filter((t) => t !== id) : [...f.typeIds, id],
    }));
  }

  function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function buildPayload(): ChangePackagePayload {
    return {
      initiation: {
        field_id: fieldId,
        needed_by_date: form.releaseDate || undefined,
        description: form.description,
        reason: form.reason,
      },
      implementation: {
        priority: form.priority,
        impact: form.impact,
        production_impact: form.productionImpact,
        required_effort: form.requiredEffort,
        cost_needed: form.costNeeded,
        cost_amount: form.costNeeded && form.costAmount ? Number(form.costAmount) : null,
        resources: form.resources,
        test_plan: form.testPlan,
        change_type_ids: form.typeIds,
        release_date: form.releaseDate || undefined,
        review_response: form.reviewResponse,
      },
    };
  }

  async function ensurePackageId(payload: ChangePackagePayload): Promise<number> {
    if (editingId != null) {
      await updateChangePackage(editingId, payload);
      return editingId;
    }
    const res = await createChangePackage(payload);
    setEditingId(res.data.initiation.id);
    return res.data.initiation.id;
  }

  async function flushAttachments(id: number) {
    if (pendingFiles.length === 0) return;
    const res = await uploadChangePackageAttachments(id, pendingFiles);
    setExistingAttachments((prev) => [...prev, ...res.data]);
    setPendingFiles([]);
  }

  async function handleSaveDraft(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormMsg("");
    setFormErr("");
    setFieldErrors({});
    try {
      const id = await ensurePackageId(buildPayload());
      await flushAttachments(id);
      setFormMsg("Draf berhasil disimpan.");
    } catch (e: unknown) {
      setFormErr(extractChangeError(e, "Gagal menyimpan draf."));
      setFieldErrors(extractChangeFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitLaporan() {
    setSaving(true);
    setFormMsg("");
    setFormErr("");
    setFieldErrors({});
    try {
      const payload = buildPayload();
      const id = await ensurePackageId(payload);
      await flushAttachments(id);
      await submitChangePackage(id, payload);
      resetForm();
      setTab("riwayat");
    } catch (e: unknown) {
      setFormErr(extractChangeError(e, "Gagal mengirim permohonan."));
      setFieldErrors(extractChangeFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  const canCreate = hasPermission("change.initiation.create");
  const PAGE_SIZE_LABEL = `${total} permohonan`;

  /* ── Detail view ─────────────────────────────────────────────── */
  if (detailPkg) {
    const init = detailPkg.initiation;
    const st = statusBadge(init.status);
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: roleCrumb }, { label: "Detail Permohonan" }]}>
        <div className="flex items-center justify-between">
          <PageTitle title={init.doc_number} subtitle={init.description} />
          <button className="text-[#256EEF] text-sm hover:underline" onClick={() => setDetailPkg(null)}>
            &larr; Kembali
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
        </div>
        <PackageDetailView pkg={detailPkg} />
        <div className="flex gap-3">
          {init.status === "approved" && (
            <>
              <Button variant="outline" onClick={() => openInitiationPdf(init.id)}>
                Unduh PDF Inisiasi
              </Button>
              <Button variant="outline" onClick={() => openImplementationPdf(init.id)}>
                Unduh PDF Implementasi
              </Button>
            </>
          )}
          {init.status === "draft" && init.initiator_id === user?.id && (
            <>
              <Button variant="outline" onClick={() => { setDetailPkg(null); handleEditRow(init.id); }}>
                Edit
              </Button>
              <Button
                variant="outline"
                className="!text-red-500 !border-red-300 hover:!bg-red-50"
                onClick={async () => {
                  await handleDelete(init.id);
                  setDetailPkg(null);
                }}
              >
                Hapus
              </Button>
            </>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: roleCrumb }, { label: "Inisiasi Perubahan" }]}>
      <PageTitle title="Inisiasi Perubahan" subtitle="Ajukan dan pantau permohonan perubahan Anda" />

      <div className="flex gap-3">
        <TabButton active={tab === "form"} onClick={() => setTab("form")}>
          Form Permohonan
        </TabButton>
        <TabButton active={tab === "riwayat"} onClick={() => setTab("riwayat")}>
          Riwayat
        </TabButton>
      </div>

      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errMsg}</div>
      )}

      {tab === "form" ? (
        <form onSubmit={handleSaveDraft} className="flex flex-col gap-6">
          <section className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="bg-[#F9FAFB] border-b border-[#E0E9F2] px-6 py-3">
              <h3 className="text-sm font-semibold text-[#141D23]">Inisiasi Perubahan</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <TextArea
                label="Deskripsi permohonan"
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                required
                rows={2}
                error={fieldErrors["initiation.description"]}
              />
              <TextArea
                label="Alasan / Justifikasi"
                value={form.reason}
                onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
                required
                rows={2}
                error={fieldErrors["initiation.reason"]}
              />
            </div>
          </section>

          <section className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="bg-[#F9FAFB] border-b border-[#E0E9F2] px-6 py-3">
              <h3 className="text-sm font-semibold text-[#141D23]">Implementasi</h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <FormField label="Tipe Perubahan" required error={fieldErrors["implementation.change_type_ids"]}>
                <div
                  className={`grid grid-cols-2 md:grid-cols-4 gap-3 min-h-[116px] md:min-h-[56px] rounded-[10px] border p-3 transition-colors ${
                    fieldErrors["implementation.change_type_ids"]
                      ? "border-[#FF0000] bg-red-50"
                      : "border-transparent"
                  }`}
                >
                  {changeTypes.length === 0
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[20px] w-24 rounded bg-gray-100 animate-pulse" />
                      ))
                    : changeTypes.map((t) => (
                        <Checkbox
                          key={t.id}
                          checked={form.typeIds.includes(t.id)}
                          onChange={() => toggleType(t.id)}
                          label={t.name}
                        />
                      ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="Prioritas Perubahan">
                  <div className="flex flex-wrap gap-4">
                    {PRIORITY_OPTIONS.map((o) => (
                      <RadioOption
                        key={o.value}
                        name="priority"
                        checked={form.priority === o.value}
                        onChange={() => setForm((f) => ({ ...f, priority: o.value }))}
                        label={o.label}
                      />
                    ))}
                  </div>
                </FormField>
                <FormField label="Dampak Perubahan">
                  <div className="flex flex-wrap gap-4">
                    {IMPACT_OPTIONS.map((o) => (
                      <RadioOption
                        key={o.value}
                        name="impact"
                        checked={form.impact === o.value}
                        onChange={() => setForm((f) => ({ ...f, impact: o.value }))}
                        label={o.label}
                      />
                    ))}
                  </div>
                </FormField>
              </div>

              <TextArea
                label="Dampak Terhadap Lingkungan Produksi"
                value={form.productionImpact}
                onChange={(v) => setForm((f) => ({ ...f, productionImpact: v }))}
                rows={2}
              />
              <TextArea
                label="Upaya / Tindakan yang Diperlukan"
                value={form.requiredEffort}
                onChange={(v) => setForm((f) => ({ ...f, requiredEffort: v }))}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField label="Kebutuhan Biaya">
                  <div className="flex gap-4">
                    <RadioOption
                      name="costNeeded"
                      checked={form.costNeeded}
                      onChange={() => setForm((f) => ({ ...f, costNeeded: true }))}
                      label="Ada"
                    />
                    <RadioOption
                      name="costNeeded"
                      checked={!form.costNeeded}
                      onChange={() => setForm((f) => ({ ...f, costNeeded: false, costAmount: "" }))}
                      label="Tidak"
                    />
                  </div>
                </FormField>
                <FormField label="Jumlah Biaya">
                  <input
                    type="number"
                    min={0}
                    disabled={!form.costNeeded}
                    value={form.costAmount}
                    onChange={(e) => setForm((f) => ({ ...f, costAmount: e.target.value }))}
                    className="w-full px-4 py-[10px] text-sm rounded-[10px] border border-[#C2C6D8] outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </FormField>
              </div>

              <TextArea
                label="Kebutuhan Sumber Daya (Personil, H/W, S/W)"
                value={form.resources}
                onChange={(v) => setForm((f) => ({ ...f, resources: v }))}
                rows={2}
              />
              <TextArea
                label="Penjelasan Rencana Pengujian"
                value={form.testPlan}
                onChange={(v) => setForm((f) => ({ ...f, testPlan: v }))}
                rows={2}
                required
                error={fieldErrors["implementation.test_plan"]}
              />

              <FormField label="Lampiran Hasil Pengujian">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    onFilesSelected(e.dataTransfer.files);
                  }}
                  className="border border-dashed border-[#C2C6D8] rounded-[10px] py-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#256EEF] transition-colors"
                >
                  <UploadIcon />
                  <p className="text-sm text-[#767676]">Upload gambar hasil pengujian ke sini</p>
                  <p className="text-xs text-[#A0A0A0]">Format: JPG, PNG</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    className="hidden"
                    onChange={(e) => onFilesSelected(e.target.files)}
                  />
                </div>
                {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {existingAttachments.map((att) => (
                      <img
                        key={att.id}
                        src={att.url}
                        alt="Lampiran"
                        className="w-full aspect-video object-cover rounded-lg border border-[#E0E9F2]"
                      />
                    ))}
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-full aspect-video object-cover rounded-lg border border-[#E0E9F2]"
                        />
                        <button
                          type="button"
                          onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-xs text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>

              <DatePicker
                label="Tanggal Rilis"
                value={form.releaseDate}
                onChange={(v) => setForm((f) => ({ ...f, releaseDate: v }))}
                required
                error={fieldErrors["initiation.needed_by_date"] || fieldErrors["implementation.release_date"]}
              />
              <TextArea
                label="Tanggapan"
                value={form.reviewResponse}
                onChange={(v) => setForm((f) => ({ ...f, reviewResponse: v }))}
                placeholder="Tanggapan setelah perubahan dan hasil dari implementasi"
                rows={2}
              />
            </div>
          </section>

          {formMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {formMsg}
            </div>
          )}
          {formErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {formErr}
              {Object.keys(fieldErrors).length > 0 && (
                <span className="block mt-1 text-xs">
                  Periksa isian yang ditandai merah di atas.
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Batal
            </Button>
            <Button type="submit" variant="outline" disabled={saving || !canCreate}>
              {saving ? "Menyimpan..." : "Simpan Draf"}
            </Button>
            <Button type="button" onClick={handleSubmitLaporan} disabled={saving || !canCreate}>
              {saving ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#767676]">{PAGE_SIZE_LABEL}</p>
          </div>
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            {listStatus === "loading" ? (
              <div className="text-center py-10 text-sm text-[#767676]">Memuat...</div>
            ) : listStatus === "error" ? (
              <div className="text-center py-10 text-sm text-red-500">{errMsg}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E0E9F2]">
                    <th className="text-left px-4 py-3 font-medium text-[#333]">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-[#333]">Nomor</th>
                    <th className="text-left px-4 py-3 font-medium text-[#333]">Judul</th>
                    <th className="text-left px-4 py-3 font-medium text-[#333]">Inisiator</th>
                    <th className="text-left px-4 py-3 font-medium text-[#333]">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-[#333]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-sm text-[#767676]">
                        Belum ada permohonan.
                      </td>
                    </tr>
                  )}
                  {packages.map((p) => {
                    const init = p.initiation;
                    const st = statusBadge(init.status);
                    return (
                      <tr key={init.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                        <td className="px-4 py-3 text-[#333]">{formatTanggalLengkap(init.initiation_date)}</td>
                        <td className="px-4 py-3 text-[#333]">{init.doc_number}</td>
                        <td className="px-4 py-3 text-[#767676] max-w-[240px] truncate">{init.description}</td>
                        <td className="px-4 py-3 text-[#333]">{init.initiator?.name ?? user?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              className="text-[#256EEF] hover:underline"
                              onClick={() => handleViewDetail(init.id)}
                              aria-label="Lihat"
                            >
                              <EyeIcon />
                            </button>
                            {init.status === "draft" && init.initiator_id === user?.id && (
                              <>
                                <button
                                  className="text-amber-600 hover:underline"
                                  onClick={() => handleEditRow(init.id)}
                                  aria-label="Edit"
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  className="text-red-500 hover:underline"
                                  onClick={() => handleDelete(init.id)}
                                  aria-label="Hapus"
                                >
                                  <TrashIcon />
                                </button>
                              </>
                            )}
                            {init.status === "approved" && (
                              <>
                                <button
                                  className="text-[#256EEF] hover:underline text-xs bg-[#DBEAFE] px-2 py-1 rounded-full"
                                  onClick={() => openInitiationPdf(init.id)}
                                >
                                  PDF Inisiasi
                                </button>
                                <button
                                  className="text-[#256EEF] hover:underline text-xs bg-[#DBEAFE] px-2 py-1 rounded-full"
                                  onClick={() => openImplementationPdf(init.id)}
                                >
                                  PDF Implementasi
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {lastPage > 1 && (
              <div className="px-4 py-3 border-t border-[#E0E9F2]">
                <Pagination currentPage={page} lastPage={lastPage} total={total} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ── Small local UI helpers ────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-xl border transition-colors ${
        active
          ? "bg-[#141D23] text-white border-[#141D23]"
          : "bg-white text-[#424655] border-[#C2C6D8] hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function RadioOption({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center gap-2 text-sm text-[#424655] cursor-pointer select-none">
      {/* Real-size invisible input (not zero-size `sr-only`) — avoids a spurious
          scroll-into-view on focus even when the visible radio is already on-screen. */}
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <span
        className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0 ${
          checked ? "border-[#256EEF]" : "border-[#C2C6D8]"
        }`}
      >
        {checked && <span className="w-[10px] h-[10px] rounded-full bg-[#256EEF]" />}
      </span>
      {label}
    </label>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#767676]">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}
