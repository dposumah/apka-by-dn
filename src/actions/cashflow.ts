"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import {
  CASHFLOW_READ_ROLES,
  CASHFLOW_WRITE_ROLES,
  checkAuth,
} from "@/lib/auth-check";
import {
  inferIyrcBudgetPos,
  syncCashflowTransactionToJournal,
} from "@/lib/cashflow-accounting";
import { ensureIyrcPnLCashflowSeeded } from "@/actions/iyrc";

export async function getCashflowAccounts() {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_READ_ROLES);
    if (authError) return [];
    return await prisma.account.findMany({
      where: {
        isActive: true,
        type: { in: ["REVENUE", "EXPENSE"] },
        NOT: { code: { endsWith: ".000" } },
      },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });
  } catch (error) {
    console.error("Failed to get cashflow COA accounts:", error);
    return [];
  }
}

export async function getCashflowProjects() {
  try {
    const { error: authError, session } = await checkAuth(CASHFLOW_READ_ROLES);
    if (authError) return [];
    // Ensure default projects exist
    const defaultProjects = ["Bina Insani", "ASMI", "IYRC"];
    for (const name of defaultProjects) {
      await prisma.cashflowProject.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    await ensureIyrcPnLCashflowSeeded(session?.user?.id);
    
    return await prisma.cashflowProject.findMany({
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("Failed to get cashflow projects:", error);
    return [];
  }
}

export async function getCashflowTransactions(projectId?: string, month?: number, year?: number) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_READ_ROLES);
    if (authError) return [];
    const where: any = {};
    if (projectId) where.projectId = projectId;
    
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const transactions = await prisma.cashflowTransaction.findMany({
      where,
      include: {
        project: true,
        account: {
          select: { id: true, code: true, name: true, type: true },
        },
        journalEntry: {
          select: { id: true, entryNumber: true, status: true },
        },
      },
      orderBy: { date: "desc" }
    });
    
    return transactions;
  } catch (error) {
    console.error("Failed to get cashflow transactions:", error);
    return [];
  }
}

function buildTransactionPersistenceData(data: any) {
  const parsedDueDate =
    data.dueDate && !Number.isNaN(new Date(data.dueDate).getTime())
      ? new Date(data.dueDate)
      : null;

  return {
    projectId: data.projectId,
    date: new Date(data.date),
    type: data.type,
    amount: parseFloat(data.amount) || 0,
    description: data.description,
    category: data.category,
    receiptUrl: data.receiptUrl || null,
    paymentMethod: data.paymentMethod,
    status: data.status || "COMPLETED",
    invoiceNumber: data.invoiceNumber || null,
    vendorName: data.vendorName || null,
    currency: (data.currency || "IDR").toUpperCase(),
    originalAmount:
      data.originalAmount !== undefined && data.originalAmount !== null && data.originalAmount !== ""
        ? parseFloat(data.originalAmount)
        : null,
    exchangeRate:
      data.exchangeRate !== undefined && data.exchangeRate !== null && data.exchangeRate !== ""
        ? parseFloat(data.exchangeRate)
        : null,
    paymentScheme: data.paymentScheme || null,
    dueDate: parsedDueDate,
    bankName: data.bankName || null,
    bankBranch: data.bankBranch || null,
    accountNumber: data.accountNumber || null,
    accountHolder: data.accountHolder || null,
    swiftCode: data.swiftCode || null,
    bankAddress: data.bankAddress || null,
    invoiceMetadata: data.invoiceMetadata ?? undefined,
    whatsappText: data.whatsappText || null,
    accountId: data.accountId || null,
    iyrcBudgetPos:
      data.iyrcBudgetPos ||
      inferIyrcBudgetPos({
        type: data.type,
        category: data.category,
        vendorName: data.vendorName,
        description: data.description,
      }),
    iyrcProgram: data.iyrcProgram || null,
    taxWithheldAmount:
      data.taxWithheldAmount !== undefined &&
      data.taxWithheldAmount !== null &&
      data.taxWithheldAmount !== ""
        ? parseFloat(data.taxWithheldAmount)
        : null,
  };
}

function revalidateCashflowRoutes() {
  revalidatePath("/cashflow");
  revalidatePath("/cashflow/transactions");
  revalidatePath("/cashflow/laporan");
  revalidatePath("/cashflow/iyrc");
  revalidatePath("/jurnal");
  revalidatePath("/buku-besar");
  revalidatePath("/laporan/laba-rugi");
  revalidatePath("/laporan/neraca");
  revalidatePath("/dashboard");
}

export async function createCashflowTransaction(data: any) {
  try {
    const { error: authError, session } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const persistenceData = buildTransactionPersistenceData(data);
    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.cashflowTransaction.create({
        data: {
          ...persistenceData,
          createdById: session.user.id || null,
        },
      });

      await syncCashflowTransactionToJournal(tx, created.id, session.user.id);

      return await tx.cashflowTransaction.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          project: true,
          account: { select: { id: true, code: true, name: true, type: true } },
          journalEntry: { select: { id: true, entryNumber: true, status: true } },
        },
      });
    });

    revalidateCashflowRoutes();
    return { success: true, transaction };
  } catch (error: any) {
    console.error("Failed to create transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCashflowTransaction(id: string, data: any) {
  try {
    const { error: authError, session } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const persistenceData = buildTransactionPersistenceData(data);
    const transaction = await prisma.$transaction(async (tx) => {
      await tx.cashflowTransaction.update({
        where: { id },
        data: persistenceData,
      });

      await syncCashflowTransactionToJournal(tx, id, session.user.id);

      return await tx.cashflowTransaction.findUniqueOrThrow({
        where: { id },
        include: {
          project: true,
          account: { select: { id: true, code: true, name: true, type: true } },
          journalEntry: { select: { id: true, entryNumber: true, status: true } },
        },
      });
    });

    revalidateCashflowRoutes();
    return { success: true, transaction };
  } catch (error: any) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: error.message };
  }
}

