"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onChange?: (range: { startDate: string; endDate: string }) => void
}

export function DateRangePicker({ startDate = "", endDate = "", onChange }: DateRangePickerProps) {
  const [start, setStart] = React.useState(startDate)
  const [end, setEnd] = React.useState(endDate)

  const handleApply = () => {
    onChange?.({ startDate: start, endDate: end })
  }

  const setPreset = (type: "bulan_ini" | "bulan_lalu" | "tahun_ini") => {
    const today = new Date()
    let newStart = ""
    let newEnd = ""

    if (type === "bulan_ini") {
      newStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      newEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
    } else if (type === "bulan_lalu") {
      newStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
      newEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
    } else if (type === "tahun_ini") {
      newStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
      newEnd = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0]
    }

    setStart(newStart)
    setEnd(newEnd)
    onChange?.({ startDate: newStart, endDate: newEnd })
  }

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0">
      <div className="grid gap-2">
        <Label>Tanggal Mulai</Label>
        <Input 
          type="date" 
          value={start} 
          onChange={(e) => setStart(e.target.value)} 
          className="w-[150px]"
        />
      </div>
      <div className="grid gap-2">
        <Label>Tanggal Akhir</Label>
        <Input 
          type="date" 
          value={end} 
          onChange={(e) => setEnd(e.target.value)}
          className="w-[150px]"
        />
      </div>
      <Button onClick={handleApply} variant="default">Terapkan</Button>
      
      <div className="flex items-center gap-2 border-l pl-4 ml-2">
        <Button variant="outline" size="sm" onClick={() => setPreset("bulan_ini")}>Bulan Ini</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset("bulan_lalu")}>Bulan Lalu</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset("tahun_ini")}>Tahun Ini</Button>
      </div>
    </div>
  )
}
