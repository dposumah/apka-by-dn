import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    kas: 50000000,
    piutang: 10000000,
    asetLancar: 60000000,
    asetTetap: 40000000,
    hutangUsaha: 20000000,
    liabilitas: 20000000,
    modal: 60000000,
    labaDitahan: 20000000,
    ekuitas: 80000000
  });
}
