'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { DeleteExpenseButton } from './DeleteExpenseButton'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { generateKwitansiExpense } from '@/app/actions/rekap'

export function RabDashboardClient({ data, expenses, pendingWeekly, pendingHonor }: any) {
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  
  const [printInvoice, setPrintInvoice] = useState(false)
  const [printKwitansi, setPrintKwitansi] = useState(false)
  const [selectedKop, setSelectedKop] = useState<'maleo' | 'robotic'>('maleo')
  
  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")

  const openPrintModal = (expense: any) => {
    setSelectedExpense(expense)
    setPrintInvoice(false)
    setPrintKwitansi(false)
    setInputNoUrut("")
    
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setInputTanggal(localISOTime)
    
    setShowPrintModal(true)
  }

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  useEffect(() => {
    import('html2pdf.js').then(m => { (window as any).html2pdf = m.default || m; }).catch(e => console.error(e));
  }, []);

  const getInvoiceHtml = (expense: any, kopType: string) => {
    const kopImage = kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png';
    return 
      <div style="padding: 40px; font-family: sans-serif; page-break-after: always; width: 100%; box-sizing: border-box;">
        <div style="margin-bottom: 30px;">
          <img src=" + kopImage + " style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
        </div>
        <div style="text-align: center; margin-bottom: 40px;">
          <h2>INVOICE PENGELUARAN LAPANGAN</h2>
          <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p><strong>Item RAB:</strong>  + expense.rabItem.name + </p>
             + (expense.fasilitator ? <p><strong>Nama Fasilitator:</strong>  + expense.fasilitator.namaLengkap + </p> : '') + 
            <p><strong>Tanggal Diajukan:</strong>  + new Date(expense.createdAt).toLocaleDateString('id-ID') + </p>
            <p><strong>Status:</strong>  + expense.status + </p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Deskripsi</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8fafc;">Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: left;"> + expense.description + </td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">Rp  + expense.amount.toLocaleString('id-ID') + </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">TOTAL:</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Rp  + expense.amount.toLocaleString('id-ID') + </td>
            </tr>
          </tbody>
        </table>
      </div>
    ;
  };

  const getKwitansiHtml = (expense: any, record: any) => {
    return 
      <div style="padding: 40px; font-family: sans-serif; page-break-after: always; width: 100%; box-sizing: border-box;">
        <div style="margin-bottom: 30px;">
          <img src="/kop-maleo.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
        </div>
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h2 style="font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">KWITANSI</h2>
          <p style="margin: 5px 0 0 0;">No:  + record.noKwitansi + </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="width: 30%; padding: 10px 0;"><strong>Telah terima dari</strong></td>
            <td style="width: 5%; text-align: center;">:</td>
            <td style="width: 65%; padding: 10px 0;">Yayasan Maleo Talenta Cendekia</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;"><strong>Uang Sejumlah</strong></td>
            <td style="text-align: center;">:</td>
            <td style="padding: 10px 0; background-color: #f3f4f6; font-style: italic;">#  + terbilangRupiah(expense.amount) +  Rupiah #</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top;"><strong>Untuk Pembayaran</strong></td>
            <td style="text-align: center; vertical-align: top;">:</td>
            <td style="padding: 10px 0;"> + expense.description +  -  + expense.rabItem.name + </td>
          </tr>
        </table>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px;">
          <div style="background-color: #f3f4f6; padding: 15px 30px; border: 1px solid #d1d5db; border-radius: 8px;">
            <p style="margin: 0; font-size: 20px; font-weight: bold;">Rp  + expense.amount.toLocaleString('id-ID') + </p>
          </div>
          <div style="text-align: center; width: 250px;">
            <p style="margin-bottom: 60px;">Jakarta,  + new Date(record.tanggal).toLocaleDateString('id-ID') + </p>
            <p style="margin: 0; border-top: 1px solid #000; padding-top: 10px;"><strong> + (expense.fasilitator ? expense.fasilitator.namaLengkap : 'Penerima') + </strong></p>
          </div>
        </div>
      </div>
    ;
  };

  const handlePrint = async () => {
    if (!selectedExpense) return;
    setIsGeneratingPdf(true);
    try {
      let htmlString = "";
      if (printInvoice) {
        htmlString += getInvoiceHtml(selectedExpense, selectedKop);
      }
      if (printKwitansi) {
        const record = await generateKwitansiExpense(selectedExpense.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(selectedExpense, record);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        setShowPrintModal(false);
        return;
      }
      
      const container = document.createElement('div');
      container.innerHTML = htmlString;
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      document.body.appendChild(container);
      
      const images = container.getElementsByTagName('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);
      
      let html2pdf: any; try { html2pdf = require('html2pdf.js'); } catch (e) { html2pdf = (window as any).html2pdf; }
      const opt = {
        margin: 0,
        filename: 'Pengeluaran_' + selectedExpense.rabItem.name.replace(/\s+/g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      setShowPrintModal(false);
    } catch (err: any) {
      console.error('GENERATE PDF ERROR', err, err.stack);
      alert("Gagal generate PDF: " + err.message + "\n\nStack: " + (err.stack ? err.stack.substring(0, 200) : ''));
    } finally {
      setIsGeneratingPdf(false);
    }
  }
  

  if (!data) return <div className="p-8">No RAB data found. Please seed the database.</div>

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Monitoring RAB</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/fasilitator/laporan" className="block">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between hover:bg-amber-100 transition">
            <div>
              <h3 className="font-bold text-amber-900">Tagihan Transport Pending</h3>
              <p className="text-amber-700 text-sm">Menunggu verifikasi dan transfer</p>
            </div>
            <div className="text-2xl font-black text-amber-700 bg-amber-200 w-12 h-12 flex items-center justify-center rounded-full">
              {pendingWeekly}
            </div>
          </div>
        </Link>
        <Link href="/fasilitator/rekap-honor" className="block">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between hover:bg-blue-100 transition">
            <div>
              <h3 className="font-bold text-blue-900">Rekap Honorarium Pending</h3>
              <p className="text-blue-700 text-sm">Menunggu verifikasi dan pembuatan Invoice</p>
            </div>
            <div className="text-2xl font-black text-blue-700 bg-blue-200 w-12 h-12 flex items-center justify-center rounded-full">
              {pendingHonor}
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Total Anggaran</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(data.totalBudget)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Realisasi</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalRealized)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sisa Anggaran</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRemaining)}</p>
            <p className="text-sm text-gray-500">Terserap: {data.percentage.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.categories.map((cat: any) => (
          <Card key={cat.id}>
            <CardHeader><CardTitle>{cat.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Anggaran</span>
                  <span className="font-medium">{formatCurrency(cat.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Realisasi</span>
                  <span className="font-medium text-red-600">{formatCurrency(cat.realized)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-bold text-green-600">{formatCurrency(cat.remaining)}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Item Overbudget / Mendekati Penuh</h4>
                  {cat.items.filter((item: any) => item.realized > item.totalBudget * 0.8).map((item: any) => (
                    <div key={item.id} className="text-sm text-red-500 flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.realized > item.totalBudget ? 'OVERBUDGET' : 'WARNING'}</span>
                    </div>
                  ))}
                  {cat.items.filter((item: any) => item.realized > item.totalBudget * 0.8).length === 0 && (
                     <span className="text-sm text-gray-500">Aman</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Pengeluaran Terbaru</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Pengaju</th>
                  <th className="px-6 py-3">Item RAB</th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3">Nominal</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="border-b">
                    <td className="px-6 py-4">{new Date(exp.date || exp.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">{exp.createdBy?.name}</td>
                    <td className="px-6 py-4">{exp.rabItem?.name}</td>
                    <td className="px-6 py-4">
                      {exp.description}
                      {exp.receiptUrl && (
                        <div className="mt-1">
                          <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1">
                            📎 Lihat Nota
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={exp.status === 'APPROVED' ? 'default' : exp.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => openPrintModal(exp)}
                          className="text-xs bg-blue-600 text-white hover:bg-blue-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Cetak Dokumen
                        </button>
                        <DeleteExpenseButton expenseId={exp.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Cetak Dokumen Pengeluaran</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={printInvoice}
                  onChange={(e) => setPrintInvoice(e.target.checked)}
                />
                <span>Invoice Pengeluaran (Standar)</span>
              </label>
              
              {printInvoice && (
                <div className="pl-6 space-y-2 border-l-2 border-green-200 ml-1">
                  <p className="text-sm font-medium text-gray-700">Pilih Kop Surat:</p>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="kopType"
                      value="maleo"
                      checked={selectedKop === 'maleo'}
                      onChange={() => setSelectedKop('maleo')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Kop Yayasan Maleo</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="kopType"
                      value="robotic"
                      checked={selectedKop === 'robotic'}
                      onChange={() => setSelectedKop('robotic')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Kop Robotic Explorer</span>
                  </label>
                </div>
              )}
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={printKwitansi}
                  onChange={(e) => setPrintKwitansi(e.target.checked)}
                />
                <span>Kwitansi (Format Yayasan Maleo)</span>
              </label>
              
              {printKwitansi && (
                <div className="pl-6 space-y-2 border-l-2 border-blue-200 ml-1">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nomor Urut Kwitansi</label>
                    <input 
                      type="text" 
                      value={inputNoUrut}
                      onChange={(e) => setInputNoUrut(e.target.value)}
                      placeholder="Contoh: 001, 002..."
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tanggal Kwitansi</label>
                    <input 
                      type="date" 
                      value={inputTanggal}
                      onChange={(e) => setInputTanggal(e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                </div>
              )}
              
              <button 
                onClick={handlePrint}
                disabled={!printInvoice && !printKwitansi}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors mt-4"
              >
                Cetak Sekarang
              </button>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowPrintModal(false)} 
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
