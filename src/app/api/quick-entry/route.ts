import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';
import {
  assertFiscalPeriodOpen,
  FiscalPeriodClosedError,
  generateNextEntryNumber,
} from '@/lib/accounting-server';

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const data = await req.json();
    const { date, type, accountId, amount, description, attachmentUrl } = data;
    let { bankAccountId } = data;

    if (!bankAccountId) {
      const defaultBca = await prisma.account.findUnique({ where: { code: '111.11.101' } });
      if (defaultBca) bankAccountId = defaultBca.id;
    }

    if (!date || (type !== 'IN' && type !== 'OUT') || !accountId || !amount || !bankAccountId) {
      return NextResponse.json({ error: 'Data tidak lengkap atau tipe transaksi tidak valid' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 });
    }

    const txDate = new Date(date);
    if (Number.isNaN(txDate.getTime())) {
      return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 });
    }

    const prefix = type === 'IN' ? 'KSM' : 'KSK';
    const desc = String(description || '');

    const debitLine =
      type === 'IN'
        ? { accountId: String(bankAccountId), debit: numAmount, credit: 0, description: desc }
        : { accountId: String(accountId), debit: numAmount, credit: 0, description: desc };

    const creditLine =
      type === 'IN'
        ? { accountId: String(accountId), debit: 0, credit: numAmount, description: desc }
        : { accountId: String(bankAccountId), debit: 0, credit: numAmount, description: desc };

    const journalEntry = await prisma.$transaction(async (tx) => {
      await assertFiscalPeriodOpen(tx, txDate);
      const entryNumber = await generateNextEntryNumber(tx, prefix, txDate, { yearMonth: true });

      return tx.journalEntry.create({
        data: {
          entryNumber,
          date: txDate,
          description: desc,
          attachmentUrl: attachmentUrl || null,
          status: 'POSTED',
          totalDebit: numAmount,
          totalCredit: numAmount,
          createdById: session.user.id,
          approvedById: session.user.id,
          lines: {
            create: [debitLine, creditLine],
          },
        },
      });
    });

    return NextResponse.json(journalEntry, { status: 201 });
  } catch (error) {
    if (error instanceof FiscalPeriodClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Quick Entry Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan data' }, { status: 500 });
  }
}
