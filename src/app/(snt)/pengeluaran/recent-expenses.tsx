'use client'

import React, { useState, useMemo } from 'react'
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
  FileCheck2
} from 'lucide-react'
import { uploadFileClient } from '@/lib/upload-client'

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

  // Edit Expense State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Print Kwitansi / Invoice Modal State
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [printInvoice, setPrintInvoice] = useState(false)
  const [printKwitansi, setPrintKwitansi] = useState(true)
  const [selectedKop, setSelectedKop] = useState<'maleo' | 'robotic'>('maleo')
  const [inputNoUrut, setInputNoUrut] = useState('')
  const [inputTanggal, setInputTanggal] = useState('')
  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState('')
  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

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
  }, [expenses, filterCategory, filterFasilitator, filterKwitansi, filterStatus, searchQuery])

  // Summary statistics
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
  }, [filteredExpenses])

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    filterCategory !== 'ALL' || 
    filterFasilitator !== 'ALL' || 
    filterKwitansi !== 'ALL' || 
    filterStatus !== 'ALL'

  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterCategory('ALL')
    setFilterFasilitator('ALL')
    setFilterKwitansi('ALL')
    setFilterStatus('ALL')
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
      currentReceiptUrl: expense.receiptUrl || expense.paymentReceiptUrl || ''
    })
    setNewFile(null)
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
      let receiptUrl = editData.currentReceiptUrl

      if (newFile) {
        receiptUrl = await uploadFileClient(newFile, 'receipts')
      }

      const res = await updateExpense(editData.id, {
        date: new Date(editData.date),
        description: editData.description,
        amount: Number(editData.amount),
        rabItemId: editData.rabItemId,
        fasilitatorId: editData.fasilitatorId || undefined,
        receiptUrl: receiptUrl || undefined
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

  // HTML Kwitansi Template
  const getKwitansiHtml = (expense: any, record: any) => {
    const tanggalStr = record.tanggal 
      ? new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    return `
      <div style="font-family: Arial, sans-serif; padding: 32px; border: 2px solid #000; max-width: 800px; margin: 0 auto; box-sizing: border-box; background: #fff;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <img src="/kop-maleo.png" style="height: 60px;" alt="Yayasan Maleo Talenta Cendekia" onerror="this.style.display='none'" />
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 1px;">KWITANSI</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-family: monospace; color: #333;">No: ${record.noKwitansi || '-'}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tr>
            <td style="width: 170px; padding: 7px 0; color: #333;">Sudah Terima Dari</td>
            <td style="width: 15px; padding: 7px 0;">:</td>
            <td style="padding: 7px 0; font-weight: bold;">${record.owner || 'Yayasan Maleo Talenta Cendekia'}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #333;">Banyaknya Uang</td>
            <td style="padding: 7px 0;">:</td>
            <td style="padding: 7px 10px; font-style: italic; background-color: #f3f4f6; font-weight: 500; border-radius: 4px;">
              ${terbilangRupiah(expense.amount)}
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; vertical-align: top; color: #333;">Untuk Pembayaran</td>
            <td style="padding: 7px 0; vertical-align: top;">:</td>
            <td style="padding: 7px 0; line-height: 1.5;">${record.perihal || `${expense.description} - ${expense.rabItem?.name || ''}`}</td>
          </tr>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 10px;">
          <div style="border: 2px solid #000; padding: 10px 24px; font-size: 19px; font-weight: bold; background-color: #f9fafb; border-radius: 4px; font-family: monospace;">
            ${formatCurrency(expense.amount)}
          </div>
          <div style="text-align: center; width: 240px;">
            <p style="margin: 0 0 60px 0; font-size: 13px; color: #333;">Jakarta, ${tanggalStr}</p>
            <p style="margin: 0; font-weight: bold; text-decoration: underline; font-size: 14px;">
              ${expense.fasilitator ? expense.fasilitator.namaLengkap : (record.owner || 'Yayasan Maleo')}
            </p>
            <span style="font-size: 11px; color: #666;">Penerima / Pelaksana</span>
          </div>
        </div>
      </div>
    `
  }

  // HTML Invoice Template
  const getInvoiceHtml = (expense: any, invRecord?: any, kopType: string = 'maleo') => {
    const tanggalStr = invRecord?.tanggal 
      ? new Date(invRecord.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : (expense.date 
          ? new Date(expense.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date(expense.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))

    const kopImage = kopType === 'robotic' ? '/kop-robotic.png' : '/kop-maleo.png'
    const isRobotic = kopType === 'robotic'

    return `
      <div>
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; box-sizing: border-box; border: 1px solid #ccc; background: #fff; min-height: 900px; position: relative;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px;">
            <img src="${kopImage}" style="height: 70px; margin-bottom: 10px;" alt="Logo" onerror="this.style.display='none'" />
            <h2 style="margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">
              ${isRobotic ? 'INVOICE PENGELUARAN PROGRAM' : 'INVOICE PENGELUARAN LAPANGAN'}
            </h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">
              ${isRobotic ? 'Program Koding & Kecerdasan Artifisial (KKA) 2026' : 'KKA Sekolah Nasional Terintegrasi Tahun 2026'}
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr>
              <td style="width: 140px; padding: 4px 0;">Nomor Invoice</td>
              <td style="width: 10px;">:</td>
              <td style="padding: 4px 0; font-weight: bold;">${invRecord?.noInvoice || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Tanggal</td>
              <td>:</td>
              <td style="padding: 4px 0;">${tanggalStr}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Penerima / Pemohon</td>
              <td>:</td>
              <td style="padding: 4px 0;">${expense.fasilitator ? expense.fasilitator.namaLengkap : (expense.createdBy?.name || 'Staf Lapangan')}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Pos Anggaran (RAB)</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Keterangan / Deskripsi</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 160px;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 10px;">${expense.rabItem?.name || '-'}</td>
                <td style="border: 1px solid #000; padding: 10px;">${expense.description}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(expense.amount)}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">TOTAL:</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(expense.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-bottom: 40px; font-size: 14px; font-style: italic;">
            Terbilang: <strong>${terbilangRupiah(expense.amount)}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; text-align: center; font-size: 14px; margin-top: 50px;">
            <p>
              Menyetujui,<br/>
              <strong>${isRobotic ? 'Robotic Explorer' : 'Yayasan Maleo'}</strong>
              <br/><br/><br/><br/>
              (_____________________)
            </p>
            <p>
              Penerima / Pelaksana,
              <br/><br/><br/><br/>
              (${expense.fasilitator ? expense.fasilitator.namaLengkap : '_____________________'})
            </p>
          </div>
        </div>

        ${(expense.receiptUrl || expense.paymentReceiptUrl) ? `
        <div style="page-break-before: always; padding: 40px; font-family: sans-serif; box-sizing: border-box; width: 100%; text-align: center;">
          <h3 style="margin-bottom: 20px;">Lampiran Bukti Pengeluaran</h3>
          ${(expense.receiptUrl || expense.paymentReceiptUrl).toLowerCase().endsWith('.pdf') 
            ? `<div style="padding: 20px; border: 1px solid #ccc; background-color: #f9f9f9;">
                 <p>Lampiran ini berformat PDF.</p>
                 <a href="${expense.receiptUrl || expense.paymentReceiptUrl}" target="_blank" style="color: blue; text-decoration: underline;">Klik di sini untuk melihat PDF Bukti</a>
               </div>`
            : `<img src="${expense.receiptUrl || expense.paymentReceiptUrl}" style="max-width: 100%; max-height: 900px; object-fit: contain; border: 1px solid #ccc; padding: 10px;" alt="Bukti Nota" />`
          }
        </div>
        ` : ''}
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
        const invRecord = await generateInvoiceExpense(selectedExpense.id, inputInvoiceNoUrut, inputInvoiceTanggal)
        if (invRecord?.error) {
          alert('Gagal membuat invoice: ' + invRecord.error)
          setIsGeneratingPdf(false)
          return
        }
        htmlString += getInvoiceHtml(selectedExpense, invRecord, selectedKop)
      }

      if (printKwitansi) {
        const record = await generateKwitansiExpense(selectedExpense.id, inputNoUrut, inputTanggal)
        if (record?.error) {
          alert('Gagal mengambil nomor kwitansi dari Google Sheets: ' + record.error)
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
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3 whitespace-nowrap w-28">Tanggal</th>
                  <th className="py-3 px-3 min-w-[200px]">Item & Kategori RAB</th>
                  <th className="py-3 px-3 min-w-[220px]">Deskripsi / Keperluan</th>
                  <th className="py-3 px-3 min-w-[180px]">Penerima / Pemohon</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap min-w-[120px]">Nominal</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-24">Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-24">Bukti Nota</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap min-w-[140px]">Kwitansi</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.length === 0 ? (
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
                  filteredExpenses.map((expense: any, idx: number) => {
                    const receipt = expense.receiptUrl || expense.paymentReceiptUrl
                    const kw = getKwitansi(expense)
                    const inv = getInvoice(expense)
                    const hasValidKwitansi = Boolean(kw && kw.noKwitansi && !kw.noKwitansi.includes('TEMP'))

                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. No */}
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {idx + 1}
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
                          {receipt ? (
                            <a 
                              href={receipt} 
                              target="_blank" 
                              rel="noreferrer" 
                              data-preview-title={`Bukti Nota - ${expense.rabItem?.name || expense.description}`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors cursor-pointer"
                              title="Klik untuk membuka popup bukti nota"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>Lihat Nota</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Tanpa Bukti</span>
                          )}
                        </td>

                        {/* 9. Status Kwitansi */}
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
                            <button
                              type="button"
                              onClick={() => openPrintModal(expense)}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                              title="Buat nomor kwitansi ke Google Sheets"
                            >
                              <span>+ Buat Kwitansi</span>
                            </button>
                          )}
                        </td>

                        {/* 10. Aksi (Menu Vertikal) */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="flex flex-col gap-1 w-28 mx-auto">
                            {/* Tombol Cetak Dokumen / Kwitansi */}
                            <button
                              type="button"
                              onClick={() => openPrintModal(expense)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                              title="Buat kwitansi resmi & cetak invoice/kwitansi"
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

            {/* Pilihan Dokumen */}
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
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
              </div>

              {/* Form Input Kwitansi */}
              {printKwitansi && (
                <div className="p-3.5 border rounded-lg bg-white space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Konfigurasi Kwitansi</span>
                  </div>

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
              )}

              {/* Form Input Invoice */}
              {printInvoice && (
                <div className="p-3.5 border rounded-lg bg-white space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Konfigurasi Invoice</span>
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
                    <span>Cetak Dokumen Sekarang</span>
                  </>
                )}
              </button>
            </div>
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
                  Ganti / Upload Bukti Nota (Opsional)
                </label>
                {editData.currentReceiptUrl && (
                  <div className="mb-2 text-xs text-blue-600 flex items-center gap-1">
                    <span>Bukti saat ini:</span>
                    <a 
                      href={editData.currentReceiptUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      data-preview-title="Bukti Nota Saat Ini"
                      className="underline font-medium"
                    >
                      Lihat Nota Saat Ini
                    </a>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={e => setNewFile(e.target.files?.[0] || null)}
                  className="w-full text-xs border rounded-md p-1.5 bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format gambar atau PDF. Kosongkan jika tidak ingin mengubah bukti nota.
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
