import { getFasilitatorDetail } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FasilitatorForm } from '../../form'
import Link from 'next/link'

export default async function EditFasilitatorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const f = await getFasilitatorDetail(params.id)
  
  if (!f) return <div className="p-8">Fasilitator tidak ditemukan.</div>

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <Link href={/fasilitator/ + f.id} className="text-blue-600 hover:underline mb-4 inline-block">&larr; Batal & Kembali ke Profil</Link>
      <h1 className="text-3xl font-bold tracking-tight">Edit Profil Fasilitator</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Pembaruan Data</CardTitle>
        </CardHeader>
        <CardContent>
          <FasilitatorForm initialData={f} />
        </CardContent>
      </Card>
    </div>
  )
}
