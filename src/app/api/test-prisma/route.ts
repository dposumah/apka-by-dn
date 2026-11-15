import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ADMIN_ONLY_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  const { errorResponse } = await requireApiAuth(ADMIN_ONLY_ROLES);
  if (errorResponse) return errorResponse;

  try {
    const res = await prisma.kwitansiRecord.findFirst({ where: { tipeKwitansi: 'HONOR' } });
    return NextResponse.json({ success: true, res });
  } catch (error) {
    console.error('test-prisma error:', error);
    return NextResponse.json({ success: false, error: 'Database check failed' }, { status: 500 });
  }
}
