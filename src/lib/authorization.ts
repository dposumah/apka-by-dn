export type Role = 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

export function canAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function requireRole(session: any, roles: string[]): void {
  if (!session?.user?.role) {
    throw new Error("Unauthorized: No session found");
  }
  if (!canAccess(session.user.role, roles)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
}

export const PERMISSION_MATRIX = {
  ADMIN: ['*'],
  ACCOUNTANT: [
    'create:journal', 'update:journal', 'delete:journal', 'read:journal',
    'create:invoice', 'update:invoice', 'delete:invoice', 'read:invoice',
    'create:bill', 'update:bill', 'delete:bill', 'read:bill',
    'read:report', 'read:dashboard',
    'create:account', 'update:account', 'read:account'
  ],
  VIEWER: [
    'read:journal', 'read:invoice', 'read:bill', 'read:report', 'read:dashboard', 'read:account'
  ]
};
