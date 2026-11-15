"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CASHFLOW_READ_ROLES,
  CASHFLOW_WRITE_ROLES,
  checkAuth,
} from "@/lib/auth-check";

import {
  DEFAULT_IYRC_PARTICIPANTS,
  DEFAULT_IYRC_BUDGET_ITEMS,
  REPLACED_IYRC_PARTICIPANTS,
  IYRC_REVENUE_ITEMS,
  calculateDynamicRab,
} from "@/lib/iyrc-utils";
import { syncCashflowTransactionToJournal } from "@/lib/cashflow-accounting";

const IYRC_PNL_SEEDED_KEY = "iyrc_upnov10_revenues_seeded_v1";

/**
 * Memastikan proyek Cashflow "IYRC" ada, menautkan transaksi Gretha Rp 47,15 jt
 * ke Jurnal Umum Akuntansi Utama, serta melakukan initial seed 5 pendapatan final
 * lainnya (upNov10) berstatus PENDING secara idempoten.
 */
export async function ensureIyrcPnLCashflowSeeded(userId?: string | null) {
  const iyrcProject = await prisma.cashflowProject.upsert({
    where: { name: "IYRC" },
    update: {},
    create: {
      name: "IYRC",
      description: "Program International Youth Robotics and AI Competition (China 2026)",
    },
  });

  const seededSetting = await prisma.appSetting.findUnique({
    where: { key: IYRC_PNL_SEEDED_KEY },
  });

  if (seededSetting) {
    return iyrcProject;
  }

  // 1. Pastikan transaksi Gretha (Rp 47.150.000) terhubung ke REV_GRETHA & Jurnal Umum
  const grethaTx = await prisma.cashflowTransaction.findFirst({
    where: {
      projectId: iyrcProject.id,
      type: "INCOME",
      OR: [
        { iyrcBudgetPos: "REV_GRETHA" },
        { amount: 47150000 },
        { description: { contains: "Greta", mode: "insensitive" } },
        { description: { contains: "Gretha", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (grethaTx && (!grethaTx.iyrcBudgetPos || !grethaTx.journalEntryId)) {
    const revEventAcc = await prisma.account.findUnique({
      where: { code: "400.10.104" },
      select: { id: true },
    });
    await prisma.$transaction(async (tx) => {
      await tx.cashflowTransaction.update({
        where: { id: grethaTx.id },
        data: {
          iyrcBudgetPos: "REV_GRETHA",
          iyrcProgram: "GRETHA",
          vendorName: grethaTx.vendorName || "Pemda Kab. Kupang",
          invoiceNumber: grethaTx.invoiceNumber || "INV/REX/SNT-IYRC/XI/2026/002",
          accountId: grethaTx.accountId || revEventAcc?.id || null,
        },
      });
      await syncCashflowTransactionToJournal(tx, grethaTx.id, userId);
    }, { timeout: 20000, maxWait: 10000 });
  }

  // 2. One-time seed untuk 6 pendapatan final IYRC upNov10 (5 PENDING + Gretha COMPLETED)
  const existingRows = await prisma.cashflowTransaction.findMany({
    where: { projectId: iyrcProject.id, type: "INCOME" },
    select: { id: true, iyrcBudgetPos: true, amount: true },
  });
  const existingPositions = new Set(
    existingRows.map((r) => r.iyrcBudgetPos).filter(Boolean)
  );
  const neededCodes = Array.from(
    new Set(IYRC_REVENUE_ITEMS.map((item) => item.defaultAccountCode))
  );
  const coaRows = await prisma.account.findMany({
    where: { code: { in: neededCodes } },
    select: { id: true, code: true },
  });
  const coaByCode = new Map(coaRows.map((a) => [a.code, a.id]));

  await prisma.$transaction(async (tx) => {
    for (const rev of IYRC_REVENUE_ITEMS) {
      if (existingPositions.has(rev.budgetPos)) continue;
      if (
        rev.budgetPos === "REV_GRETHA" &&
        existingRows.some((r) => Math.abs(r.amount - 47150000) < 1)
      ) {
        continue;
      }

      const created = await tx.cashflowTransaction.create({
        data: {
          projectId: iyrcProject.id,
          date: new Date(`${rev.defaultDate}T00:00:00.000Z`),
          type: "INCOME",
          amount: rev.amount,
          description: rev.description,
          category: rev.category,
          paymentMethod: "TRANSFER",
          status: rev.initialStatus,
          vendorName: rev.vendorName,
          invoiceNumber: rev.invoiceNumber,
          currency: "IDR",
          accountId: coaByCode.get(rev.defaultAccountCode) || null,
          iyrcBudgetPos: rev.budgetPos,
          iyrcProgram: rev.program,
          createdById: userId || null,
        },
      });

      if (rev.initialStatus === "COMPLETED") {
        await syncCashflowTransactionToJournal(tx, created.id, userId);
      }
    }

    await tx.appSetting.upsert({
      where: { key: IYRC_PNL_SEEDED_KEY },
      update: { value: "true" },
      create: {
        key: IYRC_PNL_SEEDED_KEY,
        value: "true",
        label: "Initial seed 6 pendapatan final IYRC upNov10 ke Cashflow",
      },
    });
  }, { timeout: 20000, maxWait: 10000 });

  return iyrcProject;
}

/**
 * Mengambil data Peserta dan Item RAB IYRC China.
 * Jika tabel masih kosong, otomatis melakukan initial seed dari data PDF.
 */
export async function getIyrcData() {
  try {
    const { error: authError, session } = await checkAuth(CASHFLOW_READ_ROLES);
    if (authError) {
      return {
        unauthorized: true as const,
        error: authError,
        participants: [],
        budgetItems: [],
        simulation: calculateDynamicRab(0, 0, []),
        iyrcProject: null,
        iyrcTransactions: [],
        coaAccounts: [],
      };
    }
    let participants = await prisma.iyrcParticipant.findMany({
      orderBy: [{ peran: "asc" }, { nama: "asc" }],
    });

    let budgetItems = await prisma.iyrcBudgetItem.findMany({
      orderBy: { urutan: "asc" },
    });

    // Inisialisasi default jika kosong
    if (participants.length === 0) {
      await prisma.iyrcParticipant.createMany({
        data: DEFAULT_IYRC_PARTICIPANTS,
      });
      participants = await prisma.iyrcParticipant.findMany({
        orderBy: [{ peran: "asc" }, { nama: "asc" }],
      });
    }

    if (budgetItems.length === 0) {
      await prisma.iyrcBudgetItem.createMany({
        data: DEFAULT_IYRC_BUDGET_ITEMS,
      });
      budgetItems = await prisma.iyrcBudgetItem.findMany({
        orderBy: { urutan: "asc" },
      });
    } else if (!budgetItems.some((item) => item.code === "A.5")) {
      // Otomatis migrasi ke versi 5 Nov 2026 jika item A.5 belum ada di database (tetap menjaga status pembayaran)
      await syncIyrcToLatestData(true);
      participants = await prisma.iyrcParticipant.findMany({
        orderBy: [{ peran: "asc" }, { nama: "asc" }],
      });
      budgetItems = await prisma.iyrcBudgetItem.findMany({
        orderBy: { urutan: "asc" },
      });
    }

    let iyrcProject;
    try {
      iyrcProject = await ensureIyrcPnLCashflowSeeded(session?.user?.id);
    } catch (seedErr) {
      console.error("Warning: ensureIyrcPnLCashflowSeeded failed, falling back to project lookup:", seedErr);
      iyrcProject = await prisma.cashflowProject.upsert({
        where: { name: "IYRC" },
        update: {},
        create: {
          name: "IYRC",
          description: "Program International Youth Robotics and AI Competition (China 2026)",
        },
      });
    }

    const [iyrcTransactions, coaAccounts] = await Promise.all([
      prisma.cashflowTransaction.findMany({
        where: { projectId: iyrcProject.id },
        include: {
          project: true,
          account: {
            select: { id: true, code: true, name: true, type: true },
          },
          journalEntry: {
            select: { id: true, entryNumber: true, status: true },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.account.findMany({
        where: {
          isActive: true,
          type: { in: ["REVENUE", "EXPENSE"] },
          NOT: { code: { endsWith: ".000" } },
        },
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, type: true },
      }),
    ]);

    const countSiswa = participants.filter((p) => p.peran === "SISWA").length;
    const countPendamping = participants.filter((p) => p.peran === "GURU_PENDAMPING").length;

    const simulation = calculateDynamicRab(countSiswa, countPendamping, budgetItems);

    return {
      participants,
      budgetItems,
      simulation,
      iyrcProject,
      iyrcTransactions,
      coaAccounts,
    };
  } catch (error) {
    console.error("Error in getIyrcData:", error);
    throw error;
  }
}

/**
 * Sinkronisasi ulang pendapatan IYRC yang mungkin terhapus/belum berjurnal.
 */
export async function resyncIyrcCashflowAndJournals() {
  try {
    const { error: authError, session } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError || !session) return { success: false, error: authError || "Unauthorized" };

    await prisma.appSetting.deleteMany({
      where: { key: IYRC_PNL_SEEDED_KEY },
    });
    const iyrcProject = await ensureIyrcPnLCashflowSeeded(session.user.id);

    // Pastikan seluruh transaksi IYRC COMPLETED memiliki Jurnal Umum
    const completedTxs = await prisma.cashflowTransaction.findMany({
      where: {
        projectId: iyrcProject.id,
        status: "COMPLETED",
        journalEntryId: null,
      },
      select: { id: true },
    });

    for (const row of completedTxs) {
      await prisma.$transaction(async (tx) => {
        await syncCashflowTransactionToJournal(tx, row.id, session.user.id);
      }, { timeout: 20000, maxWait: 10000 });
    }

    revalidatePath("/cashflow/iyrc");
    revalidatePath("/cashflow/transactions");
    revalidatePath("/cashflow");
    revalidatePath("/jurnal");
    revalidatePath("/buku-besar");
    return { success: true };
  } catch (error: any) {
    console.error("Error in resyncIyrcCashflowAndJournals:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sinkronkan nilai RAB di database dengan jumlah peserta aktual saat ini
 */
export async function syncRabToDatabase(countSiswa: number, countPendamping: number, skipRevalidate = false) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) return { error: authError };
    await prisma.$transaction(async (tx) => {
      const currentItems = await tx.iyrcBudgetItem.findMany({ orderBy: { urutan: "asc" } });
      const { items, perPersonTravelFee, biayaKompetisiPerSiswa, biayaKompetisiPerPendamping } = calculateDynamicRab(
        countSiswa,
        countPendamping,
        currentItems
      );

      for (const item of items) {
        await tx.iyrcBudgetItem.update({
          where: { id: item.id },
          data: {
            volume: item.volume,
            tanggunganRobotic: item.tanggunganRobotic,
            tanggunganPeserta: item.tanggunganPeserta,
          },
        });
      }

      // Update biaya beban peserta aktual
      const allParticipants = await tx.iyrcParticipant.findMany();
      for (const p of allParticipants) {
        const biayaKompetisi = p.peran === "SISWA" ? biayaKompetisiPerSiswa : biayaKompetisiPerPendamping;
        const totalBiaya = biayaKompetisi + perPersonTravelFee;
        await tx.iyrcParticipant.update({
          where: { id: p.id },
          data: {
            biayaKompetisi,
            biayaPerjalananVisa: perPersonTravelFee,
            totalBiaya,
          },
        });
      }
    }, { timeout: 20000, maxWait: 10000 });

    if (!skipRevalidate) revalidatePath("/cashflow/iyrc");
    return { success: true };
  } catch (error: any) {
    console.error("Error syncing RAB:", error);
    return { error: error.message };
  }
}

/**
 * Tambah Peserta Baru (Siswa atau Pendamping)
 */
export async function addIyrcParticipant(data: {
  nama: string;
  peran: "SISWA" | "GURU_PENDAMPING";
  sntAsal: string;
  sekolahAsal?: string;
  nisnOrNip?: string;
  nomorPaspor?: string;
  catatan?: string;
}) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) return { error: authError };
    // Hitung proyeksi biaya perjalanan saat peserta bertambah
    const allP = await prisma.iyrcParticipant.findMany();
    const newSiswa = allP.filter((p) => p.peran === "SISWA").length + (data.peran === "SISWA" ? 1 : 0);
    const newPendamping = allP.filter((p) => p.peran === "GURU_PENDAMPING").length + (data.peran === "GURU_PENDAMPING" ? 1 : 0);
    
    const { perPersonTravelFee, biayaKompetisiPerSiswa, biayaKompetisiPerPendamping } = calculateDynamicRab(newSiswa, newPendamping);
    const biayaKompetisi = data.peran === "SISWA" ? biayaKompetisiPerSiswa : biayaKompetisiPerPendamping;

    await prisma.iyrcParticipant.create({
      data: {
        nama: data.nama,
        peran: data.peran,
        sntAsal: data.sntAsal,
        sekolahAsal: data.sekolahAsal || null,
        nisnOrNip: data.nisnOrNip || null,
        nomorPaspor: data.nomorPaspor || null,
        biayaKompetisi,
        biayaPerjalananVisa: perPersonTravelFee,
        totalBiaya: biayaKompetisi + perPersonTravelFee,
        statusPembayaran: "BELUM_LUNAS",
        nominalTerbayar: 0,
        catatan: data.catatan || null,
      },
    });

    // Otomatis sinkronkan volume dan anggaran RAB
    await syncRabToDatabase(newSiswa, newPendamping);

    revalidatePath("/cashflow/iyrc");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding participant:", error);
    return { error: error.message };
  }
}

/**
 * Update Data Peserta & Status Pembayaran
 */
export async function updateIyrcParticipant(
  id: string,
  data: {
    nama?: string;
    peran?: "SISWA" | "GURU_PENDAMPING";
    sntAsal?: string;
    sekolahAsal?: string;
    nisnOrNip?: string;
    nomorPaspor?: string;
    statusPembayaran?: "BELUM_LUNAS" | "CICILAN" | "LUNAS";
    nominalTerbayar?: number;
    catatan?: string;
  }
) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) return { error: authError };
    const current = await prisma.iyrcParticipant.findUnique({ where: { id } });
    if (!current) throw new Error("Peserta tidak ditemukan");

    const peranChanged = data.peran && data.peran !== current.peran;

    await prisma.iyrcParticipant.update({
      where: { id },
      data,
    });

    if (peranChanged) {
      const allP = await prisma.iyrcParticipant.findMany();
      const countSiswa = allP.filter((p) => p.peran === "SISWA").length;
      const countPendamping = allP.filter((p) => p.peran === "GURU_PENDAMPING").length;
      await syncRabToDatabase(countSiswa, countPendamping);
    }

    revalidatePath("/cashflow/iyrc");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating participant:", error);
    return { error: error.message };
  }
}

/**
 * Hapus Peserta (Otomatis menyesuaikan kembali RAB)
 */
export async function deleteIyrcParticipant(id: string) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) return { error: authError };
    await prisma.iyrcParticipant.delete({ where: { id } });

    const allP = await prisma.iyrcParticipant.findMany();
    const countSiswa = allP.filter((p) => p.peran === "SISWA").length;
    const countPendamping = allP.filter((p) => p.peran === "GURU_PENDAMPING").length;

    await syncRabToDatabase(countSiswa, countPendamping);

    revalidatePath("/cashflow/iyrc");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting participant:", error);
    return { error: error.message };
  }
}

