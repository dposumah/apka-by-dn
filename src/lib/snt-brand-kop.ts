import { formatCurrency, terbilangRupiah } from "./format";
import type { KopSuratOption, SntReportProfile } from "./snt-report-templates";

export const DEFAULT_ROBOTIC_PREPARER_LABEL = "PT Jully Tjindrawan Robotik (Robotic Explorer)";
export const DEFAULT_SLIP_KEGIATAN_LABEL = "KKA Sekolah Nasional Terintegrasi Tahun 2026";

/**
 * Mengembalikan true untuk Pos RAB yang bukti pembayarannya wajib memakai SLIP HONORARIUM
 * (bukan Kwitansi):
 * - A.3: Koordinator Wilayah
 * - A.4: Fasilitator KKA & Robotika
 * - A.5: Tenaga Administrasi
 */
export function isSlipHonorariumRabCode(
  rabCode?: string | null,
  rabNameOrLabel?: string | null
): boolean {
  const c = String(rabCode || "")
    .trim()
    .toLowerCase()
    .replace(/^a\.?/, "");
  if (c === "3" || c === "4" || c === "5") return true;

  const label = String(rabNameOrLabel || "").trim().toLowerCase();
  if (!label) return false;
  if (/^(?:a\.?)?[345]\s*[-–—]/.test(label)) return true;
  if (label.includes("koordinator wilayah") && !label.includes("perjalanan") && !label.includes("perjadin")) {
    return true;
  }
  if (label.includes("fasilitator koding") || label.includes("honorarium fasilitator")) {
    return true;
  }
  if (label.includes("tenaga administrasi")) {
    return true;
  }
  return false;
}

export function resolvePersonnelRoleFromRab(
  rabCode?: string | null,
  rabNameOrLabel?: string | null,
  lokasi?: string | null
): string {
  const c = String(rabCode || "")
    .trim()
    .toLowerCase()
    .replace(/^a\.?/, "");
  const label = String(rabNameOrLabel || "").toLowerCase();
  if (c === "3" || (label.includes("koordinator wilayah") && !label.includes("perjalanan"))) {
    return "Koordinator Wilayah 2";
  }
  if (c === "5" || label.includes("tenaga administrasi")) {
    return "Tenaga Administrasi SNT Wilayah 2";
  }
  const cleanLok = String(lokasi || "").trim().replace(/^lokasi\s+snt\s+/i, "");
  return cleanLok ? `Fasilitator KKA — Lokasi SNT ${cleanLok}` : "Fasilitator KKA";
}

