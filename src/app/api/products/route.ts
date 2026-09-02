import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    let whereClause: any = {};
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ]
      };
    }
    
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sku, name, description, category, type, unitOfMeasure, purchasePrice, sellingPrice, minStock, stockQuantity } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        category,
        type: type || 'GOODS',
        unitOfMeasure: unitOfMeasure || 'Pcs',
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        minStock: parseFloat(minStock) || 0,
        stockQuantity: parseFloat(stockQuantity) || 0,
        averageCost: parseFloat(purchasePrice) || 0,
      }
    });

    // If initial stock is > 0, create a stock movement
    if (newProduct.type === 'GOODS' && newProduct.stockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: newProduct.id,
          type: 'ADJUSTMENT',
          quantity: newProduct.stockQuantity,
          unitCost: newProduct.purchasePrice,
          totalCost: newProduct.stockQuantity * newProduct.purchasePrice,
          reference: 'INITIAL_STOCK',
          date: new Date(),
          notes: 'Initial stock entry'
        }
      });
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
