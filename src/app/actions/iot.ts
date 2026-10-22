"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkAuth } from '@/lib/auth-check'
import { DEFAULT_51_IOT_ITEMS, STANDARD_8_KELOMPOK } from '@/lib/iot-constants'
import { parseIotExcelWorkbook, normalizeItemName } from '@/lib/excel-iot-parser'

/**
 * Determines next category name letter for SNT
 * e.g. D. Biaya IoT - SNT 5 Kupang
 *      E. Biaya IoT - SNT 5 Tidore Kepulauan
 *      F. Biaya IoT - SNT ...
 */
async function getNextCategoryNameForSNT(lokasiSNT: string, projectId: string): Promise<string> {
  const locLower = lokasiSNT.toLowerCase()
  if (locLower.includes('kupang')) {
    return `D. Biaya IoT - ${lokasiSNT}`
  }
  if (locLower.includes('tidore')) {
    return `E. Biaya IoT - ${lokasiSNT}`
  }

  // Cari kategori yang sudah ada untuk menentukan huruf berikutnya
  const existingCats = await prisma.rabCategory.findMany({
    where: { projectId },
    select: { name: true }
  })

  const letters = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
  const usedLetters = new Set<string>()

  for (const c of existingCats) {
    const m = c.name.match(/^([A-Z])\./)
    if (m) usedLetters.add(m[1])
  }

  let chosenLetter = 'F'
  for (const l of letters) {
    if (!usedLetters.has(l)) {
      chosenLetter = l
      break
    }
  }

  return `${chosenLetter}. Biaya IoT - ${lokasiSNT}`
}

/**
 * Helper to sync PaketPengadaanIoT to its dedicated RabCategory with 8 kelompok belanja + cadangan
 */
