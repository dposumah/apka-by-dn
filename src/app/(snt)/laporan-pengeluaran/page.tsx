import { getLaporanPengeluaran, getRabDashboardData } from '@/app/actions/rab'
import { LaporanClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function LaporanPengeluaranPage({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string; categoryId?: string }
}) {
  const expenses = await getLaporanPengeluaran(searchParams.startDate, searchParams.endDate, searchParams.categoryId)
  const rabData = await getRabDashboardData()

  return <LaporanClientPage initialData={expenses} rabData={rabData} initialCategoryId={searchParams.categoryId} />
}
