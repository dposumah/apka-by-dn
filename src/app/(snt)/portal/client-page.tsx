"use client"

﻿import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, CheckCircle2, Wallet, Car, BookOpen, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { deleteLaporanKegiatan } from '@/app/actions/rab'
import { useState } from 'react'

export function PortalClient({ fasilitator, isIncomplete, userName }: { fasilitator: any, isIncomplete: boolean, userName: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteLaporan = async (laporanId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan dan menghapus laporan ini?')) return;
    setDeletingId(laporanId);
    try {
      await deleteLaporanKegiatan(laporanId, fasilitator.id);
      alert('Laporan berhasil dihapus');
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus laporan');
    } finally {
      setDeletingId(null);
    }
  }
  
  // Analytics Calculations
  const totalLaporan = fasilitator.laporan?.length || 0;
  const totalJPIntra = fasilitator.laporan?.reduce((acc: number, curr: any) => acc + (curr.jumlahJPIntra || 0), 0) || 0;
  const totalJPEkstra = fasilitator.laporan?.reduce((acc: number, curr: any) => acc + (curr.jumlahJPEkstra || 0), 0) || 0;
  const totalJP = totalJPIntra + totalJPEkstra;

  // Honor Analytics
  const laporanBelumDirekap = fasilitator.laporan?.filter((lap: any) => !lap.rekapHonorariumId) || [];
  const jpBelumDirekap = laporanBelumDirekap.reduce((acc: number, curr: any) => acc + (curr.jumlahJPIntra || 0) + (curr.jumlahJPEkstra || 0), 0);
  const estimasiHonorPending = jpBelumDirekap * 65000;
  
  const honorDisetujui = fasilitator.rekapHonorarium?.filter((r: any) => r.status === 'APPROVED').reduce((acc: number, curr: any) => acc + curr.totalHonor, 0) || 0;
  
  // Transport Analytics
  const transportPending = fasilitator.laporan?.filter((l: any) => l.biayaTransport > 0 && l.statusTransport === 'PENDING').reduce((acc: number, curr: any) => acc + curr.biayaTransport, 0) || 0;
  const transportLunas = fasilitator.laporan?.filter((l: any) => l.biayaTransport > 0 && l.statusTransport === 'PAID').reduce((acc: number, curr: any) => acc + curr.biayaTransport, 0) || 0;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Selamat datang, {userName}</h1>
        <p className="text-slate-500 mt-1">Dashboard Portal Fasilitator PT. JT Robotic SNT 2026</p>
        
        {fasilitator.lokasiSNT ? (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
            Lokasi SNT: {fasilitator.lokasiSNT}
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
            Lokasi SNT: Belum Ditentukan
          </div>
        )}
      </div>

      {isIncomplete && (
        <Alert variant="destructive">
          <AlertTitle>Profil Belum Lengkap</AlertTitle>
          <AlertDescription>
            Anda harus melengkapi profil dan informasi Rekening Pembayaran Anda sebelum dapat mengirim laporan kegiatan mingguan.
            <br/><br/>
            <Link href="/portal/profil" className="underline font-medium">Lengkapi Profil Sekarang &rarr;</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Total Kinerja</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">{totalJP} <span className="text-sm font-normal text-slate-500">JP</span></h3>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium bg-slate-50 px-2 py-1.5 rounded-md inline-block w-fit">
              Intra: {totalJPIntra} <span className="text-slate-300 mx-1">|</span> Ekstra: {totalJPEkstra}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 line-clamp-1">Honor Belum Direkap</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">Rp {(estimasiHonorPending/1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span></h3>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-4 font-medium bg-amber-50 px-2 py-1.5 rounded-md inline-block w-fit">
              {jpBelumDirekap} JP dalam {laporanBelumDirekap.length} Laporan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 line-clamp-1">Honor Disetujui</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">Rp {(honorDisetujui/1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span></h3>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-700 mt-4 font-medium bg-emerald-50 px-2 py-1.5 rounded-md inline-block w-fit">
              Total pencairan honor
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 line-clamp-1">Transportasi</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">Rp {(transportLunas/1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span></h3>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-4 font-medium bg-purple-50 px-2 py-1.5 rounded-md inline-block w-fit">
              Rp {(transportPending/1000).toLocaleString('id-ID')}k Pending
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle>Riwayat Laporan Kegiatan</CardTitle>
            <CardDescription>Daftar kegiatan yang telah Anda laporkan</CardDescription>
          </div>
          {isIncomplete ? (
            <button 
              onClick={() => alert('Harap lengkapi Profil dan Data Pembayaran Anda di menu Profil terlebih dahulu sebelum membuat laporan.')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-400 text-white cursor-not-allowed h-9 px-4"
            >
              + Buat Laporan
            </button>
          ) : (
            <div className="flex gap-2">
              <Link href="/portal/rekap" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 h-9 px-4">
                Rekap Bulanan
              </Link>
              <Link href="/portal/laporan" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4">
                + Buat Laporan
              </Link>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {fasilitator.laporan && fasilitator.laporan.length > 0 ? (
            <div className="space-y-4">
              {fasilitator.laporan.map((lap: any) => (
                <div key={lap.id} className="flex flex-col md:flex-row items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-full md:w-auto">
                    <h4 className="font-semibold text-slate-900 text-lg">{lap.topic}</h4>
                    <p className="text-sm text-slate-500">{new Date(lap.date).toLocaleDateString('id-ID')} &bull; {lap.attendance} Peserta</p>
                    {lap.materialLink && (
                      <a href={lap.materialLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        Lihat Lampiran File
                      </a>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0 text-left md:text-right space-y-2 w-full md:w-auto bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-md">
                    <div className="flex justify-between md:justify-end items-center gap-4">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Kinerja</span>
                      <div className="text-sm font-medium text-slate-900">
                        {(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)} JP 
                        <span className="text-slate-500 font-normal ml-1">
                          ({lap.tingkatSekolah} - Intra: {lap.jumlahJPIntra}, Ekstra: {lap.jumlahJPEkstra})
                        </span>
                      </div>
                    </div>
                    
                    {lap.biayaTransport > 0 && (
                      <div className="flex justify-between md:justify-end items-center gap-4">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Transportasi</span>
                        <div className="text-xs text-slate-700">
                          Rp {lap.biayaTransport.toLocaleString('id-ID')}
                          {lap.statusTransport === 'PAID' && lap.buktiTransferTransport ? (
                            <a href={lap.buktiTransferTransport} target="_blank" rel="noreferrer" className="ml-2 text-emerald-600 font-medium hover:underline inline-flex items-center bg-emerald-100 px-2 py-0.5 rounded">
                              Lunas (Lihat Bukti)
                            </a>
                          ) : lap.statusTransport === 'PAID' ? (
                            <span className="ml-2 text-emerald-600 font-medium inline-block bg-emerald-100 px-2 py-0.5 rounded">Lunas</span>
                          ) : (
                            <span className="ml-2 text-amber-600 inline-block bg-amber-100 px-2 py-0.5 rounded font-medium">Menunggu Admin</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between md:justify-end items-center gap-4 pt-1 md:pt-0">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status Honor</span>
                      {lap.rekapHonorariumId ? (
                        <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> Direkap (Bulanan)</div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded">Belum direkap</span>
                          {lap.statusTransport !== 'PAID' && (
                            <button
                              onClick={() => handleDeleteLaporan(lap.id)}
                              disabled={deletingId === lap.id}
                              className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline disabled:opacity-50 ml-2"
                            >
                              {deletingId === lap.id ? 'Membatalkan...' : 'Batalkan Laporan'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Belum ada laporan kegiatan.</p>
              <p className="text-sm mt-1">Buat laporan pertama Anda dengan menekan tombol di atas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
