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

    if (journal.status !== "DRAFT") {
      return NextResponse.json({ error: "Hanya jurnal DRAFT yang dapat diposting" }, { status: 400 });
    }

    if (journal.totalDebit !== journal.totalCredit) {
      return NextResponse.json({ error: "Debit dan Kredit tidak seimbang" }, { status: 400 });
    }

    // In a real application, you would get the user ID from the session here
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;

    const updated = await prisma.journalEntry.update({
      where: { id: params.id },
      data: {
        status: "POSTED",
        // approvedById: userId
      },
    });

    return NextResponse.json({ journal: updated });
  } catch (error) {
    console.error("Error posting journal:", error);
    return NextResponse.json({ error: "Gagal memposting jurnal" }, { status: 500 });
  }
}
