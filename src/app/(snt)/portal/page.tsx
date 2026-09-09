export const dynamic = 'force-dynamic';
﻿import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PortalClient } from "./client-page"

export default async function PortalPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Cari data fasilitator berdasarkan userId
  const fasilitator = await prisma.fasilitator.findUnique({
    where: { userId: session.user.id },
    include: {
      laporan: { orderBy: { date: 'desc' } },
      rekapHonorarium: true
    }
  })

  if (!fasilitator) {
    return <div className="p-8">Akun Anda tidak tertaut dengan data Fasilitator. Silakan hubungi Admin.</div>
  }

  const isIncomplete = !fasilitator.bankName || !fasilitator.bankAccount || !fasilitator.npwpNik

  return (
    <PortalClient 
      fasilitator={fasilitator} 
      isIncomplete={isIncomplete}
      userName={session.user.name || fasilitator.namaLengkap || 'Fasilitator'}
    />
  )
}
