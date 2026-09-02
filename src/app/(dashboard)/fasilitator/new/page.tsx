import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FasilitatorForm } from '../form'
import Link from 'next/link'

export default function NewFasilitatorPage() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <Link href="/fasilitator" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Kembali ke Daftar Fasilitator</Link>
      <h1 className="text-3xl font-bold tracking-tight">Tambah Fasilitator Baru</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Data Fasilitator</CardTitle>
        </CardHeader>
        <CardContent>
          <FasilitatorForm />
        </CardContent>
      </Card>
    </div>
  )
}
