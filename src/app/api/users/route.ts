import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ADMIN_ONLY_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_ROLES = new Set<UserRole>(['ADMIN', 'ACCOUNTANT', 'VIEWER', 'KORWIL', 'FASILITATOR']);

export async function GET() {
  try {
    const { errorResponse } = await requireApiAuth(ADMIN_ONLY_ROLES);
    if (errorResponse) return errorResponse;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ADMIN_ONLY_ROLES);
    if (errorResponse) return errorResponse;

    const data = await req.json();
    const { name, email, password, role } = data;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, Email, dan Password wajib diisi' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const targetRole: UserRole =
      role && VALID_ROLES.has(role as UserRole) ? (role as UserRole) : 'VIEWER';

    const existingUser = await prisma.user.findUnique({
      where: { email: String(email).trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim(),
        password: hashedPassword,
        role: targetRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
