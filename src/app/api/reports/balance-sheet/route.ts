import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDateParam = searchParams.get('asOfDate') || '2026-12-31';
    const asOfDate = new Date(asOfDateParam + 'T23:59:59.999Z');

    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: 'POSTED',
              date: { lte: asOfDate }
            }
          }
        }
      }
    });

    const company = await prisma.company.findFirst();

    const asetLancarList: { code: string; name: string; amount: number }[] = [];
    const asetTetapList: { code: string; name: string; amount: number }[] = [];
    const liabilitasLancarList: { code: string; name: string; amount: number }[] = [];
    const ekuitasList: { code: string; name: string; amount: number }[] = [];

    let totalAsetLancar = 0;
    let totalAsetTetap = 0;
    let totalLiabilitas = 0;
    let totalEkuitasModal = 0;

    let totalRevenue = 0;
    let totalExpense = 0;

    accounts.forEach(acc => {
      const debit = acc.journalLines.reduce((s, l) => s + l.debit, 0);
      const credit = acc.journalLines.reduce((s, l) => s + l.credit, 0);

      if (acc.type === 'ASSET') {
        const net = debit - credit;
        if (net !== 0) {
          if (acc.subType === 'Aset Tetap' || acc.code.startsWith('117')) {
            asetTetapList.push({ code: acc.code, name: acc.name, amount: net });
            totalAsetTetap += net;
          } else {
            asetLancarList.push({ code: acc.code, name: acc.name, amount: net });
            totalAsetLancar += net;
          }
        }
      } else if (acc.type === 'LIABILITY') {
        const net = credit - debit;
        if (net !== 0) {
          // If 204.10.101 (Jully Tjindrawan / CC pribadi) has a net debit (net < 0):
          // In SAK EMKM, personal withdrawals / payments for owner are Prive (reduces equity)
          if (acc.code === '204.10.101' && net < 0) {
            ekuitasList.push({
              code: acc.code,
              name: 'Prive / Pengeluaran Pribadi Pemilik (Jully Tjindrawan)',
              amount: net // negative in equity reduces total equity
            });
            totalEkuitasModal += net;
          } else {
            liabilitasLancarList.push({ code: acc.code, name: acc.name, amount: net });
            totalLiabilitas += net;
          }
        }
      } else if (acc.type === 'EQUITY') {
        const net = credit - debit;
        if (net !== 0) {
          ekuitasList.push({ code: acc.code, name: acc.name, amount: net });
          totalEkuitasModal += net;
        }
      } else if (acc.type === 'REVENUE') {
        totalRevenue += (credit - debit);
      } else if (acc.type === 'EXPENSE') {
        totalExpense += (debit - credit);
      }
    });

    const labaTahunBerjalan = totalRevenue - totalExpense;
    const totalEkuitas = totalEkuitasModal + labaTahunBerjalan;
    const totalAset = totalAsetLancar + totalAsetTetap;
    const totalPasiva = totalLiabilitas + totalEkuitas;

    return NextResponse.json({
      companyName: company?.name || 'PT Jully Tjindrawan Robotik',
      asOfDate: asOfDateParam,
      asetLancarList,
      totalAsetLancar,
      asetTetapList,
      totalAsetTetap,
      totalAset,
      liabilitasLancarList,
      totalLiabilitas,
      ekuitasList,
      totalEkuitasModal,
      labaTahunBerjalan,
      totalEkuitas,
      totalPasiva,
      isBalanced: Math.abs(totalAset - totalPasiva) < 0.01
    });
  } catch (error) {
    console.error('Error generating Balance Sheet:', error);
    return NextResponse.json({ error: 'Gagal membuat laporan posisi keuangan' }, { status: 500 });
  }
}
