import * as React from "react"
import { SntHeader } from "./header"
import { SntLayoutClient } from "./layout-client"

export default function SntLayout({ children }: { children: React.ReactNode }) {
  return (
    <SntLayoutClient header={<SntHeader />}>
      {children}
    </SntLayoutClient>
  )
}
