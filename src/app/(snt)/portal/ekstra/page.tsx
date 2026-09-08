import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getJadwalForFasilitator, getSiswaByLokasi } from '@/app/actions/ekstra'
import { EkstraClientForm } from './client-form'
import { getTransportConfig } from "@/app/actions/transport-config"

export default async function EkstraPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const fasilitator = await prisma.fasilitator.findUnique({
    where: { userId: session.user.id }
  })
  if (!fasilitator) return <div className="p-8">Akses ditolak.</div>

  const jadwalList = await getJadwalForFasilitator(fasilitator.id)
  const siswaList = await getSiswaByLokasi(fasilitator.lokasiSNT || undefined)
  const config = await getTransportConfig()

  const existingReportsWithTransport = await prisma.laporanKegiatan.findMany({
    where: { 
      fasilitatorId: fasilitator.id,
      OR: [
        { biayaTransportDisetujui: { gt: 0 } },
        { biayaTransportLaut: { gt: 0 } }
      ]
    },
    select: { date: true }
  })

  const claimedTransportDates = existingReportsWithTransport.map((r: any) => {
    const d = new Date(r.date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().substring(0, 10)
  })

  return <EkstraClientForm 
    fasilitatorId={fasilitator.id} 
    jadwalList={jadwalList} 
    siswaList={siswaList}
    jarakTempuhKm={fasilitator.jarakTempuhKm || 0}
    config={config}
    claimedTransportDates={claimedTransportDates}
  />
}
