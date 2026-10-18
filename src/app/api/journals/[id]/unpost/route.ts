import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const journal = await prisma.journalEntry.findFirst({
      where: {
        OR: [{ id }, { entryNumber: id }],
      },
    });

    if (!journal) {
      return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
    }

    if (journal.status !== "POSTED") {
      return NextResponse.json(
        { error: "Hanya jurnal berstatus POSTED yang dapat dikembalikan ke status Draft" },
        { status: 400 }
      );
    }

    const updated = await prisma.journalEntry.update({
      where: { id: journal.id },
      data: {
        status: "DRAFT",
      },
    });

    return NextResponse.json({ success: true, journal: updated });
  } catch (error) {
    console.error("Error unposting journal:", error);
    return NextResponse.json(
      { error: "Gagal mengembalikan jurnal ke status Draft" },
      { status: 500 }
    );
  }
}
