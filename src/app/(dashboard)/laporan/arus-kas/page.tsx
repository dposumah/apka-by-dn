'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ArusKasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const fetchCashFlow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Laporan Arus Kas</h1>
          <p className="text-sm text-muted-foreground">Arus kas masuk dan keluar dari aktivitas operasi, investasi, dan pendanaan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-1 w-full sm:w-auto">
              <Label className="text-xs">Dari Tanggal</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={fetchCashFlow} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Document */}
      <Card className="p-6 md:p-10 bg-white border shadow-sm print:border-none print:shadow-none">
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">{data?.companyName || 'PT JULLY TJINDRAWAN ROBOTIK'}</h2>
          <h3 className="text-lg font-bold text-gray-700 mt-1">LAPORAN ARUS KAS</h3>
          <p className="text-sm text-gray-500 mt-1">
            Periode: {format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} s/d {format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Memuat data arus kas...</div>
        ) : (
          <div className="space-y-6 text-sm">
            {/* 1. AKTIVITAS OPERASI */}
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 text-base">ARUS KAS DARI AKTIVITAS OPERASI</h4>
              <div className="space-y-1">
                <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                  <span>Penerimaan Kas Operasional (Kursus/Ekstra/Jasa)</span>
                  <span className="font-medium">{formatIDR(data?.operatingIn || 0)}</span>
                </div>
                <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                  <span>Pengeluaran Kas Operasional (Gaji, Transport, ATK, Listrik, dll)</span>
                  <span className="font-medium">({formatIDR(data?.operatingOut || 0)})</span>
                </div>
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 px-2 bg-slate-50 rounded">
                <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                <span className={data?.netOperating >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {formatIDR(data?.netOperating || 0)}
                </span>
              </div>
            </div>

            {/* 2. AKTIVITAS INVESTASI */}
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 text-base">ARUS KAS DARI AKTIVITAS INVESTASI</h4>
              <div className="space-y-1">
                <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                  <span>Pembelian Inventaris / Aset Tetap Kantor</span>
                  <span className="font-medium">({formatIDR(data?.investingOut || 0)})</span>
                </div>
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 px-2 bg-slate-50 rounded">
                <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                <span>({formatIDR(data?.investingOut || 0)})</span>
              </div>
            </div>

            {/* 3. AKTIVITAS PENDANAAN */}
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 text-base">ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
              <div className="space-y-1">
                <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                  <span>Penerimaan Setoran Modal Pemilik</span>
                  <span className="font-medium">{formatIDR(data?.financingIn || 0)}</span>
                </div>
                <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                  <span>Pengeluaran Pembayaran Kartu Kredit / Pemilik</span>
                  <span className="font-medium">({formatIDR(data?.financingOut || 0)})</span>
                </div>
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 px-2 bg-slate-50 rounded">
                <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                <span className={data?.netFinancing >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {formatIDR(data?.netFinancing || 0)}
                </span>
              </div>
            </div>

            {/* KENAIKAN/PENURUNAN KAS */}
            <div className="flex justify-between py-2.5 font-bold text-base border-y-2 border-gray-400 px-2 bg-blue-50/50">
              <span>KENAIKAN (PENURUNAN) BERSIH KAS</span>
              <span className={data?.netChange >= 0 ? 'text-green-700' : 'text-red-700'}>
                {formatIDR(data?.netChange || 0)}
              </span>
            </div>

            {/* SALDO AWAL */}
            <div className="flex justify-between py-2 px-2 bg-slate-50 rounded">
              <span className="font-medium">SALDO KAS & BANK AWAL PERIODE</span>
              <span className="font-bold">{formatIDR(data?.openingCash || 0)}</span>
            </div>

            {/* SALDO AKHIR */}
            <div className="flex justify-between py-3 font-bold text-lg border-y-4 border-gray-600 px-2 bg-slate-100 rounded">
              <span>SALDO KAS & BANK AKHIR PERIODE</span>
              <span className="text-blue-900">{formatIDR(data?.closingCash || 0)}</span>
            </div>

          </div>
        )}
      </Card>
    </div>
  );
}
