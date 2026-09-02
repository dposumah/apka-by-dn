'use client'

import { useState } from 'react'
import { submitExpense } from '@/app/actions/rab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/format'
import { Textarea } from '@/components/ui/textarea'

export function PengeluaranForm({ items, fasilitators }: { items: any[], fasilitators: any[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedFasilitatorId, setSelectedFasilitatorId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const selectedItem = items.find(i => i.id === selectedItemId)
  const isHonorarium = selectedItem?.name?.toLowerCase().includes('fasilitator')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const amount = Number(formData.get('amount'))
    const description = String(formData.get('description'))
    
    try {
      let receiptUrl = ''

      if (file) {
        const uploadData = new FormData()
        uploadData.append('file', file)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        })
        
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'Gagal mengunggah gambar')
        }
        
        const uploadResult = await uploadRes.json()
        receiptUrl = uploadResult.url
      }

      await submitExpense({
        rabItemId: selectedItemId,
        amount,
        description,
        receiptUrl,
        userId: 'demo-user-id',
        fasilitatorId: isHonorarium ? selectedFasilitatorId : undefined
      })
      alert('Pengeluaran berhasil diajukan!')
      e.currentTarget.reset()
      setSelectedItemId('')
      setSelectedFasilitatorId('')
      setFile(null)
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Item RAB</Label>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedItemId}
          onChange={e => setSelectedItemId(e.target.value)}
          required
        >
          <option value="">-- Pilih Item Kegiatan --</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>
              {item.code} - {item.name} (Sisa: {formatCurrency(item.remaining)})
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-200">
          <p><strong>Kategori:</strong> {selectedItem.categoryName}</p>
          <p><strong>Anggaran:</strong> {formatCurrency(selectedItem.totalBudget)}</p>
          <p><strong>Telah Terealisasi:</strong> {formatCurrency(selectedItem.realized)}</p>
        </div>
      )}

      {isHonorarium && (
        <div className="space-y-2 border border-blue-200 p-4 rounded-md bg-white shadow-sm">
          <Label className="text-blue-700">Penerima Honor (Fasilitator)</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            value={selectedFasilitatorId}
            onChange={e => setSelectedFasilitatorId(e.target.value)}
            required
          >
            <option value="">-- Pilih Fasilitator --</option>
            {fasilitators.map(f => (
              <option key={f.id} value={f.id}>
                {f.namaLengkap} - {f.instansi}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Karena pengeluaran ini terkait Fasilitator, mohon pilih penerimanya.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Nominal Pengeluaran (Rp)</Label>
        <Input type="number" name="amount" min="1" required placeholder="Contoh: 150000" />
      </div>

      <div className="space-y-2">
        <Label>Deskripsi / Keterangan</Label>
        <Textarea name="description" required placeholder="Jelaskan peruntukan pengeluaran ini..." />
      </div>
      
      <div className="space-y-2">
        <Label>Foto Bukti Nota (Opsional)</Label>
        <Input 
          type="file" 
          accept="image/*" 
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-gray-500">Otomatis diunggah ke Supabase saat form disubmit.</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Mengirim...' : 'Ajukan Pengeluaran'}
      </Button>
    </form>
  )
}
