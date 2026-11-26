import type { Prisma, PrismaClient } from "@prisma/client";
import {
  assertFiscalPeriodOpen,
  generateNextEntryNumber,
} from "@/lib/accounting-server";

export type TxOrPrisma = Prisma.TransactionClient | PrismaClient;

export const IOT_SKIP_PROJECT_NAME = "Pengadaan Starter Kit IoT 100 Kit";

/**
 * Menentukan kode akun Kas/Bank (Debit saat masuk, Kredit saat keluar)
 * berdasarkan metode pembayaran pada Cashflow Proyek.
 */
export function resolveCashAccountCode(paymentMethod?: string | null): string {
  const pm = (paymentMethod || "").toUpperCase();
  if (pm === "CASH" || pm.includes("TUNAI") || pm.includes("KAS")) {
    return "111.10.101"; // Kas
  }
  return "111.11.101"; // Bank BCA
}

/**
 * Memetakan kategori / pos IYRC / deskripsi transaksi Cashflow ke kode akun COA default
 * di Akuntansi Utama (Buku Besar & Laba Rugi).
 */
export function suggestCashflowAccountCode(params: {
  type: string;
  category?: string | null;
  iyrcBudgetPos?: string | null;
  description?: string | null;
}): string {
  const { type, category, iyrcBudgetPos, description } = params;
  const text = `${category || ""} ${description || ""}`.toLowerCase();
  const descLower = (description || "").toLowerCase();

  if (type === "INCOME") {
    if (iyrcBudgetPos === "REV_KIT_SNT" || text.includes("penjualan kit") || text.includes("robot kit")) {
      return "400.10.102"; // Robot
    }
    if (iyrcBudgetPos === "REV_SNT_1" || iyrcBudgetPos === "REV_SNT_2" || text.includes("rab snt")) {
      return "400.10.105"; // Pendapatan Proyek KKA SNT 2026
    }
    if (text.includes("kursus") || text.includes("spp")) {
      return "400.10.101";
    }
    return "400.10.104"; // Penyelenggara Acara
  }

  // EXPENSE
  if (iyrcBudgetPos === "MY_ROBOT" || text.includes("my-robot") || text.includes("registrasi") || text.includes("trainer") || text.includes("instructor training")) {
    return "600.10.027"; // Biaya Event
  }
  if (iyrcBudgetPos === "KIT_PPN") {
    if (descLower.includes("ppn") || descLower.includes("pajak") || descLower.includes("pph")) {
      return "600.10.037"; // Penerimaan Negara / Pajak
    }
    return "500.10.102"; // Pembelian Robot
  }
  if (
    iyrcBudgetPos === "HOTEL" ||
    iyrcBudgetPos === "TIKET_VISA" ||
    text.includes("hotel") ||
    text.includes("tiket") ||
    text.includes("visa") ||
    text.includes("asuransi")
  ) {
    return "600.10.026"; // Biaya Perjalanan Dinas
  }
  if (descLower.includes("ppn") || descLower.includes("pph") || descLower.includes("pajak")) {
    return "600.10.037"; // Penerimaan Negara
  }
  if (text.includes("makan") || text.includes("konsumsi") || text.includes("lunch")) {
    return "600.10.022"; // Biaya Makan Minum
  }
  if (text.includes("transport") || text.includes("bandara") || text.includes("grab") || text.includes("taxi")) {
    return "600.10.004"; // Biaya Transportasi
  }
  if (text.includes("honor") || text.includes("pelatih") || text.includes("gaji")) {
    return "600.10.001"; // Biaya Gaji
  }
  if (text.includes("kirim") || text.includes("ongkir")) {
    return "600.10.018"; // Biaya Pengiriman
  }
  if (text.includes("robot") || text.includes("komponen") || text.includes("kit") || text.includes("barang")) {
    return "500.10.102"; // Pembelian Robot
  }

  return iyrcBudgetPos === "TAMBAHAN" ? "600.10.032" : "600.10.027";
}

/**
 * Menebak Pos Anggaran IYRC (MY_ROBOT / KIT_PPN / HOTEL / TIKET_VISA / TAMBAHAN)
 * dari kategori, vendor, atau keterangan transaksi.
 */
