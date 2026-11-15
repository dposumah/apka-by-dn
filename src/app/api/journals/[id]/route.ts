import { NextResponse } from "next/server";
import { JournalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from "@/lib/auth-check";
import {
  assertFiscalPeriodOpen,
  FiscalPeriodClosedError,
  validateJournalLines,
} from "@/lib/accounting-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await Promise.resolve(params);

    const journal = await prisma.journalEntry.findFirst({
      where: {
        OR: [{ id }, { entryNumber: id }],
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!journal) {
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ journal });
  } catch (error) {
    console.error("Error fetching journal:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data jurnal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { session, errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { date, description, reference, lines, status } = body;

    const existing = await prisma.journalEntry.findFirst({
      where: {
        OR: [{ id }, { entryNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            existing.status === "VOID"
              ? "Jurnal berstatus VOID tidak dapat diedit"
              : "Jurnal yang sudah POSTED tidak dapat diedit langsung. Kembalikan ke Draft terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const validation = validateJournalLines(lines);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const txDate = new Date(date);
    if (Number.isNaN(txDate.getTime())) {
      return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
    }

    const targetStatus: JournalStatus | undefined =
      status && ["DRAFT", "POSTED"].includes(status) ? (status as JournalStatus) : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      await assertFiscalPeriodOpen(tx, existing.date);
      await assertFiscalPeriodOpen(tx, txDate);

      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: existing.id },
      });

      return tx.journalEntry.update({
        where: { id: existing.id },
        data: {
          date: txDate,
          description: String(description),
          reference: reference || null,
          totalDebit: validation.totalDebit,
          totalCredit: validation.totalCredit,
          ...(targetStatus ? { status: targetStatus } : {}),
          ...(targetStatus === "POSTED" ? { approvedById: session.user.id } : {}),
          lines: {
            create: lines.map((line: { accountId: string; description?: string; debit?: number; credit?: number }) => ({
              accountId: line.accountId,
              description: line.description || "",
              debit: Number(line.debit) || 0,
              credit: Number(line.credit) || 0,
            })),
          },
        },
        include: { lines: true },
      });
    });

    return NextResponse.json({ journal: updated });
  } catch (error) {
    if (error instanceof FiscalPeriodClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating journal:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui jurnal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await Promise.resolve(params);

    const existing = await prisma.journalEntry.findFirst({
      where: {
        OR: [{ id }, { entryNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Hanya jurnal berstatus DRAFT yang dapat dihapus" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await assertFiscalPeriodOpen(tx, existing.date);
      await tx.journalEntry.delete({
        where: { id: existing.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof FiscalPeriodClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error deleting journal:", error);
    return NextResponse.json(
      { error: "Gagal menghapus jurnal" },
      { status: 500 }
    );
  }
}
