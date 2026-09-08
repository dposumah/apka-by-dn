"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateTransportConfig } from '@/app/actions/transport-config'
import { useRouter } from 'next/navigation'

export function TransportConfigClient({ config }: { config: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    rasioKonsumsiR2: config.rasioKonsumsiR2,
    rasioKonsumsiR4: config.rasioKonsumsiR4,
    kompensasiAkses: config.kompensasiAkses,
    hargaPertalite: config.hargaPertalite,
    hargaPertamax: config.hargaPertamax,
    hargaSolar: config.hargaSolar,
    hargaDexlite: config.hargaDexlite,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateTransportConfig({
        rasioKonsumsiR2: parseFloat(String(formData.rasioKonsumsiR2)),
        rasioKonsumsiR4: parseFloat(String(formData.rasioKonsumsiR4)),
        kompensasiAkses: parseFloat(String(formData.kompensasiAkses)),
        hargaPertalite: parseFloat(String(formData.hargaPertalite)),
        hargaPertamax: parseFloat(String(formData.hargaPertamax)),
        hargaSolar: parseFloat(String(formData.hargaSolar)),
        hargaDexlite: parseFloat(String(formData.hargaDexlite)),
      })
      router.refresh()
      alert('Konfigurasi transport berhasil disimpan!')
    } catch {
      alert('Gagal menyimpan konfigurasi')
    } finally {
      setSaving(false)
    }
  }

  const formatRp = (v: number) => new Intl.NumberFormat('id-ID').format(v)

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Konfigurasi Transport</h1>
        <p className="text-slate-500 mt-1">Atur parameter perhitungan biaya transport otomatis untuk seluruh fasilitator</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Harga BBM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⛽ Harga BBM per Liter</CardTitle>
            <CardDescription>Harga acuan resmi yang digunakan untuk kalkulasi plafon penggantian BBM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pertalite (Rp/liter)</Label>
                <Input type="number" min="0" value={formData.hargaPertalite} onChange={e => setFormData({...formData, hargaPertalite: parseFloat(e.target.value) || 0})} required />
                <p className="text-xs text-slate-400">Acuan: Rp {formatRp(10000)}</p>
              </div>
              <div className="space-y-2">
                <Label>Pertamax (Rp/liter)</Label>
                <Input type="number" min="0" value={formData.hargaPertamax} onChange={e => setFormData({...formData, hargaPertamax: parseFloat(e.target.value) || 0})} required />
                <p className="text-xs text-slate-400">Acuan: Rp {formatRp(16300)}</p>
              </div>
              <div className="space-y-2">
                <Label>Solar (Rp/liter)</Label>
                <Input type="number" min="0" value={formData.hargaSolar} onChange={e => setFormData({...formData, hargaSolar: parseFloat(e.target.value) || 0})} required />
                <p className="text-xs text-slate-400">Acuan: Rp {formatRp(6800)}</p>
              </div>
              <div className="space-y-2">
                <Label>Dexlite (Rp/liter)</Label>
                <Input type="number" min="0" value={formData.hargaDexlite} onChange={e => setFormData({...formData, hargaDexlite: parseFloat(e.target.value) || 0})} required />
                <p className="text-xs text-slate-400">Acuan: Rp {formatRp(24200)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rasio Konsumsi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚗 Rasio Konsumsi BBM</CardTitle>
            <CardDescription>Standar konsumsi kendaraan dalam kilometer per liter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roda 2 / Motor (km/liter)</Label>
                <Input type="number" min="1" step="0.1" value={formData.rasioKonsumsiR2} onChange={e => setFormData({...formData, rasioKonsumsiR2: parseFloat(e.target.value) || 35})} required />
                <p className="text-xs text-slate-400">Default: 35 km/liter</p>
              </div>
              <div className="space-y-2">
                <Label>Roda 4 / Mobil (km/liter)</Label>
                <Input type="number" min="1" step="0.1" value={formData.rasioKonsumsiR4} onChange={e => setFormData({...formData, rasioKonsumsiR4: parseFloat(e.target.value) || 10})} required />
                <p className="text-xs text-slate-400">Default: 10 km/liter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kompensasi Akses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📐 Kompensasi Akses</CardTitle>
            <CardDescription>Tambahan persentase jarak untuk memperhitungkan rute tidak lurus, kemacetan, dll</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label>Persentase Kompensasi (%)</Label>
              <Input type="number" min="0" max="50" step="1" value={formData.kompensasiAkses} onChange={e => setFormData({...formData, kompensasiAkses: parseFloat(e.target.value) || 0})} required />
              <p className="text-xs text-slate-400">Default: 10%. Jarak efektif = Jarak PP × (1 + {formData.kompensasiAkses}%)</p>
            </div>
          </CardContent>
        </Card>

        {/* Simulasi */}
        <Card className="bg-slate-50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">📊 Simulasi Kalkulasi</CardTitle>
            <CardDescription>Contoh: Jarak 30 KM sekali jalan, Roda 4, Pertalite</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const jarakPP = 30 * 2
              const jarakEfektif = jarakPP * (1 + formData.kompensasiAkses / 100)
              const volume = Math.round((jarakEfektif / formData.rasioKonsumsiR4) * 100) / 100
              const plafon = Math.ceil(volume * formData.hargaPertalite)
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Jarak PP</p>
                    <p className="font-bold text-lg">{jarakPP} KM</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Jarak Efektif (+{formData.kompensasiAkses}%)</p>
                    <p className="font-bold text-lg">{jarakEfektif.toFixed(1)} KM</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Volume BBM</p>
                    <p className="font-bold text-lg">{volume} Liter</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Plafon Maksimal</p>
                    <p className="font-bold text-lg text-emerald-600">Rp {formatRp(plafon)}</p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
