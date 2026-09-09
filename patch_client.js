const fs = require('fs');
const filePath = 'src/app/(snt)/snt-akun/client.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add import
code = code.replace(
  "import { updateAdminAccount, changeUserPassword } from '@/app/actions/user'",
  "import { updateAdminAccount, changeUserPassword, createKorwilUser } from '@/app/actions/user'"
);

// Add state
const stateCode = `
  const [newKorwilLoading, setNewKorwilLoading] = useState(false)
  const [newKorwilSuccess, setNewKorwilSuccess] = useState(false)
  const [newKorwilError, setNewKorwilError] = useState('')
  const [newKorwilData, setNewKorwilData] = useState({ name: '', email: '', password: '' })

  const handleNewKorwil = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewKorwilLoading(true)
    setNewKorwilSuccess(false)
    setNewKorwilError('')
    try {
      const res = await createKorwilUser(newKorwilData)
      if (res.error) throw new Error(res.error)
      setNewKorwilSuccess(true)
      setNewKorwilData({ name: '', email: '', password: '' })
    } catch (err: any) {
      setNewKorwilError(err.message || 'Gagal membuat akun')
    } finally {
      setNewKorwilLoading(false)
    }
  }
`;

code = code.replace(
  "const handleProfileSubmit = async (e: React.FormEvent) => {",
  stateCode + "\n  const handleProfileSubmit = async (e: React.FormEvent) => {"
);

// Add UI
const uiCode = `
      {user.role === 'ADMIN' && (
        <Card className="mt-6 border-blue-200">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="text-blue-800">Buat Akun Korwil (Hanya Akses SNT)</CardTitle>
            <CardDescription>Akun ini langsung diarahkan ke Dashboard SNT dan tidak bisa mengakses APKA Induk.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {newKorwilSuccess && (
              <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Berhasil!</AlertTitle>
                <AlertDescription>Akun Korwil baru telah dibuat dan bisa digunakan login.</AlertDescription>
              </Alert>
            )}
            {newKorwilError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{newKorwilError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleNewKorwil} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={newKorwilData.name} onChange={e => setNewKorwilData({...newKorwilData, name: e.target.value})} required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email (Username)</Label>
                <Input type="email" value={newKorwilData.email} onChange={e => setNewKorwilData({...newKorwilData, email: e.target.value})} required placeholder="korwil@jtrobotic.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newKorwilData.password} onChange={e => setNewKorwilData({...newKorwilData, password: e.target.value})} required placeholder="Sandi rahasia" />
              </div>
              <div className="md:col-span-3 flex justify-end mt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={newKorwilLoading}>
                  {newKorwilLoading ? 'Membuat Akun...' : 'Buat Akun Korwil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
`;

code = code.replace(
  "      </div>\n    </div>\n  )\n}",
  "      </div>\n" + uiCode + "\n    </div>\n  )\n}"
);

fs.writeFileSync(filePath, code);
console.log("Patched client.tsx");
