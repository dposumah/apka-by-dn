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
      laporanEkstra: { select: { id: true, fasilitator: { select: { namaLengkap: true } } } }
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
      laporanEkstra: {
        where: { fasilitatorId },
        select: { id: true }
      }
    },
    orderBy: { mingguKe: 'asc' }
  })
}

export async function submitLaporanEkstra(fasilitatorId: string, data: {
  jadwalId: string,
  modulId: string,
  tanggalKegiatan: string,
  catatanUmum?: string,
  foto1?: string,
  foto2?: string,
  kehadiran: Array<{
    siswaId: string,
    status: string,
    nilaiKualitatif?: string,
    catatan?: string
  }>
}) {
  // Check if already submitted
  const existing = await prisma.laporanEkstra.findFirst({
    where: { fasilitatorId, jadwalId: data.jadwalId }
  })
  if (existing) throw new Error('Laporan untuk jadwal ini sudah pernah disubmit')

  const laporan = await prisma.laporanEkstra.create({
    data: {
      fasilitatorId,
      jadwalId: data.jadwalId,
      modulId: data.modulId,
      tanggalKegiatan: new Date(data.tanggalKegiatan),
      catatanUmum: data.catatanUmum || null,
      foto1: data.foto1 || null,
      foto2: data.foto2 || null,
      kehadiran: {
        create: data.kehadiran.map(k => ({
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
  return prisma.laporanEkstra.findMany({
    where: { fasilitatorId },
    include: {
      modul: true,
      jadwal: true,
      kehadiran: {
        include: { siswa: true },
        orderBy: { siswa: { namaLengkap: 'asc' } }
      }
    },
    orderBy: { tanggalKegiatan: 'desc' }
  })
}

// ==================== REKAP (ADMIN) ====================

export async function getAllLaporanEkstra(filters?: { lokasiSNT?: string, modulId?: string }) {
  const where: any = {}
  if (filters?.lokasiSNT) where.jadwal = { lokasiSNT: filters.lokasiSNT }
  if (filters?.modulId) where.modulId = filters.modulId

  return prisma.laporanEkstra.findMany({
    where,
    include: {
      fasilitator: { select: { namaLengkap: true, lokasiSNT: true } },
      modul: true,
      jadwal: true,
      kehadiran: {
        include: { siswa: true },
        orderBy: { siswa: { namaLengkap: 'asc' } }
      }
    },
    orderBy: [{ jadwal: { mingguKe: 'asc' } }, { tanggalKegiatan: 'desc' }]
  })
}

export async function getRekapKehadiran(lokasiSNT?: string) {
  const where: any = {}
  if (lokasiSNT) where.jadwal = { lokasiSNT }
  
  const laporan = await prisma.laporanEkstra.findMany({
    where,
    include: {
      modul: true,
      jadwal: true,
      fasilitator: { select: { namaLengkap: true, lokasiSNT: true } },
      kehadiran: {
        include: { siswa: true }
      }
    },
    orderBy: { jadwal: { mingguKe: 'asc' } }
  })
  
  return laporan.map(lap => {
    const total = lap.kehadiran.length
    const hadir = lap.kehadiran.filter(k => k.status === 'HADIR').length
    const izin = lap.kehadiran.filter(k => k.status === 'IZIN').length
    const sakit = lap.kehadiran.filter(k => k.status === 'SAKIT').length
    const alpha = lap.kehadiran.filter(k => k.status === 'ALPHA').length
    
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
