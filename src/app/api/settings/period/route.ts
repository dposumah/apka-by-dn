import { NextResponse } from 'next/server';
import { PeriodStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const periods = await prisma.fiscalPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(periods);
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id, status } = await req.json();
    if (!id || (status !== 'OPEN' && status !== 'CLOSED')) {
      return NextResponse.json({ error: 'ID periode dan status OPEN/CLOSED wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.fiscalPeriod.update({
      where: { id: String(id) },
      data: { status: status as PeriodStatus },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating period:', error);
    return NextResponse.json({ error: 'Failed to update period' }, { status: 500 });
  }
}
