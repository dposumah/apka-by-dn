const fs = require('fs')

let path = 'src/app/(snt)/portal/profil/client-profil.tsx'
let code = fs.readFileSync(path, 'utf8')

// Add useSearchParams
code = code.replace(
  "import { useRouter } from 'next/navigation'",
  "import { useRouter, useSearchParams } from 'next/navigation'"
)

// Read searchParams and set initial isEditing
const targetInit = `export function ProfilClient({ fasilitator }: { fasilitator: any }) {
  const router = useRouter()
  
  const isIncomplete = !fasilitator.namaLengkap || !fasilitator.bankName || !fasilitator.bankAccount || !fasilitator.npwpNik || (fasilitator.statusKepegawaian === 'ASN' && !fasilitator.pangkatGolongan)
  const [isEditing, setIsEditing] = useState(isIncomplete)`

const replacementInit = `export function ProfilClient({ fasilitator }: { fasilitator: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldEdit = searchParams.get('edit') === 'true'
  
  const isIncomplete = !fasilitator.namaLengkap || !fasilitator.bankName || !fasilitator.bankAccount || !fasilitator.npwpNik || (fasilitator.statusKepegawaian === 'ASN' && !fasilitator.pangkatGolongan)
  const [isEditing, setIsEditing] = useState(isIncomplete || shouldEdit)`

code = code.replace(targetInit, replacementInit)

// Replace placeholders in Inputs
const addPlaceholder = (str, fieldName) => {
  return str.replace(
    new RegExp(`(<Label>${fieldName}</Label>[\\s\\S]*?<Input value=\\{formData\\.[a-zA-Z]+\\} onChange=\\{e => setFormData\\(\\{\\.\\.\\.formData, [a-zA-Z]+: e\\.target\\.value\\}\\)\\}) />`, 'g'),
    `$1 placeholder="Biarkan kosong jika tidak ada" />`
  )
}

code = addPlaceholder(code, 'NIP / NUPTK')
code = addPlaceholder(code, 'NIDN')
code = addPlaceholder(code, 'Instansi')
code = addPlaceholder(code, 'Jabatan')
code = addPlaceholder(code, 'Pendidikan Terakhir')
code = addPlaceholder(code, 'Kluster Keahlian')
code = addPlaceholder(code, 'Mata Pelajaran')
code = addPlaceholder(code, 'Kompetensi')
code = addPlaceholder(code, 'Sertifikasi')

// Show Batal button always
code = code.replace(
  `{!isIncomplete && <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>}`,
  `<Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>`
)

fs.writeFileSync(path, code)
