import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfilClient } from "./client-profil"

export default async function ProfilPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const fasilitator = await prisma.fasilitator.findUnique({
    where: { userId: session.user.id }
  })

  if (!fasilitator) {
    return <div className="p-8">Akun Anda tidak tertaut dengan data Fasilitator.</div>
  }

  return <ProfilClient fasilitator={fasilitator} />
}
