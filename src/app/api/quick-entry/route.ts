import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { date, type, accountId, amount, description, attachmentUrl, bankAccountId } = data;

    if (!date || !type || !accountId || !amount || !bankAccountId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 });
    }

    // Generate Journal Entry Number
    const today = new Date();
    const prefix = type === 'IN' ? 'KSM' : 'KSK';
    const yearMonth = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Get last entry number
    const lastEntry = await prisma.journalEntry.findFirst({
      where: {
        entryNumber: { startsWith: `${prefix}-${yearMonth}` }
      },
      orderBy: { entryNumber: 'desc' }
    });

    let sequence = 1;
    if (lastEntry) {
      const lastSeq = parseInt(lastEntry.entryNumber.split('-').pop() || '0');
      sequence = lastSeq + 1;
    }
    const entryNumber = `${prefix}-${yearMonth}-${sequence.toString().padStart(4, '0')}`;

    // Create lines depending on type
    // If IN (Uang Masuk): Debit Bank, Credit Account (Pendapatan/Modal)
    // If OUT (Uang Keluar): Debit Account (Beban/Aset), Credit Bank
    
    let debitLine = {};
    let creditLine = {};

    if (type === 'IN') {
      debitLine = { accountId: bankAccountId, debit: numAmount, credit: 0, description };
      creditLine = { accountId: accountId, debit: 0, credit: numAmount, description };
    } else {
      debitLine = { accountId: accountId, debit: numAmount, credit: 0, description };
      creditLine = { accountId: bankAccountId, debit: 0, credit: numAmount, description };
    }

    const journalEntry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(date),
        description,
        attachmentUrl,
        totalDebit: numAmount,
        totalCredit: numAmount,
        lines: {
          create: [debitLine, creditLine]
        }
      }
    });

    return NextResponse.json(journalEntry, { status: 201 });
  } catch (error) {
    console.error('Quick Entry Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan data' }, { status: 500 });
  }
}
