'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { updatePaketIoT, autoSetPaketRealisasi, importExcelPaketIoT } from '@/app/actions/iot'
import { DEFAULT_51_IOT_ITEMS, STANDARD_8_KELOMPOK } from '@/lib/iot-constants'
import { generateRabIotHtml, generateTandaTerimaIotHtml } from '@/lib/pdf-iot-templates'
import { uploadFileClient } from '@/lib/upload-client'
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Coins, 
  Package, 
  FileCheck, 
  Upload, 
  Loader2,
  AlertCircle,
  Zap,
  FileSpreadsheet,
  Check,
  X
} from 'lucide-react'

export function AlatBahanIotDetailClient({ 
  initialPaket, 
  fasilitators = [] 
}: { 
  initialPaket: any, 
  fasilitators: any[] 
}) {
  const router = useRouter()
  const [paket, setPaket] = useState<any>(initialPaket)
  const [activeTab, setActiveTab] = useState<'items' | 'groups' | 'parties' | 'receipts'>('items')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Auto-Set Realisasi Modal State
  const [showAutoSetModal, setShowAutoSetModal] = useState(false)
  const [autoSetTotalInput, setAutoSetTotalInput] = useState<number>(3130800)
  const [isAutoSetting, setIsAutoSetting] = useState(false)

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingExcel, setIsImportingExcel] = useState(false)

  // Form State for Surat & Parties
  const [headerForm, setHeaderForm] = useState({
    lokasiSNT: paket.lokasiSNT || '',
    namaPaket: paket.namaPaket || '',
    lingkupProyek: paket.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
    nomorSurat: paket.nomorSurat || '',
    tanggalSurat: paket.tanggalSurat ? new Date(paket.tanggalSurat).toISOString().split('T')[0] : '',
    pihakPertamaNama: paket.pihakPertamaNama || 'Jully Tjindrawan, MBA',
    pihakPertamaJabatan: paket.pihakPertamaJabatan || 'Koordinator Wilayah 2, Program SNT',
    pihakPertamaInstansi: paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik (Robotic Explorer)',
    fasilitatorId: paket.fasilitatorId || '',
    pihakKeduaNama: paket.pihakKeduaNama || '',
    pihakKeduaJabatan: paket.pihakKeduaJabatan || 'Fasilitator Koding, KA & Robotika',
    pihakKeduaSekolah: paket.pihakKeduaSekolah || paket.lokasiSNT || '',
    pihakKeduaAlamat: paket.pihakKeduaAlamat || '',
    mengetahuiNama: paket.mengetahuiNama || '',
    mengetahuiNip: paket.mengetahuiNip || '',
    mengetahuiJabatan: paket.mengetahuiJabatan || 'Kepala SNT',
    persenCadangan: paket.persenCadangan !== undefined ? paket.persenCadangan : 10,
    status: paket.status || 'DRAFT',
    catatan: paket.catatan || '',
    lampiranNotaUrl: paket.lampiranNotaUrl || ''
  })

  // Items State (Array of items)
  const [items, setItems] = useState<any[]>(
    (paket.items && paket.items.length > 0)
      ? paket.items.map((it: any) => ({
          ...it,
          volume: Number(it.volume) || 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          diterima: it.diterima !== undefined ? it.diterima : true
        }))
      : DEFAULT_51_IOT_ITEMS.map((it: any, idx: number) => ({
          ...it,
          id: `temp-${idx}`,
          volume: Number(it.volume) || 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          diterima: true
        }))
  )

  // Live Summary Calculations
  const subtotalRAB = useMemo(() => {
    return items.reduce((sum, it) => sum + ((Number(it.volume) || 0) * (Number(it.hargaSatuanRAB) || 0)), 0)
  }, [items])

  const persenCadangan = Number(headerForm.persenCadangan) || 10
  const nominalCadangan = Math.round(subtotalRAB * (persenCadangan / 100))
  const totalPaguRAB = subtotalRAB + nominalCadangan

  const totalRealisasi = useMemo(() => {
    return items.reduce((sum, it) => sum + ((Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)), 0)
  }, [items])

  const selisihAnggaran = totalPaguRAB - totalRealisasi

  // 8 Kelompok Belanja Calculations
  const groupSummaries = useMemo(() => {
    const map: Record<string, { pagu: number; real: number; count: number }> = {}
    STANDARD_8_KELOMPOK.forEach(g => {
      map[g] = { pagu: 0, real: 0, count: 0 }
    })
    let extraPagu = 0
    let extraReal = 0

    items.forEach(it => {
      const cat = (it.kategori || '').trim()
      const found = STANDARD_8_KELOMPOK.find(g => g.toLowerCase() === cat.toLowerCase())
      const p = (Number(it.volume) || 0) * (Number(it.hargaSatuanRAB) || 0)
      const r = (Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)

      if (found) {
        map[found].pagu += p
        map[found].real += r
        map[found].count += 1
      } else {
        extraPagu += p
        extraReal += r
      }
    })

    return { map, extraPagu, extraReal }
  }, [items])

  // Handle Item Changes
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        kategori: 'Komponen Tambahan',
        namaBarang: '',
        satuan: 'Unit',
        volume: 1,
        hargaSatuanRAB: 0,
        hargaSatuanReal: 0,
        kemasan: '–',
        diterima: true,
        kondisiCatatan: ''
      }
    ])
  }

  const handleDeleteItem = (index: number) => {
    if (confirm('Hapus baris barang ini?')) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleResetTo51Default = () => {
    if (confirm('Kembalikan ke 51 item standar bawaan? Perubahan manual Anda akan ditimpa.')) {
      setItems(
        DEFAULT_51_IOT_ITEMS.map((it: any, idx: number) => ({
          ...it,
          id: `temp-${idx}`,
          volume: Number(it.volume) || 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          diterima: true
        }))
      )
    }
  }

  const handleSelectFasilitator = (fasilId: string) => {
    const f = fasilitators.find(item => item.id === fasilId)
    if (f) {
      setHeaderForm(prev => ({
        ...prev,
        fasilitatorId: fasilId,
        pihakKeduaNama: f.namaLengkap || prev.pihakKeduaNama,
        pihakKeduaSekolah: f.lokasiSNT || prev.pihakKeduaSekolah,
        pihakKeduaAlamat: `${f.alamat || ''}, ${f.kabKota || ''}, ${f.propinsi || ''}`.replace(/^[\s,]+|[\s,]+$/g, '') || prev.pihakKeduaAlamat
      }))
    } else {
      setHeaderForm(prev => ({ ...prev, fasilitatorId: '' }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await updatePaketIoT(paket.id, headerForm, items)
      if (res?.error) {
        alert('Gagal menyimpan: ' + res.error)
        return
      }

      alert('Berhasil menyimpan perubahan dan menyinkronkan ke Kategori RAB!')
      router.refresh()
      if (res?.updated) {
        setPaket(res.updated)
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Auto-Set Realisasi
  const handleAutoSetSubmit = async () => {
    if (!autoSetTotalInput || autoSetTotalInput <= 0) {
      alert('Masukkan nominal total belanja yang valid!')
      return
    }

    setIsAutoSetting(true)
    try {
      const res = await autoSetPaketRealisasi(paket.id, Number(autoSetTotalInput))
      if (res?.error) {
        alert('Gagal auto-set realisasi: ' + res.error)
        return
      }

      alert(`Berhasil! Realisasi ${formatCurrency(autoSetTotalInput)} telah diset dan disinkronkan ke Kategori RAB.`)
      setShowAutoSetModal(false)
      window.location.reload()
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setIsAutoSetting(false)
    }
  }

  // Handle Excel Upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImportingExcel(true)
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const b64 = (evt.target?.result as string).split(',')[1]
          const res = await importExcelPaketIoT(paket.id, b64)
          if (res?.error) {
            alert('Gagal mengimpor Excel: ' + res.error)
            return
          }
          alert(`Berhasil mengimpor file Excel!\n• ${res.matchedCount} item berhasil dicocokkan\n• ${res.extraCount} item tambahan/ongkir dicatat\n• Total realisasi belanja: ${formatCurrency(res.totalPengeluaran || 0)}`)
          window.location.reload()
        } catch (innerErr: any) {
          alert('Gagal memproses file: ' + innerErr.message)
        } finally {
          setIsImportingExcel(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert('Gagal membaca file: ' + err.message)
      setIsImportingExcel(false)
    }
  }

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadFileClient(file, 'receipts')
      setHeaderForm(prev => ({ ...prev, lampiranNotaUrl: url }))
      alert('Bukti nota berhasil diunggah! Jangan lupa klik tombol Simpan.')
    } catch (err: any) {
      alert('Gagal mengunggah nota: ' + (err.message || err))
    } finally {
      setIsUploading(false)
    }
  }

  const handlePrintTandaTerima = () => {
    const currentPaketData = {
      ...paket,
      ...headerForm,
      totalPaguRAB,
      totalRealisasi
    }
    const html = generateTandaTerimaIotHtml(currentPaketData, items)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const handlePrintRAB = () => {
    const currentPaketData = {
      ...paket,
      ...headerForm,
      totalPaguRAB,
      totalRealisasi
    }
    const html = generateRabIotHtml(currentPaketData, items)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Link
            href="/alat-bahan-iot"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Paket Alat &amp; Bahan IoT</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {headerForm.namaPaket || `Paket Pengadaan IoT - ${paket.lokasiSNT}`}
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
              {headerForm.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lokasi: <strong>{paket.lokasiSNT}</strong> • Terhubung ke Kategori RAB:{' '}
            <span className="font-semibold text-indigo-700">
              {paket.rabCategory?.name || 'Kategori Mandiri SNT'}
            </span>
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintTandaTerima}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak Surat Tanda Terima (Format Kupang)"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak Tanda Terima (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRAB}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak Rencana Anggaran Biaya (Format Tidore)"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen RAB (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan &amp; Sinkronkan RAB</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Subtotal Kebutuhan</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(subtotalRAB)}</span>
          <span className="text-[10px] text-slate-400">Total belanja murni</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[11px] font-semibold uppercase text-slate-500 block">Cadangan ({persenCadangan}%)</span>
          <span className="text-base font-bold text-slate-700 mt-0.5 block">{formatCurrency(nominalCadangan)}</span>
          <span className="text-[10px] text-slate-400">Antisipasi selisih/ongkir</span>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3">
          <span className="text-[11px] font-semibold uppercase text-indigo-700 block">Total Pagu RAB</span>
          <span className="text-base font-bold text-indigo-900 mt-0.5 block">{formatCurrency(totalPaguRAB)}</span>
          <span className="text-[10px] text-indigo-600">Alokasi pagu Kategori SNT</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 block">Realisasi Tanda Terima</span>
          <span className="text-base font-bold text-emerald-800 mt-0.5 block">{formatCurrency(totalRealisasi)}</span>
          <span className="text-[10px] text-emerald-600">{items.length} item serah terima</span>
        </div>

        <div className={`col-span-2 md:col-span-1 border rounded-lg p-3 ${selisihAnggaran < 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[11px] font-semibold uppercase block ${selisihAnggaran < 0 ? 'text-rose-700' : 'text-slate-500'}`}>
            Sisa Saldo Pagu
          </span>
          <span className={`text-base font-bold mt-0.5 block ${selisihAnggaran < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(selisihAnggaran)}
          </span>
          <span className={`text-[10px] ${selisihAnggaran < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {selisihAnggaran < 0 ? 'Realisasi melebihi pagu' : 'Sisa anggaran aman'}
          </span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Rincian Item Alat &amp; Bahan ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'groups'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>2. Ringkasan 8 Pos Kelompok RAB</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'parties'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Pihak Penandatangan &amp; Info Surat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'receipts'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>4. Lampiran Bukti Nota Belanja</span>
        </button>
      </div>

      {/* TAB 1: ITEMS EDITOR */}
      {activeTab === 'items' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Tabel Rincian Alat &amp; Bahan Robotika ({items.length} Item)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Kelola nama barang, kategori, volume, harga rencana (RAB), harga realisasi belanja, kemasan box, dan kondisi barang.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* TOMBOL AUTO-SET REALISASI */}
              <button
                type="button"
                onClick={() => setShowAutoSetModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                title="Input total belanja langsung tanpa input 51 item satu-per-satu"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Auto-Set Realisasi</span>
              </button>

              {/* TOMBOL IMPORT EXCEL */}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                {isImportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                <span>{isImportingExcel ? 'Mengimpor...' : '📥 Import Excel (xlsx)'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  disabled={isImportingExcel}
                />
              </label>

              <button
                type="button"
                onClick={handleResetTo51Default}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold transition-colors"
                title="Muat ulang 51 item bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset 51 Item Bawaan</span>
              </button>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris</span>
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 z-10 border-b text-[11px] shadow-xs">
                  <tr>
                    <th className="px-3 py-2.5 text-center" style={{ width: '35px' }}>No</th>
                    <th className="px-3 py-2.5" style={{ width: '140px' }}>Kategori</th>
                    <th className="px-3 py-2.5" style={{ minWidth: '220px' }}>Nama Alat dan Bahan</th>
                    <th className="px-3 py-2.5 text-center" style={{ width: '70px' }}>Satuan</th>
                    <th className="px-3 py-2.5 text-center" style={{ width: '65px' }}>Vol</th>
                    <th className="px-3 py-2.5 text-right" style={{ width: '110px' }}>Harga RAB</th>
                    <th className="px-3 py-2.5 text-right" style={{ width: '110px' }}>Total RAB</th>
                    <th className="px-3 py-2.5 text-right bg-emerald-50/80 text-emerald-900" style={{ width: '115px' }}>Harga Beli Real</th>
                    <th className="px-3 py-2.5 text-right bg-emerald-50/80 text-emerald-900" style={{ width: '115px' }}>Total Real</th>
                    <th className="px-3 py-2.5 text-center" style={{ width: '110px' }}>Kemasan</th>
                    <th className="px-3 py-2.5 text-center" style={{ width: '75px' }}>Diterima</th>
                    <th className="px-3 py-2.5" style={{ minWidth: '150px' }}>Kondisi / Catatan</th>
                    <th className="px-2 py-2.5 text-center" style={{ width: '45px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {items.map((it, idx) => {
                    const rowTotalRAB = (Number(it.volume) || 0) * (Number(it.hargaSatuanRAB) || 0)
                    const rowTotalReal = (Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)

                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={it.kategori || ''}
                            onChange={e => handleItemChange(idx, 'kategori', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Kategori"
                          />
                        </td>

                        <td className="px-3 py-2 font-sans">
                          <input
                            type="text"
                            value={it.namaBarang || ''}
                            onChange={e => handleItemChange(idx, 'namaBarang', e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Nama alat/bahan..."
                          />
                        </td>

                        <td className="px-3 py-2 font-sans">
                          <input
                            type="text"
                            value={it.satuan || ''}
                            onChange={e => handleItemChange(idx, 'satuan', e.target.value)}
                            className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Satuan"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.volume}
                            onChange={e => handleItemChange(idx, 'volume', Number(e.target.value))}
                            className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={it.hargaSatuanRAB}
                            onChange={e => handleItemChange(idx, 'hargaSatuanRAB', Number(e.target.value))}
                            className="w-full text-xs text-right bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          {formatCurrency(rowTotalRAB)}
                        </td>

                        <td className="px-3 py-2 text-right bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            value={it.hargaSatuanReal}
                            onChange={e => handleItemChange(idx, 'hargaSatuanReal', Number(e.target.value))}
                            className="w-full text-xs text-right bg-white border border-emerald-300 rounded px-2 py-1 text-emerald-950 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-emerald-800 bg-emerald-50/30">
                          {formatCurrency(rowTotalReal)}
                        </td>

                        <td className="px-3 py-2 font-sans">
                          <input
                            type="text"
                            value={it.kemasan || ''}
                            onChange={e => handleItemChange(idx, 'kemasan', e.target.value)}
                            className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Box 1 / –"
                          />
                        </td>

                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={it.diterima !== false}
                            onChange={e => handleItemChange(idx, 'diterima', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                        </td>

                        <td className="px-3 py-2 font-sans">
                          <input
                            type="text"
                            value={it.kondisiCatatan || ''}
                            onChange={e => handleItemChange(idx, 'kondisiCatatan', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Kondisi barang..."
                          />
                        </td>

                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 font-mono font-bold text-xs sticky bottom-0 z-10 shadow-xs">
                  <tr>
                    <td colSpan={6} className="px-3 py-2.5 text-right uppercase">
                      Subtotal (51+ Item):
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-900">
                      {formatCurrency(subtotalRAB)}
                    </td>
                    <td className="px-3 py-2.5 text-right uppercase text-emerald-900 bg-emerald-100/50">
                      Subtotal Real:
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-900 bg-emerald-100/50">
                      {formatCurrency(totalRealisasi)}
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 text-right font-sans font-medium text-[11px] text-slate-500">
                      {items.filter(i => i.diterima !== false).length} dari {items.length} item diterima
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: RINGKASAN 8 POS KELOMPOK RAB */}
      {activeTab === 'groups' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Ringkasan 8 Pos Kelompok Belanja (Sinkronisasi ke Dashboard RAB)</span>
              <Badge className="bg-indigo-100 text-indigo-800 font-bold text-xs">
                {paket.rabCategory?.name || 'Kategori Mandiri SNT'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Format ini yang langsung ditampilkan sebagai rincian item RAB pada kartu Kategori SNT di Dashboard Utama.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-100 text-slate-700 uppercase border-b text-[11px]">
                  <tr>
                    <th className="px-4 py-3" style={{ width: '50px' }}>Kode</th>
                    <th className="px-4 py-3 font-sans" style={{ minWidth: '220px' }}>Kelompok Belanja</th>
                    <th className="px-4 py-3 text-center" style={{ width: '100px' }}>Jumlah Item</th>
                    <th className="px-4 py-3 text-right" style={{ width: '150px' }}>Pagu Anggaran</th>
                    <th className="px-4 py-3 text-right bg-emerald-50 text-emerald-900" style={{ width: '150px' }}>Realisasi Belanja</th>
                    <th className="px-4 py-3 text-right" style={{ width: '150px' }}>Sisa Saldo</th>
                    <th className="px-4 py-3 text-center font-sans" style={{ width: '120px' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {STANDARD_8_KELOMPOK.map((gName, idx) => {
                    const st = groupSummaries.map[gName] || { pagu: 0, real: 0, count: 0 }
                    const diff = st.pagu - st.real
                    const isOver = diff < 0

                    return (
                      <tr key={gName} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-bold text-slate-600">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">{gName}</td>
                        <td className="px-4 py-2.5 text-center text-slate-600">{st.count} item</td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">{formatCurrency(st.pagu)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-800 bg-emerald-50/40">{formatCurrency(st.real)}</td>
                        <td className={`px-4 py-2.5 text-right font-bold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatCurrency(diff)}
                        </td>
                        <td className="px-4 py-2.5 text-center font-sans">
                          {isOver ? (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold">Overbudget</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Aman</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Baris Cadangan 10% / Ongkir */}
                  <tr className="bg-amber-50/40 hover:bg-amber-50/70">
                    <td className="px-4 py-2.5 font-bold text-amber-900">9</td>
                    <td className="px-4 py-2.5 font-sans font-semibold text-amber-950">
                      Cadangan {persenCadangan}% / Ongkir &amp; Layanan
                    </td>
                    <td className="px-4 py-2.5 text-center text-amber-800 font-sans">Plafon {persenCadangan}%</td>
                    <td className="px-4 py-2.5 text-right font-medium text-amber-900">{formatCurrency(nominalCadangan)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-800 bg-emerald-50/40">
                      {formatCurrency(groupSummaries.extraReal)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                      {formatCurrency(nominalCadangan - groupSummaries.extraReal)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">Cadangan</Badge>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 font-mono font-bold text-xs sticky bottom-0">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase">
                      Total Pagu vs Realisasi:
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-900 font-black">
                      {formatCurrency(totalPaguRAB)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-900 bg-emerald-100/60 font-black">
                      {formatCurrency(totalRealisasi)}
                    </td>
                    <td className={`px-4 py-3 text-right font-black ${selisihAnggaran < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatCurrency(selisihAnggaran)}
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      <Badge className={selisihAnggaran < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}>
                        {selisihAnggaran < 0 ? 'Defisit' : 'Surplus'}
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SURAT & TANDA TANGAN */}
      {activeTab === 'parties' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Konfigurasi Surat &amp; Pihak Penandatangan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Informasi ini akan tercetak otomatis pada berkas Surat Tanda Terima dan Dokumen RAB resmi.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Surat</label>
                <input
                  type="text"
                  value={headerForm.nomorSurat}
                  onChange={e => setHeaderForm(prev => ({ ...prev, nomorSurat: e.target.value }))}
                  className="w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Contoh: 01/RE/SNT-K2/X/2026"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tanggal Surat</label>
                <input
                  type="date"
                  value={headerForm.tanggalSurat}
                  onChange={e => setHeaderForm(prev => ({ ...prev, tanggalSurat: e.target.value }))}
                  className="w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cadangan Tak Terduga (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={headerForm.persenCadangan}
                  onChange={e => setHeaderForm(prev => ({ ...prev, persenCadangan: Number(e.target.value) }))}
                  className="w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* PIHAK PERTAMA */}
              <div className="bg-slate-50/60 border rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase block tracking-wider text-blue-700">
                  PIHAK PERTAMA (Yang Menyerahkan - Korwil)
                </span>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={headerForm.pihakPertamaNama}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakPertamaNama: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={headerForm.pihakPertamaJabatan}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakPertamaJabatan: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Instansi</label>
                  <input
                    type="text"
                    value={headerForm.pihakPertamaInstansi}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakPertamaInstansi: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
              </div>

              {/* PIHAK KEDUA */}
              <div className="bg-slate-50/60 border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase block tracking-wider text-emerald-700">
                    PIHAK KEDUA (Yang Menerima - Fasilitator)
                  </span>
                  <select
                    value={headerForm.fasilitatorId}
                    onChange={e => handleSelectFasilitator(e.target.value)}
                    className="text-[11px] border rounded px-1.5 py-0.5 bg-white text-slate-600"
                  >
                    <option value="">Pilih Profil Fasilitator</option>
                    {fasilitators.map(f => (
                      <option key={f.id} value={f.id}>{f.namaLengkap} ({f.lokasiSNT})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Nama Lengkap Fasilitator</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaNama}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakKeduaNama: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaJabatan}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakKeduaJabatan: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Lokasi / Sekolah SNT</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaSekolah}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakKeduaSekolah: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Alamat SNT</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaAlamat}
                    onChange={e => setHeaderForm(prev => ({ ...prev, pihakKeduaAlamat: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* MENGETAHUI KEPALA SEKOLAH */}
            <div className="bg-slate-50/60 border rounded-xl p-4 space-y-3 pt-4">
              <span className="text-xs font-bold text-slate-900 uppercase block tracking-wider text-slate-700">
                MENGETAHUI (Kepala Sekolah SNT)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Nama Kepala SNT</label>
                  <input
                    type="text"
                    value={headerForm.mengetahuiNama}
                    onChange={e => setHeaderForm(prev => ({ ...prev, mengetahuiNama: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                    placeholder="Contoh: Drs. H. Muhammad, M.Pd"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">NIP Kepala SNT</label>
                  <input
                    type="text"
                    value={headerForm.mengetahuiNip}
                    onChange={e => setHeaderForm(prev => ({ ...prev, mengetahuiNip: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                    placeholder="Contoh: 19700101 199503 1 002 atau –"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-0.5">Jabatan Mengetahui</label>
                  <input
                    type="text"
                    value={headerForm.mengetahuiJabatan}
                    onChange={e => setHeaderForm(prev => ({ ...prev, mengetahuiJabatan: e.target.value }))}
                    className="w-full text-xs border rounded p-1.5 bg-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: LAMPIRAN NOTA BELANJA */}
      {activeTab === 'receipts' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Bukti Nota Belanja &amp; Status Pengadaan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Lampirkan file nota gabungan (PDF/foto) dan atur status pengadaan barang ke sekolah.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status Pengadaan</label>
                  <select
                    value={headerForm.status}
                    onChange={e => setHeaderForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full text-xs border rounded-lg p-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="DRAFT">DRAFT (Penyusunan Rencana)</option>
                    <option value="DIKIRIM">DIKIRIM (Dalam Pengiriman ke SNT)</option>
                    <option value="DITERIMA">DITERIMA (Sudah Diterima &amp; Diverifikasi Sekolah)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Tambahan Pengadaan</label>
                  <textarea
                    rows={6}
                    value={headerForm.catatan}
                    onChange={e => setHeaderForm(prev => ({ ...prev, catatan: e.target.value }))}
                    className="w-full text-xs border rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="Catatan belanja, ekspedisi pengiriman, nomor resi, toko offline, dll..."
                  />
                </div>
              </div>

              <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/50 flex flex-col justify-center items-center text-center">
                <FileCheck className="w-10 h-10 text-emerald-600 mb-2" />
                <h4 className="font-bold text-sm text-slate-800">Lampiran File Bukti Nota Belanja</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                  Unggah file PDF gabungan nota atau foto struk pembelian belanja alat &amp; bahan IoT.
                </p>

                {headerForm.lampiranNotaUrl ? (
                  <div className="space-y-2">
                    <a
                      href={headerForm.lampiranNotaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat File Nota Terunggah</span>
                    </a>
                    <div>
                      <label className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                        Ganti File Nota
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleUploadReceipt}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-xs">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{isUploading ? 'Mengunggah File...' : 'Pilih File Nota'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleUploadReceipt}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL DIALOG AUTO-SET REALISASI */}
      {showAutoSetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <Zap className="w-5 h-5" />
                <h3>Auto-Set Realisasi Belanja IoT</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoSetModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Masukkan total belanja riil (dari struk/nota toko). Sistem akan otomatis mendistribusikan angka ini ke seluruh 51 item rincian serta menyinkronkannya ke 8 kelompok belanja di Dashboard RAB.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Total Belanja Riil (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={autoSetTotalInput}
                  onChange={e => setAutoSetTotalInput(Number(e.target.value))}
                  className="w-full border-2 border-emerald-400 rounded-lg p-2.5 text-base font-bold font-mono text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: 3130800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Terbilang: {terbilangRupiah(autoSetTotalInput).toLowerCase()}
                </span>
              </div>

              <div className="bg-slate-50 border rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pagu RAB Saat Ini:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(totalPaguRAB)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimasi Selisih:</span>
                  <span className={`font-bold ${totalPaguRAB - autoSetTotalInput < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatCurrency(totalPaguRAB - autoSetTotalInput)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAutoSetModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  disabled={isAutoSetting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAutoSetSubmit}
                  disabled={isAutoSetting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isAutoSetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isAutoSetting ? 'Menerapkan...' : 'Terapkan &amp; Sinkronkan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
