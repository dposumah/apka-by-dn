'use client'

import { useState, useEffect } from 'react'
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
  const [selectedKop, setSelectedKop] = useState<'maleo' | 'robotic'>('maleo')
  
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
        setPrintInvoice(false)
        setPrintKwitansi(false)
        setSelectedKop('maleo')
      }
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message || 'Gagal mengirim data', type: 'error' })
    } finally {
      setLoading(false)
    }
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
    if (!submittedExpense) return;
    setIsGeneratingPdf(true);
    try {
      let htmlString = "";
      if (printInvoice) {
        htmlString += getInvoiceHtml(submittedExpense, selectedKop);
      }
      if (printKwitansi) {
        const record = await generateKwitansiExpense(submittedExpense.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(submittedExpense, record);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
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
        filename: 'Pengeluaran_' + submittedExpense.rabItem.name.replace(/\s+/g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
    } catch (err: any) {
      console.error('GENERATE PDF ERROR', err, err.stack);
      alert("Gagal generate PDF: " + err.message + "\n\nStack: " + (err.stack ? err.stack.substring(0, 200) : ''));
    } finally {
      setIsGeneratingPdf(false);
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
              
              {printInvoice && (
                <div className="pl-6 space-y-2 border-l-2 border-green-200 ml-1">
                  <p className="text-sm font-medium text-gray-700">Pilih Kop Surat:</p>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="kopTypeForm"
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
                      name="kopTypeForm"
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
