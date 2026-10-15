"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { updateExpense, deleteExpense } from '@/app/actions/rab'
import { Search, Trash2, X, AlertCircle, Loader2 } from 'lucide-react'

export function LaporanClientPage({ 
  initialData, 
  rabData,
  initialCategoryId
}: { 
  initialData: any[]
  rabData: any
  initialCategoryId?: string 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [expensesList, setExpensesList] = useState<any[]>(initialData || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId || searchParams.get('categoryId') || '')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Keep expensesList in sync with initialData from server
  useEffect(() => {
    setExpensesList(initialData || [])
  }, [initialData])

  const activeCategoryObj = rabData?.categories?.find((c: any) => c.id === selectedCategory)

  // Real-time filtering based on search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expensesList;
    const q = searchQuery.toLowerCase().trim();
    return expensesList.filter((exp) => {
      const catName = exp.rabItem?.category?.name?.toLowerCase() || '';
      const itemName = exp.rabItem?.name?.toLowerCase() || '';
      const itemCode = exp.rabItem?.code?.toLowerCase() || '';
      const desc = exp.description?.toLowerCase() || '';
      const penerima = (exp.fasilitator ? exp.fasilitator.namaLengkap : (exp.createdBy?.name || 'Lainnya')).toLowerCase();
      const nominal = exp.amount?.toString() || '';
      const dateStr = new Date(exp.date).toLocaleDateString('id-ID').toLowerCase();

      return (
        desc.includes(q) ||
        itemName.includes(q) ||
        itemCode.includes(q) ||
        catName.includes(q) ||
        penerima.includes(q) ||
        nominal.includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [expensesList, searchQuery]);

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteExpense(deleteTarget.id);
      if (res?.error) throw new Error(res.error);

      // Optimistic delete from state
      setExpensesList(prev => prev.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert("Gagal menghapus pengeluaran: " + (err.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (selectedCategory) params.set('categoryId', selectedCategory)
    router.push(`/laporan-pengeluaran?${params.toString()}`)
  }

  const exportCSV = () => {
    const dataToExport = searchQuery ? filteredExpenses : expensesList;
    if (!dataToExport.length) return alert('Tidak ada data untuk diexport');
    
    const headers = ['Tanggal', 'Kategori RAB', 'Item RAB', 'Deskripsi', 'Nominal', 'Penerima', 'Status', 'Bukti Transfer'];
    
    const rows = dataToExport.map(exp => {
      const date = new Date(exp.date).toLocaleDateString('id-ID');
      const cat = exp.rabItem?.category?.name || '-';
      const item = exp.rabItem?.name || '-';
      const desc = (exp.description || '').replace(/,/g, ' ');
      const amount = exp.amount;
      const penerima = exp.fasilitator ? exp.fasilitator.namaLengkap : (exp.createdBy?.name || 'Lainnya');
      const status = exp.status;
      const bukti = exp.paymentReceiptUrl || exp.receiptUrl || '';
      
      return [date, cat, item, desc, amount, penerima, status, bukti].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const catLabel = activeCategoryObj ? activeCategoryObj.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua';
    link.setAttribute("download", `Laporan_Pengeluaran_${catLabel}_${startDate || 'All'}_${endDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const exportPDF = () => {
    window.print();
  }

  const totalAmount = expensesList.reduce((acc, curr) => acc + curr.amount, 0);
  const filteredTotalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const generateAutoNarasi = () => {
    if (expensesList.length === 0) return "Belum ada pengeluaran pada periode ini.";
    const highestItem = expensesList.reduce((acc, curr) => {
      return curr.amount > acc.amount ? curr : acc;
    }, expensesList[0]);
    const catPrefix = activeCategoryObj ? `untuk kategori "${activeCategoryObj.name}" ` : "";
    return `Pada periode laporan ini, terdapat total pengeluaran ${catPrefix}sebesar ${formatCurrency(totalAmount)} yang berasal dari ${expensesList.length} transaksi. Pengeluaran tertinggi dialokasikan untuk item RAB "${highestItem?.rabItem?.name || '-'}" sebesar ${formatCurrency(highestItem.amount)}. Realisasi penggunaan dana sejauh ini telah dicatat dan dilampirkan sesuai dengan bukti transaksi yang sah.`;
  };

  const generateAutoUpcoming = () => {
    let estHonor = 0;
    let estTransport = 0;
    
    if (rabData && rabData.categories) {
      rabData.categories.forEach((cat: any) => {
        cat.items.forEach((item: any) => {
          const remaining = item.totalBudget - item.realized;
          if (remaining > 0) {
            const nameLower = item.name.toLowerCase();
            if (nameLower.includes('fasilitator koding') || nameLower.includes('honor')) {
              estHonor += remaining;
            }
            if (nameLower.includes('sewa rumah') || nameLower.includes('transport')) {
              estTransport += remaining;
            }
          }
        });
      });
    }
    
    return `Perkiraan Pengeluaran Mendatang:
- Honorarium Fasilitator (Estimasi Maksimal Sisa Anggaran): ${formatCurrency(estHonor)}
- Bantuan Transport / Sewa Rumah Fasilitator (Estimasi Maksimal Sisa Anggaran): ${formatCurrency(estTransport)}
- Lain-lain: Rp 0`;
  };

  const [narasi, setNarasi] = useState(generateAutoNarasi());
  const [upcoming, setUpcoming] = useState(generateAutoUpcoming());

  // Filtered categories for Section 1 Ringkasan Realisasi
  const displayCategories = selectedCategory 
    ? rabData?.categories?.filter((c: any) => c.id === selectedCategory) 
    : rabData?.categories;

  const totalDisplayBudget = displayCategories?.reduce((acc: number, c: any) => {
    return acc + (c.items || []).reduce((sum: number, it: any) => sum + (it.totalBudget || 0), 0);
  }, 0) || 0;

  const totalDisplayRealized = displayCategories?.reduce((acc: number, c: any) => {
    return acc + (c.items || []).reduce((sum: number, it: any) => sum + (it.realized || 0), 0);
  }, 0) || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Pengeluaran</h1>
          <p className="text-slate-500 mt-1">
            {activeCategoryObj 
              ? `Laporan arus kas pengeluaran khusus kategori: ${activeCategoryObj.name}`
              : 'Laporan arus kas pengeluaran kegiatan berdasarkan item RAB.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" className="bg-white">
            Export CSV Transaksi
          </Button>
          <Button onClick={exportPDF} className="bg-slate-900 hover:bg-slate-800 text-white">
            Print Laporan Lengkap (PDF)
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kategori RAB</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 max-w-xs"
              >
                <option value="">Semua Kategori</option>
                {rabData?.categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleFilter}>Filter Transaksi</Button>
            {(startDate || endDate || selectedCategory) && (
              <Button 
                variant="ghost" 
                onClick={() => { 
                  setStartDate(''); 
                  setEndDate(''); 
                  setSelectedCategory(''); 
                  router.push('/laporan-pengeluaran'); 
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:hidden">
        <Card>
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Narasi / Ringkasan Laporan</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setNarasi(generateAutoNarasi())} className="h-7 text-xs">Auto Generate</Button>
          </CardHeader>
          <CardContent className="p-4">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px]" 
              value={narasi} 
              onChange={(e) => setNarasi(e.target.value)}
              placeholder="Ketik narasi laporan di sini..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Perkiraan Pengeluaran Mendatang</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setUpcoming(generateAutoUpcoming())} className="h-7 text-xs">Auto Generate</Button>
          </CardHeader>
          <CardContent className="p-4">
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px]" 
              value={upcoming} 
              onChange={(e) => setUpcoming(e.target.value)}
              placeholder="Ketik perkiraan pengeluaran mendatang..."
            />
          </CardContent>
        </Card>
      </div>

      <div id="report-container" className="space-y-8 bg-white print:p-4">
        {/* Header for PDF only */}
        <div className="hidden print:block mb-6">
          <img src="/kop-maleo.png" alt="Kop Yayasan Maleo" className="w-full object-contain mb-4 border-b-4 border-slate-800 pb-2" />
          <h2 className="text-xl font-bold text-center uppercase mt-4">
            Laporan Pelaksanaan Anggaran (RAB) & Pengeluaran
          </h2>
          {activeCategoryObj && (
            <h3 className="text-base font-bold text-center text-slate-800 mt-1 uppercase">
              Kategori: {activeCategoryObj.name}
            </h3>
          )}
          <p className="text-center text-sm mt-1">{rabData?.project?.name === 'Proyek SNT' || !rabData?.project?.name ? 'Program KKA Sekolah Nasional Terintegrasi (SNT) Tahun 2026' : rabData.project.name}</p>
          {(startDate || endDate) ? <p className="text-center text-sm mt-1">Periode: {startDate || 'Awal'} s/d {endDate || 'Akhir'}</p> : <p className="text-center text-sm mt-1">Periode: Keseluruhan</p>}
          
          <div className="mt-6 mb-4 text-justify text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{narasi}</p>
          </div>
        </div>

        {/* SECTION 1: RAB Realisasi */}
        <Card className="shadow-sm print:shadow-none print:border-none">
          <CardHeader className="print:py-2">
            <CardTitle className="text-xl">
              A. Ringkasan Realisasi {activeCategoryObj ? `Kategori (${activeCategoryObj.name})` : 'RAB'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 print:p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 border-b border-t print:bg-slate-200">
                  <tr>
                    <th className="py-2 px-4">Kategori & Item</th>
                    <th className="py-2 px-4 text-right w-32">Anggaran (Rp)</th>
                    <th className="py-2 px-4 text-right w-32">Realisasi (Rp)</th>
                    <th className="py-2 px-4 text-center w-24">% Pakai</th>
                    <th className="py-2 px-4 text-right w-32">Sisa (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayCategories?.map((cat: any) => (
                    <React.Fragment key={cat.id}>
                      <tr className="bg-slate-50 print:bg-slate-50 font-bold">
                        <td colSpan={5} className="py-2 px-4">{cat.name}</td>
                      </tr>
                      {cat.items.map((item: any) => {
                        const sisa = item.totalBudget - item.realized;
                        const persen = item.totalBudget > 0 ? (item.realized / item.totalBudget) * 100 : 0;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-4 pl-8 text-slate-700">{item.code} - {item.name}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(item.totalBudget)}</td>
                            <td className="py-2 px-4 text-right text-blue-600">{formatCurrency(item.realized)}</td>
                            <td className="py-2 px-4 text-center">
                              <Badge variant={persen > 100 ? "destructive" : persen > 80 ? "default" : "secondary"}>
                                {persen.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="py-2 px-4 text-right">{formatCurrency(sisa)}</td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-200">
                  <tr>
                    <td className="py-3 px-4 text-right">TOTAL {selectedCategory ? 'KATEGORI' : 'KESELURUHAN'}:</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(totalDisplayBudget)}</td>
                    <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(totalDisplayRealized)}</td>
                    <td className="py-3 px-4 text-center">
                      {totalDisplayBudget > 0 ? ((totalDisplayRealized / totalDisplayBudget) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatCurrency(totalDisplayBudget - totalDisplayRealized)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Transaksi Pengeluaran */}
        <Card className="shadow-sm print:shadow-none print:border-none print:mt-8 print:break-before-page">
          <CardHeader className="print:py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  B. Rincian Transaksi Pengeluaran {activeCategoryObj ? `(${activeCategoryObj.name})` : ''}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1 print:hidden">
                  {searchQuery 
                    ? `Menampilkan ${filteredExpenses.length} dari ${expensesList.length} transaksi` 
                    : `Total ${expensesList.length} transaksi terdaftar`}
                </p>
              </div>
              <div className="relative w-full sm:w-80 print:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari transaksi, deskripsi, penerima..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-sm bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 print:p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 border-b border-t print:bg-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-28">Tanggal</th>
                    <th className="py-3 px-4">Kategori RAB</th>
                    <th className="py-3 px-4">Item RAB</th>
                    <th className="py-3 px-4 w-64">Deskripsi</th>
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center print:hidden">Bukti</th>
                    <th className="py-3 px-4 text-center print:hidden w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        {searchQuery 
                          ? `Tidak ditemukan transaksi yang cocok dengan pencarian "${searchQuery}".`
                          : 'Tidak ada pengeluaran pada periode / filter ini.'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 px-4">
                          <span className="text-[11px] font-semibold px-2 py-1 bg-slate-200 rounded-md whitespace-nowrap">
                            {exp.rabItem?.category?.name || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-4">{exp.rabItem?.name || '-'}</td>
                        <td className="py-2 px-4 text-slate-600" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">{exp.fasilitator ? exp.fasilitator.namaLengkap : (exp.createdBy?.name || 'Lainnya')}</td>
                        <td className="py-2 px-4 text-right font-medium whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                        <td className="py-2 px-4 text-center print:hidden whitespace-nowrap">
                          {(exp.paymentReceiptUrl || exp.receiptUrl) ? (
                            <a 
                              href={exp.paymentReceiptUrl || exp.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              data-preview-title={`Bukti Pengeluaran - ${exp.rabItem?.name || exp.description || 'Nota'}`}
                              className="text-blue-600 text-xs hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              📎 Lihat
                            </a>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-4 text-center print:hidden whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => openEditModal(exp)} 
                              className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded transition-colors"
                              title="Edit transaksi pengeluaran"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeleteTarget(exp)} 
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
                              title="Hapus transaksi pengeluaran"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredExpenses.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold print:bg-slate-100">
                    <tr>
                      <td colSpan={5} className="py-4 px-4 text-right text-base">
                        {searchQuery ? `Total (${filteredExpenses.length} Transaksi Ditemukan):` : 'Total Rincian Transaksi:'}
                      </td>
                      <td className="py-4 px-4 text-right text-base text-red-600">{formatCurrency(filteredTotalAmount)}</td>
                      <td className="print:hidden"></td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* SECTION 3: Perkiraan Pengeluaran Mendatang (Print Only) */}
        <div className="hidden print:block mt-8">
          <div className="border-t-2 border-slate-800 pt-4 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{upcoming}</p>
          </div>
        </div>
      </div>

      {/* Modal Edit Pengeluaran */}
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
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                >
                  {rabData?.categories?.flatMap((cat: any) => 
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

      {/* Modal Konfirmasi Hapus Pengeluaran */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hapus Pengeluaran</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 my-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(deleteTarget.date || deleteTarget.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item RAB:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[220px]">
                  {deleteTarget.rabItem?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deskripsi:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[220px] truncate" title={deleteTarget.description}>
                  {deleteTarget.description || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penerima:</span>
                <span className="font-semibold text-slate-800">
                  {deleteTarget.fasilitator ? deleteTarget.fasilitator.namaLengkap : (deleteTarget.createdBy?.name || 'Lainnya')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Nominal:</span>
                <span className="font-bold text-red-600">{formatCurrency(deleteTarget.amount)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              Apakah Anda yakin ingin menghapus data pengeluaran ini dari sistem?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}