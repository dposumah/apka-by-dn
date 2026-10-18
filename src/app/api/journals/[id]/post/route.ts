import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const journal = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!journal) {
      return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
    }

    if (journal.status !== "DRAFT") {
      return NextResponse.json({ error: "Hanya jurnal DRAFT yang dapat diposting" }, { status: 400 });
    }

    if (journal.totalDebit !== journal.totalCredit) {
      return NextResponse.json({ error: "Debit dan Kredit tidak seimbang" }, { status: 400 });
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: "POSTED",
      },
    });

    return NextResponse.json({ journal: updated });
  } catch (error) {
    console.error("Error posting journal:", error);
    return NextResponse.json({ error: "Gagal memposting jurnal" }, { status: 500 });
  }
}
