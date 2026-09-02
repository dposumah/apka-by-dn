import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const bills = await prisma.bill.findMany({
      include: { supplier: true },
      orderBy: { date: 'desc' }
    });

    const mapped = bills.map((b: any) => ({
      ...b,
      supplierName: b.supplier?.nama || 'Unknown'
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const year = new Date().getFullYear();
    const count = await prisma.bill.count({
      where: {
        billNumber: { startsWith: `BIL-${year}-` }
      }
    });
    const number = `BIL-${year}-${String(count + 1).padStart(4, '0')}`;

    const bill = await prisma.bill.create({
      data: {
        number,
        supplierId: data.supplierId,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        subtotal: data.subtotal,
        ppnTotal: data.ppnTotal,
        total: data.total,
        status: data.status || 'DRAFT',
        notes: data.notes,
        lines: {
          create: data.items.map((item: any) => ({
            description: item.description,
            qty: item.qty,
            price: item.price,
            hasPpn: item.hasPpn,
            total: item.qty * item.price
          }))
        }
      }
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

