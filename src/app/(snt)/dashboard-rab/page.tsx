import { getRabDashboardData, getRecentExpenses } from '@/app/actions/rab'
import { prisma } from '@/lib/prisma'
import { RabDashboardClient } from './client-page'

export const dynamic = 'force-dynamic';

export default async function RabDashboardPage() {
  const data = await getRabDashboardData()
  const expenses = await getRecentExpenses(20)

  const pendingWeekly = await prisma.laporanKegiatan.count({ where: { statusTransport: 'PENDING', OR: [{ biayaTransport: { gt: 0 } }, { biayaTransportLaut: { gt: 0 } }] } })
  const pendingHonor = await prisma.rekapHonorarium.count({ where: { status: 'SUBMITTED' } })

  return (
    <RabDashboardClient 
      data={data}
      expenses={expenses}
      pendingWeekly={pendingWeekly}
      pendingHonor={pendingHonor}
    />
  )
}
