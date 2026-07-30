import { useRef, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { importUsers, type ImportSummary } from "../../../api/users";

interface ImportUsersModalProps {
    open: boolean;
    onClose: () => void;
    onImported: () => void;
}

export default function ImportUsersModal({ open, onClose, onImported }: ImportUsersModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function reset() {
        setFile(null);
        setResult(null);
        setError(null);
        setImporting(false);
    }

    function close() {
        reset();
        onClose();
    }

    function pickFile(f: File | undefined | null) {
        if (!f) return;
        const ok = /\.(xlsx|xls|csv)$/i.test(f.name);
        if (!ok) {
            setError("Format tidak didukung. Gunakan file .xlsx, .xls, atau .csv.");
            return;
        }
        setError(null);
        setFile(f);
    }

    async function handleImport() {
        if (!file) return;
        setError(null);
        setImporting(true);
        try {
            const summary = await importUsers(file);
            setResult(summary);
            onImported();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
                ?.message;
            setError(msg ?? "Import gagal. Silakan periksa format file.");
        } finally {
            setImporting(false);
        }
    }

    const footer = result ? (
        <Button onClick={close}>Selesai</Button>
    ) : (
        <>
            <Button variant="outline" onClick={close} disabled={importing}>
                Batal
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? "Mengimpor..." : "Import"}
            </Button>
        </>
    );

    return (
        <Modal
            open={open}
            title="Import Data Pegawai dari Excel"
            onClose={close}
            footer={footer}
        >
            {result ? (
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <div className="flex-1 rounded-lg bg-[#DCFCE7] px-4 py-3">
                            <div className="text-2xl font-bold text-[#15803D]">{result.imported}</div>
                            <div className="text-xs text-[#15803D]">Berhasil diimpor</div>
                        </div>
                        <div className="flex-1 rounded-lg bg-[#FEF9C3] px-4 py-3">
                            <div className="text-2xl font-bold text-[#854D0E]">{result.skipped}</div>
                            <div className="text-xs text-[#854D0E]">Dilewati</div>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3">
                            <p className="text-xs font-semibold text-[#B91C1C] mb-1">
                                Catatan ({result.errors.length}):
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                {result.errors.map((e, i) => (
                                    <li key={i} className="text-xs text-[#B91C1C]">
                                        {e}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            pickFile(e.dataTransfer.files?.[0]);
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${file
                                ? "border-[#15803D] bg-[#F0FDF4]"
                                : dragOver
                                    ? "border-[#256EEF] bg-[#F6FAFF]"
                                    : "border-[#C2C6D8]"
                            }`}
                    >
                        {file ? (
                            <>
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#DCFCE7] text-[#15803D]">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M5 10.5L8.5 14L15 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <p className="text-sm font-semibold text-[#15803D]">File siap diimpor</p>
                                <p className="text-sm text-[#141D23] break-all">{file.name}</p>
                                <p className="text-xs text-[#767676]">
                                    {(file.size / 1024).toFixed(1)} KB · klik untuk ganti file
                                </p>
                            </>
                        ) : (
                            <>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#767676]">
                                    <path
                                        d="M12 16V4m0 0L8 8m4-4l4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <p className="text-sm text-[#424655]">Seret &amp; lepas file di sini</p>
                                <p className="text-xs text-[#767676]">atau klik untuk memilih file</p>
                                <p className="text-xs text-[#767676]">Mendukung: .xlsx, .xls, .csv</p>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => pickFile(e.target.files?.[0])}
                        />
                    </div>

                    {file && !importing && (
                        <p className="text-xs text-[#15803D]">
                            ✓ File terpilih. Klik "Import" untuk memproses.
                        </p>
                    )}

                    {error && (
                        <div className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-2 text-sm text-[#B91C1C]">
                            {error}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
