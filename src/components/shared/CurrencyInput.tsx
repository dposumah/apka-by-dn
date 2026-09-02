"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number
  onChange?: (value: number) => void
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("")

  React.useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatRupiah(value.toString()))
    }
  }, [value])

  const formatRupiah = (val: string) => {
    const numberString = val.replace(/[^,\d]/g, "").toString()
    const split = numberString.split(",")
    const sisa = split[0].length % 3
    let rupiah = split[0].substr(0, sisa)
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

    if (ribuan) {
      const separator = sisa ? "." : ""
      rupiah += separator + ribuan.join(".")
    }

    rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah
    return rupiah
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^,\d]/g, "")
    const formattedValue = formatRupiah(rawValue)
    
    setDisplayValue(formattedValue)
    
    if (onChange) {
      const numericValue = parseInt(rawValue.replace(/\./g, ""), 10)
      onChange(isNaN(numericValue) ? 0 : numericValue)
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-gray-500 sm:text-sm">Rp</span>
      </div>
      <Input
        type="text"
        className={cn("pl-9", className)}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}
