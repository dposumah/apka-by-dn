"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, terbilangRupiah } from '@/lib/format'
import { useState } from 'react'
import { adminGenerateInvoiceHonor } from '@/app/actions/rekap'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/modal-provider';

export function RekapHonorClient({ initialData }: { initialData: any[] }) {
  const { confirm, alert } = useModal();

  const router = useRouter()
  
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Custom Modal State for Kop Surat
  const [showKopModal, setShowKopModal] = useState(false)
  const [selectedRekap, setSelectedRekap] = useState<any>(null)

  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setShowKopModal(true)
  }

  const handlePrintWithKop = (kopType: 'robotik' | 'maleo') => {
    setShowKopModal(false)
    if (selectedRekap) {
      handleCetakInvoice(selectedRekap, kopType)
    }
  }
    const handleCetakInvoice = async (rekap: any, kopType: 'robotik' | 'maleo' = 'robotik') => {
    try {
      setLoadingId(rekap.id)
      if (rekap.status === 'SUBMITTED') {
        await adminGenerateInvoiceHonor(rekap.id)
      }
      cetakInvoiceHonor(rekap, kopType)
      router.refresh()
    } catch (e) {
      await alert('Gagal memproses invoice')
    } finally {
      setLoadingId(null)
    }
  }

  const cetakInvoiceHonor = (rekap: any, kopType: 'robotik' | 'maleo') => {
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
          <img src="${kopType === 'maleo' ? '/kop-maleo.png' : '/kop-surat.png'}" class="header-img" alt="Kop Surat" />
          
          <div class="title-box">
            <h2>KWITANSI</h2>
            <p>Tanda Terima Honor Fasilitator</p>
          </div>
          
          <div class="info-row">
            <div>No. Kuitansi : <strong>${noKwitansi}</strong></div>
            <div>Tanggal : <strong>${new Date(rekap.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
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
              <div class="form-value-underline">${rekap.totalJP} JP</div>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rekap Honorarium Bulanan</h1>
        <p className="text-slate-500 mt-1">Daftar rekapitulasi honorarium yang diajukan oleh Fasilitator.</p>
      </div>

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
                        <button 
                          onClick={() => openKopModal(rekap)}
                          disabled={loadingId === rekap.id}
                          className="text-xs bg-slate-900 text-white hover:bg-slate-800 rounded px-2 py-1.5 transition-colors whitespace-nowrap"
                        >
                          {loadingId === rekap.id ? 'Memproses...' : 'Buat Invoice & Cetak'}
                        </button>
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
    </div>
  )
}
