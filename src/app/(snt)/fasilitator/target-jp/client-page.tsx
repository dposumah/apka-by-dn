"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { getRekapTargetJp, updateTargetJpFasilitator } from '@/app/actions/rekap'

export function TargetJpClient({ initialData, defaultMonth }: { initialData: any[], defaultMonth: string }) {
  const [data, setData] = useState<any[]>(initialData)
  const [bulan, setBulan] = useState(defaultMonth)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTargetBulan, setEditTargetBulan] = useState(32)
  const [editTargetTotal, setEditTargetTotal] = useState(128)
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (row: any) => {
    setEditingId(row.fasilitator.id)
    setEditTargetBulan(row.targetBulan)
    setEditTargetTotal(row.targetTotal)
  }

  const handleSave = async (id: string) => {
    setIsSaving(true)
    try {
      await updateTargetJpFasilitator(id, editTargetBulan, editTargetTotal)
      setEditingId(null)
      // refresh data
      const res = await getRekapTargetJp(bulan)
      setData(res)
    } catch(e) {
      alert("Gagal menyimpan target")
    } finally {
      setIsSaving(false)
    }
  }


  useEffect(() => {
    if (bulan === defaultMonth) return;
    setIsLoading(true);
    getRekapTargetJp(bulan).then(res => {
      setData(res)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [bulan, defaultMonth])

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rekap Target JP Fasilitator</h1>
        <p className="text-slate-500 mt-1">Pantau target dan realisasi Jam Pelajaran per bulan dan total sampai akhir tahun.</p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <label className="text-sm font-medium mb-1 block">Pilih Bulan</label>
          <input 
            type="month" 
            value={bulan}
            onChange={e => setBulan(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                Memuat data...
              </div>
            )}
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-700" rowSpan={2}>Fasilitator</th>
                  <th className="py-2 px-4 text-center font-semibold text-slate-700 border-b border-l bg-blue-50/50" colSpan={4}>Bulan Terpilih ({bulan})</th>
                  <th className="py-2 px-4 text-center font-semibold text-slate-700 border-b border-l bg-amber-50/50" colSpan={4}>Total Keseluruhan (S.d 31 Des)</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 border-l" rowSpan={2}>Aksi</th>
                </tr>
                <tr>
                  <th className="py-2 px-4 text-center border-l bg-blue-50/50">Target</th>
                  <th className="py-2 px-4 text-center bg-blue-50/50">Realisasi</th>
                  <th className="py-2 px-4 text-center bg-blue-50/50">Sisa</th>
                  <th className="py-2 px-4 text-center bg-blue-50/50">%</th>
                  
                  <th className="py-2 px-4 text-center border-l bg-amber-50/50">Target</th>
                  <th className="py-2 px-4 text-center bg-amber-50/50">Realisasi</th>
                  <th className="py-2 px-4 text-center bg-amber-50/50">Sisa</th>
                  <th className="py-2 px-4 text-center bg-amber-50/50">%</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((row) => (
                  <tr key={row.fasilitator.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{row.fasilitator.namaLengkap}</div>
                      <div className="text-xs text-slate-500 uppercase">{row.fasilitator.lokasiSNT}</div>
                    </td>
                    
                    {/* Bulan Terpilih */}
                    <td className="py-3 px-4 text-center border-l">{editingId === row.fasilitator.id ? <input type="number" className="w-16 border rounded p-1 text-center" value={editTargetBulan} onChange={e=>setEditTargetBulan(parseInt(e.target.value)||0)} /> : `${row.targetBulan} JP`}</td>
                    <td className="py-3 px-4 text-center font-medium text-blue-600">{row.realisasiBulan} JP</td>
                    <td className="py-3 px-4 text-center text-red-500">{row.sisaBulan} JP</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={row.persenBulan >= 100 ? 'default' : 'secondary'} className={row.persenBulan >= 100 ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {row.persenBulan}%
                      </Badge>
                    </td>

                    {/* Total Keseluruhan */}
                    <td className="py-3 px-4 text-center border-l">{editingId === row.fasilitator.id ? <input type="number" className="w-16 border rounded p-1 text-center" value={editTargetTotal} onChange={e=>setEditTargetTotal(parseInt(e.target.value)||0)} /> : `${row.targetTotal} JP`}</td>
                    <td className="py-3 px-4 text-center font-medium text-amber-600">{row.realisasiTotal} JP</td>
                    <td className="py-3 px-4 text-center text-red-500">{row.sisaTotal} JP</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={row.persenTotal >= 100 ? 'default' : 'secondary'} className={row.persenTotal >= 100 ? 'bg-green-600 hover:bg-green-700' : ''}>
                        {row.persenTotal}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center border-l">
                      {editingId === row.fasilitator.id ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleSave(row.fasilitator.id)} disabled={isSaving} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="text-xs bg-slate-200 px-2 py-1 rounded">Batal</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(row)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border">Edit Target</button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">Belum ada fasilitator aktif.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
