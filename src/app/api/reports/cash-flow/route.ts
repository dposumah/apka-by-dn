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

    // 1. Operating: Revenues and Expenses (Cash-based)
    const revAccounts = await prisma.account.findMany({
      where: { type: 'REVENUE', isActive: true },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    });

    const expAccounts = await prisma.account.findMany({
      where: { type: 'EXPENSE', isActive: true },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    });

    let operatingIn = 0;
    revAccounts.forEach(a => {
      const d = a.journalLines.reduce((s, l) => s + l.debit, 0);
      const k = a.journalLines.reduce((s, l) => s + l.credit, 0);
      operatingIn += (k - d);
    });

    let operatingOut = 0;
    expAccounts.forEach(a => {
      const d = a.journalLines.reduce((s, l) => s + l.debit, 0);
      const k = a.journalLines.reduce((s, l) => s + l.credit, 0);
      operatingOut += (d - k);
    });

    const netOperating = operatingIn - operatingOut;

    // 2. Investing: 117.10.101 (Inventaris Kantor / Aset Tetap)
    const invAccount = await prisma.account.findUnique({
      where: { code: '117.10.101' },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    });
    const investingOut = invAccount
      ? invAccount.journalLines.reduce((s, l) => s + (l.debit - l.credit), 0)
      : 0;
    const netInvesting = -investingOut;

    // 3. Financing:
    // a. Setoran Modal Kas Pemilik (di luar saldo awal)
    const modalLines = await prisma.journalEntryLine.findMany({
      where: {
        account: { code: '300.10.101' },
        journalEntry: {
          status: 'POSTED',
          reference: { not: 'SALDO-AWAL-MAINSHEET' },
          date: { gte: startDate, lte: endDate }
        }
      }
    });
    const financingIn = modalLines.reduce((s, l) => s + (l.credit - l.debit), 0);

    // b. Pengeluaran Pribadi / Prive Pemilik (204.10.101)
    const priveAccount = await prisma.account.findUnique({
      where: { code: '204.10.101' },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    });
    const priveOut = priveAccount
      ? priveAccount.journalLines.reduce((s, l) => s + (l.debit - l.credit), 0)
      : 0;

    // c. Pinjaman Karyawan / Cash Bon (113.12.101)
    const bonAccount = await prisma.account.findUnique({
      where: { code: '113.12.101' },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    });
    const bonOut = bonAccount
      ? bonAccount.journalLines.reduce((s, l) => s + (l.debit - l.credit), 0)
      : 0;

    const netFinancing = financingIn - priveOut - bonOut;

    // 4. Net Change in Cash
    const netChange = netOperating + netInvesting + netFinancing;

    // 5. Opening Cash Balance (Saldo Awal BCA per 01/01/2026)
    const openingEntry = await prisma.journalEntry.findFirst({
      where: { reference: 'SALDO-AWAL-MAINSHEET', status: 'POSTED' },
      include: { lines: { where: { accountId: bca.id } } }
    });
    const openingCash = openingEntry?.lines[0]?.debit || 889709684.72;
    const closingCash = openingCash + netChange;

    return NextResponse.json({
      companyName: company?.name || 'PT Jully Tjindrawan Robotik',
      startDate: startDateParam,
      endDate: endDateParam,
      operatingIn,
      operatingOut,
      netOperating,
      investingOut,
      netInvesting,
      financingIn,
      priveOut,
      bonOut,
      netFinancing,
      netChange,
      openingCash,
      closingCash
    });
  } catch (error) {
    console.error('Error generating Cash Flow:', error);
    return NextResponse.json({ error: 'Gagal membuat laporan arus kas' }, { status: 500 });
  }
}
