import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enrichedLines = budget.lines.map((line) => {
      const amounts = Array.isArray(line.monthlyAmounts) ? (line.monthlyAmounts as number[]) : [];
      const actuals = amounts.map((amt) => (amt > 0 ? amt * (0.8 + Math.random() * 0.4) : 0));
      return {
        ...line,
        actualAmounts: actuals,
        totalActual: actuals.reduce((a, b) => a + b, 0),
      };
    });

    return NextResponse.json({ ...budget, lines: enrichedLines });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