export function inferIyrcBudgetPos(params: {
  type: string;
  category?: string | null;
  vendorName?: string | null;
  description?: string | null;
  existingPos?: string | null;
}): string | null {
  if (params.existingPos) return params.existingPos;
  const text = `${params.category || ""} ${params.vendorName || ""} ${params.description || ""}`.toLowerCase();

  if (params.type === "EXPENSE") {
    // Bagian 8 (Biaya Tambahan) dicek terlebih dahulu agar tidak tertukar dengan Pos 2 / Pos 5
    if (
      text.includes("ww2611-00009") ||
      text.includes("trainer") ||
      text.includes("instructor training") ||
      text.includes("lauw mei hoa") ||
      text.includes("laundry") ||
      text.includes("print") ||
      text.includes("banner") ||
      text.includes("maket") ||
      text.includes("game mat") ||
      text.includes("alat-alat")
    ) {
      return "TAMBAHAN";
    }
    if (text.includes("my-robot") || text.includes("ww2611") || text.includes("registrasi")) {
      return "MY_ROBOT";
    }
    if (text.includes("hotel") || text.includes("kedoya") || text.includes("kamar") || text.includes("extrabed")) {
      return "HOTEL";
    }
    if (text.includes("tiket") || text.includes("pesawat") || text.includes("visa") || text.includes("asuransi")) {
      return "TIKET_VISA";
    }
    if (text.includes("kit") || text.includes("codespark") || text.includes("creative") || text.includes("ppn")) {
      return "KIT_PPN";
    }
    return "TAMBAHAN";
  }

  return null;
}

/**
 * Menghitung baris double-entry (totalDebit === totalCredit) untuk sinkronisasi
 * CashflowTransaction ke Jurnal Umum Akuntansi Utama.
 */
export function buildCashflowJournalLines(params: {
  type: "INCOME" | "EXPENSE" | string;
  amount: number;
  taxWithheldAmount?: number | null;
  cashAccountId: string;
  counterAccountId: string;
  taxAccountId?: string | null;
  description: string;
  projectName: string;
}): Array<{ accountId: string; debit: number; credit: number; description: string }> {
  const netAmount = Math.max(0, Math.round((Number(params.amount) || 0) * 100) / 100);
  const taxAmount = Math.max(0, Math.round((Number(params.taxWithheldAmount) || 0) * 100) / 100);

  if (params.type === "INCOME") {
    const grossIncome = netAmount + taxAmount;
    const lines: Array<{ accountId: string; debit: number; credit: number; description: string }> = [
      {
        accountId: params.cashAccountId,
        debit: netAmount,
        credit: 0,
        description: `[Cashflow ${params.projectName}] Kas/Bank Masuk: ${params.description}`,
      },
    ];

    if (taxAmount > 0 && params.taxAccountId) {
      lines.push({
        accountId: params.taxAccountId,
        debit: taxAmount,
        credit: 0,
        description: `[Cashflow ${params.projectName}] Potongan Pajak Bendahara: ${params.description}`,
      });
    }

    lines.push({
      accountId: params.counterAccountId,
      debit: 0,
      credit: taxAmount > 0 && params.taxAccountId ? grossIncome : netAmount,
      description: `[Cashflow ${params.projectName}] Pendapatan: ${params.description}`,
    });

    return lines;
  }

  // EXPENSE
  return [
    {
      accountId: params.counterAccountId,
      debit: netAmount,
      credit: 0,
      description: `[Cashflow ${params.projectName}] Beban: ${params.description}`,
    },
    {
      accountId: params.cashAccountId,
      debit: 0,
      credit: netAmount,
      description: `[Cashflow ${params.projectName}] Kas/Bank Keluar: ${params.description}`,
    },
  ];
}

/**
 * Menyinkronkan satu CashflowTransaction dengan JournalEntry Akuntansi Utama di dalam $transaction.
 * - Proyek IoT 100 Kit di-skip agar tidak duplikat dengan iot-cashflow.ts.
 * - Transaksi PENDING akan menghapus jurnal tertaut (jika ada).
 * - Transaksi COMPLETED akan membuat atau memperbarui JournalEntry (status POSTED).
 */
