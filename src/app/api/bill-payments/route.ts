import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const payments = await prisma.billPayment.findMany({
      include: {
        bill: {
          include: { supplier: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const mapped = payments.map((p: any) => ({
      ...p,
      billNumber: p.bill?.number,
      supplierName: p.bill?.supplier?.nama
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bill payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const result = await prisma.$transaction(async (prisma: any) => {
      const payment = await prisma.billPayment.create({
        data: {
          invoiceNumber: `BPAY-${Date.now()}`,
          billId: data.billId,
          amount: data.amount,
          date: new Date(data.date),
          method: data.method,
          reference: data.reference
        }
      });

      const bill = await prisma.bill.findUnique({
        where: { id: data.billId }
      });

      const newPaidAmount = (bill.paidAmount || 0) + data.amount;
      const status = newPaidAmount >= bill.total ? 'PAID' : 'PARTIAL';

      await prisma.bill.update({
        where: { id: data.billId },
        data: {
          paidAmount: newPaidAmount,
          status
        }
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record bill payment' }, { status: 500 });
  }
}

