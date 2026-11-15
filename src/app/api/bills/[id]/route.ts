import { NextResponse } from 'next/server';
import { BillStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_BILL_STATUSES = new Set<BillStatus>(['DRAFT', 'RECEIVED', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID']);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: true,
        payments: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...bill,
      number: bill.billNumber,
      ppnTotal: bill.taxAmount,
      total: bill.totalAmount,
      supplier: {
        ...bill.supplier,
        nama: bill.supplier.name,
        telepon: bill.supplier.phone,
        alamat: bill.supplier.address,
      },
      lines: bill.lines.map((l) => ({
        ...l,
        qty: l.quantity,
        price: l.unitPrice,
        hasPpn: l.taxRate > 0,
        total: l.amount,
      })),
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const data = await request.json();

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status && VALID_BILL_STATUSES.has(data.status) ? { status: data.status as BillStatus } : {}),
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await prisma.bill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
