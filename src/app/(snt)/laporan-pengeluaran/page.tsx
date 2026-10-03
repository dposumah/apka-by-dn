import { getLaporanPengeluaran } from '@/app/actions/rab'
import { LaporanClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function LaporanPengeluaranPage({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string }
}) {
  const expenses = await getLaporanPengeluaran(searchParams.startDate, searchParams.endDate)

  return <LaporanClientPage initialData={expenses} />
}
