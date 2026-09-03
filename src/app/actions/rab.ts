'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getRabDashboardData() {
  const project = await prisma.rabProject.findFirst({
    include: {
      categories: {
        include: {
          items: {
            include: {
              expenses: {
                where: { status: 'APPROVED' }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!project) return null

  // Calculate totals
  let totalBudget = project.totalBudget
  let totalRealized = 0

  const categories = project.categories.map(cat => {
    let catBudget = 0
    let catRealized = 0

    const items = cat.items.map(item => {
      const realized = item.expenses.reduce((sum, exp) => sum + exp.amount, 0)
      catBudget += item.totalBudget
      catRealized += realized

      return {
        ...item,
        realized,
        remaining: item.totalBudget - realized
      }
    })

    totalRealized += catRealized

    return {
      ...cat,
      items,
      budget: catBudget,
      realized: catRealized,
      remaining: catBudget - catRealized
    }
  })

  return {
    ...project,
    categories,
    totalBudget,
    totalRealized,
    totalRemaining: totalBudget - totalRealized,
    percentage: totalBudget > 0 ? (totalRealized / totalBudget) * 100 : 0
  }
}

export async function getRecentExpenses(limit = 10) {
  return await prisma.expenseRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      rabItem: true,
      createdBy: {
        select: { name: true }
      }
    }
  })
}

export async function approveExpense(expenseId: string, status: 'APPROVED' | 'REJECTED') {
  await prisma.expenseRequest.update({
    where: { id: expenseId },
    data: { status } // simplified for now, ideally set approvedById
  })
  revalidatePath('/dashboard-rab')
}

export async function submitExpense(data: { rabItemId: string, amount: number, description: string, receiptUrl?: string, userId: string, fasilitatorId?: string }) {
  let user = await prisma.user.findFirst()
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@korwil.com',
        password: 'hash',
        name: 'Demo Korwil',
        role: 'KORWIL'
      }
    })
  }

  await prisma.expenseRequest.create({
    data: {
      rabItemId: data.rabItemId,
      amount: data.amount,
      description: data.description,
      receiptUrl: data.receiptUrl,
      createdById: user.id,
      fasilitatorId: data.fasilitatorId || null
    }
  })
  revalidatePath('/dashboard-rab')
  revalidatePath('/pengeluaran')
}
export async function getFasilitators() {
  return await prisma.fasilitator.findMany({
    orderBy: { namaLengkap: 'asc' }
  })
}

export async function getFasilitatorDetail(id: string) {
  return await prisma.fasilitator.findUnique({
    where: { id },
    include: {
      expenses: {
        include: {
          rabItem: true
        },
        orderBy: { date: 'desc' }
      }
    }
  })
}

export async function updateFasilitatorBank(id: string, bankName: string, bankAccount: string, npwpNik: string) {
  await prisma.fasilitator.update({
    where: { id },
    data: { bankName, bankAccount, npwpNik }
  })
  revalidatePath('/fasilitator')
  revalidatePath('/fasilitator/' + id)
  revalidatePath('/portal')
}
import * as bcrypt from 'bcryptjs'

export async function createFasilitator(data: any) {
  let userId = null;
  
  if (data.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('SNT2026', 10)
      const newUser = await prisma.user.create({
        data: {
          email: data.email,
          name: data.namaLengkap,
          password: hashedPassword,
          role: 'FASILITATOR',
        }
      })
      userId = newUser.id
    } else {
      userId = existingUser.id
    }
  }

  const newFasilitator = await prisma.fasilitator.create({
    data: {
      namaLengkap: data.namaLengkap,
      jabatan: data.jabatan || null,
      instansi: data.instansi || null,
      nipNuptk: data.nipNuptk || null,
      nidn: data.nidn || null,
      pendidikan: data.pendidikan || null,
      klusterKeahlian: data.klusterKeahlian || null,
      mataPelajaran: data.mataPelajaran || null,
      kompetensi: data.kompetensi || null,
      sertifikasi: data.sertifikasi || null,
      alamat: data.alamat || null,
      kontak: data.kontak || null,
      email: data.email || null,
      bankName: data.bankName || null,
      bankAccount: data.bankAccount || null,
      npwpNik: data.npwpNik || null,
        statusKepegawaian: data.statusKepegawaian || null,
        pangkatGolongan: data.pangkatGolongan || null,
      userId: userId,
    }
  })
  revalidatePath('/fasilitator')
  return newFasilitator
}

export async function updateFasilitatorProfile(id: string, data: any) {
  const updated = await prisma.fasilitator.update({
    where: { id },
    data: {
      namaLengkap: data.namaLengkap,
      jabatan: data.jabatan || null,
      instansi: data.instansi || null,
      nipNuptk: data.nipNuptk || null,
      nidn: data.nidn || null,
      pendidikan: data.pendidikan || null,
      klusterKeahlian: data.klusterKeahlian || null,
      mataPelajaran: data.mataPelajaran || null,
      kompetensi: data.kompetensi || null,
      sertifikasi: data.sertifikasi || null,
      alamat: data.alamat || null,
      kontak: data.kontak || null,
      email: data.email || null,
      bankName: data.bankName || null,
      bankAccount: data.bankAccount || null,
      npwpNik: data.npwpNik || null,
        statusKepegawaian: data.statusKepegawaian || null,
        pangkatGolongan: data.pangkatGolongan || null,
    }
  })
  revalidatePath('/fasilitator')
  revalidatePath('/fasilitator/' + id)
  revalidatePath('/portal')
  return updated
}
export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const laporan = await prisma.laporanKegiatan.create({
    data: {
      fasilitatorId,
      date: new Date(data.date),
      topic: data.topic,
      attendance: parseInt(data.attendance),
      evaluation: data.evaluation,
      materialLink: data.materialLink,
    }
  });

  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Honor', mode: 'insensitive' } }
  });
  
  if (rabItem) {
    const expense = await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: parseInt(data.honorAmount) || 200000,
        description: 'Honor Pengajar: ' + data.topic,
        receiptUrl: data.materialLink,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId,
      }
    });
    
    await prisma.laporanKegiatan.update({
      where: { id: laporan.id },
      data: { expenseRequestId: expense.id }
    });
  }

  revalidatePath('/portal');
  revalidatePath('/dashboard-rab');
  return laporan;
}






