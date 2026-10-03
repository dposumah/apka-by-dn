import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SntAkunClient } from "./client"
import { getAppSetting } from "@/app/actions/rab"

export default async function SntAkunPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  if (session.user.role === 'FASILITATOR') {
    redirect("/portal")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    return <div className="p-8">Akun tidak ditemukan.</div>
  }

  const hargaPertamax = await getAppSetting('harga_pertamax', '13900');
  return <SntAkunClient user={user} hargaPertamax={hargaPertamax} />
}
