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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        children: true,
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data akun' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const validatedData = accountSchema.parse(body);

    // Prevent cyclic parent
    if (validatedData.parentId === id) {
      return NextResponse.json(
        { error: 'Akun tidak dapat menjadi induk bagi dirinya sendiri' },
        { status: 400 }
      );
    }

    // Check code uniqueness excluding this account
    const existingAccount = await prisma.account.findFirst({
      where: { 
        code: validatedData.code,
        NOT: { id: id }
      }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Kode akun sudah digunakan' },
        { status: 400 }
      );
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui akun' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Optional: Check if account has journal entries before allowing delete
    // const journalLines = await prisma.journalLine.findFirst({ where: { accountId: id } });
    // if (journalLines) {
    //   return NextResponse.json({ error: 'Akun tidak dapat dihapus karena memiliki transaksi' }, { status: 400 });
    // }

    // Instead of hard delete, perform soft delete or deactivate
    const deletedAccount = await prisma.account.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: deletedAccount });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus akun' },
      { status: 500 }
    );
  }
}
