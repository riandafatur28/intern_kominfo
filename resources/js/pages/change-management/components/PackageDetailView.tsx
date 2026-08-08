import type { ChangePackage } from "../../../api/changeManagement";
import { IMPACT_LABEL, priorityBadge, PRIORITY_OPTIONS, IMPACT_OPTIONS, statusBadge } from "../shared";

function formatSlash(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

function formatRupiah(amount: number | string | null | undefined): string {
  if (amount == null || amount === "") return "-";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#256EEF] mb-1">{label}</p>
      <div className="text-sm text-[#333] whitespace-pre-wrap break-words">{children || "-"}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
      <div className="bg-[#F9FAFB] border-b border-[#E0E9F2] px-6 py-3">
        <h3 className="text-sm font-semibold text-[#141D23]">{title}</h3>
      </div>
      <div className="p-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}

export default function PackageDetailView({ pkg }: { pkg: ChangePackage }) {
  const { initiation, implementation } = pkg;
  const typeNames = (implementation?.change_types ?? []).map((t) => t.name).join(", ");
  
  // Ambil badge dan label prioritas yang sesuai dari PRIORITY_OPTIONS
  const prioBadge = implementation ? priorityBadge(implementation.priority) : null;
  const prioLabel = implementation
    ? PRIORITY_OPTIONS.find((p) => p.value === implementation.priority)?.label || prioBadge?.label || implementation.priority
    : "-";

  // Ambil label dampak dari IMPACT_LABEL atau fallback ke IMPACT_OPTIONS
  const impactLabel = implementation
    ? IMPACT_LABEL[implementation.impact] ||
      IMPACT_OPTIONS.find((i) => i.value === implementation.impact)?.label ||
      implementation.impact
    : "-";

  const attachments = implementation?.attachments ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Inisiasi Perubahan">
        <div className="grid grid-cols-2 gap-5">
          <Field label="Bidang">{initiation.field?.name}</Field>
          <Field label="Tanggal Pengajuan">{formatSlash(initiation.initiation_date)}</Field>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Nomor">{initiation.doc_number}</Field>
          <Field label="Status">
            <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${statusBadge(initiation.status).color}`}>
              {statusBadge(initiation.status).label}
            </span>
          </Field>
        </div>
        <Field label="Deskripsi permohonan">{initiation.description}</Field>
        <Field label="Alasan / Justifikasi">{initiation.reason}</Field>
      </SectionCard>

      <SectionCard title="Implementasi">
        <Field label="Tipe Perubahan">{typeNames}</Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Prioritas Perubahan">
            {prioBadge && (
              <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${prioBadge.color}`}>
                {prioLabel}
              </span>
            )}
          </Field>
          <Field label="Dampak Perubahan">{impactLabel}</Field>
        </div>
        <Field label="Dampak Terhadap Lingkungan Produksi">{implementation?.production_impact}</Field>
        <Field label="Upaya / Tindakan yang Diperlukan">{implementation?.required_effort}</Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Kebutuhan Biaya">{implementation?.cost_needed ? "Ada" : "Tidak"}</Field>
          <Field label="Jumlah Biaya">
            {implementation?.cost_needed ? formatRupiah(implementation?.cost_amount) : "-"}
          </Field>
        </div>
        <Field label="Kebutuhan Sumber Daya (Personil, H/W, S/W)">{implementation?.resources}</Field>
        <Field label="Penjelasan Rencana Pengujian">{implementation?.test_plan}</Field>

        <div>
          <p className="text-xs font-medium text-[#256EEF] mb-2">Lampiran Hasil Pengujian</p>
          {attachments.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-[#E0E9F2] rounded-lg overflow-hidden aspect-video bg-[#F6FAFF]"
                >
                  <img src={att.url} alt="Lampiran" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#C2C6D8] rounded-[10px] py-8 flex items-center justify-center text-sm text-[#767676]">
              Belum ada lampiran
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Tanggal Rilis">{formatSlash(implementation?.release_date)}</Field>
        </div>
        <Field label="Tanggapan">{implementation?.review_response}</Field>
      </SectionCard>
    </div>
  );
}