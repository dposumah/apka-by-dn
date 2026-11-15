import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { name, bankName, accountNumber, balance, accountId } = body;

    if (!name || !bankName || !accountNumber) {
      return NextResponse.json({ error: 'Name, Bank Name, and Account Number are required' }, { status: 400 });
    }

    const newAccount = await prisma.bankAccount.create({
      data: {
        name,
        bankName,
        accountNumber,
        balance: parseFloat(balance) || 0,
        accountId: accountId || null,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
