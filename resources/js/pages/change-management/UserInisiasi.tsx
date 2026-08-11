import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import AppLayout from "../../layouts/AppLayout";
import PageTitle from "../../components/ui/PageTitle";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import TextArea from "../../components/ui/TextArea";
import DatePicker from "../../components/ui/DatePicker";
import Checkbox from "../../components/ui/Checkbox";
import Pagination from "../../components/ui/Pagination";
import DropdownMenu from "../../components/ui/DropdownMenu";
import ConfirmModal from "../../components/ui/ConfirmModal";
import PackageDetailView from "./components/PackageDetailView";
import { useAuth } from "../../hooks/useAuth";
import {
  AddIcon,
  CloseIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  MoreVerticalIcon,
  SaveIcon,
  TrashIcon,
} from "../../components/ui/AdminActionIcons";
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

type Tab = "permohonan" | "riwayat";

const emptyForm = {
  description: "",
  reason: "",
  typeIds: [] as number[],
  priority: "normal" as ChangePriority,
  impact: "Minor" as ChangeImpact,
  productionImpact: "",
  requiredEffort: "",
  costNeeded: false,
  costAmount: "",
  resources: "",
  testPlan: "",
  releaseDate: "",
  reviewResponse: "",
};

const PAGE_SIZE = 15;

