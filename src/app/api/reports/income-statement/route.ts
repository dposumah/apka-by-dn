import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    pendapatan: 100000000,
    hpp: 40000000,
    bebanOperasional: 20000000,
    labaBersih: 40000000
  });
}
