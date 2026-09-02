import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export async function GET() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    // Mocked data for now, ideally this would come from actual Prisma queries.
    // Assuming standard accounting schema for queries: Account (type ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE), JournalEntry, JournalLine.
    
    // In a real scenario, you'd aggregate balances from JournalLines based on Account types.
    // For this example, we provide structural data to satisfy the dashboard UI.
    
    // 1. Calculate Summary (Mocked for robust return type for UI)
    const summary = {
      totalRevenue: 150000000,
      totalExpense: 85000000,
      netProfit: 65000000,
      totalAccountsReceivable: 45000000,
      totalAccountsPayable: 25000000,
      cashAndBank: 120000000,
    };

    // 2. Monthly Data (Last 6 Months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      monthlyData.push({
        name: format(monthDate, 'MMM', { locale: localeId }),
        pendapatan: Math.floor(Math.random() * 50000000) + 100000000,
        beban: Math.floor(Math.random() * 30000000) + 50000000,
      });
    }

    // 3. Expense Categories
    const expenseCategories = [
      { name: 'Beban Gaji', value: 35000000 },
      { name: 'Beban Sewa', value: 20000000 },
      { name: 'Beban Pemasaran', value: 15000000 },
      { name: 'Beban Utilitas', value: 10000000 },
      { name: 'Lainnya', value: 5000000 },
    ];

    // 4. Recent Journals
    const recentJournals = [
      { id: '1', date: format(today, 'dd MMM yyyy', { locale: localeId }), description: 'Penjualan Barang Dagang', amount: 15000000, type: 'Jurnal Umum' },
      { id: '2', date: format(subMonths(today, 0), 'dd MMM yyyy', { locale: localeId }), description: 'Pembayaran Gaji Karyawan', amount: 35000000, type: 'Pengeluaran Kas' },
      { id: '3', date: format(subMonths(today, 0), 'dd MMM yyyy', { locale: localeId }), description: 'Penerimaan Piutang PT ABC', amount: 10000000, type: 'Penerimaan Kas' },
      { id: '4', date: format(subMonths(today, 0), 'dd MMM yyyy', { locale: localeId }), description: 'Pembelian Perlengkapan Kantor', amount: 2500000, type: 'Pengeluaran Kas' },
      { id: '5', date: format(subMonths(today, 0), 'dd MMM yyyy', { locale: localeId }), description: 'Pembayaran Listrik & Air', amount: 1500000, type: 'Pengeluaran Kas' },
    ];

    // 5. Overdue Invoices
    const overdueInvoices = [
      { id: 'inv-1', invoiceNumber: 'INV/2023/10/001', dueDate: '15 Okt 2023', customer: 'PT Makmur Jaya', amount: 12500000 },
      { id: 'inv-2', invoiceNumber: 'INV/2023/10/005', dueDate: '20 Okt 2023', customer: 'CV Sentosa', amount: 8000000 },
    ];

    // 6. Low Stock Alerts
    const lowStockAlerts = [
      { id: 'prod-1', name: 'Kertas HVS A4', currentStock: 5, minStock: 20 },
      { id: 'prod-2', name: 'Tinta Printer Hitam', currentStock: 2, minStock: 10 },
      { id: 'prod-3', name: 'Pulpen Hitam', currentStock: 15, minStock: 50 },
    ];

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

