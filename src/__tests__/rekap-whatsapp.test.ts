import { describe, it, expect } from 'vitest';
import {
  normalizeWhatsAppNumber,
  formatBulanRekap,
  buildRekapWhatsAppMessage,
} from '@/lib/rekap-whatsapp';

describe('WhatsApp rekap notification helpers', () => {
  it('normalizes Indonesian phone formats into 628... format', () => {
    expect(normalizeWhatsAppNumber('0813-3478-9107')).toBe('6281334789107');
    expect(normalizeWhatsAppNumber('+62 857-1390-2667')).toBe('6285713902667');
    expect(normalizeWhatsAppNumber('82292384728')).toBe('6282292384728');
    expect(normalizeWhatsAppNumber('6208123456789')).toBe('628123456789');
    expect(normalizeWhatsAppNumber('12345')).toBe('');
    expect(normalizeWhatsAppNumber(null)).toBe('');
  });

  it('formats YYYY-MM strings into Indonesian month labels', () => {
    expect(formatBulanRekap('2026-10')).toBe('Oktober 2026');
    expect(formatBulanRekap('2026-02')).toBe('Februari 2026');
    expect(formatBulanRekap(null)).toBe('-');
  });

  it('combines honor & transport link when both share the same receipt URL', () => {
    const sharedUrl = 'https://www.roboticexplorer.site/b/rk_1/h?k=abcdef123456';
    const message = buildRekapWhatsAppMessage(
      {
        bulan: '2026-10',
        totalJP: 24,
        totalJPIntra: 16,
        totalJPEkstra: 8,
        totalHonor: 1560000,
        totalTransport: 200000,
        buktiPembayaranHonor: 'https://example.supabase.co/receipt.png',
        buktiPembayaranTransport: 'https://example.supabase.co/receipt.png',
        fasilitator: {
          namaLengkap: 'Budi Santoso',
          lokasiSNT: 'Kupang',
          bankName: 'BCA',
          bankAccount: '1234567890',
        },
      },
      {
        urlHonor: sharedUrl,
        urlTransport: sharedUrl,
      }
    );

    expect(message).toContain('Bukti Transfer (Honor & Transport):');
    expect(message).not.toContain('Bukti Transportasi:');
    expect(message).toContain('Rp 1.760.000');
  });
});
