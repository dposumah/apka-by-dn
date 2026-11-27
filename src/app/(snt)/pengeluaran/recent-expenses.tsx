'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { updateExpense, deleteExpense } from '@/app/actions/rab'
import { generateKwitansiExpense, generateInvoiceExpense } from '@/app/actions/rekap'
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Printer, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Calendar, 
  Paperclip, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { uploadFileClient } from '@/lib/upload-client'
import {
  getEditableExpenseNotaUrls,
  getExpenseReceiptUrls,
  renderReceiptAttachmentPagesHtml,
} from '@/lib/expense-receipts'
import {
  DEFAULT_ROBOTIC_PREPARER_LABEL,
  formatMonthPeriodId,
  isSlipHonorariumRabCode,
  renderModernInvoiceHtml,
  renderModernKuitansiHtml,
  renderSlipHonorariumHtml,
  resolveBrandKopTheme,
  resolvePersonnelRoleFromRab,
} from '@/lib/snt-brand-kop'
import { resolveEntityCodeFromKop } from '@/lib/snt-doc-numbering'
import type { KopSuratOption } from '@/lib/snt-report-templates'

interface RecentExpensesProps {
  expenses: any[]
  items: any[]
  fasilitators: any[]
  categories?: any[]
}

export function RecentExpensesList({ expenses, items, fasilitators, categories }: RecentExpensesProps) {
  const router = useRouter()

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterFasilitator, setFilterFasilitator] = useState('ALL')
  const [filterKwitansi, setFilterKwitansi] = useState('ALL') // 'ALL' | 'HAS_KWITANSI' | 'NO_KWITANSI'
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
  const [filterRealizationType, setFilterRealizationType] = useState<'ALL' | 'REAL' | 'PELAPORAN'>('ALL')

  // Pagination states (default: 5 transaksi per halaman)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Edit Expense State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [newFiles, setNewFiles] = useState<File[]>([])

  const handleAddNewFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    const next = Array.from(incoming)
    setNewFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}:${f.lastModified}`))
      const merged = [...prev]
      for (const item of next) {
        const key = `${item.name}:${item.size}:${item.lastModified}`
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(item)
        }
      }
      return merged
    })
  }
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Print Kwitansi / Invoice Modal State
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [printInvoice, setPrintInvoice] = useState(false)
  const [printKwitansi, setPrintKwitansi] = useState(true)
  const [selectedKop, setSelectedKop] = useState<KopSuratOption>('maleo')
  const [inputNoUrut, setInputNoUrut] = useState('')
  const [inputTanggal, setInputTanggal] = useState('')
  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState('')
  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isUnlockedKwitansi, setIsUnlockedKwitansi] = useState(false)
  const [isUnlockedInvoice, setIsUnlockedInvoice] = useState(false)

  // Reset current page when filters or page size change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCategory, filterFasilitator, filterKwitansi, filterStatus, filterRealizationType, pageSize])

  // Memoized category options
  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c: any) => ({ id: c.id, name: c.name }))
    }
    const map = new Map<string, string>()
    items.forEach((item: any) => {
      if (item.categoryName && item.categoryId) {
        map.set(item.categoryId, item.categoryName)
      } else if (item.category?.id && item.category?.name) {
        map.set(item.category.id, item.category.name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [categories, items])

  // Helper to extract kwitansi record
  const getKwitansi = (expense: any) => {
    if (Array.isArray(expense.kwitansiRecord) && expense.kwitansiRecord.length > 0) {
      return expense.kwitansiRecord[expense.kwitansiRecord.length - 1]
    }
    if (expense.kwitansiRecord && typeof expense.kwitansiRecord === 'object' && !Array.isArray(expense.kwitansiRecord)) {
      return expense.kwitansiRecord
    }
    return null
  }

  // Helper to extract invoice record
  const getInvoice = (expense: any) => {
    return expense.invoiceRecord || null
  }

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense: any) => {
      // Category filter
      if (filterCategory !== 'ALL') {
        const itemCatId = expense.rabItem?.category?.id || expense.rabItem?.categoryId
        const itemCatName = expense.rabItem?.category?.name
        if (filterCategory !== itemCatId && filterCategory !== itemCatName) {
          return false
        }
      }

      // Fasilitator filter
      if (filterFasilitator !== 'ALL') {
        if (filterFasilitator === 'NON_FASIL') {
          if (expense.fasilitatorId) return false
        } else {
          if (expense.fasilitatorId !== filterFasilitator) return false
        }
      }

      // Kwitansi filter
      const kw = getKwitansi(expense)
      const hasKwitansi = Boolean(kw && kw.noKwitansi && !kw.noKwitansi.includes('TEMP'))
      if (filterKwitansi === 'HAS_KWITANSI' && !hasKwitansi) return false
      if (filterKwitansi === 'NO_KWITANSI' && hasKwitansi) return false

      // Status filter
      if (filterStatus !== 'ALL' && expense.status !== filterStatus) {
        return false
      }

      // Realization type filter (REAL vs PELAPORAN)
      if (filterRealizationType !== 'ALL') {
        const t = expense.realizationType === 'PELAPORAN' ? 'PELAPORAN' : 'REAL'
        if (t !== filterRealizationType) return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const desc = (expense.description || '').toLowerCase()
        const itemName = (expense.rabItem?.name || '').toLowerCase()
        const catName = (expense.rabItem?.category?.name || '').toLowerCase()
        const fasilName = (expense.fasilitator?.namaLengkap || '').toLowerCase()
        const lokasi = (expense.fasilitator?.lokasiSNT || '').toLowerCase()
        const amountStr = (expense.amount || '').toString()
        const kwNo = (kw?.noKwitansi || '').toLowerCase()
        const invNo = (expense.invoiceRecord?.noInvoice || '').toLowerCase()
        const dateStr = expense.date
          ? new Date(expense.date).toLocaleDateString('id-ID')
          : new Date(expense.createdAt).toLocaleDateString('id-ID')

        const matches = 
          desc.includes(q) ||
          itemName.includes(q) ||
          catName.includes(q) ||
          fasilName.includes(q) ||
          lokasi.includes(q) ||
          amountStr.includes(q) ||
          kwNo.includes(q) ||
          invNo.includes(q) ||
          dateStr.includes(q)

        if (!matches) return false
      }

      return true
    })
  }, [expenses, filterCategory, filterFasilitator, filterKwitansi, filterStatus, filterRealizationType, searchQuery])

  // Summary statistics
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
  }, [filteredExpenses])

  // Pagination calculations
  const totalItems = filteredExpenses.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice(startIndex, endIndex)
  }, [filteredExpenses, startIndex, endIndex])

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    filterCategory !== 'ALL' || 
    filterFasilitator !== 'ALL' || 
    filterKwitansi !== 'ALL' || 
    filterStatus !== 'ALL' ||
    filterRealizationType !== 'ALL'

  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterCategory('ALL')
    setFilterFasilitator('ALL')
    setFilterKwitansi('ALL')
    setFilterStatus('ALL')
    setFilterRealizationType('ALL')
    setCurrentPage(1)
  }

  // Edit Expense Actions
  const openEditModal = (expense: any) => {
    setEditData({
      id: expense.id,
      date: expense.date 
        ? new Date(expense.date).toISOString().substring(0, 10) 
        : new Date(expense.createdAt).toISOString().substring(0, 10),
      description: expense.description || '',
      amount: expense.amount || 0,
      rabItemId: expense.rabItemId || '',
      fasilitatorId: expense.fasilitatorId || '',
      realizationType: expense.realizationType === 'PELAPORAN' ? 'PELAPORAN' : 'REAL',
      keptUrls: getEditableExpenseNotaUrls(expense),
    })
    setNewFiles([])
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editData) return
    if (!editData.rabItemId) {
      alert('Pilih item anggaran RAB')
      return
    }
    if (!editData.amount || Number(editData.amount) <= 0) {
      alert('Nominal harus lebih dari 0')
      return
    }

    setIsSaving(true)
    try {
      const uploadedUrls: string[] = []

      for (const f of newFiles) {
        const url = await uploadFileClient(f, 'receipts')
        if (url) uploadedUrls.push(url)
      }

      const finalReceiptUrls = [
        ...(Array.isArray(editData.keptUrls) ? editData.keptUrls : []),
        ...uploadedUrls,
      ]

      const res = await updateExpense(editData.id, {
        date: new Date(editData.date),
        description: editData.description,
        amount: Number(editData.amount),
        rabItemId: editData.rabItemId,
        fasilitatorId: editData.fasilitatorId || undefined,
        realizationType: editData.realizationType === 'PELAPORAN' ? 'PELAPORAN' : 'REAL',
        receiptUrls: finalReceiptUrls,
        receiptUrl: finalReceiptUrls[0] || undefined,
      })

      if (res?.error) {
        throw new Error(res.error)
      }

      setShowEditModal(false)
      router.refresh()
    } catch (err: any) {
      alert('Gagal mengedit pengeluaran: ' + (err.message || err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengeluaran "${desc}"?`)) return

    setDeletingId(id)
    try {
      await deleteExpense(id)
      router.refresh()
    } catch (err: any) {
      alert('Gagal menghapus pengeluaran: ' + (err.message || err))
    } finally {
      setDeletingId(null)
    }
  }

  // Print Modal Actions
  const openPrintModal = (expense: any) => {
    setSelectedExpense(expense)
    setPrintKwitansi(true)
    setPrintInvoice(false)
    setInputNoUrut('')
    setInputInvoiceNoUrut('')
    setIsUnlockedKwitansi(false)
    setIsUnlockedInvoice(false)

    const tzoffset = (new Date()).getTimezoneOffset() * 60000
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10)
    
    const kw = getKwitansi(expense)
    if (kw?.tanggal) {
      setInputTanggal(new Date(kw.tanggal).toISOString().slice(0, 10))
    } else {
      setInputTanggal(localISOTime)
    }

    const inv = getInvoice(expense)
    if (inv?.tanggal) {
      setInputInvoiceTanggal(new Date(inv.tanggal).toISOString().slice(0, 10))
    } else {
      setInputInvoiceTanggal(localISOTime)
    }

    setSelectedKop('maleo')
    setShowPrintModal(true)
  }

  // HTML Kwitansi / Slip Honorarium Template (A.3, A.4, A.5 pakai Slip Honorarium)
  const getKwitansiHtml = (expense: any, record: any) => {
    const theme = resolveBrandKopTheme(selectedKop)
    const tgl = record.tanggal || expense.date || new Date()
    const bodyHtml = isSlipHonorariumRabCode(expense.rabItem?.code, expense.rabItem?.name)
      ? renderSlipHonorariumHtml({
          kopSurat: selectedKop,
          periode: formatMonthPeriodId(tgl),
          namaPenerima: expense.fasilitator?.namaLengkap || record.owner || theme.entityName || '................................',
          nomorDokumen: record.noKwitansi || '-',
          peranJabatan:
            expense.fasilitator?.jabatan ||
            resolvePersonnelRoleFromRab(expense.rabItem?.code, expense.rabItem?.name, expense.fasilitator?.lokasiSNT),
          kegiatan: record.perihal || `${expense.description} - ${expense.rabItem?.name || ''}`,
          tanggalKegiatan: formatMonthPeriodId(tgl),
          tanggalBayar: tgl,
          npwpNik: expense.fasilitator?.npwpNik || '-',
          rekening: [expense.fasilitator?.bankName, expense.fasilitator?.bankAccount].filter(Boolean).join(' — ') || '-',
          components: [
            {
              komponen: 'Honorarium',
              qty: '1 Paket',
              pendapatan: Number(expense.amount) || 0,
              potongan: 0,
              keterangan: record.perihal || expense.description || '-',
            },
            { komponen: 'Tambahan honorarium', qty: '-', pendapatan: 0, potongan: 0, keterangan: '-' },
            { komponen: 'Pajak / potongan lainnya', qty: '-', pendapatan: 0, potongan: 0, keterangan: '-' },
          ],
          catatan: expense.fasilitator?.lokasiSNT ? `Lokasi SNT: ${expense.fasilitator.lokasiSNT}` : `${expense.rabItem?.code || ''} - ${expense.rabItem?.name || ''}`,
          disiapkanOleh: DEFAULT_ROBOTIC_PREPARER_LABEL,
        })
      : renderModernKuitansiHtml({
          kopSurat: selectedKop,
          noKwitansi: record.noKwitansi || '-',
          sudahTerimaDari: record.owner || theme.entityName || 'Yayasan Maleo Talenta Cendekia',
          amount: Number(expense.amount) || 0,
          untukPembayaran: record.perihal || `${expense.description} - ${expense.rabItem?.name || ''}`,
          rabCode: expense.rabItem?.code || undefined,
          showRabCode: Boolean(expense.rabItem?.code),
          kota: 'Jakarta',
          tanggal: tgl,
          penerimaDisplay: expense.fasilitator ? expense.fasilitator.namaLengkap : (record.owner || theme.entityName || 'Yayasan Maleo'),
          penerimaRole: 'Yang menerima,',
          dibuatOleh: DEFAULT_ROBOTIC_PREPARER_LABEL,
        })
    return `
      <div>
        ${bodyHtml}
        ${renderReceiptAttachmentPagesHtml(getExpenseReceiptUrls(expense))}
      </div>
    `
  }

  // HTML Invoice Template (Modern Dual-Tone Kop)
  const getInvoiceHtml = (expense: any, invRecord?: any, kopType: KopSuratOption = 'maleo') => {
    const tgl = invRecord?.tanggal || expense.date || expense.createdAt
    return `
      <div>
        ${renderModernInvoiceHtml({
          kopSurat: kopType,
          noInvoice: invRecord?.noInvoice || '-',
          tanggal: tgl,
          ditagihkanKepada: 'Yayasan Maleo Talenta Cendekia',
          rabCode: expense.rabItem?.code || undefined,
          showRabCode: Boolean(expense.rabItem?.code),
          items: [
            {
              uraian: `${expense.rabItem?.name ? `${expense.rabItem.name} — ` : ''}${expense.description}`,
              qty: 1,
              satuan: 'paket',
              hargaSatuan: Number(expense.amount) || 0,
              jumlah: Number(expense.amount) || 0,
            },
          ],
          ppnPct: 0,
        })}
        ${renderReceiptAttachmentPagesHtml(getExpenseReceiptUrls(expense))}
      </div>
    `
  }

  // Handle Print Action
  const handlePrintDokumen = async () => {
    if (!selectedExpense) return
    setIsGeneratingPdf(true)
    try {
      let htmlString = ''

      if (printInvoice) {
        const forceNewInv = isUnlockedInvoice
        const invRecord = await generateInvoiceExpense(
          selectedExpense.id, 
          isUnlockedInvoice ? inputInvoiceNoUrut : undefined, 
          isUnlockedInvoice ? inputInvoiceTanggal : undefined, 
          forceNewInv,
          resolveEntityCodeFromKop(selectedKop)
        )
        if (invRecord?.error) {
          alert('Gagal memproses invoice: ' + invRecord.error)
          setIsGeneratingPdf(false)
          return
        }
        htmlString += getInvoiceHtml(selectedExpense, invRecord, selectedKop)
      }

      if (printKwitansi) {
        const forceNewKw = isUnlockedKwitansi
        const record = await generateKwitansiExpense(
          selectedExpense.id, 
          isUnlockedKwitansi ? inputNoUrut : undefined, 
          isUnlockedKwitansi ? inputTanggal : undefined, 
          forceNewKw,
          resolveEntityCodeFromKop(selectedKop)
        )
        if (record?.error) {
          alert('Gagal membuat nomor kwitansi: ' + record.error)
          setIsGeneratingPdf(false)
          return
        }
        if (htmlString) {
          htmlString += '<div style="page-break-before: always;"></div>'
        }
        htmlString += getKwitansiHtml(selectedExpense, record)
      }

      if (!htmlString) {
        alert('Pilih minimal satu dokumen untuk dicetak.')
        setIsGeneratingPdf(false)
        return
      }

      const win = window.open('', '_blank')
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <title>Dokumen Pengeluaran - ${selectedExpense.rabItem?.name || selectedExpense.description}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            ${htmlString}
          </body>
          </html>
        `)
        win.document.close()
        setTimeout(() => {
          win.print()
        }, 1000)
      }

      setShowPrintModal(false)
      router.refresh()
    } catch (err: any) {
      console.error('Print Error:', err)
      alert('Terjadi kesalahan saat memproses dokumen: ' + (err.message || err))
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/70 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Daftar Transaksi Pengeluaran Lapangan
                </CardTitle>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
                  {expenses.length} Total
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Kelola riwayat pengeluaran, cetak invoice atau kwitansi resmi yang terhubung ke Google Sheets, dan edit/hapus data transaksi.
              </CardDescription>
            </div>

            {/* Quick summary stats */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total Ditampilkan ({filteredExpenses.length})</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(totalFilteredAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 mr-1">Jenis Realisasi:</span>
              {(['ALL', 'REAL', 'PELAPORAN'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterRealizationType(t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    filterRealizationType === t
                      ? t === 'REAL'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : t === 'PELAPORAN'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'ALL'
                    ? `Semua (${expenses.length})`
                    : t === 'REAL'
                      ? `Real / Kas (${expenses.filter((e: any) => e.realizationType !== 'PELAPORAN').length})`
                      : `Pelaporan Template (${expenses.filter((e: any) => e.realizationType === 'PELAPORAN').length})`}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari deskripsi, item, kwitansi..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Filter Kategori RAB */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Kategori RAB</option>
                  {categoryOptions.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filter Penerima / Fasilitator */}
              <div>
                <select
                  value={filterFasilitator}
                  onChange={(e) => setFilterFasilitator(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Penerima / Pemohon</option>
                  <option value="NON_FASIL">Bukan Fasilitator (Staf/Lainnya)</option>
                  {fasilitators.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.namaLengkap} {f.lokasiSNT ? `(${f.lokasiSNT.split(' - ')[0]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Filter Status Kwitansi */}
              <div className="flex gap-2">
                <select
                  value={filterKwitansi}
                  onChange={(e) => setFilterKwitansi(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Status Kwitansi</option>
                  <option value="HAS_KWITANSI">Sudah Ada Kwitansi</option>
                  <option value="NO_KWITANSI">Belum Buat Kwitansi</option>
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
                    title="Reset Filter"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active filter pills / notification */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between text-xs text-slate-600 bg-blue-50/70 border border-blue-100 rounded-md px-3 py-1.5">
                <span className="flex items-center gap-1.5 font-medium text-blue-900">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  Menampilkan <strong>{filteredExpenses.length}</strong> dari {expenses.length} data pengeluaran
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-blue-700 hover:text-blue-900 underline text-xs font-semibold cursor-pointer"
                >
                  Hapus Semua Filter
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3 whitespace-nowrap w-28">Tanggal</th>
                  <th className="py-3 px-3 min-w-[200px]">Item & Kategori RAB</th>
                  <th className="py-3 px-3 min-w-[220px]">Deskripsi / Keperluan</th>
                  <th className="py-3 px-3 min-w-[180px]">Penerima / Pemohon</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap min-w-[120px]">Nominal</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-24">Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-24">Bukti Nota</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap min-w-[140px]">Status Kwitansi</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                        <p className="font-medium text-slate-600">Tidak ada pengeluaran yang cocok dengan kriteria pencarian.</p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="text-xs text-blue-600 hover:underline mt-1 cursor-pointer"
                          >
                            Reset filter pencarian
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((expense: any, idx: number) => {
                    const receipts = getExpenseReceiptUrls(expense)
                    const kw = getKwitansi(expense)
                    const inv = getInvoice(expense)
                    const hasValidKwitansi = Boolean(kw && kw.noKwitansi && !kw.noKwitansi.includes('TEMP'))

                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. No (Paginated index) */}
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {startIndex + idx + 1}
                        </td>

                        {/* 2. Tanggal */}
                        <td className="py-3 px-3 whitespace-nowrap align-top">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(expense.date || expense.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>

                        {/* 3. Item & Kategori RAB */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {expense.rabItem?.name || '-'}
                          </div>
                          {expense.rabItem?.category?.name && (
                            <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                              {expense.rabItem.category.name}
                            </span>
                          )}
                        </td>

                        {/* 4. Deskripsi */}
                        <td className="py-3 px-3 align-top text-slate-600">
                          <span
                            className={`inline-block mb-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              expense.realizationType === 'PELAPORAN'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {expense.realizationType === 'PELAPORAN' ? 'PELAPORAN' : 'REAL'}
                          </span>
                          <p className="line-clamp-2" title={expense.description}>
                            {expense.description}
                          </p>
                        </td>

                        {/* 5. Penerima / Pemohon */}
                        <td className="py-3 px-3 align-top">
                          {expense.fasilitator ? (
                            <div>
                              <span className="font-semibold text-slate-800 block">
                                {expense.fasilitator.namaLengkap}
                              </span>
                              {expense.fasilitator.lokasiSNT && (
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  {expense.fasilitator.lokasiSNT}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-700 font-medium block">
                                {expense.createdBy?.name || 'Staf Lapangan'}
                              </span>
                              <span className="text-[10px] text-slate-400 block italic">
                                Non-Fasilitator
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 6. Nominal */}
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {formatCurrency(expense.amount)}
                          </span>
                        </td>

                        {/* 7. Status Approval */}
                        <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                          <Badge 
                            variant={
                              expense.status === 'APPROVED' ? 'default' : 
                              expense.status === 'REJECTED' ? 'destructive' : 'secondary'
                            }
                            className={`text-[10px] uppercase font-bold tracking-wider ${
                              expense.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : ''
                            }`}
                          >
                            {expense.status}
                          </Badge>
                        </td>

                        {/* 8. Bukti Nota */}
                        <td className="py-3 px-3 align-top text-center">
                          {receipts.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {receipts.map((url, rIdx) => (
                                <a
                                  key={`${url}-${rIdx}`}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  data-preview-title={`Bukti Nota ${receipts.length > 1 ? `#${rIdx + 1} ` : ''}- ${expense.rabItem?.name || expense.description}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors cursor-pointer"
                                  title="Klik untuk membuka popup bukti nota"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span>{receipts.length === 1 ? 'Lihat Nota' : `Nota ${rIdx + 1}`}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Tanpa Bukti</span>
                          )}
                        </td>

                        {/* 9. Status Kwitansi (Status Murni: Tidak menduplikasi tombol aksi) */}
                        <td className="py-3 px-3 align-top text-center">
                          {hasValidKwitansi ? (
                            <div className="flex flex-col items-center gap-1">
                              <span 
                                onClick={() => openPrintModal(expense)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-100 transition-colors"
                                title="Klik untuk cetak ulang kwitansi resmi"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[130px]">{kw.noKwitansi}</span>
                              </span>
                              {inv?.noInvoice && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Inv: {inv.noInvoice}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              Belum Dibuat
                            </span>
                          )}
                        </td>

                        {/* 10. Aksi (Menu Vertikal Terpusat) */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="flex flex-col gap-1 w-28 mx-auto">
                            {/* Tombol Buat / Cetak Kwitansi */}
                            <button
                              type="button"
                              onClick={() => openPrintModal(expense)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                              title={hasValidKwitansi ? "Cetak dokumen kwitansi/invoice" : "Buat nomor kwitansi ke Google Sheets & cetak"}
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>{hasValidKwitansi ? 'Cetak Kwitansi' : 'Buat Kwitansi'}</span>
                            </button>

                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
                              title="Edit Pengeluaran"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              disabled={deletingId === expense.id}
                              onClick={() => handleDelete(expense.id, expense.description)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              {deletingId === expense.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>Hapus</span>
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

          {/* PAGINATION CONTROLS (5 Transaksi Per Halaman) */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/70">
              {/* Info text & page size selector */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>
                  Menampilkan <strong className="font-semibold text-slate-900">{startIndex + 1}</strong> - <strong className="font-semibold text-slate-900">{endIndex}</strong> dari <strong className="font-semibold text-slate-900">{totalItems}</strong> transaksi
                </span>
                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-300">
                  <span className="text-slate-500">Baris:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="bg-white border border-slate-300 text-xs rounded px-2 py-1 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={5}>5 per hal</option>
                    <option value={10}>10 per hal</option>
                    <option value={20}>20 per hal</option>
                    <option value={50}>50 per hal</option>
                  </select>
                </div>
              </div>

              {/* Page navigation controls */}
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage <= 1}
                  className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage <= 1}
                  className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return (
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - validCurrentPage) <= 1
                      )
                    })
                    .reduce((acc: (number | string)[], page, index, arr) => {
                      if (index > 0 && page - (arr[index - 1] as number) > 1) {
                        acc.push('...')
                      }
                      acc.push(page)
                      return acc
                    }, [])
                    .map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span key={`dots-${idx}`} className="px-1.5 py-0.5 text-xs text-slate-400">
                            ...
                          </span>
                        )
                      }
                      const pageNum = item as number
                      const isActive = pageNum === validCurrentPage
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[26px] h-6 px-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                            isActive 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL CETAK KWITANSI / DOKUMEN PENGELUARAN */}
      {showPrintModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cetak Dokumen Pengeluaran</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terhubung langsung dengan penomoran Google Sheets Kwitansi Maleo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Ringkas Pengeluaran */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Item RAB:</span>
                <span className="font-semibold text-slate-900">{selectedExpense.rabItem?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan:</span>
                <span className="font-medium text-slate-800 text-right max-w-[280px]">{selectedExpense.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penerima:</span>
                <span className="font-medium text-slate-800">
                  {selectedExpense.fasilitator?.namaLengkap || selectedExpense.createdBy?.name || 'Staf Lapangan'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">Nominal:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(selectedExpense.amount)}
                </span>
              </div>
            </div>

            {/* Rincian Ringkas Pengeluaran */}
            {(() => {
              const existingKw = selectedExpense ? getKwitansi(selectedExpense) : null
              const hasExistingKw = Boolean(existingKw && existingKw.noKwitansi && !existingKw.noKwitansi.includes('TEMP'))
              const existingInv = selectedExpense ? getInvoice(selectedExpense) : null
              const hasExistingInv = Boolean(existingInv && existingInv.noInvoice && !existingInv.noInvoice.includes('TEMP'))
              const isAllLocked = 
                (!printKwitansi || (hasExistingKw && !isUnlockedKwitansi)) &&
                (!printInvoice || (hasExistingInv && !isUnlockedInvoice))

              return (
                <>

                  {/* Pilihan Dokumen */}
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2.5">
                      <label className="text-xs font-bold text-blue-900 block">Pilih Dokumen yang Ingin Dicetak:</label>
                      <label className="flex items-center space-x-2 text-xs text-slate-800 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printKwitansi}
                          onChange={(e) => setPrintKwitansi(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Kwitansi Resmi (Terhubung ke Sheet Kwitansi)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-slate-800 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printInvoice}
                          onChange={(e) => setPrintInvoice(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Invoice Pengeluaran Lapangan</span>
                      </label>
                      <div className="pt-2 border-t border-blue-200/80">
                        <label className="block text-xs font-bold text-blue-900 mb-1">Pilihan Kop Surat:</label>
                        <select
                          value={selectedKop}
                          onChange={(e) => setSelectedKop(e.target.value as KopSuratOption)}
                          className="w-full h-8 px-2.5 rounded-md border border-blue-200 bg-white text-xs font-semibold text-slate-800"
                        >
                          <option value="maleo">Yayasan Maleo Talenta Cendekia</option>
                          <option value="lpd">LPD Jully Tjindrawan Robotik (Kop Baru)</option>
                          <option value="robotic">Robotic Explorer — PT JTR (Kop Baru)</option>
                        </select>
                      </div>
                    </div>

                    {/* Status / Form Input Kwitansi */}
                    {printKwitansi && (
                      hasExistingKw && !isUnlockedKwitansi ? (
                        <div className="p-3.5 border border-emerald-200 bg-emerald-50/60 rounded-lg space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Kwitansi Resmi (Nomor Ter-booking)</span>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                          </div>

                          <div className="bg-white p-2.5 rounded border border-emerald-200 text-xs space-y-1">
                            <div className="flex justify-between items-center font-mono">
                              <span className="text-slate-500 font-sans">No. Kwitansi:</span>
                              <span className="font-bold text-emerald-800 text-sm">{existingKw.noKwitansi}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">Tanggal Terdaftar:</span>
                              <span className="text-slate-800 font-medium">
                                {new Date(existingKw.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                            Nomor kwitansi ini telah dibooking permanen. Cetak ulang akan menggunakan nomor ini tanpa menghubungi Google Sheets.
                          </p>

                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                                  setIsUnlockedKwitansi(true)
                                }
                              }}
                              className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                            >
                              Buka Kunci / Generate Nomor Baru
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 border rounded-lg bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <FileCheck2 className="w-4 h-4 text-emerald-600" />
                              <span>Konfigurasi Kwitansi {isUnlockedKwitansi && <span className="text-amber-600">(Mode Generate Baru)</span>}</span>
                            </div>
                            {isUnlockedKwitansi && (
                              <button
                                type="button"
                                onClick={() => setIsUnlockedKwitansi(false)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                              >
                                Batalkan & Kunci Kembali
                              </button>
                            )}
                          </div>

                          {isUnlockedKwitansi && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                              ⚠️ Anda sedang membuka kunci nomor kwitansi. Saat dicetak, sistem akan memanggil Google Sheets untuk mengambil nomor seri baru.
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Nomor Urut Kwitansi <span className="text-slate-400 font-normal">(Kosongkan untuk penomoran otomatis Sheets)</span>
                            </label>
                            <input
                              type="text"
                              value={inputNoUrut}
                              onChange={(e) => setInputNoUrut(e.target.value)}
                              placeholder="Contoh: 001, 042 (atau biarkan kosong)"
                              className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Tanggal Kwitansi <span className="text-red-500">*</span>
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
                      )
                    )}

                    {/* Status / Form Input Invoice */}
                    {printInvoice && (
                      hasExistingInv && !isUnlockedInvoice ? (
                        <div className="p-3.5 border border-blue-200 bg-blue-50/60 rounded-lg space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>Invoice Pengeluaran (Nomor Ter-booking)</span>
                            </div>
                            <Badge className="bg-blue-600 text-white text-[10px] font-semibold">Terkunci</Badge>
                          </div>

                          <div className="bg-white p-2.5 rounded border border-blue-200 text-xs space-y-1">
                            <div className="flex justify-between items-center font-mono">
                              <span className="text-slate-500 font-sans">No. Invoice:</span>
                              <span className="font-bold text-blue-800 text-sm">{existingInv.noInvoice}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">Tanggal Terdaftar:</span>
                              <span className="text-slate-800 font-medium">
                                {new Date(existingInv.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-blue-800/80 leading-relaxed">
                            Nomor invoice ini telah dibooking permanen. Cetak ulang akan menggunakan nomor ini.
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kop Surat:</span>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name="kopType"
                                    checked={selectedKop === 'maleo'}
                                    onChange={() => setSelectedKop('maleo')}
                                  />
                                  <span>Yayasan Maleo</span>
                                </label>
                                <label className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name="kopType"
                                    checked={selectedKop === 'robotic'}
                                    onChange={() => setSelectedKop('robotic')}
                                  />
                                  <span>Robotic</span>
                                </label>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Peringatan: Membuat nomor baru akan menghubungi webhook Google Sheets dan menambah baris baru di sheet. Apakah Anda yakin ingin membuka kunci?")) {
                                  setIsUnlockedInvoice(true)
                                }
                              }}
                              className="text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                            >
                              Buka Kunci / Generate Baru
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 border rounded-lg bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>Konfigurasi Invoice {isUnlockedInvoice && <span className="text-amber-600">(Mode Generate Baru)</span>}</span>
                            </div>
                            {isUnlockedInvoice && (
                              <button
                                type="button"
                                onClick={() => setIsUnlockedInvoice(false)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                              >
                                Batalkan & Kunci Kembali
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Nomor Urut Invoice <span className="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={inputInvoiceNoUrut}
                              onChange={(e) => setInputInvoiceNoUrut(e.target.value)}
                              placeholder="Contoh: 001, 002..."
                              className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Tanggal Invoice
                            </label>
                            <input
                              type="date"
                              value={inputInvoiceTanggal}
                              onChange={(e) => setInputInvoiceTanggal(e.target.value)}
                              className="w-full border rounded-md px-3 py-1.5 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Pilih Kop Surat:
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  name="kopType"
                                  checked={selectedKop === 'maleo'}
                                  onChange={() => setSelectedKop('maleo')}
                                />
                                <span>Yayasan Maleo</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  name="kopType"
                                  checked={selectedKop === 'robotic'}
                                  onChange={() => setSelectedKop('robotic')}
                                />
                                <span>Robotic Explorer</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowPrintModal(false)}
                      className="px-4 py-2 border rounded-md text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      disabled={isGeneratingPdf}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintDokumen}
                      disabled={isGeneratingPdf || (!printKwitansi && !printInvoice)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
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
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* MODAL EDIT PENGELUARAN */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Pengeluaran Lapangan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Perubahan akan langsung mengupdate data realisasi dan sisa anggaran RAB.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pengeluaran <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={editData.date}
                  onChange={e => setEditData({ ...editData, date: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Anggaran RAB <span className="text-red-500">*</span>
                </label>
                <select 
                  value={editData.rabItemId}
                  onChange={e => setEditData({ ...editData, rabItemId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Pilih Item RAB --</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.categoryName ? `[${item.categoryName}] ` : ''}{item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fasilitator / Penerima (Opsional)
                </label>
                <select 
                  value={editData.fasilitatorId}
                  onChange={e => setEditData({ ...editData, fasilitatorId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Bukan Fasilitator (Lainnya)</option>
                  {fasilitators.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.namaLengkap} {f.lokasiSNT ? `(${f.lokasiSNT})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Realisasi <span className="text-red-500">*</span>
                </label>
                <select
                  value={editData.realizationType || 'REAL'}
                  onChange={e => setEditData({ ...editData, realizationType: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="REAL">Realisasi Real (Kas Aktual)</option>
                  <option value="PELAPORAN">Realisasi Pelaporan (Template SNT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan <span className="text-red-500">*</span>
                </label>
                <textarea 
                  rows={3}
                  value={editData.description}
                  onChange={e => setEditData({ ...editData, description: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  placeholder="Contoh: Pembelian spidol & modul pembelajaran"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={editData.amount}
                  onChange={e => setEditData({ ...editData, amount: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bukti Nota (Bisa Lebih dari 1 File)
                </label>
                {Array.isArray(editData.keptUrls) && editData.keptUrls.length > 0 && (
                  <div className="mb-2 space-y-1 rounded-md border border-blue-100 bg-blue-50/50 p-2">
                    <div className="text-[11px] font-medium text-slate-600">
                      File nota tersimpan ({editData.keptUrls.length}):
                    </div>
                    {editData.keptUrls.map((url: string, uIdx: number) => (
                      <div key={`${url}-${uIdx}`} className="flex items-center justify-between gap-2 text-xs">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          data-preview-title={`Bukti Nota #${uIdx + 1}`}
                          className="text-blue-600 underline font-medium truncate"
                        >
                          Lihat Nota #{uIdx + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setEditData({
                              ...editData,
                              keptUrls: editData.keptUrls.filter((_: string, i: number) => i !== uIdx),
                            })
                          }
                          className="shrink-0 text-[11px] text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  multiple
                  onChange={e => {
                    handleAddNewFiles(e.target.files)
                    e.target.value = ''
                  }}
                  className="w-full text-xs border rounded-md p-1.5 bg-slate-50"
                />
                {newFiles.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
                    {newFiles.map((item, idx) => (
                      <li
                        key={`${item.name}-${item.size}-${item.lastModified}`}
                        className="flex items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <span className="truncate">
                          + {item.name}{' '}
                          <span className="text-slate-400">
                            ({(item.size / 1024).toFixed(0)} KB)
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="shrink-0 text-[11px] text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  File baru akan ditambahkan ke daftar nota yang masih dipertahankan.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
