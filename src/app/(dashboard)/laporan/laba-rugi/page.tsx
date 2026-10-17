'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type LineItem = { code: string; name: string; amount: number };

export default function LabaRugiPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/income-statement?startDate=${startDate}&endDate=${endDate}`);
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
    fetchIncomeStatement();
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
          <h1 className="text-2xl font-bold">Laporan Laba Rugi</h1>
          <p className="text-sm text-muted-foreground">Kinerja pendapatan dan pengeluaran operasional perusahaan.</p>
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
            <Button onClick={fetchIncomeStatement} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Document */}
      <Card className="p-6 md:p-10 bg-white border shadow-sm print:border-none print:shadow-none">
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">{data?.companyName || 'PT JULLY TJINDRAWAN ROBOTIK'}</h2>
          <h3 className="text-lg font-bold text-gray-700 mt-1">LAPORAN LABA RUGI</h3>
          <p className="text-sm text-gray-500 mt-1">
            Periode: {format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} s/d {format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Memuat data laba rugi...</div>
        ) : (
          <div className="space-y-6 text-sm">
            {/* 1. PENDAPATAN */}
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 text-base">PENDAPATAN USAHA</h4>
              <div className="space-y-1">
                {data?.pendapatanList?.map((item: LineItem) => (
                  <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                    <span className="font-medium">{formatIDR(item.amount)}</span>
                  </div>
                ))}
                {(!data?.pendapatanList || data.pendapatanList.length === 0) && (
                  <div className="py-2 text-muted-foreground italic px-2">Tidak ada pendapatan pada periode ini.</div>
                )}
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 px-2 bg-slate-50 rounded">
                <span>Total Pendapatan Usaha</span>
                <span>{formatIDR(data?.totalPendapatan || 0)}</span>
              </div>
            </div>

            {/* 2. HPP */}
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 text-base">BEBAN POKOK PENDAPATAN (HPP)</h4>
              <div className="space-y-1">
                {data?.hppList?.map((item: LineItem) => (
                  <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                    <span className="font-medium">({formatIDR(item.amount)})</span>
                  </div>
                ))}
                {(!data?.hppList || data.hppList.length === 0) && (
                  <div className="py-2 text-muted-foreground italic px-2">Rp 0</div>
                )}
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 px-2 bg-slate-50 rounded">
                <span>Total Beban Pokok Pendapatan</span>
                <span>({formatIDR(data?.totalHpp || 0)})</span>
              </div>
            </div>

            {/* LABA KOTOR */}
            <div className="flex justify-between py-2.5 font-bold text-base border-y-2 border-gray-400 px-2 bg-blue-50/50">
              <span>LABA KOTOR (GROSS PROFIT)</span>
              <span>{formatIDR(data?.labaKotor || 0)}</span>
            </div>

            {/* 3. BEBAN OPERASIONAL */}
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 text-base">BEBAN OPERASIONAL KANTOR</h4>
              <div className="space-y-1">
                {data?.bebanOperasionalList?.map((item: LineItem) => (
                  <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                    <span className="font-medium">({formatIDR(item.amount)})</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 px-2 bg-slate-50 rounded">
                <span>Total Beban Operasional</span>
                <span>({formatIDR(data?.totalBebanOperasional || 0)})</span>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div className={`flex justify-between py-3 font-bold text-lg border-y-4 px-2 ${data?.labaBersih >= 0 ? 'bg-green-50 text-green-900 border-green-600' : 'bg-red-50 text-red-900 border-red-600'}`}>
              <span>LABA (RUGI) BERSIH PERIODE BERJALAN</span>
              <span>{formatIDR(data?.labaBersih || 0)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
