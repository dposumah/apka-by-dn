"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import {
  DEFAULT_IYRC_PARTICIPANTS,
  DEFAULT_IYRC_BUDGET_ITEMS,
  calculateDynamicRab,
} from "@/lib/iyrc-utils";

/**
 * Mengambil data Peserta dan Item RAB IYRC China.
 * Jika tabel masih kosong, otomatis melakukan initial seed dari data PDF.
 */
export async function getIyrcData() {
  try {
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
    }

    // Pastikan project IYRC di CashflowProject ada
    await prisma.cashflowProject.upsert({
      where: { name: "IYRC" },
      update: {},
      create: {
        name: "IYRC",
        description: "Program International Youth Robotics and AI Competition (China 2026)",
      },
    });

    const countSiswa = participants.filter((p) => p.peran === "SISWA").length;
    const countPendamping = participants.filter((p) => p.peran === "GURU_PENDAMPING").length;

    const simulation = calculateDynamicRab(countSiswa, countPendamping, budgetItems);

    return {
      participants,
      budgetItems,
      simulation,
    };
  } catch (error) {
    console.error("Error in getIyrcData:", error);
    throw error;
  }
}

/**
 * Sinkronkan nilai RAB di database dengan jumlah peserta aktual saat ini
 */
export async function syncRabToDatabase(countSiswa: number, countPendamping: number) {
  try {
    const currentItems = await prisma.iyrcBudgetItem.findMany({ orderBy: { urutan: "asc" } });
    const { items, perPersonTravelFee } = calculateDynamicRab(countSiswa, countPendamping, currentItems);

    for (const item of items) {
      await prisma.iyrcBudgetItem.update({
        where: { id: item.id },
        data: {
          volume: item.volume,
          tanggunganRobotic: item.tanggunganRobotic,
          tanggunganPeserta: item.tanggunganPeserta,
        },
      });
    }

    // Update biaya beban peserta aktual
    const allParticipants = await prisma.iyrcParticipant.findMany();
    for (const p of allParticipants) {
      const biayaKompetisi = p.peran === "SISWA" ? 30000000 : 12000000;
      const totalBiaya = biayaKompetisi + perPersonTravelFee;
      await prisma.iyrcParticipant.update({
        where: { id: p.id },
        data: {
          biayaKompetisi,
          biayaPerjalananVisa: perPersonTravelFee,
          totalBiaya,
        },
      });
    }

    revalidatePath("/cashflow/iyrc");
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
    const biayaKompetisi = data.peran === "SISWA" ? 30000000 : 12000000;
    
    // Hitung proyeksi biaya perjalanan saat peserta bertambah
    const allP = await prisma.iyrcParticipant.findMany();
    const newSiswa = allP.filter((p) => p.peran === "SISWA").length + (data.peran === "SISWA" ? 1 : 0);
    const newPendamping = allP.filter((p) => p.peran === "GURU_PENDAMPING").length + (data.peran === "GURU_PENDAMPING" ? 1 : 0);
    
    const { perPersonTravelFee } = calculateDynamicRab(newSiswa, newPendamping);

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
 * Reset Data ke Format Awal PDF (3 Siswa & 2 Guru Pendamping)
 */
export async function resetIyrcToDefault() {
  try {
    await prisma.iyrcParticipant.deleteMany();
    await prisma.iyrcBudgetItem.deleteMany();

    await prisma.iyrcParticipant.createMany({
      data: DEFAULT_IYRC_PARTICIPANTS,
    });
    await prisma.iyrcBudgetItem.createMany({
      data: DEFAULT_IYRC_BUDGET_ITEMS,
    });

    revalidatePath("/cashflow/iyrc");
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting IYRC data:", error);
    return { error: error.message };
  }
}
