import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACCOUNTING_WRITE_ROLES, requireApiAuth } from "@/lib/auth-check";
import { assertFiscalPeriodOpen, FiscalPeriodClosedError } from "@/lib/accounting-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // Tandai jurnal asal sebagai VOID di dalam transaksi.
    // Seluruh laporan (neraca, laba rugi, buku besar, dashboard) hanya menghitung status POSTED,
    // sehingga kita tidak lagi membuat jurnal pembalik berstatus POSTED yang menyebabkan double-reversal.
    const voided = await prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.findFirst({
        where: {
          OR: [{ id }, { entryNumber: id }],
        },
      });

      if (!journal) {
        throw new Error("NOT_FOUND");
      }

      if (journal.status !== "POSTED") {
        throw new Error("NOT_POSTED");
      }

      await assertFiscalPeriodOpen(tx, journal.date);

      return tx.journalEntry.update({
        where: { id: journal.id },
        data: { status: "VOID" },
      });
    });

    return NextResponse.json({ success: true, journal: voided });
  } catch (error: unknown) {
    if (error instanceof FiscalPeriodClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
      }
      if (error.message === "NOT_POSTED") {
        return NextResponse.json({ error: "Hanya jurnal POSTED yang dapat dibatalkan" }, { status: 400 });
      }
    }
    console.error("Error voiding journal:", error);
    return NextResponse.json({ error: "Gagal membatalkan jurnal" }, { status: 500 });
  }
}
