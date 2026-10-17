import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate') || '2026-01-01';
    const endDateParam = searchParams.get('endDate') || '2026-12-31';

    const startDate = new Date(startDateParam + 'T00:00:00.000Z');
    const endDate = new Date(endDateParam + 'T23:59:59.999Z');

    const bca = await prisma.account.findUnique({ where: { code: '111.11.101' } });
    const company = await prisma.company.findFirst();

    if (!bca) {
      return NextResponse.json({ error: 'Akun BCA tidak ditemukan' }, { status: 404 });
    }

    // 1. Calculate opening balance before startDate
    const priorLines = await prisma.journalEntryLine.findMany({
      where: {
        accountId: bca.id,
        journalEntry: {
          status: 'POSTED',
          date: { lt: startDate }
        }
      }
    });
    let openingCash = priorLines.reduce((s, l) => s + (l.debit - l.credit), 0);

    // 2. Fetch all entries within the period involving BCA
    const entries = await prisma.journalEntry.findMany({
      where: {
        status: 'POSTED',
        date: { gte: startDate, lte: endDate },
        lines: { some: { accountId: bca.id } }
      },
      include: {
        lines: { include: { account: true } }
      },
      orderBy: { date: 'asc' }
    });

    let operatingIn = 0;
    let operatingOut = 0;
    let investingOut = 0;
    let financingIn = 0;
    let financingOut = 0;

    entries.forEach(e => {
      const bcaLine = e.lines.find(l => l.accountId === bca.id);
      const otherLines = e.lines.filter(l => l.accountId !== bca.id);

      if (!bcaLine) return;

      // Handle opening balance journal if it falls within the period
      if (e.reference === 'SALDO-AWAL-2026') {
        openingCash += bcaLine.debit;
        return;
      }

      if (bcaLine.debit > 0) {
        // Cash Inflow
        otherLines.forEach(ol => {
          if (ol.account.type === 'EQUITY' || ol.account.code === '300.10.101') {
            financingIn += ol.credit;
          } else {
            operatingIn += ol.credit;
          }
        });
      } else if (bcaLine.credit > 0) {
        // Cash Outflow
        otherLines.forEach(ol => {
          if (ol.account.code.startsWith('117')) {
            investingOut += ol.debit;
          } else if (ol.account.code === '204.10.101') {
            financingOut += ol.debit;
          } else {
            operatingOut += ol.debit;
          }
        });
      }
    });

    const netOperating = operatingIn - operatingOut;
    const netInvesting = -investingOut;
    const netFinancing = financingIn - financingOut;
    const netChange = netOperating + netInvesting + netFinancing;
    const closingCash = openingCash + netChange;

    return NextResponse.json({
      companyName: company?.name || 'PT Jully Tjindrawan Robotik',
      startDate: startDateParam,
      endDate: endDateParam,
      openingCash,
      operatingIn,
      operatingOut,
      netOperating,
      investingOut,
      netInvesting,
      financingIn,
      financingOut,
      netFinancing,
      netChange,
      closingCash
    });
  } catch (error) {
    console.error('Error generating Cash Flow:', error);
    return NextResponse.json({ error: 'Gagal membuat laporan arus kas' }, { status: 500 });
  }
}
