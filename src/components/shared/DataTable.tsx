"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "./EmptyState"

export interface ColumnDef<T> {
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Cari data...",
  loading = false,
  emptyMessage = "Data tidak ditemukan",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' })
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data
    return data.filter((item) =>
      Object.values(item as any).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  // Sort
  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData]
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [filteredData, sortConfig])

  // Paginate
  const paginatedData = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, page, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center justify-between">
          <div className="max-w-sm w-full">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead
                  key={index}
                  className={col.sortable ? "cursor-pointer select-none" : ""}
                  onClick={() => col.sortable && col.accessorKey && requestSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig.key === col.accessorKey && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? (row[col.accessorKey] as React.ReactNode)
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <EmptyState title="Tidak ada data" description={emptyMessage} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Tampilkan</span>
          <Select
            className="w-20 h-8"
            value={pageSize.toString()}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            options={[
              { label: "10", value: "10" },
              { label: "25", value: "25" },
              { label: "50", value: "50" },
            ]}
          />
          <span>data per halaman</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Sebelumnya
          </Button>
          <div className="text-sm font-medium">
            Halaman {page} dari {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  )
}
