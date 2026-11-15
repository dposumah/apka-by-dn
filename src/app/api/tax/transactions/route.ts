import { NextResponse } from 'next/server';
import { TaxTransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const rates = await prisma.taxRate.findMany();
    if (rates.length === 0) {
      await prisma.taxRate.createMany({
        data: [
          { name: 'PPN 11%', rate: 11, type: 'PPN' },
          { name: 'PPh 21', rate: 5, type: 'PPH21' },
          { name: 'PPh 23', rate: 2, type: 'PPH23' },
          { name: 'PPh Final 0.5%', rate: 0.5, type: 'PPH_FINAL' },
        ],
      });
    }

    const txs = await prisma.taxTransaction.findMany({
      include: { taxRate: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(txs);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { taxRateId, baseAmount, date, reference, type } = body;

    const parsedBase = parseFloat(baseAmount);
    if (!taxRateId || isNaN(parsedBase) || parsedBase <= 0 || (type !== 'INPUT' && type !== 'OUTPUT')) {
      return NextResponse.json({ error: 'Parameter transaksi pajak tidak valid' }, { status: 400 });
    }

    const rate = await prisma.taxRate.findUnique({ where: { id: taxRateId } });
    if (!rate) return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });

    const taxAmount = (parsedBase * rate.rate) / 100;
    const txDate = new Date(date || new Date());

    const tx = await prisma.taxTransaction.create({
      data: {
        taxRateId,
        baseAmount: parsedBase,
        taxAmount,
        date: txDate,
        reference,
        type: type as TaxTransactionType,
        periodMonth: txDate.getMonth() + 1,
        periodYear: txDate.getFullYear(),
      },
    });

    return NextResponse.json(tx, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
