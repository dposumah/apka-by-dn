const fs = require('fs');

let client = fs.readFileSync('src/app/(snt)/snt-akun/client.tsx', 'utf8');

if (!client.includes('hargaPertamax')) {
  client = client.replace(
    /export function SntAkunClient\(\{ user \}: \{ user: any \}\) \{/,
    'export function SntAkunClient({ user, hargaPertamax }: { user: any, hargaPertamax?: string }) {'
  );
  
  client = client.replace(
    /import \{ updateAdminAccount, changeUserPassword, createKorwilUser \} from '@\/app\/actions\/user'/,
    "import { updateAdminAccount, changeUserPassword, createKorwilUser } from '@/app/actions/user'\nimport { updateAppSetting } from '@/app/actions/rab'"
  );
  
  const settingsState = `
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
`;

  client = client.replace(
    /const \[passSuccess, setPassSuccess\] = useState\(false\)/,
    `const [passSuccess, setPassSuccess] = useState(false)\n${settingsState}`
  );
  
  const settingsCard = `
        {user.role === 'SUPER_ADMIN' && (
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
        )}
`;

  client = client.replace(
    /<\/div>\s*\{user\.role === 'SUPER_ADMIN' && \(/,
    `</div>${settingsCard}{user.role === 'SUPER_ADMIN' && (`
  );

  fs.writeFileSync('src/app/(snt)/snt-akun/client.tsx', client);
}
console.log('Fixed snt-akun client');
