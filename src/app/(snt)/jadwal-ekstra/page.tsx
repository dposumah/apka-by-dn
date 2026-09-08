import { getJadwalEkstra, getLokasiSNTList, getAllModul } from '@/app/actions/ekstra'
import { JadwalClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function JadwalEkstraPage() {
  const jadwal = await getJadwalEkstra()
  const lokasiList = await getLokasiSNTList()
  const modulList = await getAllModul()
  return <JadwalClientPage initialJadwal={jadwal} lokasiList={lokasiList} modulList={modulList} />
}
