'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, RefreshCw, ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function LaporanKkaSntPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/kka-snt');
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
    fetchReport();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const absorptionPct = data?.totalRevenue > 0
    ? Math.min(100, Math.round((data.totalExpense / data.totalRevenue) * 100))
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Laporan Realisasi & Profitabilitas KKA SNT 2026</h1>
          <p className="text-sm text-muted-foreground">
            Pemantauan alokasi pendapatan termin vs realisasi pengeluaran riil lapangan modul SNT.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
          </Button>
          <Button variant="default" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Cetak / PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pagu Anggaran RAB */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-muted-foreground">Pagu Anggaran RAB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-800">{formatIDR(data?.totalBudget || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total alokasi pagu SNT 6 lokasi</p>
          </CardContent>
        </Card>

        {/* Pendapatan Termin Diterima */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-emerald-800 flex items-center justify-between">
              Pendapatan Masuk (Termin)
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">{formatIDR(data?.totalRevenue || 0)}</div>
            <p className="text-xs text-emerald-600 mt-1">Akun 400.10.105 (Termin 1)</p>
          </CardContent>
        </Card>

        {/* Realisasi Pengeluaran */}
        <Card className="border-rose-200 bg-rose-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-rose-800 flex items-center justify-between">
              Realisasi Pengeluaran
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-rose-700">{formatIDR(data?.totalExpense || 0)}</div>
            <p className="text-xs text-rose-600 mt-1">{data?.expenses?.length || 0} transaksi disetujui</p>
          </CardContent>
        </Card>

        {/* Sisa Kas Proyek */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-semibold text-blue-800 flex items-center justify-between">
              Sisa Kas Proyek (Surplus)
              <Wallet className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700">{formatIDR(data?.netProfit || 0)}</div>
            <p className="text-xs text-blue-600 mt-1">Sisa kas dana termin berjalan</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar Penyerapan */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2 text-sm font-medium">
            <span>Persentase Penyerapan Dana Termin 1:</span>
            <span className="font-bold text-slate-800">{absorptionPct}% ({formatIDR(data?.totalExpense || 0)} / {formatIDR(data?.totalRevenue || 0)})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${absorptionPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rincian Realisasi per Kategori RAB */}
      <Card>
        <CardHeader className="border-b bg-slate-50/60 pb-3">
          <CardTitle className="text-base font-bold">Rincian Realisasi per Kategori RAB</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y text-sm">
            {data?.categories?.map((cat: any, idx: number) => {
              const pct = cat.budget > 0 ? Math.round((cat.realized / cat.budget) * 100) : 0;
              return (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Pagu RAB: {formatIDR(cat.budget)}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-slate-800">{formatIDR(cat.realized)}</div>
                      <div className="text-xs text-muted-foreground">Terserap: {pct}%</div>
                    </div>
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Pengeluaran Riil Lapangan (44 Transaksi) */}
      <Card>
        <CardHeader className="border-b bg-slate-50/60 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Daftar Pengeluaran Riil Modul SNT ({data?.expenses?.length || 0} Transaksi)</CardTitle>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Terintegrasi ke Jurnal
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan Pengeluaran</th>
                  <th className="px-4 py-3">Kategori RAB</th>
                  <th className="px-4 py-3">Penerima / Fasilitator</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.expenses?.map((exp: any, i: number) => (
                  <tr key={exp.id || i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {exp.date ? format(new Date(exp.date), 'dd MMM yyyy', { locale: id }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{exp.description}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{exp.categoryName}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{exp.fasilitatorName || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                      {formatIDR(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 font-bold border-t">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">Total Realisasi Pengeluaran:</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-bold whitespace-nowrap">
                    {formatIDR(data?.totalExpense || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
