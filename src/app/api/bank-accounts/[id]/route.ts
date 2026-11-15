import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const account = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { name, bankName, accountNumber, isActive, accountId } = body;

    const account = await prisma.bankAccount.update({
      where: { id },
      data: {
        name,
        bankName,
        accountNumber,
        isActive,
        accountId: accountId || null,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
