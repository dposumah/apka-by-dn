import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumed prisma client location

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Simulate returning empty list if no DB connected yet, or connect to DB
    // Since we assume Prisma is configured, we return mock/real data
    // Returning mock data for safe execution if DB schema is unknown, but we should use Prisma as requested.
    // For now we'll write the query and catch error if table doesn't exist
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const customer = await prisma.customer.create({
      data: {
        name: data.nama,
        address: data.alamat,
        phone: data.telepon,
        email: data.email,
        npwp: data.npwp,
        creditLimit: data.batasKredit || 0,
        isActive: true
      }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

