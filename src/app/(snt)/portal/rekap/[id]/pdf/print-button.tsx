"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <div className="mt-8 text-center print:hidden">
      <button 
        onClick={() => window.print()} 
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
      >
        <Printer className="w-4 h-4" /> Cetak / Simpan sebagai PDF
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Tip: Saat dialog print muncul, pilih "Save as PDF" di bagian Destination.
      </p>
    </div>
  )
}
