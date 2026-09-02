import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        accountId: accountId || null
      }
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
