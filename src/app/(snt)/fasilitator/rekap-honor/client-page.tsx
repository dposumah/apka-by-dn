"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { useState, useEffect } from 'react'
import { createRekapManual, deleteRekap, generateKwitansiHonor, generateKwitansiTransportBulanan } from '@/app/actions/rekap'
import { adminGenerateInvoiceHonor } from '@/app/actions/rekap'
import { getInvoiceHtml, getKwitansiHtml } from './pdf-generator'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/modal-provider';

export function RekapHonorClient({ initialData, fasilitators = [] }: { initialData: any[], fasilitators?: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  
  
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualFasilId, setManualFasilId] = useState('')
  const [manualBulan, setManualBulan] = useState('')
  const [manualJenis, setManualJenis] = useState('INTRAKURIKULER')
  const [manualJP, setManualJP] = useState('')
  const [manualRate, setManualRate] = useState('65000')
  const [manualSesi, setManualSesi] = useState('4')
  const [manualHonor, setManualHonor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Auto calculate JP based on type and fasilitator config
    if (manualFasilId) {
      const f = fasilitators.find((x: any) => x.id === manualFasilId)
      if (f) {
        const defaultJP = manualJenis === 'INTRAKURIKULER' ? (f.defaultJPIntra || 8) : (f.defaultJPEkstra || 4)
        const sesi = parseInt(manualSesi) || 4
        setManualJP((defaultJP * sesi).toString())
      }
    }
  }, [manualJenis, manualFasilId, manualSesi, fasilitators])

  useEffect(() => {
    // Auto calculate if JP changes
    const jp = parseInt(manualJP) || 0
    const rate = parseInt(manualRate) || 0
    setManualHonor((jp * rate).toString())
  }, [manualJP, manualRate])

  
  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus rekap ini?')) {
      try {
        await deleteRekap(id)
        router.refresh()
      } catch (e: any) {
        alert(e.message)
      }
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0, parseInt(manualSesi) || 4)
      setShowManualForm(false)
      setManualFasilId('')
      setManualBulan('')
      setManualJP('')
      setManualHonor('')
      setManualRate('65000')
      setManualSesi('4')
      router.refresh()
    } catch(err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Custom Modal State for Kop Surat
  const [showKopModal, setShowKopModal] = useState(false)
  const [selectedRekap, setSelectedRekap] = useState<any>(null)
  
  // New variables for Kwitansi manual input
  const [printCheckInvoice, setPrintCheckInvoice] = useState(true)
  const [printCheckHonor, setPrintCheckHonor] = useState(false)
  const [printCheckTransport, setPrintCheckTransport] = useState(false)
  const [printKopType, setPrintKopType] = useState<'maleo' | 'robotic'>('maleo')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  useEffect(() => {
    import('html2pdf.js').then(m => { (window as any).html2pdf = m.default || m; }).catch(e => console.error(e));
  }, []);

  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")

  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setPrintCheckInvoice(true)
    setPrintCheckHonor(false)
    setPrintCheckTransport(false)
    setPrintKopType('maleo')
    setInputNoUrut("")
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setInputTanggal(localISOTime)
    setShowKopModal(true)
  }

  const generatePdfDirect = async () => {
    if (!selectedRekap) return;
    setIsGeneratingPdf(true);
    
    try {
      let htmlString = "";
      
      // 1. Invoice
      if (printCheckInvoice) {
        htmlString += getInvoiceHtml(selectedRekap, printKopType);
      }
      
      // 2. Kwitansi Honor
      if (printCheckHonor) {
        const record = await generateKwitansiHonor(selectedRekap.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
      }
      
      // 3. Kwitansi Transport
      if (printCheckTransport) {
        const record = await generateKwitansiTransportBulanan(selectedRekap.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        alert("Pilih minimal satu dokumen untuk dicetak.");
        return;
      }
      
      // Put html in hidden div
      const container = document.createElement('div');
      container.innerHTML = htmlString;
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      document.body.appendChild(container);
      
      // Wait for images
      const images = container.getElementsByTagName('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);
      
      // Create PDF
      let html2pdf: any; try { html2pdf = require('html2pdf.js'); } catch (e) { html2pdf = (window as any).html2pdf; }
      const opt = {
        margin: 0,
        filename: `Rekap_Honor_${selectedRekap.fasilitator?.namaLengkap}_${selectedRekap.bulan}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      setShowKopModal(false);
    } catch (err: any) {
      console.error('GENERATE PDF ERROR', err, err.stack);
      alert("Gagal generate PDF: " + err.message + "\n\nStack: " + (err.stack ? err.stack.substring(0, 200) : ''));
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rekap Honorarium Bulanan</h1>
          <p className="text-slate-500 mt-1">Daftar rekapitulasi honorarium yang diajukan oleh Fasilitator.</p>
        </div>
        <button 
          onClick={() => setShowManualForm(!showManualForm)}
          className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
        >
          {showManualForm ? 'Batal' : '+ Buat Rekap Manual'}
        </button>
      </div>

      {showManualForm && (
        <Card className="mb-6 border-blue-200">
          <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
            <CardTitle className="text-blue-900 text-lg">Buat Rekap Manual Tanpa Laporan</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                <div>
                  <label className="block text-sm font-medium mb-1">Fasilitator</label>
                  <select required className="w-full border rounded p-2" value={manualFasilId} onChange={e => setManualFasilId(e.target.value)}>
                    <option value="">Pilih Fasilitator...</option>
                    {fasilitators.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.namaLengkap} - {f.lokasiSNT}</option>
                    ))}
                  </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Jenis Pembelajaran</label>
                    <select className="w-full border rounded p-2" value={manualJenis} onChange={e => setManualJenis(e.target.value)}>
                      <option value="INTRAKURIKULER">Intrakurikuler</option>
                      <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bulan (YYYY-MM)</label>
                    <input type="month" required className="w-full border rounded p-2" value={manualBulan} onChange={e => setManualBulan(e.target.value)} />
                  </div>
                </div>
              <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jumlah Sesi (Pertemuan)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualSesi} onChange={e => setManualSesi(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah JP</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualJP} onChange={e => setManualJP(e.target.value)} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Honor per JP (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualRate} onChange={e => setManualRate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Honor (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualHonor} onChange={e => setManualHonor(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Munculkan di Tabel'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4">Fasilitator</th>
                  <th className="py-3 px-4">Bulan</th>
                  <th className="py-3 px-4 text-center">Total JP</th>
                  <th className="py-3 px-4 text-right">Total Honor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Dokumen PDF</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialData.map((rekap) => (
                  <tr key={rekap.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{rekap.fasilitator.namaLengkap}</td>
                    <td className="py-3 px-4">{rekap.bulan}</td>
                    <td className="py-3 px-4 text-center">{rekap.totalJP}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(rekap.totalHonor)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}>{rekap.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rekap.filePdf ? (
                        <a href={rekap.filePdf} target="_blank" className="text-blue-600 hover:underline">Lihat PDF TTD</a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      
                      {rekap.status === 'SUBMITTED' && (
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => openKopModal(rekap)}
                            disabled={loadingId === rekap.id}
                            className="text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                          >
                            {loadingId === rekap.id ? 'Memproses...' : 'Buat Invoice & Cetak'}
                          </button>
                          <button 
                            onClick={() => handleDelete(rekap.id)}
                            className="text-xs bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                          >
                            Hapus
                          </button>
                        </div>
                      )}

                      {/* Note: Generating ExpenseRequest happens on Fasil submit currently. We can change this logic later if needed. */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    
      {/* Modal Pilih Dokumen */}
      {showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
            <h3 className="text-lg font-bold mb-4">Export Dokumen (PDF)</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border rounded-md space-y-2">
                <label className="font-semibold block">Dokumen yang akan digenerate:</label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={printCheckInvoice} onChange={e => setPrintCheckInvoice(e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span>Invoice Honorarium</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={printCheckHonor} onChange={e => setPrintCheckHonor(e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span>Kwitansi Honorarium</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={printCheckTransport} onChange={e => setPrintCheckTransport(e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span>Kwitansi Transport (Bulanan)</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="font-semibold block">Pilih Kop Surat (Khusus Invoice):</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="kopType" checked={printKopType === 'maleo'} onChange={() => setPrintKopType('maleo')} className="w-4 h-4 text-blue-600" />
                    <span>Yayasan Maleo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="kopType" checked={printKopType === 'robotic'} onChange={() => setPrintKopType('robotic')} className="w-4 h-4 text-blue-600" />
                    <span>Robotic Explorer</span>
                  </label>
                </div>
              </div>

              {(printCheckHonor || printCheckTransport) && (
                <div className="space-y-3 pt-3 border-t">
                  <label className="font-semibold block text-blue-800">Detail Kwitansi</label>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nomor Urut Kwitansi <span className="text-slate-500 font-normal">(Kosongkan untuk nomor otomatis)</span></label>
                    <input 
                      type="text" 
                      value={inputNoUrut}
                      onChange={(e) => setInputNoUrut(e.target.value)}
                      placeholder="Contoh: 001, 002..."
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tanggal Kwitansi</label>
                    <input 
                      type="date" 
                      value={inputTanggal}
                      onChange={(e) => setInputTanggal(e.target.value)}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowKopModal(false)} 
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                disabled={isGeneratingPdf}
              >
                Batal
              </button>
              <button 
                onClick={generatePdfDirect}
                disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isGeneratingPdf ? 'Memproses...' : 'Export to PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}