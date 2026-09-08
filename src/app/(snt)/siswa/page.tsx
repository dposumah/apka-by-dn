import { getAllSiswa, getLokasiSNTList } from '@/app/actions/ekstra'
import { SiswaClientPage } from './client-page'

export const dynamic = 'force-dynamic'

export default async function SiswaPage() {
  const siswa = await getAllSiswa()
  const lokasiList = await getLokasiSNTList()
  return <SiswaClientPage initialSiswa={siswa} lokasiList={lokasiList} />
}
