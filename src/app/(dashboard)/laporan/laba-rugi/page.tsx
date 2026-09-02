'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';

export default function LabaRugiPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/income-statement?startDate=2024-01-01&endDate=2024-12-31')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  if (loading) return <div className="p-6">Memuat data...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Laba Rugi</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Cetak</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
        </div>
      </div>
      
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">APKA BY DN</h2>
          <h3 className="text-lg font-bold">LAPORAN LABA RUGI</h3>
          <p className="text-sm text-gray-500">Untuk Periode yang Berakhir 31 Desember 2024</p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-700 mb-2">PENDAPATAN</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Penjualan Barang</span><span>{formatIDR(data?.pendapatan || 0)}</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Total Pendapatan</span><span>{formatIDR(data?.pendapatan || 0)}</span></div>
          </div>

          <div>
            <h4 className="font-bold text-gray-700 mb-2">BEBAN POKOK PENJUALAN</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Harga Pokok Penjualan</span><span>({formatIDR(data?.hpp || 0)})</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Total Beban Pokok Penjualan</span><span>({formatIDR(data?.hpp || 0)})</span></div>
          </div>

          <div className="flex justify-between py-2 font-bold text-lg border-b border-t border-gray-400">
            <span>LABA KOTOR</span><span>{formatIDR((data?.pendapatan || 0) - (data?.hpp || 0))}</span>
          </div>

          <div>
            <h4 className="font-bold text-gray-700 mb-2">BEBAN OPERASIONAL</h4>
            <div className="flex justify-between py-1"><span className="pl-4">Beban Operasional</span><span>{formatIDR(data?.bebanOperasional || 0)}</span></div>
            <div className="flex justify-between py-2 font-bold border-t mt-2"><span>Total Beban Operasional</span><span>({formatIDR(data?.bebanOperasional || 0)})</span></div>
          </div>

          <div className="flex justify-between py-2 font-bold text-lg border-b-4 border-t border-gray-600">
            <span>LABA BERSIH</span><span>{formatIDR(data?.labaBersih || 0)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
