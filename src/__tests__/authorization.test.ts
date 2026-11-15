import { describe, it, expect } from 'vitest';
import { canAccess, requireRole, PERMISSION_MATRIX } from '@/lib/authorization';

describe('Role-based authorization helpers', () => {
  it('checks permissions for canonical Prisma UserRole values', () => {
    expect(canAccess('ADMIN', ['ADMIN'])).toBe(true);
    expect(canAccess('SUPER_ADMIN', ['ADMIN'])).toBe(true);
    expect(canAccess('FASILITATOR', ['ADMIN', 'ACCOUNTANT', 'KORWIL'])).toBe(false);
    expect(canAccess('KORWIL', ['ADMIN', 'ACCOUNTANT', 'KORWIL'])).toBe(true);
  });

  it('throws on missing session or insufficient role', () => {
    expect(() => requireRole(null, ['ADMIN'])).toThrow('Unauthorized');
    expect(() => requireRole({ user: { role: 'VIEWER' } }, ['ADMIN'])).toThrow('Forbidden');
    expect(() => requireRole({ user: { role: 'ACCOUNTANT' } }, ['ADMIN', 'ACCOUNTANT'])).not.toThrow();
  });

  it('maintains permission matrix entries for all five Prisma roles', () => {
    expect(Object.keys(PERMISSION_MATRIX).sort()).toEqual([
      'ACCOUNTANT',
      'ADMIN',
      'FASILITATOR',
      'KORWIL',
      'VIEWER',
    ]);
  });
});
