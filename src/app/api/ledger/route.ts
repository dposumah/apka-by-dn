import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NormalBalance } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Determine normal balance
    const normalBalance = account.normalBalance; // DEBIT or CREDIT

    const whereClause: any = {
      accountId,
      journalEntry: {
        status: "POSTED",
      },
    };

    if (dateFrom || dateTo) {
      whereClause.journalEntry.date = {};
      if (dateFrom) {
        whereClause.journalEntry.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        whereClause.journalEntry.date.lte = toDate;
      }
    }

    // Get starting balance (sum of all POSTED entries before dateFrom)
    let openingBalance = 0;
    if (dateFrom) {
      const pastLines = await prisma.journalEntryLine.findMany({
        where: {
          accountId,
          journalEntry: {
            status: "POSTED",
            date: {
              lt: new Date(dateFrom),
            },
          },
        },
      });

      const pastDebit = pastLines.reduce((sum, line) => sum + line.debit, 0);
      const pastCredit = pastLines.reduce((sum, line) => sum + line.credit, 0);

      openingBalance =
        normalBalance === "DEBIT"
          ? pastDebit - pastCredit
          : pastCredit - pastDebit;
    }

    const lines = await prisma.journalEntryLine.findMany({
      where: whereClause,
      include: {
        journalEntry: true,
      },
      orderBy: {
        journalEntry: {
          date: "asc",
        },
      },
    });

    // Calculate running balance
    let currentBalance = openingBalance;
    const ledgerLines = lines.map((line) => {
      const netChange =
        normalBalance === "DEBIT"
          ? line.debit - line.credit
          : line.credit - line.debit;
      
      currentBalance += netChange;

      return {
        id: line.id,
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        description: line.description || line.journalEntry.description,
        debit: line.debit,
        credit: line.credit,
        balance: currentBalance,
      };
    });

    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    return NextResponse.json({
      account,
      openingBalance,
      closingBalance: currentBalance,
      totalDebit,
      totalCredit,
      lines: ledgerLines,
    });
  } catch (error) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data buku besar" },
      { status: 500 }
    );
  }
}
