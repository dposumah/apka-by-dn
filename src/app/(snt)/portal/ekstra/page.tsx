import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getJadwalForFasilitator, getSiswaByLokasi } from '@/app/actions/ekstra'
import { EkstraClientForm } from './client-form'

export default async function EkstraPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const fasilitator = await prisma.fasilitator.findUnique({
    where: { userId: session.user.id }
  })
  if (!fasilitator) return <div className="p-8">Akses ditolak.</div>

  const jadwalList = await getJadwalForFasilitator(fasilitator.id)
  const siswaList = await getSiswaByLokasi(fasilitator.lokasiSNT || undefined)

  return <EkstraClientForm 
    fasilitatorId={fasilitator.id} 
    jadwalList={jadwalList} 
    siswaList={siswaList}
  />
}
