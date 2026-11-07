'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { createPaketIoT, deletePaketIoT, importExcelPaketIoT } from '@/app/actions/iot'
import { 
  getIoTCashflowData, 
  createIoTCashTransaction, 
  deleteIoTCashTransaction 
} from '@/app/actions/iot-cashflow'
import { 
  generateRabIotHtml, 
  generateBast100KitHtml, 
  generateBastSntHtml, 
  generateLaporanLengkapIotHtml,
  generateBukuKasIotHtml
} from '@/lib/pdf-iot-templates'
import { 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Bot, 
  Package, 
  Layers, 
  Coins, 
  ArrowRight,
  Loader2,
  X,
  Truck,
  MapPin,
  Building,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  Upload,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  BookOpen,
  Receipt,
  FileCheck
} from 'lucide-react'

export function AlatBahanIotClient({ 
  initialPaketList = [], 
  fasilitators = [],
  initialCashflowData
}: { 
  initialPaketList: any[], 
  fasilitators: any[],
  initialCashflowData?: any
}) {
  const router = useRouter()
  const [paketList, setPaketList] = useState<any[]>(initialPaketList)
  const [activeProgramTab, setActiveProgramTab] = useState<'SNT' | 'STARTER_KIT_100' | 'BUKU_KAS_100'>('SNT')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // State for Buku Kas Keluar Masuk IoT
  const [cashflow, setCashflow] = useState<any>(initialCashflowData || {
    totalMasuk: 0,
    totalKeluar: 0,
    sisaSaldo: 0,
    transactions: []
  })
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashFormType, setCashFormType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [cashFormData, setCashFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Penerimaan SP2D Kemendikbud',
    description: '',
    paymentMethod: 'Bank BCA (111.11.101)',
    receiptUrl: ''
  })
  const [isSavingCash, setIsSavingCash] = useState(false)
  const [deletingCashId, setDeletingCashId] = useState<string | null>(null)
  const [cashSearch, setCashSearch] = useState('')

  // Form State for New Package
  const [formData, setFormData] = useState({
    lokasiSNT: '',
    namaPaket: '',
    lingkupProyek: 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
    nomorSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    fasilitatorId: '',
    mengetahuiNama: '',
    mengetahuiNip: '',
    mengetahuiJabatan: 'Kepala SNT',
    persenCadangan: 10,
    loadDefaultTemplate: true
  })

  // Distinct locations from fasilitators
  const lokasiOptions = Array.from(
    new Set(fasilitators.map(f => f.lokasiSNT).filter(Boolean))
  ).sort()

  const handleSelectFasilitator = (fasilId: string) => {
    const f = fasilitators.find(item => item.id === fasilId)
    if (f) {
      setFormData(prev => ({
        ...prev,
        fasilitatorId: fasilId,
        lokasiSNT: f.lokasiSNT || prev.lokasiSNT,
        namaPaket: prev.namaPaket || `Pengadaan Alat dan Bahan Robotika - ${f.lokasiSNT || ''}`
      }))
    } else {
      setFormData(prev => ({ ...prev, fasilitatorId: '' }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lokasiSNT.trim()) {
      alert('Isi atau pilih Lokasi SNT')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPaketIoT(formData)
      if (res?.error) {
        alert('Gagal membuat paket: ' + res.error)
        return
      }

      setShowCreateModal(false)
      alert('Paket pengadaan IoT berhasil dibuat!')
      router.refresh()
      if (res?.paket?.id) {
        router.push(`/alat-bahan-iot/${res.paket.id}`)
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (paket: any) => {
    if (!confirm(`Hapus paket pengadaan IoT untuk "${paket.lokasiSNT}"?\nSemua rincian item barang akan ikut dihapus.`)) {
      return
    }

    setDeletingId(paket.id)
    try {
      const res = await deletePaketIoT(paket.id)
      if (res?.error) {
        alert('Gagal menghapus: ' + res.error)
        return
      }
      setPaketList(prev => prev.filter(p => p.id !== paket.id))
      router.refresh()
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setDeletingId(null)
    }
  }

  const handlePrintLaporanLengkap = (paket: any) => {
    const html = generateLaporanLengkapIotHtml(paket, paket.items || [])
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const handlePrintBastSnt = (paket: any) => {
    const html = generateBastSntHtml(paket, paket.items || [])
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const handlePrintRAB = (paket: any) => {
    const html = generateRabIotHtml(paket, paket.items || [])
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const [isSyncingExcel100, setIsSyncingExcel100] = useState(false)

  const handleSyncExcel100 = async (e: React.ChangeEvent<HTMLInputElement>, targetPaketId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSyncingExcel100(true)
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const b64 = (evt.target?.result as string).split(',')[1]
          const res = await importExcelPaketIoT(targetPaketId, b64)
          if (res?.error) {
            alert('Gagal menyinkronkan Excel: ' + res.error)
            return
          }
          if (res?.isStarterKit100) {
            alert(
              `✅ Berhasil Menyinkronkan File Excel Starter Kit IoT!\n\n` +
              `• Total Item Belanja: ${res.totalItems} item\n` +
              `• Total Belanja (HPP): ${formatCurrency(res.totalPengeluaran || 0)}\n` +
              `• Nilai Kontrak SPK: ${formatCurrency(238550000)}\n` +
              `• Potongan PPh 22 (1.5%): ${formatCurrency(3578250)}\n` +
              `• Estimasi Laba Bersih: ${formatCurrency(res.estimasiLaba || 0)} (Margin: ${(Number(res.margin || 0) * 100).toFixed(2)}%)\n` +
              `• Rekapitulasi Vendor: ${res.vendorBreakdown?.length || 0} rekanan berhasil disinkronkan otomatis.\n\n` +
              `Semua perubahan harga, kuantitas, status pesanan, dan vendor telah disimpan ke database.`
            )
            window.location.reload()
            return
          }
          alert(`Berhasil mengimpor file Excel! Total realisasi: ${formatCurrency(res.totalPengeluaran || 0)}`)
          window.location.reload()
        } catch (innerErr: any) {
          alert('Gagal memproses file: ' + innerErr.message)
        } finally {
          setIsSyncingExcel100(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert('Gagal membaca file: ' + err.message)
      setIsSyncingExcel100(false)
    } finally {
      e.target.value = ''
    }
  }

  // Separate SNT vs Starter Kit 100 Kit
  const sntList = useMemo(() => {
    return paketList.filter(p => p.tipeProgram !== 'STARTER_KIT_100')
  }, [paketList])

  const paket100 = useMemo(() => {
    return paketList.find(p => p.tipeProgram === 'STARTER_KIT_100')
  }, [paketList])

  // Parse 5 Lokasi Distribusi
  const distribusiList = useMemo(() => {
    if (!paket100?.distribusiLokasiJson) {
      return [
        { id: 'ikn', namaLokasi: 'IKN (Ibu Kota Nusantara)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah IKN', sekolahTujuan: 'Wilayah IKN', nomorSurat: '01/BAST/KIT-IOT/IKN/2026', tanggalKirim: '2026-10-22' },
        { id: 'bogor', namaLokasi: 'Bogor (Jawa Barat)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Bogor', sekolahTujuan: 'Wilayah Bogor', nomorSurat: '02/BAST/KIT-IOT/BGR/2026', tanggalKirim: '2026-10-22' },
        { id: 'cianjur', namaLokasi: 'Cianjur (Jawa Barat)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Cianjur', sekolahTujuan: 'Wilayah Cianjur', nomorSurat: '03/BAST/KIT-IOT/CJR/2026', tanggalKirim: '2026-10-22' },
        { id: 'donggala', namaLokasi: 'Donggala (Sulawesi Tengah)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Donggala', sekolahTujuan: 'Wilayah Donggala', nomorSurat: '04/BAST/KIT-IOT/DGL/2026', tanggalKirim: '2026-10-22' },
        { id: 'tarakan', namaLokasi: 'Tarakan (Kalimantan Utara)', alokasiKit: 20, ekstraCharger: 1, penerimaNama: 'Penanggung Jawab Wilayah Tarakan', sekolahTujuan: 'Wilayah Tarakan', nomorSurat: '05/BAST/KIT-IOT/TRK/2026', tanggalKirim: '2026-10-22' }
      ]
    }
    try {
      const parsed = typeof paket100.distribusiLokasiJson === 'string'
        ? JSON.parse(paket100.distribusiLokasiJson)
        : paket100.distribusiLokasiJson
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : []
    } catch (e) {
      return []
    }
  }, [paket100])

  // Parse Rekap Vendor
  const vendorList = useMemo(() => {
    if (!paket100?.notaVendorJson) {
      return [
        { vendor: 'PCM Elektronik', itemsCount: 13, totalPagu: 46745000, totalReal: 46745000, status: 'Sudah order' },
        { vendor: 'CNC Store Bandung', itemsCount: 17, totalPagu: 45241000, totalReal: 45241000, status: 'Sudah order' },
        { vendor: 'Percetakan (Alqori, Surya, Online Print)', itemsCount: 3, totalPagu: 13950000, totalReal: 13950000, status: 'Cari harga' },
        { vendor: 'QC & Perakitan Internal', itemsCount: 1, totalPagu: 7550000, totalReal: 7550000, status: 'Cari harga' },
        { vendor: 'The Box 03', itemsCount: 1, totalPagu: 4400000, totalReal: 4400000, status: 'Sudah order' },
        { vendor: 'Shopee (kyware, rzaelectro, dll)', itemsCount: 6, totalPagu: 1746440, totalReal: 1746440, status: 'Lunas' },
        { vendor: 'Cadangan Kabel & Acuan', itemsCount: 1, totalPagu: 750000, totalReal: 750000, status: 'Cari harga' }
      ]
    }
    try {
      const parsed = typeof paket100.notaVendorJson === 'string'
        ? JSON.parse(paket100.notaVendorJson)
        : paket100.notaVendorJson
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : []
    } catch (e) {
      return []
    }
  }, [paket100])

  const handlePrintBast100Kit = (lokasiData: any) => {
    if (!paket100) return
    const html = generateBast100KitHtml(paket100, lokasiData, paket100.items || [])
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  // Filtered Cashflow transactions
  const filteredCashflowList = useMemo(() => {
    if (!cashSearch.trim()) return cashflow?.transactions || []
    const q = cashSearch.toLowerCase()
    return (cashflow?.transactions || []).filter((t: any) =>
      (t.description || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.journalEntryNumber || '').toLowerCase().includes(q) ||
      (t.paymentMethod || '').toLowerCase().includes(q)
    )
  }, [cashflow, cashSearch])

  const handlePrintBukuKas = () => {
    const html = generateBukuKasIotHtml({
      projectName: 'Pengadaan Starter Kit IoT (100 Kit - 5 Wilayah)',
      totalMasuk: cashflow?.totalMasuk || 0,
      totalKeluar: cashflow?.totalKeluar || 0,
      sisaSaldo: cashflow?.sisaSaldo || 0,
      transactions: cashflow?.transactions || []
    })
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => {
        win.print()
      }, 700)
    }
  }

  const handleSaveCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cashFormData.amount || Number(cashFormData.amount) <= 0) {
      alert('Masukkan nominal transaksi yang valid')
      return
    }
    if (!cashFormData.description.trim()) {
      alert('Masukkan keterangan/uraian transaksi')
      return
    }

    setIsSavingCash(true)
    try {
      const res = await createIoTCashTransaction({
        type: cashFormType,
        amount: Number(cashFormData.amount),
        category: cashFormData.category,
        description: cashFormData.description,
        date: cashFormData.date,
        paymentMethod: cashFormData.paymentMethod,
        receiptUrl: cashFormData.receiptUrl
      })

      if (!res?.success) {
        alert('Gagal menyimpan transaksi: ' + (res?.error || 'Kesalahan server'))
        return
      }

      // Reload fresh cashflow data
      const updated = await getIoTCashflowData()
      if (updated?.success) {
        setCashflow(updated)
      }

      setShowCashModal(false)
      setCashFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: cashFormType === 'INCOME' ? 'Penerimaan SP2D Kemendikbud' : 'A. IoT CORE KIT',
        description: '',
        paymentMethod: 'Bank BCA (111.11.101)',
        receiptUrl: ''
      })
      alert(`Transaksi ${cashFormType === 'INCOME' ? 'Kas Masuk' : 'Pengeluaran'} berhasil dicatat dan langsung terjurnal otomatis di Akuntansi Utama!`)
      router.refresh()
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setIsSavingCash(false)
    }
  }

  const handleDeleteCashTransaction = async (t: any) => {
    if (!confirm(`Hapus transaksi "${t.description}" sebesar ${formatCurrency(t.amount)}?\nJurnal Akuntansi Utama terkait juga akan dihapus secara otomatis.`)) {
      return
    }

    setDeletingCashId(t.id)
    try {
      const res = await deleteIoTCashTransaction(t.id)
      if (!res?.success) {
        alert('Gagal menghapus: ' + (res?.error || 'Kesalahan server'))
        return
      }

      const updated = await getIoTCashflowData()
      if (updated?.success) {
        setCashflow(updated)
      }
      router.refresh()
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || err))
    } finally {
      setDeletingCashId(null)
    }
  }

  // Filter list SNT
  const filteredList = sntList.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      (p.lokasiSNT || '').toLowerCase().includes(q) ||
      (p.namaPaket || '').toLowerCase().includes(q) ||
      (p.nomorSurat || '').toLowerCase().includes(q) ||
      (p.pihakKeduaNama || '').toLowerCase().includes(q) ||
      (p.fasilitator?.namaLengkap || '').toLowerCase().includes(q)
    )
  })

  // SNT Summary Metrics
  const totalLokasi = sntList.length
  const totalPaguAll = sntList.reduce((sum, p) => sum + (p.totalPaguRAB || 0), 0)
  const totalRealAll = sntList.reduce((sum, p) => sum + (p.totalRealisasi || 0), 0)
  const totalSisaAll = totalPaguAll - totalRealAll

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Bot className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Pengadaan Alat & Bahan IoT / Robotika
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Penyusunan Rencana Anggaran Biaya (RAB), Berita Acara Serah Terima (BAST), dan Laporan Pertanggungjawaban serah terima barang per lokasi SNT. Terintegrasi langsung dengan <strong>RAB Kategori D (Biaya IoT/Robotic)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard-rab"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Dashboard RAB</span>
          </Link>

          <button
            onClick={() => {
              setFormData({
                lokasiSNT: '',
                namaPaket: '',
                lingkupProyek: 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
                nomorSurat: `……/RE/SNT-K2/X/${new Date().getFullYear()}`,
                tanggalSurat: new Date().toISOString().split('T')[0],
                fasilitatorId: '',
                mengetahuiNama: '',
                mengetahuiNip: '',
                mengetahuiJabatan: 'Kepala SNT',
                persenCadangan: 10,
                loadDefaultTemplate: true
              })
              setShowCreateModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Paket IoT Baru</span>
          </button>
        </div>
      </div>

      {/* PROGRAM LEVEL TABS */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveProgramTab('SNT')}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
            activeProgramTab === 'SNT'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4 text-blue-600" />
          <span>Program SNT (Per Sekolah / Lokasi)</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] font-bold">
            {sntList.length} Lokasi
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveProgramTab('STARTER_KIT_100')}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
            activeProgramTab === 'STARTER_KIT_100'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-600" />
          <span>Pengadaan Starter Kit IoT (100 Kit - 5 Lokasi)</span>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            SPK Rp 238,55 Jt
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveProgramTab('BUKU_KAS_100')}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
            activeProgramTab === 'BUKU_KAS_100'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4 text-indigo-600" />
          <span>Buku Kas &amp; Keluar-Masuk (100 Kits)</span>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
            Saldo: {formatCurrency(cashflow?.sisaSaldo || 0)}
          </Badge>
        </button>
      </div>

      {/* VIEW FOR TAB 1: PROGRAM SNT */}
      {activeProgramTab === 'SNT' && (
        <div className="space-y-6">
          {/* METRIC STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
                  <span>Total Lokasi SNT</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{totalLokasi} Lokasi</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Paket pengadaan robotika sekolah</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
                  <span>Total Pagu RAB</span>
                  <Layers className="w-4 h-4 text-indigo-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">{formatCurrency(totalPaguAll)}</div>
                <p className="text-[11px] text-indigo-600/80 mt-0.5">Total rencana anggaran Kategori D</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
                  <span>Realisasi Belanja</span>
                  <Coins className="w-4 h-4 text-emerald-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRealAll)}</div>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Total realisasi belanja diserahterimakan</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
                  <span>Sisa Anggaran Pagu</span>
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalSisaAll < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCurrency(totalSisaAll)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {totalSisaAll < 0 ? 'Melebihi total pagu rencana' : 'Sisa saldo alokasi Kategori D'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* SEARCH BAR & LIST */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/70 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Daftar Paket Pengadaan Alat & Bahan Robotika (Program SNT)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Pilih paket lokasi untuk mengedit 51+ item alat bahan, mencetak BAST resmi, Dokumen RAB, atau Laporan Lengkap.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari lokasi, fasilitator, no. surat..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase border-b text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center" style={{ width: '40px' }}>No</th>
                      <th className="px-4 py-3">Lokasi SNT &amp; Satuan Pendidikan</th>
                      <th className="px-4 py-3">Fasilitator Penerima</th>
                      <th className="px-4 py-3">Nomor &amp; Tanggal Surat</th>
                      <th className="px-4 py-3 text-right">Pagu RAB</th>
                      <th className="px-4 py-3 text-right">Realisasi Belanja</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center" style={{ width: '250px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">
                          Belum ada paket pengadaan alat/bahan IoT untuk Program SNT. Klik tombol "+ Buat Paket IoT Baru" di atas.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((paket, idx) => {
                        const totalRAB = paket.totalPaguRAB || 0
                        const totalReal = paket.totalRealisasi || 0
                        const itCount = paket.items?.length || 0

                        return (
                          <tr key={paket.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-medium text-slate-900">
                              <div className="font-bold text-sm text-blue-900">{paket.lokasiSNT}</div>
                              <div className="text-[11px] text-slate-500">{paket.namaPaket}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{itCount} item alat & bahan terdaftar</div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-700">
                              <div className="font-semibold">{paket.pihakKeduaNama || paket.fasilitator?.namaLengkap || '–'}</div>
                              <div className="text-[11px] text-slate-500">{paket.pihakKeduaJabatan || 'Fasilitator'}</div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                              <div>{paket.nomorSurat || '–'}</div>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {paket.tanggalSurat ? new Date(paket.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-indigo-900">
                              {formatCurrency(totalRAB)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                              {formatCurrency(totalReal)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge 
                                variant="secondary"
                                className={`text-[10px] font-semibold ${
                                  paket.status === 'DITERIMA' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : paket.status === 'DIKIRIM' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {paket.status || 'DRAFT'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/alat-bahan-iot/${paket.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium transition-colors"
                                  title="Buka detail & kelola item"
                                >
                                  <span>Kelola</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handlePrintBastSnt(paket)}
                                  className="p-1.5 text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
                                  title="Cetak Berita Acara Serah Terima (BAST Resmi)"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-700" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handlePrintLaporanLengkap(paket)}
                                  className="p-1.5 text-purple-700 hover:bg-purple-50 rounded border border-purple-200 transition-colors cursor-pointer"
                                  title="Cetak Laporan Lengkap Pengadaan IoT (Narasi, RAB, BAST, Realisasi & Bukti Nota)"
                                >
                                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handlePrintRAB(paket)}
                                  className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200 transition-colors cursor-pointer"
                                  title="Cetak Dokumen RAB Rencana (Format Tidore)"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  disabled={deletingId === paket.id}
                                  onClick={() => handleDelete(paket)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Hapus Paket"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW FOR TAB 2: STARTER KIT IOT 100 KIT */}
      {activeProgramTab === 'STARTER_KIT_100' && (
        <div className="space-y-6">
          {/* COMMERCIAL OVERVIEW BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-emerald-800 flex items-center justify-between">
                  <span>Nilai Kontrak SPK</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">
                  {formatCurrency(paket100?.nilaiKontrakSPK || 238550000)}
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">DPP Proyek Pengadaan 100 Kit</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-amber-800 flex items-center justify-between">
                  <span>Potongan PPh 22 (1.5%)</span>
                  <Percent className="w-4 h-4 text-amber-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-950">
                  {formatCurrency(paket100?.potonganPPh22 || 3578250)}
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">Pajak Penghasilan Pasal 22</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/40 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-blue-800 flex items-center justify-between">
                  <span>Total Belanja (HPP)</span>
                  <Coins className="w-4 h-4 text-blue-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-950">
                  {formatCurrency(paket100?.totalRealisasi || 120382440)}
                </div>
                <p className="text-[11px] text-blue-700 mt-0.5">4 Pos Kategori F Dashboard RAB</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/40 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-purple-800 flex items-center justify-between">
                  <span>Estimasi Laba Bersih</span>
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-950">
                  {formatCurrency(paket100?.estimasiLaba || 114589310)}
                </div>
                <p className="text-[11px] text-purple-700 mt-0.5 font-bold">
                  Margin Laba: {((((paket100?.estimasiLaba || 114589310) / (paket100?.nilaiKontrakSPK || 238550000))) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* MAIN CARD FOR 100 KIT */}
          {paket100 ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded text-[10px] font-bold tracking-wider uppercase">
                        Proyek Non-SNT Terpusat
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-[10px] font-bold tracking-wider uppercase">
                        Dashboard RAB: Kategori F
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                      {paket100.namaPaket}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Pengadaan 100 Starter Kit IoT lengkap yang dikemas dalam 100 Box Kontainer 15L dan didistribusikan merata ke <strong>5 Wilayah</strong> (@ 20 Kit + 1 Unit Charger Laptop).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/alat-bahan-iot/${paket100.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <span>Kelola &amp; Edit 46 Item</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/alat-bahan-iot/${paket100.id}?tab=receipts`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      title="Buka langsung tab unggah nota & invoice"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Nota &amp; Invoice</span>
                    </Link>

                    <label 
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                      title="Sinkronkan data belanja Starter Kit IoT langsung dari file Excel"
                    >
                      {isSyncingExcel100 ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                      <span>{isSyncingExcel100 ? 'Menyinkronkan...' : 'Update dari Excel (.xlsx)'}</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleSyncExcel100(e, paket100.id)}
                        className="hidden"
                        disabled={isSyncingExcel100}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handlePrintRAB(paket100)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak RAB (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveProgramTab('BUKU_KAS_100')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      title="Buka Buku Kas Keluar-Masuk & SP2D Proyek 100 Kits"
                    >
                      <Coins className="w-4 h-4" />
                      <span>Buku Kas &amp; SP2D Proyek</span>
                    </button>

                    <Link
                      href="/dashboard-rab"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Lihat Kategori F</span>
                    </Link>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* 5 LOKASI DISTRIBUSI & CETAK BAST SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <span>Distribusi 5 Lokasi Pengiriman &amp; Cetak BAST</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Alokasi merata 20 Starter Kit IoT + 1 Charger Baterai 18650 (4-Slot USB) per wilayah. Klik tombol "Cetak BAST (PDF)" untuk mencetak dokumen serah terima resmi per lokasi.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 uppercase border-b text-[11px]">
                        <tr>
                          <th className="px-4 py-3 text-center" style={{ width: '40px' }}>No</th>
                          <th className="px-4 py-3">Lokasi / Wilayah Distribusi</th>
                          <th className="px-4 py-3 text-center">Alokasi Kit</th>
                          <th className="px-4 py-3 text-center">Ekstra Perangkat</th>
                          <th className="px-4 py-3">Penanggung Jawab / Penerima</th>
                          <th className="px-4 py-3 font-mono">No. Surat BAST</th>
                          <th className="px-4 py-3 text-center">Status Dokumen</th>
                          <th className="px-4 py-3 text-center" style={{ width: '160px' }}>Aksi Cetak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {distribusiList.map((lokasi: any, idx: number) => (
                          <tr key={lokasi.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="text-sm text-slate-900">{lokasi.namaLokasi}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-bold">
                                {lokasi.alokasiKit} Unit Kit IoT
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge className="bg-amber-100 text-amber-900 border-amber-200 font-medium">
                                {lokasi.ekstraCharger || 1} Charger Baterai 18650 (4-Slot)
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-slate-700">
                              <div className="font-semibold text-slate-900">{lokasi.penerimaNama || '–'}</div>
                              <div className="text-[11px] text-slate-500">{lokasi.sekolahTujuan || lokasi.namaLokasi}</div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                              {lokasi.nomorSurat || '–'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Siap Cetak</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handlePrintBast100Kit(lokasi)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                title={`Cetak Berita Acara Serah Terima (BAST) untuk ${lokasi.namaLokasi}`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Cetak BAST (PDF)</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2-COLUMN SUMMARY: POS BELANJA & REKAP VENDOR */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  {/* LEFT: 4 POS BELANJA KATEGORI F */}
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-slate-50 border-b pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>4 Pos Belanja (Kategori F di Dashboard RAB)</span>
                        </CardTitle>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          {formatCurrency(107753440)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/50 text-slate-600 uppercase border-b text-[10px]">
                          <tr>
                            <th className="px-3.5 py-2.5">Pos Belanja</th>
                            <th className="px-3.5 py-2.5 text-center">Vol</th>
                            <th className="px-3.5 py-2.5 text-right">Pagu / Belanja</th>
                            <th className="px-3.5 py-2.5 text-center">Porsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900">
                              A. IoT CORE KIT
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">25 item</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">{formatCurrency(63800000)}</td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500 font-mono">59.2%</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900">
                              B. PERANGKAT PENDUKUNG
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">10 item</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">{formatCurrency(30380000)}</td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500 font-mono">28.2%</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900">
                              C. KEMASAN &amp; KELENGKAPAN / QC
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">8 item</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">{formatCurrency(12517000)}</td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500 font-mono">11.6%</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900">
                              D. TAMBAHAN &amp; ONGKIR PENGIRIMAN
                            </td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500">3 item</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">{formatCurrency(1056440)}</td>
                            <td className="px-3.5 py-2.5 text-center text-slate-500 font-mono">1.0%</td>
                          </tr>
                          <tr className="bg-indigo-50/60 font-bold border-t text-indigo-950">
                            <td className="px-3.5 py-2.5">Total Belanja (4 Pos Kategori F)</td>
                            <td className="px-3.5 py-2.5 text-center">46 item</td>
                            <td className="px-3.5 py-2.5 text-right text-indigo-900">{formatCurrency(107753440)}</td>
                            <td className="px-3.5 py-2.5 text-center">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* RIGHT: REKAP VENDOR REKANAN */}
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-slate-50 border-b pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>Rekapitulasi Pembelian per Rekanan Vendor</span>
                        </CardTitle>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {vendorList.length} Vendor
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/50 text-slate-600 uppercase border-b text-[10px]">
                          <tr>
                            <th className="px-3.5 py-2.5">Vendor / Suplier</th>
                            <th className="px-3.5 py-2.5 text-center">Item</th>
                            <th className="px-3.5 py-2.5 text-right">Total Belanja</th>
                            <th className="px-3.5 py-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vendorList.map((v: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3.5 py-2.5 font-medium text-slate-900">
                                {v.vendor}
                              </td>
                              <td className="px-3.5 py-2.5 text-center text-slate-500 font-mono">
                                {v.itemsCount} item
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                {formatCurrency(v.totalReal || v.totalPagu)}
                              </td>
                              <td className="px-3.5 py-2.5 text-center">
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {v.status || 'Lunas'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-emerald-50/60 font-bold border-t text-emerald-950">
                            <td className="px-3.5 py-2.5">Total Seluruh Rekanan Vendor</td>
                            <td className="px-3.5 py-2.5 text-center font-mono">46 item</td>
                            <td className="px-3.5 py-2.5 text-right text-emerald-900">{formatCurrency(107753440)}</td>
                            <td className="px-3.5 py-2.5 text-center">
                              <span className="text-emerald-700">Lunas</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center bg-white border border-dashed rounded-xl">
              <p className="text-sm text-slate-500">Paket Pengadaan Starter Kit IoT belum ditemukan.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW FOR TAB 3: BUKU KAS & KELUAR MASUK PROYEK 100 KITS */}
      {activeProgramTab === 'BUKU_KAS_100' && (
        <div className="space-y-6">
          {/* KPI STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-emerald-800 flex items-center justify-between">
                  <span>Total Kas Masuk (SP2D)</span>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950 font-mono">
                  {formatCurrency(cashflow?.totalMasuk || 233779000)}
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  2 SP2D Ditjen PAUD (Netto Cair Bank BCA)
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-rose-50/50 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-rose-800 flex items-center justify-between">
                  <span>Total Kas Keluar (Belanja)</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-950 font-mono">
                  {formatCurrency(cashflow?.totalKeluar || 101986940)}
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Realisasi Belanja 4 Pos Kategori F
                </p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/50 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-indigo-800 flex items-center justify-between">
                  <span>Sisa Saldo Kas Proyek</span>
                  <Wallet className="w-4 h-4 text-indigo-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-950 font-mono">
                  {formatCurrency(cashflow?.sisaSaldo !== undefined ? cashflow.sisaSaldo : 131792060)}
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5 font-medium">
                  Saldo Kas Tersedia di Rekening Bank BCA
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/80 shadow-xs">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase text-slate-700 flex items-center justify-between">
                  <span>Integrasi Akuntansi</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                    POSTED (Otomatis)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Tersinkron ke Buku Besar BCA (111.11.101) &amp; Jurnal Umum
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2 SP2D VERIFIED SUMMARY BANNER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    SP2D Termin 1 (60%)
                  </span>
                  <span className="text-xs font-mono text-emerald-800 font-semibold">
                    No. 260880000135881
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-emerald-950 mt-2">
                  Rp 140.267.400 <span className="text-xs font-normal text-emerald-700">(Netto Cair)</span>
                </h4>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p><strong>SPM Bruto:</strong> Rp 158.874.300 &bull; <strong>Potongan Pajak:</strong> Rp 18.606.900</p>
                  <p><strong>Kontrak:</strong> 0717a/PPK1.3/PR/2026 (15 Okt 2026)</p>
                  <p><strong>BAST:</strong> 0901a/PPK1.3/PR/2026 (5 Nov 2026)</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200/70 flex items-center justify-between">
                <span className="text-[11px] text-emerald-800 font-medium">Satker Ditjen PAUD Dikdas Dikmen</span>
                <a
                  href="/documents/sp2d/sp2d-158-jully.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat PDF SP2D</span>
                </a>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 bg-teal-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    SP2D Termin 2 (40%)
                  </span>
                  <span className="text-xs font-mono text-teal-800 font-semibold">
                    No. 260880000135880
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-teal-950 mt-2">
                  Rp 93.511.600 <span className="text-xs font-normal text-teal-700">(Netto Cair)</span>
                </h4>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p><strong>SPM Bruto:</strong> Rp 105.916.200 &bull; <strong>Potongan Pajak:</strong> Rp 12.404.600</p>
                  <p><strong>Kontrak:</strong> 0717b/PPK1.3/PR/2026 (15 Okt 2026)</p>
                  <p><strong>BAST:</strong> 0901b/PPK1.3/PR/2026 (5 Nov 2026)</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-teal-200/70 flex items-center justify-between">
                <span className="text-[11px] text-teal-800 font-medium">Satker Ditjen PAUD Dikdas Dikmen</span>
                <a
                  href="/documents/sp2d/sp2d-105-jully.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-[11px] font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat PDF SP2D</span>
                </a>
              </div>
            </div>
          </div>

          {/* TABLE MUTASI KAS & ACTIONS */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/80 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>Daftar Mutasi Kas Masuk &amp; Keluar Proyek IoT 100 Kits</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Buku kas sederhana proyek dengan integrasi otomatis ke Jurnal Akuntansi Umum &amp; Buku Besar Kas/Bank BCA.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={cashSearch}
                      onChange={e => setCashSearch(e.target.value)}
                      placeholder="Cari transaksi, SP2D, nota..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCashFormType('INCOME')
                      setCashFormData({
                        date: new Date().toISOString().split('T')[0],
                        amount: '',
                        category: 'Penerimaan SP2D Kemendikbud',
                        description: '',
                        paymentMethod: 'Bank BCA (111.11.101)',
                        receiptUrl: ''
                      })
                      setShowCashModal(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Catat Uang Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCashFormType('EXPENSE')
                      setCashFormData({
                        date: new Date().toISOString().split('T')[0],
                        amount: '',
                        category: 'A. IoT CORE KIT',
                        description: '',
                        paymentMethod: 'Bank BCA (111.11.101)',
                        receiptUrl: ''
                      })
                      setShowCashModal(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>- Catat Pengeluaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintBukuKas}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    title="Cetak Laporan Buku Kas Proyek (PDF)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak PDF Buku Kas</span>
                  </button>

                  <Link
                    href="/jurnal"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-semibold transition-colors"
                    title="Lihat seluruh Jurnal Umum di Akuntansi Utama"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Jurnal Umum</span>
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase border-b text-[10px]">
                    <tr>
                      <th className="px-3.5 py-3 text-center" style={{ width: '35px' }}>No</th>
                      <th className="px-3.5 py-3" style={{ width: '90px' }}>Tanggal</th>
                      <th className="px-3.5 py-3 text-center" style={{ width: '100px' }}>Jenis</th>
                      <th className="px-3.5 py-3">Kategori &amp; Dokumen</th>
                      <th className="px-3.5 py-3">Uraian / Keterangan</th>
                      <th className="px-3.5 py-3" style={{ width: '120px' }}>Metode / Kas</th>
                      <th className="px-3.5 py-3 text-right" style={{ width: '120px' }}>Masuk (Rp)</th>
                      <th className="px-3.5 py-3 text-right" style={{ width: '120px' }}>Keluar (Rp)</th>
                      <th className="px-3.5 py-3 text-right" style={{ width: '130px' }}>Saldo (Rp)</th>
                      <th className="px-3.5 py-3 text-center" style={{ width: '120px' }}>Jurnal Utama</th>
                      <th className="px-3.5 py-3 text-center" style={{ width: '60px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCashflowList.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-12 text-slate-400">
                          Belum ada catatan mutasi kas. Gunakan tombol "+ Catat Uang Masuk" atau "- Catat Pengeluaran" di atas.
                        </td>
                      </tr>
                    ) : (
                      filteredCashflowList.map((t: any, idx: number) => {
                        const isIncome = t.type === 'INCOME'

                        return (
                          <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3.5 py-3 text-center font-mono text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-slate-600 whitespace-nowrap">
                              {new Date(t.date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <Badge
                                className={
                                  isIncome
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]'
                                    : 'bg-rose-100 text-rose-800 border-rose-200 font-bold text-[10px]'
                                }
                              >
                                {isIncome ? 'UANG MASUK' : 'UANG KELUAR'}
                              </Badge>
                            </td>
                            <td className="px-3.5 py-3 font-semibold text-slate-800">
                              <div>{t.category || (isIncome ? 'Penerimaan Proyek' : 'Pengeluaran Proyek')}</div>
                              {t.receiptUrl && (
                                <a
                                  href={t.receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Lampiran Dokumen</span>
                                </a>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-slate-700 max-w-xs">
                              <div className="font-normal text-[11px] leading-relaxed line-clamp-2" title={t.description}>
                                {t.description}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {t.paymentMethod || 'Bank BCA'}
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-700">
                              {isIncome ? formatCurrency(t.amount) : '–'}
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono font-bold text-rose-600">
                              {!isIncome ? formatCurrency(t.amount) : '–'}
                            </td>
                            <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                              {formatCurrency(t.runningBalance !== undefined ? t.runningBalance : 0)}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              {t.journalEntryNumber ? (
                                <Link
                                  href="/jurnal"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-mono text-[10px] font-bold transition-colors"
                                  title="Lihat Jurnal di Akuntansi Utama"
                                >
                                  <span>{t.journalEntryNumber}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  POSTED
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <button
                                type="button"
                                disabled={deletingCashId === t.id}
                                onClick={() => handleDeleteCashTransaction(t)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-40 cursor-pointer"
                                title="Hapus transaksi ini dan jurnal terkait"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100/80 font-bold border-t text-slate-900 text-[11px]">
                    <tr>
                      <td colSpan={6} className="px-3.5 py-3 text-right uppercase tracking-wider">
                        Total Rekapitulasi:
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-emerald-800">
                        {formatCurrency(cashflow?.totalMasuk || 0)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-rose-800">
                        {formatCurrency(cashflow?.totalKeluar || 0)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-indigo-950 bg-indigo-50/60 font-black">
                        {formatCurrency(cashflow?.sisaSaldo || 0)}
                      </td>
                      <td colSpan={2} className="px-3.5 py-3 text-center text-slate-500 font-normal text-[10px]">
                        Sinkron Akuntansi
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL CATAT KAS KELUAR MASUK */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {cashFormType === 'INCOME' ? 'Catat Kas Masuk (Penerimaan)' : 'Catat Pengeluaran (Belanja)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Otomatis terjurnal ke Akuntansi Utama &amp; Buku Besar Kas/Bank BCA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCashModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashTransaction} className="space-y-4 mt-4 text-xs">
              <div className="flex border rounded-lg overflow-hidden p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCashFormType('INCOME')
                    setCashFormData(prev => ({
                      ...prev,
                      category: 'Penerimaan SP2D Kemendikbud'
                    }))
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    cashFormType === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Uang Masuk (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashFormType('EXPENSE')
                    setCashFormData(prev => ({
                      ...prev,
                      category: 'A. IoT CORE KIT'
                    }))
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    cashFormType === 'EXPENSE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran (-)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Transaksi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={cashFormData.date}
                  onChange={e => setCashFormData({ ...cashFormData, date: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Contoh: 5000000"
                  value={cashFormData.amount}
                  onChange={e => setCashFormData({ ...cashFormData, amount: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white font-mono font-bold"
                />
                {cashFormData.amount && (
                  <p className="text-[11px] text-indigo-700 font-medium mt-1">
                    {formatCurrency(Number(cashFormData.amount))}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={cashFormData.category}
                  onChange={e => setCashFormData({ ...cashFormData, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                >
                  {cashFormType === 'INCOME' ? (
                    <>
                      <option value="Penerimaan SP2D Kemendikbud">Penerimaan SP2D Kemendikbud</option>
                      <option value="Uang Muka Proyek (DP)">Uang Muka Proyek (DP)</option>
                      <option value="Pelunasan Proyek IoT">Pelunasan Proyek IoT</option>
                      <option value="Pendapatan Tambahan Proyek">Pendapatan Tambahan Proyek</option>
                      <option value="Pengembalian Sisa Belanja">Pengembalian Sisa Belanja</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option value="A. IoT CORE KIT">A. IoT CORE KIT</option>
                      <option value="B. PERANGKAT PENDUKUNG">B. PERANGKAT PENDUKUNG</option>
                      <option value="C. KEMASAN & KELENGKAPAN / QC">C. KEMASAN & KELENGKAPAN / QC</option>
                      <option value="D. TAMBAHAN & ONGKIR">D. TAMBAHAN & ONGKIR</option>
                      <option value="Belanja PCM Elektronik">Belanja PCM Elektronik</option>
                      <option value="Belanja CNC Store Bandung">Belanja CNC Store Bandung</option>
                      <option value="Belanja The Box 03">Belanja The Box 03</option>
                      <option value="Belanja Percetakan">Belanja Percetakan</option>
                      <option value="Belanja Shopee/Marketplace">Belanja Shopee/Marketplace</option>
                      <option value="Biaya QC & Perakitan Internal">Biaya QC & Perakitan Internal</option>
                      <option value="Biaya Operasional & Ekspedisi">Biaya Operasional & Ekspedisi</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uraian / Keterangan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={
                    cashFormType === 'INCOME'
                      ? 'Contoh: Penerimaan SP2D No. ... Kontrak ... BAST ...'
                      : 'Contoh: Pembelian solder, multimeter, ESP32 di vendor ...'
                  }
                  value={cashFormData.description}
                  onChange={e => setCashFormData({ ...cashFormData, description: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Akun Kas / Bank
                </label>
                <input
                  type="text"
                  disabled
                  value="Bank BCA (111.11.101)"
                  className="w-full border rounded-md px-3 py-2 text-xs bg-slate-100 text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Bukti Nota / Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://... atau /documents/..."
                  value={cashFormData.receiptUrl}
                  onChange={e => setCashFormData({ ...cashFormData, receiptUrl: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                <p>
                  <strong>Catatan Otomasi:</strong> Transaksi ini akan langsung membuat entri jurnal double-entry otomatis di Akuntansi Utama dengan nomor urut <code>JU-2026-xxxx</code> dan status <code>POSTED</code>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="px-4 py-2 border rounded-md text-xs text-slate-700 hover:bg-slate-50"
                  disabled={isSavingCash}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCash}
                  className={`px-4 py-2 text-white rounded-md text-xs font-bold flex items-center gap-2 disabled:opacity-50 ${
                    cashFormType === 'INCOME'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSavingCash ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan &amp; Menjurnal...</span>
                    </>
                  ) : (
                    <span>Simpan Transaksi &amp; Jurnal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUAT PAKET BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Buat Paket Alat & Bahan IoT Baru</h3>
                <p className="text-xs text-slate-500">
                  Paket akan otomatis membuat Pos Item di Kategori D RAB aplikasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Fasilitator Terkait (Opsional)
                </label>
                <select
                  value={formData.fasilitatorId}
                  onChange={e => handleSelectFasilitator(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                >
                  <option value="">-- Pilih Fasilitator --</option>
                  {fasilitators.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.namaLengkap} ({f.lokasiSNT || 'Tanpa Lokasi'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi SNT / Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SNT 5 Tidore Kepulauan, SNT 5 Kupang, SNT Jayapura"
                  value={formData.lokasiSNT}
                  onChange={e => {
                    const val = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      lokasiSNT: val,
                      namaPaket: prev.namaPaket || `Pengadaan Alat dan Bahan Robotika - ${val}`
                    }))
                  }}
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Paket Pengadaan
                </label>
                <input
                  type="text"
                  value={formData.namaPaket}
                  onChange={e => setFormData({ ...formData, namaPaket: e.target.value })}
                  placeholder="Pengadaan Alat dan Bahan Robotika - [Lokasi]"
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Surat BAST / Laporan
                  </label>
                  <input
                    type="text"
                    value={formData.nomorSurat}
                    onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                    placeholder="01/RE/SNT-K2/X/2026"
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalSurat}
                    onChange={e => setFormData({ ...formData, tanggalSurat: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kepala Sekolah / Pengetahu (Mengetahui)
                </label>
                <input
                  type="text"
                  value={formData.mengetahuiNama}
                  onChange={e => setFormData({ ...formData, mengetahuiNama: e.target.value })}
                  placeholder="Nama Kepala Sekolah SNT"
                  className="w-full border rounded-md px-3 py-2 text-xs bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-blue-900 font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.loadDefaultTemplate}
                    onChange={e => setFormData({ ...formData, loadDefaultTemplate: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Muat Template Standar (51 Item Bawaan Robotika IoT)</span>
                </label>
                <p className="text-[11px] text-blue-700 leading-relaxed pl-6">
                  Otomatis mengisi 51 item lengkap (Solder, ESP32, Sensor, Rangka Rover, Smart Lamp, Smart Garden). Anda tetap bebas menambah, mengubah volume/harga, atau menghapus item setelah paket dibuat.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-md text-xs text-slate-700 hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Buat &amp; Buka Editor Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
