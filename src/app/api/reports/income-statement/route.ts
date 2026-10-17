import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate') || '2026-01-01';
    const endDateParam = searchParams.get('endDate') || '2026-12-31';

    const startDate = new Date(startDateParam + 'T00:00:00.000Z');
    const endDate = new Date(endDateParam + 'T23:59:59.999Z');

    // Fetch accounts of type REVENUE and EXPENSE with their journal lines within range
    const accounts = await prisma.account.findMany({
      where: {
        type: { in: ['REVENUE', 'EXPENSE'] },
        isActive: true
      },
      orderBy: { code: 'asc' },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }
    });

    const company = await prisma.company.findFirst();

    const pendapatanList: { code: string; name: string; amount: number }[] = [];
    const hppList: { code: string; name: string; amount: number }[] = [];
    const bebanOperasionalList: { code: string; name: string; amount: number }[] = [];

    let totalPendapatan = 0;
    let totalHpp = 0;
    let totalBebanOperasional = 0;

    accounts.forEach(acc => {
      const debit = acc.journalLines.reduce((s, l) => s + l.debit, 0);
      const credit = acc.journalLines.reduce((s, l) => s + l.credit, 0);

      if (acc.type === 'REVENUE') {
        const net = credit - debit;
        if (net !== 0) {
          pendapatanList.push({ code: acc.code, name: acc.name, amount: net });
          totalPendapatan += net;
        }
      } else if (acc.type === 'EXPENSE') {
        const net = debit - credit;
        if (net !== 0) {
          if (acc.code === '500.10.102' || acc.subType === 'Beban Pokok') {
            hppList.push({ code: acc.code, name: acc.name, amount: net });
            totalHpp += net;
          } else {
            bebanOperasionalList.push({ code: acc.code, name: acc.name, amount: net });
            totalBebanOperasional += net;
          }
        }
      }
    });

    const labaKotor = totalPendapatan - totalHpp;
    const labaBersih = labaKotor - totalBebanOperasional;

    return NextResponse.json({
      companyName: company?.name || 'PT Jully Tjindrawan Robotik',
      startDate: startDateParam,
      endDate: endDateParam,
      pendapatanList,
      totalPendapatan,
      hppList,
      totalHpp,
      labaKotor,
      bebanOperasionalList,
      totalBebanOperasional,
      labaBersih
    });
  } catch (error) {
    console.error('Error generating Income Statement:', error);
    return NextResponse.json({ error: 'Gagal membuat laporan laba rugi' }, { status: 500 });
  }
}
