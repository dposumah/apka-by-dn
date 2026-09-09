'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteExpense, updateExpense } from '@/app/actions/rab'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Trash2 } from 'lucide-react'

export function ExpenseActions({ expense }: { expense: any }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [amount, setAmount] = useState(expense.amount)
  const [description, setDescription] = useState(expense.description)
  const [isEditing, setIsEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Hapus pengeluaran ini?')) return
    setIsDeleting(true)
    try {
      await deleteExpense(expense.id)
    } catch (e) {
      alert('Gagal menghapus')
    }
    setIsDeleting(false)
  }

  const handleEdit = async (e: any) => {
    e.preventDefault()
    setIsEditing(true)
    try {
      await updateExpense(expense.id, { amount: Number(amount), description })
      setIsEditOpen(false)
    } catch (e) {
      alert('Gagal memperbarui')
    }
    setIsEditing(false)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
        <Pencil className="w-4 h-4 mr-1" /> Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
        <Trash2 className="w-4 h-4 mr-1" /> {isDeleting ? '...' : 'Hapus'}
      </Button>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Pengeluaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nominal</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isEditing}>{isEditing ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
