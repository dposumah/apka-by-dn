"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export function LaporanClientPage({ initialData, rabData }: { initialData: any[], rabData: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [narasi, setNarasi] = useState("Laporan ini menyajikan ringkasan pelaksanaan anggaran (RAB) dan rincian pengeluaran lapangan. Realisasi penggunaan dana sejauh ini telah dicatat dan dilampirkan sesuai dengan bukti transaksi yang sah.")
  

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    router.push(`/laporan-pengeluaran?${params.toString()}`)
  }

  const exportCSV = () => {
    if (!initialData.length) return alert('Tidak ada data untuk diexport');
    
    const headers = ['Tanggal', 'Kategori RAB', 'Item RAB', 'Deskripsi', 'Nominal', 'Penerima', 'Status', 'Bukti Transfer'];
    
    const rows = initialData.map(exp => {
      const date = new Date(exp.date).toLocaleDateString('id-ID');
      const cat = exp.rabItem?.category?.name || '-';
      const item = exp.rabItem?.name || '-';
      const desc = (exp.description || '').replace(/,/g, ' ');
      const amount = exp.amount;
      const penerima = exp.fasilitator ? exp.fasilitator.namaLengkap : 'Lainnya';
      const status = exp.status;
      const bukti = exp.paymentReceiptUrl || exp.receiptUrl || '';
      
      return [date, cat, item, desc, amount, penerima, status, bukti].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pengeluaran_${startDate || 'All'}_${endDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const exportPDF = () => {
    window.print();
  }

  const totalAmount = initialData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Pengeluaran</h1>
          <p className="text-slate-500 mt-1">Laporan arus kas pengeluaran kegiatan berdasarkan item RAB.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" className="bg-white">
            Export CSV Transaksi
          </Button>
          <Button onClick={exportPDF} className="bg-slate-900 hover:bg-slate-800 text-white">
            Print Laporan Lengkap (PDF)
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleFilter}>Filter Transaksi</Button>
            {(startDate || endDate) && (
              <Button variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); router.push('/laporan-pengeluaran'); }}>Reset</Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      <Card className="print:hidden mb-6">
        <CardHeader className="bg-slate-50 border-b py-3">
          <CardTitle className="text-sm">Narasi / Ringkasan Laporan (Tampil di Print)</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <textarea 
            className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[100px]" 
            value={narasi} 
            onChange={(e) => setNarasi(e.target.value)}
            placeholder="Ketik narasi laporan di sini..."
          />
        </CardContent>
      </Card>

      <div id="report-container" className="space-y-8 bg-white print:p-4">
        {/* Header for PDF only */}
        <div className="hidden print:block mb-6">
          <img src="/kop-maleo.png" alt="Kop Yayasan Maleo" className="w-full object-contain mb-4 border-b-4 border-slate-800 pb-2" />
          <h2 className="text-xl font-bold text-center uppercase mt-4">Laporan Pelaksanaan Anggaran (RAB) & Pengeluaran</h2>
          <p className="text-center text-sm mt-1">{rabData?.project?.name || 'Proyek SNT'}</p>
          {(startDate || endDate) ? <p className="text-center text-sm mt-1">Periode: {startDate || 'Awal'} s/d {endDate || 'Akhir'}</p> : <p className="text-center text-sm mt-1">Periode: Keseluruhan</p>}
          
          <div className="mt-6 mb-4 text-justify text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{narasi}</p>
          </div>
        </div>

        {/* SECTION 1: RAB Realisasi */}
        <Card className="shadow-sm print:shadow-none print:border-none">
          <CardHeader className="print:py-2">
            <CardTitle className="text-xl">A. Ringkasan Realisasi RAB</CardTitle>
          </CardHeader>
          <CardContent className="p-0 print:p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 border-b border-t print:bg-slate-200">
                  <tr>
                    <th className="py-2 px-4">Kategori & Item</th>
                    <th className="py-2 px-4 text-right w-32">Anggaran (Rp)</th>
                    <th className="py-2 px-4 text-right w-32">Realisasi (Rp)</th>
                    <th className="py-2 px-4 text-center w-24">% Pakai</th>
                    <th className="py-2 px-4 text-right w-32">Sisa (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rabData?.categories?.map((cat: any) => (
                    <React.Fragment key={cat.id}>
                      <tr className="bg-slate-50 print:bg-slate-50 font-bold">
                        <td colSpan={5} className="py-2 px-4">{cat.name}</td>
                      </tr>
                      {cat.items.map((item: any) => {
                        const sisa = item.totalBudget - item.realized;
                        const persen = item.totalBudget > 0 ? (item.realized / item.totalBudget) * 100 : 0;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-4 pl-8 text-slate-700">{item.code} - {item.name}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(item.totalBudget)}</td>
                            <td className="py-2 px-4 text-right text-blue-600">{formatCurrency(item.realized)}</td>
                            <td className="py-2 px-4 text-center">
                              <Badge variant={persen > 100 ? "destructive" : persen > 80 ? "default" : "secondary"}>
                                {persen.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="py-2 px-4 text-right">{formatCurrency(sisa)}</td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-200">
                  <tr>
                    <td className="py-3 px-4 text-right">TOTAL KESELURUHAN:</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(rabData?.totalBudget || 0)}</td>
                    <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(rabData?.totalRealized || 0)}</td>
                    <td className="py-3 px-4 text-center">
                      {rabData?.totalBudget > 0 ? ((rabData.totalRealized / rabData.totalBudget) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatCurrency((rabData?.totalBudget || 0) - (rabData?.totalRealized || 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Transaksi Pengeluaran */}
        <Card className="shadow-sm print:shadow-none print:border-none print:mt-8 print:break-before-page">
          <CardHeader className="print:py-2">
            <CardTitle className="text-xl">B. Rincian Transaksi Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="p-0 print:p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 border-b border-t print:bg-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-28">Tanggal</th>
                    <th className="py-3 px-4">Kategori RAB</th>
                    <th className="py-3 px-4">Item RAB</th>
                    <th className="py-3 px-4 w-64">Deskripsi</th>
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center print:hidden">Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {initialData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada pengeluaran pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    initialData.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 px-4">
                          <span className="text-[11px] font-semibold px-2 py-1 bg-slate-200 rounded-md whitespace-nowrap">
                            {exp.rabItem?.category?.name || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-4">{exp.rabItem?.name || '-'}</td>
                        <td className="py-2 px-4 text-slate-600" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-2 px-4">{exp.fasilitator ? exp.fasilitator.namaLengkap : 'Lainnya'}</td>
                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(exp.amount)}</td>
                        <td className="py-2 px-4 text-center print:hidden">
                          {(exp.paymentReceiptUrl || exp.receiptUrl) ? (
                            <a href={exp.paymentReceiptUrl || exp.receiptUrl} target="_blank" className="text-blue-600 text-xs hover:underline">
                              Lihat
                            </a>
                          ) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {initialData.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold print:bg-slate-100">
                    <tr>
                      <td colSpan={5} className="py-4 px-4 text-right text-base">Total Rincian Transaksi:</td>
                      <td className="py-4 px-4 text-right text-base text-red-600">{formatCurrency(totalAmount)}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
