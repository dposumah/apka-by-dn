import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PrintButton } from "./print-button"

export default async function RekapPdfPage({ params }: { params: { id: string } }) {
  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: params.id },
    include: {
      fasilitator: true,
      laporan: {
        orderBy: { date: 'asc' }
      }
    }
  })

  if (!rekap) return notFound()

  const formatBulan = (bulan: string) => {
    const [y, m] = bulan.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, 1)
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="max-w-4xl mx-auto p-12 bg-white print:p-0 print:w-full">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Laporan Bulanan Fasilitator</h1>
          <h2 className="text-lg font-semibold mt-1">SNT KKA Robotika 2026</h2>
        </div>

        {/* Info Fasilitator */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p><span className="font-semibold w-32 inline-block">Nama Lengkap</span> : {rekap.fasilitator.namaLengkap}</p>
            <p><span className="font-semibold w-32 inline-block">Lokasi SNT</span> : {rekap.fasilitator.lokasiSNT || '-'}</p>
            <p><span className="font-semibold w-32 inline-block">Status</span> : {rekap.fasilitator.statusKepegawaian || '-'}</p>
          </div>
          <div>
            <p><span className="font-semibold w-32 inline-block">Bulan Laporan</span> : {formatBulan(rekap.bulan)}</p>
            <p><span className="font-semibold w-32 inline-block">Tanggal Cetak</span> : {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Tabel Rekap */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr>
              <th className="border border-black px-3 py-2 text-left">No</th>
              <th className="border border-black px-3 py-2 text-left">Tanggal</th>
              <th className="border border-black px-3 py-2 text-left">Topik Kegiatan</th>
              <th className="border border-black px-3 py-2 text-center">Tingkat</th>
              <th className="border border-black px-3 py-2 text-center">Peserta</th>
              <th className="border border-black px-3 py-2 text-center">JP</th>
            </tr>
          </thead>
          <tbody>
            {rekap.laporan.map((lap, i) => (
              <tr key={lap.id}>
                <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                <td className="border border-black px-3 py-2">{new Date(lap.date).toLocaleDateString('id-ID')}</td>
                <td className="border border-black px-3 py-2">{lap.topic} <span className="text-xs text-gray-500 block">({lap.jenisKegiatan})</span></td>
                <td className="border border-black px-3 py-2 text-center">{lap.tingkatSekolah}</td>
                <td className="border border-black px-3 py-2 text-center">{lap.attendance}</td>
                <td className="border border-black px-3 py-2 text-center">{lap.jumlahJP}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={5} className="border border-black px-3 py-2 text-right">TOTAL JAM PELAJARAN (JP)</td>
              <td className="border border-black px-3 py-2 text-center">{rekap.totalJP}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={5} className="border border-black px-3 py-2 text-right">TOTAL HONORARIUM (JP x Rp 65.000)</td>
              <td className="border border-black px-3 py-2 text-right whitespace-nowrap">Rp {rekap.totalHonor.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-16 text-sm">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p>Admin SNT</p>
            <div className="h-24"></div>
            <p className="font-semibold underline">(.......................................)</p>
          </div>
          <div className="text-center w-64">
            <p>Fasilitator,</p>
            <p>&nbsp;</p>
            <div className="h-24"></div>
            <p className="font-semibold underline">{rekap.fasilitator.namaLengkap}</p>
          </div>
        </div>

        <PrintButton />
      </div>
    </div>
  )
}