export function formatMonthPeriodId(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export interface BrandKopTheme {
  id: KopSuratOption;
  label: string;
  entityName: string;
  headerTitle: string;
  logoPath: string;
  primaryColor: string;
  accentColor: string;
  softTintColor: string;
  address: string;
  contactLine: string;
  defaultBankName: string;
  defaultBankAccount: string;
  defaultBankHolder: string;
  defaultSignerName: string;
  defaultSignerTitle: string;
  isFullBanner?: boolean;
}

export const KOP_OPTIONS_LIST: Array<{ value: KopSuratOption; label: string; shortLabel: string }> = [
  { value: "maleo", label: "Yayasan Maleo Talenta Cendekia", shortLabel: "Yayasan Maleo" },
  { value: "lpd", label: "LPD Jully Tjindrawan Robotik", shortLabel: "LPD JTR" },
  { value: "robotic", label: "Robotic Explorer (PT Jully Tjindrawan Robotik)", shortLabel: "Robotic Explorer" },
  { value: "none", label: "Tanpa Kop Surat", shortLabel: "Tanpa Kop" },
];

export function resolveBrandKopTheme(
  kop: KopSuratOption,
  profile?: Partial<SntReportProfile>
): BrandKopTheme {
  if (kop === "lpd") {
    const contactParts = [
      profile?.lpdTelp?.trim() ? `Telp/WA: ${profile.lpdTelp.trim()}` : "",
      profile?.lpdEmail?.trim() ? `Email: ${profile.lpdEmail.trim()}` : "",
    ].filter(Boolean);
    return {
      id: "lpd",
      label: "LPD Jully Tjindrawan Robotik",
      entityName: "LPD Jully Tjindrawan Robotik",
      headerTitle: "LPD JULLY TJINDRAWAN ROBOTIK",
      logoPath: "/logo-lpd.png",
      primaryColor: "#1F3864",
      accentColor: "#C82333",
      softTintColor: "#EEF3FA",
      address: "Greenville Blok AL no 1A-B, RT.5/RW.14, Duri Kepa, Kec. Kebon Jeruk, Jakarta Barat 11510",
      contactLine: contactParts.join(" | "),
      defaultBankName: profile?.lpdBankName?.trim() || "",
      defaultBankAccount: profile?.lpdBankAccount?.trim() || "",
      defaultBankHolder: profile?.lpdBankHolder?.trim() || "LPD Jully Tjindrawan Robotik",
      defaultSignerName: profile?.ketuaTimPelaksana?.trim() || "Jully Tjindrawan, MBA",
      defaultSignerTitle: "Direktur, LPD Jully Tjindrawan Robotik",
    };
  }

  if (kop === "robotic") {
    const telp = profile?.reTelp?.trim() || "0822-9898-4848";
    const web = profile?.reWebsite?.trim() || "www.worldroboticexplorer.com";
    const contactParts = [telp ? `WhatsApp ${telp}` : "", web].filter(Boolean);
    return {
      id: "robotic",
      label: "Robotic Explorer (PT Jully Tjindrawan Robotik)",
      entityName: "PT Jully Tjindrawan Robotik",
      headerTitle: "ROBOTIC EXPLORER",
      logoPath: "/logo-robotic-explorer.png",
      primaryColor: "#0070C0",
      accentColor: "#E1251B",
      softTintColor: "#EDF5FC",
      address: "Greenville Blok AL no 1A-B, RT.5/RW.14, Duri Kepa, Kec. Kebon Jeruk, Jakarta Barat 11510",
      contactLine: contactParts.join(" | "),
      defaultBankName: profile?.reBankName?.trim() || "BCA",
      defaultBankAccount: profile?.reBankAccount?.trim() || "7040827000",
      defaultBankHolder: profile?.reBankHolder?.trim() || "PT Jully Tjindrawan Robotik",
      defaultSignerName: profile?.ketuaTimPelaksana?.trim() || "Jully Tjindrawan, MBA",
      defaultSignerTitle: "Direktur, PT Jully Tjindrawan Robotik",
    };
  }

  if (kop === "maleo") {
    return {
      id: "maleo",
      label: "Yayasan Maleo Talenta Cendekia",
      entityName: "Yayasan Maleo Talenta Cendekia",
      headerTitle: "YAYASAN MALEO TALENTA CENDEKIA",
      logoPath: "/kop-maleo.png",
      primaryColor: "#00ADB5",
      accentColor: "#009999",
      softTintColor: "#CBF5F1",
      address: profile?.alamatYayasanMaleo?.trim() || "Intermark Indonesia, Ruko Alfresco Dining No.8, BSD City, Tangerang Selatan 15310",
      contactLine: "08119661017 | maleotalentacendekia@gmail.com",
      defaultBankName: profile?.maleoBankName?.trim() || "BANK MANDIRI",
      defaultBankAccount: profile?.maleoBankAccount?.trim() || "",
      defaultBankHolder: profile?.maleoBankHolder?.trim() || "MALEO TALENTA CENDEKIA",
      defaultSignerName: profile?.ketuaYayasanMaleo?.trim() || "Mutiara Hikma Mahendradatta, BBA., MBA.",
      defaultSignerTitle: "Ketua Yayasan",
      isFullBanner: true,
    };
  }

  return {
    id: "none",
    label: "Tanpa Kop Surat",
    entityName: profile?.namaYayasan || "Yayasan Maleo Talenta Cendekia",
    headerTitle: "",
    logoPath: "",
    primaryColor: "#1F3864",
    accentColor: "#C82333",
    softTintColor: "#F1F5F9",
    address: "",
    contactLine: "",
    defaultBankName: "",
    defaultBankAccount: "",
    defaultBankHolder: profile?.namaYayasan || "",
    defaultSignerName: profile?.ketuaTimPelaksana || "Jully Tjindrawan, MBA",
    defaultSignerTitle: "Penanggung Jawab Program",
  };
}

function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateSlashOrId(dateInput?: string | Date | null, style: "long" | "slash" = "long"): string {
  if (!dateInput) return "............................ 2026";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  if (style === "slash") {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Menghasilkan header kop surat modern dual-tone sesuai mockup LPD / Robotic Explorer,
 * atau banner penuh untuk Yayasan Maleo.
 */
export function renderBrandKopHtml(
  kop: KopSuratOption,
  profile?: Partial<SntReportProfile>,
  originPrefix = ""
): string {
  if (kop === "none") return "";
  const theme = resolveBrandKopTheme(kop, profile);
  const imgSrc = `${originPrefix}${theme.logoPath}`;

  if (theme.isFullBanner) {
    return `
      <div style="text-align:center; padding-bottom:8px; margin-bottom:14px; border-bottom:3px solid ${theme.primaryColor};">
        <img src="${esc(imgSrc)}" alt="${esc(theme.headerTitle)}" style="max-height:78px; max-width:100%; object-fit:contain;" onerror="this.style.display='none'" />
      </div>
    `;
  }

  const logoHeight = kop === "lpd" ? "38px" : "58px";
  return `
    <div style="margin-bottom:14px;">
      <table style="width:100%; border-collapse:collapse; margin:0;">
        <tr>
          <td style="border:none; padding:0 12px 8px 0; vertical-align:middle; width:46%;">
            <img src="${esc(imgSrc)}" alt="${esc(theme.headerTitle)}" style="max-height:${logoHeight}; max-width:260px; object-fit:contain; display:block;" onerror="this.style.display='none'" />
          </td>
          <td style="border:none; padding:0 0 8px 12px; vertical-align:middle; text-align:right; width:54%;">
            <div style="font-size:15px; font-weight:800; color:${theme.primaryColor}; letter-spacing:0.3px;">${esc(theme.headerTitle)}</div>
            <div style="font-size:9.5px; color:#475569; margin-top:3px; line-height:1.35;">${esc(theme.address)}</div>
            ${theme.contactLine ? `<div style="font-size:9.5px; color:#475569; margin-top:2px;">${esc(theme.contactLine)}</div>` : ""}
          </td>
        </tr>
      </table>
      <div style="display:flex; width:100%; height:4px; overflow:hidden;">
        <div style="width:84%; background:${theme.primaryColor};"></div>
        <div style="width:16%; background:${theme.accentColor};"></div>
      </div>
    </div>
  `;
}

export interface ModernKuitansiInput {
  kopSurat: KopSuratOption;
  profile?: Partial<SntReportProfile>;
  originPrefix?: string;
  noKwitansi: string;
  sudahTerimaDari: string;
  amount: number;
  ppnPct?: number;
  untukPembayaran: string;
  rabCode?: string;
  showRabCode?: boolean;
  subLabel?: string;
  kota: string;
  tanggal?: string | Date | null;
  penerimaDisplay: string;
  penerimaRole: string;
  penerimaJabatan?: string;
  dibuatOleh?: string;
  showMateraiHint?: boolean;
}

/**
 * Layout Kuitansi:
 * - Kop `maleo`: Format Kwitansi Resmi Yayasan Maleo Talenta Cendekia (#009999, Subtotal/PPN/Total, Ketua Yayasan)
 * - Kop `lpd` / `robotic` / `none`: Format Kuitansi Modern 2-warna LPD / Robotic Explorer
 */
export function renderModernKuitansiHtml(params: ModernKuitansiInput): string {
  const theme = resolveBrandKopTheme(params.kopSurat, params.profile);
  const amount = Number(params.amount) || 0;
  const ppnPct = Number(params.ppnPct) || 0;
  const ppnAmount = ppnPct > 0 ? Math.round((amount * ppnPct) / 100) : 0;
  const grandTotal = amount + ppnAmount;
  const formattedAmt = grandTotal > 0 ? grandTotal.toLocaleString("id-ID") : "........................";
  const terbilangText =
    grandTotal > 0 ? `# ${terbilangRupiah(grandTotal)} #` : "................................................................";

  if (params.kopSurat === "maleo") {
    const ketuaYayasan =
      params.profile?.ketuaYayasanMaleo?.trim() || "Mutiara Hikma Mahendradatta, BBA., MBA.";
    const dibuatOleh = params.dibuatOleh?.trim() || DEFAULT_ROBOTIC_PREPARER_LABEL;

    return `
      <div style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:22px 26px; max-width:860px; margin:0 auto; box-sizing:border-box; font-family:'Open Sans','Segoe UI',Arial,sans-serif; color:#0f172a; page-break-inside:avoid;">
        ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

        <div style="text-align:center; font-size:20px; font-weight:800; color:#243b55; letter-spacing:1.5px; margin:8px 0 12px;">
          KWITANSI
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:14px; background:#529495; color:#ffffff; border-radius:2px; -webkit-print-color-adjust:exact; print-color-adjust:exact;">
          <tr>
            <td style="border:none; padding:7px 14px; font-weight:700; color:#ffffff; background:#529495;">
              Kwitansi No. ${esc(params.noKwitansi || "KWT.2026.__.__.___")}
            </td>
            <td style="border:none; padding:7px 14px; text-align:right; font-weight:700; color:#ffffff; background:#529495; white-space:nowrap;">
              Tanggal : ${esc(formatDateSlashOrId(params.tanggal, "long"))}
            </td>
          </tr>
        </table>

        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; border:1px solid #cbd5e1;">
          <tr>
            <td style="width:165px; padding:8px 10px; font-weight:700; background:#f8fafc; border-bottom:1px solid #e2e8f0;">Telah Terima Dari</td>
            <td style="width:14px; padding:8px 4px; text-align:center; border-bottom:1px solid #e2e8f0;">:</td>
            <td colspan="2" style="padding:8px 10px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">
              ${esc(params.sudahTerimaDari)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 10px; font-weight:700; background:#f8fafc; border-bottom:1px solid #e2e8f0;">Sejumlah Uang</td>
            <td style="padding:8px 4px; text-align:center; border-bottom:1px solid #e2e8f0;">:</td>
            <td colspan="2" style="padding:8px 10px; font-style:italic; font-weight:700; color:#0f766e; background:#f0fdfa; border-bottom:1px solid #e2e8f0;">
              ${esc(terbilangText)}
            </td>
          </tr>
          <tr>
            <td style="padding:9px 10px; font-weight:700; background:#f8fafc; vertical-align:top; border-bottom:1px solid #e2e8f0;">Untuk Pembayaran</td>
            <td style="padding:9px 4px; text-align:center; vertical-align:top; border-bottom:1px solid #e2e8f0;">:</td>
            <td colspan="2" style="padding:9px 10px; line-height:1.45; border-bottom:1px solid #e2e8f0;">
              <div style="font-weight:600; color:#0f172a;">${esc(params.untukPembayaran)}</div>
              ${params.subLabel ? `<div style="font-size:10.5px; color:#64748b; margin-top:2px;">${esc(params.subLabel)}</div>` : ""}
              ${params.showRabCode && params.rabCode ? `<div style="font-size:10.5px; color:#009999; font-weight:700; margin-top:2px;">Kode RAB: ${esc(params.rabCode)}</div>` : ""}
            </td>
          </tr>
          <tr>
            <td colspan="2" rowspan="3" style="padding:10px; vertical-align:middle; background:#fff; border:none;">
              <div style="display:inline-flex; align-items:stretch; border:2px solid #009999; min-width:220px;">
                <div style="background:#009999; color:#fff; font-weight:800; font-size:13px; padding:7px 14px; display:flex; align-items:center;">Rp</div>
                <div style="background:#fff; color:#0f172a; font-weight:800; font-size:15px; padding:7px 16px; display:flex; align-items:center; flex:1;">${esc(formattedAmt)}</div>
              </div>
            </td>
            <td style="width:165px; padding:6px 10px; font-weight:600; text-align:right; background:#f8fafc; border-left:1px solid #cbd5e1; border-bottom:1px solid #e2e8f0;">Subtotal</td>
            <td style="width:155px; padding:6px 10px; text-align:right; font-weight:600; border-bottom:1px solid #e2e8f0; white-space:nowrap;">${esc(formatCurrency(amount))}</td>
          </tr>
          <tr>
            <td style="padding:6px 10px; font-weight:600; text-align:right; background:#f8fafc; border-left:1px solid #cbd5e1; border-bottom:1px solid #e2e8f0;">PPN (${ppnPct > 0 ? ppnPct : 11}%)</td>
            <td style="padding:6px 10px; text-align:right; color:#475569; border-bottom:1px solid #e2e8f0; white-space:nowrap;">${ppnAmount > 0 ? esc(formatCurrency(ppnAmount)) : "Rp -"}</td>
          </tr>
          <tr style="background:#009999; color:#fff;">
            <td style="padding:7px 10px; font-weight:800; text-align:right; border-left:1px solid #009999;">Total Pembayaran</td>
            <td style="padding:7px 10px; text-align:right; font-weight:800; white-space:nowrap;">${esc(formatCurrency(grandTotal))}</td>
          </tr>
        </table>

        <table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:11.5px;">
          <tr>
            <td style="width:50%; text-align:center; vertical-align:top; border:none;">
              <div style="color:#334155;">Dibuat oleh,</div>
              <div style="height:58px;"></div>
              <div style="font-weight:700; color:#0f172a; text-decoration:underline;">${esc(dibuatOleh)}</div>
            </td>
            <td style="width:50%; text-align:center; vertical-align:top; border:none;">
              <div style="color:#334155;">Disetujui Oleh,</div>
              <div style="height:58px;"></div>
              <div style="font-weight:800; color:#0f172a; text-decoration:underline;">${esc(ketuaYayasan)}</div>
              <div style="font-size:10.5px; color:#009999; font-weight:700; margin-top:2px;">Ketua Yayasan</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  return `
    <div style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:20px 24px; max-width:860px; margin:0 auto; box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif; color:#0f172a; page-break-inside:avoid;">
      ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

      <div style="text-align:center; font-size:20px; font-weight:800; color:#243b55; letter-spacing:1.5px; margin:8px 0 12px;">
        KWITANSI
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:14px; background:#529495; color:#ffffff; border-radius:2px; -webkit-print-color-adjust:exact; print-color-adjust:exact;">
        <tr>
          <td style="border:none; padding:7px 14px; font-weight:700; color:#ffffff; background:#529495;">
            Kwitansi No. ${esc(params.noKwitansi || "KWT.2026.__.__.___")}
          </td>
          <td style="border:none; padding:7px 14px; text-align:right; font-weight:700; color:#ffffff; background:#529495; white-space:nowrap;">
            Tanggal : ${esc(formatDateSlashOrId(params.tanggal, "long"))}
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:18px;">
        <tr>
          <td style="width:155px; padding:7px 4px; font-weight:700; color:#1e293b; border:none;">Telah terima dari</td>
          <td style="width:14px; padding:7px 2px; border:none;">:</td>
          <td style="padding:7px 8px; font-weight:600; color:${theme.primaryColor}; border:none; border-bottom:1px dotted #94a3b8;">
            ${esc(params.sudahTerimaDari)}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 4px; font-weight:700; color:#1e293b; border:none; vertical-align:middle;">Uang sejumlah</td>
          <td style="padding:8px 2px; border:none; vertical-align:middle;">:</td>
          <td style="padding:8px 10px; font-style:italic; font-weight:700; color:#1e3a5f; background:${theme.softTintColor}; border:none; border-bottom:1px dotted #94a3b8;">
            ${esc(terbilangText)}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 4px; font-weight:700; color:#1e293b; border:none; vertical-align:top;">Untuk pembayaran</td>
          <td style="padding:8px 2px; border:none; vertical-align:top;">:</td>
          <td style="padding:8px 8px; color:#166534; font-weight:500; border:none; border-bottom:1px dotted #94a3b8; line-height:1.45;">
            <div>${esc(params.untukPembayaran)}</div>
            ${params.subLabel ? `<div style="font-size:10.5px; color:#64748b; margin-top:2px;">${esc(params.subLabel)}</div>` : ""}
          </td>
        </tr>
        ${
          params.showRabCode && params.rabCode
            ? `<tr>
                <td style="padding:7px 4px; font-weight:700; color:#1e293b; border:none;">Kode RAB</td>
                <td style="padding:7px 2px; border:none;">:</td>
                <td style="padding:7px 8px; color:#166534; font-weight:600; border:none; border-bottom:1px dotted #94a3b8;">
                  ${esc(params.rabCode)}
                </td>
              </tr>`
            : ""
        }
      </table>

      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr>
          <td style="width:48%; vertical-align:top; border:none; padding-top:10px;">
            <div style="display:inline-flex; align-items:stretch; border:2px solid ${theme.primaryColor}; min-width:250px;">
              <div style="background:${theme.primaryColor}; color:#fff; font-weight:800; font-size:14px; padding:8px 16px; display:flex; align-items:center;">
                Rp
              </div>
              <div style="background:#fff; color:#166534; font-weight:800; font-size:16px; padding:8px 18px; display:flex; align-items:center; flex:1;">
                ${esc(formattedAmt)}
              </div>
            </div>
          </td>
          <td style="width:52%; text-align:center; vertical-align:top; border:none; font-size:11.5px;">
            <div>${esc(params.kota || "Jakarta")}, ${esc(formatDateSlashOrId(params.tanggal, "long"))}</div>
            <div style="margin-top:4px; color:#334155;">${esc(params.penerimaRole)}</div>
            <div style="height:56px;"></div>
            <div style="font-weight:800; color:${theme.primaryColor}; text-decoration:underline; font-size:12px;">
              ${esc(params.penerimaDisplay)}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export interface MaleoTandaTerimaLine {
  deskripsi: string;
  total: number;
}

export interface MaleoTandaTerimaInput {
  kopSurat: KopSuratOption;
  profile?: Partial<SntReportProfile>;
  originPrefix?: string;
  tanggal: string | Date;
  kepadaYth: string;
  items: MaleoTandaTerimaLine[];
  dibayarkanOleh?: string;
  diterimaOleh?: string;
  catatan?: string;
}

/**
 * Layout Tanda Terima Resmi Yayasan Maleo Talenta Cendekia (#00ADB5)
 * sesuai file `Format Tanda Terima.docx`.
 */
export function renderMaleoTandaTerimaHtml(params: MaleoTandaTerimaInput): string {
  const theme = resolveBrandKopTheme(params.kopSurat, params.profile);
  const primary = params.kopSurat === "maleo" ? "#00ADB5" : theme.primaryColor;
  const grandTotal = params.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
  const minRows = Math.max(params.items.length, 4);
  const rowsHtml = Array.from({ length: minRows }, (_, idx) => {
    const it = params.items[idx];
    if (!it) {
      return `<tr><td style="height:24px; border:1px solid #cbd5e1; text-align:center;">&nbsp;</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td></tr>`;
    }
    return `
      <tr>
        <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #cbd5e1; padding:7px 10px; color:#0f172a;">${esc(it.deskripsi)}</td>
        <td style="border:1px solid #cbd5e1; padding:7px 10px; text-align:right; font-weight:600; white-space:nowrap;">${esc(formatCurrency(it.total))}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="background:#fff; padding:22px 26px; max-width:820px; margin:0 auto; box-sizing:border-box; font-family:'Open Sans','Segoe UI',Arial,sans-serif; color:#0f172a; page-break-inside:avoid;">
      ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

      <div style="text-align:center; font-size:20px; font-weight:800; color:${primary}; letter-spacing:2px; margin:8px 0 12px;">
        TANDA TERIMA
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:10px;">
        <tr>
          <td style="border:none; padding:3px 0; vertical-align:top;">
            <div style="font-weight:700; color:#334155;">Kepada Yth.</div>
            <div style="font-weight:700; color:#0f172a; margin-top:2px;">${esc(params.kepadaYth || "................................................")}</div>
          </td>
          <td style="border:none; padding:3px 0; text-align:right; vertical-align:top; font-weight:600; color:#334155;">
            Tanggal: ${esc(formatDateSlashOrId(params.tanggal, "long"))}
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-top:8px;">
        <thead>
          <tr style="background:${primary}; color:#fff;">
            <th style="border:1px solid ${primary}; padding:7px 8px; text-align:center; width:44px;">NO</th>
            <th style="border:1px solid ${primary}; padding:7px 10px; text-align:left;">DESKRIPSI</th>
            <th style="border:1px solid ${primary}; padding:7px 10px; text-align:right; width:155px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background:#f0fdfa;">
            <td colspan="2" style="border:1px solid #cbd5e1; padding:8px 10px; text-align:right; font-weight:800;">Total</td>
            <td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:right; font-weight:800; color:#0f766e; white-space:nowrap;">${esc(formatCurrency(grandTotal))}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:8px; font-size:11px; color:#334155;">
        Terbilang: <em style="font-weight:600; color:#0f766e;"># ${esc(grandTotal > 0 ? terbilangRupiah(grandTotal) : "-")} #</em>
      </div>
      ${params.catatan ? `<div style="margin-top:6px; font-size:10.5px; color:#475569;">Catatan: ${esc(params.catatan)}</div>` : ""}

      <table style="width:100%; border-collapse:collapse; margin-top:30px; font-size:11.5px;">
        <tr>
          <td style="width:50%; text-align:center; vertical-align:top; border:none;">
            <div>Dibayarkan oleh,</div>
            <div style="height:64px;"></div>
            <div style="font-weight:700; text-decoration:underline;">${esc(params.dibayarkanOleh || "........................................")}</div>
          </td>
          <td style="width:50%; text-align:center; vertical-align:top; border:none;">
            <div>Diterima Oleh,</div>
            <div style="height:64px;"></div>
            <div style="font-weight:700; text-decoration:underline;">${esc(params.diterimaOleh || "........................................")}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export interface SlipHonorariumComponent {
  komponen: string;
  qty: string;
  pendapatan: number;
  potongan: number;
  keterangan: string;
}

export interface SlipHonorariumInput {
  kopSurat: KopSuratOption;
  profile?: Partial<SntReportProfile>;
  originPrefix?: string;
  periode: string;
  namaPenerima: string;
  nomorDokumen: string;
  peranJabatan: string;
  kegiatan: string;
  tanggalKegiatan: string;
  tanggalBayar: string;
  npwpNik: string;
  rekening: string;
  components: SlipHonorariumComponent[];
  catatan?: string;
  disiapkanOleh?: string;
}

/**
 * Layout SLIP HONORARIUM Resmi Yayasan Maleo Talenta Cendekia (#0DA7A0 & #CBF5F1)
 * sesuai file `Format Slip Gaji Karyawan Yayasan Maleo Talenta.docx`.
 */
export function renderSlipHonorariumHtml(params: SlipHonorariumInput): string {
  const theme = resolveBrandKopTheme(params.kopSurat, params.profile);
  const accentTeal = params.kopSurat === "maleo" ? "#0DA7A0" : theme.primaryColor;
  const softMint = params.kopSurat === "maleo" ? "#CBF5F1" : theme.softTintColor;

  const totalPendapatan = params.components.reduce((s, c) => s + (Number(c.pendapatan) || 0), 0);
  const totalPotongan = params.components.reduce((s, c) => s + (Number(c.potongan) || 0), 0);
  const honorBersih = Math.max(0, totalPendapatan - totalPotongan);

  const compRows = params.components
    .map(
      (c) => `
      <tr>
        <td style="border:1px solid #b8c8d6; padding:7px 9px; font-weight:600; color:#0f172a;">${esc(c.komponen)}</td>
        <td style="border:1px solid #b8c8d6; padding:7px 8px; text-align:center;">${esc(c.qty || "-")}</td>
        <td style="border:1px solid #b8c8d6; padding:7px 9px; text-align:right; white-space:nowrap;">${c.pendapatan > 0 ? esc(formatCurrency(c.pendapatan)) : "-"}</td>
        <td style="border:1px solid #b8c8d6; padding:7px 9px; text-align:right; color:#b91c1c; white-space:nowrap;">${c.potongan > 0 ? esc(formatCurrency(c.potongan)) : "-"}</td>
        <td style="border:1px solid #b8c8d6; padding:7px 9px; font-size:10.5px; color:#475569;">${esc(c.keterangan || "")}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="background:#fff; border:1px solid #b8c8d6; border-radius:4px; padding:22px 26px; max-width:840px; margin:0 auto; box-sizing:border-box; font-family:Calibri,'Segoe UI',Arial,sans-serif; color:#0f172a; page-break-inside:avoid;">
      ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

      <div style="text-align:center; margin:6px 0 14px;">
        <div style="font-size:19px; font-weight:800; color:${accentTeal}; letter-spacing:1.5px;">SLIP HONORARIUM</div>
        <div style="font-size:12px; font-weight:600; color:#334155; margin-top:2px;">Periode: ${esc(params.periode || "........................")}</div>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:14px;">
        <tr>
          <td style="width:18%; border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Nama Penerima</td>
          <td style="width:32%; border:1px solid #b8c8d6; padding:6px 8px; font-weight:700;">${esc(params.namaPenerima || "................................")}</td>
          <td style="width:18%; border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Nomor Dokumen</td>
          <td style="width:32%; border:1px solid #b8c8d6; padding:6px 8px; font-family:Consolas,monospace; font-weight:700; color:${accentTeal};">${esc(params.nomorDokumen || "-")}</td>
        </tr>
        <tr>
          <td style="border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Peran / Jabatan</td>
          <td style="border:1px solid #b8c8d6; padding:6px 8px;">${esc(params.peranJabatan || "-")}</td>
          <td style="border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Kegiatan</td>
          <td style="border:1px solid #b8c8d6; padding:6px 8px;">${esc(params.kegiatan || "-")}</td>
        </tr>
        <tr>
          <td style="border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Tanggal Kegiatan</td>
          <td style="border:1px solid #b8c8d6; padding:6px 8px;">${esc(params.tanggalKegiatan || "-")}</td>
          <td style="border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Tanggal Bayar</td>
          <td style="border:1px solid #b8c8d6; padding:6px 8px;">${esc(params.tanggalBayar ? formatDateSlashOrId(params.tanggalBayar, "long") : "-")}</td>
        </tr>
        <tr>
          <td style="border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">NPWP / NIK</td>
          <td style="border:1px solid #b8c8d6; padding:6px 8px; font-family:Consolas,monospace;">${esc(params.npwpNik || "-")}</td>
          <td style="border:1px solid #b8c8d6; background:${softMint}; padding:6px 8px; font-weight:700;">Rekening</td>
          <td style="border:1px solid #b8c8d6; padding:6px 8px;">${esc(params.rekening || "-")}</td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:12px;">
        <thead>
          <tr style="background:${accentTeal}; color:#fff;">
            <th style="border:1px solid ${accentTeal}; padding:7px 9px; text-align:left; width:28%;">KOMPONEN</th>
            <th style="border:1px solid ${accentTeal}; padding:7px 8px; text-align:center; width:12%;">QTY</th>
            <th style="border:1px solid ${accentTeal}; padding:7px 9px; text-align:right; width:19%;">PENDAPATAN</th>
            <th style="border:1px solid ${accentTeal}; padding:7px 9px; text-align:right; width:17%;">POTONGAN</th>
            <th style="border:1px solid ${accentTeal}; padding:7px 9px; text-align:left; width:24%;">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          ${compRows}
          <tr style="background:#f8fafc; font-weight:800;">
            <td colspan="2" style="border:1px solid #b8c8d6; padding:7px 9px; text-align:right;">TOTAL</td>
            <td style="border:1px solid #b8c8d6; padding:7px 9px; text-align:right; white-space:nowrap;">${esc(formatCurrency(totalPendapatan))}</td>
            <td style="border:1px solid #b8c8d6; padding:7px 9px; text-align:right; color:#b91c1c; white-space:nowrap;">${totalPotongan > 0 ? esc(formatCurrency(totalPotongan)) : "Rp 0"}</td>
            <td style="border:1px solid #b8c8d6; padding:7px 9px;"></td>
          </tr>
        </tbody>
      </table>

      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr style="background:${softMint}; border:1.5px solid ${accentTeal};">
          <td style="padding:10px 12px; font-size:13px; font-weight:800; color:#0f172a; letter-spacing:0.3px;">
            HONORARIUM BERSIH DITERIMA
          </td>
          <td style="padding:10px 14px; font-size:15px; font-weight:800; text-align:right; color:#0f766e; white-space:nowrap;">
            ${esc(formatCurrency(honorBersih))}
          </td>
        </tr>
      </table>

      <div style="font-size:11.5px; margin-bottom:6px;">
        <strong>Terbilang:</strong> <em style="color:#0f766e; font-weight:600;">[ ${esc(honorBersih > 0 ? terbilangRupiah(honorBersih) : "-")} ]</em>
      </div>
      <div style="font-size:11px; color:#334155; margin-bottom:18px;">
        <strong>Catatan:</strong> ${esc(params.catatan || "-")}
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px;">
        <tr>
          <td style="width:55%; border:none; vertical-align:top;">
            <div>Disiapkan oleh,</div>
            <div style="height:52px;"></div>
            <div style="font-weight:700; text-decoration:underline;">${esc(params.disiapkanOleh || DEFAULT_ROBOTIC_PREPARER_LABEL)}</div>
            <div style="font-size:10.5px; color:#475569; margin-top:2px;">Bagian Administrasi</div>
          </td>
          <td style="width:45%; border:none;"></td>
        </tr>
      </table>

      <div style="margin-top:18px; padding-top:8px; border-top:1px dashed #b8c8d6; font-size:10px; color:#64748b; text-align:center; font-style:italic;">
        Slip gaji ini dibuat secara elektronik dan hanya digunakan untuk keperluan internal.
      </div>
    </div>
  `;
}

export function buildTandaTerimaInputFromSlip(slip: SlipHonorariumInput): MaleoTandaTerimaInput {
  const totalPendapatan = slip.components.reduce((s, c) => s + (Number(c.pendapatan) || 0), 0);
  const totalPotongan = slip.components.reduce((s, c) => s + (Number(c.potongan) || 0), 0);
  const honorBersih = Math.max(0, totalPendapatan - totalPotongan);

  const positiveComps = slip.components.filter((c) => (Number(c.pendapatan) || 0) > 0);
  const items: MaleoTandaTerimaLine[] =
    positiveComps.length > 0 && totalPotongan === 0
      ? positiveComps.map((c) => {
          const detail = [c.keterangan && c.keterangan !== "-" ? c.keterangan : "", c.qty && c.qty !== "-" ? c.qty : ""]
            .filter(Boolean)
            .join(" · ");
          return {
            deskripsi: `${c.komponen} ${slip.peranJabatan} — ${slip.kegiatan} (Periode ${slip.periode}${detail ? ` · ${detail}` : ""})`,
            total: Number(c.pendapatan) || 0,
          };
        })
      : [
          {
            deskripsi: `Honorarium Bersih ${slip.peranJabatan} — ${slip.kegiatan} (Periode ${slip.periode})`,
            total: honorBersih,
          },
        ];

  const catatanParts = [
    slip.nomorDokumen ? `Ref. Slip: ${slip.nomorDokumen}` : "",
    totalPotongan > 0 ? `Potongan: ${formatCurrency(totalPotongan)}` : "",
    slip.catatan && slip.catatan !== "-" ? slip.catatan : "",
  ].filter(Boolean);

  return {
    kopSurat: slip.kopSurat,
    profile: slip.profile,
    originPrefix: slip.originPrefix,
    tanggal: slip.tanggalBayar,
    kepadaYth: slip.namaPenerima,
    items,
    dibayarkanOleh: slip.disiapkanOleh || DEFAULT_ROBOTIC_PREPARER_LABEL,
    diterimaOleh: slip.namaPenerima,
    catatan: catatanParts.join(" | "),
  };
}

export function renderTandaTerimaPdfDocumentHtml(
  receipts: MaleoTandaTerimaInput[],
  docTitle = "Tanda Terima Honorarium — Yayasan Maleo Talenta Cendekia"
): string {
  const body = receipts
    .map((r, idx) =>
      idx === 0
        ? renderMaleoTandaTerimaHtml(r)
        : `<div style="page-break-before:always; margin-top:20px;">${renderMaleoTandaTerimaHtml(r)}</div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${esc(docTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { margin: 0; background: #f1f5f9; font-family: 'Open Sans', 'Segoe UI', Arial, sans-serif; }
    .toolbar { display:flex; justify-content:space-between; align-items:center; background:#0f172a; color:#fff; padding:10px 18px; position:sticky; top:0; z-index:10; }
    .toolbar button { background:#00ADB5; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px; }
    .sheet { padding: 18px 12px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .sheet { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div><strong>${esc(docTitle)}</strong> (${receipts.length} lembar)</div>
    <button onclick="window.print()">Cetak / Simpan PDF</button>
  </div>
  <div class="sheet">
    ${body}
  </div>
</body>
</html>`;
}

export function renderSlipHonorariumPdfDocumentHtml(
  slips: SlipHonorariumInput[],
  docTitle = "Slip Honorarium — Yayasan Maleo Talenta Cendekia",
  options?: { includeTandaTerima?: boolean }
): string {
  const pages: string[] = [];
  for (const s of slips) {
    if (options?.includeTandaTerima) {
      pages.push(renderMaleoTandaTerimaHtml(buildTandaTerimaInputFromSlip(s)));
    }
    pages.push(renderSlipHonorariumHtml(s));
  }

  const body = pages
    .map((pageHtml, idx) =>
      idx === 0
        ? pageHtml
        : `<div style="page-break-before:always; margin-top:20px;">${pageHtml}</div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${esc(docTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { margin: 0; background: #f1f5f9; font-family: Calibri, 'Segoe UI', Arial, sans-serif; }
    .toolbar { display:flex; justify-content:space-between; align-items:center; background:#0f172a; color:#fff; padding:10px 18px; position:sticky; top:0; z-index:10; }
    .toolbar button { background:#0DA7A0; color:#fff; border:none; padding:7px 16px; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px; }
    .sheet { padding: 18px 12px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .sheet { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div><strong>${esc(docTitle)}</strong> (${pages.length} lembar)</div>
    <button onclick="window.print()">Cetak / Simpan PDF</button>
  </div>
  <div class="sheet">
    ${body}
  </div>
</body>
</html>`;
}

export interface ModernInvoiceLine {
  uraian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  jumlah: number;
}

export interface ModernInvoiceInput {
  kopSurat: KopSuratOption;
  profile?: Partial<SntReportProfile>;
  originPrefix?: string;
  noInvoice: string;
  tanggal: string | Date;
  jatuhTempo?: string | Date;
  ditagihkanKepada: string;
  alamatTagihan?: string;
  upTagihan?: string;
  program?: string;
  rabCode?: string;
  showRabCode?: boolean;
  items: ModernInvoiceLine[];
  ppnPct?: number;
  additionalFee?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  catatan?: string;
  kota?: string;
  dibuatOleh?: string;
  signerName?: string;
  signerTitle?: string;
}

/**
 * Layout Invoice Resmi A4 Portrait:
 * - Kop `maleo`: Format Invoice Resmi Yayasan Maleo Talenta Cendekia (#00ADB5, Bank Mandiri, Ketua Yayasan)
 * - Kop `lpd` / `robotic` / `none`: Format Invoice Resmi LPD & Robotic Explorer
 */
export function renderModernInvoiceHtml(params: ModernInvoiceInput): string {
  const theme = resolveBrandKopTheme(params.kopSurat, params.profile);
  const subtotal = params.items.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
  const ppnPct = Number(params.ppnPct) || 0;
  const ppnAmount = Math.round((subtotal * ppnPct) / 100);
  const additionalFee = Number(params.additionalFee) || 0;
  const grandTotal = subtotal + ppnAmount + additionalFee;

  const bankName = params.bankName ?? theme.defaultBankName;
  const bankAccount = params.bankAccount ?? theme.defaultBankAccount;
  const bankHolder = params.bankHolder ?? theme.defaultBankHolder;
  const signerName = params.signerName || theme.defaultSignerName;
  const signerTitle = params.signerTitle || theme.defaultSignerTitle || "Direktur";

  if (params.kopSurat === "maleo") {
    const ketuaYayasan =
      params.profile?.ketuaYayasanMaleo?.trim() || "Mutiara Hikma Mahendradatta, BBA., MBA.";
    const dibuatOleh =
      params.dibuatOleh?.trim() ||
      params.profile?.bagianAdministrasi?.trim() ||
      "........................................";
    const minMaleoRows = Math.max(params.items.length, 4);
    const maleoRows = Array.from({ length: minMaleoRows }, (_, idx) => {
      const it = params.items[idx];
      if (!it) {
        return `<tr><td style="height:24px; border:1px solid #cbd5e1; text-align:center;">&nbsp;</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td></tr>`;
      }
      return `
        <tr>
          <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:7px 8px; color:#0f172a;">${esc(it.uraian)}</td>
          <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:center;">${it.qty}${it.satuan ? ` ${esc(it.satuan)}` : ""}</td>
          <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:right; white-space:nowrap;">${esc(formatCurrency(it.hargaSatuan))}</td>
          <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:right; font-weight:600; white-space:nowrap;">${esc(formatCurrency(it.jumlah))}</td>
        </tr>
      `;
    }).join("");

    return `
      <div style="background:#fff; padding:22px 26px; max-width:820px; margin:0 auto; box-sizing:border-box; font-family:'Open Sans','Segoe UI',Arial,sans-serif; color:#0f172a;">
        ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

        <div style="text-align:center; font-size:20px; font-weight:800; color:#00ADB5; letter-spacing:2px; margin:8px 0 12px;">
          INVOICE
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:12px;">
          <tr>
            <td style="border:none; padding:3px 0; font-weight:700;">
              Faktur No. <span style="color:#009999;">${esc(params.noInvoice || "INV.2026.__.__.___")}</span>
            </td>
            <td style="border:none; padding:3px 0; text-align:right; font-weight:600; color:#334155;">
              Tanggal: ${esc(formatDateSlashOrId(params.tanggal, "long"))}
            </td>
          </tr>
        </table>

        <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:14px;">
          <thead>
            <tr style="background:#00ADB5; color:#fff;">
              <th style="border:1px solid #00ADB5; padding:6px 10px; text-align:left; width:48%;">Pelanggan</th>
              <th style="border:1px solid #00ADB5; padding:6px 10px; text-align:center; width:26%;">Tanggal Kirim</th>
              <th style="border:1px solid #00ADB5; padding:6px 10px; text-align:center; width:26%;">JATUH TEMPO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #cbd5e1; padding:8px 10px; vertical-align:top;">
                <div style="font-weight:700; color:#0f172a;">${esc(params.ditagihkanKepada || "........................................")}</div>
                ${params.alamatTagihan ? `<div style="font-size:10.5px; color:#475569; margin-top:2px;">${esc(params.alamatTagihan)}</div>` : ""}
                ${params.upTagihan ? `<div style="font-size:10.5px; color:#475569; margin-top:2px;">u.p. ${esc(params.upTagihan)}</div>` : ""}
              </td>
              <td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:center; vertical-align:middle;">
                ${esc(formatDateSlashOrId(params.tanggal, "long"))}
              </td>
              <td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:center; vertical-align:middle; font-weight:600;">
                ${params.jatuhTempo ? esc(formatDateSlashOrId(params.jatuhTempo, "long")) : "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:0;">
          <thead>
            <tr style="background:#00ADB5; color:#fff;">
              <th style="border:1px solid #00ADB5; padding:7px 6px; text-align:center; width:36px;">No</th>
              <th style="border:1px solid #00ADB5; padding:7px 8px; text-align:left;">Deskripsi</th>
              <th style="border:1px solid #00ADB5; padding:7px 6px; text-align:center; width:82px;">QTY</th>
              <th style="border:1px solid #00ADB5; padding:7px 8px; text-align:right; width:125px;">HARGA SATUAN</th>
              <th style="border:1px solid #00ADB5; padding:7px 8px; text-align:right; width:130px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${maleoRows}
            <tr style="background:#f8fafc;">
              <td colspan="4" style="border:1px solid #cbd5e1; padding:6px 10px; text-align:right; font-weight:700;">TOTAL</td>
              <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right; font-weight:700; white-space:nowrap;">${esc(formatCurrency(subtotal))}</td>
            </tr>
          </tbody>
        </table>

        <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-top:6px;">
          <tr>
            <td style="width:55%; vertical-align:top; border:none; padding:6px 14px 0 0;">
              <div style="font-size:10.5px; color:#475569; font-weight:700;">Terbilang:</div>
              <div style="font-style:italic; color:#0f766e; font-weight:600; margin-top:2px;">
                # ${esc(grandTotal > 0 ? terbilangRupiah(grandTotal) : "-")} #
              </div>
              ${params.showRabCode && params.rabCode ? `<div style="font-size:10.5px; color:#009999; font-weight:700; margin-top:6px;">Kode RAB: ${esc(params.rabCode)}</div>` : ""}
            </td>
            <td style="width:45%; vertical-align:top; border:none; padding:0;">
              <table style="width:100%; border-collapse:collapse; font-size:11.5px;">
                ${
                  ppnAmount > 0
                    ? `<tr>
                        <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; font-weight:600; background:#f8fafc;">PPN (${ppnPct}%)</td>
                        <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; width:130px; white-space:nowrap;">${esc(formatCurrency(ppnAmount))}</td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; font-weight:600; background:#f8fafc;">ADDITIONAL FEE</td>
                  <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:right; width:130px; white-space:nowrap;">${additionalFee > 0 ? esc(formatCurrency(additionalFee)) : "-"}</td>
                </tr>
                <tr style="background:#00ADB5; color:#fff;">
                  <td style="border:1px solid #00ADB5; padding:7px 8px; text-align:right; font-weight:800;">TOTAL</td>
                  <td style="border:1px solid #00ADB5; padding:7px 8px; text-align:right; font-weight:800; white-space:nowrap;">${esc(formatCurrency(grandTotal))}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="margin-top:16px; padding:10px 12px; border:1px solid #cbd5e1; background:#f0fdfa; border-radius:4px; font-size:11px; line-height:1.5;">
          <div><strong>Keterangan:</strong> ${esc(params.catatan || params.program || "Pembayaran Program SNT Wilayah 2")}</div>
          <div style="margin-top:6px;"><strong>Pembayaran dapat melalui :</strong></div>
          <div style="font-weight:800; color:#0f766e;">${
            bankName && bankAccount
              ? `${esc(bankName)} — No. Rekening: ${esc(bankAccount)}`
              : bankAccount
                ? `No. Rekening: ${esc(bankAccount)}`
                : esc(bankName || "BANK MANDIRI")
          }</div>
          <div style="font-weight:700; color:#0f172a;">a.n. ${esc(bankHolder || "MALEO TALENTA CENDEKIA")}</div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:24px; font-size:11.5px;">
          <tr>
            <td style="width:50%; text-align:center; vertical-align:top; border:none;">
              <div>Dibuat oleh,</div>
              <div style="height:60px;"></div>
              <div style="font-weight:700; text-decoration:underline;">${esc(dibuatOleh)}</div>
            </td>
            <td style="width:50%; text-align:center; vertical-align:top; border:none;">
              <div>Disetujui Oleh,</div>
              <div style="height:60px;"></div>
              <div style="font-weight:800; text-decoration:underline;">${esc(ketuaYayasan)}</div>
              <div style="font-size:10.5px; color:#009999; font-weight:700; margin-top:2px;">Ketua Yayasan</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  const minRows = Math.max(params.items.length, 6);
  const tableRows = Array.from({ length: minRows }, (_, idx) => {
    const it = params.items[idx];
    if (!it) {
      return `<tr><td style="height:22px; border:1px solid #cbd5e1;">&nbsp;</td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td><td style="border:1px solid #cbd5e1;"></td></tr>`;
    }
    return `
      <tr>
        <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #cbd5e1; padding:6px 8px; color:#1e3a8a;">${esc(it.uraian)}</td>
        <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:center; color:#1e3a8a;">${it.qty}</td>
        <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:center; color:#1e3a8a;">${esc(it.satuan)}</td>
        <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right; color:#1e3a8a; white-space:nowrap;">${esc(formatCurrency(it.hargaSatuan))}</td>
        <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right; font-weight:600; white-space:nowrap;">${esc(formatCurrency(it.jumlah))}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="background:#fff; padding:22px 26px; max-width:820px; margin:0 auto; box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif; color:#0f172a;">
      ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

      <div style="text-align:center; font-size:18px; font-weight:800; color:${theme.primaryColor}; letter-spacing:1.5px; margin:10px 0 16px;">
        INVOICE
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:14px;">
        <tr>
          <td style="width:56%; vertical-align:top; border:none; padding:0 12px 0 0;">
            <div style="font-weight:700; color:${theme.primaryColor}; margin-bottom:3px;">Ditagihkan kepada:</div>
            <div style="font-weight:700; color:#1e3a8a;">${esc(params.ditagihkanKepada || "Yayasan Maleo Talenta Cendekia")}</div>
            ${params.alamatTagihan ? `<div style="color:#334155; margin-top:2px;">${esc(params.alamatTagihan)}</div>` : ""}
            ${params.upTagihan ? `<div style="color:#334155; margin-top:2px;">u.p. ${esc(params.upTagihan)}</div>` : ""}
          </td>
          <td style="width:44%; vertical-align:top; border:none; padding:0;">
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr>
                <td style="border:none; padding:2px 4px; font-weight:700; width:92px;">No. Invoice</td>
                <td style="border:none; padding:2px 4px; color:#1e3a8a; font-weight:700;">${esc(params.noInvoice || "-")}</td>
              </tr>
              <tr>
                <td style="border:none; padding:2px 4px; font-weight:700;">Tanggal</td>
                <td style="border:none; padding:2px 4px; color:#1e3a8a;">${esc(formatDateSlashOrId(params.tanggal, "slash"))}</td>
              </tr>
              ${
                params.jatuhTempo
                  ? `<tr>
                      <td style="border:none; padding:2px 4px; font-weight:700;">Jatuh Tempo</td>
                      <td style="border:none; padding:2px 4px; color:#1e3a8a;">${esc(formatDateSlashOrId(params.jatuhTempo, "slash"))}</td>
                    </tr>`
                  : ""
              }
            </table>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:12px;">
        <tr>
          <td style="width:140px; border:none; padding:2px 0; font-weight:700;">Program</td>
          <td style="border:none; padding:2px 0; color:#1e3a8a;">${esc(params.program || "Sekolah Nasional Terintegrasi (SNT) 2026 — Koordinator Wilayah 2")}</td>
        </tr>
        ${
          params.showRabCode && params.rabCode
            ? `<tr>
                <td style="border:none; padding:2px 0; font-weight:700;">Kode RAB</td>
                <td style="border:none; padding:2px 0; color:#1e3a8a; font-weight:600;">${esc(params.rabCode)}</td>
              </tr>`
            : ""
        }
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:11px; margin-bottom:0;">
        <thead>
          <tr style="background:${theme.primaryColor}; color:#fff;">
            <th style="border:1px solid ${theme.primaryColor}; padding:7px 6px; text-align:center; width:34px;">No</th>
            <th style="border:1px solid ${theme.primaryColor}; padding:7px 8px; text-align:left;">Uraian</th>
            <th style="border:1px solid ${theme.primaryColor}; padding:7px 6px; text-align:center; width:46px;">Qty</th>
            <th style="border:1px solid ${theme.primaryColor}; padding:7px 6px; text-align:center; width:70px;">Satuan</th>
            <th style="border:1px solid ${theme.primaryColor}; padding:7px 8px; text-align:right; width:115px;">Harga Satuan</th>
            <th style="border:1px solid ${theme.primaryColor}; padding:7px 8px; text-align:right; width:120px;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:11px; margin-top:6px;">
        <tr>
          <td style="width:54%; vertical-align:top; border:none; padding:6px 14px 0 0;">
            <div style="font-weight:700; color:#0f172a;">Terbilang:</div>
            <div style="font-style:italic; color:#1e3a8a; margin-top:3px; line-height:1.4;">
              # ${esc(grandTotal > 0 ? terbilangRupiah(grandTotal) : "-")} #
            </div>
          </td>
          <td style="width:46%; vertical-align:top; border:none; padding:0;">
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr>
                <td style="border:none; padding:4px 8px; text-align:right; color:#334155;">Subtotal</td>
                <td style="border:1px solid #cbd5e1; padding:4px 8px; text-align:right; font-weight:600; width:125px;">${esc(formatCurrency(subtotal))}</td>
              </tr>
              <tr>
                <td style="border:none; padding:4px 8px; text-align:right; color:#334155;">PPN % (isi 11% jika kena)</td>
                <td style="border:1px solid #cbd5e1; padding:4px 8px; text-align:right; color:#1e3a8a;">${ppnPct}%</td>
              </tr>
              <tr>
                <td style="border:none; padding:4px 8px; text-align:right; color:#334155;">PPN</td>
                <td style="border:1px solid #cbd5e1; padding:4px 8px; text-align:right;">${ppnAmount > 0 ? esc(formatCurrency(ppnAmount)) : "-"}</td>
              </tr>
              <tr style="background:${theme.primaryColor}; color:#fff;">
                <td style="border:1px solid ${theme.primaryColor}; padding:6px 8px; text-align:right; font-weight:800;">TOTAL</td>
                <td style="border:1px solid ${theme.primaryColor}; padding:6px 8px; text-align:right; font-weight:800;">${esc(formatCurrency(grandTotal))}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; font-size:11px; margin-top:24px;">
        <tr>
          <td style="width:58%; vertical-align:top; border:none; padding-right:16px;">
            <div style="font-weight:700; color:${theme.primaryColor}; margin-bottom:4px;">Pembayaran ditransfer ke:</div>
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr>
                <td style="border:none; padding:2px 0; width:95px;">Bank</td>
                <td style="border:none; padding:2px 0; color:#1e3a8a; font-weight:600;">${esc(bankName || "........................")}</td>
              </tr>
              <tr>
                <td style="border:none; padding:2px 0;">No. Rekening</td>
                <td style="border:none; padding:2px 0; color:#1e3a8a; font-weight:600;">${esc(bankAccount || "........................")}</td>
              </tr>
              <tr>
                <td style="border:none; padding:2px 0;">Atas Nama</td>
                <td style="border:none; padding:2px 0; color:#1e3a8a; font-weight:600;">${esc(bankHolder || "........................")}</td>
              </tr>
            </table>
            <div style="font-weight:700; color:#0f172a; margin-top:14px;">Catatan:</div>
            <div style="color:#1e3a8a; margin-top:2px;">${esc(params.catatan || "Mohon cantumkan No. Invoice pada berita transfer.")}</div>
          </td>
          <td style="width:42%; vertical-align:top; text-align:center; border:none;">
            <div>${esc(params.kota || "Jakarta")}, ${esc(formatDateSlashOrId(params.tanggal, "slash"))}</div>
            <div style="margin-top:4px;">Hormat kami,</div>
            <div style="font-weight:700; margin-top:2px;">${esc(theme.entityName)}</div>
            <div style="height:58px;"></div>
            <div style="font-weight:800; color:${theme.primaryColor}; text-decoration:underline;">${esc(signerName)}</div>
            <div style="font-size:10.5px; color:#1d4ed8; margin-top:2px;">${esc(signerTitle)}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}
