'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { DeleteExpenseButton } from './DeleteExpenseButton'
import Link from 'next/link'
import { useState } from 'react'
import { generateKwitansiExpense } from '@/app/actions/rekap'

export function RabDashboardClient({ data, expenses, pendingWeekly, pendingHonor }: any) {
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  
  const [printInvoice, setPrintInvoice] = useState(false)
  const [printKwitansi, setPrintKwitansi] = useState(false)
  
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

  const cetakInvoiceExpense = (expense: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Invoice Pengeluaran - ${expense.rabItem.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; }
            .header { text-align: center; margin-bottom: 40px; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 30px;">
            <img src="/kop-surat.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
          </div>
          <div class="header">
            <h2>INVOICE PENGELUARAN LAPANGAN</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Item RAB:</strong> ${expense.rabItem.name}</p>
              ${expense.fasilitator ? `<p><strong>Nama Fasilitator:</strong> ${expense.fasilitator.namaLengkap}</p>` : ''}
              <p><strong>Tanggal Diajukan:</strong> ${new Date(expense.createdAt).toLocaleDateString('id-ID')}</p>
              <p><strong>Status:</strong> ${expense.status}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th>Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${expense.description}</td>
                <td>Rp ${expense.amount.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td class="total">TOTAL:</td>
                <td class="total text-emerald-600">Rp ${expense.amount.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div></div>
            <div style="text-align:right;">
              <p style="margin-top:40px;">Dicetak oleh: Admin SNT</p>
            </div>
          </div>
          <script>window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const cetakKwitansiExpense = async (expense: any, noUrut: string, tanggal: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write("<html><body><h2 style='font-family:sans-serif; text-align:center; margin-top:50px;'>Menghubungkan ke Google Sheets...</h2></body></html>");
    
    let noKwitansi = "KWT/MTC/TEMP";
    let kwitansiDate = new Date(expense.createdAt);
    
    try {
      const record = await generateKwitansiExpense(expense.id, noUrut, tanggal);
      noKwitansi = record.noKwitansi;
      kwitansiDate = new Date(record.tanggal);
    } catch (err: any) {
      console.error("Gagal generate no kwitansi:", err);
      win.close();
      alert(err.message || "Gagal menghubungi Google Sheets");
      return;
    }
    
    win.document.open();
    
    win.document.write(`
      <html>
        <head>
          <title>Kwitansi - ${expense.rabItem.name}</title>
          <style>
            @page { margin: 0.5cm 1cm; }
            @media print { body { padding: 0; } }
            body { font-family: 'Times New Roman', Times, serif; padding: 10px 40px; line-height: 1.5; font-size: 14px; }
            .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px; }
            .title-box { text-align: center; margin-bottom: 15px; }
            .title-box h2 { margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
            .title-box p { margin: 5px 0 0 0; font-size: 16px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .form-group { margin-bottom: 8px; display: flex; }
            .form-label { width: 220px; font-weight: normal; }
            .form-colon { width: 20px; }
            .form-value { flex: 1; font-weight: bold; }
            .form-value-underline { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
            .terbilang-box { background-color: #f1f5f9; padding: 6px 10px; font-style: italic; font-weight: bold; border: 1px dashed #ccc; margin-top: 5px;}
            .ttd-container { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
            .ttd-box { width: 250px; }
            .ttd-name { margin-top: 70px; font-weight: bold; text-decoration: underline; }
            .notes { margin-top: 40px; font-size: 12px; }
          </style>
        </head>
        <body>
          <img src="/kop-maleo.png" class="header-img" alt="Kop Surat" />
          
          <div class="title-box">
            <h2>KWITANSI</h2>
          </div>
          
          <div class="info-row">
            <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
            <div>Tanggal : <strong>${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Telah terima dari</div>
            <div class="form-colon">:</div>
            <div class="form-value-underline">Yayasan Maleo Talenta Cendekia</div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Jumlah Uang</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-size: 16px;">Rp ${expense.amount.toLocaleString('id-ID')}</div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Terbilang</div>
            <div class="form-colon">:</div>
            <div class="form-value terbilang-box">${terbilangRupiah(expense.amount)}</div>
          </div>

          <div class="form-group" style="margin-top: 20px;">
            <div class="form-label">Untuk Pembayaran</div>
            <div class="form-colon">:</div>
            <div class="form-value-underline">${expense.description} - ${expense.rabItem.name}</div>
          </div>
          
          <div class="ttd-container">
            <div class="ttd-box">
              <p>Mengetahui / Menyetujui,</p>
              <p><strong>Yayasan Maleo Talenta Cendekia</strong></p>
              <p class="ttd-name">....................................................</p>
            </div>
            <div class="ttd-box">
              <p>Yang Menerima,</p>
              <p><strong>Penerima</strong></p>
              <p class="ttd-name">${expense.fasilitator ? expense.fasilitator.namaLengkap : 'Penerima'}</p>
            </div>
          </div>
          
          <div class="notes">
            <p><em>* Dokumen ini dibuat dan dicetak secara otomatis oleh sistem SNT.</em></p>
          </div>
          <script>window.print()</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  const handlePrint = async () => {
    setShowPrintModal(false)
    if (printInvoice) {
      cetakInvoiceExpense(selectedExpense)
    }
    if (printKwitansi) {
      await cetakKwitansiExpense(selectedExpense, inputNoUrut, inputTanggal)
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
