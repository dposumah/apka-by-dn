'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAuth } from '@/lib/auth-check'
import { sendEmail } from '@/lib/email'
import { getAdminNotificationEmailHtml } from '@/lib/email-templates';


export async function getRabDashboardData() {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return null;
  /* getRabDashboardData_auth */
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
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return [];
  /* getRecentExpenses_auth */
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
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']);
  if (authError) return undefined;
  /* approveExpense_auth */
  await prisma.expenseRequest.update({
    where: { id: expenseId },
    data: { status } // simplified for now, ideally set approvedById
  })
  revalidatePath('/dashboard-rab')
}

export async function submitExpense(data: { rabItemId: string, amount: number, description: string, receiptUrl?: string, userId: string, fasilitatorId?: string }) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) throw new Error(authError);
  /* submitExpense_auth */
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
      fasilitatorId: data.fasilitatorId || null,
      status: 'APPROVED'
    }
  })
  revalidatePath('/dashboard-rab')
  revalidatePath('/pengeluaran')
}
export async function getFasilitators() {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'KORWIL']);
  if (authError) return [];
  /* getFasilitators_auth */
  return await prisma.fasilitator.findMany({
    orderBy: { namaLengkap: 'asc' }
  })
}

export async function getFasilitatorDetail(id: string) {
  const { error: authError, session } = await checkAuth();
  if (authError) return null;
  /* getFasilitatorDetail_auth */
  return await prisma.fasilitator.findUnique({
    where: { id },
    include: {
      expenses: {
        include: {
          rabItem: true
        },
        orderBy: { date: 'desc' }
      },
      laporan: {
        orderBy: { date: 'desc' }
      },
      rekapHonorarium: {
        orderBy: { bulan: 'desc' }
      }
    }
  })
}

export async function updateFasilitatorBank(id: string, bankName: string, bankAccount: string, npwpNik: string) {
  const { error: authError, session } = await checkAuth();
  if (authError) throw new Error(authError);
  /* updateFasilitatorBank_auth */
  await prisma.fasilitator.update({
    where: { id },
    data: { bankName, bankAccount, npwpNik }
  })
  revalidatePath('/', 'layout')
  revalidatePath('/fasilitator/' + id)
  revalidatePath('/portal')
}
import * as bcrypt from 'bcryptjs'

export async function createFasilitator(data: any) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) return { error: authError };
  /* createFasilitator_auth */
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
      propinsi: data.propinsi || null,
      kabKota: data.kabKota || null,
      kontak: data.kontak || null,
      email: data.email || null,
      bankName: data.bankName || null,
      bankAccount: data.bankAccount || null,
      npwpNik: data.npwpNik || null,
        statusKepegawaian: data.statusKepegawaian || null,
        pangkatGolongan: data.pangkatGolongan || null,
        lokasiSNT: data.lokasiSNT || null,
        besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,
      userId: userId,
    }
  })
  revalidatePath('/fasilitator')
  return newFasilitator
}

﻿export async function updateFasilitatorProfile(id: string, data: any) {
  const currentFasil = await prisma.fasilitator.findUnique({ where: { id } })
  let userId = currentFasil?.userId || null

  if (data.email) {
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          email: data.email,
          name: data.namaLengkap
        }
      }).catch(() => {})
    } else {
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
        await prisma.user.update({
          where: { id: userId },
          data: { name: data.namaLengkap }
        })
      }
    }
  }

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
      propinsi: data.propinsi || null,
      kabKota: data.kabKota || null,
      kontak: data.kontak || null,
      email: data.email || null,
      bankName: data.bankName || null,
      bankAccount: data.bankAccount || null,
      npwpNik: data.npwpNik || null,
      statusKepegawaian: data.statusKepegawaian || null,
      pangkatGolongan: data.pangkatGolongan || null,
        lokasiSNT: data.lokasiSNT || null,
        besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : currentFasil?.besaranTransport ?? 120000,
      userId: userId,
    }
  })
  revalidatePath('/fasilitator')
  revalidatePath('/fasilitator/' + id)
  revalidatePath('/portal')
  return updated
}

function getWeekRange(dateString: string) {
  const d = new Date(dateString)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const start = new Date(d.setDate(diff))
  start.setHours(0,0,0,0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23,59,59,999)
  return { start, end }
}

