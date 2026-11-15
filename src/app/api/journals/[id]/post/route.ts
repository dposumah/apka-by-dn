import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACCOUNTING_WRITE_ROLES, requireApiAuth } from "@/lib/auth-check";
import { assertFiscalPeriodOpen, FiscalPeriodClosedError } from "@/lib/accounting-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { session, errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const updated = await prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.findFirst({
        where: {
          OR: [{ id }, { entryNumber: id }],
        },
        include: { lines: true },
      });

      if (!journal) {
        throw new Error("NOT_FOUND");
      }

      if (journal.status !== "DRAFT") {
        throw new Error("NOT_DRAFT");
      }

      await assertFiscalPeriodOpen(tx, journal.date);

      if (Math.abs(journal.totalDebit - journal.totalCredit) > 0.01) {
        throw new Error("UNBALANCED");
      }

      const res = await tx.journalEntry.updateMany({
        where: { id: journal.id, status: "DRAFT" },
        data: {
          status: "POSTED",
          approvedById: session.user.id,
        },
      });

      if (res.count === 0) {
        throw new Error("NOT_DRAFT");
      }

      return tx.journalEntry.findUnique({ where: { id: journal.id } });
    });

    return NextResponse.json({ journal: updated });
  } catch (error: unknown) {
    if (error instanceof FiscalPeriodClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
      }
      if (error.message === "NOT_DRAFT") {
        return NextResponse.json({ error: "Hanya jurnal DRAFT yang dapat diposting" }, { status: 400 });
      }
      if (error.message === "UNBALANCED") {
        return NextResponse.json({ error: "Debit dan Kredit tidak seimbang" }, { status: 400 });
      }
    }
    console.error("Error posting journal:", error);
    return NextResponse.json({ error: "Gagal memposting jurnal" }, { status: 500 });
  }
}
