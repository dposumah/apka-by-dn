'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NeracaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/balance-sheet?asOfDate=2024-12-31')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  if (loading) return <div className="p-6">Memuat data...</div>;

  const totalAset = (data?.asetLancar || 0) + (data?.asetTetap || 0);
  const totalLiabilitas = data?.liabilitas || 0;
  const totalEkuitas = data?.ekuitas || 0;
  const totalPasiva = totalLiabilitas + totalEkuitas;
  const isBalanced = totalAset === totalPasiva;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Posisi Keuangan</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Cetak</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
        </div>
      </div>
      
      {isBalanced ? (
        <div className="mb-4 flex items-center text-green-600 bg-green-50 p-3 rounded"><CheckCircle2 className="mr-2" /> Neraca Seimbang</div>
      ) : (
        <div className="mb-4 flex items-center text-red-600 bg-red-50 p-3 rounded"><AlertCircle className="mr-2" /> Peringatan: Neraca Tidak Seimbang</div>
      )}

      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">APKA BY DN</h2>
          <h3 className="text-lg font-bold">LAPORAN POSISI KEUANGAN</h3>
          <p className="text-sm text-gray-500">Per 31 Desember 2024</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="font-bold text-lg border-b mb-4 pb-2">ASET</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-gray-700">Aset Lancar</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Kas dan Setara Kas</span><span>{formatIDR(data?.kas || 0)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Piutang Usaha</span><span>{formatIDR(data?.piutang || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Aset Lancar</span><span>{formatIDR(data?.asetLancar || 0)}</span></div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700">Aset Tetap</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Aset Tetap Netto</span><span>{formatIDR(data?.asetTetap || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Aset Tetap</span><span>{formatIDR(data?.asetTetap || 0)}</span></div>
              </div>
            </div>
            <div className="flex justify-between py-3 mt-6 font-bold text-lg border-t-2 border-b-4 border-gray-600">
              <span>TOTAL ASET</span><span>{formatIDR(totalAset)}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg border-b mb-4 pb-2">LIABILITAS DAN EKUITAS</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-gray-700">Liabilitas</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Hutang Usaha</span><span>{formatIDR(data?.hutangUsaha || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Liabilitas</span><span>{formatIDR(totalLiabilitas)}</span></div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700">Ekuitas</h5>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Modal</span><span>{formatIDR(data?.modal || 0)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="pl-4">Laba Ditahan</span><span>{formatIDR(data?.labaDitahan || 0)}</span></div>
                <div className="flex justify-between py-1 font-semibold border-t mt-1"><span>Total Ekuitas</span><span>{formatIDR(totalEkuitas)}</span></div>
              </div>
            </div>
            <div className="flex justify-between py-3 mt-6 font-bold text-lg border-t-2 border-b-4 border-gray-600">
              <span>TOTAL LIABILITAS DAN EKUITAS</span><span>{formatIDR(totalPasiva)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