export async function submitLaporanKegiatan(fasilitatorId: string, data: any) {
  const { error: authError, session } = await checkAuth();
  if (authError) throw new Error(authError);

  
  const fasil = await prisma.fasilitator.findUnique({ where: { id: fasilitatorId } });
  const besaranTransportDarat = fasil?.besaranTransport ?? 120000;
  
  const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
  const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;

  const { start, end } = getWeekRange(data.date)

  // Cek apakah sudah ada laporan di hari yang sama
  const targetDate = new Date(data.date);
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
  
  const sameDayReports = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitatorId,
      date: { gte: startOfDay, lte: endOfDay }
    }
  });
  
  const hasTransportToday = sameDayReports.some(lap => lap.biayaTransport > 0);
  const hasTransportLautToday = sameDayReports.some(lap => (lap.biayaTransportLaut || 0) > 0);
  
  let grantedTransportDarat = 0;
  if (!hasTransportToday) {
    grantedTransportDarat = fasil?.besaranTransport ?? 120000;
  }

  let grantedTransportLaut = data.biayaTransportLaut ? parseFloat(data.biayaTransportLaut) : 0;
  if (hasTransportLautToday) {
    grantedTransportLaut = 0;
  }
  
  if (data.metodePelaksanaan === 'DARING') {
    grantedTransportDarat = 0;
    grantedTransportLaut = 0;
  }

  if (fasil?.lokasiSNT) {
    // Get all reports in the same week for this location
    const weeklyReports = await prisma.laporanKegiatan.findMany({
      where: {
        date: { gte: start, lte: end },
        fasilitator: { lokasiSNT: fasil.lokasiSNT }
      }
    })
    
    const totalIntraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPIntra, 0)
    const totalEkstraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPEkstra, 0)
    
    if (totalIntraUsed + reqJpIntra > 8) {
      throw new Error(`Sisa kuota Intrakurikuler minggu ini di lokasi Anda hanya tinggal ${8 - totalIntraUsed} JP.`)
    }
    if (totalEkstraUsed + reqJpEkstra > 4) {
      throw new Error(`Sisa kuota Ekstrakurikuler minggu ini di lokasi Anda hanya tinggal ${4 - totalEkstraUsed} JP.`)
    }
  }
  
  const laporan = await prisma.laporanKegiatan.create({
    data: {
      fasilitatorId,
      date: new Date(data.date),
      topic: data.topic,
      attendance: parseInt(data.attendance),
      evaluation: data.evaluation,
      tingkatSekolah: data.tingkatSekolah,
        metodePelaksanaan: data.metodePelaksanaan || 'LURING',
      jumlahJPIntra: reqJpIntra,
      jumlahJPEkstra: reqJpEkstra,
      biayaTransport: grantedTransportDarat,
      biayaTransportLaut: grantedTransportLaut,
      foto1: data.foto1 || null,
      fileLaporanFisik: data.fileLaporanFisik || null,
      foto2: data.foto2 || null,
      buktiTiketTransport: data.buktiTiketTransport || null,
      statusTransport: 'PENDING',
    }
  });

  revalidatePath('/portal');
  revalidatePath('/dashboard-rab');
  return laporan;
}

export async function deleteFasilitator(id: string) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Cek apakah ada relasi ke user
  const fasil = await prisma.fasilitator.findUnique({ where: { id } })
  const userIdToDelete = fasil?.userId;

  // Delete related Laporan Kegiatan and Rekap Honorarium first
  await prisma.laporanKegiatan.deleteMany({ where: { fasilitatorId: id } })
  await prisma.rekapHonorarium.deleteMany({ where: { fasilitatorId: id } })
  await prisma.expenseRequest.deleteMany({ where: { fasilitatorId: id } })

  await prisma.fasilitator.delete({
    where: { id }
  })
  
  if (userIdToDelete) {
    await prisma.user.delete({ where: { id: userIdToDelete } }).catch(()=>console.log('User delete failed'))
  }
  
  revalidatePath('/fasilitator')
}

export async function toggleFasilitatorStatus(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const fasil = await prisma.fasilitator.update({
    where: { id },
    data: { isActive }
  })
  
  if (fasil.userId) {
    await prisma.user.update({
      where: { id: fasil.userId },
      data: { isActive }
    })
  }
  
  revalidatePath('/fasilitator')
}

export async function deleteLaporanKegiatan(laporanId: string, fasilitatorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  })

  if (!lap) return { error: 'Laporan tidak ditemukan' }
  // Allow Admin to bypass fasilitatorId check if needed, or keep it.
  if (lap.fasilitatorId !== fasilitatorId && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") return { error: "Unauthorized" };
  
  if (lap.rekapHonorariumId || lap.statusTransport === 'PAID') {
    return { error: 'Laporan sudah dibayar (Transport/Honor) sehingga tidak dapat dihapus.' }
  }

  await prisma.laporanKegiatan.delete({
    where: { id: laporanId }
  })
  
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteExpense(id: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) return undefined;
  /* deleteExpense_auth */
  await prisma.expenseRequest.delete({ where: { id } })
  revalidatePath('/dashboard-rab')
  revalidatePath('/pengeluaran')
}

export async function uploadLaporanFisik(laporanId: string, fileUrl: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  })
  if (!lap) throw new Error('Not found')

  await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: { fileLaporanFisik: fileUrl }
  })

  revalidatePath('/portal', 'layout')
  revalidatePath('/dashboard-rab', 'layout')
  revalidatePath('/fasilitator', 'layout')
  return { success: true }
}
