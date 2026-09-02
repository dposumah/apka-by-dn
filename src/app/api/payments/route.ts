import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          include: { customer: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const mapped = payments.map((p: any) => ({
      ...p,
      invoiceNumber: p.invoice?.number,
      customerName: p.invoice?.customer?.nama
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create payment and update invoice in transaction
    const result = await prisma.$transaction(async (prisma: any) => {
      // Create payment
      const payment = await prisma.payment.create({
        data: {
          invoiceNumber: `PAY-${Date.now()}`,
          invoiceId: data.invoiceId,
          amount: data.amount,
          date: new Date(data.date),
          method: data.method,
          reference: data.reference
        }
      });

      // Get invoice to update paid amount
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId }
      });

      const newPaidAmount = (invoice.paidAmount || 0) + data.amount;
      const status = newPaidAmount >= invoice.total ? 'PAID' : 'PARTIAL';

      // Update invoice
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status
        }
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}

