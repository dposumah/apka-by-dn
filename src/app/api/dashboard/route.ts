import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export async function GET() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    // 1. Cash and Bank (Sum of bank accounts)
    const bankAccounts = await prisma.bankAccount.aggregate({
      _sum: { balance: true }
    });
    const cashAndBank = bankAccounts._sum.balance || 0;

    // 2. Accounts Receivable (Sum of unpaid invoices)
    const receivables = await prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      where: { status: { notIn: ['DRAFT', 'PAID', 'VOID'] } }
    });
    const totalAccountsReceivable = (receivables._sum.totalAmount || 0) - (receivables._sum.paidAmount || 0);

    // 3. Accounts Payable (Sum of unpaid bills)
    const payables = await prisma.bill.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      where: { status: { notIn: ['DRAFT', 'PAID', 'VOID'] } }
    });
    const totalAccountsPayable = (payables._sum.totalAmount || 0) - (payables._sum.paidAmount || 0);

    // 4. Revenue and Expense for Current Month
    // We sum the journal lines for accounts of type REVENUE and EXPENSE for this month
    const revenueLines = await prisma.journalEntryLine.aggregate({
      _sum: { credit: true, debit: true },
      where: {
        account: { type: 'REVENUE' },
        journalEntry: {
          date: { gte: currentMonthStart, lte: currentMonthEnd },
          status: 'POSTED'
        }
      }
    });
    // Normal balance for Revenue is Credit
    const totalRevenue = (revenueLines._sum.credit || 0) - (revenueLines._sum.debit || 0);

    const expenseLines = await prisma.journalEntryLine.aggregate({
      _sum: { debit: true, credit: true },
      where: {
        account: { type: 'EXPENSE' },
        journalEntry: {
          date: { gte: currentMonthStart, lte: currentMonthEnd },
          status: 'POSTED'
        }
      }
    });
    // Normal balance for Expense is Debit
    const totalExpense = (expenseLines._sum.debit || 0) - (expenseLines._sum.credit || 0);

    const netProfit = totalRevenue - totalExpense;

    const summary = {
      totalRevenue,
      totalExpense,
      netProfit,
      totalAccountsReceivable,
      totalAccountsPayable,
      cashAndBank,
    };

    // 5. Monthly Data (Last 6 Months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);

      const mRev = await prisma.journalEntryLine.aggregate({
        _sum: { credit: true, debit: true },
        where: { account: { type: 'REVENUE' }, journalEntry: { date: { gte: mStart, lte: mEnd }, status: 'POSTED' } }
      });
      const rev = (mRev._sum.credit || 0) - (mRev._sum.debit || 0);

      const mExp = await prisma.journalEntryLine.aggregate({
        _sum: { debit: true, credit: true },
        where: { account: { type: 'EXPENSE' }, journalEntry: { date: { gte: mStart, lte: mEnd }, status: 'POSTED' } }
      });
      const exp = (mExp._sum.debit || 0) - (mExp._sum.credit || 0);

      monthlyData.push({
        name: format(monthDate, 'MMM', { locale: localeId }),
        pendapatan: rev,
        beban: exp,
      });
    }

    // 6. Expense Categories (Top 5 for this month)
    const expensesByCategory = await prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      _sum: { debit: true, credit: true },
      where: { account: { type: 'EXPENSE' }, journalEntry: { date: { gte: currentMonthStart, lte: currentMonthEnd }, status: 'POSTED' } },
      orderBy: { _sum: { debit: 'desc' } },
      take: 5
    });

    const expenseCategories = [];
    for (const exp of expensesByCategory) {
      const acc = await prisma.account.findUnique({ where: { id: exp.accountId } });
      const value = (exp._sum.debit || 0) - (exp._sum.credit || 0);
      if (value > 0 && acc) {
        expenseCategories.push({ name: acc.name, value });
      }
    }
    
    // Fallback if no data
    if (expenseCategories.length === 0) {
      expenseCategories.push({ name: 'Belum ada beban', value: 0 });
    }

    // 7. Recent Journals
    const recentJournalsRaw = await prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: { id: true, date: true, description: true, totalDebit: true, status: true }
    });
    const recentJournals = recentJournalsRaw.map(j => ({
      id: j.id,
      date: format(new Date(j.date), 'dd MMM yyyy', { locale: localeId }),
      description: j.description,
      amount: j.totalDebit,
      type: j.status === 'POSTED' ? 'Jurnal Umum (Posted)' : 'Jurnal Umum (Draft)'
    }));

    // 8. Overdue Invoices
    const overdueInvoicesRaw = await prisma.invoice.findMany({
      where: {
        status: 'OVERDUE',
        dueDate: { lt: today }
      },
      include: { customer: true },
      take: 5,
      orderBy: { dueDate: 'asc' }
    });
    const overdueInvoices = overdueInvoicesRaw.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      dueDate: format(new Date(inv.dueDate), 'dd MMM yyyy', { locale: localeId }),
      customer: inv.customer.name,
      amount: inv.totalAmount - inv.paidAmount
    }));

    // 9. Low Stock Alerts
    const allGoods = await prisma.product.findMany({
      where: { type: 'GOODS' },
      select: { id: true, name: true, stockQuantity: true, minStock: true }
    });
    
    const lowStockAlertsRaw = allGoods
      .filter(p => p.stockQuantity <= p.minStock)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 5);

    const lowStockAlerts = lowStockAlertsRaw.map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.stockQuantity,
      minStock: p.minStock
    }));

    return NextResponse.json({
      summary,
      monthlyData,
      expenseCategories,
      recentJournals,
      overdueInvoices,
      lowStockAlerts,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
