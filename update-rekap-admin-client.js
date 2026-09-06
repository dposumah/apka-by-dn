const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf8')

code = code.replace(
  "import { useState } from 'react'",
  "import { useState } from 'react'\nimport { adminGenerateInvoiceHonor } from '@/app/actions/rekap'\nimport { useRouter } from 'next/navigation'"
)

code = code.replace(
  "export function RekapHonorClient({ initialData }: { initialData: any[] }) {",
  "export function RekapHonorClient({ initialData }: { initialData: any[] }) {\n  const router = useRouter()\n  const [loadingId, setLoadingId] = useState<string | null>(null)"
)

const handleCetak = `  const handleCetakInvoice = async (rekap: any) => {
    try {
      setLoadingId(rekap.id)
      if (rekap.status === 'SUBMITTED') {
        await adminGenerateInvoiceHonor(rekap.id)
      }
      cetakInvoiceHonor(rekap)
      router.refresh()
    } catch (e) {
      alert('Gagal memproses invoice')
    } finally {
      setLoadingId(null)
    }
  }`

code = code.replace(
  "const cetakInvoiceHonor = (rekap: any) => {",
  `${handleCetak}\n\n  const cetakInvoiceHonor = (rekap: any) => {`
)

code = code.replace(
  "onClick={() => cetakInvoiceHonor(rekap)}",
  "onClick={() => handleCetakInvoice(rekap)}\n                          disabled={loadingId === rekap.id}"
)

code = code.replace(
  "Cetak Invoice Honor",
  "{loadingId === rekap.id ? 'Memproses...' : 'Buat Invoice & Cetak'}"
)

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', code)
