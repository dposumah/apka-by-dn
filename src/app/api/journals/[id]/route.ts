import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const journal = await prisma.journalEntry.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { date, description, reference, lines } = body;

    const existing = await prisma.journalEntry.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Hanya jurnal berstatus DRAFT yang dapat diedit" },
        { status: 400 }
      );
    }

    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    // Delete existing lines
    await prisma.journalEntryLine.deleteMany({
      where: { journalEntryId: params.id },
    });

    const updated = await prisma.journalEntry.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        description,
        reference,
        totalDebit,
        totalCredit,
        lines: {
          create: lines.map((line: any) => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
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
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.journalEntry.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Hanya jurnal berstatus DRAFT yang dapat dihapus" },
        { status: 400 }
      );
    }

    await prisma.journalEntry.delete({
      where: { id: params.id },
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
