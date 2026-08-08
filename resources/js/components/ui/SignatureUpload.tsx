import { useRef, useState, useEffect } from "react";
import Button from "./Button";

export interface SignatureUploadProps {
  label: string;
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  error?: string;
}

const ALLOWED_TYPES = ["image/png", "image/jpg", "image/jpeg"];
const MAX_SIZE = 2 * 1024 * 1024;

// ── FUNGSI TAMBAHAN: Mengubah Background Putih/Abu-abu Menjadi Transparan ──
const processTransparentSignature = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Loop piksel: Jika warna piksel terang / putih / abu-abu (RGB > 190), ubah transparansi (Alpha) jadi 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 190 && g > 190 && b > 190) {
          data[i + 3] = 0; // Set Alpha = 0 (Transparan)
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Export ke File PNG Baru
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          const transparentFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, "") + "_transparent.png",
            { type: "image/png" }
          );
          resolve(transparentFile);
        } else {
          resolve(file);
        }
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

export default function SignatureUpload({
  label,
  value,
  onChange,
  error,
}: SignatureUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === "string" && value.length > 0) {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFile = async (file: File | null) => {
    setValidationError(null);
    if (!file) {
      onChange?.(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError("Format file harus PNG, JPG, atau JPEG.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setValidationError("Ukuran file maksimal 2MB.");
      return;
    }

    // OTOMATIS PROSES GAMBAR AGAR BACKGROUND DARI FILE MENJADI TRANSPARAN
    const transparentFile = await processTransparentSignature(file);
    onChange?.(transparentFile);
  };

  const displayError = error || validationError;

  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-sm font-medium text-[#424655]">{label}</label>

      <div className="flex items-start gap-6">
        <div
          className={`w-[160px] h-[60px] rounded-[10px] border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors ${
            displayError
              ? "border-[#FF0000] bg-red-50"
              : preview
                ? "border-[#256EEF] bg-[#F6FAFF]"
                : "border-[#C2C6D8] bg-white"
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Tanda tangan"
              className="w-full h-full object-contain"
            />
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#C2C6D8]"
            >
              <path
                d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="9"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {preview ? "Ganti File" : "Pilih File"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                setValidationError(null);
                onChange?.(null);
              }}
              className="!text-[#FF0000] !border-[#FF0000] hover:!bg-red-50"
            >
              Hapus
            </Button>
          )}
          <p className="text-[11px] text-[#767676]">
            PNG, JPG, atau JPEG. Maks 2MB.
          </p>
        </div>
      </div>

      {displayError && (
        <p className="text-xs text-[#FF0000]">{displayError}</p>
      )}
    </div>
  );
}