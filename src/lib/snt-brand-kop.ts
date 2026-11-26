import { formatCurrency, terbilangRupiah } from "./format";
import type { KopSuratOption, SntReportProfile } from "./snt-report-templates";

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
      primaryColor: "#1F3864",
      accentColor: "#15803D",
      softTintColor: "#F0F7F4",
      address: profile?.alamatYayasanMaleo?.trim() || "Intermark Indonesia, Ruko Alfresco Dining No.8, BSD City, Tangerang Selatan 15310",
      contactLine: "08119661017 | maleotalentacendekia@gmail.com",
      defaultBankName: "",
      defaultBankAccount: "",
      defaultBankHolder: "Yayasan Maleo Talenta Cendekia",
      defaultSignerName: profile?.ketuaTimPelaksana?.trim() || "Jully Tjindrawan, MBA",
      defaultSignerTitle: "Ketua Tim Pelaksana",
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
  untukPembayaran: string;
  rabCode?: string;
  showRabCode?: boolean;
  subLabel?: string;
  kota: string;
  tanggal?: string | Date | null;
  penerimaDisplay: string;
  penerimaRole: string;
  penerimaJabatan?: string;
  showMateraiHint?: boolean;
}

/**
 * Layout Kuitansi Modern sesuai Mockup LPD & Robotic Explorer (header dual-tone,
 * kotak nominal 2-warna [Rp | angka], kotak terbilang biru muda, hint materai Rp10.000).
 */
export function renderModernKuitansiHtml(params: ModernKuitansiInput): string {
  const theme = resolveBrandKopTheme(params.kopSurat, params.profile);
  const amount = Number(params.amount) || 0;
  const formattedAmt = amount > 0 ? amount.toLocaleString("id-ID") : "........................";
  const terbilangText =
    amount > 0 ? `# ${terbilangRupiah(amount)} #` : "................................................................";

  return `
    <div style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:20px 24px; max-width:860px; margin:0 auto; box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif; color:#0f172a; page-break-inside:avoid;">
      ${renderBrandKopHtml(params.kopSurat, params.profile, params.originPrefix || "")}

      <div style="text-align:center; font-size:18px; font-weight:800; color:${theme.primaryColor}; letter-spacing:2px; margin:8px 0 6px;">
        KUITANSI
      </div>

      <div style="display:flex; justify-content:flex-end; align-items:center; gap:14px; font-size:11.5px; margin-bottom:14px;">
        <span style="font-weight:700; color:#334155;">No. Kuitansi</span>
        <span style="font-weight:700; color:${theme.primaryColor};">${esc(params.noKwitansi || "................................")}</span>
      </div>

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
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  catatan?: string;
  kota?: string;
  signerName?: string;
  signerTitle?: string;
}

/**
 * Layout Invoice Resmi A4 Portrait sesuai Mockup LPD & Robotic Explorer.
 */
export function renderModernInvoiceHtml(params: ModernInvoiceInput): string {
  const theme = resolveBrandKopTheme(params.kopSurat, params.profile);
  const subtotal = params.items.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
  const ppnPct = Number(params.ppnPct) || 0;
  const ppnAmount = Math.round((subtotal * ppnPct) / 100);
  const grandTotal = subtotal + ppnAmount;

  const bankName = params.bankName ?? theme.defaultBankName;
  const bankAccount = params.bankAccount ?? theme.defaultBankAccount;
  const bankHolder = params.bankHolder ?? theme.defaultBankHolder;
  const signerName = params.signerName || theme.defaultSignerName;
  const signerTitle = params.signerTitle || "Direktur";

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
