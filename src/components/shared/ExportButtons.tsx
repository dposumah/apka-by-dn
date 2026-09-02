"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface ExportButtonsProps {
  onExportPdf?: () => void
  onExportExcel?: () => void
  onPrint?: () => void
}

export function ExportButtons({ onExportPdf, onExportExcel, onPrint }: ExportButtonsProps) {
  return (
    <div className="inline-flex items-center rounded-md border shadow-sm">
      {onExportPdf && (
        <Button
          variant="ghost"
          className="rounded-none rounded-l-md border-r px-3"
          onClick={onExportPdf}
        >
          📄 PDF
        </Button>
      )}
      {onExportExcel && (
        <Button
          variant="ghost"
          className="rounded-none border-r px-3"
          onClick={onExportExcel}
        >
          📊 Excel
        </Button>
      )}
      {onPrint && (
        <Button
          variant="ghost"
          className="rounded-none rounded-r-md px-3"
          onClick={onPrint}
        >
          🖨️ Cetak
        </Button>
      )}
    </div>
  )
}
