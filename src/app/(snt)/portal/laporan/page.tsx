import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LaporanClientForm } from "./client-form"

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

  return <LaporanClientForm fasilitatorId={fasilitator.id} />
}
