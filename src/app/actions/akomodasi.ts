"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getAkomodasiList() {
  return prisma.fasilitatorAkomodasi.findMany({
    include: { fasilitator: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createSewaRumah(data: any) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || 'unknown'

  // First create expense
  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Akomodasi', mode: 'insensitive' } }
  })

  let expenseId = null
  if (rabItem) {
    const expense = await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: data.totalNominal,
        description: `Sewa Rumah - ${data.namaPemilik} (${data.periodeSewa})`,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId: data.fasilitatorId,
      }
    })
    expenseId = expense.id
  }

  const akomodasi = await prisma.fasilitatorAkomodasi.create({
    data: {
      fasilitatorId: data.fasilitatorId,
      tipe: 'SEWA_RUMAH',
      namaPemilik: data.namaPemilik,
      alamatSewa: data.alamatSewa,
      periodeSewa: data.periodeSewa,
      hargaSewaBulan: data.hargaSewaBulan,
      totalNominal: data.totalNominal,
      expenseId
    }
  })

  revalidatePath('/fasilitator/akomodasi')
  return akomodasi
}

export async function createAkomodasiToT(data: any) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || 'unknown'

  // First create expense
  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Akomodasi', mode: 'insensitive' } }
  })

  let expenseId = null
  if (rabItem) {
    const expense = await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: data.totalNominal,
        description: `Akomodasi ToT - ${data.namaKegiatan} (${data.namaPenginapan})`,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId: data.fasilitatorId,
      }
    })
    expenseId = expense.id
  }

  const akomodasi = await prisma.fasilitatorAkomodasi.create({
    data: {
      fasilitatorId: data.fasilitatorId,
      tipe: 'AKOMODASI_TOT',
      namaPenginapan: data.namaPenginapan,
      alamatPenginapan: data.alamatPenginapan,
      namaPengelola: data.namaPengelola,
      namaKegiatan: data.namaKegiatan,
      tanggalMulai: new Date(data.tanggalMulai),
      tanggalSelesai: new Date(data.tanggalSelesai),
      jumlahOrang: data.jumlahOrang,
      jumlahKamar: data.jumlahKamar,
      tarifPerMalam: data.tarifPerMalam,
      totalNominal: data.totalNominal,
      expenseId
    }
  })

  revalidatePath('/fasilitator/akomodasi')
  return akomodasi
}

export async function deleteAkomodasi(id: string) {
  const akomodasi = await prisma.fasilitatorAkomodasi.findUnique({ where: { id } })
  if (akomodasi?.expenseId) {
    await prisma.expenseRequest.delete({ where: { id: akomodasi.expenseId } }).catch(() => {})
  }
  
  await prisma.fasilitatorAkomodasi.delete({ where: { id } })
  revalidatePath('/fasilitator/akomodasi')
}
