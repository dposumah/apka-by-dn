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


// ==================== STARTER KIT 100 EXCEL PARSER ====================

export interface StarterKit100Item {
  urutan: number
  kategori: string
  no: string
  namaBarang: string
  qtyPerKit: number
  satuan: string
  volume: number
  hargaSatuanRAB: number
  totalRAB: number
  hargaSatuanReal: number
  totalReal: number
  vendor: string
  statusOrder: string
  kondisiCatatan: string
}

export interface StarterKit100VendorSummary {
  vendor: string
  itemsCount: number
  totalPagu: number
  totalReal: number
  status: string
  catatan?: string
}

export interface StarterKit100ParsedResult {
  isStarterKit100: boolean
  totalBiaya: number
  nilaiKontrakDPP: number
  pph22: number
  estimasiLaba: number
  margin: number
  items: StarterKit100Item[]
  vendorSummary: StarterKit100VendorSummary[]
}

/**
 * Parses Starter Kit 100 Excel workbook (e.g. v3.Belanja_Starter_Kit_IoT_100_kit.xlsx)
 */
export function parseStarterKit100Workbook(buffer: ArrayBuffer | Buffer): StarterKit100ParsedResult | null {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  
  // Find sheet: either "Belanja" or first sheet with matching headers
  let ws = wb.Sheets['Belanja']
  if (!ws) {
    for (const name of wb.SheetNames) {
      const s = wb.Sheets[name]
      const rows = XLSX.utils.sheet_to_json<any[]>(s, { header: 1 })
      const isBelanja = rows.some(r => 
        r && r.some((c: any) => typeof c === 'string' && (
          c.toLowerCase().includes('starter kit iot') || 
          c.toLowerCase().includes('iot core kit') ||
          c.toLowerCase().includes('belanja starter kit')
        ))
      )
      if (isBelanja) {
        ws = s
        break
      }
    }
  }

  if (!ws) return null

  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
  const rawItems: any[] = []
  let currentCategory = 'A. IoT CORE KIT'

  let dpp = 238550000
  let pph22Val = 3578250
  let totalBelanjaExcel = 0

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || []
    const col0 = String(row[0] || '').trim()
    const col1 = String(row[1] || '').trim()

    if (
      col0.startsWith('A.') || 
      col0.startsWith('B.') || 
      col0.startsWith('C.') || 
      col0.startsWith('D.') || 
      col0.includes('LOKASI') || 
      col0.includes('TAMBAHAN') ||
      col0.toUpperCase().includes('CORE KIT') ||
      col0.toUpperCase().includes('PERANGKAT PENDUKUNG') ||
      col0.toUpperCase().includes('KEMASAN')
    ) {
      currentCategory = col0
      continue
    }

    if (col1.toLowerCase().includes('nilai kontrak') || col0.toLowerCase().includes('nilai kontrak')) {
      if (typeof row[6] === 'number') dpp = row[6]
      continue
    }
    if (col1.toLowerCase().includes('pph 22') || col0.toLowerCase().includes('pph 22')) {
      if (typeof row[6] === 'number') pph22Val = Math.abs(row[6])
      continue
    }
    if (col1.toLowerCase().includes('total biaya belanja') || col0.toLowerCase().includes('total biaya belanja')) {
      if (typeof row[6] === 'number') totalBelanjaExcel = row[6]
      break
    }
    if (col1.toLowerCase().includes('rincian biaya per sumber') || col0.toLowerCase().includes('rincian biaya')) {
      break
    }

    const no = col0
    const item = col1
    const qtyPerKit = row[2]
    const satuan = row[3]
    const totalQty = row[4]
    const hargaSatuan = row[5]
    const total = row[6]
    const sumber = row[7]
    const status = row[8]
    const catatan = row[9]

    if (typeof total === 'number' && typeof hargaSatuan === 'number' && totalQty != null) {
      rawItems.push({
        kategori: currentCategory,
        no: no || '',
        item: item,
        qtyPerKit: qtyPerKit !== undefined && qtyPerKit !== '-' ? Number(qtyPerKit) || 1 : 1,
        satuan: satuan || 'pcs',
        totalQty: Number(totalQty) || 1,
        hargaSatuan: Number(hargaSatuan) || 0,
        total: Number(total) || 0,
        sumber: String(sumber || '–').trim(),
        status: String(status || 'Sudah order').trim(),
        catatan: String(catatan || '').trim()
      })
    }
  }

  if (rawItems.length === 0) return null

  // Fix split rows
  for (let i = 0; i < rawItems.length; i++) {
    if (!rawItems[i].item && i > 0) {
      rawItems[i].item = `${rawItems[i-1].item} (${rawItems[i].sumber})`
      rawItems[i].no = rawItems[i-1].no
      rawItems[i].satuan = rawItems[i-1].satuan
    }
  }

  const calculatedTotal = rawItems.reduce((sum, it) => sum + it.total, 0)
  const finalTotal = totalBelanjaExcel > 0 ? totalBelanjaExcel : calculatedTotal
  const finalLaba = dpp - pph22Val - finalTotal
  const margin = dpp > 0 ? (finalLaba / dpp) : 0

  // Build vendor summary from items
  const vendorMap = new Map<string, { count: number; total: number; status: string; notes: Set<string> }>()
  rawItems.forEach(it => {
    const v = it.sumber || 'Lain-lain'
    const cur = vendorMap.get(v) || { count: 0, total: 0, status: it.status, notes: new Set() }
    cur.count += 1
    cur.total += it.total
    if (it.catatan) cur.notes.add(it.catatan)
    vendorMap.set(v, cur)
  })

  const vendorSummary: StarterKit100VendorSummary[] = Array.from(vendorMap.entries()).map(([vendor, val]) => ({
    vendor,
    itemsCount: val.count,
    totalPagu: val.total,
    totalReal: val.total,
    status: val.status,
    catatan: Array.from(val.notes).slice(0, 2).join('; ')
  }))

  const dbItems: StarterKit100Item[] = rawItems.map((it, idx) => ({
    urutan: idx + 1,
    kategori: it.kategori,
    no: it.no,
    namaBarang: it.item,
    qtyPerKit: it.qtyPerKit,
    satuan: it.satuan,
    volume: it.totalQty,
    hargaSatuanRAB: it.hargaSatuan,
    totalRAB: it.total,
    hargaSatuanReal: it.hargaSatuan,
    totalReal: it.total,
    vendor: it.sumber,
    statusOrder: it.status,
    kondisiCatatan: it.catatan
  }))

  return {
    isStarterKit100: true,
    totalBiaya: finalTotal,
    nilaiKontrakDPP: dpp,
    pph22: pph22Val,
    estimasiLaba: finalLaba,
    margin,
    items: dbItems,
    vendorSummary
  }
}
