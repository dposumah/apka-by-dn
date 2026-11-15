import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    const mapped = customers.map((c) => ({
      ...c,
      nama: c.name,
      alamat: c.address || '',
      telepon: c.phone || '',
      batasKredit: c.creditLimit,
      saldoPiutang: c.balance,
      status: c.isActive ? 'AKTIF' : 'NONAKTIF',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await request.json();
    const name = String(data.name ?? data.nama ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Nama pelanggan wajib diisi' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        address: data.address ?? data.alamat ?? null,
        phone: data.phone ?? data.telepon ?? null,
        email: data.email || null,
        npwp: data.npwp || null,
        creditLimit: Number(data.creditLimit ?? data.batasKredit) || 0,
        isActive: true,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
