import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
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
    const body = await request.json();
    const { date, description, reference, status, lines } = body;

    // Generate Entry Number JU-YYYY-NNNN
    const year = new Date(date).getFullYear();
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
    const entryNumber = `JU-${year}-${String(count + 1).padStart(4, "0")}`;

    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    // Validation
    if (status === "POSTED" && totalDebit !== totalCredit) {
      return NextResponse.json(
        { error: "Debit dan Kredit tidak seimbang" },
        { status: 400 }
      );
    }

    const journal = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(date),
        description,
        reference,
        status: status || "DRAFT",
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
      include: {
        lines: true,
      },
    });

    return NextResponse.json({ journal });
  } catch (error) {
    console.error("Error creating journal:", error);
    return NextResponse.json(
      { error: "Gagal membuat jurnal" },
      { status: 500 }
    );
  }
}