export default function UserInisiasi() {
  const { user, hasPermission, hasRole } = useAuth();
  const fieldId = user?.team?.field?.id;
  const roleCrumb = hasRole("admin") ? "Admin" : "Pegawai";

  const [tab, setTab] = useState<Tab>("permohonan");
  const [showForm, setShowForm] = useState(false);
  const [changeTypes, setChangeTypes] = useState<ChangeType[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  /* ── Form state ───────────────────────────────────────────────── */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [existingAttachments, setExistingAttachments] = useState<ChangeAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── List state ───────────────────────────────────────────────── */
  const [packages, setPackages] = useState<ChangePackage[]>([]);
  const [listStatus, setListStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const [page, setPage] = useState(1);

  /* ── Detail state ─────────────────────────────────────────────── */
  const [detailPkg, setDetailPkg] = useState<ChangePackage | null>(null);

  useEffect(() => {
    if (!errMsg) return;
    const timer = setTimeout(() => {
      setErrMsg("");
    }, 4000); 

    return () => clearTimeout(timer);
  }, [errMsg]);

  useEffect(() => {
    if (!formErr) return;
    const timer = setTimeout(() => {
      setFormErr("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [formErr]);

  useEffect(() => {
    listChangeTypes()
      .then((res) => setChangeTypes(res.data))
      .catch(() => {});
  }, []);

  async function loadPackages() {
    setListStatus("loading");
    setErrMsg("");
    try {
      const res = await listChangePackages({ per_page: 100 });
      setPackages(res.data);
      setListStatus("ready");
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal memuat riwayat permohonan."));
      setListStatus("error");
    }
  }

  useEffect(() => {
    if (!detailPkg) loadPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── Form helpers ─────────────────────────────────────────────── */
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
      priority: implementation?.priority ?? "normal",
      impact: implementation?.impact ?? "Minor",
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
  }

  // Klik "+ Ajukan Permohonan" → tampilkan form isi kosong
  function openNewForm() {
    resetForm();
    setShowForm(true);
  }

  async function handleEditRow(id: number) {
    setErrMsg("");
    try {
      const res = await getChangePackage(id);
      loadIntoForm(res.data);
      setShowForm(true);
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
    try {
      await deleteChangePackage(id);
      loadPackages();
    } catch (e: unknown) {
      setErrMsg(extractChangeError(e, "Gagal menghapus permohonan."));
    }
  }

  async function confirmDelete() {
    if (deleteTarget == null) return;
    await handleDelete(deleteTarget);
    if (detailPkg && detailPkg.initiation.id === deleteTarget) setDetailPkg(null);
    setDeleteTarget(null);
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
      resetForm();
      setShowForm(false);
      setTab("permohonan");
      loadPackages();
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
      setShowForm(false);
      setTab("permohonan");
      loadPackages();
    } catch (e: unknown) {
      setFormErr(extractChangeError(e, "Gagal mengirim permohonan."));
      setFieldErrors(extractChangeFieldErrors(e));
    } finally {
      setSaving(false);
    }
  }

  const canCreate = hasPermission("change.initiation.create");
  const isMine = (p: ChangePackage) => p.initiation.initiator_id === user?.id;

  // Tab "Permohonan Saya" → draf + menunggu; Tab "Riwayat" → disetujui + ditolak.
  const filtered = useMemo(() => {
    if (tab === "permohonan") {
      return packages.filter(
        (p) => p.initiation.status === "draft" || p.initiation.status === "pending"
      );
    }
    return packages.filter(
      (p) => p.initiation.status === "approved" || p.initiation.status === "rejected"
    );
  }, [packages, tab]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Detail view ──────────────────────────────────────────────── */
  if (detailPkg) {
    const init = detailPkg.initiation;
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: roleCrumb }, { label: "Detail Permohonan" }]}>
        <button
          className="inline-flex items-center gap-1 text-[#256EEF] text-sm hover:underline mb-4"
          onClick={() => setDetailPkg(null)}
        >
          <ArrowLeftIcon size={16} /> Kembali
        </button>
        <PackageDetailView pkg={detailPkg} />
        <div className="flex gap-3 mt-4">
          {init.status === "approved" && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => openInitiationPdf(init.id)}>
                <DownloadIcon size={17} /> Unduh PDF Inisiasi
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => openImplementationPdf(init.id)}>
                <DownloadIcon size={17} /> Unduh PDF Implementasi
              </Button>
            </>
          )}
          {init.status === "draft" && init.initiator_id === user?.id && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setDetailPkg(null);
                  handleEditRow(init.id);
                }}
              >
                <EditIcon size={17} /> Edit Permohonan
              </Button>
              <Button
                variant="outline"
                className="gap-2 !text-red-500 !border-red-300 hover:!bg-red-50"
                onClick={() => setDeleteTarget(init.id)}
              >
                <TrashIcon size={17} /> Hapus Permohonan
              </Button>
            </>
          )}
        </div>

        <ConfirmModal
          open={deleteTarget != null}
          title="Hapus Permohonan"
          message="Apakah Anda yakin ingin menghapus permohonan ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </AppLayout>
    );
  }

  /* ── Form view (dibuka dari "+ Ajukan Permohonan" / Edit) ─────── */
  if (showForm) {
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: roleCrumb }, { label: "Ajukan Permohonan" }]}>
        <PageTitle
          title={editingId != null ? "Edit Permohonan" : "Ajukan Permohonan"}
          subtitle="Isi detail perubahan yang diajukan"
        />

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

          {formErr && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {formErr}
              {Object.keys(fieldErrors).length > 0 && (
                <span className="block mt-1 text-xs">Periksa isian yang ditandai merah di atas.</span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="gap-2" onClick={() => { setShowForm(false); resetForm(); }}>
              <CloseIcon size={17} /> Batal
            </Button>
            <Button type="submit" variant="outline" className="gap-2" disabled={saving || !canCreate}>
              <SaveIcon size={17} /> {saving ? "Menyimpan..." : "Simpan Draf"}
            </Button>
            <Button type="button" className="gap-2" onClick={handleSubmitLaporan} disabled={saving || !canCreate}>
              <SendIcon size={17} /> {saving ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      </AppLayout>
    );
  }

  /* ── List view (Permohonan Saya / Riwayat) ────────────────────── */
  return (
    <AppLayout breadcrumbs={[{ label: "Beranda" }, { label: roleCrumb }, { label: "Inisiasi Perubahan" }]}>
      <div className="flex items-center justify-between gap-4">
        <PageTitle
          title="Inisiasi Perubahan"
          subtitle={
            tab === "permohonan"
              ? `${filtered.length} permohonan aktif (draf & menunggu)`
              : `${filtered.length} permohonan selesai (disetujui & ditolak)`
          }
        />
        <Button onClick={openNewForm} className="gap-2">
          <AddIcon size={17} /> Ajukan Permohonan
        </Button>
      </div>

      <div className="flex gap-3">
        <TabButton active={tab === "permohonan"} onClick={() => setTab("permohonan")} icon={<DocumentIcon size={18} />}>
          Permohonan Saya
        </TabButton>
        <TabButton active={tab === "riwayat"} onClick={() => setTab("riwayat")} icon={<HistoryIcon size={18} />}>
          Riwayat
        </TabButton>
      </div>

      {errMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errMsg}</div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#767676]">{filtered.length} permohonan</p>
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
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-[#767676]">
                      Tidak ada permohonan.
                    </td>
                  </tr>
                )}
                {pageRows.map((p) => {
                  const init = p.initiation;
                  const st = statusBadge(init.status);
                  const canEditDelete = init.status === "draft" && isMine(p);
                  return (
                    <tr key={init.id} className="border-b border-[#F0F0F0] hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3 text-[#333] whitespace-nowrap">
                        {formatTanggalLengkap(init.initiation_date)}
                      </td>
                      <td className="px-4 py-3 text-[#333] whitespace-nowrap">{init.doc_number}</td>
                      <td className="px-4 py-3 text-[#767676] max-w-[240px] truncate">{init.description}</td>
                      <td className="px-4 py-3 text-[#333]">{init.initiator?.name ?? user?.name}</td>
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
                              aria-label={`Aksi untuk ${init.doc_number}`}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-[#424655] hover:bg-[#F6FAFF]"
                            >
                              <MoreVerticalIcon size={18} />
                            </button>
                          }
                          items={[
                            {
                              label: "Lihat Detail",
                              icon: <EyeIcon size={16} />,
                              onClick: () => handleViewDetail(init.id),
                            },
                            ...(canEditDelete
                              ? [
                                  {
                                    label: "Edit Permohonan",
                                    icon: <EditIcon size={16} />,
                                    onClick: () => handleEditRow(init.id),
                                  },
                                  {
                                    label: "Hapus Permohonan",
                                    icon: <TrashIcon size={16} />,
                                    variant: "destructive" as const,
                                    separator: true,
                                    onClick: () => setDeleteTarget(init.id),
                                  },
                                ]
                              : []),
                            ...(init.status === "approved"
                              ? [
                                  {
                                    label: "Unduh PDF Inisiasi",
                                    icon: <DownloadIcon size={16} />,
                                    separator: true,
                                    onClick: () => openInitiationPdf(init.id),
                                  },
                                  {
                                    label: "Unduh PDF Implementasi",
                                    icon: <DownloadIcon size={16} />,
                                    onClick: () => openImplementationPdf(init.id),
                                  },
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
      </div>

      <ConfirmModal
        open={deleteTarget != null}
        title="Hapus Permohonan"
        message="Apakah Anda yakin ingin menghapus permohonan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}

/* ── Small local UI helpers ────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl border transition-colors ${
        active
          ? "bg-[#141D23] text-white border-[#141D23]"
          : "bg-white text-[#424655] border-[#C2C6D8] hover:bg-gray-50"
      }`}
    >
      {icon}
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
    <label className="relative inline-flex items-center gap-2 text-sm text-[#333] cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-[#256EEF] border-[#C2C6D8] focus:ring-[#256EEF]"
      />
      {label}
    </label>
  );
}

/* ── Missing Icons ────────────────────────────────────────── */

function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#767676]">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function DocumentIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function HistoryIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}