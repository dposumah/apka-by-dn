import type { UserRole } from '@prisma/client';

export type Role = UserRole;

export function canAccess(userRole: string, requiredRoles: string[]): boolean {
  const normalized = userRole === 'SUPER_ADMIN' ? 'ADMIN' : userRole;
  return requiredRoles.includes(normalized);
}

export function requireRole(session: { user?: { role?: string } } | null, roles: string[]): void {
  if (!session?.user?.role) {
    throw new Error('Unauthorized: No session found');
  }
  if (!canAccess(session.user.role, roles)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

export const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  ACCOUNTANT: [
    'create:journal', 'update:journal', 'delete:journal', 'read:journal',
    'create:invoice', 'update:invoice', 'delete:invoice', 'read:invoice',
    'create:bill', 'update:bill', 'delete:bill', 'read:bill',
    'read:report', 'read:dashboard',
    'create:account', 'update:account', 'read:account',
  ],
  KORWIL: [
    'read:snt', 'write:snt', 'read:cashflow', 'write:cashflow', 'read:report',
  ],
  VIEWER: [
    'read:journal', 'read:invoice', 'read:bill', 'read:report', 'read:dashboard', 'read:account',
  ],
  FASILITATOR: [
    'read:portal', 'write:portal',
  ],
};
