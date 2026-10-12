import { getRabDashboardData, getFasilitators, getRecentExpenses } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PengeluaranForm } from './form'
import { RecentExpensesList } from './recent-expenses'

export const dynamic = 'force-dynamic';

export default async function PengeluaranPage() {
  const data = await getRabDashboardData()
  const fasilitators = await getFasilitators()
  const recentExpenses = await getRecentExpenses(15) // fetch last 15 expenses
  
  if (!data) return <div className="p-8">RAB data not found.</div>

  // Flatten items for the dropdown
  const items = data.categories.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      categoryName: cat.name
    }))
  )

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Catat Pengeluaran Lapangan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Input pengeluaran riil di lapangan atau kelola/edit entri pengeluaran yang telah dicatat sebelumnya.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengeluaran (Korwil)</CardTitle>
            </CardHeader>
            <CardContent>
              <PengeluaranForm items={items} fasilitators={fasilitators} />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <RecentExpensesList 
            expenses={recentExpenses} 
            items={items} 
            fasilitators={fasilitators} 
          />
        </div>
      </div>
    </div>
  )
}
