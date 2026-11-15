import { NextResponse } from 'next/server';
import { BillStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_STATUSES = new Set<BillStatus>(['DRAFT', 'RECEIVED', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID']);

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const bills = await prisma.bill.findMany({
      include: { supplier: true },
      orderBy: { date: 'desc' },
    });

    const mapped = bills.map((b) => ({
      ...b,
      number: b.billNumber,
      ppnTotal: b.taxAmount,
      total: b.totalAmount,
      supplierName: b.supplier?.name || 'Unknown',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await request.json();
    const rawItems = Array.isArray(data.lines) ? data.lines : Array.isArray(data.items) ? data.items : [];
    if (!data.supplierId || rawItems.length === 0) {
      return NextResponse.json({ error: 'Supplier dan item tagihan wajib diisi' }, { status: 400 });
    }

    const bill = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const lastBill = await tx.bill.findFirst({
        where: { billNumber: { startsWith: `BIL-${year}-` } },
        orderBy: { billNumber: 'desc' },
        select: { billNumber: true },
      });
      const lastSeq = lastBill ? parseInt(lastBill.billNumber.split('-').pop() || '0', 10) || 0 : 0;
      const billNumber = `BIL-${year}-${String(lastSeq + 1).padStart(4, '0')}`;

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
      const status: BillStatus =
        data.status && VALID_STATUSES.has(data.status) ? (data.status as BillStatus) : 'DRAFT';

      return tx.bill.create({
        data: {
          billNumber,
          supplierId: String(data.supplierId),
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

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
