"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ==================== SISWA ====================

export async function getSiswaByLokasi(lokasiSNT?: string) {
  return prisma.siswa.findMany({
    where: lokasiSNT ? { lokasiSNT, isActive: true } : { isActive: true },
    orderBy: [{ kelas: 'asc' }, { namaLengkap: 'asc' }]
  })
}

export async function getAllSiswa() {
  return prisma.siswa.findMany({
    orderBy: [{ lokasiSNT: 'asc' }, { kelas: 'asc' }, { namaLengkap: 'asc' }]
  })
}

export async function createSiswa(data: { namaLengkap: string, kelas: string, lokasiSNT: string }) {
  const siswa = await prisma.siswa.create({ data })
  revalidatePath('/siswa')
  return siswa
}

export async function updateSiswa(id: string, data: { namaLengkap?: string, kelas?: string, lokasiSNT?: string, isActive?: boolean }) {
  const siswa = await prisma.siswa.update({ where: { id }, data })
  revalidatePath('/siswa')
  return siswa
}

export async function deleteSiswa(id: string) {
  await prisma.siswa.delete({ where: { id } })
  revalidatePath('/siswa')
}

export async function toggleSiswaStatus(id: string, isActive: boolean) {
  await prisma.siswa.update({ where: { id }, data: { isActive } })
  revalidatePath('/siswa')
}

// ==================== MODUL ====================

export async function getModulPembelajaran(tingkatSekolah?: string) {
  return prisma.modulPembelajaran.findMany({
    where: tingkatSekolah ? { tingkatSekolah, isActive: true } : { isActive: true },
    orderBy: { urutan: 'asc' }
  })
}

export async function getAllModul() {
  return prisma.modulPembelajaran.findMany({
    orderBy: [{ tingkatSekolah: 'asc' }, { urutan: 'asc' }]
  })
}

export async function createModul(data: { kode: string, judul: string, deskripsi?: string, tingkatSekolah: string, urutan?: number }) {
  const modul = await prisma.modulPembelajaran.create({ data })
  revalidatePath('/modul')
  return modul
}

export async function updateModul(id: string, data: { kode?: string, judul?: string, deskripsi?: string, tingkatSekolah?: string, urutan?: number, isActive?: boolean }) {
  const modul = await prisma.modulPembelajaran.update({ where: { id }, data })
  revalidatePath('/modul')
  return modul
}

export async function deleteModul(id: string) {
  await prisma.modulPembelajaran.delete({ where: { id } })
  revalidatePath('/modul')
}

// ==================== JADWAL EKSTRA ====================

export async function getJadwalEkstra(lokasiSNT?: string, tingkatSekolah?: string) {
  const where: any = {}
  if (lokasiSNT) where.lokasiSNT = lokasiSNT
  if (tingkatSekolah) where.tingkatSekolah = tingkatSekolah
  
  return prisma.jadwalEkstra.findMany({
    where,
    include: { 
      modul: true,
      laporanKegiatan: { select: { id: true, fasilitator: { select: { namaLengkap: true } } }, where: { jenisLaporan: 'EKSTRA' } }
    },
    orderBy: [{ lokasiSNT: 'asc' }, { mingguKe: 'asc' }]
  })
}

export async function createJadwalEkstra(data: { mingguKe: number, tanggalMulai: string, tanggalSelesai: string, modulId: string, lokasiSNT: string, tingkatSekolah: string }) {
  const jadwal = await prisma.jadwalEkstra.create({
    data: {
      mingguKe: data.mingguKe,
      tanggalMulai: new Date(data.tanggalMulai),
      tanggalSelesai: new Date(data.tanggalSelesai),
      modulId: data.modulId,
      lokasiSNT: data.lokasiSNT,
      tingkatSekolah: data.tingkatSekolah
    }
  })
  revalidatePath('/jadwal-ekstra')
  return jadwal
}

export async function updateJadwalEkstra(id: string, data: any) {
  const updateData: any = { ...data }
  if (data.tanggalMulai) updateData.tanggalMulai = new Date(data.tanggalMulai)
  if (data.tanggalSelesai) updateData.tanggalSelesai = new Date(data.tanggalSelesai)
  
  const jadwal = await prisma.jadwalEkstra.update({ where: { id }, data: updateData })
  revalidatePath('/jadwal-ekstra')
  return jadwal
}

export async function deleteJadwalEkstra(id: string) {
  await prisma.jadwalEkstra.delete({ where: { id } })
  revalidatePath('/jadwal-ekstra')
}

// ==================== LAPORAN EKSTRA (FASILITATOR) ====================

export async function getJadwalForFasilitator(fasilitatorId: string) {
  const fasilitator = await prisma.fasilitator.findUnique({ where: { id: fasilitatorId } })
  if (!fasilitator?.lokasiSNT) return []
  
  // Get the province part of lokasiSNT for matching
  const lokasiParts = fasilitator.lokasiSNT.split(' - ')
  const provinsi = lokasiParts[0] // e.g. "Maluku Utara"
  
  return prisma.jadwalEkstra.findMany({
    where: { lokasiSNT: fasilitator.lokasiSNT },
    include: {
      modul: true,
      laporanKegiatan: {
        where: { fasilitatorId, jenisLaporan: 'EKSTRA' },
        select: { id: true }
      }
    },
    orderBy: { mingguKe: 'asc' }
  })
}

