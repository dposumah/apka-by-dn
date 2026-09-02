import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const budget = await prisma.budget.findUnique({
      where: { id: params.id },
      include: { lines: true }
    });

    if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mocking actual realization data. In a real scenario, this would query JournalEntries/BankTransactions.
    // We add some random realization data for the demonstration.
    const enrichedLines = budget.lines.map(line => {
      const actuals = (line.monthlyAmounts as number[]).map(amt => amt > 0 ? amt * (0.8 + Math.random() * 0.4) : 0);
      return {
        ...line,
        actualAmounts: actuals,
        totalActual: actuals.reduce((a,b)=>a+b, 0)
      };
    });

    return NextResponse.json({ ...budget, lines: enrichedLines });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
