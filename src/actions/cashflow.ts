"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for backend usage if needed, though usually file upload is done client-side directly to storage to save server bandwidth. We'll do it client side for better UX.

export async function getCashflowProjects() {
  try {
    // Ensure default projects exist
    const defaultProjects = ["Bina Insani", "ASMI", "IYRC"];
    for (const name of defaultProjects) {
      await prisma.cashflowProject.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    
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
        project: true
      },
      orderBy: { date: "desc" }
    });
    
    return transactions;
  } catch (error) {
    console.error("Failed to get cashflow transactions:", error);
    return [];
  }
}

export async function createCashflowTransaction(data: any) {
  try {
    const transaction = await prisma.cashflowTransaction.create({
      data: {
        projectId: data.projectId,
        date: new Date(data.date),
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description,
        category: data.category,
        receiptUrl: data.receiptUrl,
        paymentMethod: data.paymentMethod,
        status: data.status || "COMPLETED"
      }
    });
    
    revalidatePath("/cashflow");
    revalidatePath("/cashflow/transactions");
    return { success: true, transaction };
  } catch (error: any) {
    console.error("Failed to create transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCashflowTransaction(id: string, data: any) {
  try {
    const transaction = await prisma.cashflowTransaction.update({
      where: { id },
      data: {
        projectId: data.projectId,
        date: new Date(data.date),
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description,
        category: data.category,
        receiptUrl: data.receiptUrl,
        paymentMethod: data.paymentMethod,
        status: data.status
      }
    });
    
    revalidatePath("/cashflow");
    revalidatePath("/cashflow/transactions");
    return { success: true, transaction };
  } catch (error: any) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCashflowTransaction(id: string) {
  try {
    await prisma.cashflowTransaction.delete({
      where: { id }
    });
    revalidatePath("/cashflow");
    revalidatePath("/cashflow/transactions");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function generateCashflowInsights(transactions: any[]) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "GEMINI_API_KEY is not configured in .env" };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Calculate basic stats for the prompt
    const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `
    Anda adalah seorang penasihat keuangan (Financial Advisor) ahli.
    Berikut adalah ringkasan data keuangan (Cashflow) bulan ini untuk proyek saya.
    Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
    Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
    Profit/Loss: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}
    
    Rincian Pengeluaran berdasarkan Kategori:
    ${Object.entries(categoryBreakdown).map(([cat, amount]) => `- ${cat}: Rp ${amount.toLocaleString('id-ID')}`).join("\n")}
    
    Berikan analisis singkat (maksimal 3 paragraf) dan 2-3 rekomendasi konkrit untuk meningkatkan profit atau efisiensi pengeluaran bulan depan. Gunakan format Markdown dan bahasa Indonesia yang profesional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return { success: true, insights: response.text };
  } catch (error: any) {
    console.error("Failed to generate AI insights:", error);
    return { success: false, error: error.message };
  }
}

