import { getRekapKehadiran, getLokasiSNTList, getAllModul } from '@/app/actions/ekstra'
import { RekapEkstraClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function RekapEkstraPage() {
  const rekap = await getRekapKehadiran()
  const lokasiList = await getLokasiSNTList()
  const modulList = await getAllModul()
  return <RekapEkstraClientPage initialRekap={rekap} lokasiList={lokasiList} modulList={modulList} />
}
