import { getRabDashboardData, getFasilitators, getRecentExpenses } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { PengeluaranForm } from './form'

export const dynamic = 'force-dynamic';

export default async function PengeluaranPage() {
  const data = await getRabDashboardData()
  const fasilitators = await getFasilitators()
  const recentExpenses = await getRecentExpenses(10) // fetch last 10 expenses
  
  if (!data) return <div className="p-8">RAB data not found.</div>

  // Flatten items for the dropdown
  const items = data.categories.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      categoryName: cat.name
    }))
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Catat Pengeluaran Lapangan</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Pengeluaran Terakhir</CardTitle>
              <CardDescription>10 entri pengeluaran terakhir yang telah diinput</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExpenses.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Belum ada pengeluaran</p>
                ) : (
                  recentExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <p className="font-semibold text-sm">{expense.rabItem?.name || '-'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{expense.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(expense.date || expense.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-900">{formatCurrency(expense.amount)}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mt-1">{expense.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
