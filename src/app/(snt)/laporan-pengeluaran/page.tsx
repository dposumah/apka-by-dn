import { getLaporanPengeluaran, getRabDashboardData } from '@/app/actions/rab'
import { LaporanClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function LaporanPengeluaranPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; categoryId?: string }>
}) {
  const sp = await searchParams
  const expenses = await getLaporanPengeluaran(sp.startDate, sp.endDate, sp.categoryId)
  const rabData = await getRabDashboardData()

  return <LaporanClientPage initialData={expenses} rabData={rabData} initialCategoryId={sp.categoryId} />
}
