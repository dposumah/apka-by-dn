import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause = status ? { status } : {};

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { customer: true },
      orderBy: { date: 'desc' }
    });

    // Map the response to flatten customerName for easier frontend use
    const mapped = invoices.map((inv: any) => ({
      ...inv,
      customerName: inv.customer?.nama || 'Unknown'
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Generate Invoice Number INV-YYYY-NNNN
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: { startsWith: `INV-${year}-` }
      }
    });
    const number = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        number,
        customerId: data.customerId,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        subtotal: data.subtotal,
        ppnTotal: data.ppnTotal,
        total: data.total,
        
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