async function syncPaketToRabCategory(paketId: string, userId?: string) {
  const paket = await prisma.paketPengadaanIoT.findUnique({
    where: { id: paketId },
    include: {
      items: { orderBy: { urutan: 'asc' } },
      rabCategory: {
        include: {
          items: {
            include: { expenses: true }
          }
        }
      }
    }
  })

  if (!paket) return null

  // Dapatkan Project RAB default
  const project = await prisma.rabProject.findFirst()
  if (!project) throw new Error("Proyek RAB tidak ditemukan")

  let category = paket.rabCategory

  // Jika belum ada RabCategory khusus, buat atau hubungkan
  if (!category) {
    const locLower = paket.lokasiSNT.toLowerCase()
    // Coba cari kategori yang namanya cocok
    let existingCat = await prisma.rabCategory.findFirst({
      where: {
        projectId: project.id,
        OR: [
          { name: { contains: paket.lokasiSNT, mode: 'insensitive' } },
          locLower.includes('kupang') ? { name: { contains: 'Kupang', mode: 'insensitive' } } : {},
          locLower.includes('tidore') ? { name: { contains: 'Tidore', mode: 'insensitive' } } : {}
        ]
      },
      include: {
        items: { include: { expenses: true } }
      }
    })

    if (!existingCat) {
      const catName = await getNextCategoryNameForSNT(paket.lokasiSNT, project.id)
      existingCat = await prisma.rabCategory.create({
        data: {
          projectId: project.id,
          name: catName
        },
        include: {
          items: { include: { expenses: true } }
        }
      })
    } else {
      // Pastikan nama seragam format "[Huruf]. Biaya IoT - [Lokasi]"
      let prefix = locLower.includes('kupang') ? 'D' : (locLower.includes('tidore') ? 'E' : '')
      if (prefix && !existingCat.name.startsWith(`${prefix}.`)) {
        await prisma.rabCategory.update({
          where: { id: existingCat.id },
          data: { name: `${prefix}. Biaya IoT - ${paket.lokasiSNT}` }
        })
      }
    }

    category = existingCat
    await prisma.paketPengadaanIoT.update({
      where: { id: paketId },
      data: { rabCategoryId: existingCat.id }
    })
  }

  // Hitung pagu dan realisasi per kelompok
  const groupTotals: Record<string, { pagu: number; real: number; count: number }> = {}
  for (const g of STANDARD_8_KELOMPOK) {
    groupTotals[g] = { pagu: 0, real: 0, count: 0 }
  }

  let extraRealSum = 0

  for (const item of paket.items) {
    const cat = item.kategori.trim()
    const matchingGroup = STANDARD_8_KELOMPOK.find(g => g.toLowerCase() === cat.toLowerCase())

    if (matchingGroup) {
      groupTotals[matchingGroup].pagu += item.totalRAB || (item.volume * item.hargaSatuanRAB)
      groupTotals[matchingGroup].real += item.totalReal || (item.volume * item.hargaSatuanReal)
      groupTotals[matchingGroup].count += 1
    } else {
      // Extra/Tambahan masuk ke Komponen Tambahan atau Cadangan
      if (cat.toLowerCase().includes('ongkir') || cat.toLowerCase().includes('layanan') || cat.toLowerCase().includes('cadangan')) {
        extraRealSum += item.totalReal || (item.volume * item.hargaSatuanReal)
      } else {
        groupTotals['Komponen Tambahan'].pagu += item.totalRAB || (item.volume * item.hargaSatuanRAB)
        groupTotals['Komponen Tambahan'].real += item.totalReal || (item.volume * item.hargaSatuanReal)
        groupTotals['Komponen Tambahan'].count += 1
      }
    }
  }

  const subtotalRencana = Object.values(groupTotals).reduce((sum, g) => sum + g.pagu, 0)
  const persenCadangan = paket.persenCadangan || 10
  const nominalCadangan = Math.round(subtotalRencana * (persenCadangan / 100))
  const totalPaguRAB = subtotalRencana + nominalCadangan

  // Dapatkan user untuk ExpenseRequest
  let creatorId = userId
  if (!creatorId) {
    const firstAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    creatorId = firstAdmin?.id || (await prisma.user.findFirst())?.id
  }

  // 1. Sinkronkan 8 Pos Kelompok Belanja
  for (let idx = 0; idx < STANDARD_8_KELOMPOK.length; idx++) {
    const groupName = STANDARD_8_KELOMPOK[idx]
    const code = (idx + 1).toString()
    const stat = groupTotals[groupName]

    let rabItem = category.items.find(it => it.code === code || it.name.toLowerCase().includes(groupName.toLowerCase()))

    if (rabItem) {
      rabItem = await prisma.rabItem.update({
        where: { id: rabItem.id },
        data: {
          name: groupName,
          code,
          totalBudget: stat.pagu,
          volume: `${stat.count} item`
        },
        include: { expenses: true }
      })
    } else {
      rabItem = await prisma.rabItem.create({
        data: {
          categoryId: category.id,
          code,
          name: groupName,
          totalBudget: stat.pagu,
          volume: `${stat.count} item`
        },
        include: { expenses: true }
      })
    }

    // Dapatkan URL nota untuk expense (dukung format single URL maupun JSON array multi-file)
    let receiptUrlForExpense = paket.lampiranNotaUrl || null
    if (receiptUrlForExpense && receiptUrlForExpense.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(receiptUrlForExpense)
        if (Array.isArray(parsed) && parsed.length > 0) {
          receiptUrlForExpense = parsed[0].url
        }
      } catch (e) {}
    }

    // Sinkronkan ExpenseRequest untuk kelompok ini (hanya jika bukan transaksi manual pengguna yang memiliki nota/multi-transaksi)
    const hasManualExpenses = rabItem.expenses && (
      rabItem.expenses.length > 1 || 
      rabItem.expenses.some(e => e.receiptUrl && !e.description.startsWith('Belanja '))
    )
    if (creatorId && stat.real > 0 && !hasManualExpenses) {
      const existingExpense = rabItem.expenses?.[0]
      if (existingExpense) {
        await prisma.expenseRequest.update({
          where: { id: existingExpense.id },
          data: {
            amount: stat.real,
            description: `Belanja ${groupName} (${paket.lokasiSNT})`,
            date: paket.tanggalSurat || new Date(),
            receiptUrl: receiptUrlForExpense || existingExpense.receiptUrl
          }
        })
      } else {
        await prisma.expenseRequest.create({
          data: {
            rabItemId: rabItem.id,
            amount: stat.real,
            description: `Belanja ${groupName} (${paket.lokasiSNT})`,
            status: 'APPROVED',
            date: paket.tanggalSurat || new Date(),
            receiptUrl: receiptUrlForExpense,
            createdById: creatorId,
            fasilitatorId: paket.fasilitatorId || null
          }
        })
      }
    }
  }

  // 2. Pos ke-9: Cadangan 10% / Ongkir & Biaya Layanan
  const cadanganName = 'Cadangan 10% / Ongkir & Layanan'
  let cadanganItem = category.items.find(it => it.code === '9' || it.name.toLowerCase().includes('cadangan'))
  if (cadanganItem) {
    cadanganItem = await prisma.rabItem.update({
      where: { id: cadanganItem.id },
      data: {
        code: '9',
        name: cadanganName,
        totalBudget: nominalCadangan,
        volume: '10%'
      },
      include: { expenses: true }
    })
  } else {
    cadanganItem = await prisma.rabItem.create({
      data: {
        categoryId: category.id,
        code: '9',
        name: cadanganName,
        totalBudget: nominalCadangan,
        volume: '10%'
      },
      include: { expenses: true }
    })
  }

  // Jika ada extra belanja ongkir/layanan atau selisih, catat ke pos cadangan
  if (creatorId && extraRealSum > 0) {
    const existingExpense = cadanganItem.expenses?.[0]
    if (existingExpense) {
      await prisma.expenseRequest.update({
        where: { id: existingExpense.id },
        data: {
          amount: extraRealSum,
          description: `Biaya Ongkir/Layanan Belanja IoT (${paket.lokasiSNT})`,
          date: paket.tanggalSurat || new Date(),
          receiptUrl: receiptUrlForExpense || existingExpense.receiptUrl
        }
      })
    } else {
      await prisma.expenseRequest.create({
        data: {
          rabItemId: cadanganItem.id,
          amount: extraRealSum,
          description: `Biaya Ongkir/Layanan Belanja IoT (${paket.lokasiSNT})`,
          status: 'APPROVED',
          date: paket.tanggalSurat || new Date(),
          receiptUrl: receiptUrlForExpense,
          createdById: creatorId,
          fasilitatorId: paket.fasilitatorId || null
        }
      })
    }
  }

  const totalRealisasi = Object.values(groupTotals).reduce((sum, g) => sum + g.real, 0) + extraRealSum

  // Update metrik paket
  await prisma.paketPengadaanIoT.update({
    where: { id: paketId },
    data: {
      subtotalRencana,
      nominalCadangan,
      totalPaguRAB,
      totalRealisasi
    }
  })

  return { success: true, totalPaguRAB, totalRealisasi }
}

