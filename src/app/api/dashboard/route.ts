import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export async function GET() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    // Parallel fetch of all independent metrics for maximum speed
    const [
      cashAccounts,
      bankAccountsAgg,
      receivables,
      payables,
      monthlyRows,
      topExpensesRaw,
      recentJournalsRaw,
      overdueInvoicesRaw,
      allGoods,
      currentMonthRevenueLines,
      currentMonthExpenseLines,
      unpaidInvoices,
      unpaidBills
    ] = await Promise.all([
      // 1. Kas & Bank from Chart of Accounts (111.%)
      prisma.account.findMany({
        where: { code: { startsWith: '111.' }, isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          subType: true,
          journalLines: {
            where: { journalEntry: { status: 'POSTED' } },
            select: { debit: true, credit: true }
          }
        },
        orderBy: { code: 'asc' }
      }),
      // Bank accounts table fallback
      prisma.bankAccount.aggregate({
        _sum: { balance: true }
      }),
      // 2. Piutang (Accounts Receivable)
      prisma.invoice.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { status: { notIn: ['DRAFT', 'PAID', 'VOID'] } }
      }),
      // 3. Hutang (Accounts Payable)
      prisma.bill.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { status: { notIn: ['DRAFT', 'PAID', 'VOID'] } }
      }),
      // 4. Monthly Revenues and Expenses in ONE single SQL aggregation
      prisma.$queryRaw<Array<{ yyyymm: string; type: string; total_debit: number; total_credit: number }>>`
        SELECT 
          TO_CHAR(j.date, 'YYYY-MM') AS yyyymm,
          a.type,
          COALESCE(SUM(jl.debit), 0)::float as total_debit,
          COALESCE(SUM(jl.credit), 0)::float as total_credit
        FROM journal_entry_lines jl
        JOIN journal_entries j ON jl."journalEntryId" = j.id
        JOIN accounts a ON jl."accountId" = a.id
        WHERE j.status = 'POSTED' AND a.type IN ('REVENUE', 'EXPENSE')
        GROUP BY 1, 2
        ORDER BY 1
      `,
      // 5. Top 5 Expense accounts overall / year-to-date
      prisma.journalEntryLine.groupBy({
        by: ['accountId'],
        _sum: { debit: true, credit: true },
        where: { account: { type: 'EXPENSE' }, journalEntry: { status: 'POSTED' } },
        orderBy: { _sum: { debit: 'desc' } },
        take: 5
      }),
      // 6. Recent Journals
      prisma.journalEntry.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, date: true, description: true, totalDebit: true, status: true }
      }),
      // 7. Overdue Invoices
      prisma.invoice.findMany({
        where: {
          status: 'OVERDUE',
          dueDate: { lt: today }
        },
        include: { customer: true },
        take: 5,
        orderBy: { dueDate: 'asc' }
      }),
      // 8. Low Stock
      prisma.product.findMany({
        where: { type: 'GOODS' },
        select: { id: true, name: true, stockQuantity: true, minStock: true }
      }),
      // 9. Current Month Revenue Lines for Drill-down
      prisma.journalEntryLine.findMany({
        where: {
          account: { type: 'REVENUE' },
          journalEntry: {
            status: 'POSTED',
            date: { gte: currentMonthStart, lte: currentMonthEnd }
          }
        },
        select: {
          debit: true,
          credit: true,
          description: true,
          account: { select: { code: true, name: true } },
          journalEntry: { select: { id: true, entryNumber: true, date: true, description: true } }
        },
        orderBy: { journalEntry: { date: 'desc' } }
      }),
      // 10. Current Month Expense Lines for Drill-down
      prisma.journalEntryLine.findMany({
        where: {
          account: { type: 'EXPENSE' },
          journalEntry: {
            status: 'POSTED',
            date: { gte: currentMonthStart, lte: currentMonthEnd }
          }
        },
        select: {
          debit: true,
          credit: true,
          description: true,
          account: { select: { code: true, name: true } },
          journalEntry: { select: { id: true, entryNumber: true, date: true, description: true } }
        },
        orderBy: { journalEntry: { date: 'desc' } }
      }),
      // 11. Unpaid Invoices for Piutang Drill-down
      prisma.invoice.findMany({
        where: { status: { notIn: ['DRAFT', 'PAID', 'VOID'] } },
        include: { customer: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 20
      }),
      // 12. Unpaid Bills for Hutang Drill-down
      prisma.bill.findMany({
        where: { status: { notIn: ['DRAFT', 'PAID', 'VOID'] } },
        include: { supplier: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 20
      })
    ]);

    // Calculate real Cash & Bank
    let cashAndBank = 0;
    const cashBankBreakdown = cashAccounts.map(acc => {
      let balance = 0;
      acc.journalLines.forEach(l => {
        balance += (l.debit - l.credit);
      });
      cashAndBank += balance;
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        subType: acc.subType || 'Kas & Bank',
        balance
      };
    });

    if (cashAndBank === 0 && bankAccountsAgg._sum.balance) {
      cashAndBank = bankAccountsAgg._sum.balance;
    }

    const totalAccountsReceivable = (receivables._sum.totalAmount || 0) - (receivables._sum.paidAmount || 0);
    const totalAccountsPayable = (payables._sum.totalAmount || 0) - (payables._sum.paidAmount || 0);

    // Compute monthly chart data (Last 6 Months) from pre-aggregated SQL rows
    const currentYyyymm = format(today, 'yyyy-MM');
    let currentMonthRevenue = 0;
    let currentMonthExpense = 0;

    const monthlyMap: Record<string, { rev: number; exp: number }> = {};
    monthlyRows.forEach(row => {
      if (!monthlyMap[row.yyyymm]) {
        monthlyMap[row.yyyymm] = { rev: 0, exp: 0 };
      }
      if (row.type === 'REVENUE') {
        monthlyMap[row.yyyymm].rev += (row.total_credit - row.total_debit);
      } else if (row.type === 'EXPENSE') {
        monthlyMap[row.yyyymm].exp += (row.total_debit - row.total_credit);
      }
    });

    if (monthlyMap[currentYyyymm]) {
      currentMonthRevenue = monthlyMap[currentYyyymm].rev;
      currentMonthExpense = monthlyMap[currentYyyymm].exp;
    }

    // Build last 6 months for chart
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const ym = format(monthDate, 'yyyy-MM');
      const val = monthlyMap[ym] || { rev: 0, exp: 0 };
      monthlyData.push({
        name: format(monthDate, 'MMM', { locale: localeId }),
        pendapatan: val.rev,
        beban: val.exp,
      });
    }

    const netProfit = currentMonthRevenue - currentMonthExpense;

    const summary = {
      totalRevenue: currentMonthRevenue,
      totalExpense: currentMonthExpense,
      netProfit,
      totalAccountsReceivable,
      totalAccountsPayable,
      cashAndBank,
    };

    // Category names in single query
    const categoryAccountIds = topExpensesRaw.map(e => e.accountId);
    const categoryAccounts = await prisma.account.findMany({
      where: { id: { in: categoryAccountIds } },
      select: { id: true, name: true }
    });
    const accNameMap = new Map(categoryAccounts.map(a => [a.id, a.name]));

    const expenseCategories = topExpensesRaw
      .map(exp => {
        const val = (exp._sum.debit || 0) - (exp._sum.credit || 0);
        return {
          name: accNameMap.get(exp.accountId) || 'Beban',
          value: val > 0 ? val : 0
        };
      })
      .filter(c => c.value > 0);

    if (expenseCategories.length === 0) {
      expenseCategories.push({ name: 'Belum ada beban', value: 0 });
    }

    const recentJournals = recentJournalsRaw.map(j => ({
      id: j.id,
      date: format(new Date(j.date), 'dd MMM yyyy', { locale: localeId }),
      description: j.description,
      amount: j.totalDebit,
      type: j.status === 'POSTED' ? 'Jurnal Umum (Posted)' : 'Jurnal Umum (Draft)'
    }));

    const overdueInvoices = overdueInvoicesRaw.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      dueDate: format(new Date(inv.dueDate), 'dd MMM yyyy', { locale: localeId }),
      customer: inv.customer.name,
      amount: inv.totalAmount - inv.paidAmount
    }));

    const lowStockAlerts = allGoods
      .filter(p => p.stockQuantity <= p.minStock)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.stockQuantity,
        minStock: p.minStock
      }));

    // Aggregate Details for Interactive Drill-downs
    // Revenue Breakdown
    const revAccountMap = new Map<string, { code: string; name: string; amount: number }>();
    currentMonthRevenueLines.forEach(line => {
      const net = (line.credit || 0) - (line.debit || 0);
      const key = line.account.code;
      if (!revAccountMap.has(key)) {
        revAccountMap.set(key, { code: line.account.code, name: line.account.name, amount: 0 });
      }
      revAccountMap.get(key)!.amount += net;
    });

    const revenueByAccount = Array.from(revAccountMap.values())
      .filter(a => a.amount !== 0)
      .sort((a, b) => b.amount - a.amount)
      .map(a => ({
        ...a,
        percentage: currentMonthRevenue > 0 ? Math.round((a.amount / currentMonthRevenue) * 1000) / 10 : 0
      }));

    const revenueTransactions = currentMonthRevenueLines.slice(0, 30).map(line => ({
      id: line.journalEntry.id,
      date: format(new Date(line.journalEntry.date), 'dd MMM yyyy', { locale: localeId }),
      entryNumber: line.journalEntry.entryNumber,
      description: line.description || line.journalEntry.description,
      accountName: `${line.account.code} - ${line.account.name}`,
      amount: (line.credit || 0) - (line.debit || 0)
    }));

    // Expense Breakdown
    const expAccountMap = new Map<string, { code: string; name: string; amount: number }>();
    currentMonthExpenseLines.forEach(line => {
      const net = (line.debit || 0) - (line.credit || 0);
      const key = line.account.code;
      if (!expAccountMap.has(key)) {
        expAccountMap.set(key, { code: line.account.code, name: line.account.name, amount: 0 });
      }
      expAccountMap.get(key)!.amount += net;
    });

    const expenseByAccount = Array.from(expAccountMap.values())
      .filter(a => a.amount !== 0)
      .sort((a, b) => b.amount - a.amount)
      .map(a => ({
        ...a,
        percentage: currentMonthExpense > 0 ? Math.round((a.amount / currentMonthExpense) * 1000) / 10 : 0
      }));

    const expenseTransactions = currentMonthExpenseLines.slice(0, 30).map(line => ({
      id: line.journalEntry.id,
      date: format(new Date(line.journalEntry.date), 'dd MMM yyyy', { locale: localeId }),
      entryNumber: line.journalEntry.entryNumber,
      description: line.description || line.journalEntry.description,
      accountName: `${line.account.code} - ${line.account.name}`,
      amount: (line.debit || 0) - (line.credit || 0)
    }));

    // Receivables List
    const receivableInvoices = unpaidInvoices.map(inv => ({
      id: inv.id,
      number: inv.invoiceNumber,
      customer: inv.customer?.name || 'Pelanggan Umum',
      dueDate: format(new Date(inv.dueDate), 'dd MMM yyyy', { locale: localeId }),
      total: inv.totalAmount,
      remaining: inv.totalAmount - inv.paidAmount,
      status: inv.status
    }));

    // Payables List
    const payableBills = unpaidBills.map(b => ({
      id: b.id,
      number: b.billNumber,
      supplier: b.supplier?.name || 'Supplier Umum',
      dueDate: format(new Date(b.dueDate), 'dd MMM yyyy', { locale: localeId }),
      total: b.totalAmount,
      remaining: b.totalAmount - b.paidAmount,
      status: b.status
    }));

    const details = {
      revenue: {
        total: currentMonthRevenue,
        byAccount: revenueByAccount,
        transactions: revenueTransactions
      },
      expense: {
        total: currentMonthExpense,
        byAccount: expenseByAccount,
        transactions: expenseTransactions
      },
      profit: {
        revenue: currentMonthRevenue,
        expense: currentMonthExpense,
        netProfit,
        profitMargin: currentMonthRevenue > 0 ? Math.round((netProfit / currentMonthRevenue) * 1000) / 10 : 0,
        status: netProfit >= 0 ? 'SURPLUS' : 'DEFISIT'
      },
      receivable: {
        total: totalAccountsReceivable,
        invoices: receivableInvoices
      },
      payable: {
        total: totalAccountsPayable,
        bills: payableBills
      },
      cashAndBank: {
        total: cashAndBank,
        accounts: cashBankBreakdown.sort((a, b) => b.balance - a.balance)
      }
    };

    return NextResponse.json({
      summary,
      monthlyData,
      expenseCategories,
      recentJournals,
      overdueInvoices,
      lowStockAlerts,
      details,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
