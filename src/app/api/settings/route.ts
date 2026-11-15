import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    let company = await prisma.company.findFirst();

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'APKA BY DN',
          address: '',
          npwp: '',
        },
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await req.json();
    let company = await prisma.company.findFirst();

    if (company) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          npwp: data.npwp,
        },
      });
    } else {
      company = await prisma.company.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          npwp: data.npwp,
        },
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company profile' }, { status: 500 });
  }
}
