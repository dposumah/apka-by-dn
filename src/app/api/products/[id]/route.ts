import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACCOUNTING_READ_ROLES, ACCOUNTING_WRITE_ROLES, requireApiAuth } from '@/lib/auth-check';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_READ_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { name, description, category, unitOfMeasure, purchasePrice, sellingPrice, minStock, isActive } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        category,
        unitOfMeasure,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        minStock: minStock !== undefined ? parseFloat(minStock) : undefined,
        isActive,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireApiAuth(ACCOUNTING_WRITE_ROLES);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
