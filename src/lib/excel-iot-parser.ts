import * as XLSX from 'xlsx'

export interface IotExcelItemRow {
  no?: number
  namaBarang: string
  qtyDaftar?: string
  hargaDaftar?: number
  toko?: string
  qtyDibeli?: string
  hargaAktual: number
  selisih?: number
  statusCatatan?: string
  isExtra?: boolean
}

export interface IotExcelTokoSummary {
  toko: string
  platform: string
  tanggal: string
  total: number
  catatan: string
}

export interface ParsedIotExcelResult {
  title?: string
  lokasiSNT?: string
  totalPengeluaran: number
  totalAnggaranDaftar?: number
  selisihTotal?: number
  tokoList: IotExcelTokoSummary[]
  items: IotExcelItemRow[]
  catatanKeuangan: string[]
}

/**
 * Normalizes an item name for fuzzy comparison
 */
export function normalizeItemName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[–—\-]/g, '-')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Parses an IoT Excel workbook (such as Rekap_Pengeluaran_SNT5_Tidore.xlsx)
 */
export function parseIotExcelWorkbook(buffer: ArrayBuffer | Buffer): ParsedIotExcelResult {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  
  let result: ParsedIotExcelResult = {
    totalPengeluaran: 0,
    tokoList: [],
    items: [],
    catatanKeuangan: []
  }

  // 1. Process Sheet: "Ringkasan" if present
  const wsRingkasan = wb.Sheets['Ringkasan']
  if (wsRingkasan) {
    const rawRingkasan = XLSX.utils.sheet_to_json<any[]>(wsRingkasan, { header: 1 })
    
    if (rawRingkasan[0] && rawRingkasan[0][0]) {
      result.title = String(rawRingkasan[0][0])
      // Try to extract location e.g. "SNT 5 Tidore Kepulauan"
      const matchLoc = result.title.match(/SNT\s*\d*\s*[^–—\n]+/i)
      if (matchLoc) {
        result.lokasiSNT = matchLoc[0].trim()
      }
    }

    let isTokoTable = false
    let isCatatan = false

    for (let r = 0; r < rawRingkasan.length; r++) {
      const row = rawRingkasan[r]
      if (!row || row.length === 0) continue

      const firstCol = String(row[0] || '').trim()

      if (firstCol.toLowerCase() === 'toko' && String(row[1] || '').toLowerCase() === 'platform') {
        isTokoTable = true
        continue
      }

      if (isTokoTable) {
        if (firstCol.toLowerCase().startsWith('total pengeluaran')) {
          isTokoTable = false
          result.totalPengeluaran = Number(row[3]) || 0
          continue
        }

        if (row[0] && row[3]) {
          result.tokoList.push({
            toko: String(row[0] || '').trim(),
            platform: String(row[1] || '').trim(),
            tanggal: String(row[2] || '').trim(),
            total: Number(row[3]) || 0,
            catatan: String(row[4] || '').trim()
          })
        }
      }

      if (firstCol.toLowerCase().startsWith('anggaran di daftar')) {
        result.totalAnggaranDaftar = Number(row[3]) || 0
      } else if (firstCol.toLowerCase().startsWith('selisih')) {
        result.selisihTotal = Number(row[3]) || 0
      } else if (firstCol.toLowerCase().startsWith('catatan untuk keuangan')) {
        isCatatan = true
        continue
      } else if (isCatatan) {
        if (row[0]) {
          result.catatanKeuangan.push(String(row[0]).trim())
        }
      }
    }
  }

  // 2. Process Sheet: "Pencocokan Daftar" if present
  const wsPencocokan = wb.Sheets['Pencocokan Daftar']
  if (wsPencocokan) {
    const rawPencocokan = XLSX.utils.sheet_to_json<any[]>(wsPencocokan, { header: 1 })
    let isTable = false

    for (let r = 0; r < rawPencocokan.length; r++) {
      const row = rawPencocokan[r]
      if (!row || row.length === 0) continue

      const c0 = String(row[0] || '').trim()
      const c1 = String(row[1] || '').trim()

      if (c0.toLowerCase() === 'no' && c1.toLowerCase().includes('nama')) {
        isTable = true
        continue
      }

      if (isTable) {
        if (c1.toUpperCase() === 'TOTAL') {
          if (!result.totalPengeluaran && row[6]) {
            result.totalPengeluaran = Number(row[6]) || 0
          }
          break
        }

        const namaBarang = c1 || c0
        if (!namaBarang) continue

        const no = Number(row[0]) || undefined
        const qtyDaftar = row[2] != null ? String(row[2]).trim() : undefined
        const hargaDaftar = Number(row[3]) || 0
        const toko = row[4] ? String(row[4]).trim() : undefined
        const qtyDibeli = row[5] != null ? String(row[5]).trim() : undefined
        const hargaAktual = Number(row[6]) || 0
        const selisih = Number(row[7]) || 0
        const statusCatatan = row[8] ? String(row[8]).trim() : undefined

        const isExtra = namaBarang.toLowerCase().includes('tambahan') || 
                        namaBarang.toLowerCase().includes('ongkir') || 
                        namaBarang.toLowerCase().includes('layanan') ||
                        !no

        result.items.push({
          no,
          namaBarang,
          qtyDaftar,
          hargaDaftar,
          toko,
          qtyDibeli,
          hargaAktual,
          selisih,
          statusCatatan,
          isExtra
        })
      }
    }
  } else if (wb.Sheets['Rincian Nota']) {
    // Fallback to "Rincian Nota"
    const wsNota = wb.Sheets['Rincian Nota']
    const rawNota = XLSX.utils.sheet_to_json<any[]>(wsNota, { header: 1 })
    let isTable = false

    for (let r = 0; r < rawNota.length; r++) {
      const row = rawNota[r]
      if (!row || row.length === 0) continue

      if (String(row[0]).toLowerCase() === 'no' && String(row[4]).toLowerCase().includes('nama')) {
        isTable = true
        continue
      }

      if (isTable && row[4] && row[7]) {
        result.items.push({
          no: Number(row[0]) || undefined,
          namaBarang: String(row[4]).trim(),
          toko: row[2] ? String(row[2]).trim() : undefined,
          qtyDibeli: String(row[5] || '1').trim(),
          hargaAktual: Number(row[7]) || 0,
          statusCatatan: row[8] ? String(row[8]).trim() : undefined
        })
      }
    }
  }

  // If totalPengeluaran still 0, calculate sum of items
  if (!result.totalPengeluaran && result.items.length > 0) {
    result.totalPengeluaran = result.items.reduce((sum, it) => sum + (it.hargaAktual || 0), 0)
  }

  return result
}
