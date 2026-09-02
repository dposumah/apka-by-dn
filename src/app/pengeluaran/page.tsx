import { getRabDashboardData, submitExpense } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { PengeluaranForm } from './form'

export default async function PengeluaranPage() {
  const data = await getRabDashboardData()
  
  if (!data) return <div className="p-8">RAB data not found.</div>

  // Flatten items for the dropdown
  const items = data.categories.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      categoryName: cat.name
    }))
  )

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Catat Pengeluaran Lapangan</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Pengeluaran (Korwil)</CardTitle>
        </CardHeader>
        <CardContent>
          <PengeluaranForm items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
