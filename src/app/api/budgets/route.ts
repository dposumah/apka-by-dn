import { NextResponse } from 'next/server';
import { BudgetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const budgets = await prisma.budget.findMany({
      include: {
        lines: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = budgets.map((b) => ({
      ...b,
      totalBudget: b.lines.reduce((sum, l) => sum + l.totalAmount, 0),
      totalRealized: 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { name, fiscalPeriodId, status, lines } = body;

    if (!name || !fiscalPeriodId || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        fiscalPeriodId,
        status: (status as BudgetStatus) || 'DRAFT',
        lines: {
          create: lines.map((l: { accountId: string; monthlyAmounts: number[] }) => ({
            accountId: l.accountId,
            monthlyAmounts: l.monthlyAmounts,
            totalAmount: Array.isArray(l.monthlyAmounts)
              ? l.monthlyAmounts.reduce((a, b) => a + (Number(b) || 0), 0)
              : 0,
          })),
        },
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
