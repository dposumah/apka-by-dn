import { NextResponse } from 'next/server';
import { InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_INVOICE_STATUSES = new Set<InvoiceStatus>(['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID']);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...invoice,
      number: invoice.invoiceNumber,
      ppnTotal: invoice.taxAmount,
      total: invoice.totalAmount,
      customer: {
        ...invoice.customer,
        nama: invoice.customer.name,
        telepon: invoice.customer.phone,
        alamat: invoice.customer.address,
      },
      lines: invoice.lines.map((l) => ({
        ...l,
        qty: l.quantity,
        price: l.unitPrice,
        hasPpn: l.taxRate > 0,
        total: l.amount,
      })),
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const data = await request.json();

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status && VALID_INVOICE_STATUSES.has(data.status)
          ? { status: data.status as InvoiceStatus }
          : {}),
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
