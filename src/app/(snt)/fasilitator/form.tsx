'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createFasilitator, updateFasilitatorProfile } from '@/app/actions/rab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const PANGKAT_GOLONGAN = [
  'I/a (Juru Muda)', 'I/b (Juru Muda Tingkat I)', 'I/c (Juru)', 'I/d (Juru Tingkat I)',
  'II/a (Pengatur Muda)', 'II/b (Pengatur Muda Tingkat I)', 'II/c (Pengatur)', 'II/d (Pengatur Tingkat I)',
  'III/a (Penata Muda)', 'III/b (Penata Muda Tingkat I)', 'III/c (Penata)', 'III/d (Penata Tingkat I)',
  'IV/a (Pembina)', 'IV/b (Pembina Tingkat I)', 'IV/c (Pembina Utama Muda)', 'IV/d (Pembina Utama Madya)', 'IV/e (Pembina Utama)'
]

export function FasilitatorForm({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const [nip, setNip] = useState(initialData?.nipNuptk || '')
  const [statusKepegawaian, setStatusKepegawaian] = useState(initialData?.statusKepegawaian || 'Non-ASN')

  useEffect(() => {
    if (nip && nip.length >= 8) {
      setStatusKepegawaian('ASN')
    } else if (!nip && initialData?.statusKepegawaian !== 'ASN') {
      setStatusKepegawaian('Non-ASN')
    }
  }, [nip])

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
      statusKepegawaian: fd.get('statusKepegawaian'),
      pangkatGolongan: fd.get('pangkatGolongan'),
    }

    try {
      if (initialData?.id) {
        await updateFasilitatorProfile(initialData.id, payload)
        alert('Data berhasil diperbarui!')
        router.push('/fasilitator/' + initialData.id)
        router.refresh()
      } else {
        await createFasilitator(payload)
        alert('Fasilitator baru berhasil ditambahkan!')
        router.push('/fasilitator')
        router.refresh()
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
            <Input name="nipNuptk" value={nip} onChange={(e) => setNip(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status Kepegawaian</Label>
            <select 
              name="statusKepegawaian" 
              value={statusKepegawaian} 
              onChange={(e) => setStatusKepegawaian(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Non-ASN">Non-ASN</option>
              <option value="ASN">ASN</option>
              <option value="TNI/POLRI">TNI/POLRI</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          {statusKepegawaian === 'ASN' && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-100">
              <Label className="text-blue-900">Pangkat / Golongan ASN *</Label>
              <select 
                name="pangkatGolongan" 
                defaultValue={initialData?.pangkatGolongan || ''}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Pilih Pangkat/Golongan --</option>
                {PANGKAT_GOLONGAN.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
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
