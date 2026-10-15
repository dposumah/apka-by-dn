"use client"

import { Edit, Printer, Copy, Trash2, Link as LinkIcon, FileText, FileCheck2, Loader2, X } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { hitungTotalTransportRekap } from '@/lib/transport'
import { useState, useEffect } from 'react'
import { createRekapManual, deleteRekap, generateKwitansiHonor, generateKwitansiTransportBulanan, updateRekapTransport } from '@/app/actions/rekap'
import { adminGenerateInvoiceHonor, uploadBuktiRekap, generateInvoiceHonorRecord } from '@/app/actions/rekap'
import { getInvoiceHtml, getKwitansiHtml } from './pdf-generator'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/modal-provider';

import { getFasilitatorJpForMonth, syncLaporanToRekap } from '@/app/actions/rekap'
import { FilePreviewModal } from '@/components/shared/FilePreviewModal'
import { uploadFileClient } from '@/lib/upload-client'

export function RekapHonorClient({ initialData, fasilitators = [] }: { initialData: any[], fasilitators?: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
  }>({
    isOpen: false,
    title: '',
    url: ''
  });
  
  const [showManualForm, setShowManualForm] = useState(false)
  const [editingTransportRekap, setEditingTransportRekap] = useState<any | null>(null)
  const [transportAmountInput, setTransportAmountInput] = useState<string>('')
  const [isSavingTransport, setIsSavingTransport] = useState(false)

  const openEditTransportModal = (rekap: any) => {
    setEditingTransportRekap(rekap)
    const currentAmount = hitungTotalTransportRekap(rekap)
    setTransportAmountInput(currentAmount.toString())
  }

  const handleSaveTransport = async () => {
    if (!editingTransportRekap) return
    setIsSavingTransport(true)
    try {
      const nominal = parseFloat(transportAmountInput) || 0
      const res = await updateRekapTransport(editingTransportRekap.id, nominal)
      if (res?.error) {
        await alert(res.error)
      } else {
        await alert('Biaya transport berhasil diperbarui.')
        setEditingTransportRekap(null)
        router.refresh()
      }
    } catch (e: any) {
      await alert('Gagal memperbarui: ' + (e.message || ''))
    } finally {
      setIsSavingTransport(false)
    }
  }

  const handleResetTransportToSystem = async () => {
    if (!editingTransportRekap) return
    if (!(await confirm('Kembalikan ke hitungan transport otomatis sistem?'))) return
    setIsSavingTransport(true)
    try {
      const res = await updateRekapTransport(editingTransportRekap.id, null)
      if (res?.error) {
        await alert(res.error)
      } else {
        await alert('Biaya transport dikembalikan ke kalkulasi sistem.')
        setEditingTransportRekap(null)
        router.refresh()
      }
    } catch (e: any) {
      await alert('Gagal mereset: ' + (e.message || ''))
    } finally {
      setIsSavingTransport(false)
    }
  }
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


  const [filterLokasi, setFilterLokasi] = useState('')
  const [filterNama, setFilterNama] = useState('')
  const [filterBulan, setFilterBulan] = useState('')

  const lokasiList = Array.from(
    new Set([
      ...initialData.map((r: any) => r.fasilitator?.lokasiSNT),
      ...fasilitators.map((f: any) => f.lokasiSNT)
    ].filter(Boolean))
  ).sort((a: any, b: any) => (a as string).localeCompare(b as string)) as string[];

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

  const filteredData = initialData.filter((rekap: any) => {
    const matchLokasi = filterLokasi ? rekap.fasilitator?.lokasiSNT === filterLokasi : true;
    const matchNama = filterNama ? rekap.fasilitator?.namaLengkap?.toLowerCase().includes(filterNama.toLowerCase()) : true;
    const matchBulan = filterBulan ? rekap.bulan === filterBulan : true;
    return matchLokasi && matchNama && matchBulan;
  });

  const sortedData = [...filteredData].sort((a, b) => {
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
  const [isUnlockedHonor, setIsUnlockedHonor] = useState(false)
  const [isUnlockedTransport, setIsUnlockedTransport] = useState(false)
  const [isUnlockedInvoice, setIsUnlockedInvoice] = useState(false)

  const getKwHonor = (rekap: any) => {
    if (!rekap?.kwitansiRecord) return null;
    if (Array.isArray(rekap.kwitansiRecord)) {
      return rekap.kwitansiRecord.find((k: any) => k.tipeKwitansi === 'HONOR' || (!k.tipeKwitansi && Math.abs(k.nominal - (rekap.totalHonor || 0)) < 1)) || null;
    }
    return rekap.kwitansiRecord;
  };

  const getKwTransport = (rekap: any) => {
    if (!rekap?.kwitansiRecord) return null;
    if (Array.isArray(rekap.kwitansiRecord)) {
      return rekap.kwitansiRecord.find((k: any) => k.tipeKwitansi === 'TRANSPORT') || null;
    }
    return null;
  };

  const getInvHonor = (rekap: any) => {
    if (!rekap?.invoiceRecord) return null;
    if (Array.isArray(rekap.invoiceRecord)) {
      return rekap.invoiceRecord[0] || null;
    }
    return rekap.invoiceRecord;
  };

    const [showTextModal, setShowTextModal] = useState(false)
    const [textToCopy, setTextToCopy] = useState("")
  
    const handleCopyText = (rekap: any) => {
      const bankName = rekap.fasilitator?.bankName || '-';
      const bankAccount = rekap.fasilitator?.bankAccount || '-';
      const namaLengkap = rekap.fasilitator?.namaLengkap || '-';
      const lokasi = rekap.fasilitator?.lokasiSNT || '-';
      const jumlahJP = rekap.totalJP;
      
      const totalTransport = hitungTotalTransportRekap(rekap);

      const totalHonor = rekap.totalHonor || 0;
      const totalTransfer = totalHonor + totalTransport;
      
      const text = `Data Pembayaran Fasilitator:
Nama Fasilitator: ${namaLengkap}
Lokasi (SNT): ${lokasi}
Bulan Laporan: ${rekap.bulan}
Jumlah JP: ${jumlahJP} JP

Rincian Pembayaran:
- Subtotal Honor: Rp ${Math.round(totalHonor).toLocaleString('id-ID')}
- Bantuan Transport: Rp ${Math.round(totalTransport).toLocaleString('id-ID')}
Total Transfer: Rp ${Math.round(totalTransfer).toLocaleString('id-ID')}

Informasi Rekening:
Bank: ${bankName}
No. Rekening: ${bankAccount}
Atas Nama: ${namaLengkap}`;
      
      setTextToCopy(text);
      setShowTextModal(true);
    }


  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setIsUnlockedHonor(false)
    setIsUnlockedTransport(false)
    setIsUnlockedInvoice(false)

    const inv = getInvHonor(rekap)
    const kwH = getKwHonor(rekap)
    const kwT = getKwTransport(rekap)

    const hasInv = !!(inv?.noInvoice && !inv.noInvoice.includes('TEMP'))
    const hasKwH = !!(kwH?.noKwitansi && !kwH.noKwitansi.includes('TEMP'))
    const hasKwT = !!(kwT?.noKwitansi && !kwT.noKwitansi.includes('TEMP'))

    if (hasInv || hasKwH || hasKwT) {
      setPrintCheckInvoice(hasInv)
      setPrintCheckHonor(hasKwH)
      setPrintCheckTransport(hasKwT)
    } else {
      setPrintCheckInvoice(true)
      setPrintCheckHonor(false)
      setPrintCheckTransport(false)
    }

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
        const forceNewInv = isUnlockedInvoice;
        const invRecord = await generateInvoiceHonorRecord(
          selectedRekap.id, 
          isUnlockedInvoice ? inputNoUrut : undefined, 
          isUnlockedInvoice ? inputTanggal : undefined, 
          forceNewInv
        );
        if (invRecord?.error) throw new Error(invRecord.error);
        htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
      }
      
      // 2. Kwitansi Honor
      if (printCheckHonor) {
        const forceNewKw = isUnlockedHonor;
        const record = await generateKwitansiHonor(
          selectedRekap.id, 
          isUnlockedHonor ? inputNoUrut : undefined, 
          isUnlockedHonor ? inputTanggal : undefined, 
          forceNewKw
        );
        if (record.error) throw new Error(record.error);
        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
      }
      
      // 3. Kwitansi Transport
      if (printCheckTransport) {
        let transportNoUrut = isUnlockedTransport ? inputNoUrut : undefined;
        if (isUnlockedTransport && printCheckHonor && inputNoUrut) {
          const num = parseInt(inputNoUrut, 10);
          if (!isNaN(num)) transportNoUrut = (num + 1).toString();
          else transportNoUrut = inputNoUrut + "-T";
        }
        const forceNewTrans = isUnlockedTransport;
        const record = await generateKwitansiTransportBulanan(
          selectedRekap.id, 
          transportNoUrut, 
          isUnlockedTransport ? inputTanggal : undefined, 
          forceNewTrans
        );
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
      router.refresh();
    } catch (err: any) {
      console.error('GENERATE PDF ERROR', err, err.stack);
      alert("Gagal generate PDF: " + err.message + "\n\nStack: " + (err.stack ? err.stack.substring(0, 200) : ''));
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      
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


      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-2 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Cari Nama Fasilitator</label>
          <input 
            type="text" 
            placeholder="Ketik nama fasilitator..." 
            value={filterNama}
            onChange={e => setFilterNama(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>
        <div className="w-full md:w-80">
          <label className="text-sm font-medium mb-1 block">Filter Lokasi SNT</label>
          <select 
            value={filterLokasi}
            onChange={e => setFilterLokasi(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Semua Lokasi SNT ({lokasiList.length} Lokasi)</option>
            {lokasiList.map((loc: string) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="text-sm font-medium mb-1 block">Filter Bulan</label>
          <input 
            type="month"
            value={filterBulan}
            onChange={e => setFilterBulan(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>
        {(filterLokasi || filterNama || filterBulan) && (
          <button
            onClick={() => { setFilterLokasi(''); setFilterNama(''); setFilterBulan(''); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border rounded-lg bg-slate-50 hover:bg-slate-100 whitespace-nowrap"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
        <span>Menampilkan <strong>{sortedData.length}</strong> dari <strong>{initialData.length}</strong> rekapitulasi honor</span>
        {filterLokasi && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">Lokasi: {filterLokasi}</span>}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort("nama")}>
                    <div className="flex items-center gap-1.5">
                      <span>Fasilitator</span>
                      <span className="text-slate-400 font-normal">{sortField === "nama" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort("lokasi")}>
                    <div className="flex items-center gap-1.5">
                      <span>Lokasi SNT</span>
                      <span className="text-slate-400 font-normal">{sortField === "lokasi" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort("bulan")}>
                    <div className="flex items-center gap-1.5">
                      <span>Bulan</span>
                      <span className="text-slate-400 font-normal">{sortField === "bulan" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Total JP</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Honor</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Transport</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Bukti Bayar</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Tidak ada data rekapitulasi honorarium.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((rekap) => (
                    <tr key={rekap.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Fasilitator */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">{rekap.fasilitator.namaLengkap}</div>
                        {(rekap.fasilitator.bankName || rekap.fasilitator.bankAccount) ? (
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            {rekap.fasilitator.bankName} {rekap.fasilitator.bankAccount ? `• ${rekap.fasilitator.bankAccount}` : ''}
                          </div>
                        ) : null}
                      </td>

                      {/* 2. Lokasi SNT (Kolom Tersendiri) */}
                      <td className="py-3 px-3 align-top">
                        {rekap.fasilitator.lokasiSNT ? (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 block">
                              {rekap.fasilitator.lokasiSNT.split(' - ')[0]}
                            </span>
                            {rekap.fasilitator.lokasiSNT.split(' - ')[1] && (
                              <span className="text-slate-500 block text-[11px] mt-0.5 leading-tight">
                                {rekap.fasilitator.lokasiSNT.split(' - ')[1]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* 3. Bulan */}
                      <td className="py-3 px-2.5 align-top text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium border border-slate-200">
                          {rekap.bulan}
                        </span>
                      </td>

                      {/* 4. Total JP */}
                      <td className="py-3 px-2 align-top text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-sm">{rekap.totalJP}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">JP</span>
                      </td>

                      {/* 5. Total Honor */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          {formatCurrency(rekap.totalHonor)}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3 px-2 align-top text-center whitespace-nowrap">
                        <Badge 
                          variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}
                          className={rekap.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px]' : 'text-[11px]'}
                        >
                          {rekap.status}
                        </Badge>
                      </td>

                      {/* 7. Total Transport */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-medium text-slate-900">{formatCurrency(hitungTotalTransportRekap(rekap))}</span>
                          <button 
                            type="button"
                            onClick={() => openEditTransportModal(rekap)}
                            className="p-1 hover:bg-amber-100 bg-amber-50 text-amber-700 border border-amber-200 rounded transition-colors"
                            title="Edit Biaya Transport"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                        {rekap.totalTransport !== null && rekap.totalTransport !== undefined && (
                          <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Disesuaikan Admin</span>
                        )}
                      </td>

                      {/* 8. Bukti Bayar & Dokumen Lampiran */}
                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex flex-col items-center gap-1.5 min-w-[95px]">
                          {rekap.buktiPembayaranHonor ? (
                            <button 
                              type="button"
                              onClick={() => setPreviewModal({
                                isOpen: true,
                                title: `Bukti Transfer Honor - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                                url: rekap.buktiPembayaranHonor
                              })}
                              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-full justify-center transition-colors"
                            >
                              ✓ Honor
                            </button>
                          ) : null}
                          {rekap.buktiPembayaranTransport ? (
                            <button 
                              type="button"
                              onClick={() => setPreviewModal({
                                isOpen: true,
                                title: `Bukti Transfer Transport - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                                url: rekap.buktiPembayaranTransport
                              })}
                              className="text-xs text-purple-700 hover:text-purple-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-purple-50 px-2 py-0.5 rounded border border-purple-200 w-full justify-center transition-colors"
                            >
                              ✓ Transport
                            </button>
                          ) : null}
                          {rekap.filePdf ? (
                            <button 
                              type="button"
                              onClick={() => setPreviewModal({
                                isOpen: true,
                                title: `Dokumen PDF TTD - ${rekap.fasilitator?.namaLengkap || 'Fasilitator'} (${rekap.bulan})`,
                                url: rekap.filePdf
                              })}
                              className="text-xs text-blue-700 hover:text-blue-900 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-full justify-center transition-colors"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>PDF TTD</span>
                            </button>
                          ) : null}
                          {(rekap.status === 'SUBMITTED' || rekap.status === 'APPROVED') && (
                            <button 
                              onClick={() => { setUploadingRekap(rekap); setHonorFile(null); setTransportFile(null); setShowUploadModal(true); }}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-0.5 rounded transition-colors font-medium cursor-pointer w-full mt-0.5"
                            >
                              {rekap.buktiPembayaranHonor && rekap.buktiPembayaranTransport ? 'Ganti Bukti' : 'Upload Bukti'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 9. Aksi (Menu Tersusun Secara Vertikal) */}
                      <td className="py-3 px-3 align-top text-right">
                        {(rekap.status === 'SUBMITTED' || rekap.status === 'APPROVED') && (
                          <div className="flex flex-col gap-1.5 w-32 ml-auto">
                            {/* Tombol Utama: Cetak / Invoice */}
                            <button 
                              type="button"
                              onClick={() => openKopModal(rekap)}
                              disabled={loadingId === rekap.id}
                              className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-slate-900 text-white hover:bg-slate-800 rounded-md px-2 py-1.5 font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                              title="Buat invoice dan cetak dokumen rekap honorarium"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{loadingId === rekap.id ? 'Memproses...' : 'Invoice & Cetak'}</span>
                            </button>

                            {/* Tombol Edit Transport */}
                            <button 
                              type="button"
                              onClick={() => openEditTransportModal(rekap)} 
                              className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer" 
                              title="Edit Biaya Transport Rekap"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit Transport</span>
                            </button>

                            {/* Tombol Salin Data */}
                            <button 
                              type="button"
                              onClick={() => handleCopyText(rekap)} 
                              className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer" 
                              title="Salin rincian data pembayaran ke clipboard"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Data</span>
                            </button>

                            {/* Tombol Tautkan Laporan */}
                            <button 
                              type="button"
                              onClick={() => handleSync(rekap.id)} 
                              className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer" 
                              title="Tautkan laporan mingguan fasilitator yang telat ke rekap ini (Tidak merubah honor)"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>Tautkan</span>
                            </button>

                            {/* Tombol Hapus */}
                            <button 
                              type="button"
                              onClick={() => handleDelete(rekap.id)} 
                              className="w-full inline-flex items-center justify-center gap-1.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md px-2 py-1 font-medium transition-colors cursor-pointer"
                              title="Hapus Rekapitulasi Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
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
                <label className="block text-sm font-medium mb-2">2. Bukti Transfer Transportasi (Rp {formatCurrency(hitungTotalTransportRekap(uploadingRekap))})</label>
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
                      urlHonor = await uploadFileClient(honorFile, 'receipts');
                    }
                    if (transportFile) {
                      urlTransport = await uploadFileClient(transportFile, 'receipts');
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

      {showKopModal && selectedRekap && (() => {
        const existingInv = getInvHonor(selectedRekap);
        const existingKwH = getKwHonor(selectedRekap);
        const existingKwT = getKwTransport(selectedRekap);

        const hasExistingInv = !!(existingInv?.noInvoice && !existingInv.noInvoice.includes('TEMP'));
        const hasExistingKwH = !!(existingKwH?.noKwitansi && !existingKwH.noKwitansi.includes('TEMP'));
        const hasExistingKwT = !!(existingKwT?.noKwitansi && !existingKwT.noKwitansi.includes('TEMP'));

        const needsInput = 
          (printCheckInvoice && (!hasExistingInv || isUnlockedInvoice)) ||
          (printCheckHonor && (!hasExistingKwH || isUnlockedHonor)) ||
          (printCheckTransport && (!hasExistingKwT || isUnlockedTransport));

        const isAllLocked = 
          (!printCheckInvoice || (hasExistingInv && !isUnlockedInvoice)) &&
          (!printCheckHonor || (hasExistingKwH && !isUnlockedHonor)) &&
          (!printCheckTransport || (hasExistingKwT && !isUnlockedTransport));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Export Dokumen Rekap Honorarium</h3>
                  <p className="text-xs text-slate-500">
                    {selectedRekap.fasilitator?.namaLengkap} &bull; Periode {selectedRekap.bulan}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKopModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Checkboxes Dokumen */}
                <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Pilih Dokumen yang Dicetak:</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printCheckInvoice} 
                        onChange={e => setPrintCheckInvoice(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span>Invoice Honorarium</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printCheckHonor} 
                        onChange={e => setPrintCheckHonor(e.target.checked)} 
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span>Kwitansi Honorarium (Sesi Mengajar)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printCheckTransport} 
                        onChange={e => setPrintCheckTransport(e.target.checked)} 
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span>Kwitansi Transport (Bulanan)</span>
                    </label>
                  </div>
                </div>

                {/* Status Booking: Invoice */}
                {printCheckInvoice && (
                  hasExistingInv && !isUnlockedInvoice ? (
                    <div className="p-3 border border-blue-200 bg-blue-50/60 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Invoice Honorarium (Nomor Ter-booking)</span>
                        </div>
                        <Badge className="bg-blue-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-blue-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500 font-sans">No. Invoice:</span>
                          <span className="font-bold text-blue-800">{existingInv.noInvoice}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tanggal Terdaftar:</span>
                          <span className="text-slate-800 font-medium">
                            {new Date(existingInv.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-blue-800/80">Nomor ini telah dibooking permanen.</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                              setIsUnlockedInvoice(true);
                            }
                          }}
                          className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Buka Kunci / Generate Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    isUnlockedInvoice && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                        <span>⚠️ Nomor Invoice sedang dibuka kuncinya untuk generate nomor baru.</span>
                        <button
                          type="button"
                          onClick={() => setIsUnlockedInvoice(false)}
                          className="underline hover:text-amber-950 font-medium ml-2 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )
                  )
                )}

                {/* Status Booking: Kwitansi Honor */}
                {printCheckHonor && (
                  hasExistingKwH && !isUnlockedHonor ? (
                    <div className="p-3 border border-emerald-200 bg-emerald-50/60 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" />
                          <span>Kwitansi Honorarium (Nomor Ter-booking)</span>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500 font-sans">No. Kwitansi:</span>
                          <span className="font-bold text-emerald-800">{existingKwH.noKwitansi}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tanggal Terdaftar:</span>
                          <span className="text-slate-800 font-medium">
                            {new Date(existingKwH.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-800/80">Nomor ini telah dibooking permanen.</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                              setIsUnlockedHonor(true);
                            }
                          }}
                          className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Buka Kunci / Generate Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    isUnlockedHonor && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                        <span>⚠️ Nomor Kwitansi Honor sedang dibuka kuncinya untuk generate baru.</span>
                        <button
                          type="button"
                          onClick={() => setIsUnlockedHonor(false)}
                          className="underline hover:text-amber-950 font-medium ml-2 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )
                  )
                )}

                {/* Status Booking: Kwitansi Transport */}
                {printCheckTransport && (
                  hasExistingKwT && !isUnlockedTransport ? (
                    <div className="p-3 border border-emerald-200 bg-emerald-50/60 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" />
                          <span>Kwitansi Transport (Nomor Ter-booking)</span>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500 font-sans">No. Kwitansi:</span>
                          <span className="font-bold text-emerald-800">{existingKwT.noKwitansi}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tanggal Terdaftar:</span>
                          <span className="text-slate-800 font-medium">
                            {new Date(existingKwT.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-800/80">Nomor ini telah dibooking permanen.</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                              setIsUnlockedTransport(true);
                            }
                          }}
                          className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Buka Kunci / Generate Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    isUnlockedTransport && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                        <span>⚠️ Nomor Kwitansi Transport sedang dibuka kuncinya untuk generate baru.</span>
                        <button
                          type="button"
                          onClick={() => setIsUnlockedTransport(false)}
                          className="underline hover:text-amber-950 font-medium ml-2 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    )
                  )
                )}

                {/* Pilih Kop Surat (Khusus Invoice) */}
                {printCheckInvoice && (
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-xs font-semibold text-slate-700 block">Pilih Kop Surat (Khusus Invoice):</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                        <input 
                          type="radio" 
                          name="kopTypeRekap" 
                          checked={printKopType === 'maleo'} 
                          onChange={() => setPrintKopType('maleo')} 
                          className="w-3.5 h-3.5 text-blue-600" 
                        />
                        <span>Yayasan Maleo</span>
                      </label>
                      <label className="flex items-center space-x-1.5 text-xs cursor-pointer">
                        <input 
                          type="radio" 
                          name="kopTypeRekap" 
                          checked={printKopType === 'robotic'} 
                          onChange={() => setPrintKopType('robotic')} 
                          className="w-3.5 h-3.5 text-blue-600" 
                        />
                        <span>Robotic Explorer</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Input jika ada dokumen yang belum terbooking atau sedang dibuka kunci */}
                {needsInput && (
                  <div className="space-y-3 pt-3 border-t">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Konfigurasi Generate Nomor Baru
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nomor Urut <span className="text-slate-400 font-normal">(Kosongkan untuk nomor otomatis Sheets)</span>
                      </label>
                      <input 
                        type="text" 
                        value={inputNoUrut}
                        onChange={(e) => setInputNoUrut(e.target.value)}
                        placeholder="Contoh: 001, 002... (atau kosongkan)"
                        className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tanggal Dokumen <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        value={inputTanggal}
                        onChange={(e) => setInputTanggal(e.target.value)}
                        className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end items-center gap-2 pt-3 border-t">
                <button 
                  type="button"
                  onClick={() => setShowKopModal(false)} 
                  className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  disabled={isGeneratingPdf}
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={generatePdfDirect}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>
                      {isAllLocked 
                        ? 'Export PDF (No. Tersimpan)' 
                        : 'Export PDF (Generate Baru)'
                      }
                    </span>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    if (!selectedRekap) return;
                    setIsGeneratingPdf(true);
                    try {
                      let htmlString = "";
                      
                      if (printCheckInvoice) {
                        const forceNewInv = isUnlockedInvoice;
                        const invRecord = await generateInvoiceHonorRecord(
                          selectedRekap.id, 
                          isUnlockedInvoice ? inputNoUrut : undefined, 
                          isUnlockedInvoice ? inputTanggal : undefined, 
                          forceNewInv
                        );
                        if (invRecord?.error) throw new Error(invRecord.error);
                        htmlString += getInvoiceHtml(selectedRekap, printKopType, invRecord);
                      }
                      
                      if (printCheckHonor) {
                        const forceNewKw = isUnlockedHonor;
                        const record = await generateKwitansiHonor(
                          selectedRekap.id, 
                          isUnlockedHonor ? inputNoUrut : undefined, 
                          isUnlockedHonor ? inputTanggal : undefined, 
                          forceNewKw
                        );
                        if (record.error) throw new Error(record.error);
                        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
                      }
                      
                      let transportNoUrut = isUnlockedTransport ? inputNoUrut : undefined;
                      if (isUnlockedTransport && printCheckHonor && inputNoUrut) {
                        const num = parseInt(inputNoUrut, 10);
                        if (!isNaN(num)) transportNoUrut = (num + 1).toString();
                        else transportNoUrut = inputNoUrut + "-T";
                      }
                      
                      if (printCheckTransport) {
                        const forceNewTrans = isUnlockedTransport;
                        const record = await generateKwitansiTransportBulanan(
                          selectedRekap.id, 
                          transportNoUrut, 
                          isUnlockedTransport ? inputTanggal : undefined, 
                          forceNewTrans
                        );
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
                            <title>Print Dokumen - ${selectedRekap.fasilitator?.namaLengkap} - ${selectedRekap.bulan}</title>
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
                                }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setShowKopModal(false);
                      router.refresh();
                    } catch (err: any) {
                      console.error('GENERATE PRINT ERROR', err, err.stack);
                      alert("Gagal print: " + err.message);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf || (!printCheckInvoice && !printCheckHonor && !printCheckTransport)}
                  className="px-4 py-2 text-xs bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghubungkan ke Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>
                        {isAllLocked 
                          ? 'Cetak Dokumen (Gunakan No. Tersimpan)' 
                          : 'Generate Nomor & Cetak Sekarang'
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
      
      {/* Modal Edit Transport Rekap */}
      {editingTransportRekap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Biaya Transport Rekap</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingTransportRekap.fasilitator?.namaLengkap} &bull; Bulan {editingTransportRekap.bulan}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTransportRekap(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Standar Fasilitator:</span>
                  <span className="font-semibold">{formatCurrency(editingTransportRekap.fasilitator?.besaranTransport || 120000)} / sesi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah Pertemuan:</span>
                  <span className="font-semibold">{editingTransportRekap.jumlahSesi || 4} Sesi ({editingTransportRekap.laporan?.length || 0} Terlapor)</span>
                </div>
                {editingTransportRekap.totalTransport !== null && editingTransportRekap.totalTransport !== undefined && (
                  <div className="text-amber-700 font-medium pt-1 border-t">
                    Status: Nominal saat ini telah disesuaikan manual oleh Admin.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Total Transport (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                  <input 
                    type="number"
                    min="0"
                    value={transportAmountInput}
                    onChange={e => setTransportAmountInput(e.target.value)}
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    placeholder="Masukkan nominal transport..."
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nominal ini langsung tercatat sebagai total transport fasilitator pada invoice, kwitansi, dan rekap transfer.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t flex justify-between items-center gap-2">
              {editingTransportRekap.totalTransport !== null && editingTransportRekap.totalTransport !== undefined ? (
                <button
                  type="button"
                  onClick={handleResetTransportToSystem}
                  disabled={isSavingTransport}
                  className="text-xs text-red-600 hover:underline"
                >
                  Reset ke Sistem
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTransportRekap(null)}
                  disabled={isSavingTransport}
                  className="px-4 py-2 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransport}
                  disabled={isSavingTransport}
                  className="px-4 py-2 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isSavingTransport ? 'Menyimpan...' : 'Simpan Transport'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Bukti Transfer / PDF */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        title={previewModal.title}
        url={previewModal.url}
      />

    </div>
  )
}
