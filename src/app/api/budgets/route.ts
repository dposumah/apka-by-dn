import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const budgets = await prisma.budget.findMany({
      include: {
        lines: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = budgets.map(b => ({
      ...b,
      totalBudget: b.lines.reduce((sum, l) => sum + l.totalAmount, 0),
      // Mocking total realization for the list view to keep it fast
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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, fiscalPeriodId, status, lines } = body;

    if (!name || !fiscalPeriodId || !lines || lines.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        fiscalPeriodId,
        status: status || 'DRAFT',
        lines: {
          create: lines.map((l: any) => ({
            accountId: l.accountId,
            monthlyAmounts: l.monthlyAmounts,
            totalAmount: l.monthlyAmounts.reduce((a:number,b:number)=>a+b, 0)
          }))
        }
      }
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
