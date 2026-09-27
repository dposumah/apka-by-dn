'use client'

import { useState } from 'react'
import { submitExpense } from '@/app/actions/rab'
import { generateKwitansiExpense } from '@/app/actions/rekap'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PengeluaranForm({ items, fasilitators }: { items: any[], fasilitators: any[] }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedFasilitatorId, setSelectedFasilitatorId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [submittedExpense, setSubmittedExpense] = useState<any>(null)
  const [printInvoice, setPrintInvoice] = useState(false)
  const [printKwitansi, setPrintKwitansi] = useState(false)
  
  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
  })

  const selectedItem = items.find(i => i.id === selectedItemId)
  const isHonorarium = selectedItem?.name?.toLowerCase().includes('fasilitator')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSubmittedExpense(null)
    
    const formData = new FormData(e.currentTarget)
    const amount = Number(formData.get('amount'))
    const description = String(formData.get('description'))
    
    try {
      let receiptUrl = ''

      if (file) {
        const uploadData = new FormData()
        uploadData.append('file', file)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        })
        
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'Gagal mengunggah gambar')
        }
        
        const uploadResult = await uploadRes.json()
        receiptUrl = uploadResult.url
      }

      const expense = await submitExpense({
        rabItemId: selectedItemId,
        amount,
        description,
        receiptUrl,
        userId: 'demo-user-id',
        fasilitatorId: isHonorarium ? selectedFasilitatorId : undefined
      })
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil ditambahkan.', type: 'success' })
      e.currentTarget.reset()
      setSelectedItemId('')
      setSelectedFasilitatorId('')
      setFile(null)
      
      if (expense) {
        setSubmittedExpense(expense)
      }
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message || 'Gagal mengirim data', type: 'error' })
    } finally {
      setLoading(false)
    }
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
    if (printInvoice) {
      cetakInvoiceExpense(submittedExpense)
    }
    if (printKwitansi) {
      await cetakKwitansiExpense(submittedExpense, inputNoUrut, inputTanggal)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Item RAB</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedItemId}
            onChange={e => setSelectedItemId(e.target.value)}
            required
          >
            <option value="">-- Pilih Item Kegiatan --</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name} (Sisa: {formatCurrency(item.remaining)})
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-200">
            <p><strong>Kategori:</strong> {selectedItem.categoryName}</p>
            <p><strong>Anggaran:</strong> {formatCurrency(selectedItem.totalBudget)}</p>
            <p><strong>Telah Terealisasi:</strong> {formatCurrency(selectedItem.realized)}</p>
          </div>
        )}

        {isHonorarium && (
          <div className="space-y-2 border border-blue-200 p-4 rounded-md bg-white shadow-sm">
            <Label className="text-blue-700">Penerima Honor (Fasilitator)</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              value={selectedFasilitatorId}
              onChange={e => setSelectedFasilitatorId(e.target.value)}
              required
            >
              <option value="">-- Pilih Fasilitator --</option>
              {fasilitators.map(f => (
                <option key={f.id} value={f.id}>
                  {f.namaLengkap} - {f.instansi}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Karena pengeluaran ini terkait Fasilitator, mohon pilih penerimanya.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Nominal Pengeluaran (Rp)</Label>
          <Input type="number" name="amount" min="1" required placeholder="Contoh: 150000" />
        </div>

        <div className="space-y-2">
          <Label>Deskripsi / Keterangan</Label>
          <Textarea name="description" required placeholder="Jelaskan peruntukan pengeluaran ini..." />
        </div>
        
        <div className="space-y-2">
          <Label>Foto Bukti Nota (Opsional)</Label>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-gray-500">Otomatis diunggah ke Supabase saat form disubmit.</p>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Mengirim...' : 'Ajukan Pengeluaran'}
        </Button>
      </form>
      
      {submittedExpense && (
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 text-lg">Pengeluaran berhasil dicatat!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={printInvoice}
                  onChange={(e) => setPrintInvoice(e.target.checked)}
                />
                <span>Cetak Invoice</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={printKwitansi}
                  onChange={(e) => setPrintKwitansi(e.target.checked)}
                />
                <span>Cetak Kwitansi</span>
              </label>
              
              {printKwitansi && (
                <div className="pl-6 space-y-2 border-l-2 border-green-200 ml-1">
                  <div>
                    <Label className="block text-sm font-medium mb-1">Nomor Urut Kwitansi</Label>
                    <Input 
                      type="text" 
                      value={inputNoUrut}
                      onChange={(e) => setInputNoUrut(e.target.value)}
                      placeholder="Contoh: 001, 002..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-1">Tanggal Kwitansi</Label>
                    <Input 
                      type="date" 
                      value={inputTanggal}
                      onChange={(e) => setInputTanggal(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handlePrint}
                disabled={!printInvoice && !printKwitansi}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
              >
                Cetak Dokumen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
