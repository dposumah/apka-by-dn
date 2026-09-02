import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const transactions = await prisma.taxTransaction.findMany({
      where: { periodYear: year },
      include: { taxRate: true }
    });

    const summary = Array.from({ length: 12 }, (_, i) => {
      const monthTxs = transactions.filter(t => t.periodMonth === i + 1);
      
      const ppnIn = monthTxs.filter(t => t.taxRate.type === 'PPN' && t.type === 'INPUT').reduce((sum, t) => sum + t.taxAmount, 0);
      const ppnOut = monthTxs.filter(t => t.taxRate.type === 'PPN' && t.type === 'OUTPUT').reduce((sum, t) => sum + t.taxAmount, 0);
      const ppnPayable = ppnOut - ppnIn; // Kurang Bayar if > 0, Lebih Bayar if < 0

      const pph21 = monthTxs.filter(t => t.taxRate.type === 'PPH21').reduce((sum, t) => sum + t.taxAmount, 0);
      const pph23 = monthTxs.filter(t => t.taxRate.type === 'PPH23').reduce((sum, t) => sum + t.taxAmount, 0);
      const pphFinal = monthTxs.filter(t => t.taxRate.type === 'PPH_FINAL').reduce((sum, t) => sum + t.taxAmount, 0);

      return {
        month: i + 1,
        ppnIn,
        ppnOut,
        ppnPayable,
        pph21,
        pph23,
        pphFinal
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
