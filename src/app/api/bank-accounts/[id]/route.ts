import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const account = await prisma.bankAccount.findUnique({
      where: { id: params.id }
    });

    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, bankName, accountNumber, isActive, accountId } = body;

    const account = await prisma.bankAccount.update({
      where: { id: params.id },
      data: {
        name,
        bankName,
        accountNumber,
        isActive,
        accountId: accountId || null
      }
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.bankAccount.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
