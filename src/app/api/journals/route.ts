import { NextResponse } from "next/server";
import { JournalStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from "@/lib/auth-check";
import {
  assertFiscalPeriodOpen,
  FiscalPeriodClosedError,
  generateNextEntryNumber,
  validateJournalLines,
} from "@/lib/accounting-server";

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.JournalEntryWhereInput = {};
    if (status && status !== "ALL" && ["DRAFT", "POSTED", "VOID"].includes(status)) {
      where.status = status as JournalStatus;
    }
    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const journals = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    return NextResponse.json({ journals });
  } catch (error) {
    console.error("Error fetching journals:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data jurnal" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { date, description, reference, status, lines, attachmentUrl } = body;

    if (!date || !description) {
      return NextResponse.json(
        { error: "Tanggal dan keterangan jurnal wajib diisi" },
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

    const targetStatus: JournalStatus =
      status === "POSTED" ? "POSTED" : "DRAFT";

    const journal = await prisma.$transaction(async (tx) => {
      await assertFiscalPeriodOpen(tx, txDate);
      const entryNumber = await generateNextEntryNumber(tx, "JU", txDate);

      return tx.journalEntry.create({
        data: {
          entryNumber,
          date: txDate,
          description: String(description),
          reference: reference ? String(reference) : null,
          attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
          status: targetStatus,
          totalDebit: validation.totalDebit,
          totalCredit: validation.totalCredit,
          createdById: session.user.id,
          approvedById: targetStatus === "POSTED" ? session.user.id : null,
          lines: {
            create: lines.map((line: { accountId: string; description?: string; debit?: number; credit?: number }) => ({
              accountId: line.accountId,
              description: line.description || "",
              debit: Number(line.debit) || 0,
              credit: Number(line.credit) || 0,
            })),
          },
        },
        include: {
          lines: true,
        },
      });
    });

    return NextResponse.json({ journal });
  } catch (error) {
    if (error instanceof FiscalPeriodClosedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating journal:", error);
    return NextResponse.json(
      { error: "Gagal membuat jurnal" },
      { status: 500 }
    );
  }
}
