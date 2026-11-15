import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { invoices: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const data = await request.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined || data.nama !== undefined
          ? { name: String(data.name ?? data.nama) }
          : {}),
        ...(data.address !== undefined || data.alamat !== undefined
          ? { address: data.address ?? data.alamat ?? null }
          : {}),
        ...(data.phone !== undefined || data.telepon !== undefined
          ? { phone: data.phone ?? data.telepon ?? null }
          : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.npwp !== undefined ? { npwp: data.npwp || null } : {}),
        ...(data.creditLimit !== undefined || data.batasKredit !== undefined
          ? { creditLimit: Number(data.creditLimit ?? data.batasKredit) || 0 }
          : {}),
        ...(typeof data.isActive === 'boolean' ? { isActive: data.isActive } : {}),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
