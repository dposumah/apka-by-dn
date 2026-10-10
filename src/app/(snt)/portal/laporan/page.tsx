import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LaporanClientForm } from "./client-form"
import { getAppSetting } from "@/app/actions/rab"

export default async function LaporanPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const fasilitator = await prisma.fasilitator.findUnique({
    where: { userId: session.user.id }
  })

  if (!fasilitator) {
    return <div className="p-8">Akses ditolak.</div>
  }

  // Cek kalau profil belum lengkap, tidak boleh buat laporan
  const isIncomplete = !fasilitator.bankName || !fasilitator.bankAccount || !fasilitator.npwpNik
  if (isIncomplete) {
    redirect("/portal")
  }

  const hargaBBMSetting = await getAppSetting('HARGA_PERTAMAX', '13900')
  const hargaPertamax = parseFloat(hargaBBMSetting) || 13900

  return (
    <LaporanClientForm 
      fasilitatorId={fasilitator.id} 
      besaranTransport={fasilitator.besaranTransport}
      jarakPPKm={fasilitator.jarakPPKm ?? 0}
      hargaPertamax={hargaPertamax}
      defaultJPIntra={fasilitator.defaultJPIntra}
      defaultJPEkstra={fasilitator.defaultJPEkstra}
      jenisTugas={fasilitator.jenisTugas}
    />
  )
}
