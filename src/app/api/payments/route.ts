import { NextResponse } from 'next/server';
import { PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_METHODS = new Set<PaymentMethod>(['CASH', 'BANK_TRANSFER', 'CHECK', 'GIRO', 'OTHER']);

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          include: { customer: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const mapped = payments.map((p) => ({
      ...p,
      invoiceNumber: p.invoice?.invoiceNumber || '-',
      customerName: p.invoice?.customer?.name || 'Unknown',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await request.json();
    const amount = Number(data.amount);
    if (!data.invoiceId || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'ID invoice dan nominal pembayaran (> 0) wajib diisi' }, { status: 400 });
    }

    const method: PaymentMethod =
      data.method && VALID_METHODS.has(data.method) ? (data.method as PaymentMethod) : 'BANK_TRANSFER';

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: String(data.invoiceId) },
      });

      if (!invoice) {
        throw new Error('INVOICE_NOT_FOUND');
      }

      const payment = await tx.payment.create({
        data: {
          paymentNumber: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          invoiceId: invoice.id,
          amount,
          date: new Date(data.date || new Date()),
          method,
          reference: data.reference || null,
          notes: data.notes || null,
        },
      });

      const newPaidAmount = (invoice.paidAmount || 0) + amount;
      const status = newPaidAmount + 0.01 >= invoice.totalAmount ? 'PAID' : 'PARTIAL';

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status,
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'INVOICE_NOT_FOUND') {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
