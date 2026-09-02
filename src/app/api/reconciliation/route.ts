import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { transactionIds } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: 'No transactions specified' }, { status: 400 });
    }

    await prisma.bankTransaction.updateMany({
      where: {
        id: { in: transactionIds }
      },
      data: {
        isReconciled: true
      }
    });

    return NextResponse.json({ success: true, message: 'Transactions reconciled' });
  } catch (error: any) {
    console.error('Error reconciling transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
