import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  signReceiptToken,
  verifyReceiptToken,
  buildSignedReceiptUrl,
} from '@/lib/receipt-link';

describe('Signed receipt proxy URL helpers', () => {
  const originalSecret = process.env.RECEIPT_SIGNING_SECRET;
  const originalNextAuth = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.RECEIPT_SIGNING_SECRET = 'test-signing-secret-123456';
  });

  afterEach(() => {
    process.env.RECEIPT_SIGNING_SECRET = originalSecret;
    process.env.NEXTAUTH_SECRET = originalNextAuth;
  });

  it('signs and verifies valid tokens for honor and transport receipts', () => {
    const tokenH = signReceiptToken('rekap_01', 'h');
    const tokenT = signReceiptToken('rekap_01', 't');

    expect(tokenH).toHaveLength(12);
    expect(tokenH).not.toBe(tokenT);
    expect(verifyReceiptToken('rekap_01', 'h', tokenH)).toBe(true);
    expect(verifyReceiptToken('rekap_01', 't', tokenH)).toBe(false);
    expect(verifyReceiptToken('rekap_02', 'h', tokenH)).toBe(false);
    expect(verifyReceiptToken('rekap_01', 'h', '')).toBe(false);
    expect(verifyReceiptToken('rekap_01', 'h', null)).toBe(false);
  });

  it('builds branded receipt proxy URL without exposing Supabase URL', () => {
    const url = buildSignedReceiptUrl('rekap_abc', 'h');
    expect(url).toContain('/b/rekap_abc/h?k=');
    expect(url).not.toContain('supabase');
  });

  it('throws when no signing secret is configured', () => {
    delete process.env.RECEIPT_SIGNING_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    expect(() => signReceiptToken('rekap_01', 'h')).toThrow();
    expect(verifyReceiptToken('rekap_01', 'h', '123456789012')).toBe(false);
  });
});
