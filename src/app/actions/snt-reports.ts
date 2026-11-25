"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
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
