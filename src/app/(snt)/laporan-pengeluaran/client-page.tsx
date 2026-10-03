"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export function LaporanClientPage({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [isExporting, setIsExporting] = useState(false)

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
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pengeluaran_${startDate || 'All'}_${endDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const exportPDF = async () => {
    setIsExporting(true)
    try {
      let html2pdf: any; 
      try { html2pdf = require('html2pdf.js'); } catch (e) { html2pdf = (window as any).html2pdf; }
      
      if (!html2pdf) {
        alert("Modul PDF tidak tersedia, silakan gunakan fungsi Print browser (Ctrl+P)");
        window.print();
        return;
      }
      
      const element = document.getElementById('report-table');
      const opt = {
        margin: 10,
        filename: `Laporan_Pengeluaran_${startDate || 'All'}_${endDate || 'All'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsExporting(false)
    }
  }

  const totalAmount = initialData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Pengeluaran</h1>
          <p className="text-slate-500 mt-1">Laporan arus kas pengeluaran kegiatan berdasarkan item RAB.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" className="bg-white">
            Export CSV
          </Button>
          <Button onClick={exportPDF} disabled={isExporting} className="bg-slate-900 hover:bg-slate-800 text-white">
            {isExporting ? 'Memproses PDF...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <Card>
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
            <Button onClick={handleFilter}>Filter</Button>
            {(startDate || endDate) && (
              <Button variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); router.push('/laporan-pengeluaran'); }}>Reset</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" id="report-table">
            {/* Header for PDF only */}
            <div className="hidden print:block p-6">
              <h2 className="text-2xl font-bold text-center">LAPORAN PENGELUARAN KEGIATAN</h2>
              <p className="text-center text-sm mt-2">Periode: {startDate || 'Awal'} s/d {endDate || 'Akhir'}</p>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 border-b">
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
                      <td className="py-3 px-4">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-1 bg-slate-200 rounded-md">
                          {exp.rabItem?.category?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{exp.rabItem?.name || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 line-clamp-2" title={exp.description}>
                        {exp.description}
                      </td>
                      <td className="py-3 px-4">{exp.fasilitator ? exp.fasilitator.namaLengkap : 'Lainnya'}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(exp.amount)}</td>
                      <td className="py-3 px-4 text-center print:hidden">
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
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-right text-lg">Total Pengeluaran:</td>
                    <td className="py-4 px-4 text-right text-lg text-red-600">{formatCurrency(totalAmount)}</td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
