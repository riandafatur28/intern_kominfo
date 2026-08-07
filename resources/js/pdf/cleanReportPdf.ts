import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import type { WfhReportPrintData } from "./index";

/**
 * Generate PDF laporan WFH individu di client (FE-only, zero dependency selain pdf-lib).
 *
 * Mengapa bukan dialog Ctrl+P: browser SELALU menyisipkan metadata (Producer/Creator)
 * pada hasil "Save as PDF". Generator ini menulis PDF sendiri tanpa Info dictionary
 * → metadata nol, teks tetap vektor (bisa di-select), format mengikuti template print.
 */

const MM = 72 / 25.4;
const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const ML = 18 * MM; // margin kiri = margin kanan (18mm)
const MT = 15 * MM; // margin atas (15mm)
const CW = PAGE_W - 2 * ML; // lebar konten

const BLACK = rgb(0, 0, 0);
const BLUE = rgb(0.1, 0.34, 0.85); // #1a56db (link)

const H = 11; // font identitas
const HSMALL = 8.5; // link
const LH = 1.4; // line-height

/** WinAnsi-safe: buang karakter yang tak bisa dikodekan font standar PDF. */
function win(s: unknown): string {
  return String(s ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2019\u201C\u201D\u2022\u20AC]/g, "?");
}

/** Bungkus teks per kata agar ≤ maxW. */
function wrapText(font: PDFFont, size: number, text: string, maxW: number): string[] {
  const words = win(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(trial, size) <= maxW || !cur) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function lineH(size: number): number {
  return size * LH;
}

async function fetchImageBytes(url?: string): Promise<ArrayBuffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    return res.ok ? res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function embedImage(doc: PDFDocument, bytes: ArrayBuffer | null): Promise<PDFImage | null> {
  if (!bytes) return null;
  try {
    // PNG magic: \x89PNG
    const isPng = bytes.byteLength > 8 && new Uint8Array(bytes, 0, 4).join() === "137,80,78,71";
    return isPng ? doc.embedPng(bytes) : doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

/**
 * Logo asli 1114×1600 (~780KB) — perkecil lewat canvas sebelum embed
 * supaya PDF tetap ringan. Browser-only; di node (tes) langsung return.
 */
async function downscaleImage(bytes: ArrayBuffer, maxW: number): Promise<ArrayBuffer> {
  if (typeof document === "undefined") return bytes;
  try {
    const blob = new Blob([bytes], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("img"));
      i.src = url;
    });
    const scale = Math.min(1, maxW / img.width);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    const cx = c.getContext("2d");
    if (!cx) return bytes;
    cx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const b64 = c.toDataURL("image/png").split(",")[1];
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer as ArrayBuffer;
  } catch {
    return bytes;
  }
}

interface Ctx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  logo: PDFImage | null;
}

/** Gambar teks rata tengah (sumbu y = dari atas). */
function centerText(ctx: Ctx, text: string, font: PDFFont, size: number, yTop: number): void {
  const w = font.widthOfTextAtSize(win(text), size);
  ctx.page.drawText(win(text), {
    x: ML + (CW - w) / 2,
    y: PAGE_H - yTop - size,
    size,
    font,
    color: BLACK,
  });
}

interface TableRow {
  cells: { text: string; font: PDFFont; size: number; align: "left" | "center"; color?: typeof BLACK | typeof BLUE; underline?: boolean }[];
  heights: number[]; // per kolom, dihitung
  rowH: number;
}

/** Ukur tinggi sel (wrap) lalu gambar baris tabel. */
function drawTable(
  ctx: Ctx,
  header: string[],
  colX: number[],
  colW: number[],
  colFontSize: number[],
  yTop: number,
  rows: TableRow[]
): number {
  const padX = 6.75; // 9px
  const padY = 5.25; // 7px

  // header
  let y = yTop;
  const hdrH = lineH(colFontSize[0]) + 2 * padY;
  for (let i = 0; i < header.length; i++) {
    ctx.page.drawText(win(header[i]), {
      x: colX[i] + (colW[i] - ctx.bold.widthOfTextAtSize(win(header[i]), colFontSize[i])) / 2,
      y: PAGE_H - y - padY - colFontSize[i],
      size: colFontSize[i],
      font: ctx.bold,
      color: BLACK,
    });
  }
  // header border
  drawRowBorder(ctx, colX, colW, y, hdrH);
  y += hdrH;

  for (const row of rows) {
    const h = row.rowH;
    // teks per sel
    for (let i = 0; i < row.cells.length; i++) {
      const c = row.cells[i];
      const lines = wrapText(c.font, c.size, c.text, colW[i] - 2 * padX);
      let yy = y + padY;
      for (const ln of lines) {
        const w = c.font.widthOfTextAtSize(ln, c.size);
        const x = c.align === "center" ? colX[i] + (colW[i] - w) / 2 : colX[i] + padX;
        ctx.page.drawText(ln, { x, y: PAGE_H - yy - c.size, size: c.size, font: c.font, color: c.color ?? BLACK });
        if (c.underline) {
          ctx.page.drawLine({ start: { x, y: PAGE_H - yy - 1.8 }, end: { x: x + w, y: PAGE_H - yy - 1.8 }, thickness: 0.7, color: c.color ?? BLACK });
        }
        yy += lineH(c.size);
      }
    }
    drawRowBorder(ctx, colX, colW, y, h);
    y += h;
  }
  return y;
}

