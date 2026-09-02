import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rates = await prisma.taxRate.findMany();
    if (rates.length === 0) {
      // Seed default rates
      await prisma.taxRate.createMany({
        data: [
          { name: 'PPN 11%', rate: 11, type: 'PPN' },
          { name: 'PPh 21', rate: 5, type: 'PPH21' },
          { name: 'PPh 23', rate: 2, type: 'PPH23' },
          { name: 'PPh Final 0.5%', rate: 0.5, type: 'PPH_FINAL' }
        ]
      });
    }

    const txs = await prisma.taxTransaction.findMany({
      include: { taxRate: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(txs);
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { taxRateId, baseAmount, date, reference, type } = body;

    const rate = await prisma.taxRate.findUnique({ where: { id: taxRateId } });
    if (!rate) return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });

    const taxAmount = (parseFloat(baseAmount) * rate.rate) / 100;
    const txDate = new Date(date);

    const tx = await prisma.taxTransaction.create({
      data: {
        taxRateId,
        baseAmount: parseFloat(baseAmount),
        taxAmount,
        date: txDate,
        reference,
        type,
        periodMonth: txDate.getMonth() + 1,
        periodYear: txDate.getFullYear()
      }
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
