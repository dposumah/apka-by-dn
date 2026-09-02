import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // There should ideally only be one company profile.
    let company = await prisma.company.findFirst();
    
    // If no company exists, return a default mock object or create one
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'APKA BY DN',
          address: '',
          npwp: ''
        }
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
        }
      });
    } else {
      company = await prisma.company.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          npwp: data.npwp,
        }
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company profile' }, { status: 500 });
  }
}
