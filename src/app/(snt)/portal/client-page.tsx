"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, CheckCircle2, Wallet, Car, BookOpen, Clock, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { deleteLaporanKegiatan } from '@/app/actions/rab'
import { useState } from 'react'
import { UploadLaporanFisikButton } from './upload-fisik-btn'
import { useModal } from '@/components/modal-provider'
import { hitungTotalTransportRekap } from '@/lib/transport'

export function PortalClient({ fasilitator, isIncomplete, userName }: { fasilitator: any, isIncomplete: boolean, userName: string }) {
  const { confirm, alert } = useModal();

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteLaporan = async (laporanId: string) => {
    if (!(await confirm('Apakah Anda yakin ingin membatalkan dan menghapus laporan ini?'))) return;
    setDeletingId(laporanId);
    try {
      await deleteLaporanKegiatan(laporanId, fasilitator.id);
      await alert('Laporan berhasil dihapus');
    } catch (e: any) {
      await alert(e.message || 'Gagal menghapus laporan');
    } finally {
      setDeletingId(null);
    }
  }
  
  // Total Kinerja Calculations (gabungan laporan kegiatan mingguan + rekapitulasi)
  const laporanBelumDirekap = fasilitator.laporan?.filter((lap: any) => !lap.rekapHonorariumId) || [];
  const jpBelumDirekap = laporanBelumDirekap.reduce((acc: number, curr: any) => acc + (curr.jumlahJPIntra || 0) + (curr.jumlahJPEkstra || 0), 0);
  const jpiBelumDirekap = laporanBelumDirekap.reduce((acc: number, curr: any) => acc + (curr.jumlahJPIntra || 0), 0);
  const jpeBelumDirekap = laporanBelumDirekap.reduce((acc: number, curr: any) => acc + (curr.jumlahJPEkstra || 0), 0);

  const jpRekapTotal = fasilitator.rekapHonorarium?.reduce((acc: number, curr: any) => acc + (curr.totalJP || 0), 0) || 0;
  const jpiRekapTotal = fasilitator.rekapHonorarium?.reduce((acc: number, curr: any) => acc + (curr.totalJPIntra || 0), 0) || 0;
  const jpeRekapTotal = fasilitator.rekapHonorarium?.reduce((acc: number, curr: any) => acc + (curr.totalJPEkstra || 0), 0) || 0;

  const totalJP = jpRekapTotal + jpBelumDirekap;
  const totalJPIntra = jpiRekapTotal + jpiBelumDirekap;
  const totalJPEkstra = jpeRekapTotal + jpeBelumDirekap;

  // Honor Analytics
  const honorSelesaiRekap = fasilitator.rekapHonorarium
    ?.filter((r: any) => r.status === 'APPROVED' || !!r.buktiPembayaranHonor)
    .reduce((acc: number, curr: any) => acc + (curr.totalHonor || 0), 0) || 0;

  const honorMenungguRekap = fasilitator.rekapHonorarium
    ?.filter((r: any) => r.status !== 'APPROVED' && !r.buktiPembayaranHonor)
    .reduce((acc: number, curr: any) => acc + (curr.totalHonor || 0), 0) || 0;
  const jpRekapMenunggu = fasilitator.rekapHonorarium
    ?.filter((r: any) => r.status !== 'APPROVED' && !r.buktiPembayaranHonor)
    .reduce((acc: number, curr: any) => acc + (curr.totalJP || 0), 0) || 0;

  const honorBelumDirekap = jpBelumDirekap * 65000;
  const honorMenunggu = honorMenungguRekap + honorBelumDirekap;
  const honorSelesai = honorSelesaiRekap;
  const totalJPMenunggu = jpRekapMenunggu + jpBelumDirekap;

  // Transport Analytics
  // 1. Selesai / Lunas:
  const transportSelesaiRekap = fasilitator.rekapHonorarium
    ?.filter((r: any) => r.status === 'APPROVED' || !!r.buktiPembayaranTransport)
    .reduce((acc: number, curr: any) => acc + hitungTotalTransportRekap({ ...curr, fasilitator }), 0) || 0;

  const transportSelesaiLaporan = fasilitator.laporan
    ?.filter((l: any) => !l.rekapHonorariumId && ((l.biayaTransport || 0) + (l.biayaTransportLaut || 0) > 0) && l.statusTransport === 'PAID')
    .reduce((acc: number, curr: any) => acc + (curr.biayaTransport || 0) + (curr.biayaTransportLaut || 0), 0) || 0;

  const transportSelesai = transportSelesaiRekap + transportSelesaiLaporan;

  // 2. Menunggu:
  const transportMenungguRekap = fasilitator.rekapHonorarium
    ?.filter((r: any) => r.status !== 'APPROVED' && !r.buktiPembayaranTransport)
    .reduce((acc: number, curr: any) => acc + hitungTotalTransportRekap({ ...curr, fasilitator }), 0) || 0;

  const transportMenungguLaporan = fasilitator.laporan
    ?.filter((l: any) => !l.rekapHonorariumId && ((l.biayaTransport || 0) + (l.biayaTransportLaut || 0) > 0) && l.statusTransport === 'PENDING')
    .reduce((acc: number, curr: any) => acc + (curr.biayaTransport || 0) + (curr.biayaTransportLaut || 0), 0) || 0;

  const transportMenunggu = transportMenungguRekap + transportMenungguLaporan;

  const totalSelesai = honorSelesai + transportSelesai;
  const totalMenunggu = honorMenunggu + transportMenunggu;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Selamat datang, {userName}</h1>
        <p className="text-slate-500 mt-1">Dashboard Portal Fasilitator PT. JT Robotic Explorer SNT 2026</p>
        
        {fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium">
              Lokasi SNT: <span className="font-bold">{fasilitator.lokasiSNT.replace(" - ", ", ")}</span>
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
            <Link href="/portal/profil?edit=true" className="underline font-medium">Lengkapi Profil Sekarang &rarr;</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Ringkasan Utama: Total Kinerja & Total Pencairan Bersih */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200/70 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-blue-800 tracking-wider">Total Kinerja</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalJP} <span className="text-sm font-normal text-slate-500">JP</span></h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 block">Rincian:</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                Intra: {totalJPIntra} JP &bull; Ekstra: {totalJPEkstra} JP
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200/70 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-emerald-800 tracking-wider">Total Dana Dicairkan (Lunas)</p>
                <h3 className="text-2xl font-bold text-slate-900" title={`Rp ${totalSelesai.toLocaleString('id-ID')}`}>
                  Rp {(totalSelesai / 1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span>
                </h3>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div>Honor: <strong className="text-emerald-700">Rp {(honorSelesai / 1000).toLocaleString('id-ID')}k</strong></div>
              <div>Transport: <strong className="text-purple-700">Rp {(transportSelesai / 1000).toLocaleString('id-ID')}k</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4 Cards: Symmetrical Honor & Transport Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Honor Menunggu */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Clock className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Honor Menunggu</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1" title={`Rp ${honorMenunggu.toLocaleString('id-ID')}`}>
                Rp {(honorMenunggu / 1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span>
              </h3>
              <p className="text-xs text-amber-600 font-medium">
                {totalJPMenunggu} JP ({laporanBelumDirekap.length} Laporan Baru)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Honor Selesai */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Wallet className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Honor Selesai</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1" title={`Rp ${honorSelesai.toLocaleString('id-ID')}`}>
                Rp {(honorSelesai / 1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span>
              </h3>
              <p className="text-xs text-emerald-600 font-medium">Total pencairan lunas</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Transport Menunggu */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Car className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                <Car className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transport Menunggu</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1" title={`Rp ${transportMenunggu.toLocaleString('id-ID')}`}>
                Rp {(transportMenunggu / 1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span>
              </h3>
              <p className="text-xs text-amber-600 font-medium">Menunggu verifikasi/cair</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Transport Selesai */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Car className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                <Car className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transport Selesai</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1" title={`Rp ${transportSelesai.toLocaleString('id-ID')}`}>
                Rp {(transportSelesai / 1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span>
              </h3>
              <p className="text-xs text-purple-600 font-medium">Total pencairan lunas</p>
            </div>
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
              onClick={async () => await alert('Harap lengkapi Profil dan Data Pembayaran Anda di menu Profil terlebih dahulu sebelum membuat laporan.')}
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
              {fasilitator.laporan.map((lap: any) => {
                const totalBiayaTransportLap = (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0);
                const isRekapPaid = lap.rekapHonorarium?.status === 'APPROVED' || !!lap.rekapHonorarium?.buktiPembayaranTransport;

                return (
                  <div key={lap.id} className="flex flex-col md:flex-row items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-full md:w-auto">
                      <h4 className="font-semibold text-slate-900 text-lg">{lap.topic}</h4>
                      <p className="text-sm text-slate-500">{new Date(lap.date).toLocaleDateString('id-ID')} &bull; {lap.attendance} Peserta &bull; {lap.metodePelaksanaan}</p>
                      {lap.materialLink && (
                        <a href={lap.materialLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block mr-3">
                          Materi Pembelajaran
                        </a>
                      )}
                      {lap.fileLaporanFisik ? (
                        <a href={lap.fileLaporanFisik} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline mt-1 inline-block mr-3">
                          Laporan Fisik
                        </a>
                      ) : (
                        <UploadLaporanFisikButton laporanId={lap.id} />
                      )}
                      {lap.foto1 && (
                        <a href={lap.foto1} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block mr-3">
                          Foto 1
                        </a>
                      )}
                      {lap.foto2 && (
                        <a href={lap.foto2} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                          Foto 2
                        </a>
                      )}
                    </div>
                    <div className="mt-4 md:mt-0 text-left md:text-right space-y-2 w-full md:w-auto bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-md">
                      <div className="flex justify-between md:justify-end items-center gap-4">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Kinerja</span>
                        <div className="text-sm font-medium text-slate-900">
                          {(lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0)} JP 
                          <span className="text-slate-500 font-normal ml-1">
                            ({lap.tingkatSekolah} {lap.metodePelaksanaan} - Intra: {lap.jumlahJPIntra}, Ekstra: {lap.jumlahJPEkstra})
                          </span>
                        </div>
                      </div>
                      
                      {totalBiayaTransportLap > 0 && (
                        <div className="flex justify-between md:justify-end items-center gap-4">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Transportasi</span>
                          <div className="text-xs text-slate-700">
                            Rp {totalBiayaTransportLap.toLocaleString('id-ID')}
                            {lap.rekapHonorarium?.buktiPembayaranTransport ? (
                              <a href={lap.rekapHonorarium.buktiPembayaranTransport} target="_blank" rel="noreferrer" className="ml-2 text-emerald-600 font-medium hover:underline inline-flex items-center bg-emerald-100 px-2 py-0.5 rounded">
                                Lunas (Lihat Bukti)
                              </a>
                            ) : (lap.statusTransport === 'PAID' && lap.buktiTransferTransport) ? (
                              <a href={lap.buktiTransferTransport} target="_blank" rel="noreferrer" className="ml-2 text-emerald-600 font-medium hover:underline inline-flex items-center bg-emerald-100 px-2 py-0.5 rounded">
                                Lunas (Lihat Bukti)
                              </a>
                            ) : (lap.statusTransport === 'PAID' || isRekapPaid) ? (
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
                          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3"/> Direkap (Bulanan)
                          </div>
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
                );
              })}
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
