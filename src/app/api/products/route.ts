import { NextResponse } from 'next/server';
import { ProductType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    const whereClause: {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; sku?: { contains: string; mode: 'insensitive' } }>;
      type?: ProductType;
    } = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && type !== 'ALL' && (type === 'GOODS' || type === 'SERVICE')) {
      whereClause.type = type;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { sku, name, description, category, type, unitOfMeasure, purchasePrice, sellingPrice, minStock, stockQuantity } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku,
          name,
          description,
          category,
          type: (type as ProductType) || 'GOODS',
          unitOfMeasure: unitOfMeasure || 'Pcs',
          purchasePrice: parseFloat(purchasePrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          minStock: parseFloat(minStock) || 0,
          stockQuantity: parseFloat(stockQuantity) || 0,
          averageCost: parseFloat(purchasePrice) || 0,
        },
      });

      if (product.type === 'GOODS' && product.stockQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: 'ADJUSTMENT',
            quantity: product.stockQuantity,
            unitCost: product.purchasePrice,
            totalCost: product.stockQuantity * product.purchasePrice,
            reference: 'INITIAL_STOCK',
            date: new Date(),
            notes: 'Initial stock entry',
          },
        });
      }

      return product;
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    const errObj = error as { code?: string };
    if (errObj?.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
