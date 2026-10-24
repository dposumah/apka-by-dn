'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { updatePaketIoT, autoSetPaketRealisasi, importExcelPaketIoT } from '@/app/actions/iot'
import { DEFAULT_51_IOT_ITEMS, STANDARD_8_KELOMPOK, getStandardItemKemasanAndSatuan, isLikelyVendorName } from '@/lib/iot-constants'
import { generateRabIotHtml, generateBast100KitHtml, generateBastSntHtml, generateLaporanLengkapIotHtml } from '@/lib/pdf-iot-templates'
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
  X, 
  Truck, 
  MapPin, 
  TrendingUp, 
  Percent, 
  Search, 
  CheckCircle,
  Sparkles
} from 'lucide-react'

function parseNotaAttachments(val?: string | null): { name: string; url: string; uploadedAt?: string }[] {
  if (!val || !val.trim()) return []
  if (val.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
  }
  return [{ name: 'Bukti Nota Pembelian', url: val, uploadedAt: new Date().toISOString() }]
}

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

  // Auto switch tab if ?tab=receipts in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab && ['items', 'groups', 'parties', 'receipts'].includes(tab)) {
        setActiveTab(tab as any)
      }
    }
  }, [])

  // Auto-Set Realisasi Modal State
  const [showAutoSetModal, setShowAutoSetModal] = useState(false)
  const [autoSetTotalInput, setAutoSetTotalInput] = useState<number>(3130800)
  const [isAutoSetting, setIsAutoSetting] = useState(false)

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingExcel, setIsImportingExcel] = useState(false)

  const is100Kit = paket.tipeProgram === 'STARTER_KIT_100'

  // Search & Filter State for 100 Kit
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL')

  // Form State for Surat & Parties
  const [headerForm, setHeaderForm] = useState({
    lokasiSNT: paket.lokasiSNT || '',
    namaPaket: paket.namaPaket || '',
    lingkupProyek: paket.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
    nomorSurat: paket.nomorSurat || '',
    tanggalSurat: paket.tanggalSurat ? new Date(paket.tanggalSurat).toISOString().split('T')[0] : '',
    pihakPertamaNama: paket.pihakPertamaNama || 'Jully Tjindrawan, MBA',
    pihakPertamaJabatan: paket.pihakPertamaJabatan || (is100Kit ? 'Direktur Utama' : 'Koordinator Wilayah 2, Program SNT'),
    pihakPertamaInstansi: paket.pihakPertamaInstansi || 'PT Jully Tjindrawan Robotik (Robotic Explorer)',
    fasilitatorId: paket.fasilitatorId || '',
    pihakKeduaNama: paket.pihakKeduaNama || '',
    pihakKeduaJabatan: paket.pihakKeduaJabatan || (is100Kit ? 'Penanggung Jawab Distribusi' : 'Fasilitator Koding, KA & Robotika'),
    pihakKeduaSekolah: paket.pihakKeduaSekolah || paket.lokasiSNT || '',
    pihakKeduaAlamat: paket.pihakKeduaAlamat || '',
    mengetahuiNama: paket.mengetahuiNama || '',
    mengetahuiNip: paket.mengetahuiNip || '',
    mengetahuiJabatan: paket.mengetahuiJabatan || 'Kepala SNT',
    persenCadangan: paket.persenCadangan !== undefined ? paket.persenCadangan : (is100Kit ? 0 : 10),
    status: paket.status || 'DRAFT',
    catatan: paket.catatan || '',
    narasiLaporan: paket.narasiLaporan || '',
    lampiranNotaUrl: paket.lampiranNotaUrl || '',
    nilaiKontrakSPK: paket.nilaiKontrakSPK || 238550000,
    potonganPPh22: paket.potonganPPh22 || 3578250,
    estimasiLaba: paket.estimasiLaba || 127218310,
    kosongkanTanggalBAST: paket.kosongkanTanggalBAST !== undefined ? paket.kosongkanTanggalBAST : true
  })

  // 5 Lokasi Distribusi State
  const [distribusiLokasi, setDistribusiLokasi] = useState<any[]>(() => {
    if (paket.distribusiLokasiJson) {
      try {
        const parsed = typeof paket.distribusiLokasiJson === 'string'
          ? JSON.parse(paket.distribusiLokasiJson)
          : paket.distribusiLokasiJson
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (e) {}
    }
    return [
      { id: 'ikn', namaLokasi: 'IKN (Ibu Kota Nusantara)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah IKN', sekolahTujuan: 'Wilayah IKN', nomorSurat: '01/BAST/KIT-IOT/IKN/2026', tanggalKirim: '2026-10-22' },
      { id: 'bogor', namaLokasi: 'Bogor (Jawa Barat)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Bogor', sekolahTujuan: 'Wilayah Bogor', nomorSurat: '02/BAST/KIT-IOT/BGR/2026', tanggalKirim: '2026-10-22' },
      { id: 'cianjur', namaLokasi: 'Cianjur (Jawa Barat)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Cianjur', sekolahTujuan: 'Wilayah Cianjur', nomorSurat: '03/BAST/KIT-IOT/CJR/2026', tanggalKirim: '2026-10-22' },
      { id: 'donggala', namaLokasi: 'Donggala (Sulawesi Tengah)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Donggala', sekolahTujuan: 'Wilayah Donggala', nomorSurat: '04/BAST/KIT-IOT/DGL/2026', tanggalKirim: '2026-10-22' },
      { id: 'tarakan', namaLokasi: 'Tarakan (Kalimantan Utara)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Tarakan', sekolahTujuan: 'Wilayah Tarakan', nomorSurat: '05/BAST/KIT-IOT/TRK/2026', tanggalKirim: '2026-10-22' }
    ]
  })

  // Items State (Array of items)
  const [items, setItems] = useState<any[]>(
    (paket.items && paket.items.length > 0)
      ? paket.items.map((it: any) => ({
          ...it,
          volume: Number(it.volume) || 1,
          qtyPerKit: it.qtyPerKit !== undefined ? Number(it.qtyPerKit) : 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          vendor: it.vendor || (is100Kit ? 'PCM' : ''),
          statusOrder: it.statusOrder || (is100Kit ? 'Sudah order' : ''),
          diterima: it.diterima !== undefined ? it.diterima : true
        }))
      : DEFAULT_51_IOT_ITEMS.map((it: any, idx: number) => ({
          ...it,
          id: `temp-${idx}`,
          volume: Number(it.volume) || 1,
          qtyPerKit: 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          vendor: '',
          statusOrder: 'Sudah order',
          diterima: true
        }))
  )

  // Live Summary Calculations
  const subtotalRAB = useMemo(() => {
    return items.reduce((sum, it) => sum + ((Number(it.volume) || 0) * (Number(it.hargaSatuanRAB) || 0)), 0)
  }, [items])

  const persenCadangan = is100Kit ? 0 : (Number(headerForm.persenCadangan) || 10)
  const nominalCadangan = is100Kit ? 0 : Math.round(subtotalRAB * (persenCadangan / 100))
  const totalPaguRAB = is100Kit ? subtotalRAB : (subtotalRAB + nominalCadangan)

  const totalRealisasi = useMemo(() => {
    return items.reduce((sum, it) => sum + ((Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)), 0)
  }, [items])

  const selisihAnggaran = totalPaguRAB - totalRealisasi

  // Commercial financial calculations for 100 Kit
  const nilaiSPK = Number(headerForm.nilaiKontrakSPK) || 238550000
  const pph22 = Number(headerForm.potonganPPh22) || Math.round(nilaiSPK * 0.015)
  const estimasiLaba = nilaiSPK - pph22 - totalRealisasi
  const profitMargin = nilaiSPK > 0 ? ((estimasiLaba / nilaiSPK) * 100).toFixed(2) : '0'

  // 4 Pos Belanja Summary for 100 Kit
  const starter4PosSummary = useMemo(() => {
    const groups = [
      { key: 'A. IoT CORE KIT', label: 'A. IoT CORE KIT (25 item)', pagu: 0, real: 0, count: 0 },
      { key: 'B. PERANGKAT PENDUKUNG', label: 'B. PERANGKAT PENDUKUNG (10 item)', pagu: 0, real: 0, count: 0 },
      { key: 'C. KEMASAN & KELENGKAPAN', label: 'C. KEMASAN & KELENGKAPAN / QC (8 item)', pagu: 0, real: 0, count: 0 },
      { key: 'D. TAMBAHAN', label: 'D. TAMBAHAN & ONGKIR PENGIRIMAN (3 item)', pagu: 0, real: 0, count: 0 }
    ]
    items.forEach(it => {
      const cat = it.kategori || ''
      const match = groups.find(g => cat.includes(g.key) || g.key.includes(cat))
      const p = (Number(it.volume) || 0) * (Number(it.hargaSatuanRAB) || 0)
      const r = (Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)
      if (match) {
        match.pagu += p
        match.real += r
        match.count += 1
      } else {
        groups[3].pagu += p
        groups[3].real += r
        groups[3].count += 1
      }
    })
    return groups
  }, [items])

  // Vendor Summary for 100 Kit
  const starterVendorSummary = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}
    items.forEach(it => {
      const v = (it.vendor || 'Lain-lain').trim()
      if (!map[v]) map[v] = { total: 0, count: 0 }
      map[v].total += (Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)
      map[v].count += 1
    })
    return Object.entries(map).map(([vendor, stat]) => ({
      vendor,
      total: stat.total,
      count: stat.count
    })).sort((a, b) => b.total - a.total)
  }, [items])

  // Filtered items for 100 Kit
  const filteredItems100 = useMemo(() => {
    return items.filter(it => {
      const q = itemSearchQuery.toLowerCase()
      const matchText = !q || (it.namaBarang || '').toLowerCase().includes(q) || (it.vendor || '').toLowerCase().includes(q) || (it.kondisiCatatan || '').toLowerCase().includes(q)
      const matchCat = selectedCategoryFilter === 'ALL' || (it.kategori || '').includes(selectedCategoryFilter)
      const matchVendor = selectedVendorFilter === 'ALL' || (it.vendor || '') === selectedVendorFilter
      return matchText && matchCat && matchVendor
    })
  }, [items, itemSearchQuery, selectedCategoryFilter, selectedVendorFilter])

  // Update a single location
  const handleUpdateDistribusiLokasi = (index: number, field: string, value: any) => {
    setDistribusiLokasi(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Print BAST for a location
  const handlePrintBastLokasi = (lokasiData: any) => {
    const currentPaketData = {
      ...paket,
      ...headerForm,
      items
    }
    const html = generateBast100KitHtml(currentPaketData, lokasiData, items)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

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

  const handleAutoSetKemasanAndSatuan = () => {
    let count = 0
    setItems(prev => prev.map(it => {
      const std = getStandardItemKemasanAndSatuan(it.namaBarang)
      const isVendorKemasan = isLikelyVendorName(it.kemasan)
      const needsKemasan = !it.kemasan || it.kemasan === '-' || it.kemasan === '–' || isVendorKemasan
      const needsSatuan = !it.satuan || /^\d+(\.\d+)?$/.test(String(it.satuan).trim())

      if (needsKemasan || needsSatuan) {
        count++
        return {
          ...it,
          kemasan: std.kemasan || '–',
          satuan: needsSatuan ? std.satuan : it.satuan,
          vendor: (it.vendor || (isVendorKemasan ? it.kemasan : ''))
        }
      }
      return it
    }))
    alert(`Berhasil mengotomatiskan kemasan & satuan untuk ${count} item!\n\nKemasan telah disesuaikan (Box 1-4, Di tempat sampah, atau –) dan satuan telah diperbaiki (Unit, Roll, Set, Meter, dll).\nSilakan klik tombol 'Simpan & Sinkronkan RAB' di bagian atas.`)
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
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const existing = parseNotaAttachments(headerForm.lampiranNotaUrl)
      const newItems: { name: string; url: string; uploadedAt: string }[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const url = await uploadFileClient(file, 'receipts')
        newItems.push({
          name: file.name,
          url,
          uploadedAt: new Date().toISOString()
        })
      }

      const merged = [...existing, ...newItems]
      const jsonStr = JSON.stringify(merged)
      setHeaderForm(prev => ({ ...prev, lampiranNotaUrl: jsonStr }))

      // Auto-save langsung ke database
      try {
        await updatePaketIoT(paket.id, { lampiranNotaUrl: jsonStr })
      } catch (saveErr) {
        console.error('Auto-save lampiran nota failed:', saveErr)
      }

      alert(`${newItems.length} berkas nota/invoice berhasil diunggah dan tersimpan ke database!`)
    } catch (err: any) {
      alert('Gagal mengunggah nota: ' + (err.message || err))
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteReceipt = async (index: number) => {
    if (!confirm('Hapus berkas nota ini dari daftar?')) return
    const list = parseNotaAttachments(headerForm.lampiranNotaUrl)
    const filtered = list.filter((_, i) => i !== index)
    const newJson = filtered.length > 0 ? JSON.stringify(filtered) : ''
    setHeaderForm(prev => ({
      ...prev,
      lampiranNotaUrl: newJson
    }))

    // Auto-save langsung ke database
    try {
      await updatePaketIoT(paket.id, { lampiranNotaUrl: newJson })
    } catch (saveErr) {
      console.error('Auto-save hapus lampiran nota failed:', saveErr)
    }
  }

  const handlePrintLaporanLengkap = () => {
    const currentPaketData = {
      ...paket,
      ...headerForm,
      totalPaguRAB,
      totalRealisasi
    }
    const html = generateLaporanLengkapIotHtml(currentPaketData, items)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const handlePrintBastSnt = () => {
    const currentPaketData = {
      ...paket,
      ...headerForm,
      totalPaguRAB,
      totalRealisasi
    }
    const html = generateBastSntHtml(currentPaketData, items)
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
              {headerForm.namaPaket || (is100Kit ? 'Pengadaan Starter Kit IoT (100 Kit - 5 Lokasi)' : `Paket Pengadaan IoT - ${paket.lokasiSNT}`)}
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
              {headerForm.status}
            </Badge>
            {is100Kit && (
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-bold text-xs">
                Kategori F Dashboard RAB
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {is100Kit ? (
              <>
                Proyek Terpusat: <strong>100 Unit Starter Kit</strong> terdistribusi ke <strong>5 Lokasi</strong> (IKN, Bogor, Cianjur, Donggala, Tarakan) • Terhubung ke Kategori RAB:{' '}
                <span className="font-semibold text-indigo-700">
                  {paket.rabCategory?.name || 'F. Pengadaan Starter Kit IoT 100 Kit (5 Lokasi)'}
                </span>
              </>
            ) : (
              <>
                Lokasi: <strong>{paket.lokasiSNT}</strong> • Terhubung ke Kategori RAB:{' '}
                <span className="font-semibold text-indigo-700">
                  {paket.rabCategory?.name || 'Kategori Mandiri SNT'}
                </span>
              </>
            )}
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          {!is100Kit && (
            <button
              type="button"
              onClick={handlePrintBastSnt}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Cetak Berita Acara Serah Terima (BAST Resmi)"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak BAST Resmi (PDF)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintLaporanLengkap}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak Laporan Lengkap Pengadaan IoT (Narasi, RAB, BAST, Realisasi & Bukti Nota)"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak Laporan Lengkap (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRAB}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak Rencana Anggaran Biaya (Format PDF)"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen RAB (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('receipts')
              setTimeout(() => {
                const el = document.getElementById('upload-nota-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }, 50)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Buka Menu Upload Bukti Nota & Invoice"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Nota &amp; Invoice</span>
            {parseNotaAttachments(headerForm.lampiranNotaUrl).length > 0 && (
              <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {parseNotaAttachments(headerForm.lampiranNotaUrl).length}
              </span>
            )}
          </button>

          {is100Kit && (
            <Link
              href="/dashboard-rab"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Lihat Kategori F</span>
            </Link>
          )}

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
                <span>{is100Kit ? 'Simpan & Sinkronkan Kategori F' : 'Simpan & Sinkronkan RAB'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      {is100Kit ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold uppercase text-emerald-800 block">Nilai Kontrak SPK</span>
            <span className="text-base font-bold text-emerald-950 mt-0.5 block">{formatCurrency(nilaiSPK)}</span>
            <span className="text-[10px] text-emerald-700">DPP Kontrak 100 Kit</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold uppercase text-amber-800 block">Potongan PPh 22 (1.5%)</span>
            <span className="text-base font-bold text-amber-950 mt-0.5 block">{formatCurrency(pph22)}</span>
            <span className="text-[10px] text-amber-700">Pajak Penghasilan Resmi</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold uppercase text-slate-600 block">Net Penerimaan SPK</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(nilaiSPK - pph22)}</span>
            <span className="text-[10px] text-slate-500">Setelah potong PPh 22</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold uppercase text-blue-700 block">Total Belanja (HPP)</span>
            <span className="text-base font-bold text-blue-900 mt-0.5 block">{formatCurrency(totalRealisasi)}</span>
            <span className="text-[10px] text-blue-600">4 Pos Kategori F ({items.length} Item)</span>
          </div>

          <div className="col-span-2 md:col-span-1 border border-purple-200 bg-purple-50/70 rounded-lg p-3">
            <span className="text-[11px] font-semibold uppercase text-purple-800 block">Estimasi Laba Bersih</span>
            <span className="text-base font-bold text-purple-950 mt-0.5 block">{formatCurrency(estimasiLaba)}</span>
            <span className="text-[10px] text-purple-700 font-bold">Margin Laba: {profitMargin}%</span>
          </div>
        </div>
      ) : (
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
            <span className="text-[11px] font-semibold uppercase text-emerald-700 block">Realisasi Belanja Pengadaan</span>
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
      )}

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
          <span>{is100Kit ? `1. Rincian Item Belanja (${items.length} Item)` : `1. Rincian Item Alat & Bahan (${items.length})`}</span>
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
          <span>{is100Kit ? '2. Ringkasan 4 Pos Kategori F & Rekap Vendor' : '2. Ringkasan 8 Pos Kelompok RAB'}</span>
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
          {is100Kit ? <Truck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          <span>{is100Kit ? '3. Distribusi 5 Lokasi & Cetak BAST' : '3. Pihak Penandatangan & Info Surat'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'receipts'
              ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>{is100Kit ? '4. Upload Bukti Nota & Invoice' : '4. Upload Bukti Nota Belanja'}</span>
          {parseNotaAttachments(headerForm.lampiranNotaUrl).length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {parseNotaAttachments(headerForm.lampiranNotaUrl).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ITEMS EDITOR */}
      {activeTab === 'items' && (
        is100Kit ? (
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/60 border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Tabel 46 Item Belanja Starter Kit IoT 100 Kit</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    HPP Total: {formatCurrency(totalRealisasi)}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Rincian komponen Core Kit, perangkat pendukung, kemasan box kontainer 15L, kelengkapan QC, dan ongkir ke 5 lokasi.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search query */}
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={e => setItemSearchQuery(e.target.value)}
                    placeholder="Cari item / vendor..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Pos Kategori */}
                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
                >
                  <option value="ALL">Semua Pos Kategori</option>
                  <option value="A. IoT CORE KIT">A. IoT CORE KIT</option>
                  <option value="B. PERANGKAT PENDUKUNG">B. PERANGKAT PENDUKUNG</option>
                  <option value="C. KEMASAN & KELENGKAPAN">C. KEMASAN &amp; QC</option>
                  <option value="D. TAMBAHAN">D. TAMBAHAN &amp; ONGKIR</option>
                </select>

                {/* Filter Vendor */}
                <select
                  value={selectedVendorFilter}
                  onChange={e => setSelectedVendorFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
                >
                  <option value="ALL">Semua Vendor</option>
                  <option value="PCM">PCM</option>
                  <option value="CNC Store Bandung">CNC Store</option>
                  <option value="The Box Indonesia">The Box</option>
                  <option value="Shopee">Shopee</option>
                  <option value="QC & Packing Internal">QC Internal</option>
                  <option value="Acuan Kabel & Label">Acuan Kabel</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Baris</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 z-10 border-b text-[11px] shadow-xs">
                    <tr>
                      <th className="px-3 py-2.5 text-center" style={{ width: '35px' }}>No</th>
                      <th className="px-3 py-2.5" style={{ width: '150px' }}>Pos / Kategori</th>
                      <th className="px-3 py-2.5" style={{ minWidth: '220px' }}>Nama Komponen / Spesifikasi</th>
                      <th className="px-3 py-2.5" style={{ width: '130px' }}>Vendor Rekanan</th>
                      <th className="px-3 py-2.5 text-center" style={{ width: '65px' }}>Qty/Kit</th>
                      <th className="px-3 py-2.5 text-center" style={{ width: '65px' }}>Total Vol</th>
                      <th className="px-3 py-2.5 text-center" style={{ width: '60px' }}>Satuan</th>
                      <th className="px-3 py-2.5 text-right bg-emerald-50/80 text-emerald-900" style={{ width: '115px' }}>Harga Satuan</th>
                      <th className="px-3 py-2.5 text-right bg-emerald-50/80 text-emerald-900" style={{ width: '120px' }}>Total Belanja</th>
                      <th className="px-3 py-2.5 text-center" style={{ width: '100px' }}>Status Order</th>
                      <th className="px-3 py-2.5" style={{ minWidth: '150px' }}>Catatan / Link Toko</th>
                      <th className="px-2 py-2.5 text-center" style={{ width: '45px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredItems100.map((it, displayIdx) => {
                      const realIndex = items.findIndex(item => item.id === it.id)
                      const itemIdx = realIndex !== -1 ? realIndex : displayIdx
                      const rowTotalReal = (Number(it.volume) || 0) * (Number(it.hargaSatuanReal) || 0)

                      return (
                        <tr key={it.id || displayIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-2 text-center text-slate-500 font-medium">
                            {displayIdx + 1}
                          </td>

                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={it.kategori || ''}
                              onChange={e => handleItemChange(itemIdx, 'kategori', e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                              placeholder="Pos Kategori"
                            />
                          </td>

                          <td className="px-3 py-2 font-sans">
                            <input
                              type="text"
                              value={it.namaBarang || ''}
                              onChange={e => handleItemChange(itemIdx, 'namaBarang', e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                              placeholder="Nama barang..."
                            />
                          </td>

                          <td className="px-3 py-2 font-sans">
                            <input
                              type="text"
                              value={it.vendor || ''}
                              onChange={e => handleItemChange(itemIdx, 'vendor', e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                              placeholder="Vendor suplier"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.qtyPerKit !== undefined ? it.qtyPerKit : 1}
                              onChange={e => {
                                const val = Number(e.target.value)
                                handleItemChange(itemIdx, 'qtyPerKit', val)
                                if (is100Kit && !it.kategori?.includes('TAMBAHAN')) {
                                  handleItemChange(itemIdx, 'volume', val * 100)
                                }
                              }}
                              className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.volume}
                              onChange={e => handleItemChange(itemIdx, 'volume', Number(e.target.value))}
                              className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                            />
                          </td>

                          <td className="px-3 py-2 font-sans">
                            <input
                              type="text"
                              value={it.satuan || ''}
                              onChange={e => handleItemChange(itemIdx, 'satuan', e.target.value)}
                              className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Satuan"
                            />
                          </td>

                          <td className="px-3 py-2 text-right bg-emerald-50/30">
                            <input
                              type="number"
                              min="0"
                              value={it.hargaSatuanReal}
                              onChange={e => {
                                const val = Number(e.target.value)
                                handleItemChange(itemIdx, 'hargaSatuanReal', val)
                                handleItemChange(itemIdx, 'hargaSatuanRAB', val)
                              }}
                              className="w-full text-xs text-right bg-white border border-emerald-300 rounded px-2 py-1 text-emerald-950 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          <td className="px-3 py-2 text-right font-bold text-emerald-800 bg-emerald-50/30">
                            {formatCurrency(rowTotalReal)}
                          </td>

                          <td className="px-3 py-2 font-sans">
                            <input
                              type="text"
                              value={it.statusOrder || ''}
                              onChange={e => handleItemChange(itemIdx, 'statusOrder', e.target.value)}
                              className="w-full text-xs text-center bg-white border border-slate-200 rounded px-1 py-1 text-slate-700"
                              placeholder="Status"
                            />
                          </td>

                          <td className="px-3 py-2 font-sans">
                            <input
                              type="text"
                              value={it.kondisiCatatan || ''}
                              onChange={e => handleItemChange(itemIdx, 'kondisiCatatan', e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
                              placeholder="Catatan..."
                            />
                          </td>

                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(itemIdx)}
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
                      <td colSpan={8} className="px-3 py-2.5 text-right uppercase text-slate-900">
                        Total Belanja ({filteredItems100.length} item):
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-900 bg-emerald-100/60 font-black">
                        {formatCurrency(totalRealisasi)}
                      </td>
                      <td colSpan={3} className="px-3 py-2.5 text-right font-sans font-medium text-[11px] text-slate-500">
                        Lengkap untuk 100 Starter Kit IoT
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
                  onClick={handleAutoSetKemasanAndSatuan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Otomatiskan kemasan (Box 1-4, dll) dan satuan standar berdasarkan nama barang"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🪄 Auto-Set Kemasan &amp; Satuan</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTo51Default}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                  title="Muat ulang 51 item bawaan"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset 51 Item Bawaan</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
        )
      )}

      {/* TAB 2: RINGKASAN POS / KELOMPOK RAB */}
      {activeTab === 'groups' && (
        is100Kit ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4 POS BELANJA KATEGORI F */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>4 Pos Belanja (Kategori F di Dashboard RAB)</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    {formatCurrency(totalRealisasi)}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Rekapitulasi 4 pos belanja yang tersinkronisasi langsung ke pos pengeluaran Kategori F di Dashboard RAB.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Pos Belanja</th>
                      <th className="px-4 py-2.5 text-center">Item</th>
                      <th className="px-4 py-2.5 text-right">Total Belanja</th>
                      <th className="px-4 py-2.5 text-center">Porsi %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {starter4PosSummary.map((pos, idx) => {
                      const pct = totalRealisasi > 0 ? ((pos.real / totalRealisasi) * 100).toFixed(1) : '0'
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                            {pos.label}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">
                            {pos.count} item
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {formatCurrency(pos.real)}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">
                            {pct}%
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-indigo-50/60 font-bold border-t text-indigo-950">
                      <td className="px-4 py-3 font-sans">Total Belanja (4 Pos Kategori F)</td>
                      <td className="px-4 py-3 text-center">{items.length} item</td>
                      <td className="px-4 py-3 text-right text-indigo-900 font-black">{formatCurrency(totalRealisasi)}</td>
                      <td className="px-4 py-3 text-center">100%</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* REKAP VENDOR REKANAN */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Rekapitulasi Pembelian per Rekanan Vendor</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {starterVendorSummary.length} Vendor
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Total pengeluaran riil berdasarkan suplier dan toko penyedia komponen.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Vendor / Toko Suplier</th>
                      <th className="px-4 py-2.5 text-center">Item</th>
                      <th className="px-4 py-2.5 text-right">Total Belanja</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {starterVendorSummary.map((v, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                          {v.vendor}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">
                          {v.count} item
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(v.total)}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Lunas
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/60 font-bold border-t text-emerald-950">
                      <td className="px-4 py-3 font-sans">Total Seluruh Rekanan Vendor</td>
                      <td className="px-4 py-3 text-center">{items.length} item</td>
                      <td className="px-4 py-3 text-right text-emerald-900 font-black">{formatCurrency(totalRealisasi)}</td>
                      <td className="px-4 py-3 text-center font-sans">
                        <span className="text-emerald-700 font-bold">Lunas</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* CALLOUT UNGGAH BUKTI NOTA VENDOR */}
            <div className="lg:col-span-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/40 border border-emerald-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Arsip Bukti Transaksi Nota &amp; Invoice Rekanan</span>
                    {parseNotaAttachments(headerForm.lampiranNotaUrl).length > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        {parseNotaAttachments(headerForm.lampiranNotaUrl).length} Berkas Terunggah
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">
                        Belum Ada Nota
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Unggah nota/invoice asli dari PCM Elektronik, CNC Store Bandung, Shopee, The Box 03, dan resi ekspedisi agar otomatis tercetak di lampiran Bab V Laporan Lengkap.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('receipts')
                  setTimeout(() => {
                    const el = document.getElementById('upload-nota-section')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }, 50)
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Buka Menu Upload Nota</span>
              </button>
            </div>
          </div>
        ) : (
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
        )
      )}

      {/* TAB 3: SURAT & TANDA TANGAN / DISTRIBUSI BAST */}
      {activeTab === 'parties' && (
        is100Kit ? (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/60 border-b pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Distribusi 5 Lokasi Pengiriman &amp; Cetak BAST Resmi</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Setiap lokasi menerima 20 Starter Kit IoT lengkap (Kontainer Box 15L) + 1 Charger Laptop. Anda dapat menyesuaikan nama penanggung jawab atau nomor surat, lalu klik tombol "Cetak BAST (PDF)".
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="bg-blue-50/70 border border-blue-200/90 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="kosongkanTanggalBAST100"
                      checked={headerForm.kosongkanTanggalBAST}
                      onChange={e => setHeaderForm(prev => ({ ...prev, kosongkanTanggalBAST: e.target.checked }))}
                      className="mt-0.5 sm:mt-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="kosongkanTanggalBAST100" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                      <strong>Kosongkan hari, tanggal, &amp; bulan pada cetak BAST</strong> (titik-titik untuk diisi manual/pulpen oleh penerima wilayah saat kiriman tiba)
                    </label>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 font-semibold ${headerForm.kosongkanTanggalBAST ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
                    {headerForm.kosongkanTanggalBAST ? 'Diisi Manual di Lapangan' : 'Sesuai Tanggal Kirim'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {distribusiLokasi.map((lokasi, idx) => (
                    <div key={lokasi.id || idx} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          <span>{lokasi.namaLokasi}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {lokasi.alokasiKit} Kit + {lokasi.ekstraCharger} Charger
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-slate-600 font-semibold block mb-0.5">Penanggung Jawab / Penerima</label>
                          <input
                            type="text"
                            value={lokasi.penerimaNama || ''}
                            onChange={e => handleUpdateDistribusiLokasi(idx, 'penerimaNama', e.target.value)}
                            className="w-full border rounded p-1.5 bg-white text-slate-900"
                            placeholder="Nama PIC Penerima"
                          />
                        </div>

                        <div>
                          <label className="text-slate-600 font-semibold block mb-0.5">Satuan Pendidikan / Alamat</label>
                          <input
                            type="text"
                            value={lokasi.sekolahTujuan || ''}
                            onChange={e => handleUpdateDistribusiLokasi(idx, 'sekolahTujuan', e.target.value)}
                            className="w-full border rounded p-1.5 bg-white text-slate-900"
                            placeholder="Satuan pendidikan / tujuan"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-600 font-semibold block mb-0.5">No. BAST</label>
                            <input
                              type="text"
                              value={lokasi.nomorSurat || ''}
                              onChange={e => handleUpdateDistribusiLokasi(idx, 'nomorSurat', e.target.value)}
                              className="w-full border rounded p-1.5 bg-white font-mono text-[11px]"
                              placeholder="No. BAST"
                            />
                          </div>
                          <div>
                            <label className="text-slate-600 font-semibold block mb-0.5">Tgl BAST</label>
                            <input
                              type="date"
                              value={lokasi.tanggalKirim || ''}
                              onChange={e => handleUpdateDistribusiLokasi(idx, 'tanggalKirim', e.target.value)}
                              className="w-full border rounded p-1.5 bg-white text-[11px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex justify-end">
                        <button
                          type="button"
                          onClick={() => handlePrintBastLokasi(lokasi)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors cursor-pointer w-full justify-center shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Cetak BAST (PDF)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PIHAK PERTAMA (YANG MENYERAHKAN) */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/60 border-b pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  PIHAK PERTAMA (Yang Menyerahkan - Pihak Rekanan Penyedia)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-600 block mb-0.5 font-semibold">Nama Penyerah</label>
                    <input
                      type="text"
                      value={headerForm.pihakPertamaNama}
                      onChange={e => setHeaderForm(prev => ({ ...prev, pihakPertamaNama: e.target.value }))}
                      className="w-full text-xs border rounded p-2 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-0.5 font-semibold">Jabatan</label>
                    <input
                      type="text"
                      value={headerForm.pihakPertamaJabatan}
                      onChange={e => setHeaderForm(prev => ({ ...prev, pihakPertamaJabatan: e.target.value }))}
                      className="w-full text-xs border rounded p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-0.5 font-semibold">Instansi / Perusahaan</label>
                    <input
                      type="text"
                      value={headerForm.pihakPertamaInstansi}
                      onChange={e => setHeaderForm(prev => ({ ...prev, pihakPertamaInstansi: e.target.value }))}
                      className="w-full text-xs border rounded p-2 bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/60 border-b pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Konfigurasi Surat &amp; Pihak Penandatangan
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Informasi ini akan tercetak otomatis pada berkas BAST Resmi, Dokumen RAB, dan Laporan Pertanggungjawaban Lengkap.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintBastSnt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Cetak Berita Acara Serah Terima (BAST Resmi)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cetak BAST (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintLaporanLengkap}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    title="Cetak Laporan Lengkap Pengadaan IoT (Narasi, RAB, BAST, Realisasi & Bukti Nota)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cetak Laporan Lengkap (PDF)</span>
                  </button>
                </div>
              </div>
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

              <div className="bg-blue-50/70 border border-blue-200/90 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="kosongkanTanggalBASTSnt"
                    checked={headerForm.kosongkanTanggalBAST}
                    onChange={e => setHeaderForm(prev => ({ ...prev, kosongkanTanggalBAST: e.target.checked }))}
                    className="mt-0.5 sm:mt-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="kosongkanTanggalBASTSnt" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                    <strong>Kosongkan hari, tanggal, &amp; bulan pada cetak BAST</strong> (titik-titik untuk diisi manual/pulpen oleh petugas saat serah terima di sekolah)
                  </label>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 font-semibold ${headerForm.kosongkanTanggalBAST ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
                  {headerForm.kosongkanTanggalBAST ? 'Diisi Manual di Lokasi' : 'Otomatis Sesuai Tanggal Surat'}
                </Badge>
              </div>

              {/* NARASI LAPORAN PENGADAAN IOT (BAB I) */}
              <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-700" />
                      <span>Narasi Laporan Pertanggungjawaban (Bab I Laporan)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Narasi pengantar yang akan tercetak pada lembar Bab I dokumen Laporan Pertanggungjawaban Pengadaan IoT.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const selisihVal = totalPaguRAB - totalRealisasi
                      const defaultText = `Dalam rangka mendukung percepatan penguasaan teknologi tingkat dasar dan menengah pada Program Sekolah Nasional Terintegrasi (SNT) Tahun 2026, PT Jully Tjindrawan Robotik (Robotic Explorer) selaku Koordinator Wilayah 2 telah melaksanakan pengadaan dan pendistribusian paket alat dan bahan robotika berbasis Internet of Things (IoT) untuk lokasi ${headerForm.lokasiSNT}.\n\nPengadaan ini mencakup penyediaan komponen inti mikrokontroler (ESP32), sensor ultrasonik, servo, modul daya, aktuator, serta peralatan kerja dan mekanik penunjang untuk 3 proyek utama: ${headerForm.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT'}.\n\nTotal pagu anggaran rencana yang dialokasikan adalah sebesar ${formatCurrency(totalPaguRAB)}, dengan total realisasi belanja aktual sebesar ${formatCurrency(totalRealisasi)} (terdapat ${selisihVal >= 0 ? 'efisiensi/sisa anggaran sebesar ' + formatCurrency(selisihVal) : 'defisit anggaran sebesar ' + formatCurrency(Math.abs(selisihVal))}).\n\nSeluruh barang telah diperiksa kelayakan fisiknya, diserahterimakan kepada pihak fasilitator dan satuan pendidikan dalam kondisi baik, lengkap, dan siap digunakan untuk proses belajar mengajar serta kegiatan ekstrakurikuler.`
                      setHeaderForm(prev => ({ ...prev, narasiLaporan: defaultText }))
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer self-start sm:self-auto"
                    title="Isi teks narasi otomatis dengan angka anggaran terbaru"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Muat Narasi Standar</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={headerForm.narasiLaporan}
                  onChange={e => setHeaderForm(prev => ({ ...prev, narasiLaporan: e.target.value }))}
                  placeholder="Tulis narasi laporan pengadaan atau klik 'Muat Narasi Standar' untuk menghasilkan narasi baku resmi otomatis..."
                  className="w-full text-xs border rounded-lg p-2.5 bg-white text-slate-800 leading-relaxed focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>
                    {headerForm.narasiLaporan ? `${headerForm.narasiLaporan.split(/\s+/).filter(Boolean).length} kata • ${headerForm.narasiLaporan.length} karakter` : 'Belum ada narasi khusus (otomatis menggunakan teks baku saat cetak)'}
                  </span>
                  <span className="italic text-slate-500">
                    *Klik 'Simpan Perubahan' di bagian atas untuk menyimpan teks narasi ini.
                  </span>
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
        )
      )}

      {/* TAB 4: LAMPIRAN NOTA BELANJA / PARAMETER SPK */}
      {activeTab === 'receipts' && (
        is100Kit ? (
          <div className="space-y-6">
            {/* LAMPIRAN NOTA VENDOR DITEMPATKAN DI ATAS DENGAN DROPZONE BESAR */}
            <Card id="upload-nota-section" className="border-emerald-200 shadow-sm bg-white">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Upload Bukti Nota &amp; Invoice Rekanan Vendor (100 Kit)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Unggah bukti nota kuitansi / invoice dari PCM Elektronik, CNC Store Bandung, The Box 03, Shopee, dan ekspedisi pengiriman.
                  </CardDescription>
                </div>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs transition shrink-0">
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploading ? 'Mengunggah...' : '+ Pilih File Nota'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleUploadReceipt}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* BIG UPLOAD DROPZONE BANNER */}
                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {isUploading ? 'Sedang Mengunggah &amp; Menyimpan Berkas...' : 'Klik di Sini untuk Memilih Berkas Nota / Invoice'}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-lg mx-auto">
                      Mendukung format gambar foto/scan (JPG, PNG, WebP) dan berkas dokumen PDF. Anda dapat memilih beberapa file nota sekaligus.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-full transition-colors mt-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pilih Berkas Nota dari Komputer</span>
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleUploadReceipt}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {(() => {
                  const receiptList = parseNotaAttachments(headerForm.lampiranNotaUrl)
                  if (receiptList.length === 0) {
                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs">
                        Belum ada berkas nota/invoice yang diunggah. Silakan klik kotak hijau di atas untuk mengunggah berkas.
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Berkas Nota &amp; Invoice Terunggah ({receiptList.length} file):
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          ✓ Otomatis tersimpan ke database &amp; tampil di Bab V Laporan
                        </span>
                      </div>
                      <div className="divide-y border rounded-lg overflow-hidden bg-white shadow-xs">
                        {receiptList.map((rec, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 transition text-xs">
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 block truncate" title={rec.name}>
                                  {rec.name}
                                </span>
                                {rec.uploadedAt && (
                                  <span className="text-[10px] text-slate-400">
                                    Diunggah: {new Date(rec.uploadedAt).toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={rec.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Lihat Berkas</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteReceipt(idx)}
                                className="text-[11px] text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Hapus berkas ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* PARAMETER KOMERSIAL KONTRAK */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="bg-slate-50/60 border-b pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Parameter Finansial Kontrak SPK &amp; Perpajakan</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Sesuaikan nilai SPK dan potongan pajak PPh 22 untuk menghitung estimasi laba bersih secara otomatis.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Nilai Kontrak SPK (DPP)</label>
                    <input
                      type="number"
                      value={headerForm.nilaiKontrakSPK}
                      onChange={e => setHeaderForm(prev => ({ ...prev, nilaiKontrakSPK: Number(e.target.value) }))}
                      className="w-full text-xs border rounded-lg p-2 font-bold bg-white text-emerald-950 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatCurrency(nilaiSPK)}</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Potongan PPh 22 (1.5%)</label>
                    <input
                      type="number"
                      value={headerForm.potonganPPh22}
                      onChange={e => setHeaderForm(prev => ({ ...prev, potonganPPh22: Number(e.target.value) }))}
                      className="w-full text-xs border rounded-lg p-2 font-bold bg-white text-amber-950 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatCurrency(pph22)}</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Estimasi Laba Bersih</label>
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-bold text-purple-950">
                      {formatCurrency(estimasiLaba)} <span className="text-xs font-normal text-purple-700">({profitMargin}%)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Status Proyek</label>
                    <select
                      value={headerForm.status}
                      onChange={e => setHeaderForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full text-xs border rounded-lg p-2 bg-white focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="DRAFT">DRAFT (Penyusunan Rencana)</option>
                      <option value="DIKIRIM">DIKIRIM (Dalam Pengiriman ke 5 Wilayah)</option>
                      <option value="DITERIMA">DITERIMA (Sudah Diterima Lengkap)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Tambahan Proyek</label>
                    <textarea
                      rows={3}
                      value={headerForm.catatan}
                      onChange={e => setHeaderForm(prev => ({ ...prev, catatan: e.target.value }))}
                      className="w-full text-xs border rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="Catatan kontrak, vendor suplier, ekspedisi pengiriman, dll..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
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

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Lampiran Bukti Nota &amp; Struk Belanja</h4>
                        <p className="text-[11px] text-slate-500">
                          Unggah bukti nota toko offline, invoice online, atau PDF bundle nota gabungan.
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition">
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{isUploading ? 'Mengunggah...' : '+ Unggah File Nota'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        multiple
                        onChange={handleUploadReceipt}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {/* Info Note Rekomendasi */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                    💡 <strong>Rekomendasi Pengunggahan:</strong> Anda tidak perlu mengunggah nota satu-per-satu untuk setiap item. Cukup kumpulkan beberapa nota belanja gabungan (misalnya: 1 nota Starlectric, 1 nota Toko Permata, dan rekap Shopee) atau 1 file PDF bundle di sini. Dokumen ini menjadi bukti transaksi sah lampiran Laporan Pertanggungjawaban &amp; BAST.
                  </div>

                  {/* Uploaded Files List */}
                  {(() => {
                    const receiptList = parseNotaAttachments(headerForm.lampiranNotaUrl)
                    if (receiptList.length === 0) {
                      return (
                        <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400">
                          <p className="text-xs">Belum ada berkas nota yang diunggah.</p>
                        </div>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-700 block">
                          Berkas Nota Terunggah ({receiptList.length} file):
                        </span>
                        <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/50">
                          {receiptList.map((rec, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-white transition text-xs">
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-slate-800 truncate" title={rec.name}>
                                  {rec.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={rec.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Lihat</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReceipt(idx)}
                                  className="text-[11px] text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                                  title="Hapus berkas ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )
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