/**
 * Reset Data ke Format Terbaru PDF (4 Siswa & 2 Guru Pendamping – versi 5 Nov 2026)
 */
export async function resetIyrcToDefault() {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) return { error: authError };
    await prisma.$transaction(async (tx) => {
      await tx.iyrcParticipant.deleteMany();
      await tx.iyrcBudgetItem.deleteMany();

      await tx.iyrcParticipant.createMany({
        data: DEFAULT_IYRC_PARTICIPANTS,
      });
      await tx.iyrcBudgetItem.createMany({
        data: DEFAULT_IYRC_BUDGET_ITEMS,
      });
    });

    revalidatePath("/cashflow/iyrc");
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting IYRC data:", error);
    return { error: error.message };
  }
}

/**
 * Sinkronkan data IYRC ke dokumen terbaru (RAB & Informasi Perjalanan versi 5 Nov 2026)
 * tanpa menghapus status pembayaran / nominal terbayar / paspor yang sudah diisi.
 * - Item RAB diganti seluruhnya sesuai PDF (nilai realisasi dipertahankan per kode).
 * - Peserta default ditambahkan / diperbarui berdasarkan nama.
 * - Peserta lama yang digantikan dihapus hanya jika belum ada pembayaran.
 */
export async function syncIyrcToLatestData(skipRevalidate = false) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) return { error: authError };

    const keptReplaced: string[] = [];
    let countSiswa = 0;
    let countPendamping = 0;

    await prisma.$transaction(async (tx) => {
      // 1. Item RAB
      const oldItems = await tx.iyrcBudgetItem.findMany();
      const realisasiByCode = new Map(oldItems.map((i) => [i.code, i.realisasi || 0]));
      await tx.iyrcBudgetItem.deleteMany();
      await tx.iyrcBudgetItem.createMany({
        data: DEFAULT_IYRC_BUDGET_ITEMS.map((i) => ({ ...i, realisasi: realisasiByCode.get(i.code) || 0 })),
      });

      // 2. Peserta
      const existing = await tx.iyrcParticipant.findMany();

      for (const oldName of REPLACED_IYRC_PARTICIPANTS) {
        const p = existing.find((e) => e.nama === oldName);
        if (!p) continue;
        if ((p.nominalTerbayar || 0) > 0) {
          keptReplaced.push(p.nama);
        } else {
          await tx.iyrcParticipant.delete({ where: { id: p.id } });
        }
      }

      for (const d of DEFAULT_IYRC_PARTICIPANTS) {
        const match = existing.find((e) => e.nama.trim().toLowerCase() === d.nama.trim().toLowerCase());
        if (match) {
          await tx.iyrcParticipant.update({
            where: { id: match.id },
            data: { peran: d.peran, sntAsal: d.sntAsal, sekolahAsal: d.sekolahAsal },
          });
        } else {
          await tx.iyrcParticipant.create({ data: d });
        }
      }

      // 3. Hitung ulang volume & beban per peserta
      const allP = await tx.iyrcParticipant.findMany();
      countSiswa = allP.filter((p) => p.peran === "SISWA").length;
      countPendamping = allP.filter((p) => p.peran === "GURU_PENDAMPING").length;

      const currentItems = await tx.iyrcBudgetItem.findMany({ orderBy: { urutan: "asc" } });
      const { items, perPersonTravelFee, biayaKompetisiPerSiswa, biayaKompetisiPerPendamping } = calculateDynamicRab(
        countSiswa,
        countPendamping,
        currentItems
      );

      for (const item of items) {
        await tx.iyrcBudgetItem.update({
          where: { id: item.id },
          data: {
            volume: item.volume,
            tanggunganRobotic: item.tanggunganRobotic,
            tanggunganPeserta: item.tanggunganPeserta,
          },
        });
      }

      for (const p of allP) {
        const biayaKompetisi = p.peran === "SISWA" ? biayaKompetisiPerSiswa : biayaKompetisiPerPendamping;
        await tx.iyrcParticipant.update({
          where: { id: p.id },
          data: {
            biayaKompetisi,
            biayaPerjalananVisa: perPersonTravelFee,
            totalBiaya: biayaKompetisi + perPersonTravelFee,
          },
        });
      }
    }, { timeout: 20000, maxWait: 10000 });

    if (!skipRevalidate) revalidatePath("/cashflow/iyrc");
    return { success: true, countSiswa, countPendamping, keptReplaced };
  } catch (error: any) {
    console.error("Error syncing IYRC to latest data:", error);
    return { error: error.message };
  }
}
