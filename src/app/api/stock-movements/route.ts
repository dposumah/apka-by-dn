import { NextResponse } from 'next/server';
import { MovementType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

const VALID_MOVEMENT_TYPES = new Set<MovementType>(['IN', 'OUT', 'ADJUSTMENT']);

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: {
      productId?: string;
      date?: { gte: Date; lte: Date };
    } = {};
    if (productId) whereClause.productId = productId;

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: { product: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { productId, type, quantity, unitCost, reference, date, notes } = body;

    const parsedQty = parseFloat(quantity);
    const parsedCost = parseFloat(unitCost) || 0;

    if (
      !productId ||
      !type ||
      !VALID_MOVEMENT_TYPES.has(type as MovementType) ||
      isNaN(parsedQty) ||
      parsedQty <= 0
    ) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');

      let newStock = product.stockQuantity;
      let newAverageCost = product.averageCost;

      if (type === 'IN' || (type === 'ADJUSTMENT' && parsedQty > 0)) {
        const totalValueBefore = newStock * newAverageCost;
        const valueAdded = parsedQty * parsedCost;
        newStock += parsedQty;
        newAverageCost = newStock > 0 ? (totalValueBefore + valueAdded) / newStock : parsedCost;
      }

      if (type === 'OUT') {
        newStock -= parsedQty;
        if (newStock < 0) throw new Error('Insufficient stock');
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type: type as MovementType,
          quantity: parsedQty,
          unitCost: parsedCost,
          totalCost: parsedQty * parsedCost,
          reference,
          date: new Date(date || new Date()),
          notes,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: newStock,
          averageCost: newAverageCost,
        },
      });

      return movement;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating stock movement:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
