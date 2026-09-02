import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const journal = await prisma.journalEntry.findUnique({
      where: { id: params.id },
      include: { lines: true },
    });

    if (!journal) {
      return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
    }

    if (journal.status !== "POSTED") {
      return NextResponse.json({ error: "Hanya jurnal POSTED yang dapat dibatalkan" }, { status: 400 });
    }

    // Generate reverse entry number
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    
    const count = await prisma.journalEntry.count({
      where: {
        date: {
          gte: startOfYear,
          lt: endOfYear,
        }
      }
    });
    const reverseEntryNumber = `JU-${year}-${String(count + 1).padStart(4, "0")}`;

    // Transaction to void original and create reverse
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark original as VOID
      await tx.journalEntry.update({
        where: { id: params.id },
        data: { status: "VOID" },
      });

      // 2. Create reverse entry
      const reverseEntry = await tx.journalEntry.create({
        data: {
          entryNumber: reverseEntryNumber,
          date: new Date(),
          description: `Reversal of ${journal.entryNumber}: ${journal.description}`,
          reference: journal.entryNumber,
          status: "POSTED", // Reverse entries are posted immediately
          totalDebit: journal.totalCredit,
          totalCredit: journal.totalDebit,
          lines: {
            create: journal.lines.map(line => ({
              accountId: line.accountId,
              description: `Reversal: ${line.description || journal.description}`,
              // Swap debit and credit
              debit: line.credit,
              credit: line.debit,
            }))
          }
        }
      });

      return reverseEntry;
    });

    return NextResponse.json({ success: true, reverseEntry: result });
  } catch (error) {
    console.error("Error voiding journal:", error);
    return NextResponse.json({ error: "Gagal membatalkan jurnal" }, { status: 500 });
  }
}