export type MarkPaidOptions =
  | string
  | {
      paidReceiptUrl?: string;
      actualAmount?: number;
      taxWithheldAmount?: number;
      paymentMethod?: string;
      accountId?: string;
      paidDate?: string;
    };

export async function markCashflowTransactionPaid(
  id: string,
  receiptOrOptions?: MarkPaidOptions
) {
  try {
    const { error: authError, session } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const opts =
      typeof receiptOrOptions === "string"
        ? { paidReceiptUrl: receiptOrOptions }
        : receiptOrOptions || {};

    const existing = await prisma.cashflowTransaction.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    const updatedWaText = existing.whatsappText
      ? existing.whatsappText.replace("MENUNGGU TRANSFER", "LUNAS / KONFIRMASI TF")
      : existing.whatsappText;

    const actualAmount =
      opts.actualAmount !== undefined && !Number.isNaN(Number(opts.actualAmount))
        ? Math.max(0, Number(opts.actualAmount))
        : existing.amount;
    const taxWithheld =
      opts.taxWithheldAmount !== undefined && !Number.isNaN(Number(opts.taxWithheldAmount))
        ? Math.max(0, Number(opts.taxWithheldAmount))
        : existing.taxWithheldAmount;
    const paidDateObj =
      opts.paidDate && !Number.isNaN(new Date(opts.paidDate).getTime())
        ? new Date(opts.paidDate)
        : existing.date;

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.cashflowTransaction.update({
        where: { id },
        data: {
          status: "COMPLETED",
          amount: actualAmount,
          date: paidDateObj,
          ...(opts.paymentMethod ? { paymentMethod: opts.paymentMethod } : {}),
          ...(opts.accountId ? { accountId: opts.accountId } : {}),
          ...(taxWithheld !== undefined ? { taxWithheldAmount: taxWithheld } : {}),
          ...(opts.paidReceiptUrl ? { receiptUrl: opts.paidReceiptUrl } : {}),
          ...(updatedWaText !== undefined ? { whatsappText: updatedWaText } : {}),
        },
      });

      await syncCashflowTransactionToJournal(tx, id, session.user.id);

      return await tx.cashflowTransaction.findUniqueOrThrow({
        where: { id },
        include: {
          project: true,
          account: { select: { id: true, code: true, name: true, type: true } },
          journalEntry: { select: { id: true, entryNumber: true, status: true } },
        },
      });
    });

    revalidateCashflowRoutes();
    return { success: true, transaction };
  } catch (error: any) {
    console.error("Failed to mark transaction paid:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCashflowTransaction(id: string) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_WRITE_ROLES);
    if (authError) {
      return { success: false, error: authError };
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.cashflowTransaction.findUnique({
        where: { id },
        select: { id: true, journalEntryId: true, project: { select: { name: true } } },
      });

      if (!existing) return;

      await tx.cashflowTransaction.delete({ where: { id } });

      if (
        existing.journalEntryId &&
        existing.project?.name !== "Pengadaan Starter Kit IoT 100 Kit"
      ) {
        await tx.journalEntry.delete({
          where: { id: existing.journalEntryId },
        });
      }
    });

    revalidateCashflowRoutes();
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function generateCashflowInsights(transactions: any[]) {
  try {
    const { error: authError } = await checkAuth(CASHFLOW_READ_ROLES);
    if (authError) {
      return { success: false, error: authError };
    }
    let apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey.startsWith('"') && apiKey.endsWith('"')) apiKey = apiKey.slice(1, -1);
    if (!apiKey) {
      return { success: false, error: "GEMINI_API_KEY is not configured in .env" };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Hitung realisasi berdasarkan transaksi COMPLETED (Lunas), dan pantau tagihan PENDING
    const completed = transactions.filter(t => t.status === "COMPLETED");
    const pendingExpenses = transactions.filter(t => t.status === "PENDING" && t.type === "EXPENSE");
    const totalIncome = completed.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = completed.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const totalPending = pendingExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown: Record<string, number> = completed
      .filter(t => t.type === "EXPENSE")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const prompt = `
    Anda adalah seorang penasihat keuangan (Financial Advisor) ahli.
    Berikut adalah ringkasan data keuangan (Cashflow) bulan ini untuk proyek saya.
    Total Pemasukan Terealisasi (Lunas): Rp ${totalIncome.toLocaleString('id-ID')}
    Total Pengeluaran Terealisasi (Lunas): Rp ${totalExpense.toLocaleString('id-ID')}
    Profit/Loss Terealisasi: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}
    Tagihan Pending (Menunggu Pembayaran/TF): Rp ${totalPending.toLocaleString('id-ID')} (${pendingExpenses.length} invoice)
    
    Rincian Pengeluaran berdasarkan Kategori:
    ${Object.entries(categoryBreakdown).map(([cat, amount]) => `- ${cat}: Rp ${amount.toLocaleString('id-ID')}`).join("\n")}
    
    Berikan analisis singkat (maksimal 3 paragraf) dan 2-3 rekomendasi konkrit untuk meningkatkan profit atau efisiensi pengeluaran bulan depan serta mitigasi tagihan pending. Gunakan format Markdown dan bahasa Indonesia yang profesional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt
    });

    return { success: true, insights: response.text };
  } catch (error: any) {
    console.error("Failed to generate AI insights:", error);
    return { success: false, error: error.message };
  }
}

