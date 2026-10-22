'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { updatePaketIoT } from '@/app/actions/iot'
import { DEFAULT_51_IOT_ITEMS } from '@/lib/iot-constants'
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
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'items' | 'parties' | 'receipts'>('items')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
        kondisiCatatan: 'Baik'
      }
    ])
  }

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      alert('Minimal harus ada 1 item barang.')
      return
    }
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleResetTo51Default = () => {
    if (confirm('Muat ulang 51 item bawaan standar? Perubahan custom pada item yang ada akan ditimpa dengan template default.')) {
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

      alert('Berhasil menyimpan perubahan dan menyinkronkan ke RAB Kategori D!')
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
            <span>Kembali ke Daftar Paket IoT</span>
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {headerForm.lokasiSNT}
            </h1>
            <Badge 
              variant="secondary"
              className={
                headerForm.status === 'DITERIMA' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : headerForm.status === 'DIKIRIM' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-slate-100 text-slate-700'
              }
            >
              {headerForm.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {headerForm.namaPaket} &bull; No: <span className="font-mono text-slate-700 font-medium">{headerForm.nomorSurat || '–'}</span>
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintTandaTerima}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak Surat Tanda Terima Resmi (Format Kupang)"
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
          <span className="text-[10px] text-indigo-600">Alokasi pagu Kategori D</span>
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
      <div className="flex border-b text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
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
          onClick={() => setActiveTab('parties')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'parties'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Pihak Penandatangan &amp; Info Surat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'receipts'
              ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>3. Lampiran Bukti Nota Belanja</span>
        </button>
      </div>

      {/* TAB 1: ITEMS EDITOR */}
      {activeTab === 'items' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Tabel Rincian Alat &amp; Bahan Robotika
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Kelola nama barang, kategori, volume, harga satuan rencana (RAB), harga realisasi (tanda terima), kemasan, dan status penerimaan.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
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
                <span>+ Tambah Baris Barang</span>
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 z-10 border-b text-[11px] shadow-xs">
                  <tr>
                    <th className="px-3 py-2.5 text-center" style="width: 35px;">No</th>
                    <th className="px-3 py-2.5" style="width: 140px;">Kategori</th>
                    <th className="px-3 py-2.5" style="min-width: 220px;">Nama Alat dan Bahan</th>
                    <th className="px-3 py-2.5 text-center" style="width: 70px;">Satuan</th>
                    <th className="px-3 py-2.5 text-center" style="width: 65px;">Vol</th>
                    <th className="px-3 py-2.5 text-right" style="width: 110px;">Harga RAB</th>
                    <th className="px-3 py-2.5 text-right" style="width: 110px;">Total RAB</th>
                    <th className="px-3 py-2.5 text-right bg-emerald-50/80 text-emerald-900" style="width: 115px;">Harga Beli Real</th>
                    <th className="px-3 py-2.5 text-right bg-emerald-50/80 text-emerald-900" style="width: 115px;">Total Real</th>
                    <th className="px-3 py-2.5 text-center" style="width: 110px;">Kemasan</th>
                    <th className="px-3 py-2.5 text-center" style="width: 65px;">Diterima</th>
                    <th className="px-3 py-2.5" style="width: 130px;">Kondisi / Catatan</th>
                    <th className="px-2 py-2.5 text-center" style="width: 40px;"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const rowTotalRAB = (Number(it.volume) || 0) * (Number(it.hargaSatuanRAB) || 0)
                    const rowTotalReal = (Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)

                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={it.kategori || ''}
                            onChange={e => handleItemChange(idx, 'kategori', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-xs bg-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={it.namaBarang || ''}
                            onChange={e => handleItemChange(idx, 'namaBarang', e.target.value)}
                            placeholder="Nama alat/bahan"
                            className="w-full border rounded px-2 py-1 text-xs bg-white font-medium text-slate-900"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="text"
                            value={it.satuan || ''}
                            onChange={e => handleItemChange(idx, 'satuan', e.target.value)}
                            className="w-full border rounded px-1.5 py-1 text-xs text-center bg-white"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.volume ?? 1}
                            onChange={e => handleItemChange(idx, 'volume', parseFloat(e.target.value) || 0)}
                            className="w-full border rounded px-1.5 py-1 text-xs text-center bg-white font-bold"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={it.hargaSatuanRAB ?? 0}
                            onChange={e => handleItemChange(idx, 'hargaSatuanRAB', parseFloat(e.target.value) || 0)}
                            className="w-full border rounded px-2 py-1 text-xs text-right bg-white font-mono"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-indigo-900">
                          {new Intl.NumberFormat('id-ID').format(rowTotalRAB)}
                        </td>
                        <td className="px-3 py-2 text-right bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            value={it.hargaSatuanReal ?? 0}
                            onChange={e => handleItemChange(idx, 'hargaSatuanReal', parseFloat(e.target.value) || 0)}
                            className="w-full border rounded px-2 py-1 text-xs text-right bg-white font-mono font-medium text-emerald-800"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                          {new Intl.NumberFormat('id-ID').format(rowTotalReal)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={it.kemasan || ''}
                            onChange={e => handleItemChange(idx, 'kemasan', e.target.value)}
                            placeholder="– / Box 1 / Box 2"
                            className="w-full border rounded px-2 py-1 text-xs bg-white text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={it.diterima !== false}
                            onChange={e => handleItemChange(idx, 'diterima', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={it.kondisiCatatan || ''}
                            onChange={e => handleItemChange(idx, 'kondisiCatatan', e.target.value)}
                            placeholder="Baik / Lengkap"
                            className="w-full border rounded px-2 py-1 text-xs bg-white"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t text-xs">
                  <tr>
                    <td colSpan={6} className="px-3 py-2.5 text-right">Subtotal Murni:</td>
                    <td className="px-3 py-2.5 text-right font-mono text-indigo-900">{new Intl.NumberFormat('id-ID').format(subtotalRAB)}</td>
                    <td className="px-3 py-2.5 text-right bg-emerald-50 text-emerald-900">Total Realisasi:</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-900 bg-emerald-50">{new Intl.NumberFormat('id-ID').format(totalRealisasi)}</td>
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="bg-indigo-50/50">
                    <td colSpan={6} className="px-3 py-2.5 text-right text-indigo-900">Total Pagu RAB (+ Cadangan {persenCadangan}%):</td>
                    <td className="px-3 py-2.5 text-right font-mono text-indigo-900 text-sm">{new Intl.NumberFormat('id-ID').format(totalPaguRAB)}</td>
                    <td colSpan={6}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PARTIES & LETTER INFO */}
      {activeTab === 'parties' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Konfigurasi Surat &amp; Pihak Penandatangan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Data ini akan dicetak pada Surat Tanda Terima resmi dan dokumen RAB.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-xs">
            {/* SURAT METADATA */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 pb-1 border-b">1. Informasi Surat</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Tanda Terima</label>
                  <input
                    type="text"
                    value={headerForm.nomorSurat}
                    onChange={e => setHeaderForm({ ...headerForm, nomorSurat: e.target.value })}
                    placeholder="Contoh: 01/RE/SNT-K2/X/2026"
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    value={headerForm.tanggalSurat}
                    onChange={e => setHeaderForm({ ...headerForm, tanggalSurat: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cadangan Biaya RAB (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={headerForm.persenCadangan}
                    onChange={e => setHeaderForm({ ...headerForm, persenCadangan: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* PIHAK PERTAMA (KORWIL) */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 pb-1 border-b">2. PIHAK PERTAMA (Yang Menyerahkan)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pihak Pertama</label>
                  <input
                    type="text"
                    value={headerForm.pihakPertamaNama}
                    onChange={e => setHeaderForm({ ...headerForm, pihakPertamaNama: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={headerForm.pihakPertamaJabatan}
                    onChange={e => setHeaderForm({ ...headerForm, pihakPertamaJabatan: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instansi</label>
                  <input
                    type="text"
                    value={headerForm.pihakPertamaInstansi}
                    onChange={e => setHeaderForm({ ...headerForm, pihakPertamaInstansi: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* PIHAK KEDUA (FASILITATOR) */}
            <div>
              <div className="flex items-center justify-between pb-1 border-b mb-3">
                <h4 className="font-bold text-slate-900 text-sm">3. PIHAK KEDUA (Yang Menerima)</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Tautkan Profil Fasilitator:</span>
                  <select
                    value={headerForm.fasilitatorId}
                    onChange={e => handleSelectFasilitator(e.target.value)}
                    className="border rounded px-2 py-1 text-xs bg-white font-medium"
                  >
                    <option value="">-- Manual / Tanpa Tautan --</option>
                    {fasilitators.map(f => (
                      <option key={f.id} value={f.id}>{f.namaLengkap} ({f.lokasiSNT})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Penerima</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaNama}
                    onChange={e => setHeaderForm({ ...headerForm, pihakKeduaNama: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan Penerima</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaJabatan}
                    onChange={e => setHeaderForm({ ...headerForm, pihakKeduaJabatan: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Pendidikan (Sekolah)</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaSekolah}
                    onChange={e => setHeaderForm({ ...headerForm, pihakKeduaSekolah: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Satuan Pendidikan</label>
                  <input
                    type="text"
                    value={headerForm.pihakKeduaAlamat}
                    onChange={e => setHeaderForm({ ...headerForm, pihakKeduaAlamat: e.target.value })}
                    placeholder="Dusun/Desa, Kecamatan, Kabupaten, Provinsi"
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* MENGETAHUI (KEPALA SEKOLAH) */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 pb-1 border-b">4. MENGETAHUI (Kepala SNT)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kepala SNT</label>
                  <input
                    type="text"
                    value={headerForm.mengetahuiNama}
                    onChange={e => setHeaderForm({ ...headerForm, mengetahuiNama: e.target.value })}
                    placeholder="Nama Kepala Sekolah"
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={headerForm.mengetahuiNip}
                    onChange={e => setHeaderForm({ ...headerForm, mengetahuiNip: e.target.value })}
                    placeholder="–"
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={headerForm.mengetahuiJabatan}
                    onChange={e => setHeaderForm({ ...headerForm, mengetahuiJabatan: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: RECEIPTS & STATUS */}
      {activeTab === 'receipts' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="bg-slate-50/60 border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Bukti Nota Belanja &amp; Status Pengadaan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Upload bukti nota/kwitansi belanja toko fisik yang menjadi dasar realisasi tanda terima ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pengadaan</label>
                  <select
                    value={headerForm.status}
                    onChange={e => setHeaderForm({ ...headerForm, status: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-semibold"
                  >
                    <option value="DRAFT">DRAFT (Penyusunan Rencana)</option>
                    <option value="DIKIRIM">DIKIRIM (Dalam Pengiriman ke Lokasi)</option>
                    <option value="DITERIMA">DITERIMA (Barang Diterima & Diserahterimakan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan / Log Pengadaan</label>
                  <textarea
                    rows={4}
                    value={headerForm.catatan}
                    onChange={e => setHeaderForm({ ...headerForm, catatan: e.target.value })}
                    placeholder="Catatan mengenai ekspedisi pengiriman, vendor pembelian toko, nomor resi, dsb."
                    className="w-full border rounded-md p-3 text-xs bg-white"
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
    </div>
  )
}
