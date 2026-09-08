import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getLaporanEkstraFasilitator } from '@/app/actions/ekstra'
import { RiwayatEkstraClient } from './client-page'

export default async function RiwayatEkstraPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const fasilitator = await prisma.fasilitator.findUnique({
    where: { userId: session.user.id }
  })
  if (!fasilitator) return <div className="p-8">Akses ditolak.</div>

  const laporanList = await getLaporanEkstraFasilitator(fasilitator.id)
  return <RiwayatEkstraClient laporanList={laporanList} />
}