export async function submitLaporanEkstra(fasilitatorId: string, data: any) {
  // Check if already submitted
  const existing = await prisma.laporanKegiatan.findFirst({
    where: { fasilitatorId, jadwalEkstraId: data.jadwalEkstraId, jenisLaporan: 'EKSTRA' }
  })
  if (existing) throw new Error('Laporan untuk jadwal ini sudah pernah disubmit')

  const laporan = await prisma.laporanKegiatan.create({
    data: {
      fasilitatorId,
      jadwalEkstraId: data.jadwalEkstraId,
      modulEkstraId: data.modulEkstraId,
      jenisLaporan: 'EKSTRA',
      date: new Date(data.tanggalKegiatan),
      topic: 'Laporan Ekstrakurikuler',
      attendance: data.kehadiranEkstra ? data.kehadiranEkstra.length : 0,
      
      modeTransport: data.modeTransport || 'PRIBADI',
      statusTransport: 'PENDING',
      jenisKendaraan: data.jenisKendaraan || null,
      jenisBBM: data.jenisBBM || null,
      jarakTempuhKm: data.jarakTempuhKm || null,
      nominalStruk: data.nominalStruk || null,
      nominalInvoice: data.nominalInvoice || null,
      biayaTransportLaut: data.biayaTransportLaut || null,
      buktiStrukBBM: data.buktiStrukBBM || null,
      buktiInvoiceOnline: data.buktiInvoiceOnline || null,
      buktiTiketTransport: data.buktiTiketTransport || null,
      plafonMaksimal: data.plafonMaksimal || null,
      biayaTransportDisetujui: data.biayaTransportDisetujui || 0,
      
      foto1: data.foto1 || null,
      foto2: data.foto2 || null,
      evaluation: data.catatanUmum || null,
      
      kehadiranEkstra: {
        create: data.kehadiranEkstra.map((k: any) => ({
          siswaId: k.siswaId,
          status: k.status,
          nilaiKualitatif: k.nilaiKualitatif || null,
          catatan: k.catatan || null
        }))
      }
    }
  })

  revalidatePath('/portal/ekstra')
  revalidatePath('/fasilitator/rekap-ekstra')
  return laporan
}

export async function getLaporanEkstraFasilitator(fasilitatorId: string) {
  return prisma.laporanKegiatan.findMany({
    where: { fasilitatorId, jenisLaporan: 'EKSTRA' },
    include: {
      modulEkstra: true,
      jadwalEkstra: true,
      kehadiranEkstra: {
        include: { siswa: true },
        orderBy: { siswa: { namaLengkap: 'asc' } }
      }
    },
    orderBy: { date: 'desc' }
  })
}

// ==================== REKAP (ADMIN) ====================

export async function getAllLaporanEkstra(filters?: { lokasiSNT?: string, modulEkstraId?: string }) {
  const where: any = { jenisLaporan: 'EKSTRA' }
  if (filters?.lokasiSNT) where.jadwalEkstra = { lokasiSNT: filters.lokasiSNT }
  if (filters?.modulEkstraId) where.modulEkstraId = filters.modulEkstraId

  return prisma.laporanKegiatan.findMany({
    where,
    include: {
      fasilitator: { select: { namaLengkap: true, lokasiSNT: true } },
      modulEkstra: true,
      jadwalEkstra: true,
      kehadiranEkstra: {
        include: { siswa: true },
        orderBy: { siswa: { namaLengkap: 'asc' } }
      }
    },
    orderBy: [{ jadwalEkstra: { mingguKe: 'asc' } }, { date: 'desc' }]
  })
}

export async function getRekapKehadiran(lokasiSNT?: string) {
  const where: any = { jenisLaporan: 'EKSTRA' }
  if (lokasiSNT) where.jadwalEkstra = { lokasiSNT }
  
  const laporan = await prisma.laporanKegiatan.findMany({
    where,
    include: {
      modulEkstra: true,
      jadwalEkstra: true,
      fasilitator: { select: { namaLengkap: true, lokasiSNT: true } },
      kehadiranEkstra: {
        include: { siswa: true }
      }
    },
    orderBy: { jadwalEkstra: { mingguKe: 'asc' } }
  })
  
  return laporan.map(lap => {
    const total = lap.kehadiranEkstra.length
    const hadir = lap.kehadiranEkstra.filter(k => k.status === 'HADIR').length
    const izin = lap.kehadiranEkstra.filter(k => k.status === 'IZIN').length
    const sakit = lap.kehadiranEkstra.filter(k => k.status === 'SAKIT').length
    const alpha = lap.kehadiranEkstra.filter(k => k.status === 'ALPHA').length
    
    return {
      ...lap,
      stats: { total, hadir, izin, sakit, alpha, persenHadir: total > 0 ? Math.round((hadir / total) * 100) : 0 }
    }
  })
}

// Get unique lokasiSNT values from fasilitator for filter dropdowns
export async function getLokasiSNTList() {
  const fasilitators = await prisma.fasilitator.findMany({
    where: { isActive: true, lokasiSNT: { not: null } },
    select: { lokasiSNT: true },
    distinct: ['lokasiSNT']
  })
  return fasilitators.map(f => f.lokasiSNT).filter(Boolean) as string[]
}
