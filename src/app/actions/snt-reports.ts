"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import {
  CASHFLOW_READ_ROLES,
  SNT_MANAGE_ROLES,
  checkAuth,
} from "@/lib/auth-check";
import { normalizeReceiptUrlList } from "@/lib/expense-receipts";
import {
  formatKwitansiNumber,
  getDefaultSntReportProfile,
  SntReportProfile,
} from "@/lib/snt-report-templates";

function revalidateSntReportPaths() {
  revalidatePath("/laporan-paket");
  revalidatePath("/laporan-pengeluaran");
  revalidatePath("/pengeluaran");
  revalidatePath("/dashboard-rab");
}

export async function getSntReportWorkspaceData() {
  const { error: authError } = await checkAuth(CASHFLOW_READ_ROLES);
  if (authError) {
    return { unauthorized: true as const, error: authError };
  }

  const [rabProject, fasilitators, laporanKegiatan, rekaps, akomodasi, drafts] =
    await Promise.all([
      prisma.rabProject.findFirst({
        include: {
          categories: {
            include: {
              items: {
                include: {
                  expenses: {
                    where: { status: "APPROVED" },
                    include: {
                      fasilitator: {
                        select: { id: true, namaLengkap: true, lokasiSNT: true },
                      },
                      createdBy: {
                        select: { name: true },
                      },
                      rabItem: {
                        select: {
                          id: true,
                          code: true,
                          name: true,
                          category: { select: { name: true } },
                        },
                      },
                      kwitansiRecord: {
                        select: {
                          id: true,
                          noKwitansi: true,
                          tanggal: true,
                          perihal: true,
                          nominal: true,
                          owner: true,
                        },
                      },
                      invoiceRecord: {
                        select: { id: true, noInvoice: true },
                      },
                    },
                    orderBy: { date: "desc" },
                  },
                },
                orderBy: { code: "asc" },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.fasilitator.findMany({
        select: {
          id: true,
          namaLengkap: true,
          lokasiSNT: true,
          jabatan: true,
          instansi: true,
          pendidikan: true,
          jenisTugas: true,
          ktpUrl: true,
          bankName: true,
          bankAccount: true,
        },
        orderBy: [{ lokasiSNT: "asc" }, { namaLengkap: "asc" }],
      }),
      prisma.laporanKegiatan.findMany({
        select: {
          id: true,
          date: true,
          topic: true,
          attendance: true,
          jumlahJPIntra: true,
          jumlahJPEkstra: true,
          tingkatSekolah: true,
          foto1: true,
          foto2: true,
          fileLaporanFisik: true,
          fasilitatorId: true,
          fasilitator: {
            select: { namaLengkap: true, lokasiSNT: true },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.rekapHonorarium.findMany({
        select: {
          id: true,
          bulan: true,
          status: true,
          totalHonor: true,
          totalTransport: true,
          totalJP: true,
          totalJPIntra: true,
          totalJPEkstra: true,
          jumlahSesi: true,
          buktiPembayaranHonor: true,
          buktiPembayaranTransport: true,
          fasilitatorId: true,
          fasilitator: {
            select: { namaLengkap: true, lokasiSNT: true },
          },
          kwitansiRecord: {
            select: { noKwitansi: true },
          },
        },
        orderBy: [{ bulan: "desc" }],
      }),
      prisma.fasilitatorAkomodasi.findMany({
        select: {
          id: true,
          tipe: true,
          fasilitatorId: true,
          periodeSewa: true,
          namaPenginapan: true,
          namaKegiatan: true,
          totalNominal: true,
          expenseId: true,
          fasilitator: {
            select: { namaLengkap: true, lokasiSNT: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sntReportDraft.findMany({
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  const profileDraft = drafts.find(
    (d) => d.templateCode === "PROFILE" && d.periodKey === "GLOBAL"
  );
  const savedProfile =
    profileDraft && typeof profileDraft.content === "object" && profileDraft.content !== null
      ? { ...getDefaultSntReportProfile(), ...(profileDraft.content as Partial<SntReportProfile>) }
      : getDefaultSntReportProfile();

  return JSON.parse(
    JSON.stringify({
      unauthorized: false as const,
      rabProject,
      fasilitators,
      laporanKegiatan,
      rekaps,
      akomodasi,
      profile: savedProfile,
      drafts: drafts.map((d) => ({
        id: d.id,
        templateCode: d.templateCode,
        periodKey: d.periodKey,
        title: d.title,
        content: d.content,
        updatedAt: d.updatedAt,
      })),
    })
  );
}

export async function saveSntReportDraft(input: {
  templateCode: string;
  periodKey: string;
  title: string;
  content: Record<string, unknown>;
}) {
  try {
    const { error: authError, session } = await checkAuth(SNT_MANAGE_ROLES);
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const templateCode = String(input.templateCode || "").trim();
    const periodKey = String(input.periodKey || "DEFAULT").trim();
    if (!templateCode) {
      return { success: false, error: "Kode template tidak valid" };
    }

    const saved = await prisma.sntReportDraft.upsert({
      where: {
        templateCode_periodKey: {
          templateCode,
          periodKey,
        },
      },
      update: {
        title: input.title || templateCode,
        content: input.content as object,
        updatedById: session.user.id || null,
      },
      create: {
        templateCode,
        periodKey,
        title: input.title || templateCode,
        content: input.content as object,
        updatedById: session.user.id || null,
      },
    });

    revalidatePath("/laporan-paket");
    return { success: true, draft: JSON.parse(JSON.stringify(saved)) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan draft laporan";
    console.error("Error in saveSntReportDraft:", err);
    return { success: false, error: msg };
  }
}

/**
 * Menghasilkan nomor Kwitansi resmi (format KWC/MTC/YYYY.MM.DD.NNN) secara aman & idempoten
 * bagi transaksi ExpenseRequest yang belum memiliki KwitansiRecord valid (non-TEMP).
 * Tidak pernah menimpa nomor kwitansi resmi yang sudah ada.
 */
export async function bulkGenerateMissingKwitansi(expenseIds: string[]) {
  try {
    const { error: authError } = await checkAuth(SNT_MANAGE_ROLES);
    if (authError) {
      return { success: false, error: authError };
    }

    const uniqueIds = Array.from(new Set((expenseIds || []).filter(Boolean)));
    if (uniqueIds.length === 0) {
      return { success: false, error: "Tidak ada transaksi yang dipilih" };
    }

    const expenses = await prisma.expenseRequest.findMany({
      where: {
        id: { in: uniqueIds },
        status: "APPROVED",
      },
      include: {
        rabItem: { select: { code: true, name: true } },
        fasilitator: { select: { namaLengkap: true } },
        kwitansiRecord: true,
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    let generatedCount = 0;
    let skippedCount = 0;
    const createdNumbers: Array<{
      id: string;
      expenseId: string;
      noKwitansi: string;
      tanggal: string;
      perihal: string;
      owner: string;
      nominal: number;
    }> = [];

    for (const exp of expenses) {
      const existingList = Array.isArray(exp.kwitansiRecord)
        ? exp.kwitansiRecord
        : exp.kwitansiRecord
          ? [exp.kwitansiRecord]
          : [];

      const validExisting = existingList.find(
        (k) => k && k.noKwitansi && !k.noKwitansi.includes("TEMP")
      );
      if (validExisting) {
        skippedCount++;
        continue;
      }

      const tempExisting = existingList[0] || null;
      const expDate = exp.date || exp.createdAt || new Date();
      const perihal = `${exp.description} - ${exp.rabItem?.name || "Pengeluaran SNT"}`;
      const isTransport =
        (exp.rabItem?.name || "").toLowerCase().includes("transport") ||
        (exp.description || "").toLowerCase().includes("transport");
      const tipeKwitansi = isTransport ? "TRANSPORT" : "HONOR";

      const result = await prisma.$transaction(
        async (tx) => {
          if (tempExisting) {
            let finalNo = formatKwitansiNumber(expDate, tempExisting.noUrut);
            const conflict = await tx.kwitansiRecord.findUnique({
              where: { noKwitansi: finalNo },
              select: { id: true },
            });
            if (conflict && conflict.id !== tempExisting.id) {
              finalNo = `${finalNo}-${tempExisting.noUrut}`;
            }
            return await tx.kwitansiRecord.update({
              where: { id: tempExisting.id },
              data: {
                noKwitansi: finalNo,
                tanggal: expDate,
                perihal,
                nominal: exp.amount,
                tipeKwitansi,
              },
              select: {
                id: true,
                noKwitansi: true,
                tanggal: true,
                perihal: true,
                owner: true,
                nominal: true,
              },
            });
          }

          // Biarkan PostgreSQL autoincrement menentukan noUrut secara konsisten
          const placeholder = `KWT/GEN/${crypto.randomUUID()}`;
          const created = await tx.kwitansiRecord.create({
            data: {
              noKwitansi: placeholder,
              tanggal: expDate,
              perihal,
              nominal: exp.amount,
              expenseId: exp.id,
              tipeKwitansi,
            },
            select: { id: true, noUrut: true },
          });

          let finalNo = formatKwitansiNumber(expDate, created.noUrut);
          const conflict = await tx.kwitansiRecord.findUnique({
            where: { noKwitansi: finalNo },
            select: { id: true },
          });
          if (conflict && conflict.id !== created.id) {
            finalNo = `${finalNo}-${created.noUrut}`;
          }

          return await tx.kwitansiRecord.update({
            where: { id: created.id },
            data: { noKwitansi: finalNo },
            select: {
              id: true,
              noKwitansi: true,
              tanggal: true,
              perihal: true,
              owner: true,
              nominal: true,
            },
          });
        },
        { maxWait: 10000, timeout: 20000 }
      );

      generatedCount++;
      createdNumbers.push({
        id: result.id,
        expenseId: exp.id,
        noKwitansi: result.noKwitansi,
        tanggal: result.tanggal.toISOString().slice(0, 10),
        perihal: result.perihal,
        owner: result.owner,
        nominal: result.nominal,
      });
    }

    revalidateSntReportPaths();
    return {
      success: true,
      generatedCount,
      skippedCount,
      createdNumbers,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat nomor kwitansi";
    console.error("Error in bulkGenerateMissingKwitansi:", err);
    return { success: false, error: msg };
  }
}

/**
 * Menambahkan satu atau beberapa URL bukti nota/transfer ke ExpenseRequest
 * TANPA menghapus atau menimpa bukti lama yang sudah tersimpan.
 */
export async function appendExpenseReceipts(expenseId: string, newUrls: string[]) {
  try {
    const { error: authError } = await checkAuth(SNT_MANAGE_ROLES);
    if (authError) {
      return { success: false, error: authError };
    }

    const cleanedIncoming = normalizeReceiptUrlList(newUrls || []);
    if (cleanedIncoming.length === 0) {
      return { success: false, error: "Tidak ada file bukti valid yang diunggah" };
    }

    const existing = await prisma.expenseRequest.findUnique({
      where: { id: expenseId },
      select: { id: true, receiptUrl: true, receiptUrls: true },
    });
    if (!existing) {
      return { success: false, error: "Data pengeluaran tidak ditemukan" };
    }

    const merged = normalizeReceiptUrlList([
      ...(existing.receiptUrls || []),
      existing.receiptUrl,
      ...cleanedIncoming,
    ]);

    const updated = await prisma.expenseRequest.update({
      where: { id: expenseId },
      data: {
        receiptUrls: merged,
        receiptUrl: existing.receiptUrl || merged[0] || null,
      },
      select: { id: true, receiptUrl: true, receiptUrls: true },
    });

    revalidateSntReportPaths();
    return { success: true, expense: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menambahkan file bukti";
    console.error("Error in appendExpenseReceipts:", err);
    return { success: false, error: msg };
  }
}

/**
 * Memperbarui metadata cetak KwitansiRecord (tanggal, Sudah Terima Dari / owner, perihal)
 * tanpa pernah mengubah nomor kwitansi resmi (noKwitansi / noUrut) maupun nominal transaksi.
 */
export async function updateKwitansiRecordDetails(input: {
  kwitansiId: string;
  tanggal: string;
  owner: string;
  perihal: string;
}) {
  try {
    const { error: authError } = await checkAuth(SNT_MANAGE_ROLES);
    if (authError) {
      return { success: false, error: authError };
    }

    if (!input.kwitansiId) {
      return { success: false, error: "ID Kwitansi tidak valid" };
    }

    const parsedDate = input.tanggal ? new Date(`${input.tanggal}T00:00:00.000Z`) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: "Tanggal kwitansi tidak valid" };
    }

    const updated = await prisma.kwitansiRecord.update({
      where: { id: input.kwitansiId },
      data: {
        tanggal: parsedDate,
        owner: input.owner.trim() || "Yayasan Maleo Talenta Cendekia",
        perihal: input.perihal.trim(),
      },
      select: {
        id: true,
        noKwitansi: true,
        tanggal: true,
        owner: true,
        perihal: true,
      },
    });

    revalidateSntReportPaths();
    return { success: true, kwitansi: JSON.parse(JSON.stringify(updated)) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui detail kwitansi";
    console.error("Error in updateKwitansiRecordDetails:", err);
    return { success: false, error: msg };
  }
}

/**
 * Mencatat transaksi dari Dokumen Bukti Wajib ke pos RAB resmi (ExpenseRequest status APPROVED)
 * secara eksplisit atas konfirmasi pengguna, beserta pembuatan KwitansiRecord opsional.
 * Tidak pernah mengubah atau menghapus transaksi lama.
 */
export async function recordEvidenceToRabExpense(input: {
  rabCode: string;
  date: string;
  description: string;
  amount: number;
  fasilitatorId?: string;
  generateKwitansi?: boolean;
  kwitansiOwner?: string;
}) {
  try {
    const { error: authError, session } = await checkAuth(SNT_MANAGE_ROLES);
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const amount = Number(input.amount) || 0;
    if (amount <= 0) {
      return { success: false, error: "Nominal transaksi harus lebih dari 0" };
    }
    if (!input.description?.trim()) {
      return { success: false, error: "Uraian pengeluaran tidak boleh kosong" };
    }

    const officialCategories = await prisma.rabCategory.findMany({
      where: {
        OR: [{ name: { startsWith: "A." } }, { name: { startsWith: "B." } }],
      },
      include: { items: true },
    });

    const targetCode = input.rabCode.trim().toLowerCase();
    let matchedItemId: string | null = null;
    let matchedItemName = "";

    for (const cat of officialCategories) {
      const found = cat.items.find(
        (it) => it.code.trim().toLowerCase() === targetCode
      );
      if (found) {
        matchedItemId = found.id;
        matchedItemName = found.name;
        break;
      }
    }

    if (!matchedItemId) {
      return {
        success: false,
        error: `Pos RAB dengan kode "${input.rabCode}" tidak ditemukan pada kategori A/B.`,
      };
    }

    const parsedDate = input.date ? new Date(`${input.date}T00:00:00.000Z`) : new Date();
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const result = await prisma.$transaction(
      async (tx) => {
        const expense = await tx.expenseRequest.create({
          data: {
            rabItemId: matchedItemId as string,
            amount,
            description: input.description.trim(),
            date: safeDate,
            status: "APPROVED",
            createdById: session.user.id,
            approvedById: session.user.id,
            fasilitatorId: input.fasilitatorId || null,
          },
          select: { id: true, amount: true, description: true, date: true },
        });

        let noKwitansi: string | null = null;
        if (input.generateKwitansi) {
          const placeholder = `KWT/GEN/${crypto.randomUUID()}`;
          const isTransport =
            matchedItemName.toLowerCase().includes("transport") ||
            input.description.toLowerCase().includes("transport");
          const createdKwt = await tx.kwitansiRecord.create({
            data: {
              noKwitansi: placeholder,
              tanggal: safeDate,
              perihal: `${input.description.trim()} - ${matchedItemName}`,
              owner: input.kwitansiOwner?.trim() || "Yayasan Maleo Talenta Cendekia",
              nominal: amount,
              expenseId: expense.id,
              tipeKwitansi: isTransport ? "TRANSPORT" : "HONOR",
            },
            select: { id: true, noUrut: true },
          });
          let finalNo = formatKwitansiNumber(safeDate, createdKwt.noUrut);
          const conflict = await tx.kwitansiRecord.findUnique({
            where: { noKwitansi: finalNo },
            select: { id: true },
          });
          if (conflict && conflict.id !== createdKwt.id) {
            finalNo = `${finalNo}-${createdKwt.noUrut}`;
          }
          await tx.kwitansiRecord.update({
            where: { id: createdKwt.id },
            data: { noKwitansi: finalNo },
          });
          noKwitansi = finalNo;
        }

        return { expense, noKwitansi };
      },
      { maxWait: 10000, timeout: 20000 }
    );

    revalidateSntReportPaths();
    revalidatePath("/laporan/kka-snt");
    return {
      success: true,
      expenseId: result.expense.id,
      noKwitansi: result.noKwitansi,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mencatat ke realisasi RAB";
    console.error("Error in recordEvidenceToRabExpense:", err);
    return { success: false, error: msg };
  }
}

/**
 * Menghasilkan rekomendasi AI (Gemini, dengan fallback deterministik) untuk strategi
 * mencapai serapan > 80% RAB dan menjaga efisiensi/margin organisasi secara SAH & AMAN AUDIT PPK.
 */
export async function generateSntEfficiencyRecommendation(input: {
  totalBudget: number;
  currentRealized: number;
  target80Amount: number;
  internalDeliverablePotential: number;
  topRemainingItems: Array<{
    code: string;
    name: string;
    remaining: number;
    marginLeverage: string;
    requiredEvidence: string;
  }>;
}) {
  const { error: authError } = await checkAuth(CASHFLOW_READ_ROLES);
  if (authError) {
    return { success: false, error: authError };
  }

  const gap = Math.max(0, input.target80Amount - input.currentRealized);
  const pct = input.totalBudget > 0 ? ((input.currentRealized / input.totalBudget) * 100).toFixed(1) : "0.0";

  const fallbackText = [
    `### Ringkasan Posisi Serapan & Margin Sehat (Aman Audit PPK)`,
    `- **Serapan Saat Ini:** Rp${input.currentRealized.toLocaleString("id-ID")} (${pct}% dari pagu Rp${input.totalBudget.toLocaleString("id-ID")}).`,
    `- **Gap Minimal Menuju 80%:** Rp${gap.toLocaleString("id-ID")} (target minimal Rp${input.target80Amount.toLocaleString("id-ID")}).`,
    `- **Potensi Pos Internal / Deliverable Sendiri:** Rp${input.internalDeliverablePotential.toLocaleString("id-ID")} (sumber surplus organisasi paling sehat & sah secara hukum).`,
    ``,
    `### 4 Strategi Utama Optimalisasi Serapan > 80% & Efisiensi Biaya yang Sah`,
    `1. **Prioritaskan Pos Deliverable & SDM Internal (Surplus Tetap di Organisasi):** Fokus tuntaskan pos **A.2 Tim Program Modul (Rp133,3 jt)**, **B.6a Pembinaan Kompetisi (Rp126 jt)**, **B.5a Langganan LMS (Rp112,2 jt)**, **A.1/A.3 Ketua Tim & Korwil (Rp57,6 jt)**, dan **B.4a Narasumber ToT (Rp21,2 jt)**. Karena dikerjakan tim & aset internal, pencairan pagu menjadi pendapatan/honor sah tim sekaligus langsung menutup sebagian besar gap 80% dengan bukti kuat (SK, naskah modul, BAST, log jam, jurnal pertemuan, akun LMS aktif, bukti terima honor).`,
    `2. **Efisiensi Belanja Eksternal Secara Legal:** Pada pos perjalanan dinas Korwil (**B.2a–2c**), sewa rumah (**B.3b**), dan akomodasi ToT (**B.4c**), lakukan negosiasi tarif paket, pemesanan tiket lebih awal, dan penggabungan rute kunjungan lokasi berdekatan — tetap menggunakan bukti riil (tiket/boarding pass, bill hotel, kontrak sewa aktual).`,
    `3. **Gunakan Mekanisme Adendum / Pergeseran Pos RAB Resmi ke PPK:** Apabila ada pos yang realisasinya hemat/berlebih (misalnya sebagian fasilitator berdomisili lokal sehingga pos Sewa Rumah B.3b tidak terpakai penuh sementara kebutuhan transport/pembinaan meningkat), **jangan menukar atau menyamarkan jenis kwitansi** (mis. memakai kwitansi sewa rumah untuk transport) karena berisiko temuan audit Itjen/BPK. Ajukan surat permohonan **revisi/pergeseran antarpos RAB (adendum) resmi ke PPK** dengan justifikasi kondisi lapangan.`,
    `4. **Kelengkapan Bukti Wajib Template 13 Serentak:** Pastikan 100% transaksi yang dicatat memiliki nomor kwitansi resmi, daftar tanda terima bertanda tangan (termasuk Daftar Tanda Terima Honor Fasilitator bulanan A.4), dan file bukti nota/transfer agar proses verifikasi Termin II (30%) lancar tanpa koreksi.`,
  ].join("\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: true, source: "rule-based" as const, markdown: fallbackText };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const itemsListText = input.topRemainingItems
      .slice(0, 10)
      .map(
        (it) =>
          `- [${it.code}] ${it.name}: sisa Rp${it.remaining.toLocaleString("id-ID")} | tipe: ${it.marginLeverage} | bukti wajib: ${it.requiredEvidence}`
      )
      .join("\n");

    const prompt = `Anda adalah konsultan keuangan proyek pendidikan Swakelola Kemendikdasmen & akuntan audit yang membantu Yayasan Pelaksana Program KKA SNT 2026 Wilayah 2 (6 lokasi).

Data RAB saat ini:
- Total Pagu RAB (A+B): Rp${input.totalBudget.toLocaleString("id-ID")}
- Realisasi saat ini: Rp${input.currentRealized.toLocaleString("id-ID")} (${pct}%)
- Target minimal 80% untuk Termin II: Rp${input.target80Amount.toLocaleString("id-ID")} (kekurangan: Rp${gap.toLocaleString("id-ID")})
- Potensi pos deliverable/SDM internal: Rp${input.internalDeliverablePotential.toLocaleString("id-ID")}

Pos dengan sisa anggaran terbesar:
${itemsListText}

Tugas:
Berikan rekomendasi praktis dalam Bahasa Indonesia (ringkas, terstruktur, maksimal 350 kata) mengenai:
1. Urutan eksekusi pos RAB untuk menembus serapan > 80% secara cepat.
2. Cara memperoleh margin/surplus organisasi yang SAH & AMAN AUDIT melalui efisiensi belanja legal dan optimalisasi pos deliverable/tim internal (A.1, A.2, A.3, B.4a, B.5a, B.6a).
3. Panduan kepatuhan bukti wajib Template 13 — tegaskan secara profesional agar setiap bukti mencerminkan pengeluaran riil dan gunakan mekanisme adendum/pergeseran pos resmi ke PPK apabila terdapat penghematan di suatu pos (seperti sewa rumah) yang ingin dialihkan ke pos lain (seperti transport), BUKAN menyamarkan kwitansi.

Jangan pernah menyarankan pemalsuan, rekayasa, atau penyamaran kwitansi.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text?.trim();
    if (!text) {
      return { success: true, source: "rule-based" as const, markdown: fallbackText };
    }
    return { success: true, source: "gemini-ai" as const, markdown: text };
  } catch (err) {
    console.error("Gemini efficiency recommendation fallback:", err);
    return { success: true, source: "rule-based" as const, markdown: fallbackText };
  }
}
