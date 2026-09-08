'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createModul, updateModul, deleteModul } from '@/app/actions/ekstra'

export function ModulClientPage({ initialModul }: { initialModul: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Filter state
  const [filterTingkat, setFilterTingkat] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    kode: '',
    judul: '',
    deskripsi: '',
    tingkat: 'SMP',
    urutan: 1
  })

  const filteredModul = initialModul.filter(m => {
    if (filterTingkat && m.tingkat !== filterTingkat) return false
    return true
  })

  // sort by tingkat then urutan
  const sortedModul = [...filteredModul].sort((a, b) => {
    if (a.tingkat !== b.tingkat) return a.tingkat.localeCompare(b.tingkat)
    return a.urutan - b.urutan
  })

  const resetForm = () => {
    setFormData({ kode: '', judul: '', deskripsi: '', tingkat: 'SMP', urutan: 1 })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleAddClick = () => {
    resetForm()
    setIsAdding(true)
  }

  const handleEditClick = (modul: any) => {
    setFormData({ 
      kode: modul.kode, 
      judul: modul.judul, 
      deskripsi: modul.deskripsi || '', 
      tingkat: modul.tingkat,
      urutan: modul.urutan
    })
    setEditingId(modul.id)
    setIsAdding(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          urutan: Number(formData.urutan)
        }
        if (editingId) {
          await updateModul(editingId, payload)
        } else {
          await createModul(payload)
        }
        resetForm()
        router.refresh()
      } catch (error) {
        console.error('Error saving modul:', error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Apakah anda yakin ingin menghapus modul ini?')) return
    startTransition(async () => {
      try {
        await deleteModul(id)
        router.refresh()
      } catch (error) {
        console.error('Error deleting modul:', error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Master Data Modul Pembelajaran</h1>
        <Button onClick={handleAddClick} disabled={isAdding || editingId !== null}>+ Tambah Modul</Button>
      </div>

      <div className="flex gap-4 mb-4">
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-xs"
          value={filterTingkat} 
          onChange={e => setFilterTingkat(e.target.value)}
        >
          <option value="">Semua Tingkat</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Modul Pembelajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left w-12">No</th>
                  <th className="p-3 text-left w-24">Kode</th>
                  <th className="p-3 text-left">Judul Modul</th>
                  <th className="p-3 text-left">Deskripsi</th>
                  <th className="p-3 text-left w-24">Tingkat</th>
                  <th className="p-3 text-left w-24">Urutan</th>
                  <th className="p-3 text-left w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="border-b bg-muted/50">
                    <td className="p-3">-</td>
                    <td className="p-3">
                      <Input 
                        value={formData.kode} 
                        onChange={e => setFormData({...formData, kode: e.target.value})} 
                        placeholder="M01" 
                        required 
                      />
                    </td>
                    <td className="p-3">
                      <Input 
                        value={formData.judul} 
                        onChange={e => setFormData({...formData, judul: e.target.value})} 
                        placeholder="Judul Modul" 
                        required 
                      />
                    </td>
                    <td className="p-3">
                      <textarea 
                        className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.deskripsi} 
                        onChange={e => setFormData({...formData, deskripsi: e.target.value})} 
                        placeholder="Deskripsi (Opsional)" 
                      />
                    </td>
                    <td className="p-3">
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.tingkat} 
                        onChange={e => setFormData({...formData, tingkat: e.target.value})}
                      >
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <Input 
                        type="number"
                        value={formData.urutan} 
                        onChange={e => setFormData({...formData, urutan: parseInt(e.target.value) || 0})} 
                        required 
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSubmit} disabled={isPending || !formData.kode || !formData.judul}>Simpan</Button>
                        <Button size="sm" variant="ghost" onClick={resetForm} disabled={isPending}>Batal</Button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {sortedModul.map((modul, index) => {
                  const isEditing = editingId === modul.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={modul.id} className="border-b bg-muted/50">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <Input 
                            value={formData.kode} 
                            onChange={e => setFormData({...formData, kode: e.target.value})} 
                            required 
                          />
                        </td>
                        <td className="p-3">
                          <Input 
                            value={formData.judul} 
                            onChange={e => setFormData({...formData, judul: e.target.value})} 
                            required 
                          />
                        </td>
                        <td className="p-3">
                          <textarea 
                            className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.deskripsi} 
                            onChange={e => setFormData({...formData, deskripsi: e.target.value})} 
                          />
                        </td>
                        <td className="p-3">
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.tingkat} 
                            onChange={e => setFormData({...formData, tingkat: e.target.value})}
                          >
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <Input 
                            type="number"
                            value={formData.urutan} 
                            onChange={e => setFormData({...formData, urutan: parseInt(e.target.value) || 0})} 
                            required 
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSubmit} disabled={isPending || !formData.kode || !formData.judul}>Simpan</Button>
                            <Button size="sm" variant="ghost" onClick={resetForm} disabled={isPending}>Batal</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={modul.id} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium">{modul.kode}</td>
                      <td className="p-3">{modul.judul}</td>
                      <td className="p-3 text-muted-foreground whitespace-pre-wrap">{modul.deskripsi || '-'}</td>
                      <td className="p-3">{modul.tingkat}</td>
                      <td className="p-3">{modul.urutan}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(modul)} disabled={isPending || isAdding || editingId !== null}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(modul.id)} disabled={isPending || isAdding || editingId !== null}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sortedModul.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">Tidak ada data modul</td>
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
