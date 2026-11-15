import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { transactionIds } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'No transactions specified' }, { status: 400 });
    }

    await prisma.bankTransaction.updateMany({
      where: {
        id: { in: transactionIds },
      },
      data: {
        isReconciled: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Transactions reconciled' });
  } catch (error) {
    console.error('Error reconciling transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
