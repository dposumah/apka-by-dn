import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
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

    if (existing.status === "VOID") {
      return NextResponse.json(
        { error: "Jurnal berstatus VOID tidak dapat diedit" },
        { status: 400 }
      );
    }

    if (!lines || lines.length < 2) {
      return NextResponse.json(
        { error: "Jurnal harus memiliki minimal 2 baris akun" },
        { status: 400 }
      );
    }

    const totalDebit = lines.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: "Total Debit dan Kredit harus seimbang (balance)" },
        { status: 400 }
      );
    }

    // Delete existing lines
    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: existing.id },
    });

    const updated = await prisma.journalEntry.update({
      where: { id: existing.id },
      data: {
        date: new Date(date),
        description,
        reference: reference || null,
        totalDebit,
        totalCredit,
        ...(status && ["DRAFT", "POSTED"].includes(status) ? { status } : {}),
        lines: {
          create: lines.map((line: any) => ({
            accountId: line.accountId,
            description: line.description || "",
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json({ journal: updated });
  } catch (error) {
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

    await prisma.journalEntry.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal:", error);
    return NextResponse.json(
      { error: "Gagal menghapus jurnal" },
      { status: 500 }
    );
  }
}
