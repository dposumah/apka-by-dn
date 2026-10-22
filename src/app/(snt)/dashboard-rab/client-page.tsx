'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { DeleteExpenseButton } from './DeleteExpenseButton'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { generateKwitansiExpense, generateInvoiceExpense } from '@/app/actions/rekap'
import { 
  updateExpense, 
  createRabItem, 
  updateRabItem, 
  deleteRabItem, 
  createRabCategory 
} from '@/app/actions/rab'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FolderPlus, 
  Loader2,
  FileText,
  FileCheck2,
  Printer,
  ExternalLink,
  X,
  Cpu,
  AlertTriangle
} from 'lucide-react'

export function RabDashboardClient({ data, expenses, pendingWeekly, pendingHonor }: any) {
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  
  const [printInvoice, setPrintInvoice] = useState(false)
  const [printKwitansi, setPrintKwitansi] = useState(false)
  const [selectedKop, setSelectedKop] = useState<'maleo' | 'robotic'>('maleo')
  
  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputInvoiceNoUrut, setInputInvoiceNoUrut] = useState("")
  const [inputInvoiceTanggal, setInputInvoiceTanggal] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")
  const [isUnlockedKwitansi, setIsUnlockedKwitansi] = useState(false)
  const [isUnlockedInvoice, setIsUnlockedInvoice] = useState(false)

  const getKwitansi = (expense: any) => {
    if (!expense?.kwitansiRecord) return null;
    if (Array.isArray(expense.kwitansiRecord)) {
      return expense.kwitansiRecord.find((k: any) => !k.noKwitansi?.includes('TEMP')) || expense.kwitansiRecord[0] || null;
    }
    return expense.kwitansiRecord;
  };

  const getInvoice = (expense: any) => {
    if (!expense?.invoiceRecord) return null;
    if (Array.isArray(expense.invoiceRecord)) {
      return expense.invoiceRecord.find((inv: any) => !inv.noInvoice?.includes('TEMP')) || expense.invoiceRecord[0] || null;
    }
    return expense.invoiceRecord;
  };

  // Edit Expense State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // RAB Item Management State
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit'>('create')
  const [itemFormData, setItemFormData] = useState({
    id: '',
    categoryId: '',
    code: '',
    name: '',
    volume: '',
    unitPrice: 0,
    totalBudget: 0
  })
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isSavingCat, setIsSavingCat] = useState(false)
  const [reportCategory, setReportCategory] = useState<any>(null)

  const openEditModal = (expense: any) => {
    setEditData({
      id: expense.id,
      date: expense.date ? new Date(expense.date).toISOString().substring(0,10) : new Date(expense.createdAt).toISOString().substring(0,10),
      description: expense.description,
      amount: expense.amount,
      rabItemId: expense.rabItemId
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      const res = await updateExpense(editData.id, {
        date: new Date(editData.date),
        description: editData.description,
        amount: parseFloat(editData.amount),
        rabItemId: editData.rabItemId
      });
      if (res?.error) throw new Error(res.error);
      setShowEditModal(false);
      window.location.reload();
    } catch (err: any) {
      alert("Gagal mengedit: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  }

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  const openCreateItemModal = (defaultCategoryId?: string) => {
    setItemModalMode('create')
    setItemFormData({
      id: '',
      categoryId: defaultCategoryId || (data?.categories?.[0]?.id || ''),
      code: '',
      name: '',
      volume: '',
      unitPrice: 0,
      totalBudget: 0
    })
    setShowItemModal(true)
  }

  const openEditItemModal = (item: any, categoryId: string) => {
    setItemModalMode('edit')
    setItemFormData({
      id: item.id,
      categoryId: item.categoryId || categoryId,
      code: item.code || '',
      name: item.name || '',
      volume: item.volume || '',
      unitPrice: item.unitPrice || 0,
      totalBudget: item.totalBudget || 0
    })
    setShowItemModal(true)
  }

  const handleSaveItem = async () => {
    if (!itemFormData.categoryId) {
      alert('Pilih Kategori RAB')
      return
    }
    if (!itemFormData.code.trim()) {
      alert('Isi kode item RAB (misal: 8a, C.2, dll)')
      return
    }
    if (!itemFormData.name.trim()) {
      alert('Isi nama/uraian item RAB')
      return
    }
    if (Number(itemFormData.totalBudget) < 0) {
      alert('Total anggaran tidak boleh negatif')
      return
    }

    setIsSavingItem(true)
    try {
      if (itemModalMode === 'create') {
        const res = await createRabItem({
          categoryId: itemFormData.categoryId,
          code: itemFormData.code.trim(),
          name: itemFormData.name.trim(),
          volume: itemFormData.volume.trim() || undefined,
          unitPrice: Number(itemFormData.unitPrice) || 0,
          totalBudget: Number(itemFormData.totalBudget) || 0
        })
        if (res?.error) throw new Error(res.error)
        alert('Item RAB berhasil ditambahkan!')
      } else {
        const res = await updateRabItem(itemFormData.id, {
          categoryId: itemFormData.categoryId,
          code: itemFormData.code.trim(),
          name: itemFormData.name.trim(),
          volume: itemFormData.volume.trim() || undefined,
          unitPrice: Number(itemFormData.unitPrice) || 0,
          totalBudget: Number(itemFormData.totalBudget) || 0
        })
        if (res?.error) throw new Error(res.error)
        alert('Item RAB berhasil diperbarui!')
      }
      setShowItemModal(false)
      window.location.reload()
    } catch (err: any) {
      alert('Gagal menyimpan item RAB: ' + (err.message || err))
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus item RAB "${item.name}"?`)) return
    setDeletingItemId(item.id)
    try {
      const res = await deleteRabItem(item.id)
      if (res?.error) throw new Error(res.error)
      alert('Item RAB berhasil dihapus!')
      window.location.reload()
    } catch (err: any) {
      alert('Gagal menghapus item RAB: ' + (err.message || err))
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      alert('Nama kategori tidak boleh kosong')
      return
    }
    setIsSavingCat(true)
    try {
      const res = await createRabCategory(newCatName.trim())
      if (res?.error) throw new Error(res.error)
      alert('Kategori RAB berhasil dibuat!')
      setShowCatModal(false)
      setNewCatName('')
      window.location.reload()
    } catch (err: any) {
      alert('Gagal membuat kategori: ' + (err.message || err))
    } finally {
      setIsSavingCat(false)
    }
  }

  const openPrintModal = (expense: any) => {
    setSelectedExpense(expense)
    setIsUnlockedKwitansi(false)
    setIsUnlockedInvoice(false)
    
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    
    const kw = getKwitansi(expense)
    const inv = getInvoice(expense)
    
    const hasKw = !!(kw?.noKwitansi && !kw.noKwitansi.includes('TEMP'))
    const hasInv = !!(inv?.noInvoice && !inv.noInvoice.includes('TEMP'))
    
    setPrintKwitansi(hasKw || (!hasKw && !hasInv))
    setPrintInvoice(hasInv || (!hasKw && !hasInv))

    setInputNoUrut("")
    if (kw?.tanggal) {
      setInputTanggal(new Date(kw.tanggal).toISOString().slice(0, 10))
    } else {
      setInputTanggal(localISOTime)
    }

    setInputInvoiceNoUrut("")
    if (inv?.tanggal) {
      setInputInvoiceTanggal(new Date(inv.tanggal).toISOString().slice(0, 10))
    } else {
      setInputInvoiceTanggal(localISOTime)
    }

    setSelectedKop('maleo')
    setShowPrintModal(true)
  }

  const getKwitansiHtml = (expense: any, record: any) => {
    const tanggalStr = record.tanggal 
      ? new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div style="font-family: Arial, sans-serif; padding: 30px; border: 2px solid #000; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <img src="/kop-maleo.png" style="height: 60px;" alt="Logo" onerror="this.style.display='none'" />
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">KWITANSI</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px;">No: ${record.noKwitansi || '-'}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr>
            <td style="width: 180px; padding: 6px 0;">Sudah Terima Dari</td>
            <td style="width: 10px;">:</td>
            <td style="padding: 6px 0; font-weight: bold;">${record.owner || 'Yayasan Maleo Talenta Cendekia'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Banyaknya Uang</td>
            <td>:</td>
            <td style="padding: 6px 0; font-style: italic; background-color: #f0f0f0; padding-left: 8px;">${terbilangRupiah(expense.amount)} Rupiah</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; vertical-align: top;">Untuk Pembayaran</td>
            <td style="vertical-align: top;">:</td>
            <td style="padding: 6px 0;">${record.perihal}</td>
          </tr>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
          <div style="border: 2px solid #000; padding: 10px 20px; font-size: 18px; font-weight: bold; background-color: #f9f9f9;">
            Rp ${formatCurrency(expense.amount)}
          </div>
          <div style="text-align: center; width: 220px;">
            <p style="margin: 0 0 50px 0; font-size: 14px;">Jakarta, ${tanggalStr}</p>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${expense.fasilitator ? expense.fasilitator.namaLengkap : (record.owner || 'Yayasan Maleo')}</p>
          </div>
        </div>
      </div>
    `;
  }

  const getInvoiceHtml = (expense: any, invRecord?: any, kopType: string = 'maleo') => {
    const tanggalStr = invRecord?.tanggal 
      ? new Date(invRecord.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : (expense.date 
          ? new Date(expense.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date(expense.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));

    const kopImage = kopType === 'robotic' ? '/kop-robotic.png' : '/kop-maleo.png';
    const isRobotic = kopType === 'robotic';

    return `
      <div>
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; box-sizing: border-box; border: 1px solid #ccc; min-height: 1000px; position: relative;">
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
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 150px;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 10px;">${expense.rabItem?.name || '-'}</td>
                <td style="border: 1px solid #000; padding: 10px;">${expense.description}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">Rp ${formatCurrency(expense.amount)}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">TOTAL:</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">Rp ${formatCurrency(expense.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-bottom: 40px; font-size: 14px; font-style: italic;">
            Terbilang: <strong>${terbilangRupiah(expense.amount)} Rupiah</strong>
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
                 <p>Lampiran ini berformat PDF dan tidak dapat dicetak secara langsung dalam halaman ini.</p>
                 <a href="${expense.receiptUrl || expense.paymentReceiptUrl}" target="_blank" style="color: blue; text-decoration: underline;">Klik di sini untuk mengunduh/melihat PDF</a>
               </div>`
            : `<img src="${expense.receiptUrl || expense.paymentReceiptUrl}" style="max-width: 100%; max-height: 900px; object-fit: contain; border: 1px solid #ccc; padding: 10px;" alt="Bukti Nota" />`
          }
        </div>
        ` : ''}
      </div>
    `;
  }

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintDokumen = async () => {
    if (!selectedExpense) return;
    setIsGeneratingPdf(true);
    try {
      let htmlString = "";
      if (printInvoice) {
        const forceNewInv = isUnlockedInvoice;
        const invRecord = await generateInvoiceExpense(
          selectedExpense.id,
          isUnlockedInvoice ? inputInvoiceNoUrut : undefined,
          isUnlockedInvoice ? inputInvoiceTanggal : undefined,
          forceNewInv
        );
        if (invRecord?.error) {
          alert('Gagal memproses invoice: ' + invRecord.error);
          setIsGeneratingPdf(false);
          return;
        }
        htmlString += getInvoiceHtml(selectedExpense, invRecord, selectedKop);
      }
      if (printKwitansi) {
        const forceNewKw = isUnlockedKwitansi;
        const record = await generateKwitansiExpense(
          selectedExpense.id,
          isUnlockedKwitansi ? inputNoUrut : undefined,
          isUnlockedKwitansi ? inputTanggal : undefined,
          forceNewKw
        );
        if (record?.error) {
          alert('Gagal generate kwitansi: ' + record.error);
          setIsGeneratingPdf(false);
          return;
        }
        if (htmlString) {
          htmlString += '<div style="page-break-before: always;"></div>';
        }
        htmlString += getKwitansiHtml(selectedExpense, record);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        setShowPrintModal(false);
        return;
      }
      
      const win = window.open('', '_blank');
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
        `);
        win.document.close();
        setTimeout(() => {
          win.print();
        }, 1000);
      }

      setShowPrintModal(false);
    } catch (err: any) {
      console.error('GENERATE PRINT ERROR', err);
      alert("Gagal print: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = handlePrintDokumen;


  const handlePrintCategoryReport = (cat: any) => {
    if (!cat) return;
    const items = cat.items || [];
    const allExpenses = items.flatMap((item: any) => 
      (item.expenses || []).map((exp: any) => ({ ...exp, rabItem: item }))
    ).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

    const totalBudget = cat.budget || items.reduce((s: number, i: any) => s + (i.totalBudget || 0), 0);
    const totalRealized = cat.realized || items.reduce((s: number, i: any) => s + (i.realized || 0), 0);
    const remaining = totalBudget - totalRealized;
    const persen = totalBudget > 0 ? ((totalRealized / totalBudget) * 100).toFixed(1) : '0';
    const tanggalStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Laporan Kategori - ${cat.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 25px; color: #1e293b; font-size: 13px; line-height: 1.4; }
          .kop { width: 100%; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; text-align: center; }
          .kop img { height: 75px; object-fit: contain; }
          .title-block { text-align: center; margin-bottom: 24px; }
          .title-block h1 { font-size: 17px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .title-block h2 { font-size: 14px; margin: 4px 0 0 0; color: #2563eb; font-weight: bold; }
          .title-block p { font-size: 12px; margin: 4px 0 0 0; color: #64748b; }
          
          .metrics-grid { display: flex; gap: 12px; margin-bottom: 24px; }
          .metric-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; }
          .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .metric-value { font-size: 15px; font-weight: bold; color: #0f172a; }
          .metric-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

          .section-title { font-size: 13px; font-weight: bold; margin: 18px 0 8px 0; color: #0f172a; text-transform: uppercase; border-left: 3px solid #2563eb; padding-left: 8px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 8px; font-weight: bold; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          tfoot td { font-weight: bold; background: #f8fafc; border-top: 2px solid #94a3b8; }

          .signature-block { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
          .signature-col { text-align: center; width: 220px; }
          .signature-space { height: 60px; }

          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          <img src="/kop-maleo.png" alt="Kop Maleo" onerror="this.style.display='none'" />
        </div>

        <div class="title-block">
          <h1>Laporan Realisasi Anggaran & Pengeluaran Kategori</h1>
          <h2>${cat.name}</h2>
          <p>Program KKA Sekolah Nasional Terintegrasi (SNT) Tahun 2026</p>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Pagu / Dana Masuk (Alokasi)</div>
            <div class="metric-value">${formatCurrency(totalBudget)}</div>
            <div class="metric-sub">Total Anggaran Kategori</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Pengeluaran (Realisasi)</div>
            <div class="metric-value" style="color: #dc2626;">${formatCurrency(totalRealized)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Sisa Saldo Anggaran</div>
            <div class="metric-value" style="color: #16a34a;">${formatCurrency(remaining)}</div>
            <div class="metric-sub">Tersedia untuk kegiatan</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Persentase Penyerapan</div>
            <div class="metric-value" style="color: #2563eb;">${persen}%</div>
            <div class="metric-sub">Dari Total Pagu</div>
          </div>
        </div>

        <div class="section-title">1. Rincian Pos Item Anggaran (RAB)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 70px;">Kode</th>
              <th>Uraian Item Anggaran</th>
              <th class="text-right" style="width: 120px;">Pagu (Rp)</th>
              <th class="text-right" style="width: 120px;">Realisasi (Rp)</th>
              <th class="text-center" style="width: 70px;">% Pakai</th>
              <th class="text-right" style="width: 120px;">Sisa Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it: any) => {
              const itBudget = it.totalBudget || 0;
              const itRealized = it.realized || 0;
              const itRem = itBudget - itRealized;
              const itP = itBudget > 0 ? ((itRealized / itBudget) * 100).toFixed(1) : '0';
              return `
                <tr>
                  <td style="font-family: monospace; font-weight: bold;">${it.code || '-'}</td>
                  <td><strong>${it.name}</strong>${it.volume ? `<br/><small style="color:#64748b;">Volume: ${it.volume}</small>` : ''}</td>
                  <td class="text-right">${formatCurrency(itBudget)}</td>
                  <td class="text-right" style="color: #dc2626;">${formatCurrency(itRealized)}</td>
                  <td class="text-center">${itP}%</td>
                  <td class="text-right" style="color: #16a34a; font-weight: bold;">${formatCurrency(itRem)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-right">TOTAL KATEGORI:</td>
              <td class="text-right">${formatCurrency(totalBudget)}</td>
              <td class="text-right" style="color: #dc2626;">${formatCurrency(totalRealized)}</td>
              <td class="text-center">${persen}%</td>
              <td class="text-right" style="color: #16a34a;">${formatCurrency(remaining)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title">2. Daftar Transaksi Realisasi Pengeluaran Lapangan</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;" class="text-center">No</th>
              <th style="width: 85px;">Tanggal</th>
              <th style="width: 160px;">Item RAB</th>
              <th>Uraian / Keterangan Transaksi</th>
              <th class="text-right" style="width: 120px;">Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${allExpenses.length === 0 ? `
              <tr>
                <td colspan="5" class="text-center" style="padding: 16px; color: #64748b;">
                  Belum ada transaksi realisasi pengeluaran untuk kategori ini.
                </td>
              </tr>
            ` : allExpenses.map((exp: any, idx: number) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td style="white-space: nowrap;">${new Date(exp.date || exp.createdAt).toLocaleDateString('id-ID')}</td>
                <td>${exp.rabItem?.name || '-'}</td>
                <td>${exp.description || '-'}</td>
                <td class="text-right" style="font-weight: bold;">${formatCurrency(exp.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">TOTAL PENGELUARAN TEREALISASI:</td>
              <td class="text-right" style="color: #dc2626; font-size: 13px;">${formatCurrency(totalRealized)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="signature-block">
          <div class="signature-col">
            <p style="margin: 0;">Mengetahui / Menyetujui,</p>
            <p style="margin: 2px 0 0 0; font-weight: bold;">Yayasan Maleo Talenta Cendekia</p>
            <div class="signature-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">( __________________________ )</p>
          </div>
          <div class="signature-col">
            <p style="margin: 0;">Jakarta, ${tanggalStr}</p>
            <p style="margin: 2px 0 0 0; font-weight: bold;">Penanggung Jawab Program</p>
            <div class="signature-space"></div>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">( __________________________ )</p>
          </div>
        </div>

        <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 11px; color: #64748b; text-align: right; font-style: italic;">
          Dicetak pada: ${tanggalStr}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 800);
    }
  };

  if (!data) return <div className="p-8">No RAB data found. Please seed the database.</div>

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Monitoring RAB</h1>
          <p className="text-sm text-slate-500 mt-1">
            Proyek: <span className="font-semibold text-slate-700">{data.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Kategori RAB</span>
          </button>
          <button
            onClick={() => openCreateItemModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Item RAB</span>
          </button>
        </div>
      </div>
      
      {/* Pending Notification Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/fasilitator/laporan" className="block">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between hover:bg-amber-100 transition">
            <div>
              <h3 className="font-bold text-amber-900">Tagihan Transport Pending</h3>
              <p className="text-amber-700 text-sm">Menunggu verifikasi dan transfer</p>
            </div>
            <div className="text-2xl font-black text-amber-700 bg-amber-200 w-12 h-12 flex items-center justify-center rounded-full">
              {pendingWeekly}
            </div>
          </div>
        </Link>
        <Link href="/fasilitator/rekap-honor" className="block">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between hover:bg-blue-100 transition">
            <div>
              <h3 className="font-bold text-blue-900">Rekap Honorarium Pending</h3>
              <p className="text-blue-700 text-sm">Menunggu verifikasi dan pembuatan Invoice</p>
            </div>
            <div className="text-2xl font-black text-blue-700 bg-blue-200 w-12 h-12 flex items-center justify-center rounded-full">
              {pendingHonor}
            </div>
          </div>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Total Anggaran RAB</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalBudget)}</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Total Realisasi Pengeluaran</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalRealized)}</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Sisa Anggaran Tersedia</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRemaining)}</p>
            <p className="text-xs text-slate-500 mt-1">Terserap: {data.percentage.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Item Management */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Rincian Anggaran Per Kategori & Item</h2>
          <span className="text-xs text-slate-500">Klik "Lihat Rincian Item" untuk melihat, mengedit, atau menambah item anggaran</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {data.categories.map((cat: any) => {
            const isExpanded = expandedCategories[cat.id]
            const warningItems = cat.items.filter((item: any) => item.realized > item.totalBudget * 0.8)
            const percentAbsorbed = cat.budget > 0 ? Math.min(Math.round((cat.realized / cat.budget) * 100), 999) : 0
            const isOverbudget = cat.remaining < 0

            return (
              <Card key={cat.id} className="border-slate-200/90 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between bg-white hover:border-slate-300 transition-all">
                <div>
                  <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4 pb-3">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs shrink-0 shadow-sm">
                            {cat.name.split('.')[0] || 'K'}
                          </span>
                          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {cat.name}
                          </CardTitle>
                        </div>
                        {isOverbudget ? (
                          <Badge variant="destructive" className="text-[10px] uppercase font-bold shrink-0">
                            Overbudget
                          </Badge>
                        ) : percentAbsorbed >= 80 ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] uppercase font-bold shrink-0">
                            Mendekati Pagu
                          </Badge>
                        ) : null}
                      </div>

                      {/* Action buttons toolbar */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {(cat.name.includes("IoT") || cat.name.includes("Robotic")) && (
                          <Link
                            href={cat.paketIoT?.id ? `/alat-bahan-iot/${cat.paketIoT.id}` : "/alat-bahan-iot"}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-medium px-2.5 py-1 rounded-md transition-colors"
                            title="Kelola Paket Alat & Bahan IoT per SNT"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Kelola Alat & Bahan IoT</span>
                          </Link>
                        )}
                        <button
                          onClick={() => setReportCategory(cat)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium px-2.5 py-1 rounded-md transition-colors"
                          title="Lihat Rekap Pemasukan & Pengeluaran Kategori Ini"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rekap & Pengeluaran</span>
                        </button>
                        <button
                          onClick={() => openCreateItemModal(cat.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-medium px-2.5 py-1 rounded-md transition-colors"
                          title="Tambah item di kategori ini"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Item</span>
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {/* Financial Figures Bar */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-center">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Pagu Anggaran</span>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {formatCurrency(cat.budget)}
                        </span>
                      </div>
                      <div className="border-x border-slate-200/80 px-1">
                        <span className="text-[11px] font-medium text-slate-500 block">Realisasi</span>
                        <span className="font-bold text-red-600 text-xs sm:text-sm">
                          {formatCurrency(cat.realized)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Sisa Anggaran</span>
                        <span className={`font-bold text-xs sm:text-sm ${cat.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatCurrency(cat.remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Absorption bar */}
                    {cat.budget > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Penyerapan Anggaran</span>
                          <span className={percentAbsorbed > 100 ? 'text-red-600 font-bold' : 'text-slate-700'}>
                            {percentAbsorbed}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${percentAbsorbed > 100 ? 'bg-red-500' : percentAbsorbed > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(percentAbsorbed, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Warning Box */}
                    {warningItems.length > 0 && (
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between text-amber-900 font-semibold mb-1">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Perhatian Overbudget / Kritis ({warningItems.length} pos):</span>
                          </span>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-1 divide-y divide-amber-200/50">
                          {warningItems.map((item: any) => (
                            <div key={item.id} className="text-amber-800 flex justify-between items-center py-0.5 text-[11px]">
                              <span className="truncate pr-2">{item.name}</span>
                              <span className={`font-bold shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                                item.realized > item.totalBudget 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.realized > item.totalBudget ? 'OVERBUDGET' : '>80%'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Card Footer: Accordion */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand(cat.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <span>Kelola Rincian Item ({cat.items.length} item)</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 overflow-x-auto border rounded-lg bg-white">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-600 uppercase border-b">
                              <tr>
                                <th className="px-3 py-2">Kode</th>
                                <th className="px-3 py-2">Uraian Item</th>
                                <th className="px-3 py-2 text-right">Anggaran</th>
                                <th className="px-3 py-2 text-right">Realisasi</th>
                                <th className="px-3 py-2 text-right">Sisa</th>
                                <th className="px-3 py-2 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {cat.items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/70">
                                  <td className="px-3 py-2 font-mono font-medium text-slate-500 whitespace-nowrap">
                                    {item.code}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-slate-800">
                                    {item.name}
                                    {item.volume && (
                                      <span className="block text-[10px] text-slate-400 font-normal">
                                        Vol: {item.volume}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                                    {formatCurrency(item.totalBudget)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-red-600 whitespace-nowrap font-medium">
                                    {formatCurrency(item.realized)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-green-600 whitespace-nowrap font-medium">
                                    {formatCurrency(item.remaining)}
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openEditItemModal(item, cat.id)}
                                        className="p-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
                                        title="Edit Item & Anggaran"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      {item.realized === 0 && (
                                        <button
                                          type="button"
                                          disabled={deletingItemId === item.id}
                                          onClick={() => handleDeleteItem(item)}
                                          className="p-1 text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 disabled:opacity-50"
                                          title="Hapus Item"
                                        >
                                          {deletingItemId === item.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3 h-3" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Expenses Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle>Riwayat Pengeluaran Terbaru</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Pengaju</th>
                  <th className="px-6 py-3">Item RAB</th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3">Nominal</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="border-b hover:bg-slate-50/50">
                    <td className="px-6 py-4">{new Date(exp.date || exp.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">{exp.createdBy?.name || '-'}</td>
                    <td className="px-6 py-4">{exp.rabItem?.name || '-'}</td>
                    <td className="px-6 py-4">
                      {exp.description}
                      {(exp.receiptUrl || exp.paymentReceiptUrl) && (
                        <div className="mt-1">
                          <a href={exp.receiptUrl || exp.paymentReceiptUrl} target="_blank" rel="noreferrer" data-preview-title={`Bukti Pengeluaran - ${exp.rabItem?.name || exp.description}`} className="text-blue-500 hover:underline text-xs flex items-center gap-1">
                            📎 Lihat Nota
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={exp.status === 'APPROVED' ? 'default' : exp.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => openPrintModal(exp)}
                          className="text-xs bg-blue-600 text-white hover:bg-blue-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Cetak Dokumen
                        </button>
                        <button 
                          onClick={() => openEditModal(exp)}
                          className="text-xs bg-amber-500 text-white hover:bg-amber-600 rounded px-2 py-1.5 transition-colors whitespace-nowrap w-full"
                        >
                          Edit
                        </button>
                        <DeleteExpenseButton expenseId={exp.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal Edit Expense */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full">
            <h3 className="text-lg font-bold mb-4">Edit Pengeluaran</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal</label>
                <input 
                  type="date" 
                  value={editData.date}
                  onChange={e => setEditData({...editData, date: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea 
                  value={editData.description}
                  onChange={e => setEditData({...editData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nominal</label>
                <input 
                  type="number" 
                  value={editData.amount}
                  onChange={e => setEditData({...editData, amount: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Item RAB</label>
                <select 
                  value={editData.rabItemId}
                  onChange={e => setEditData({...editData, rabItemId: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {data.categories.flatMap((cat: any) => 
                    cat.items.map((item: any) => (
                      <option key={item.id} value={item.id}>{cat.name} - {item.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded hover:bg-slate-50 text-sm"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                disabled={isSaving}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Item RAB */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {itemModalMode === 'create' ? '+ Tambah Item RAB Baru' : 'Edit Item & Anggaran RAB'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Item baru akan otomatis terdaftar dan bisa dipilih saat mencatat pengeluaran.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori RAB <span className="text-red-500">*</span>
                </label>
                <select
                  value={itemFormData.categoryId}
                  onChange={e => setItemFormData({ ...itemFormData, categoryId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {data.categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Item <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 8a, C.2, dll"
                    value={itemFormData.code}
                    onChange={e => setItemFormData({ ...itemFormData, code: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume / Satuan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 Paket, 6 Bulan"
                    value={itemFormData.volume}
                    onChange={e => setItemFormData({ ...itemFormData, volume: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian / Nama Item RAB <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengadaan Modul Tambahan Robotik"
                  value={itemFormData.name}
                  onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Satuan (Rp) (Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.unitPrice}
                    onChange={e => setItemFormData({ ...itemFormData, unitPrice: Number(e.target.value) })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pagu Anggaran RAB (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.totalBudget}
                    onChange={e => setItemFormData({ ...itemFormData, totalBudget: Number(e.target.value) })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 border rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isSavingItem}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                disabled={isSavingItem}
              >
                {isSavingItem && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSavingItem ? 'Menyimpan...' : (itemModalMode === 'create' ? 'Tambah Item' : 'Simpan Perubahan')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kategori RAB */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">+ Tambah Kategori RAB</h3>
            <p className="text-xs text-slate-500 mb-4">
              Buat kategori baru untuk mengelompokkan item anggaran.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: D. BIAYA PENDUKUNG OPERASIONAL"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 border rounded-md text-sm text-slate-700 hover:bg-slate-50"
                disabled={isSavingCat}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={isSavingCat}
              >
                {isSavingCat && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSavingCat ? 'Membuat...' : 'Buat Kategori'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Print Dokumen */}
      {showPrintModal && selectedExpense && (() => {
        const existingKw = getKwitansi(selectedExpense);
        const existingInv = getInvoice(selectedExpense);
        const hasExistingKw = !!(existingKw?.noKwitansi && !existingKw.noKwitansi.includes('TEMP'));
        const hasExistingInv = !!(existingInv?.noInvoice && !existingInv.noInvoice.includes('TEMP'));
        const isAllLocked = 
          (!printKwitansi || (hasExistingKw && !isUnlockedKwitansi)) &&
          (!printInvoice || (hasExistingInv && !isUnlockedInvoice));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cetak Dokumen Pengeluaran</h3>
                  <p className="text-xs text-slate-500">{selectedExpense.rabItem?.name || selectedExpense.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Pilihan Dokumen */}
                <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">Pilih Dokumen yang Dicetak:</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printInvoice}
                        onChange={(e) => setPrintInvoice(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Invoice Pengeluaran</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={printKwitansi}
                        onChange={(e) => setPrintKwitansi(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Kwitansi Resmi (Yayasan Maleo)</span>
                    </label>
                  </div>
                </div>

                {/* Status / Form Kwitansi */}
                {printKwitansi && (
                  hasExistingKw && !isUnlockedKwitansi ? (
                    <div className="p-3.5 border border-emerald-200 bg-emerald-50/60 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" />
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

                {/* Status / Form Invoice */}
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
                                name="kopTypeRab"
                                checked={selectedKop === 'maleo'}
                                onChange={() => setSelectedKop('maleo')}
                              />
                              <span>Yayasan Maleo</span>
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="radio"
                                name="kopTypeRab"
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
                              name="kopTypeRab"
                              checked={selectedKop === 'maleo'}
                              onChange={() => setSelectedKop('maleo')}
                            />
                            <span>Yayasan Maleo</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="kopTypeRab"
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
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Rekap & Pengeluaran Per Kategori */}
      {reportCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Top Header */}
            <div className="p-5 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Laporan Kategori Terpisah
                  </span>
                  <span className="text-xs text-slate-500">
                    {(reportCategory.items || []).length} Item RAB
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {reportCategory.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Rekapitulasi alokasi dana masuk (pagu anggaran) dan seluruh realisasi pengeluaran lapangan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintCategoryReport(reportCategory)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF Laporan</span>
                </button>
                <Link
                  href={`/laporan-pengeluaran?categoryId=${reportCategory.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Filter Transaksi</span>
                </Link>
                <button
                  onClick={() => setReportCategory(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {(() => {
                const catItems = reportCategory.items || [];
                const catExpenses = catItems.flatMap((item: any) => 
                  (item.expenses || []).map((exp: any) => ({ ...exp, rabItem: item }))
                ).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

                const catBudget = reportCategory.budget || catItems.reduce((s: number, i: any) => s + (i.totalBudget || 0), 0);
                const catRealized = reportCategory.realized || catItems.reduce((s: number, i: any) => s + (i.realized || 0), 0);
                const catRemaining = catBudget - catRealized;
                const catPersen = catBudget > 0 ? (catRealized / catBudget) * 100 : 0;

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <span className="text-xs font-semibold uppercase text-slate-500">Pagu Anggaran (Alokasi)</span>
                        <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(catBudget)}</div>
                        <span className="text-[11px] text-slate-500">Total alokasi dana kategori</span>
                      </div>
                      <div className="bg-red-50/60 border border-red-200 rounded-lg p-4">
                        <span className="text-xs font-semibold uppercase text-red-600">Total Realisasi Pengeluaran</span>
                        <div className="text-xl font-bold text-red-600 mt-1">{formatCurrency(catRealized)}</div>
                        <span className="text-[11px] text-red-700">{catExpenses.length} transaksi disetujui</span>
                      </div>
                      <div className="bg-green-50/60 border border-green-200 rounded-lg p-4">
                        <span className="text-xs font-semibold uppercase text-green-700">Sisa Saldo Anggaran</span>
                        <div className="text-xl font-bold text-green-600 mt-1">{formatCurrency(catRemaining)}</div>
                        <span className="text-[11px] text-green-700">Tersedia untuk pengeluaran</span>
                      </div>
                      <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4">
                        <span className="text-xs font-semibold uppercase text-blue-700">Tingkat Penyerapan</span>
                        <div className="text-xl font-bold text-blue-700 mt-1">{catPersen.toFixed(1)}%</div>
                        <span className="text-[11px] text-blue-600">
                          {catPersen > 100 ? 'Melebihi Anggaran' : catPersen > 80 ? 'Mendekati Pagu' : 'Status Aman'}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Item RAB Breakdown */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2.5 border-b font-bold text-sm text-slate-800 flex justify-between items-center">
                        <span>1. Pos Item Anggaran ({catItems.length} Item)</span>
                        <span className="text-xs font-normal text-slate-500">Pagu vs Realisasi per Item</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-600 uppercase border-b">
                            <tr>
                              <th className="px-3 py-2">Kode</th>
                              <th className="px-3 py-2">Uraian Item</th>
                              <th className="px-3 py-2 text-right">Pagu Anggaran</th>
                              <th className="px-3 py-2 text-right">Realisasi</th>
                              <th className="px-3 py-2 text-center">% Pakai</th>
                              <th className="px-3 py-2 text-right">Sisa Anggaran</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {catItems.map((item: any) => {
                              const itRem = item.totalBudget - item.realized;
                              const itP = item.totalBudget > 0 ? (item.realized / item.totalBudget) * 100 : 0;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 font-mono font-medium text-slate-500 whitespace-nowrap">{item.code}</td>
                                  <td className="px-3 py-2 font-medium text-slate-800">
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <span>{item.name}</span>
                                        {item.volume && <span className="block text-[10px] text-slate-400 font-normal">Vol: {item.volume}</span>}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openEditItemModal(item, reportCategory.id)}
                                        className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded border border-transparent hover:border-amber-200 transition-colors"
                                        title="Edit Item & Anggaran"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.totalBudget)}</td>
                                  <td className="px-3 py-2 text-right text-red-600 font-medium">{formatCurrency(item.realized)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge variant={itP > 100 ? "destructive" : itP > 80 ? "default" : "secondary"} className="text-[10px]">
                                      {itP.toFixed(1)}%
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-right text-green-600 font-medium">{formatCurrency(itRem)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-100 font-bold border-t">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 text-right">TOTAL:</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(catBudget)}</td>
                              <td className="px-3 py-2 text-right text-red-600">{formatCurrency(catRealized)}</td>
                              <td className="px-3 py-2 text-center">{catPersen.toFixed(1)}%</td>
                              <td className="px-3 py-2 text-right text-green-600">{formatCurrency(catRemaining)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Section 2: Expense Transactions */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2.5 border-b font-bold text-sm text-slate-800 flex justify-between items-center">
                        <span>2. Rincian Pengeluaran Lapangan Terverifikasi ({catExpenses.length} Transaksi)</span>
                        <span className="text-xs font-normal text-slate-500">Klik 'Lihat Nota' untuk pratinjau bukti</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-600 uppercase border-b">
                            <tr>
                              <th className="px-3 py-2">Tanggal</th>
                              <th className="px-3 py-2">Item RAB</th>
                              <th className="px-3 py-2">Deskripsi / Uraian</th>
                              <th className="px-3 py-2">Penerima</th>
                              <th className="px-3 py-2 text-right">Nominal</th>
                              <th className="px-3 py-2 text-center">Bukti Nota</th>
                              <th className="px-3 py-2 text-center">Aksi Dokumen</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {catExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                                  Belum ada riwayat pengeluaran lapangan untuk kategori ini.
                                </td>
                              </tr>
                            ) : (
                              catExpenses.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                                    {new Date(exp.date || exp.createdAt).toLocaleDateString('id-ID')}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-slate-800">{exp.rabItem?.name || '-'}</td>
                                  <td className="px-3 py-2 text-slate-600 max-w-xs">{exp.description || '-'}</td>
                                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                    {exp.fasilitator ? exp.fasilitator.namaLengkap : (exp.createdBy?.name || 'Staf Lapangan')}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(exp.amount)}
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    {(exp.receiptUrl || exp.paymentReceiptUrl) ? (
                                      <a
                                        href={exp.receiptUrl || exp.paymentReceiptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        data-preview-title={`Bukti Pengeluaran - ${exp.rabItem?.name || exp.description}`}
                                        className="text-blue-600 hover:underline font-medium"
                                      >
                                        📎 Lihat Nota
                                      </a>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <button
                                      onClick={() => openPrintModal(exp)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border text-[11px]"
                                    >
                                      Cetak
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {catExpenses.length > 0 && (
                            <tfoot className="bg-slate-50 border-t font-bold">
                              <tr>
                                <td colSpan={4} className="px-3 py-2 text-right">Total Transaksi:</td>
                                <td className="px-3 py-2 text-right text-red-600">{formatCurrency(catRealized)}</td>
                                <td colSpan={2}></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button
                onClick={() => setReportCategory(null)}
                className="px-4 py-2 border rounded-md text-sm text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
