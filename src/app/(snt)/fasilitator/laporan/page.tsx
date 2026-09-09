import { prisma } from '@/lib/prisma'
import { LaporanClient } from './client-page'

export const dynamic = 'force-dynamic'

export default async function AdminLaporanMingguanPage() {
  const laporan = await prisma.laporanKegiatan.findMany({
    include: {
      fasilitator: true
    },
    orderBy: { date: 'desc' }
  })

  return <LaporanClient initialData={laporan} />
}
