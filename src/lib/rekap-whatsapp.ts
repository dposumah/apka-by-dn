import { hitungDetailTransportRekap } from "@/lib/transport";

/**
 * Menormalkan nomor telepon Indonesia ke format internasional WhatsApp (`628...`).
 * Contoh DB existing: "82292384728", "081334789107", "+62 857-1390-2667".
 */
export function normalizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  } else if (digits.startsWith("620")) {
    digits = "62" + digits.slice(3);
  }

  // Minimal 9 digit agar valid sebagai nomor HP
  return digits.length >= 9 ? digits : "";
}

export function formatBulanRekap(bulan?: string | null): string {
  if (!bulan) return "-";
  const parts = String(bulan).split("-");
  if (parts.length !== 2) return bulan;
  const [year, month] = parts;
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
}

export function buildRekapWhatsAppMessage(
  rekap: any,
  overrides?: {
    urlHonor?: string | null;
    urlTransport?: string | null;
  }
): string {
  const namaLengkap = rekap?.fasilitator?.namaLengkap || "Bapak/Ibu Fasilitator";
  const lokasi = rekap?.fasilitator?.lokasiSNT || "-";
  const bankName = rekap?.fasilitator?.bankName || "-";
  const bankAccount = rekap?.fasilitator?.bankAccount || "-";
  const isHanifudin =
    namaLengkap.toLowerCase().includes("hanifudin") ||
    namaLengkap.toLowerCase().includes("hanif");

  const detailTransport = hitungDetailTransportRekap(rekap);
  const totalTransport = detailTransport.totalTransport;
  const totalHonor = Math.round(Number(rekap?.totalHonor) || 0);
  const totalTransfer = totalHonor + Math.round(totalTransport);

  const jpTotal = rekap?.totalJP || 0;
  const jpIntra = rekap?.totalJPIntra || 0;
  const jpEkstra = rekap?.totalJPEkstra || 0;
  const jpDetail = isHanifudin
    ? "Kesepakatan Khusus"
    : jpIntra > 0 && jpEkstra > 0
    ? `${jpTotal} JP (Intra: ${jpIntra} JP, Ekstra: ${jpEkstra} JP)`
    : `${jpTotal} JP`;

  const urlHonor = overrides?.urlHonor ?? rekap?.buktiPembayaranHonor;
  const urlTransport = overrides?.urlTransport ?? rekap?.buktiPembayaranTransport;

  const lines: string[] = [
    `Yth. Bapak/Ibu *${namaLengkap}*,`,
    "",
    `Berikut kami sampaikan informasi pembayaran *Honorarium & Bantuan Transportasi Fasilitator SNT*:`,
    "",
    `📅 *Periode:* ${formatBulanRekap(rekap?.bulan)} (${rekap?.bulan || "-"})`,
    `📍 *Lokasi SNT:* ${lokasi}`,
    "",
    `💰 *Rincian Pembayaran:*`,
    `• Honorarium: *Rp ${totalHonor.toLocaleString("id-ID")}* (${jpDetail})`,
  ];

  if (totalTransport > 0) {
    lines.push(
      `• Bantuan Transport: *Rp ${Math.round(totalTransport).toLocaleString("id-ID")}* (${detailTransport.ringkasanKeterangan})`
    );
  } else {
    lines.push(
      `• Bantuan Transport: *Rp 0* (${isHanifudin ? "Tanpa Transport" : "Daring / Tanpa Transport"})`
    );
  }

  lines.push(`• *TOTAL DITRANSFER: Rp ${totalTransfer.toLocaleString("id-ID")}*`);
  lines.push("");
  lines.push(`🏦 *Rekening Tujuan:*`);
  lines.push(`• Bank: ${bankName}`);
  lines.push(`• No. Rekening: \`${bankAccount}\``);
  lines.push(`• Atas Nama: *${namaLengkap}*`);

  if (urlHonor || urlTransport) {
    lines.push("");
    lines.push(`📎 *Link Bukti Transfer:*`);
    if (urlHonor) lines.push(`• Bukti Honorarium: ${urlHonor}`);
    if (urlTransport) lines.push(`• Bukti Transportasi: ${urlTransport}`);
  }

  lines.push("");
  lines.push(
    `Mohon konfirmasinya apabila dana sudah masuk ke rekening Bapak/Ibu. Terima kasih atas dedikasi dan kerja samanya! 🙏`
  );

  return lines.join("\n");
}

export function getWhatsAppDesktopUrl(phone: string, text: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  return `whatsapp://send?phone=${normalized}&text=${encodeURIComponent(text)}`;
}

export function getWhatsAppWebUrl(phone: string, text: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

/**
 * Meluncurkan aplikasi WhatsApp Desktop yang terpasang & login di komputer melalui custom URI `whatsapp://`.
 * Menggunakan elemen anchor sementara agar halaman React tetap utuh tanpa navigasi/popup blank.
 */
export function launchWhatsAppDesktop(phone: string, text: string): boolean {
  if (typeof document === "undefined") return false;
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return false;

  const uri = getWhatsAppDesktopUrl(normalized, text);
  const a = document.createElement("a");
  a.href = uri;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 500);
  return true;
}

/**
 * Mengonversi file gambar (JPG/PNG/WEBP) menjadi image/png lalu menyalinnya ke clipboard
 * agar admin bisa langsung menekan Ctrl+V pada jendela chat WhatsApp Desktop.
 */
export async function copyImageFileToClipboard(file: File): Promise<boolean> {
  if (typeof window === "undefined" || !navigator?.clipboard?.write || !window.ClipboardItem) {
    return false;
  }
  if (!file.type.startsWith("image/")) {
    return false;
  }

  try {
    const pngBlob: Blob = await new Promise((resolve, reject) => {
      if (file.type === "image/png") {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context unavailable"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            "image/png"
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });

    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    return true;
  } catch (err) {
    console.warn("Clipboard image copy skipped:", err);
    return false;
  }
}
