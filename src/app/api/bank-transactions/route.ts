import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {};
    if (bankAccountId) whereClause.bankAccountId = bankAccountId;
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.bankTransaction.findMany({
      where: whereClause,
      include: { bankAccount: true },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { bankAccountId, date, description, amount, type, isReconciled } = body;

    const parsedAmount = parseFloat(amount);
    if (!bankAccountId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const acc = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (!acc) throw new Error('Bank account not found');

      const newBalance = type === 'DEBIT' ? acc.balance + parsedAmount : acc.balance - parsedAmount;

      const newTx = await tx.bankTransaction.create({
        data: {
          bankAccountId,
          date: new Date(date),
          description,
          amount: parsedAmount,
          type,
          isReconciled: isReconciled || false
        }
      });

      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: newBalance }
      });

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bank transaction:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
