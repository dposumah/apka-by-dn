'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createSiswa, updateSiswa, deleteSiswa, toggleSiswaStatus } from '@/app/actions/ekstra'

export function SiswaClientPage({ initialSiswa, lokasiList }: { initialSiswa: any[], lokasiList: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Filter state
  const [filterLokasi, setFilterLokasi] = useState('')
  const [filterKelas, setFilterKelas] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    namaLengkap: '',
    kelas: 'Kelas 7 (SMP)',
    lokasiSNT: ''
  })

  const filteredSiswa = initialSiswa.filter(s => {
    if (filterLokasi && s.lokasiId !== filterLokasi) return false
    if (filterKelas && s.kelas !== filterKelas) return false
    return true
  })

  const resetForm = () => {
    setFormData({ namaLengkap: '', kelas: 'Kelas 7 (SMP)', lokasiSNT: lokasiList[0] || '' })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleAddClick = () => {
    resetForm()
    setIsAdding(true)
  }

  const handleEditClick = (siswa: any) => {
    setFormData({ namaLengkap: siswa.namaLengkap, kelas: siswa.kelas, lokasiSNT: siswa.lokasiSNT })
    setEditingId(siswa.id)
    setIsAdding(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        if (editingId) {
          await updateSiswa(editingId, formData)
        } else {
          await createSiswa(formData)
        }
        resetForm()
        router.refresh()
      } catch (error) {
        console.error('Error saving siswa:', error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Apakah anda yakin ingin menghapus siswa ini?')) return
    startTransition(async () => {
      try {
        await deleteSiswa(id)
        router.refresh()
      } catch (error) {
        console.error('Error deleting siswa:', error)
      }
    })
  }

  const handleToggleStatus = (id: string) => {
    startTransition(async () => {
      try {
        await toggleSiswaStatus(id)
        router.refresh()
      } catch (error) {
        console.error('Error toggling status:', error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Master Data Siswa</h1>
        <Button onClick={handleAddClick} disabled={isAdding || editingId !== null}>+ Tambah Siswa</Button>
      </div>

      <div className="flex gap-4 mb-4">
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-xs"
          value={filterLokasi} 
          onChange={e => setFilterLokasi(e.target.value)}
        >
          <option value="">Semua Lokasi</option>
          {lokasiList.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-xs"
          value={filterKelas} 
          onChange={e => setFilterKelas(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {['Kelas 7 (SMP)', 'Kelas 8 (SMP)', 'Kelas 9 (SMP)', 'Kelas 10 (SMA)', 'Kelas 11 (SMA)', 'Kelas 12 (SMA)'].map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa Terdaftar ({filteredSiswa.length} orang)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">No</th>
                  <th className="p-3 text-left">Nama Lengkap</th>
                  <th className="p-3 text-left">Kelas</th>
                  <th className="p-3 text-left">Lokasi SNT</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="border-b bg-muted/50">
                    <td className="p-3">-</td>
                    <td className="p-3">
                      <Input 
                        value={formData.namaLengkap} 
                        onChange={e => setFormData({...formData, namaLengkap: e.target.value})} 
                        placeholder="Nama Lengkap" 
                        required 
                      />
                    </td>
                    <td className="p-3">
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.kelas} 
                        onChange={e => setFormData({...formData, kelas: e.target.value})}
                      >
                        {['Kelas 7 (SMP)', 'Kelas 8 (SMP)', 'Kelas 9 (SMP)', 'Kelas 10 (SMA)', 'Kelas 11 (SMA)', 'Kelas 12 (SMA)'].map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.lokasiId} 
                        onChange={e => setFormData({...formData, lokasiSNT: e.target.value})}
                      >
                        <option value="" disabled>Pilih Lokasi</option>
                        {lokasiList.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3"></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSubmit} disabled={isPending || !formData.namaLengkap || !formData.lokasiId}>Simpan</Button>
                        <Button size="sm" variant="ghost" onClick={resetForm} disabled={isPending}>Batal</Button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {filteredSiswa.map((siswa, index) => {
                  const isEditing = editingId === siswa.id;
                  const lokasiName = siswa.lokasiSNT;
                  
                  if (isEditing) {
                    return (
                      <tr key={siswa.id} className="border-b bg-muted/50">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <Input 
                            value={formData.namaLengkap} 
                            onChange={e => setFormData({...formData, namaLengkap: e.target.value})} 
                            required 
                          />
                        </td>
                        <td className="p-3">
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.kelas} 
                            onChange={e => setFormData({...formData, kelas: e.target.value})}
                          >
                            {['Kelas 7 (SMP)', 'Kelas 8 (SMP)', 'Kelas 9 (SMP)', 'Kelas 10 (SMA)', 'Kelas 11 (SMA)', 'Kelas 12 (SMA)'].map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.lokasiId} 
                            onChange={e => setFormData({...formData, lokasiSNT: e.target.value})}
                          >
                            <option value="" disabled>Pilih Lokasi</option>
                            {lokasiList.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                           <Badge variant={siswa.isActive ? 'default' : 'secondary'}>
                            {siswa.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSubmit} disabled={isPending || !formData.namaLengkap || !formData.lokasiId}>Simpan</Button>
                            <Button size="sm" variant="ghost" onClick={resetForm} disabled={isPending}>Batal</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={siswa.id} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{siswa.namaLengkap}</td>
                      <td className="p-3">{siswa.kelas}</td>
                      <td className="p-3">{lokasiName}</td>
                      <td className="p-3">
                        <Badge variant={siswa.isActive ? 'default' : 'secondary'}>
                          {siswa.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(siswa)} disabled={isPending || isAdding || editingId !== null}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleToggleStatus(siswa.id)} disabled={isPending || isAdding || editingId !== null}>
                            Toggle
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(siswa.id)} disabled={isPending || isAdding || editingId !== null}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredSiswa.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">Tidak ada data siswa</td>
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
