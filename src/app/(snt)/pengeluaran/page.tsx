import { getRabDashboardData, getFasilitators, getRecentExpenses } from '@/app/actions/rab'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PengeluaranForm } from './form'
import { RecentExpensesList } from './recent-expenses'

export const dynamic = 'force-dynamic';

export default async function PengeluaranPage() {
  const data = await getRabDashboardData()
  const fasilitators = await getFasilitators()
  const recentExpenses = await getRecentExpenses(100) // fetch last 100 expenses
  
  if (!data) return <div className="p-8">RAB data not found.</div>

  // Flatten items for the dropdown
  const items = data.categories.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      categoryName: cat.name
    }))
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Catat & Kelola Pengeluaran Lapangan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Input pengeluaran riil di lapangan, cetak kwitansi resmi yang terhubung langsung ke Google Sheets, dan kelola riwayat transaksi.
        </p>
      </div>
      
      {/* 1. Formulir Input Pengeluaran (Di Bagian Atas) */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/70 border-b pb-4">
          <CardTitle className="text-lg font-bold text-slate-900">Formulir Pengeluaran (Korwil)</CardTitle>
          <CardDescription>
            Isi formulir berikut untuk mencatat pengeluaran operasional atau pembelian barang/jasa di lapangan.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <PengeluaranForm items={items} fasilitators={fasilitators} />
        </CardContent>
      </Card>
      
      {/* 2. Tabel Rincian & Riwayat Pengeluaran (Dipindahkan ke Bawah, Full Width) */}
      <div className="w-full">
        <RecentExpensesList 
          expenses={recentExpenses} 
          items={items} 
          fasilitators={fasilitators} 
          categories={data.categories}
        />
      </div>
    </div>
  )
}
