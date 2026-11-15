import { UserRole } from '@prisma/client';
import { getServerSession, Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const ACCOUNTING_READ_ROLES: UserRole[] = [
  'ADMIN',
  'ACCOUNTANT',
  'VIEWER',
  'KORWIL',
];
export const ACCOUNTING_WRITE_ROLES: UserRole[] = ['ADMIN', 'ACCOUNTANT'];
export const CASHFLOW_READ_ROLES: UserRole[] = [
  'ADMIN',
  'ACCOUNTANT',
  'VIEWER',
  'KORWIL',
];
export const CASHFLOW_WRITE_ROLES: UserRole[] = [
  'ADMIN',
  'ACCOUNTANT',
  'KORWIL',
];
export const SNT_MANAGE_ROLES: UserRole[] = ['ADMIN', 'ACCOUNTANT', 'KORWIL'];
export const ADMIN_ONLY_ROLES: UserRole[] = ['ADMIN'];

function normalizeAllowedRoles(allowedRoles?: readonly string[]): UserRole[] | undefined {
  if (!allowedRoles || allowedRoles.length === 0) return undefined;
  return allowedRoles.map((r) => (r === 'SUPER_ADMIN' ? 'ADMIN' : r)) as UserRole[];
}

export async function checkAuth(allowedRoles?: readonly string[]) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return { error: 'Unauthorized: Please login first', session: null };
  }

  if (!session?.user?.id) {
    return { error: 'Unauthorized: Please login first', session: null };
  }

  // Re-verify active status and current role against the database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return { error: 'Unauthorized: Account is inactive or deleted', session: null };
  }

  session.user.role = dbUser.role;

  const normalized = normalizeAllowedRoles(allowedRoles);
  if (normalized && normalized.length > 0 && !normalized.includes(dbUser.role)) {
    return { error: 'Forbidden: Access denied for your role', session: null };
  }

  return { error: null, session };
}

export function hasAnyRole(role: string | undefined, allowedRoles: readonly UserRole[]): boolean {
  if (!role) return false;
  const normalizedRole = (role === 'SUPER_ADMIN' ? 'ADMIN' : role) as UserRole;
  return allowedRoles.includes(normalizedRole);
}

export async function requireApiAuth(allowedRoles?: readonly string[]) {
  const { error, session } = await checkAuth(allowedRoles);
  if (error || !session) {
    const isForbidden = error?.startsWith('Forbidden');
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: isForbidden ? 403 : 401 }
      ),
    };
  }
  return { session, errorResponse: null };
}
