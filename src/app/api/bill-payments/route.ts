import { NextResponse } from 'next/server';
import { PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_METHODS = new Set<PaymentMethod>(['CASH', 'BANK_TRANSFER', 'CHECK', 'GIRO', 'OTHER']);

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const payments = await prisma.billPayment.findMany({
      include: {
        bill: {
          include: { supplier: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const mapped = payments.map((p) => ({
      ...p,
      billNumber: p.bill?.billNumber || '-',
      supplierName: p.bill?.supplier?.name || 'Unknown',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    return NextResponse.json({ error: 'Failed to fetch bill payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await request.json();
    const amount = Number(data.amount);
    if (!data.billId || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'ID tagihan dan nominal pembayaran (> 0) wajib diisi' }, { status: 400 });
    }

    const method: PaymentMethod =
      data.method && VALID_METHODS.has(data.method) ? (data.method as PaymentMethod) : 'BANK_TRANSFER';

    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: String(data.billId) },
      });

      if (!bill) {
        throw new Error('BILL_NOT_FOUND');
      }

      const payment = await tx.billPayment.create({
        data: {
          paymentNumber: `BPAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          billId: bill.id,
          amount,
          date: new Date(data.date || new Date()),
          method,
          reference: data.reference || null,
          notes: data.notes || null,
        },
      });

      const newPaidAmount = (bill.paidAmount || 0) + amount;
      const status = newPaidAmount + 0.01 >= bill.totalAmount ? 'PAID' : 'PARTIAL';

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidAmount,
          status,
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BILL_NOT_FOUND') {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }
    console.error('Error recording bill payment:', error);
    return NextResponse.json({ error: 'Failed to record bill payment' }, { status: 500 });
  }
}
