const fs = require('fs');
let code = fs.readFileSync('src/app/(snt)/snt-akun/client.tsx', 'utf8');

// The replacement logic:
const newImports = `
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateAdminAccount, changeUserPassword, createKorwilUser } from '@/app/actions/user'
import { updateAppSetting, updateBulkFasilitatorTransportSettings } from '@/app/actions/rab'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

export function SntAkunClient({ user, hargaPertamax, facilitators = [] }: { user: any, hargaPertamax?: string, facilitators?: any[] }) {
`;

code = code.replace(
  /import \{ useState \} from 'react'[\s\S]*?export function SntAkunClient\(\{ user \}: \{ user: any \}\) \{/,
  newImports.trim()
);

const newStates = `
  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [passError, setPassError] = useState('')
  const [passData, setPassData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: '',
  })

  const [newKorwilLoading, setNewKorwilLoading] = useState(false)
  const [newKorwilSuccess, setNewKorwilSuccess] = useState(false)
  const [newKorwilError, setNewKorwilError] = useState('')
  const [newKorwilData, setNewKorwilData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [pertamaxLoading, setPertamaxLoading] = useState(false)
  const [pertamaxSuccess, setPertamaxSuccess] = useState(false)
  const [harga, setHarga] = useState(hargaPertamax || '13900')

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setPertamaxLoading(true)
    setPertamaxSuccess(false)
    try {
      await updateAppSetting('harga_pertamax', harga)
      setPertamaxSuccess(true)
      setTimeout(() => setPertamaxSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setPertamaxLoading(false)
    }
  }

  const [fasilList, setFasilList] = useState(facilitators.map(f => ({ ...f })))
  const [fasilLoading, setFasilLoading] = useState(false)
  const [fasilSuccess, setFasilSuccess] = useState(false)

  const handleFasilChange = (id: string, field: string, value: string) => {
    setFasilList(prev => prev.map(f => f.id === id ? { ...f, [field]: parseFloat(value) || 0 } : f))
  }

  const handleBulkFasilSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFasilLoading(true)
    setFasilSuccess(false)
    try {
      await updateBulkFasilitatorTransportSettings(fasilList.map(f => ({
        id: f.id,
        jarakPPKm: f.jarakPPKm,
        besaranTransport: f.besaranTransport
      })))
      setFasilSuccess(true)
      setTimeout(() => setFasilSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setFasilLoading(false)
    }
  }
`;

code = code.replace(
  /const \[passLoading, setPassLoading\] = useState\(false\)[\s\S]*?password: '',\s*\})/,
  newStates.trim()
);

const newUI = `
      {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
        <>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Global Transport</CardTitle>
                <CardDescription>Atur parameter perhitungan biaya transportasi fasilitator.</CardDescription>
              </CardHeader>
              <CardContent>
                {pertamaxSuccess && (
                  <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Berhasil!</AlertTitle>
                    <AlertDescription>Harga Pertamax telah diperbarui.</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="harga">Harga Pertamax per Liter (Rp)</Label>
                    <Input 
                      id="harga" 
                      type="number" 
                      min="1"
                      value={harga} 
                      onChange={e => setHarga(e.target.value)} 
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={pertamaxLoading}>
                    {pertamaxLoading ? 'Menyimpan...' : 'Simpan Harga'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Pengaturan Jarak & Plafon Fasilitator</CardTitle>
                <CardDescription>Sesuaikan nilai Jarak PP (KM) dan Batas Transport Darat (Rp) per fasilitator secara massal.</CardDescription>
              </CardHeader>
              <CardContent>
                {fasilSuccess && (
                  <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Berhasil!</AlertTitle>
                    <AlertDescription>Pengaturan jarak dan plafon fasilitator telah disimpan.</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleBulkFasilSubmit}>
                  <div className="overflow-x-auto max-h-[400px] border rounded-md">
                    <table className="w-full text-sm text-left text-slate-600 relative">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nama Fasilitator</th>
                          <th className="px-4 py-3 font-semibold">Lokasi SNT</th>
                          <th className="px-4 py-3 font-semibold w-32">Jarak PP (KM)</th>
                          <th className="px-4 py-3 font-semibold w-40">Batas Transport (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {fasilList.map(f => (
                          <tr key={f.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{f.namaLengkap}</td>
                            <td className="px-4 py-3">{f.lokasiSNT || '-'}</td>
                            <td className="px-4 py-2">
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                value={f.jarakPPKm || ''} 
                                onChange={(e) => handleFasilChange(f.id, 'jarakPPKm', e.target.value)} 
                                className="h-8"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input 
                                type="number" 
                                min="0" 
                                value={f.besaranTransport || ''} 
                                onChange={(e) => handleFasilChange(f.id, 'besaranTransport', e.target.value)} 
                                className="h-8"
                              />
                            </td>
                          </tr>
                        ))}
                        {fasilList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-slate-500">Belum ada data fasilitator aktif.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={fasilLoading}>
                      {fasilLoading ? 'Menyimpan...' : 'Simpan Perubahan Massal'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {user.role === 'ADMIN' && (
`;

code = code.replace(
  /\{user\.role === 'ADMIN' && \(/,
  newUI.trim()
);

fs.writeFileSync('src/app/(snt)/snt-akun/client.tsx', code);
console.log('Successfully fully rewrote client.tsx');
