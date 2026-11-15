import * as React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SntHeader } from "./header"
import { SntLayoutClient } from "./layout-client"

export default async function SntLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <SntLayoutClient header={<SntHeader />}>
      {children}
    </SntLayoutClient>
  )
}
