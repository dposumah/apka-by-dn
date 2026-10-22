"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkAuth } from '@/lib/auth-check'
import { DEFAULT_51_IOT_ITEMS } from '@/lib/iot-constants'

// ==================== HELPER KATEGORI D RAB ====================

async function getOrCreateCategoryD() {
  let cat = await prisma.rabCategory.findFirst({
    where: { name: { contains: 'IoT', mode: 'insensitive' } }
  })

  if (!cat) {
    const project = await prisma.rabProject.findFirst()
    if (!project) throw new Error("RAB Project belum dibuat")
    cat = await prisma.rabCategory.create({
      data: {
        projectId: project.id,
        name: 'D. Biaya IoT/Robotic'
      }
    })
  }
  return cat
}

// ==================== QUERY PAKET IOT ====================

export async function getPaketIoTList() {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL'])
  if (authError) return []

  await seedKupangPaketIfEmpty()

  return prisma.paketPengadaanIoT.findMany({
    include: {
      fasilitator: true,
      rabItem: {
        include: {
          expenses: true
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
      rabItem: {
        include: {
          expenses: true
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
    const categoryD = await getOrCreateCategoryD()

    // Cari data fasilitator jika ada
    let fasilData: any = null
    if (data.fasilitatorId) {
      fasilData = await prisma.fasilitator.findUnique({
        where: { id: data.fasilitatorId }
      })
    }

    // Hitung nomor urut code di Kategori D
    const existingItems = await prisma.rabItem.findMany({
      where: { categoryId: categoryD.id }
    })
    const nextCode = (existingItems.length + 1).toString()

    // Template items
    const templateItems = data.loadDefaultTemplate !== false ? DEFAULT_51_IOT_ITEMS : []
    const subtotalRencana = templateItems.reduce((acc, it) => acc + (it.volume * it.hargaSatuanRAB), 0)
    const persenCadangan = data.persenCadangan !== undefined ? data.persenCadangan : 10
    const nominalCadangan = Math.round(subtotalRencana * (persenCadangan / 100))
    const totalPaguRAB = subtotalRencana + nominalCadangan
    const totalRealisasi = templateItems.reduce((acc, it) => acc + (it.volume * it.hargaSatuanReal), 0)

    // 1. Buat Pos Item RAB di Kategori D
    const rabItem = await prisma.rabItem.create({
      data: {
        categoryId: categoryD.id,
        code: nextCode,
        name: `Alat dan Bahan IoT ${data.lokasiSNT}`,
        totalBudget: totalPaguRAB,
        volume: '1 Paket'
      }
    })

    // 2. Buat Paket IoT
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
        rabItemId: rabItem.id,
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
      include: { rabItem: true, expenseRequest: true }
    })
    if (!existing) return { error: 'Paket IoT tidak ditemukan' }

    let subtotalRencana = existing.subtotalRencana
    let totalRealisasi = existing.totalRealisasi
    const persenCadangan = data.persenCadangan !== undefined ? Number(data.persenCadangan) : existing.persenCadangan

    // Jika items disediakan, perbarui daftar item
    if (items && Array.isArray(items)) {
      // Hapus item lama dan buat item baru
      await prisma.itemPengadaanIoT.deleteMany({
        where: { paketId: id }
      })

      subtotalRencana = items.reduce((sum: number, it: any) => sum + (Number(it.volume || 0) * Number(it.hargaSatuanRAB || 0)), 0)
      totalRealisasi = items.reduce((sum: number, it: any) => sum + (Number(it.volume || 0) * Number(it.hargaSatuanReal || 0)), 0)

      await prisma.itemPengadaanIoT.createMany({
        data: items.map((it: any, idx: number) => ({
          paketId: id,
          kategori: it.kategori || 'Komponen',
          namaBarang: it.namaBarang || 'Item',
          satuan: it.satuan || 'Unit',
          volume: Number(it.volume) || 1,
          hargaSatuanRAB: Number(it.hargaSatuanRAB) || 0,
          totalRAB: (Number(it.volume) || 1) * (Number(it.hargaSatuanRAB) || 0),
          hargaSatuanReal: Number(it.hargaSatuanReal) || 0,
          totalReal: (Number(it.volume) || 1) * (Number(it.hargaSatuanReal) || 0),
          kemasan: it.kemasan || '–',
          diterima: it.diterima !== undefined ? Boolean(it.diterima) : true,
          kondisiCatatan: it.kondisiCatatan || 'Baik',
          urutan: idx + 1
        }))
      })
    }

    const nominalCadangan = Math.round(subtotalRencana * (persenCadangan / 100))
    const totalPaguRAB = subtotalRencana + nominalCadangan

    // Update Paket
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
        subtotalRencana,
        persenCadangan,
        nominalCadangan,
        totalPaguRAB,
        totalRealisasi,
        status: data.status !== undefined ? data.status : existing.status,
        catatan: data.catatan !== undefined ? data.catatan : existing.catatan,
        lampiranNotaUrl: data.lampiranNotaUrl !== undefined ? data.lampiranNotaUrl : existing.lampiranNotaUrl
      }
    })

    // SINKRONISASI KE RAB ITEM (Kategori D)
    if (existing.rabItemId) {
      await prisma.rabItem.update({
        where: { id: existing.rabItemId },
        data: {
          totalBudget: totalPaguRAB,
          name: `Alat dan Bahan IoT ${updated.lokasiSNT}`
        }
      })
    }

    // SINKRONISASI KE TRANSAKSI REALISASI (ExpenseRequest)
    let createdById = session?.user?.id
    if (!createdById) {
      const u = await prisma.user.findFirst()
      createdById = u?.id
    }

    if (existing.rabItemId && createdById && totalRealisasi > 0) {
      if (existing.expenseRequestId) {
        await prisma.expenseRequest.update({
          where: { id: existing.expenseRequestId },
          data: {
            amount: totalRealisasi,
            description: `Realisasi Pengadaan Alat & Bahan IoT (${updated.lokasiSNT})`,
            date: updated.tanggalSurat || new Date(),
            receiptUrl: updated.lampiranNotaUrl || undefined
          }
        })
      } else {
        const newExpense = await prisma.expenseRequest.create({
          data: {
            rabItemId: existing.rabItemId,
            amount: totalRealisasi,
            description: `Realisasi Pengadaan Alat & Bahan IoT (${updated.lokasiSNT})`,
            status: 'APPROVED',
            date: updated.tanggalSurat || new Date(),
            receiptUrl: updated.lampiranNotaUrl || null,
            createdById: createdById,
            fasilitatorId: updated.fasilitatorId || null
          }
        })

        await prisma.paketPengadaanIoT.update({
          where: { id },
          data: { expenseRequestId: newExpense.id }
        })
      }
    }

    revalidatePath('/alat-bahan-iot')
    revalidatePath('/alat-bahan-iot/' + id)
    revalidatePath('/dashboard-rab')
    return { success: true, updated }
  } catch (err: any) {
    console.error('Error updatePaketIoT:', err)
    return { error: err.message || 'Gagal memperbarui paket IoT' }
  }
}

// ==================== DELETE PAKET IOT ====================

export async function deletePaketIoT(id: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN'])
  if (authError) return { error: authError }

  try {
    const existing = await prisma.paketPengadaanIoT.findUnique({
      where: { id }
    })
    if (!existing) return { error: 'Paket tidak ditemukan' }

    if (existing.expenseRequestId) {
      await prisma.expenseRequest.delete({
        where: { id: existing.expenseRequestId }
      }).catch(() => {})
    }

    if (existing.rabItemId) {
      // Periksa apakah ada expense lain
      const otherExpenses = await prisma.expenseRequest.count({
        where: { rabItemId: existing.rabItemId }
      })
      if (otherExpenses === 0) {
        await prisma.rabItem.delete({
          where: { id: existing.rabItemId }
        }).catch(() => {})
      }
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

// ==================== SEED KUPANG JIKA BELUM ADA ====================

export async function seedKupangPaketIfEmpty() {
  const count = await prisma.paketPengadaanIoT.count()
  if (count > 0) return

  try {
    // Cari fasilitator Kupang (Dr. Almindo Ginting)
    const fasilKupang = await prisma.fasilitator.findFirst({
      where: {
        OR: [
          { namaLengkap: { contains: 'Almindo', mode: 'insensitive' } },
          { namaLengkap: { contains: 'Almido', mode: 'insensitive' } },
          { lokasiSNT: { contains: 'Kupang', mode: 'insensitive' } }
        ]
      }
    })

    // Cari item RAB Kategori D Kupang yang sudah ada
    const existingRabItem = await prisma.rabItem.findFirst({
      where: {
        name: { contains: 'Kupang', mode: 'insensitive' },
        category: { name: { contains: 'IoT', mode: 'insensitive' } }
      }
    })

    const categoryD = await getOrCreateCategoryD()

    let rabItemId = existingRabItem?.id
    if (!rabItemId) {
      const createdItem = await prisma.rabItem.create({
        data: {
          categoryId: categoryD.id,
          code: '1',
          name: 'Alat dan Bahan IoT SNT 5 Kupang',
          totalBudget: 3019500,
          volume: '1 Paket'
        }
      })
      rabItemId = createdItem.id
    }

    const items = DEFAULT_51_IOT_ITEMS
    const subtotalRencana = items.reduce((acc, it) => acc + (it.volume * it.hargaSatuanRAB), 0)
    const persenCadangan = 10
    const nominalCadangan = Math.round(subtotalRencana * 0.10)
    const totalPaguRAB = subtotalRencana + nominalCadangan
    const totalRealisasi = items.reduce((acc, it) => acc + (it.volume * it.hargaSatuanReal), 0)

    await prisma.paketPengadaanIoT.create({
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
        mengetahuiNip: '–',
        mengetahuiJabatan: 'Kepala SNT 5 Kupang',
        subtotalRencana,
        persenCadangan,
        nominalCadangan,
        totalPaguRAB,
        totalRealisasi,
        status: 'DITERIMA',
        rabItemId: rabItemId,
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
    console.log('Successfully seeded SNT 5 Kupang IoT Package!')
  } catch (e) {
    console.error('Failed to seed Kupang paket:', e)
  }
}