export async function syncCashflowTransactionToJournal(
  tx: TxOrPrisma,
  cashflowTxId: string,
  userId?: string | null
): Promise<{ synced: boolean; journalEntryId: string | null; reason?: string }> {
  const cf = await tx.cashflowTransaction.findUnique({
    where: { id: cashflowTxId },
    include: {
      project: true,
      journalEntry: true,
    },
  });

  if (!cf) {
    return { synced: false, journalEntryId: null, reason: "NOT_FOUND" };
  }

  // Proyek IoT 100 Kit sudah memiliki mesin jurnal khusus di iot-cashflow.ts
  if (cf.project?.name === IOT_SKIP_PROJECT_NAME) {
    return { synced: false, journalEntryId: cf.journalEntryId || null, reason: "IOT_MANAGED" };
  }

  // Jika belum COMPLETED (atau nominal <= 0), pastikan tidak ada jurnal menggantung
  if (cf.status !== "COMPLETED" || cf.amount <= 0) {
    if (cf.journalEntryId) {
      await tx.cashflowTransaction.update({
        where: { id: cf.id },
        data: { journalEntryId: null },
      });
      await tx.journalEntry.delete({
        where: { id: cf.journalEntryId },
      });
    }
    return { synced: false, journalEntryId: null, reason: "NOT_COMPLETED" };
  }

  const cashCode = resolveCashAccountCode(cf.paymentMethod);
  const suggestedCounterCode = suggestCashflowAccountCode({
    type: cf.type,
    category: cf.category,
    iyrcBudgetPos: cf.iyrcBudgetPos,
    description: cf.description,
  });
  const reference = `CF-${cf.id}`;

  // Jalankan validasi periode fiskal dan lookup COA/periode/jurnal secara paralel
  const [
    ,
    cashAcc,
    fallbackCashAcc,
    explicitCounterAcc,
    suggestedCounterAcc,
    taxAcc,
    period,
    existingJournalByRef,
  ] = await Promise.all([
    assertFiscalPeriodOpen(tx, cf.date),
    tx.account.findUnique({ where: { code: cashCode } }),
    tx.account.findUnique({ where: { code: "111.11.101" } }),
    cf.accountId
      ? tx.account.findUnique({ where: { id: cf.accountId } })
      : Promise.resolve(null),
    tx.account.findUnique({ where: { code: suggestedCounterCode } }),
    tx.account.findUnique({ where: { code: "600.10.037" } }),
    tx.fiscalPeriod.findFirst({
      where: {
        status: "OPEN",
        startDate: { lte: cf.date },
        endDate: { gte: cf.date },
      },
      select: { id: true },
    }),
    cf.journalEntryId
      ? Promise.resolve(null)
      : tx.journalEntry.findFirst({
          where: { reference },
          select: { id: true },
        }),
  ]);

  const resolvedCashAcc = cashAcc || fallbackCashAcc;
  let resolvedCounterAcc = explicitCounterAcc || suggestedCounterAcc;
  if (!resolvedCounterAcc) {
    resolvedCounterAcc = await tx.account.findFirst({
      where: {
        type: cf.type === "INCOME" ? "REVENUE" : "EXPENSE",
        isActive: true,
      },
      orderBy: { code: "asc" },
    });
  }

  if (!resolvedCashAcc || !resolvedCounterAcc) {
    return { synced: false, journalEntryId: null, reason: "MISSING_COA" };
  }

  const lines = buildCashflowJournalLines({
    type: cf.type,
    amount: cf.amount,
    taxWithheldAmount: cf.taxWithheldAmount,
    cashAccountId: resolvedCashAcc.id,
    counterAccountId: resolvedCounterAcc.id,
    taxAccountId: taxAcc?.id || null,
    description: cf.description,
    projectName: cf.project?.name || "Proyek",
  });

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const journalDesc = `[Cashflow ${cf.project?.name || "Proyek"}] ${cf.description}`;

  // Cek apakah sudah ada JournalEntry tertaut atau dengan reference yang sama
  const existingJournalId = cf.journalEntryId || existingJournalByRef?.id || null;

  let finalJournalId: string;

  if (existingJournalId) {
    await tx.journalEntryLine.deleteMany({
      where: { journalEntryId: existingJournalId },
    });
    const updatedJournal = await tx.journalEntry.update({
      where: { id: existingJournalId },
      data: {
        date: cf.date,
        description: journalDesc,
        attachmentUrl: cf.receiptUrl || null,
        reference,
        status: "POSTED",
        totalDebit,
        totalCredit,
        fiscalPeriodId: period?.id || null,
        lines: { create: lines },
      },
      select: { id: true },
    });
    finalJournalId = updatedJournal.id;
  } else {
    const entryNumber = await generateNextEntryNumber(tx, "JU", cf.date);
    const createdJournal = await tx.journalEntry.create({
      data: {
        entryNumber,
        date: cf.date,
        description: journalDesc,
        attachmentUrl: cf.receiptUrl || null,
        reference,
        status: "POSTED",
        totalDebit,
        totalCredit,
        fiscalPeriodId: period?.id || null,
        createdById: userId || cf.createdById || null,
        approvedById: userId || cf.createdById || null,
        lines: { create: lines },
      },
      select: { id: true },
    });
    finalJournalId = createdJournal.id;
  }

  await tx.cashflowTransaction.update({
    where: { id: cf.id },
    data: {
      journalEntryId: finalJournalId,
      accountId: resolvedCounterAcc.id,
    },
  });

  return { synced: true, journalEntryId: finalJournalId };
}
