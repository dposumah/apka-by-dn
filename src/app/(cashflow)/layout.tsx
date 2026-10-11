import * as React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { CashflowHeader } from "./header"
import { CashflowLayoutClient } from "./layout-client"

export default async function CashflowLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Hanya perbolehkan pengguna non-fasilitator (Admin/Accountant/Viewer)
  if (session.user.role === "FASILITATOR") {
    redirect("/portal")
  }

  return (
    <CashflowLayoutClient header={<CashflowHeader />}>
      {children}
    </CashflowLayoutClient>
  )
}
