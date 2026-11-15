import { NextResponse } from 'next/server';
import { InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_STATUSES = new Set<InvoiceStatus>(['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID']);

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause =
      status && VALID_STATUSES.has(status as InvoiceStatus)
        ? { status: status as InvoiceStatus }
        : {};

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { customer: true },
      orderBy: { date: 'desc' },
    });

    const mapped = invoices.map((inv) => ({
      ...inv,
      number: inv.invoiceNumber,
      ppnTotal: inv.taxAmount,
      total: inv.totalAmount,
      customerName: inv.customer?.name || 'Unknown',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await request.json();
    const rawItems = Array.isArray(data.lines) ? data.lines : Array.isArray(data.items) ? data.items : [];
    if (!data.customerId || rawItems.length === 0) {
      return NextResponse.json({ error: 'Pelanggan dan item invoice wajib diisi' }, { status: 400 });
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const lastInv = await tx.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `INV-${year}-` } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      const lastSeq = lastInv ? parseInt(lastInv.invoiceNumber.split('-').pop() || '0', 10) || 0 : 0;
      const invoiceNumber = `INV-${year}-${String(lastSeq + 1).padStart(4, '0')}`;

      const parsedLines = rawItems.map((item: {
        description?: string;
        quantity?: number;
        qty?: number;
        unitPrice?: number;
        price?: number;
        taxRate?: number;
        hasPpn?: boolean;
      }) => {
        const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;
        const unitPrice = Number(item.unitPrice ?? item.price ?? 0) || 0;
        const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : item.hasPpn ? 11 : 0;
        const amount = quantity * unitPrice;
        return {
          description: String(item.description || ''),
          quantity,
          unitPrice,
          taxRate,
          amount,
        };
      });

      const subtotal = Number(data.subtotal) || parsedLines.reduce((s: number, l: { amount: number }) => s + l.amount, 0);
      const taxAmount = Number(data.taxAmount ?? data.ppnTotal) || 0;
      const totalAmount = Number(data.totalAmount ?? data.total) || subtotal + taxAmount;
      const status: InvoiceStatus =
        data.status && VALID_STATUSES.has(data.status) ? (data.status as InvoiceStatus) : 'DRAFT';

      return tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: String(data.customerId),
          date: new Date(data.date || new Date()),
          dueDate: new Date(data.dueDate || data.date || new Date()),
          subtotal,
          taxAmount,
          totalAmount,
          status,
          notes: data.notes || null,
          lines: {
            create: parsedLines,
          },
        },
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
