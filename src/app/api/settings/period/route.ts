import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const periods = await prisma.fiscalPeriod.findMany({
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(periods);
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
  }
}
