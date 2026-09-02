'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFasilitator, updateFasilitatorProfile } from '@/app/actions/rab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function FasilitatorForm({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    
    const payload = {
      namaLengkap: fd.get('namaLengkap'),
      jabatan: fd.get('jabatan'),
      instansi: fd.get('instansi'),
      nipNuptk: fd.get('nipNuptk'),
      nidn: fd.get('nidn'),
      pendidikan: fd.get('pendidikan'),
      klusterKeahlian: fd.get('klusterKeahlian'),
      mataPelajaran: fd.get('mataPelajaran'),
      kompetensi: fd.get('kompetensi'),
      sertifikasi: fd.get('sertifikasi'),
      alamat: fd.get('alamat'),
      kontak: fd.get('kontak'),
      email: fd.get('email'),
      bankName: fd.get('bankName'),
      bankAccount: fd.get('bankAccount'),
      npwpNik: fd.get('npwpNik'),
    }

    try {
      if (initialData?.id) {
        await updateFasilitatorProfile(initialData.id, payload)
        alert('Data berhasil diperbarui!')
        router.push('/fasilitator/' + initialData.id)
      } else {
        await createFasilitator(payload)
        alert('Fasilitator baru berhasil ditambahkan!')
        router.push('/fasilitator')
      }
    } catch(err) {
      alert('Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom 1 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lengkap & Gelar *</Label>
            <Input name="namaLengkap" defaultValue={initialData?.namaLengkap || ''} required />
          </div>
          <div className="space-y-2">
            <Label>Jabatan / Peran</Label>
            <Input name="jabatan" defaultValue={initialData?.jabatan || ''} />
          </div>
          <div className="space-y-2">
            <Label>Instansi / Unit Kerja</Label>
            <Input name="instansi" defaultValue={initialData?.instansi || ''} />
          </div>
          <div className="space-y-2">
            <Label>NIP / NUPTK</Label>
            <Input name="nipNuptk" defaultValue={initialData?.nipNuptk || ''} />
          </div>
          <div className="space-y-2">
            <Label>NIDN</Label>
            <Input name="nidn" defaultValue={initialData?.nidn || ''} />
          </div>
          <div className="space-y-2">
            <Label>Pendidikan Terakhir</Label>
            <Input name="pendidikan" defaultValue={initialData?.pendidikan || ''} />
          </div>
          <div className="space-y-2">
            <Label>Alamat / Domisili</Label>
            <Textarea name="alamat" defaultValue={initialData?.alamat || ''} />
          </div>
        </div>

        {/* Kolom 2 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kluster Keahlian</Label>
            <Input name="klusterKeahlian" defaultValue={initialData?.klusterKeahlian || ''} />
          </div>
          <div className="space-y-2">
            <Label>Mata Pelajaran / Kuliah Diampu</Label>
            <Input name="mataPelajaran" defaultValue={initialData?.mataPelajaran || ''} />
          </div>
          <div className="space-y-2">
            <Label>Kompetensi Utama</Label>
            <Textarea name="kompetensi" defaultValue={initialData?.kompetensi || ''} />
          </div>
          <div className="space-y-2">
            <Label>Sertifikasi & Penghargaan</Label>
            <Textarea name="sertifikasi" defaultValue={initialData?.sertifikasi || ''} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Kontak / HP</Label>
              <Input name="kontak" defaultValue={initialData?.kontak || ''} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={initialData?.email || ''} />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-md border space-y-4">
            <h3 className="font-semibold text-sm">Data Keuangan (Opsional)</h3>
            <div className="space-y-2">
              <Label>Bank</Label>
              <Input name="bankName" defaultValue={initialData?.bankName || ''} placeholder="BCA / Mandiri / BNI" />
            </div>
            <div className="space-y-2">
              <Label>Nomor Rekening</Label>
              <Input name="bankAccount" defaultValue={initialData?.bankAccount || ''} />
            </div>
            <div className="space-y-2">
              <Label>NPWP / NIK</Label>
              <Input name="npwpNik" defaultValue={initialData?.npwpNik || ''} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Data'}</Button>
      </div>
    </form>
  )
}
