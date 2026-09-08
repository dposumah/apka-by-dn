import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LaporanClientForm } from "./client-form"
import { getTransportConfig } from "@/app/actions/transport-config"

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

  const config = await getTransportConfig()

  // Ambil tanggal-tanggal di mana fasilitator sudah mengklaim transport (Darat atau Laut)
  const existingReportsWithTransport = await prisma.laporanKegiatan.findMany({
    where: { 
      fasilitatorId: fasilitator.id,
      OR: [
        { biayaTransportDisetujui: { gt: 0 } },
        { biayaTransportLaut: { gt: 0 } }
      ]
    },
    select: { date: true }
  })

  const claimedTransportDates = existingReportsWithTransport.map((r: any) => {
    // Convert ke format YYYY-MM-DD sesuai dengan input type="date"
    const d = new Date(r.date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().substring(0, 10)
  })

  return (
    <LaporanClientForm 
      fasilitatorId={fasilitator.id} 
      jarakTempuhKm={fasilitator.jarakTempuhKm || 0} 
      config={config} 
      claimedTransportDates={claimedTransportDates}
    />
  )
}
