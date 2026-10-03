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

  const generateAutoNarasi = () => {
    if (initialData.length === 0) return "Belum ada pengeluaran pada periode ini.";
    const highestItem = initialData.reduce((acc, curr) => {
      return curr.amount > acc.amount ? curr : acc;
    }, initialData[0]);
    return `Pada periode laporan ini, terdapat total pengeluaran sebesar ${formatCurrency(totalAmount)} yang berasal dari ${initialData.length} transaksi. Pengeluaran tertinggi dialokasikan untuk item RAB "${highestItem?.rabItem?.name || '-'}" sebesar ${formatCurrency(highestItem.amount)}. Realisasi penggunaan dana sejauh ini telah dicatat dan dilampirkan sesuai dengan bukti transaksi yang sah.`;
  };

  const generateAutoUpcoming = () => {
    let estHonor = 0;
    let estTransport = 0;
    
    if (rabData && rabData.categories) {
      rabData.categories.forEach((cat: any) => {
        cat.items.forEach((item: any) => {
          const remaining = item.totalBudget - item.realized;
          if (remaining > 0) {
            const nameLower = item.name.toLowerCase();
            if (nameLower.includes('fasilitator koding') || nameLower.includes('honor')) {
              estHonor += remaining;
            }
            if (nameLower.includes('sewa rumah') || nameLower.includes('transport')) {
              estTransport += remaining;
            }
          }
        });
      });
    }
    
    return `Perkiraan Pengeluaran Mendatang:
- Honorarium Fasilitator (Estimasi Maksimal Sisa Anggaran): ${formatCurrency(estHonor)}
- Bantuan Transport / Sewa Rumah Fasilitator (Estimasi Maksimal Sisa Anggaran): ${formatCurrency(estTransport)}
- Lain-lain: Rp 0`;
  };

  const [narasi, setNarasi] = useState(generateAutoNarasi());
  const [upcoming, setUpcoming] = useState(generateAutoUpcoming());


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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:hidden">
        <Card>
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Narasi / Ringkasan Laporan</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setNarasi(generateAutoNarasi())} className="h-7 text-xs">Auto Generate</Button>
          </CardHeader>
          <CardContent className="p-4">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px]" 
              value={narasi} 
              onChange={(e) => setNarasi(e.target.value)}
              placeholder="Ketik narasi laporan di sini..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Perkiraan Pengeluaran Mendatang</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setUpcoming(generateAutoUpcoming())} className="h-7 text-xs">Auto Generate</Button>
          </CardHeader>
          <CardContent className="p-4">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px]" 
              value={upcoming} 
              onChange={(e) => setUpcoming(e.target.value)}
              placeholder="Ketik perkiraan pengeluaran mendatang..."
            />
          </CardContent>
        </Card>
      </div>

      <div id="report-container" className="space-y-8 bg-white print:p-4">
        {/* Header for PDF only */}
        <div className="hidden print:block mb-6">
          <img src="/kop-maleo.png" alt="Kop Yayasan Maleo" className="w-full object-contain mb-4 border-b-4 border-slate-800 pb-2" />
          <h2 className="text-xl font-bold text-center uppercase mt-4">Laporan Pelaksanaan Anggaran (RAB) & Pengeluaran</h2>
          <p className="text-center text-sm mt-1">{rabData?.project?.name === 'Proyek SNT' || !rabData?.project?.name ? 'Program KKA Sekolah Nasional Terintegrasi (SNT) Tahun 2026' : rabData.project.name}</p>
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
        
        {/* SECTION 3: Perkiraan Pengeluaran Mendatang (Print Only) */}
        <div className="hidden print:block mt-8">
          <div className="border-t-2 border-slate-800 pt-4 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{upcoming}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
