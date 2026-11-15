import type { Prisma, PrismaClient } from '@prisma/client';

type TxClient = Prisma.TransactionClient | PrismaClient;

export class FiscalPeriodClosedError extends Error {
  constructor(periodName: string) {
    super(`Periode fiskal "${periodName}" sudah ditutup (CLOSED) dan tidak dapat diubah.`);
    this.name = 'FiscalPeriodClosedError';
  }
}

/**
 * Memastikan tanggal transaksi tidak berada pada periode fiskal yang berstatus CLOSED.
 */
export async function assertFiscalPeriodOpen(tx: TxClient, date: Date): Promise<void> {
  const closedPeriod = await tx.fiscalPeriod.findFirst({
    where: {
      status: 'CLOSED',
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { name: true },
  });

  if (closedPeriod) {
    throw new FiscalPeriodClosedError(closedPeriod.name);
  }
}

/**
 * Menghasilkan nomor entry unik (misal JU-2026-0001) di dalam transaksi database
 * menggunakan urutan tertinggi yang ada agar aman dari race condition / penghapusan baris.
 */
export async function generateNextEntryNumber(
  tx: TxClient,
  prefix: string,
  date: Date,
  options?: { yearMonth?: boolean; minSequence?: number }
): Promise<string> {
  const year = date.getFullYear();
  const token = options?.yearMonth
    ? `${prefix}-${year}${(date.getMonth() + 1).toString().padStart(2, '0')}`
    : `${prefix}-${year}`;

  const lastEntry = await tx.journalEntry.findFirst({
    where: {
      entryNumber: { startsWith: `${token}-` },
    },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });

  let seq = options?.minSequence ?? 1;
  if (lastEntry) {
    const tail = parseInt(lastEntry.entryNumber.split('-').pop() || '0', 10);
    if (!Number.isNaN(tail)) {
      seq = Math.max(seq, tail + 1);
    }
  }

  return `${token}-${String(seq).padStart(4, '0')}`;
}

/**
 * Validasi baris jurnal double-entry (minimal 2 baris, nominal non-negatif,
 * total debit === total kredit dalam toleransi pembulatan 0.01).
 */
export function validateJournalLines(
  lines: Array<{ accountId?: string; debit?: number; credit?: number }>
): { valid: true; totalDebit: number; totalCredit: number } | { valid: false; error: string } {
  if (!Array.isArray(lines) || lines.length < 2) {
    return { valid: false, error: 'Jurnal harus memiliki minimal 2 baris akun' };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    if (!line.accountId || typeof line.accountId !== 'string') {
      return { valid: false, error: 'Setiap baris jurnal wajib memilih akun' };
    }
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    if (debit < 0 || credit < 0) {
      return { valid: false, error: 'Nilai debit dan kredit tidak boleh negatif' };
    }
    if (debit === 0 && credit === 0) {
      return { valid: false, error: 'Setiap baris harus memiliki nilai debit atau kredit lebih dari 0' };
    }
    totalDebit += debit;
    totalCredit += credit;
  }

  if (totalDebit <= 0 || Math.abs(totalDebit - totalCredit) > 0.01) {
    return { valid: false, error: 'Total Debit dan Kredit harus seimbang (balance)' };
  }

  return { valid: true, totalDebit, totalCredit };
}
