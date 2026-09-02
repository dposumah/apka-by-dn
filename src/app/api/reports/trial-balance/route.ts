import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateTo = searchParams.get("dateTo");

    let dateFilter: any = {};
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      dateFilter = { lte: toDate };
    }

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              status: "POSTED",
              ...(dateTo ? { date: dateFilter } : {}),
            },
          },
        },
      },
    });

    const trialBalance = accounts.map((account) => {
      const totalDebit = account.journalLines.reduce(
        (sum, line) => sum + line.debit,
        0
      );
      const totalCredit = account.journalLines.reduce(
        (sum, line) => sum + line.credit,
        0
      );

      let debit = 0;
      let credit = 0;

      if (account.normalBalance === "DEBIT") {
        const balance = totalDebit - totalCredit;
        if (balance >= 0) debit = balance;
        else credit = Math.abs(balance);
      } else {
        const balance = totalCredit - totalDebit;
        if (balance >= 0) credit = balance;
        else debit = Math.abs(balance);
      }

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit,
      };
    }).filter((acc) => acc.debit > 0 || acc.credit > 0);

    const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

    // Group by account type
    const groupedData = trialBalance.reduce((acc: any, curr) => {
      if (!acc[curr.type]) {
        acc[curr.type] = [];
      }
      acc[curr.type].push(curr);
      return acc;
    }, {});

    return NextResponse.json({
      groupedData,
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit,
    });
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return NextResponse.json(
      { error: "Gagal membuat laporan neraca saldo" },
      { status: 500 }
    );
  }
}
