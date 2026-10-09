"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { useState, useEffect } from 'react'
import { createRekapManual, deleteRekap, generateKwitansiHonor, generateKwitansiTransportBulanan } from '@/app/actions/rekap'
import { adminGenerateInvoiceHonor, uploadBuktiRekap, generateInvoiceHonorRecord } from '@/app/actions/rekap'
import { getInvoiceHtml, getKwitansiHtml } from './pdf-generator'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/modal-provider';

import { getFasilitatorJpForMonth, syncLaporanToRekap } from '@/app/actions/rekap'

export function RekapHonorClient({ initialData, fasilitators = [] }: { initialData: any[], fasilitators?: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  
  
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualFasilId, setManualFasilId] = useState('')
  const [manualBulan, setManualBulan] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })
  
    const [manualJPIntra, setManualJPIntra] = useState('')
  const [manualJPEkstra, setManualJPEkstra] = useState('')
  const [manualRate, setManualRate] = useState('65000')
  const [manualSesi, setManualSesi] = useState('4')
  const [manualHonor, setManualHonor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Computed values
    const computedTotalJP = (parseInt(manualJPIntra) || 0) + (parseInt(manualJPEkstra) || 0);
    const computedTotalHonor = computedTotalJP * (parseInt(manualRate) || 0);


    const [sortField, setSortField] = useState<'nama' | 'lokasi' | 'bulan' | 'tanggal'>('tanggal')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: 'nama' | 'lokasi' | 'bulan' | 'tanggal') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedData = [...initialData].sort((a, b) => {
    let comparison = 0
    if (sortField === 'nama') {
      comparison = (a.fasilitator.namaLengkap || '').localeCompare(b.fasilitator.namaLengkap || '')
    } else if (sortField === 'lokasi') {
      comparison = (a.fasilitator.lokasiSNT || '').localeCompare(b.fasilitator.lokasiSNT || '')
    } else if (sortField === 'bulan') {
      comparison = (a.bulan || '').localeCompare(b.bulan || '')
    } else {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  useEffect(() => {
    async function fetchJp() {
      if (manualFasilId && manualBulan) {
        try {
          const res = await getFasilitatorJpForMonth(manualFasilId, manualBulan);
          if (res) {
            setManualJPIntra(res.totalJPIntra.toString());
            setManualJPEkstra(res.totalJPEkstra.toString());
            setManualSesi(res.sesi.toString());
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchJp();
  }, [manualFasilId, manualBulan])

  

  
  
  const handleSync = async (id: string) => {
    if (confirm('Tautkan semua laporan telat di bulan ini ke rekap ini? (Angka Honor tidak akan berubah)')) {
      try {
        const count = await syncLaporanToRekap(id)
        alert(`Berhasil menautkan ${count} laporan.`)
        router.refresh()
      } catch (e: any) {
        alert(e.message)
      }
    }
  }

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
      await createRekapManual(manualFasilId, manualBulan, computedTotalJP, computedTotalHonor, parseInt(manualSesi) || 4, parseInt(manualJPIntra) || 0, parseInt(manualJPEkstra) || 0)
      setShowManualForm(false)
      setManualFasilId('')
      setManualBulan('')


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
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadingRekap, setUploadingRekap] = useState<any>(null)
  const [honorFile, setHonorFile] = useState<File | null>(null)
  const [transportFile, setTransportFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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

    const [showTextModal, setShowTextModal] = useState(false)
    const [textToCopy, setTextToCopy] = useState("")
  
    const handleCopyText = (rekap: any) => {
      const bankName = rekap.fasilitator?.bankName || '-';
      const bankAccount = rekap.fasilitator?.bankAccount || '-';
      const namaLengkap = rekap.fasilitator?.namaLengkap || '-';
      const lokasi = rekap.fasilitator?.lokasiSNT || '-';
      const jumlahJP = rekap.totalJP;
      // Using a simple local format since formatCurrency is imported
      let nominalStr = "Rp 0";
      if (rekap.totalHonor) {
        nominalStr = "Rp " + Math.round(rekap.totalHonor).toLocaleString('id-ID');
      }
      
      const text = `Data Pembayaran Honor:
Nama Fasilitator: ${namaLengkap}
Lokasi (SNT): ${lokasi}
Bulan Laporan: ${rekap.bulan}
Jumlah JP: ${jumlahJP} JP
Total Pembayaran: ${nominalStr}

Informasi Rekening:
Bank: ${bankName}
No. Rekening: ${bankAccount}
Atas Nama: ${namaLengkap}`;
      
      setTextToCopy(text);
      setShowTextModal(true);
    }


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
                          const invRecord = await generateInvoiceHonorRecord(selectedRekap.id, inputNoUrut, inputTanggal);
                          if (invRecord?.error) throw new Error(invRecord.error);
                          htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
                        }
      
      // 2. Kwitansi Honor
      if (printCheckHonor) {
        const record = await generateKwitansiHonor(selectedRekap.id, inputNoUrut, inputTanggal);
          if (record.error) throw new Error(record.error);
          htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
      }
      
      // 3. Kwitansi Transport
      if (printCheckTransport) {
        let transportNoUrut = inputNoUrut;
          if (printCheckHonor && printCheckTransport && inputNoUrut) {
            const num = parseInt(inputNoUrut, 10);
            if (!isNaN(num)) transportNoUrut = (num + 1).toString();
            else transportNoUrut = inputNoUrut + "-T";
          }
          const record = await generateKwitansiTransportBulanan(selectedRekap.id, transportNoUrut, inputTanggal);
          if (record.error) throw new Error(record.error);
          htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        alert("Pilih minimal satu dokumen untuk dicetak.");
        return;
      }
      
      // Put html in hidden div
      const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlString;
        wrapper.style.width = '794px';
        wrapper.style.backgroundColor = '#ffffff';
      
      // Create PDF
      let html2pdf: any; try { html2pdf = require('html2pdf.js'); } catch (e) { html2pdf = (window as any).html2pdf; }
      const opt = {
          margin: 0,
          filename: `Rekap_Honor_${selectedRekap.fasilitator?.namaLengkap}_${selectedRekap.bulan}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'css' }
        };
      
      await html2pdf().set(opt).from(wrapper).save();
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
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">JP Intra</label>
                      <input type="number" min="0" className="w-full border rounded p-2" value={manualJPIntra} onChange={e => setManualJPIntra(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">JP Ekstra</label>
                      <input type="number" min="0" className="w-full border rounded p-2" value={manualJPEkstra} onChange={e => setManualJPEkstra(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Total JP</label>
                      <input type="number" readOnly className="w-full border rounded p-2 bg-slate-100" value={computedTotalJP} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Honor per JP (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualRate} onChange={e => setManualRate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Honor (Rp)</label>
                  <input type="number" min="0" required value={computedTotalHonor} readOnly className="w-full border rounded p-2 bg-slate-100" />
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
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("nama")}>Fasilitator & Lokasi {sortField==="nama" ? (sortOrder==="asc"?"?":"?") : ""}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("bulan")}>Bulan {sortField==="bulan" ? (sortOrder==="asc"?"↑":"↓") : ""}</th>
                  <th className="py-3 px-4 text-center">Total JP</th>
                  <th className="py-3 px-4 text-right">Total Honor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Dokumen PDF</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedData.map((rekap) => (
                  <tr key={rekap.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{rekap.fasilitator.namaLengkap}</div>
                        <div className="text-xs text-slate-500 uppercase">{rekap.fasilitator.lokasiSNT || '-'}</div>
                      </td>
                    <td className="py-3 px-4">{rekap.bulan}</td>
                    <td className="py-3 px-4 text-center">{rekap.totalJP}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(rekap.totalHonor)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}>{rekap.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(rekap.laporan?.reduce((acc: number, lap: any) => acc + (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0), 0) || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {rekap.buktiPembayaranHonor ? (
                          <a href={rekap.buktiPembayaranHonor} target="_blank" className="text-xs text-green-600 hover:underline">✓ Honor</a>
                        ) : null}
                        {rekap.buktiPembayaranTransport ? (
                          <a href={rekap.buktiPembayaranTransport} target="_blank" className="text-xs text-green-600 hover:underline">✓ Transport</a>
                        ) : null}
                        {rekap.status === 'SUBMITTED' && (
                          <button 
                            onClick={() => { setUploadingRekap(rekap); setHonorFile(null); setTransportFile(null); setShowUploadModal(true); }}
                            className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 mt-1"
                          >
                            Upload Bukti
                          </button>
                        )}
                      </div>
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
                          <button onClick={() => handleCopyText(rekap)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap" title="Salin detail pembayaran">Salin Data</button>
                            <button onClick={() => handleDelete(rekap.id)} className="text-xs bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap">Hapus</button>
                            <button onClick={() => handleSync(rekap.id)} className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded px-2 py-1.5 transition-colors whitespace-nowrap" title="Tautkan laporan mingguan fasilitator yang telat ke rekap ini (Tidak merubah honor)">Tautkan</button>
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
      
      {/* Modal Upload Bukti Pembayaran */}
      {showUploadModal && uploadingRekap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">Upload Bukti Pembayaran</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload bukti transfer untuk Fasilitator <strong>{uploadingRekap.fasilitator?.namaLengkap}</strong> (Bulan: {uploadingRekap.bulan}).<br/>
              Sistem akan otomatis memotong item RAB Fasilitator & Sewa Rumah.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="border p-4 rounded-md">
                <label className="block text-sm font-medium mb-2">1. Bukti Transfer Honorarium (Rp {formatCurrency(uploadingRekap.totalHonor)})</label>
                {uploadingRekap.buktiPembayaranHonor ? (
                  <div className="text-sm text-green-600 mb-2">✓ Sudah ada bukti terupload</div>
                ) : null}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setHonorFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>

              <div className="border p-4 rounded-md">
                <label className="block text-sm font-medium mb-2">2. Bukti Transfer Transportasi (Rp {formatCurrency(uploadingRekap.laporan?.reduce((acc: number, lap: any) => acc + (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0), 0) || 0)})</label>
                {uploadingRekap.buktiPembayaranTransport ? (
                  <div className="text-sm text-green-600 mb-2">✓ Sudah ada bukti terupload</div>
                ) : null}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setTransportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isUploading}
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  if (!honorFile && !transportFile) {
                    alert('Pilih minimal satu file bukti pembayaran');
                    return;
                  }
                  setIsUploading(true);
                  try {
                    let urlHonor;
                    let urlTransport;
                    if (honorFile) {
                      const data = new FormData(); data.append('file', honorFile);
                      const res = await fetch('/api/upload', { method: 'POST', body: data });
                      if (res.ok) { const json = await res.json(); urlHonor = json.url; } else throw new Error("Gagal upload bukti honor");
                    }
                    if (transportFile) {
                      const data = new FormData(); data.append('file', transportFile);
                      const res = await fetch('/api/upload', { method: 'POST', body: data });
                      if (res.ok) { const json = await res.json(); urlTransport = json.url; } else throw new Error("Gagal upload bukti transport");
                    }
                    
                    const result = await uploadBuktiRekap(uploadingRekap.id, urlHonor, urlTransport);
                    if (result.error) throw new Error(result.error);
                    
                    alert('Bukti pembayaran berhasil diupload & RAB berhasil dipotong!');
                    setShowUploadModal(false);
                    router.refresh();
                  } catch (err: any) {
                    console.error(err);
                    alert('Terjadi kesalahan: ' + err.message);
                  } finally {
                    setIsUploading(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isUploading || (!honorFile && !transportFile)}
              >
                {isUploading ? 'Mengunggah...' : 'Upload & Potong RAB'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {isGeneratingPdf ? 'Memproses...' : 'Export PDF'}
                </button>
                <button 
                  onClick={async () => {
                    if (!selectedRekap) return;
                    setIsGeneratingPdf(true);
                    try {
                      let htmlString = "";
                      
                      if (printCheckInvoice) {
                          const invRecord = await generateInvoiceHonorRecord(selectedRekap.id, inputNoUrut, inputTanggal);
                          if (invRecord?.error) throw new Error(invRecord.error);
                          htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
                        }
                      
                      if (printCheckHonor) {
                        const record = await generateKwitansiHonor(selectedRekap.id, inputNoUrut, inputTanggal);
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
                      }
                      
                      let transportNoUrut = inputNoUrut;
                      if (printCheckHonor && printCheckTransport && inputNoUrut) {
                        const num = parseInt(inputNoUrut, 10);
                        if (!isNaN(num)) transportNoUrut = (num + 1).toString();
                        else transportNoUrut = inputNoUrut + "-T";
                      }
                      
                      if (printCheckTransport) {
                        const record = await generateKwitansiTransportBulanan(selectedRekap.id, transportNoUrut, inputTanggal);
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
                      }
                      
                      if (!htmlString) {
                        alert("Pilih minimal 1 dokumen untuk dicetak.");
                        setIsGeneratingPdf(false);
                        return;
                      }

                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        alert("Popup diblokir! Izinkan popup untuk memprint.");
                        setIsGeneratingPdf(false);
                        return;
                      }
                      
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Dokumen</title>
                            <style>
                              @media print {
                                body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                              }
                            </style>
                          </head>
                          <body style="margin: 0; padding: 0;">
                            ${htmlString}
                            <script>
                              window.onload = () => {
                                setTimeout(() => {
                                  window.print();
                                  // window.close(); // Optional: close after print
                                }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setShowKopModal(false);
                    } catch (err: any) {
                      console.error('GENERATE PRINT ERROR', err, err.stack);
                      alert("Gagal print: " + err.message);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 ml-2"
                >
                  {isGeneratingPdf ? 'Memproses...' : 'Print Dokumen'}
                </button>
            </div>
          </div>
        </div>
      )}
          {showTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
              <h3 className="text-lg font-bold mb-4">Detail Data Pembayaran</h3>
              <p className="text-sm text-slate-500 mb-2">Teks berikut siap disalin atau dibagikan:</p>
              <textarea 
                readOnly 
                className="w-full h-48 p-3 text-sm font-mono border rounded-md bg-slate-50 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={textToCopy}
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowTextModal(false)} 
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(textToCopy);
                    alert("Teks berhasil disalin ke clipboard!");
                  }} 
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Salin Teks
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