// ==================== QUERY PAKET IOT ====================

export async function getPaketIoTList() {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return []

  const count = await prisma.paketPengadaanIoT.count()
  if (count === 0) {
    await migrateAndSeedSntCategories()
  }

  return prisma.paketPengadaanIoT.findMany({
    include: {
      fasilitator: true,
      rabCategory: {
        include: {
          items: {
            include: {
              expenses: true
            }
          }
        }
      },
      items: {
        orderBy: { urutan: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPaketIoTDetail(id: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return null

  return prisma.paketPengadaanIoT.findUnique({
    where: { id },
    include: {
      fasilitator: true,
      rabCategory: {
        include: {
          items: {
            include: {
              expenses: true
            }
          }
        }
      },
      items: {
        orderBy: { urutan: 'asc' }
      }
    }
  })
}

// ==================== CREATE PAKET IOT ====================

export async function createPaketIoT(data: {
  lokasiSNT: string
  namaPaket: string
  lingkupProyek?: string
  nomorSurat?: string
  tanggalSurat?: string
  fasilitatorId?: string
  mengetahuiNama?: string
  mengetahuiNip?: string
  mengetahuiJabatan?: string
  persenCadangan?: number
  catatan?: string
  loadDefaultTemplate?: boolean
}) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return { error: authError }

  try {
    const project = await prisma.rabProject.findFirst()
    if (!project) throw new Error("RAB Project belum dibuat")

    // Tentukan nama Kategori RAB Mandiri untuk SNT ini
    const catName = await getNextCategoryNameForSNT(data.lokasiSNT, project.id)
    const rabCategory = await prisma.rabCategory.create({
      data: {
        projectId: project.id,
        name: catName
      }
    })

    // Fasilitator info
    let fasilData: any = null
    if (data.fasilitatorId) {
      fasilData = await prisma.fasilitator.findUnique({
        where: { id: data.fasilitatorId }
      })
    }

    const templateItems = data.loadDefaultTemplate !== false ? DEFAULT_51_IOT_ITEMS : []
    const subtotalRencana = templateItems.reduce((acc, it) => acc + (it.volume * it.hargaSatuanRAB), 0)
    const persenCadangan = data.persenCadangan !== undefined ? data.persenCadangan : 10
    const nominalCadangan = Math.round(subtotalRencana * (persenCadangan / 100))
    const totalPaguRAB = subtotalRencana + nominalCadangan
    const totalRealisasi = templateItems.reduce((acc, it) => acc + (it.volume * it.hargaSatuanReal), 0)

    // Buat Paket IoT
    const paket = await prisma.paketPengadaanIoT.create({
      data: {
        lokasiSNT: data.lokasiSNT,
        namaPaket: data.namaPaket || `Pengadaan Alat dan Bahan Robotika - ${data.lokasiSNT}`,
        lingkupProyek: data.lingkupProyek || 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
        nomorSurat: data.nomorSurat || `……/RE/SNT-K2/X/${new Date().getFullYear()}`,
        tanggalSurat: data.tanggalSurat ? new Date(data.tanggalSurat) : new Date(),
        fasilitatorId: data.fasilitatorId || null,
        pihakKeduaNama: fasilData?.namaLengkap || '',
        pihakKeduaSekolah: data.lokasiSNT,
        pihakKeduaAlamat: fasilData ? `${fasilData.alamat || ''}, ${fasilData.kabKota || ''}, ${fasilData.propinsi || ''}`.replace(/^[\s,]+|[\s,]+$/g, '') : '',
        mengetahuiNama: data.mengetahuiNama || '',
        mengetahuiNip: data.mengetahuiNip || '',
        mengetahuiJabatan: data.mengetahuiJabatan || 'Kepala SNT',
        subtotalRencana,
        persenCadangan,
        nominalCadangan,
        totalPaguRAB,
        totalRealisasi,
        status: 'DRAFT',
        catatan: data.catatan || null,
        rabCategoryId: rabCategory.id,
        items: {
          create: templateItems.map((it, idx) => ({
            kategori: it.kategori,
            namaBarang: it.namaBarang,
            satuan: it.satuan,
            volume: it.volume,
            hargaSatuanRAB: it.hargaSatuanRAB,
            totalRAB: it.volume * it.hargaSatuanRAB,
            hargaSatuanReal: it.hargaSatuanReal,
            totalReal: it.volume * it.hargaSatuanReal,
            kemasan: it.kemasan,
            diterima: it.diterima,
            kondisiCatatan: it.kondisiCatatan,
            urutan: idx + 1
          }))
        }
      }
    })

    // Sinkronkan 8 kelompok belanja ke RabCategory yang baru dibuat
    await syncPaketToRabCategory(paket.id, session?.user?.id)

    revalidatePath('/alat-bahan-iot')
    revalidatePath('/dashboard-rab')
    return { success: true, paket }
  } catch (err: any) {
    console.error('Error createPaketIoT:', err)
    return { error: err.message || 'Gagal membuat paket IoT' }
  }
}

// ==================== UPDATE PAKET IOT ====================

export async function updatePaketIoT(id: string, data: any, items?: any[]) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return { error: authError }

  try {
    const existing = await prisma.paketPengadaanIoT.findUnique({
      where: { id },
      include: { rabCategory: true }
    })
    if (!existing) return { error: 'Paket IoT tidak ditemukan' }

    // Jika items disediakan, perbarui daftar item
    if (items && Array.isArray(items)) {
      await prisma.itemPengadaanIoT.deleteMany({
        where: { paketId: id }
      })

      await prisma.itemPengadaanIoT.createMany({
        data: items.map((it: any, idx: number) => ({
          paketId: id,
          kategori: it.kategori || 'Komponen Tambahan',
          namaBarang: it.namaBarang || 'Item',
          satuan: it.satuan || 'Unit',
          volume: Number(it.volume) || 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          totalRAB: (Number(it.volume) || 1) * (Number(it.hargaSatuanRAB) || 0),
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          totalReal: (Number(it.volume) || 1) * (Number(it.hargaSatuanReal) || 0),
          kemasan: it.kemasan || '–',
          diterima: it.diterima !== undefined ? Boolean(it.diterima) : true,
          kondisiCatatan: it.kondisiCatatan || '',
          urutan: idx + 1
        }))
      })
    }

    // Update metadata paket
    const updated = await prisma.paketPengadaanIoT.update({
      where: { id },
      data: {
        lokasiSNT: data.lokasiSNT !== undefined ? data.lokasiSNT : existing.lokasiSNT,
        namaPaket: data.namaPaket !== undefined ? data.namaPaket : existing.namaPaket,
        lingkupProyek: data.lingkupProyek !== undefined ? data.lingkupProyek : existing.lingkupProyek,
        nomorSurat: data.nomorSurat !== undefined ? data.nomorSurat : existing.nomorSurat,
        tanggalSurat: data.tanggalSurat ? new Date(data.tanggalSurat) : existing.tanggalSurat,
        pihakPertamaNama: data.pihakPertamaNama !== undefined ? data.pihakPertamaNama : existing.pihakPertamaNama,
        pihakPertamaJabatan: data.pihakPertamaJabatan !== undefined ? data.pihakPertamaJabatan : existing.pihakPertamaJabatan,
        pihakPertamaInstansi: data.pihakPertamaInstansi !== undefined ? data.pihakPertamaInstansi : existing.pihakPertamaInstansi,
        fasilitatorId: data.fasilitatorId !== undefined ? data.fasilitatorId : existing.fasilitatorId,
        pihakKeduaNama: data.pihakKeduaNama !== undefined ? data.pihakKeduaNama : existing.pihakKeduaNama,
        pihakKeduaJabatan: data.pihakKeduaJabatan !== undefined ? data.pihakKeduaJabatan : existing.pihakKeduaJabatan,
        pihakKeduaSekolah: data.pihakKeduaSekolah !== undefined ? data.pihakKeduaSekolah : existing.pihakKeduaSekolah,
        pihakKeduaAlamat: data.pihakKeduaAlamat !== undefined ? data.pihakKeduaAlamat : existing.pihakKeduaAlamat,
        mengetahuiNama: data.mengetahuiNama !== undefined ? data.mengetahuiNama : existing.mengetahuiNama,
        mengetahuiNip: data.mengetahuiNip !== undefined ? data.mengetahuiNip : existing.mengetahuiNip,
        mengetahuiJabatan: data.mengetahuiJabatan !== undefined ? data.mengetahuiJabatan : existing.mengetahuiJabatan,
        persenCadangan: data.persenCadangan !== undefined ? Number(data.persenCadangan) : existing.persenCadangan,
        status: data.status !== undefined ? data.status : existing.status,
        catatan: data.catatan !== undefined ? data.catatan : existing.catatan,
        lampiranNotaUrl: data.lampiranNotaUrl !== undefined ? data.lampiranNotaUrl : existing.lampiranNotaUrl
      }
    })

    // Sinkronkan ke RabCategory dan 8 kelompok belanja
    await syncPaketToRabCategory(id, session?.user?.id)

    revalidatePath('/alat-bahan-iot')
    revalidatePath('/alat-bahan-iot/' + id)
    revalidatePath('/dashboard-rab')
    return { success: true, updated }
  } catch (err: any) {
    console.error('Error updatePaketIoT:', err)
    return { error: err.message || 'Gagal memperbarui paket IoT' }
  }
}

// ==================== AUTO-SET REALISASI DARI TOTAL BELANJA ====================

export async function autoSetPaketRealisasi(paketId: string, totalBelanja: number) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return { error: authError }

  try {
    const paket = await prisma.paketPengadaanIoT.findUnique({
      where: { id: paketId },
      include: { items: { orderBy: { urutan: 'asc' } } }
    })
    if (!paket) return { error: 'Paket tidak ditemukan' }

    if (totalBelanja <= 0) return { error: 'Nominal total belanja harus lebih dari 0' }

    // Hitung total harga satuan standar bawaan
    const standardSum = paket.items.reduce((sum, it) => sum + (it.volume * (it.hargaSatuanRAB || 1)), 0)
    const ratio = totalBelanja / (standardSum || 1)

    // Update setiap item secara proporsional mendekati totalBelanja menggunakan batch transaction (<1 detik)
    const updates = []
    let allocated = 0
    for (let i = 0; i < paket.items.length; i++) {
      const it = paket.items[i]
      const isLast = i === paket.items.length - 1

      let itemReal = 0
      if (!isLast) {
        itemReal = Math.round((it.volume * (it.hargaSatuanRAB || 1)) * ratio)
        allocated += itemReal
      } else {
        itemReal = totalBelanja - allocated
      }

      const unitReal = Math.round(itemReal / (it.volume || 1))

      updates.push(
        prisma.itemPengadaanIoT.update({
          where: { id: it.id },
          data: {
            hargaSatuanReal: unitReal,
            totalReal: itemReal,
            diterima: true,
            kondisiCatatan: ''
          }
        })
      )
    }

    // Jalankan seluruh 50+ update dalam 1 transaksi cepat
    await prisma.$transaction(updates)

    // Update totalRealisasi di paket
    await prisma.paketPengadaanIoT.update({
      where: { id: paketId },
      data: { totalRealisasi: totalBelanja }
    })

    // Sinkronkan ke Kategori RAB
    await syncPaketToRabCategory(paketId, session?.user?.id)

    revalidatePath('/alat-bahan-iot/' + paketId)
    revalidatePath('/alat-bahan-iot')
    revalidatePath('/dashboard-rab')

    return { success: true, totalRealisasi: totalBelanja }
  } catch (err: any) {
    console.error('Error autoSetPaketRealisasi:', err)
    return { error: err.message || 'Gagal auto-set realisasi' }
  }
}

// ==================== IMPORT EXCEL REKAP REALISASI ====================

export async function importExcelPaketIoT(paketId: string, base64Data: string) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return { error: authError }

  try {
    const paket = await prisma.paketPengadaanIoT.findUnique({
      where: { id: paketId },
      include: { items: { orderBy: { urutan: 'asc' } } }
    })
    if (!paket) return { error: 'Paket tidak ditemukan' }

    const buffer = Buffer.from(base64Data, 'base64')
    const parsed = parseIotExcelWorkbook(buffer)

    if (!parsed.items || parsed.items.length === 0) {
      return { error: 'Tidak ditemukan data rincian barang pada file Excel ini' }
    }

    // Cocokkan item dari Excel ke item di database
    const existingItems = [...paket.items]
    const updatedItemIds = new Set<string>()
    const batchOps = []

    for (const excelItem of parsed.items) {
      if (excelItem.isExtra || !excelItem.namaBarang) continue

      const normName = normalizeItemName(excelItem.namaBarang)
      // Cari kecocokan nama
      const matched = existingItems.find(it => {
        const dbNorm = normalizeItemName(it.namaBarang)
        return dbNorm === normName || dbNorm.includes(normName) || normName.includes(dbNorm)
      })

      if (matched && !updatedItemIds.has(matched.id)) {
        updatedItemIds.add(matched.id)

        // Parse volume jika ada
        let vol = matched.volume
        if (excelItem.qtyDibeli) {
          const numMatch = excelItem.qtyDibeli.match(/(\d+(\.\d+)?)/)
          if (numMatch) vol = parseFloat(numMatch[1])
        }

        const hargaAktual = excelItem.hargaAktual || 0
        const unitReal = vol > 0 ? Math.round(hargaAktual / vol) : hargaAktual

        batchOps.push(
          prisma.itemPengadaanIoT.update({
            where: { id: matched.id },
            data: {
              volume: vol,
              hargaSatuanReal: unitReal,
              totalReal: hargaAktual,
              kondisiCatatan: '',
              diterima: true
            }
          })
        )
      }
    }

    // Tambahkan item tambahan (seperti Gland cable PG11 atau Ongkir Shopee)
    const extraItems = parsed.items.filter(it => it.isExtra)
    let nextUrutan = existingItems.length + 1

    for (const extra of extraItems) {
      if (!extra.namaBarang) continue
      let kategori = 'Komponen Tambahan'
      if (extra.namaBarang.toLowerCase().includes('ongkir') || extra.namaBarang.toLowerCase().includes('layanan')) {
        kategori = 'Cadangan 10% / Ongkir & Layanan'
      }

      let vol = 1
      if (extra.qtyDibeli) {
        const numMatch = extra.qtyDibeli.match(/(\d+(\.\d+)?)/)
        if (numMatch) vol = parseFloat(numMatch[1])
      }

      batchOps.push(
        prisma.itemPengadaanIoT.create({
          data: {
            paketId,
            kategori,
            namaBarang: extra.namaBarang,
            satuan: vol > 1 ? 'Pcs' : 'Paket',
            volume: vol,
            hargaSatuanRAB: 0,
            totalRAB: 0,
            hargaSatuanReal: vol > 0 ? Math.round(extra.hargaAktual / vol) : extra.hargaAktual,
            totalReal: extra.hargaAktual,
            kemasan: '–',
            diterima: true,
            kondisiCatatan: '',
            urutan: nextUrutan++
          }
        })
      )
    }

    if (batchOps.length > 0) {
      await prisma.$transaction(batchOps)
    }

    // Update catatan paket dari catatan keuangan Excel
    let updatedCatatan = paket.catatan || ''
    if (parsed.catatanKeuangan && parsed.catatanKeuangan.length > 0) {
      updatedCatatan = (updatedCatatan ? `${updatedCatatan}\n\n` : '') +
        `Catatan Keuangan Excel:\n` + parsed.catatanKeuangan.join('\n')
    }

    await prisma.paketPengadaanIoT.update({
      where: { id: paketId },
      data: { catatan: updatedCatatan }
    })

    // Sinkronkan ke RabCategory
    await syncPaketToRabCategory(paketId, session?.user?.id)

    revalidatePath('/alat-bahan-iot/' + paketId)
    revalidatePath('/alat-bahan-iot')
    revalidatePath('/dashboard-rab')

    return {
      success: true,
      totalPengeluaran: parsed.totalPengeluaran,
      matchedCount: updatedItemIds.size,
      extraCount: extraItems.length
    }
  } catch (err: any) {
    console.error('Error importExcelPaketIoT:', err)
    return { error: err.message || 'Gagal mengimpor file Excel' }
  }
}

// ==================== DELETE PAKET IOT ====================

export async function deletePaketIoT(id: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN'])
  if (authError) return { error: authError }

  try {
    const existing = await prisma.paketPengadaanIoT.findUnique({
      where: { id },
      include: { rabCategory: true }
    })
    if (!existing) return { error: 'Paket tidak ditemukan' }

    // Hapus RabCategory dan semua item serta expense-nya jika terhubung
    if (existing.rabCategoryId) {
      await prisma.rabCategory.delete({
        where: { id: existing.rabCategoryId }
      }).catch(() => {})
    }

    if (existing.expenseRequestId) {
      await prisma.expenseRequest.delete({
        where: { id: existing.expenseRequestId }
      }).catch(() => {})
    }

    if (existing.rabItemId) {
      await prisma.rabItem.delete({
        where: { id: existing.rabItemId }
      }).catch(() => {})
    }

    await prisma.paketPengadaanIoT.delete({
      where: { id }
    })

    revalidatePath('/alat-bahan-iot')
    revalidatePath('/dashboard-rab')
    return { success: true }
  } catch (err: any) {
    console.error('Error deletePaketIoT:', err)
    return { error: err.message || 'Gagal menghapus paket IoT' }
  }
}

// ==================== MIGRASI KUPANG & SEEDING TIDORE ====================

export async function migrateAndSeedSntCategories() {
  try {
    const project = await prisma.rabProject.findFirst()
    if (!project) return

    // 1. Migrasi Kategori D Kupang
    let catKupang = await prisma.rabCategory.findFirst({
      where: {
        OR: [
          { name: { contains: 'Kupang', mode: 'insensitive' } },
          { name: 'D. Biaya IoT/Robotic' }
        ]
      },
      include: { items: true }
    })

    if (catKupang) {
      if (catKupang.name !== 'D. Biaya IoT - SNT 5 Kupang') {
        catKupang = await prisma.rabCategory.update({
          where: { id: catKupang.id },
          data: { name: 'D. Biaya IoT - SNT 5 Kupang' },
          include: { items: true }
        })
      }

      // Hubungkan paket Kupang jika ada
      let paketKupang = await prisma.paketPengadaanIoT.findFirst({
        where: { lokasiSNT: { contains: 'Kupang', mode: 'insensitive' } }
      })

      if (!paketKupang) {
        // Buat paket Kupang
        const fasilKupang = await prisma.fasilitator.findFirst({
          where: { lokasiSNT: { contains: 'Kupang', mode: 'insensitive' } }
        })

        const items = DEFAULT_51_IOT_ITEMS
        const subtotal = items.reduce((acc, it) => acc + (it.volume * it.hargaSatuanRAB), 0)
        const cadangan = Math.round(subtotal * 0.10)

        paketKupang = await prisma.paketPengadaanIoT.create({
          data: {
            lokasiSNT: 'SNT 5 Kupang',
            namaPaket: 'Pengadaan Alat dan Bahan Robotika - SNT 5 Kupang',
            lingkupProyek: 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
            nomorSurat: '01/RE/SNT-K2/X/2026',
            tanggalSurat: new Date('2026-10-12'),
            pihakPertamaNama: 'Jully Tjindrawan, MBA',
            pihakPertamaJabatan: 'Koordinator Wilayah 2, Program SNT',
            pihakPertamaInstansi: 'PT Jully Tjindrawan Robotik (Robotic Explorer)',
            fasilitatorId: fasilKupang?.id || null,
            pihakKeduaNama: 'Dr. Almindo H. Ginting, S.T., M.Eng',
            pihakKeduaJabatan: 'Fasilitator Koding, KA & Robotika',
            pihakKeduaSekolah: 'SNT 5 Kupang',
            pihakKeduaAlamat: 'Dusun II Tetelek, Desa Manusak, Kec. Kupang Timur, Kab. Kupang, NTT',
            mengetahuiNama: 'Kepala SNT 5 Kupang',
            mengetahuiJabatan: 'Kepala SNT 5 Kupang',
            subtotalRencana: subtotal,
            persenCadangan: 10,
            nominalCadangan: cadangan,
            totalPaguRAB: subtotal + cadangan,
            totalRealisasi: 1752896,
            status: 'DITERIMA',
            rabCategoryId: catKupang.id,
            items: {
              create: items.map((it, idx) => ({
                kategori: it.kategori,
                namaBarang: it.namaBarang,
                satuan: it.satuan,
                volume: it.volume,
                hargaSatuanRAB: it.hargaSatuanRAB,
                totalRAB: it.volume * it.hargaSatuanRAB,
                hargaSatuanReal: 0,
                totalReal: 0,
                kemasan: it.kemasan,
                diterima: it.diterima,
                kondisiCatatan: it.kondisiCatatan,
                urutan: idx + 1
              }))
            }
          }
        })
      } else if (!paketKupang.rabCategoryId) {
        await prisma.paketPengadaanIoT.update({
          where: { id: paketKupang.id },
          data: { rabCategoryId: catKupang.id }
        })
      }

      await syncPaketToRabCategory(paketKupang.id)
    }

    // 2. Seeding Paket & Kategori E SNT 5 Tidore Kepulauan jika belum ada
    const existingTidore = await prisma.paketPengadaanIoT.findFirst({
      where: { lokasiSNT: { contains: 'Tidore', mode: 'insensitive' } }
    })

    if (!existingTidore) {
      let catTidore = await prisma.rabCategory.findFirst({
        where: { name: { contains: 'Tidore', mode: 'insensitive' } }
      })

      if (!catTidore) {
        catTidore = await prisma.rabCategory.create({
          data: {
            projectId: project.id,
            name: 'E. Biaya IoT - SNT 5 Tidore Kepulauan'
          }
        })
      }

      const fasilTidore = await prisma.fasilitator.findFirst({
        where: { lokasiSNT: { contains: 'Tidore', mode: 'insensitive' } }
      })

      // Buat paket Tidore dengan 51 item awal
      const items = DEFAULT_51_IOT_ITEMS
      const subtotalRencana = items.reduce((acc, it) => acc + (it.volume * it.hargaSatuanRAB), 0)
      const cadangan = Math.round(subtotalRencana * 0.10)

      const paketTidore = await prisma.paketPengadaanIoT.create({
        data: {
          lokasiSNT: 'SNT 5 Tidore Kepulauan',
          namaPaket: 'Pengadaan Alat dan Bahan Robotika - SNT 5 Tidore Kepulauan',
          lingkupProyek: 'Rover (Smart Trash IoT), Smart Lamp IoT, dan Smart Garden IoT',
          nomorSurat: '02/RE/SNT-K2/X/2026',
          tanggalSurat: new Date('2026-10-16'),
          pihakPertamaNama: 'Jully Tjindrawan, MBA',
          pihakPertamaJabatan: 'Koordinator Wilayah 2, Program SNT',
          pihakPertamaInstansi: 'PT Jully Tjindrawan Robotik (Robotic Explorer)',
          fasilitatorId: fasilTidore?.id || null,
          pihakKeduaNama: fasilTidore?.namaLengkap || 'Muh. Hanifudin H, S.Pd',
          pihakKeduaJabatan: 'Fasilitator Koding, KA & Robotika',
          pihakKeduaSekolah: 'SNT 5 Tidore Kepulauan',
          pihakKeduaAlamat: fasilTidore?.alamat || 'Kota Tidore Kepulauan, Maluku Utara',
          mengetahuiNama: 'Kepala SNT 5 Tidore Kepulauan',
          mengetahuiJabatan: 'Kepala SNT 5 Tidore Kepulauan',
          subtotalRencana,
          persenCadangan: 10,
          nominalCadangan: cadangan,
          totalPaguRAB: subtotalRencana + cadangan,
          totalRealisasi: 0,
          status: 'DIKIRIM',
          rabCategoryId: catTidore.id,
          catatan: 'Disusun berdasarkan nota/struk pengadaan alat bahan Tidore Kepulauan (Korwil 2).',
          items: {
            create: items.map((it, idx) => ({
              kategori: it.kategori,
              namaBarang: it.namaBarang,
              satuan: it.satuan,
              volume: it.volume,
              hargaSatuanRAB: it.hargaSatuanRAB,
              totalRAB: it.volume * it.hargaSatuanRAB,
              hargaSatuanReal: it.hargaSatuanReal,
              totalReal: it.volume * it.hargaSatuanReal,
              kemasan: it.kemasan,
              diterima: it.diterima,
              kondisiCatatan: it.kondisiCatatan,
              urutan: idx + 1
            }))
          }
        }
      })

      // Cek apakah file Excel Tidore ada di Downloads untuk langsung diimport otomatis
      try {
        const fs = require('fs')
        const tidoreExcelPath = 'C:\\Users\\ASUS\\Downloads\\Rekap_Pengeluaran_SNT5_Tidore.xlsx'
        if (fs.existsSync(tidoreExcelPath)) {
          const fileBuf = fs.readFileSync(tidoreExcelPath)
          const base64 = fileBuf.toString('base64')
          await importExcelPaketIoT(paketTidore.id, base64)
          console.log('Successfully auto-imported Tidore Excel file!')
        } else {
          await syncPaketToRabCategory(paketTidore.id)
        }
      } catch (errExcel) {
        console.error('Failed auto-importing Tidore Excel:', errExcel)
        await syncPaketToRabCategory(paketTidore.id)
      }
    }
  } catch (err: any) {
    console.error('Error migrateAndSeedSntCategories:', err)
  }
}
