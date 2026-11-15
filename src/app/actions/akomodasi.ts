"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CASHFLOW_READ_ROLES, SNT_MANAGE_ROLES, checkAuth } from '@/lib/auth-check'

export async function getAkomodasiList() {
  const { error } = await checkAuth(CASHFLOW_READ_ROLES)
  if (error) return []

  return prisma.fasilitatorAkomodasi.findMany({
    include: { fasilitator: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createSewaRumah(data: any) {
  const { error, session } = await checkAuth(SNT_MANAGE_ROLES)
  if (error || !session) throw new Error(error || 'Unauthorized')
  const userId = session.user.id

  const akomodasi = await prisma.$transaction(async (tx) => {
    const rabItem = await tx.rabItem.findFirst({
      where: { name: { contains: 'Akomodasi', mode: 'insensitive' } }
    })

    let expenseId: string | null = null
    if (rabItem) {
      const expense = await tx.expenseRequest.create({
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

    return tx.fasilitatorAkomodasi.create({
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
  })

  revalidatePath('/fasilitator/akomodasi')
  return akomodasi
}

export async function createAkomodasiToT(data: any) {
  const { error, session } = await checkAuth(SNT_MANAGE_ROLES)
  if (error || !session) throw new Error(error || 'Unauthorized')
  const userId = session.user.id

  const akomodasi = await prisma.$transaction(async (tx) => {
    const rabItem = await tx.rabItem.findFirst({
      where: { name: { contains: 'Akomodasi', mode: 'insensitive' } }
    })

    let expenseId: string | null = null
    if (rabItem) {
      const expense = await tx.expenseRequest.create({
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

    return tx.fasilitatorAkomodasi.create({
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
