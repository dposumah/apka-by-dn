import { formatCurrency } from "./format";
import { KopSuratOption } from "./snt-report-templates";

export type SntEntityCode = "MTC" | "LPD" | "RE";
export type SntDocKind = "KW" | "INV";

export const SNT_ENTITY_OPTIONS: Array<{
  code: SntEntityCode;
  kopSurat: KopSuratOption;
  shortLabel: string;
  fullName: string;
  badgeClass: string;
}> = [
  {
    code: "MTC",
    kopSurat: "maleo",
    shortLabel: "MTC · Yayasan Maleo",
    fullName: "Yayasan Maleo Talenta Cendekia",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    code: "LPD",
    kopSurat: "lpd",
    shortLabel: "LPD · Jully Tjindrawan Robotik",
    fullName: "LPD Jully Tjindrawan Robotik",
    badgeClass: "bg-slate-900 text-white border-slate-900",
  },
  {
    code: "RE",
    kopSurat: "robotic",
    shortLabel: "RE · Robotic Explorer",
    fullName: "Robotic Explorer (PT Jully Tjindrawan Robotik)",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
];

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export function getRomanMonth(month1To12: number): string {
  const idx = Math.max(1, Math.min(12, Math.floor(month1To12))) - 1;
  return ROMAN_MONTHS[idx] || "I";
}

export function normalizeEntityCode(val?: string | null): SntEntityCode {
  const upper = String(val || "").trim().toUpperCase();
  if (upper === "LPD") return "LPD";
  if (upper === "RE" || upper === "REX" || upper === "ROBOTIC") return "RE";
  return "MTC";
}

export function resolveEntityCodeFromKop(kop?: KopSuratOption | string | null): SntEntityCode {
  const k = String(kop || "").trim().toLowerCase();
  if (k === "lpd") return "LPD";
  if (k === "robotic" || k === "re") return "RE";
  return "MTC";
}

export function resolveKopFromEntityCode(entity: SntEntityCode): KopSuratOption {
  if (entity === "LPD") return "lpd";
  if (entity === "RE") return "robotic";
  return "maleo";
}

export function resolveEntityCodeFromOwner(owner?: string | null): SntEntityCode {
  const s = String(owner || "").toLowerCase();
  if (s.includes("lpd")) return "LPD";
  if (s.includes("robotic") || s.includes("pt jully")) return "RE";
  return "MTC";
}

export function resolveOwnerNameFromEntity(entity: SntEntityCode): string {
  const found = SNT_ENTITY_OPTIONS.find((e) => e.code === entity);
  return found ? found.fullName : "Yayasan Maleo Talenta Cendekia";
}

/**
 * Rekomendasi entitas penerbit default berdasarkan kode Pos RAB (sesuai Tabel 1 Simulasi 80%):
 * - A.3, A.5, B.1a, B.1b, B.1c, B.7a, B.7c -> LPD
 * - A.2, B.4a, B.4b, B.6a -> RE (Robotic Explorer)
 * - Lainnya (A.4, B.2a-c, B.3a-b, B.4c, B.5, B.6b, B.7b, B.7d) -> MTC (Yayasan Maleo)
 */
export function suggestEntityCodeForRabCode(rabCode?: string | null): SntEntityCode {
  const c = String(rabCode || "").trim().toLowerCase();
  if (["3", "5", "1a", "1b", "1c", "7a", "7c"].includes(c)) return "LPD";
  if (["2", "4a", "4b", "6a"].includes(c)) return "RE";
  return "MTC";
}

/**
 * Format resmi standar SNT Wilayah 2:
 * - Invoice  : INV/{LPD|RE|MTC}/SNT-W2/{NNN}/{ROMAWI}/2026
 * - Kuitansi : KW/{LPD|RE|MTC}/SNT-W2/{NNN}/{ROMAWI}/2026
 */
export function formatSntDocumentNumber(
  kind: SntDocKind,
  entity: SntEntityCode,
  seq: number,
  dateInput: Date | string = new Date()
): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const yyyy = safeDate.getFullYear();
  const roman = getRomanMonth(safeDate.getMonth() + 1);
  const nnn = String(Math.max(1, Math.floor(seq))).padStart(3, "0");
  return `${kind}/${entity}/SNT-W2/${nnn}/${roman}/${yyyy}`;
}

/**
 * Mengekstrak nomor urut {NNN} dari nomor dokumen berformat standar:
 * `INV/LPD/SNT-W2/001/XI/2026` -> 1
 * `KW/RE/SNT-W2-B6a/006/XI/2026` -> 6
 * Mengembalikan 0 jika nomor memakai format lama (mis. KWC/MTC/2026.10.09.001)
 * agar seri format baru tiap entitas selalu mulai rapi dari 001.
 */
