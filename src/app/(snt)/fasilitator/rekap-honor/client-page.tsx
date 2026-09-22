"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { useState, useEffect } from 'react'
import { createRekapManual, deleteRekap, generateKwitansiHonor } from '@/app/actions/rekap'
import { adminGenerateInvoiceHonor } from '@/app/actions/rekap'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/modal-provider';

export function RekapHonorClient({ initialData, fasilitators = [] }: { initialData: any[], fasilitators?: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  
  
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualFasilId, setManualFasilId] = useState('')
  const [manualBulan, setManualBulan] = useState('')
  const [manualJP, setManualJP] = useState('')
  const [manualRate, setManualRate] = useState('65000')
  const [manualSesi, setManualSesi] = useState('4')
  const [manualHonor, setManualHonor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Auto calculate if JP changes
    const jp = parseInt(manualJP) || 0
    const rate = parseInt(manualRate) || 0
    setManualHonor((jp * rate).toString())
  }, [manualJP, manualRate])

  
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
      await createRekapManual(manualFasilId, manualBulan, parseInt(manualJP) || 0, parseInt(manualHonor) || 0, parseInt(manualSesi) || 4)
      setShowManualForm(false)
      setManualFasilId('')
      setManualBulan('')
      setManualJP('')
      setManualHonor('')
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
  const [selectedRekap, setSelectedRekap] = useState<any>(null)

  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setShowKopModal(true)
  }

  const handlePrintWithKop = (docType: 'invoice' | 'kwitansi') => {
    setShowKopModal(false)
    if (selectedRekap) {
      if (docType === 'invoice') {
        cetakInvoiceLama(selectedRekap);
      } else {
        cetakKwitansiMaleo(selectedRekap);
      }
    }
  }
      
  const cetakInvoiceLama = (rekap: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Invoice Honorarium - ${rekap.fasilitator?.namaLengkap}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; }
            .header { text-align: center; margin-bottom: 40px; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 30px;">
            <img src="/kop-surat.png" style="width: 100%; max-height: 120px; object-fit: contain;" alt="Kop Surat" />
          </div>
          <div class="header">
            <h2>INVOICE HONORARIUM FASILITATOR</h2>
            <p>KKA Sekolah Nasional Terintegrasi Tahun 2026</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Nama Fasilitator:</strong> ${rekap.fasilitator?.namaLengkap}</p>
              <p><strong>Lokasi SNT:</strong> ${rekap.fasilitator?.lokasiSNT ? rekap.fasilitator.lokasiSNT.split(' - ')[0] : '-'}</p>
              <p><strong>Bulan Laporan:</strong> ${rekap.bulan}</p>
              <p><strong>Tanggal Diajukan:</strong> ${new Date(rekap.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>Jumlah JP</th>
                <th>Total Honor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Honorarium Fasilitator Bulan ${rekap.bulan}</td>
                <td>${rekap.totalJP} JP</td>
                <td>Rp ${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colspan="2" class="total">TOTAL TAGIHAN HONORARIUM:</td>
                <td class="total text-emerald-600">Rp ${(rekap.totalHonor || 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f8fafc; min-width: 250px;">
              <h4 style="margin:0 0 10px 0;">Informasi Transfer</h4>
              <p style="margin:5px 0;"><strong>Bank:</strong> ${rekap.fasilitator?.bankName || '-'}</p>
              <p style="margin:5px 0;"><strong>No. Rekening:</strong> ${rekap.fasilitator?.bankAccount || '-'}</p>
              <p style="margin:5px 0;"><strong>A/N:</strong> ${rekap.fasilitator?.namaLengkap}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin-top:40px;">Dicetak oleh: Admin SNT</p>
            </div>
          </div>
          <script>window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
  }

const cetakKwitansiMaleo = (rekap: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    
    // Konversi angka bulan jadi romawi untuk No Kuitansi
    const romanMonths = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
    const d = new Date(rekap.createdAt);
    const monthRoman = romanMonths[d.getMonth()] || 'I';
    const year = d.getFullYear();
    const noKwitansi = `KWT/MTC/${monthRoman}/${year}`;
    const rateHonor = rekap.totalJP > 0 ? (rekap.totalHonor / rekap.totalJP) : 0;
    
    win.document.write(`
      <html>
        <head>
          <title>Kwitansi Honor - ${rekap.fasilitator.namaLengkap}</title>
          <style>
            @page { margin: 0.5cm 1cm; }
            @media print { body { padding: 0; } }
            body { font-family: 'Times New Roman', Times, serif; padding: 10px 40px; line-height: 1.5; font-size: 14px; }
            .header-img { width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px; }
            .title-box { text-align: center; margin-bottom: 15px; }
            .title-box h2 { margin: 0; font-size: 20px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
            .title-box p { margin: 5px 0 0 0; font-size: 16px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .info-col { width: 48%; }
            .form-group { margin-bottom: 8px; display: flex; }
            .form-label { width: 220px; font-weight: normal; }
            .form-colon { width: 20px; }
            .form-value { flex: 1; font-weight: bold; }
            .form-value-underline { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
            .terbilang-box { background-color: #f1f5f9; padding: 6px 10px; font-style: italic; font-weight: bold; border: 1px dashed #ccc; margin-top: 5px;}
            .section-title { font-weight: bold; margin: 20px 0 10px 0; text-decoration: underline; }
            
            .ttd-container { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
            .ttd-box { width: 250px; }
            .ttd-name { margin-top: 50px; font-weight: bold; text-decoration: underline; }
            
            .notes { margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <img src="/kop-maleo.png" class="header-img" alt="Kop Surat" />
          
          <div class="title-box">
            <h2>KWITANSI</h2>
            <p>Tanda Terima Honor Fasilitator</p>
          </div>
          
          <div class="info-row">
            <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
            <div>Tanggal : <strong>${kwitansiDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Telah terima dari</div>
            <div class="form-colon">:</div>
            <div class="form-value-underline">Yayasan Maleo Talenta Cendekia</div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Jumlah Uang</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-size: 16px;">Rp ${rekap.totalHonor.toLocaleString('id-ID')}</div>
          </div>
          
          <div class="form-group">
            <div class="form-label">Terbilang</div>
            <div class="form-colon">:</div>
            <div class="form-value terbilang-box">${terbilangRupiah(rekap.totalHonor)}</div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <div class="form-label">Untuk pembayaran</div>
            <div class="form-colon">:</div>
            <div class="form-value" style="font-weight: normal;">Pembayaran honor fasilitator atas nama tersebut di bawah, untuk kegiatan/program:</div>
          </div>
          
          <div style="margin-left: 20px;">
            <div class="form-group">
              <div class="form-label">Nama fasilitator</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${rekap.fasilitator.namaLengkap}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">No. Identitas (KTP/NPWP)</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${rekap.fasilitator.npwpNik || '-'}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Nama program/kegiatan</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Sekolah Nasional Terintegrasi (SNT)</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Periode / sesi honor</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Bulan ${rekap.bulan}</div>
            </div>
            
            <div class="form-group">
                <div class="form-label">Jumlah sesi / JP</div>
                <div class="form-colon">:</div>
                <div class="form-value-underline">${rekap.jumlahSesi || 4} (pertemuan dalam 1 bulan) / ${rekap.totalJP} JP</div>
              </div>
            
            <div class="form-group">
              <div class="form-label">Honor per sesi / JP</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">Rp ${rateHonor.toLocaleString('id-ID')}</div>
            </div>
            
            <div class="form-group">
              <div class="form-label">Lokasi pelaksanaan</div>
              <div class="form-colon">:</div>
              <div class="form-value-underline">${rekap.fasilitator.lokasiSNT || '-'}</div>
            </div>
          </div>
          
          <div class="section-title">Rincian potongan (bila ada):</div>
          <div class="form-group">
            <div class="form-label" style="width: 200px;">PPh Pasal 21 (jika ada)</div>
            <div class="form-value" style="font-weight: normal;">Rp 0</div>
          </div>
          <div class="form-group">
            <div class="form-label" style="width: 200px; font-weight: bold;">Honor diterima bersih</div>
            <div class="form-value" style="font-size: 16px;">Rp ${rekap.totalHonor.toLocaleString('id-ID')}</div>
          </div>
          
          <div class="ttd-container">
            <div class="ttd-box">
              <div>Mengetahui / Menyetujui,</div>
              <div style="font-weight: bold;">Yayasan Maleo Talenta Cendekia</div>
              <div class="ttd-name">( ______________________________ )</div>
            </div>
            
            <div class="ttd-box">
              <div>Yang Menerima Honor,</div>
              <div style="font-weight: bold;">Fasilitator</div>
              <div class="ttd-name">( ${rekap.fasilitator.namaLengkap} )</div>
            </div>
          </div>
          
          <div class="notes">
            <strong>Catatan:</strong><br/>
            • Materai Rp10.000 ditempel bila nominal honor di atas Rp5.000.000.<br/>
            • Bank: ${rekap.fasilitator.bankName || '-'} | No. Rek: ${rekap.fasilitator.bankAccount || '-'}
          </div>
          
          <script>window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
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
              <div className="grid grid-cols-2 gap-4">
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
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualJP} onChange={e => setManualJP(e.target.value)} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Honor per JP (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualRate} onChange={e => setManualRate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Honor (Rp)</label>
                  <input type="number" min="0" required className="w-full border rounded p-2" value={manualHonor} onChange={e => setManualHonor(e.target.value)} />
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
                  <th className="py-3 px-4">Fasilitator</th>
                  <th className="py-3 px-4">Bulan</th>
                  <th className="py-3 px-4 text-center">Total JP</th>
                  <th className="py-3 px-4 text-right">Total Honor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Dokumen PDF</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialData.map((rekap) => (
                  <tr key={rekap.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{rekap.fasilitator.namaLengkap}</td>
                    <td className="py-3 px-4">{rekap.bulan}</td>
                    <td className="py-3 px-4 text-center">{rekap.totalJP}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(rekap.totalHonor)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={rekap.status === 'SUBMITTED' ? 'default' : 'secondary'}>{rekap.status}</Badge>
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
                          <button 
                            onClick={() => handleDelete(rekap.id)}
                            className="text-xs bg-red-600 text-white hover:bg-red-700 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                          >
                            Hapus
                          </button>
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
      {showKopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Pilih Jenis Dokumen untuk Dicetak</h3>
            <p className="text-sm text-slate-600 mb-6">Pilih apakah Anda ingin mencetak dokumen berupa Invoice (Standar) atau Kwitansi (Format Yayasan Maleo).</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handlePrintWithKop('invoice')}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Cetak Invoice Honorarium (Format Lama)</span>
              </button>
              <button 
                onClick={() => handlePrintWithKop('kwitansi')}
                className="w-full py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition-colors text-left flex justify-between items-center"
              >
                <span>Cetak Kwitansi (Format Yayasan Maleo)</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowKopModal(false)} className="text-sm text-slate-500 hover:text-slate-800">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}