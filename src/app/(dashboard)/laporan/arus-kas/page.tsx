'use client';
import { Card } from '@/components/ui/card';

export default function ArusKasPage() {
  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Laporan Arus Kas</h1>
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">APKA BY DN</h2>
          <h3 className="text-lg font-bold">LAPORAN ARUS KAS</h3>
          <p className="text-sm text-gray-500">Untuk Periode yang Berakhir 31 Desember 2024</p>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-700 mb-2">ARUS KAS DARI AKTIVITAS OPERASI</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Penerimaan dari Pelanggan</span><span>{formatIDR(50000000)}</span></div>
            <div className="flex justify-between py-1"><span className="pl-4">Pembayaran kepada Supplier</span><span>({formatIDR(20000000)})</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Arus Kas Bersih dari Aktivitas Operasi</span><span>{formatIDR(30000000)}</span></div>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-2">ARUS KAS DARI AKTIVITAS INVESTASI</h4>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Arus Kas Bersih dari Aktivitas Investasi</span><span>{formatIDR(0)}</span></div>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-2">ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Arus Kas Bersih dari Aktivitas Pendanaan</span><span>{formatIDR(0)}</span></div>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-b border-t border-gray-400">
            <span>KENAIKAN (PENURUNAN) KAS</span><span>{formatIDR(30000000)}</span>
          </div>
          <div className="flex justify-between py-2 text-md">
            <span>SALDO KAS AWAL PERIODE</span><span>{formatIDR(10000000)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg border-b-4 border-gray-600">
            <span>SALDO KAS AKHIR PERIODE</span><span>{formatIDR(40000000)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