export function extractSeqFromSntDocNumber(
  docNo: string,
  kind: SntDocKind,
  entity: SntEntityCode
): number {
  const raw = String(docNo || "").trim().toUpperCase();
  const prefix = `${kind}/${entity}/SNT-W2`;
  if (!raw.startsWith(prefix)) return 0;
  const match = raw.match(/\/SNT-W2(?:-[A-Z0-9]+)?\/(\d{1,5})\//);
  if (!match) return 0;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Menghitung nomor urut berikutnya untuk pasangan (Jenis Dokumen × Entitas)
 * berdasarkan daftar nomor yang sudah tersimpan di database.
 */
export function computeNextSeqForEntity(
  existingNumbers: string[],
  kind: SntDocKind,
  entity: SntEntityCode
): number {
  let maxSeq = 0;
  for (const no of existingNumbers) {
    const parsed = extractSeqFromSntDocNumber(no, kind, entity);
    if (parsed > maxSeq) maxSeq = parsed;
  }
  return maxSeq + 1;
}

export interface DocumentRegisterEntry {
  id: string;
  kind: "KW" | "INV" | "NOTA";
  docNumber: string;
  entityCode: SntEntityCode;
  tanggal: string;
  rabCode: string;
  rabName: string;
  realizationType: "REAL" | "PELAPORAN";
  perihal: string;
  penerimaOrOwner: string;
  vendorReceiptNo: string | null;
  nominal: number;
  expenseId?: string | null;
  recordId?: string | null;
}

function csvCell(val: unknown): string {
  const s = String(val ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildDocumentRegisterCsv(entries: DocumentRegisterEntry[]): string {
  const header = [
    "No",
    "Jenis",
    "Entitas",
    "Nomor Dokumen",
    "No. Nota/Faktur Vendor",
    "Tanggal",
    "Kode RAB",
    "Pos RAB",
    "Tipe Realisasi",
    "Perihal / Uraian",
    "Penerbit / Penerima",
    "Nominal (Rp)",
  ];
  const rows = entries.map((e, idx) =>
    [
      idx + 1,
      e.kind === "KW" ? "Kuitansi" : e.kind === "INV" ? "Invoice" : "Nota Vendor",
      e.entityCode,
      e.docNumber,
      e.vendorReceiptNo || "-",
      e.tanggal,
      e.rabCode,
      e.rabName,
      e.realizationType,
      e.perihal,
      e.penerimaOrOwner,
      e.nominal,
    ]
      .map(csvCell)
      .join(",")
  );
  return "\uFEFF" + [header.map(csvCell).join(","), ...rows].join("\r\n");
}

function escHtml(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDocumentRegisterPdfHtml(input: {
  title: string;
  subtitle: string;
  entries: DocumentRegisterEntry[];
  printedAt?: string;
}): string {
  const totalNominal = input.entries.reduce((s, e) => s + (Number(e.nominal) || 0), 0);
  const rowsHtml = input.entries
    .map(
      (e, idx) => `
      <tr>
        <td class="ctr">${idx + 1}</td>
        <td class="ctr"><strong>${escHtml(e.kind === "KW" ? "Kuitansi" : e.kind === "INV" ? "Invoice" : "Nota")}</strong></td>
        <td class="ctr">${escHtml(e.entityCode)}</td>
        <td class="mono">${escHtml(e.docNumber)}</td>
        <td class="mono">${escHtml(e.vendorReceiptNo || "-")}</td>
        <td class="ctr">${escHtml(e.tanggal)}</td>
        <td class="ctr">${escHtml(e.rabCode)}</td>
        <td class="ctr">${escHtml(e.realizationType)}</td>
        <td>${escHtml(e.perihal)}</td>
        <td class="num">${escHtml(formatCurrency(e.nominal))}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(input.title)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 10px; margin: 0; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 10px 16px; margin-bottom: 14px; }
    .toolbar button { background: #10b981; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; }
    @media print { .toolbar { display: none; } }
    h1 { font-size: 15px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.3px; }
    .sub { font-size: 11px; color: #475569; margin: 0 0 12px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 6px; vertical-align: top; }
    th { background: #1e293b; color: #fff; font-size: 9.5px; text-align: left; }
    .ctr { text-align: center; }
    .num { text-align: right; white-space: nowrap; }
    .mono { font-family: Consolas, monospace; font-size: 9.5px; white-space: nowrap; }
    .total-row td { background: #f1f5f9; font-weight: 700; }
  </style>
</head>
<body>
  <div class="toolbar">
    <div><strong>${escHtml(input.title)}</strong> — ${input.entries.length} dokumen</div>
    <button onclick="window.print()">Cetak / Simpan PDF</button>
  </div>
  <h1>${escHtml(input.title)}</h1>
  <p class="sub">${escHtml(input.subtitle)}${input.printedAt ? ` · Dicetak: ${escHtml(input.printedAt)}` : ""}</p>
  <table>
    <thead>
      <tr>
        <th class="ctr" style="width:26px;">No</th>
        <th class="ctr" style="width:58px;">Jenis</th>
        <th class="ctr" style="width:45px;">Entitas</th>
        <th>Nomor Dokumen</th>
        <th>No. Nota Vendor</th>
        <th class="ctr" style="width:72px;">Tanggal</th>
        <th class="ctr" style="width:45px;">RAB</th>
        <th class="ctr" style="width:68px;">Tipe</th>
        <th>Uraian / Perihal</th>
        <th class="num" style="width:95px;">Nominal</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="10" class="ctr">Belum ada data pada filter ini.</td></tr>`}
      <tr class="total-row">
        <td colspan="9">TOTAL (${input.entries.length} DOKUMEN)</td>
        <td class="num">${escHtml(formatCurrency(totalNominal))}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}
