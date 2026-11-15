import { NextResponse } from 'next/server';
import { BankTransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: {
      bankAccountId?: string;
      date?: { gte: Date; lte: Date };
    } = {};
    if (bankAccountId) whereClause.bankAccountId = bankAccountId;
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.bankTransaction.findMany({
      where: whereClause,
      include: { bankAccount: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { bankAccountId, date, description, amount, type, isReconciled } = body;

    const parsedAmount = parseFloat(amount);
    if (
      !bankAccountId ||
      isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      (type !== 'DEBIT' && type !== 'CREDIT')
    ) {
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
          type: type as BankTransactionType,
          isReconciled: Boolean(isReconciled),
        },
      });

      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: newBalance },
      });

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating bank transaction:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