function drawRowBorder(ctx: Ctx, colX: number[], colW: number[], yTop: number, h: number): void {
  for (let i = 0; i < colX.length; i++) {
    ctx.page.drawRectangle({
      x: colX[i],
      y: PAGE_H - yTop - h,
      width: colW[i],
      height: h,
      borderColor: BLACK,
      borderWidth: 0.75,
    });
  }
}

export async function buildWfhReportPdf(data: WfhReportPrintData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  // ── gambar: logo + tanda tangan (fallback diam jika gagal dimuat) ──
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [logoBytes, makerSigBytes, supSigBytes] = await Promise.all([
    fetchImageBytes(data.logoUrl ?? `${origin}/images/logo-jatim.png`),
    fetchImageBytes(data.makerSignatureUrl),
    fetchImageBytes(data.isApproved ? data.supervisorSignatureUrl : undefined),
  ]);
  const logo = logoBytes ? await embedImage(doc, await downscaleImage(logoBytes, 160)) : null;
  const makerSig = await embedImage(doc, makerSigBytes);
  const supSig = await embedImage(doc, supSigBytes);

  const ctx: Ctx = { page, font, bold, logo };
  let y = MT;

  /* ── KOP ─────────────────────────────────────────────────────── */
  const logoW = 49.5; // 66px
  const logoH = logo ? (logo.height / logo.width) * logoW : 71;
  if (logo) {
    page.drawImage(logo, { x: ML, y: PAGE_H - MT - logoH, width: logoW, height: logoH });
  }
  centerText(ctx, "PEMERINTAH PROVINSI JAWA TIMUR", font, 13, y);
  y += lineH(13) * 0.9;
  centerText(ctx, "DINAS KOMUNIKASI DAN INFORMATIKA", bold, 18, y);
  y += lineH(18) * 0.85;
  const addr = wrapText(font, 8, "Jalan Ahmad Yani Nomor 242-244, Gayungan, Surabaya, Jawa Timur 60235 / Tlp. (031) 8294608, Fak. (031) 8294517, Laman kominfo.jatimprov.go.id, Pos-el kominfo@jatimprov.go.id", CW);
  for (const ln of addr) {
    centerText(ctx, ln, font, 8, y);
    y += lineH(8);
  }
  const kopBottom = Math.max(y, MT + logoH + 4);
  // garis ganda bawah kop
  const gy = PAGE_H - kopBottom;
  page.drawLine({ start: { x: ML, y: gy }, end: { x: ML + CW, y: gy }, thickness: 1, color: BLACK });
  page.drawLine({ start: { x: ML, y: gy - 2.5 }, end: { x: ML + CW, y: gy - 2.5 }, thickness: 0.6, color: BLACK });
  y = kopBottom + 10;

  /* ── JUDUL ───────────────────────────────────────────────────── */
  y += 14;
  centerText(ctx, "LAPORAN PELAKSANAAN TUGAS WORK FROM HOME (WFH)", bold, 12.5, y);
  y += lineH(12.5) + 14;

  /* ── IDENTITAS ───────────────────────────────────────────────── */
  const labelW = 127.5; // 170px
  const infoRows: [string, unknown][] = [
    ["Nama", data.nama],
    ["NIP", data.nip],
    ["Pangkat/Gol", data.pangkat],
    ["Jabatan", data.jabatan],
    ["Unit Kerja", data.unitKerja],
    ["Tanggal Pelaksanaan", data.tanggalPelaksanaan],
  ];
  const rowH = lineH(H) + 1.5;
  for (const [label, value] of infoRows) {
    page.drawText(label, { x: ML, y: PAGE_H - y - H, size: H, font, color: BLACK });
    page.drawText(win(value), { x: ML + labelW + 12, y: PAGE_H - y - H, size: H, font, color: BLACK });
    y += rowH;
  }
  y += 8;

  /* ── TABEL KEGIATAN ──────────────────────────────────────────── */
  const pct = (p: number) => (CW * p) / 100;
  const colW = [pct(6), pct(20), pct(44), pct(30)];
  const colX = [ML, ML + colW[0], ML + colW[0] + colW[1], ML + colW[0] + colW[1] + colW[2]];

  const kegiatan = Array.isArray(data.kegiatan) ? data.kegiatan : [];
  const rows: TableRow[] = kegiatan.map((k, i) => {
    const kLines = wrapText(font, 10.5, k.kegiatan, colW[2] - 2 * 6.75);
    const linkLines: string[] = [];
    for (const l of k.links ?? []) linkLines.push(...wrapText(font, HSMALL, l, colW[3] - 2 * 6.75));
    const h1 = Math.max(kLines.length, 1) * lineH(10.5) + 2 * 5.25;
    const h2 = Math.max(linkLines.length, 1) * lineH(HSMALL) + 2 * 5.25;
    const h = Math.max(h1, h2);
    return {
      rowH: h,
      heights: [h, h, h, h],
      cells: [
        { text: String(i + 1), font, size: 10.5, align: "center" },
        { text: k.waktu, font, size: 10.5, align: "center" },
        { text: k.kegiatan, font, size: 10.5, align: "left" },
        { text: linkLines.join("\n"), font, size: HSMALL, align: "left", color: BLUE, underline: true },
      ],
    };
  });

  y = drawTable(ctx, ["No", "Waktu Pelaksanaan", "Kegiatan", "Link Bukti Kerja"], colX, colW, [10.5, 10.5, 10.5, HSMALL], y, rows);
  y += 8;

  /* ── TTD ─────────────────────────────────────────────────────── */
  const spacerTop = y + 36;
  const colW2 = CW * 0.46;
  const cols = [
    { x: ML, isPlace: true, placeText: "" },
    { x: ML + CW - colW2, isPlace: false, placeText: `${data.city ?? "Surabaya"}, ${data.tanggalPelaksanaan ?? ""}` },
  ];
  const sigSpace = 58.5; // 78px
  for (const c of cols) {
    let yy = spacerTop;
    // baris tempat/tanggal: min-height 20px + margin 2px → sama untuk kedua kolom
    if (c.placeText) {
      page.drawText(win(c.placeText), { x: c.x + (colW2 - font.widthOfTextAtSize(win(c.placeText), H)) / 2, y: PAGE_H - (spacerTop + 2) - H, size: H, font, color: BLACK });
    }
    yy += 16.5;
    const roleLabel = c.isPlace ? "Yang Membuat Laporan" : "Atasan Langsung";
    page.drawText(roleLabel, { x: c.x + (colW2 - font.widthOfTextAtSize(roleLabel, H)) / 2, y: PAGE_H - yy - H, size: H, font, color: BLACK });
    yy += lineH(H) + 6;

    const sig = c.isPlace ? makerSig : supSig;
    if (sig) {
      const maxH = sigSpace;
      const maxW = 120; // 160px
      const w = Math.min(maxW, sig.width);
      const h = (sig.height / sig.width) * w;
      const finalH = Math.min(maxH, h);
      const finalW = (sig.width / sig.height) * finalH;
      page.drawImage(sig, { x: c.x + (colW2 - finalW) / 2, y: PAGE_H - yy - finalH, width: finalW, height: finalH });
      yy += finalH + 4;
    } else {
      yy += sigSpace;
    }

    yy += 5.25; // gap 7px antara TTD dan nama
    const name = (c.isPlace ? data.makerName : data.supervisorName) ?? "-";
    page.drawText(win(name), { x: c.x + (colW2 - bold.widthOfTextAtSize(win(name), H)) / 2, y: PAGE_H - yy - H, size: H, font: bold, color: BLACK });
    {
      const nw = bold.widthOfTextAtSize(win(name), H);
      const nx = c.x + (colW2 - nw) / 2;
      page.drawLine({ start: { x: nx, y: PAGE_H - yy - 1.8 }, end: { x: nx + nw, y: PAGE_H - yy - 1.8 }, thickness: 0.8, color: BLACK });
    }
    yy += lineH(H) + 1;
    const nip = c.isPlace ? data.makerNip : data.supervisorNip;
    const nipText = `NIP. ${nip ?? ""}`;
    page.drawText(win(nipText), { x: c.x + (colW2 - font.widthOfTextAtSize(win(nipText), H)) / 2, y: PAGE_H - yy - H, size: H, font, color: BLACK });
  }

  const bytes = await doc.save();
  return stripPdfInfo(bytes);
}

/**
 * Hapus referensi Info dictionary dari trailer (metadata pdf-lib default: Producer,
 * Creator, CreationDate, ModDate). Info jadi object orphan yang tidak direferensikan
 * → PDF valid, metadata kosong (spec: /Info opsional).
 */
function stripPdfInfo(bytes: Uint8Array): Uint8Array {
  const str = new TextDecoder("latin1").decode(bytes);
  const out = str.replace(/\/Info\s+\d+\s+\d+\s+R/g, "");
  if (out === str) return bytes;
  // latin1 decode → tiap char = 1 byte; encode manual (bukan TextEncoder: itu UTF-8)
  const res = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) res[i] = out.charCodeAt(i) & 0xff;
  return res;
}

/** Download PDF bersih (tanpa metadata) untuk laporan WFH individu. */
export async function downloadWfhReportPdf(data: WfhReportPrintData): Promise<void> {
  const bytes = await buildWfhReportPdf(data);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan WFH - ${String(data.nama ?? "").replace(/[^\w\s-]/g, "").trim() || "Pegawai"} - ${String(data.tanggalPelaksanaan ?? "").replace(/\s+/g, " ")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
