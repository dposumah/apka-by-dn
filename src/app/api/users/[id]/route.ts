import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ADMIN_ONLY_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_ROLES = new Set<UserRole>(['ADMIN', 'ACCOUNTANT', 'VIEWER', 'KORWIL', 'FASILITATOR']);

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ADMIN_ONLY_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const data = await req.json();
    const { name, email, password, role, isActive } = data;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nama dan Email wajib diisi' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: String(email).trim(),
        id: { not: id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah digunakan pengguna lain' }, { status: 400 });
    }

    const updateData: {
      name: string;
      email: string;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
    } = {
      name: String(name).trim(),
      email: String(email).trim(),
    };

    if (role !== undefined) {
      if (!VALID_ROLES.has(role as UserRole)) {
        return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
      }
      updateData.role = role as UserRole;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (password && String(password).trim() !== '') {
      if (String(password).length < 6) {
        return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, errorResponse } = await requireApiAuth(ADMIN_ONLY_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Tidak dapat menghapus Admin terakhir.' }, { status: 400 });
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
