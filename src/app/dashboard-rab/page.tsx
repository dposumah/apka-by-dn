import { getRabDashboardData, getRecentExpenses, approveExpense } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

export default async function RabDashboardPage() {
  const data = await getRabDashboardData()
  const expenses = await getRecentExpenses(20)

  if (!data) return <div className="p-8">No RAB data found. Please seed the database.</div>

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Monitoring RAB</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Total Anggaran</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(data.totalBudget)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Realisasi</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalRealized)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sisa Anggaran</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRemaining)}</p>
            <p className="text-sm text-gray-500">Terserap: {data.percentage.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.categories.map(cat => (
          <Card key={cat.id}>
            <CardHeader><CardTitle>{cat.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Anggaran</span>
                  <span className="font-medium">{formatCurrency(cat.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Realisasi</span>
                  <span className="font-medium text-red-600">{formatCurrency(cat.realized)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-bold text-green-600">{formatCurrency(cat.remaining)}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Item Overbudget / Mendekati Penuh</h4>
                  {cat.items.filter(item => item.realized > item.totalBudget * 0.8).map(item => (
                    <div key={item.id} className="text-sm text-red-500 flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.realized > item.totalBudget ? 'OVERBUDGET' : 'WARNING'}</span>
                    </div>
                  ))}
                  {cat.items.filter(item => item.realized > item.totalBudget * 0.8).length === 0 && (
                     <span className="text-sm text-gray-500">Aman</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Pengeluaran Terbaru</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Pengaju</th>
                  <th className="px-6 py-3">Item RAB</th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3">Nominal</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b">
                    <td className="px-6 py-4">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">{exp.createdBy.name}</td>
                    <td className="px-6 py-4">{exp.rabItem.name}</td>
                    <td className="px-6 py-4">
                      {exp.description}
                      {exp.receiptUrl && (
                        <div className="mt-1">
                          <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1">
                            📎 Lihat Nota
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={exp.status === 'APPROVED' ? 'default' : exp.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {exp.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <form action={async () => { 'use server'; await approveExpense(exp.id, 'APPROVED') }}>
                            <button type="submit" className="text-green-600 hover:underline">Setujui</button>
                          </form>
                          <form action={async () => { 'use server'; await approveExpense(exp.id, 'REJECTED') }}>
                            <button type="submit" className="text-red-600 hover:underline">Tolak</button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
