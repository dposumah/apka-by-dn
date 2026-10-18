import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Fetch RAB Project info
    const rabProject = await prisma.rabProject.findFirst({
      include: {
        categories: {
          include: {
            items: {
              include: {
                expenses: {
                  where: { status: 'APPROVED' },
                  orderBy: { date: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    const totalBudget = rabProject?.totalBudget || 899839362;

    // 2. Fetch all SNT revenue journals (account 400.10.105)
    const revAccount = await prisma.account.findUnique({
      where: { code: '400.10.105' },
      include: {
        journalLines: {
          where: { journalEntry: { status: 'POSTED' } },
          include: { journalEntry: true }
        }
      }
    });

    let totalRevenue = 0;
    const revenueEntries: any[] = [];
    if (revAccount) {
      revAccount.journalLines.forEach(line => {
        const amt = line.credit - line.debit;
        totalRevenue += amt;
        revenueEntries.push({
          id: line.id,
          entryNumber: line.journalEntry.entryNumber,
          date: line.journalEntry.date,
          description: line.description || line.journalEntry.description,
          amount: amt
        });
      });
    }

    // 3. Fetch all approved ExpenseRequests
    const approvedExpenses = await prisma.expenseRequest.findMany({
      where: { status: 'APPROVED' },
      include: {
        rabItem: {
          include: { category: true }
        },
        fasilitator: true
      },
      orderBy: { date: 'desc' }
    });

    const totalExpense = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group expenses by category
    const categorySummary: Record<string, { name: string; budget: number; realized: number }> = {};
    rabProject?.categories.forEach(cat => {
      categorySummary[cat.id] = {
        name: cat.name,
        budget: cat.totalBudget,
        realized: 0
      };
    });

    approvedExpenses.forEach(exp => {
      const catId = exp.rabItem?.categoryId;
      if (catId && categorySummary[catId]) {
        categorySummary[catId].realized += exp.amount;
      }
    });

    // 4. Calculate Net Profit & Remaining Cash
    const netProfit = totalRevenue - totalExpense;
    const remainingBudget = totalBudget - totalExpense;

    return NextResponse.json({
      projectName: rabProject?.name || 'Penyelenggara Robotik (6 Lokasi)',
      totalBudget,
      totalRevenue,
      totalExpense,
      netProfit,
      remainingBudget,
      revenueEntries,
      categories: Object.values(categorySummary),
      expenses: approvedExpenses.map(e => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: e.amount,
        categoryName: e.rabItem?.category?.name || 'Lain-lain',
        itemName: e.rabItem?.name || '-',
        fasilitatorName: e.fasilitator?.namaLengkap || null
      }))
    });
  } catch (error) {
    console.error('Error fetching KKA SNT report:', error);
    return NextResponse.json({ error: 'Gagal memuat laporan KKA SNT' }, { status: 500 });
  }
}
