'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type LineItem = { code: string; name: string; amount: number };

export default function NeracaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState('2026-12-31');

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/balance-sheet?asOfDate=${asOfDate}`);
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
    fetchBalanceSheet();
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Laporan Posisi Keuangan (Neraca)</h1>
          <p className="text-sm text-muted-foreground">Posisi aset, liabilitas (hutang), dan ekuitas (modal) perusahaan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Date Filter & Status */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-end gap-3 w-full sm:w-auto">
              <div className="space-y-1 w-full sm:w-auto">
                <Label className="text-xs">Per Tanggal (As of Date)</Label>
                <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
              </div>
              <Button onClick={fetchBalanceSheet} disabled={loading} className="w-full sm:w-auto">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Terapkan Filter
              </Button>
            </div>

            {data && (
              <div>
                {data.isBalanced ? (
                  <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Neraca Seimbang (Balanced)
                  </div>
                ) : (
                  <div className="flex items-center text-sm font-medium text-red-700 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                    <AlertCircle className="w-4 h-4 mr-2 text-red-600" /> Peringatan: Tidak Seimbang
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Document */}
      <Card className="p-6 md:p-10 bg-white border shadow-sm print:border-none print:shadow-none">
        <div className="text-center mb-8 border-b pb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">{data?.companyName || 'PT JULLY TJINDRAWAN ROBOTIK'}</h2>
          <h3 className="text-lg font-bold text-gray-700 mt-1">LAPORAN POSISI KEUANGAN</h3>
          <p className="text-sm text-gray-500 mt-1">
            Per {format(new Date(asOfDate), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Memuat data neraca...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            
            {/* SISI KIRI: ASET */}
            <div className="space-y-6">
              <h4 className="font-bold text-gray-900 text-base border-b pb-2">ASET</h4>
              
              {/* Aset Lancar */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Aset Lancar</h5>
                <div className="space-y-1">
                  {data?.asetLancarList?.map((item: LineItem) => (
                    <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                      <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                      <span className="font-medium">{formatIDR(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-1.5 font-semibold border-t mt-2 px-2 bg-slate-50 rounded">
                  <span>Total Aset Lancar</span>
                  <span>{formatIDR(data?.totalAsetLancar || 0)}</span>
                </div>
              </div>

              {/* Aset Tetap */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Aset Tetap</h5>
                <div className="space-y-1">
                  {data?.asetTetapList?.map((item: LineItem) => (
                    <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                      <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                      <span className="font-medium">{formatIDR(item.amount)}</span>
                    </div>
                  ))}
                  {(!data?.asetTetapList || data.asetTetapList.length === 0) && (
                    <div className="py-1 text-muted-foreground italic px-2">Rp 0</div>
                  )}
                </div>
                <div className="flex justify-between py-1.5 font-semibold border-t mt-2 px-2 bg-slate-50 rounded">
                  <span>Total Aset Tetap</span>
                  <span>{formatIDR(data?.totalAsetTetap || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between py-3 mt-8 font-bold text-base border-y-2 border-gray-600 px-2 bg-slate-100 rounded">
                <span>TOTAL ASET</span>
                <span>{formatIDR(data?.totalAset || 0)}</span>
              </div>
            </div>

            {/* SISI KANAN: LIABILITAS & EKUITAS */}
            <div className="space-y-6">
              <h4 className="font-bold text-gray-900 text-base border-b pb-2">LIABILITAS DAN EKUITAS</h4>

              {/* Liabilitas */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Liabilitas (Kewajiban)</h5>
                <div className="space-y-1">
                  {data?.liabilitasLancarList?.map((item: LineItem) => (
                    <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                      <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                      <span className="font-medium">{formatIDR(item.amount)}</span>
                    </div>
                  ))}
                  {(!data?.liabilitasLancarList || data.liabilitasLancarList.length === 0) && (
                    <div className="py-1 text-muted-foreground italic px-2">Rp 0</div>
                  )}
                </div>
                <div className="flex justify-between py-1.5 font-semibold border-t mt-2 px-2 bg-slate-50 rounded">
                  <span>Total Liabilitas</span>
                  <span>{formatIDR(data?.totalLiabilitas || 0)}</span>
                </div>
              </div>

              {/* Ekuitas */}
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Ekuitas (Modal)</h5>
                <div className="space-y-1">
                  {data?.ekuitasList?.map((item: LineItem) => (
                    <div key={item.code} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                      <span>{item.name} <span className="text-xs text-muted-foreground">({item.code})</span></span>
                      <span className="font-medium">{formatIDR(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                    <span>Laba (Rugi) Periode Berjalan</span>
                    <span className={`font-medium ${data?.labaTahunBerjalan >= 0 ? '' : 'text-red-600'}`}>
                      {formatIDR(data?.labaTahunBerjalan || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between py-1.5 font-semibold border-t mt-2 px-2 bg-slate-50 rounded">
                  <span>Total Ekuitas</span>
                  <span>{formatIDR(data?.totalEkuitas || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between py-3 mt-8 font-bold text-base border-y-2 border-gray-600 px-2 bg-slate-100 rounded">
                <span>TOTAL LIABILITAS & EKUITAS</span>
                <span>{formatIDR(data?.totalPasiva || 0)}</span>
              </div>
            </div>

          </div>
        )}
      </Card>
    </div>
  );
}
