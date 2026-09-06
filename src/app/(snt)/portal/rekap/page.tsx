import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getAvailableMonths } from "@/app/actions/rekap"
import { RekapClientPage } from "./client-page"

export default async function PortalRekapPage() {
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

  const availableMonths = await getAvailableMonths(fasilitator.id)
  
  const rekapsData = await prisma.rekapHonorarium.findMany({
    where: { fasilitatorId: fasilitator.id },
    orderBy: { bulan: 'desc' },
    include: {
      laporan: true
    }
  })
  
  // Ambil ExpenseRequests untuk mengecek status pembayaran Honorarium
  const expenses = await prisma.expenseRequest.findMany({
    where: { fasilitatorId: fasilitator.id, receiptUrl: { in: rekapsData.map(r => r.filePdf).filter(Boolean) as string[] } }
  })
  
  const rekaps = rekapsData.map(r => {
    const expense = expenses.find(e => e.receiptUrl === r.filePdf)
    return { ...r, expense }
  })

  return (
    <RekapClientPage 
      fasilitator={fasilitator}
      availableMonths={availableMonths}
      rekaps={rekaps}
    />
  )
}
