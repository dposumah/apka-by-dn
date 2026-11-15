import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    const mapped = suppliers.map((s) => ({
      ...s,
      nama: s.name,
      alamat: s.address || '',
      telepon: s.phone || '',
      saldoHutang: s.balance,
      status: s.isActive ? 'AKTIF' : 'NONAKTIF',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await request.json();
    const name = String(data.name ?? data.nama ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Nama supplier wajib diisi' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        address: data.address ?? data.alamat ?? null,
        phone: data.phone ?? data.telepon ?? null,
        email: data.email || null,
        npwp: data.npwp || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
