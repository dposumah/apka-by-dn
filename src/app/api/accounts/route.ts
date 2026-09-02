import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const accountSchema = z.object({
  code: z.string().min(1, 'Kode akun wajib diisi'),
  name: z.string().min(1, 'Nama akun wajib diisi'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  subType: z.string().optional().nullable(),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const whereClause: any = {};
    
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }
    
    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const accounts = await prisma.account.findMany({
      where: whereClause,
      orderBy: { code: 'asc' },
    });

    // Minimal implementation of assigning levels based on parentId, if hierarchy needed
    const accountsWithLevel = accounts.map(account => {
      // Very basic level calculation, assuming only 2-3 levels deep and sorted by code works roughly.
      // In production, an explicit hierarchical query or deeper recursive structure might be preferred.
      return {
        ...account,
        level: account.parentId ? 1 : 0 // simplify level assignment for now
      };
    });

    return NextResponse.json(accountsWithLevel);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data akun' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = accountSchema.parse(body);

    // Check if code is unique
    const existingAccount = await prisma.account.findUnique({
      where: { code: validatedData.code }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Kode akun sudah digunakan' },
        { status: 400 }
      );
    }

    const newAccount = await prisma.account.create({
      data: validatedData,
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Gagal membuat akun' },
      { status: 500 }
    );
  }
}
