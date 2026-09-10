'use client'

import { useState } from 'react'
import { updateFasilitatorBank } from '@/app/actions/rab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useModal } from '@/components/modal-provider';

export function BankForm({ fasilitator }: { fasilitator: any }) {
  const { confirm, alert } = useModal();

  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await updateFasilitatorBank(
        fasilitator.id, 
        String(fd.get('bankName')), 
        String(fd.get('bankAccount')), 
        String(fd.get('npwpNik'))
      )
      await alert('Data keuangan berhasil diperbarui!')
    } catch(err) {
      await alert('Gagal mengupdate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Bank</Label>
        <Input name="bankName" defaultValue={fasilitator.bankName || ''} placeholder="Contoh: BNI, Mandiri, BCA..." required />
      </div>
      <div className="space-y-2">
        <Label>Nomor Rekening</Label>
        <Input name="bankAccount" defaultValue={fasilitator.bankAccount || ''} placeholder="Nomor rekening valid" required />
      </div>
      <div className="space-y-2">
        <Label>NPWP / NIK (Untuk Pajak Honor)</Label>
        <Input name="npwpNik" defaultValue={fasilitator.npwpNik || ''} placeholder="Masukkan NPWP atau NIK" required />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Data Keuangan'}</Button>
    </form>
  )
}
