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
                where: { status: 'APPROVED' },
                include: {
                  fasilitator: true,
                  rabItem: true
                },
                orderBy: { date: 'desc' }
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
      rabItem: {
        include: {
          category: true
        }
      },
      fasilitator: true,
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

export async function submitExpense(data: {
  rabItemId: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  userId?: string;
  fasilitatorId?: string;
  date?: string;
}) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return { error: authError };
  /* submitExpense_auth */
  try {
    let createdById = session?.user?.id;
    if (!createdById) {
      const user = await prisma.user.findFirst();
      createdById = user?.id;
    }

    if (!createdById) {
      return { error: 'User tidak ditemukan' };
    }

    const expense = await prisma.expenseRequest.create({
      data: {
        rabItemId: data.rabItemId,
        amount: data.amount,
        description: data.description,
        receiptUrl: data.receiptUrl || null,
        createdById,
        fasilitatorId: data.fasilitatorId || null,
        status: 'APPROVED',
        date: data.date ? new Date(data.date) : new Date()
      },
      include: {
        rabItem: true,
        fasilitator: true
      }
    });

    revalidatePath('/dashboard-rab');
    revalidatePath('/pengeluaran');
    revalidatePath('/laporan-pengeluaran');
    return { ...expense, success: true, expense };
  } catch (err: any) {
    console.error('Error in submitExpense:', err);
    return { error: err.message || 'Gagal menyimpan pengeluaran' };
  }
}
export async function getFasilitators() {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
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
      ktpUrl: data.ktpUrl || null,
        besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : 120000,
      jarakPPKm: data.jarakPPKm !== undefined ? parseFloat(data.jarakPPKm) : 0,
      userId: userId,
    }
  })
  
  revalidatePath('/fasilitator')
  return newFasilitator
}

﻿export async function updateFasilitatorProfile(id: string, data: any) {
  const { error: authError, session } = await checkAuth();
  if (authError || !session?.user) throw new Error('Unauthorized');

  const currentFasil = await prisma.fasilitator.findUnique({ where: { id } });
  
  // Security Check: Only ADMIN/SUPER_ADMIN or the fasilitator themselves can update their profile
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    if (currentFasil?.userId !== session.user.id) {
      throw new Error('Unauthorized: Anda tidak memiliki akses untuk mengubah profil fasilitator lain.');
    }
  }

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
      ktpUrl: data.ktpUrl !== undefined ? data.ktpUrl : undefined,
      jenisTugas: data.jenisTugas || currentFasil?.jenisTugas || 'INTRAKURIKULER',
        besaranTransport: data.besaranTransport !== undefined ? parseFloat(data.besaranTransport) : currentFasil?.besaranTransport ?? 120000,
        jarakPPKm: data.jarakPPKm !== undefined ? parseFloat(data.jarakPPKm) : currentFasil?.jarakPPKm ?? 0,
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
  try {
    const { error: authError, session } = await checkAuth();
    if (authError) return { error: authError };

    const fasil = await prisma.fasilitator.findUnique({ where: { id: fasilitatorId } });
    if (!fasil) return { error: 'Data fasilitator tidak ditemukan' };
    
    const reqJpIntra = parseInt(data.jumlahJPIntra) || 0;
    const reqJpEkstra = parseInt(data.jumlahJPEkstra) || 0;

    const targetDate = new Date(data.date);
    const dayOfWeek = targetDate.getDay() || 7; 
    
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(targetDate);
    endOfWeek.setDate(targetDate.getDate() + (7 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyReports = await prisma.laporanKegiatan.findMany({
      where: {
        fasilitatorId,
        date: { gte: startOfWeek, lte: endOfWeek }
      }
    });

    const reqTransportDarat = parseFloat(data.biayaTransport) || 0;
    
    const sameDayReports = weeklyReports.filter(lap => {
      const d = new Date(lap.date);
      return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
    });

    const hasTransportDaratToday = sameDayReports.some(lap => (lap.biayaTransport || 0) > 0);
    let finalReqTransportDarat = reqTransportDarat;
    if (hasTransportDaratToday) {
      finalReqTransportDarat = 0;
    }

    const maxPlafon = fasil?.besaranTransport ?? 120000;
    const batasTanpaNota = (fasil?.jarakPPKm && fasil.jarakPPKm > 0) ? Math.round((fasil.jarakPPKm / 10) * 13900) : 0;

    if (finalReqTransportDarat > maxPlafon) {
      return {
        error: `Biaya transport darat (Rp ${Math.round(finalReqTransportDarat).toLocaleString('id-ID')}) melebihi batas maksimal yang diatur admin (Rp ${maxPlafon.toLocaleString('id-ID')}/sesi).`
      };
    }

    if (finalReqTransportDarat > batasTanpaNota && !data.buktiTransportDarat) {
      return {
        error: `Bukti struk BBM atau receipt transportasi online wajib dilampirkan karena biaya transport darat (Rp ${Math.round(finalReqTransportDarat).toLocaleString('id-ID')}) melebihi batas tanpa nota${batasTanpaNota > 0 ? ` (Rp ${batasTanpaNota.toLocaleString('id-ID')})` : ''}.`
      };
    }

    let grantedTransportDarat = finalReqTransportDarat;
    if (!data.buktiTransportDarat) {
      // Jika tanpa bukti nota, dibatasi oleh batas tanpa nota
      grantedTransportDarat = Math.min(finalReqTransportDarat, batasTanpaNota);
    } else {
      // Jika ada bukti nota, dibatasi oleh plafon maksimal
      grantedTransportDarat = Math.min(finalReqTransportDarat, maxPlafon);
    }

    const hasTransportLautToday = sameDayReports.some(lap => (lap.biayaTransportLaut || 0) > 0);
    let grantedTransportLaut = parseFloat(data.biayaTransportLaut) || 0;
    if (hasTransportLautToday) {
      grantedTransportLaut = 0;
    }

    if (data.metodePelaksanaan === 'DARING') {
      grantedTransportDarat = 0;
      grantedTransportLaut = 0;
    }

    // Pengecekan kuota mingguan per fasilitator
    const totalIntraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPIntra, 0);
    const totalEkstraUsed = weeklyReports.reduce((sum, lap) => sum + lap.jumlahJPEkstra, 0);
    const maxIntra = Math.max(fasil?.defaultJPIntra ?? 8, 16);
    const maxEkstra = Math.max(fasil?.defaultJPEkstra ?? 4, 12);
    
    if (reqJpIntra > 0 && (totalIntraUsed + reqJpIntra > maxIntra)) {
      return { 
        error: `Kuota Intrakurikuler Anda minggu ini (${maxIntra} JP) sudah terisi ${totalIntraUsed} JP. Jika ini laporan untuk minggu/sesi lain, mohon ubah 'Tanggal Kegiatan' di atas sesuai tanggal sesi yang sebenarnya.` 
      };
    }
    if (reqJpEkstra > 0 && (totalEkstraUsed + reqJpEkstra > maxEkstra)) {
      return { 
        error: `Kuota Ekstrakurikuler Anda minggu ini (${maxEkstra} JP) sudah terisi ${totalEkstraUsed} JP. Jika ini laporan untuk minggu/sesi lain, mohon ubah 'Tanggal Kegiatan' di atas sesuai tanggal sesi yang sebenarnya.` 
      };
    }

    const laporan = await prisma.laporanKegiatan.create({
      data: {
        fasilitatorId,
        date: new Date(data.date),
        topic: data.topic || 'Kegiatan Pembelajaran',
        attendance: parseInt(data.attendance) || 0,
        evaluation: data.evaluation || null,
        tingkatSekolah: data.tingkatSekolah || 'SMP',
        metodePelaksanaan: data.metodePelaksanaan || 'LURING',
        jumlahJPIntra: reqJpIntra,
        jumlahJPEkstra: reqJpEkstra,
        biayaTransport: grantedTransportDarat,
        reqBiayaTransport: Math.round(reqTransportDarat),
        biayaTransportLaut: grantedTransportLaut,
        foto1: data.foto1 || null,
        fileLaporanFisik: data.fileLaporanFisik || null,
        foto2: data.foto2 || null,
        buktiTransportDarat: data.buktiTransportDarat || null,
        buktiTiketTransport: data.buktiTiketTransport || null,
        statusTransport: 'PENDING',
      }
    });

    try {
      const { getAdminNotificationEmailHtml } = require('@/lib/email-templates');
      const { sendEmail } = require('@/lib/email');
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { email: true }
      });
      const adminEmails = admins.map(a => a.email).filter(Boolean);

      if (adminEmails.length > 0) {
        const dateStr = new Date(laporan.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const hasTransport = ((laporan.biayaTransport || 0) > 0) || ((laporan.biayaTransportLaut || 0) > 0);
        const transportTotal = (laporan.biayaTransport || 0) + (laporan.biayaTransportLaut || 0);

        for (const email of adminEmails) {
          await sendEmail({
            to: email as string,
            subject: '🚨 Laporan Baru: ' + (fasil?.namaLengkap || 'Fasilitator'),
            html: getAdminNotificationEmailHtml(fasil?.namaLengkap || 'Fasilitator', dateStr, laporan.topic, hasTransport, transportTotal)
          });
        }
      }
    } catch (err) {
      console.error('Failed to notify admins:', err);
    }

    revalidatePath('/portal');
    revalidatePath('/dashboard-rab');
    return { success: true, id: laporan.id };
  } catch (err: any) {
    console.error('Error in submitLaporanKegiatan:', err);
    return { error: err.message || 'Terjadi kesalahan sistem saat mengirim laporan kegiatan.' };
  }
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

export async function updateLaporanKegiatan(laporanId: string, data: {
  date?: string | Date;
  topic?: string;
  attendance?: number;
  evaluation?: string;
  tingkatSekolah?: string;
  metodePelaksanaan?: string;
  jumlahJPIntra?: number;
  jumlahJPEkstra?: number;
  biayaTransport?: number;
  biayaTransportLaut?: number;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Unauthorized: Harap login terlebih dahulu' };
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return { error: 'Forbidden: Hanya Admin yang dapat mengedit laporan kegiatan' };
    }

    const lap = await prisma.laporanKegiatan.findUnique({
      where: { id: laporanId },
      include: { fasilitator: true }
    });
    if (!lap) return { error: 'Laporan tidak ditemukan' };

    const updateData: any = {};
    if (data.date) updateData.date = new Date(data.date);
    if (data.topic !== undefined) updateData.topic = data.topic;
    if (data.attendance !== undefined) updateData.attendance = Number(data.attendance) || 0;
    if (data.evaluation !== undefined) updateData.evaluation = data.evaluation;
    if (data.tingkatSekolah !== undefined) updateData.tingkatSekolah = data.tingkatSekolah;
    if (data.metodePelaksanaan !== undefined) updateData.metodePelaksanaan = data.metodePelaksanaan;
    if (data.jumlahJPIntra !== undefined) updateData.jumlahJPIntra = Number(data.jumlahJPIntra) || 0;
    if (data.jumlahJPEkstra !== undefined) updateData.jumlahJPEkstra = Number(data.jumlahJPEkstra) || 0;
    if (data.biayaTransport !== undefined) updateData.biayaTransport = Number(data.biayaTransport) || 0;
    if (data.biayaTransportLaut !== undefined) updateData.biayaTransportLaut = Number(data.biayaTransportLaut) || 0;

    const updated = await prisma.laporanKegiatan.update({
      where: { id: laporanId },
      data: updateData
    });

    revalidatePath('/fasilitator/laporan');
    revalidatePath('/fasilitator/rekap-honor');
    revalidatePath('/dashboard-rab');
    revalidatePath('/portal');
    revalidatePath('/', 'layout');

    return { success: true, data: updated };
  } catch (err: any) {
    console.error('Error in updateLaporanKegiatan:', err);
    return { error: err.message || 'Gagal memperbarui laporan kegiatan' };
  }
}


export async function deleteExpense(id: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return { error: authError };
  /* deleteExpense_auth */
  try {
    await prisma.expenseRequest.delete({ where: { id } });
    revalidatePath('/dashboard-rab');
    revalidatePath('/pengeluaran');
    revalidatePath('/laporan-pengeluaran');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus pengeluaran' };
  }
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


export async function getLaporanPengeluaran(startDate?: string, endDate?: string, categoryId?: string) {
  const where: any = {
    status: 'APPROVED'
  };
  
  if (categoryId) {
    where.rabItem = { categoryId };
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    where.date = { gte: new Date(startDate) };
  } else if (endDate) {
    where.date = { lte: new Date(endDate) };
  }

  const expenses = await prisma.expenseRequest.findMany({
    where,
    include: {
      rabItem: {
        include: {
          category: true
        }
      },
      fasilitator: true,
      kwitansiRecord: true,
      invoiceRecord: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  return expenses;
}

// ==================== APP SETTINGS ====================

export async function getAppSetting(key: string, defaultValue: string) {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting ? setting.value : defaultValue;
}

export async function updateAppSetting(key: string, value: string, label?: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) throw new Error(authError);

  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value, label: label || null },
    create: { key, value, label: label || null }
  });
  revalidatePath('/snt-akun');
  return setting;
}

export async function updateBulkFasilitatorTransportSettings(data: { id: string, jarakPPKm: number, besaranTransport: number }[]) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) throw new Error(authError);

  for (const item of data) {
    await prisma.fasilitator.update({
      where: { id: item.id },
      data: {
        jarakPPKm: item.jarakPPKm,
        besaranTransport: item.besaranTransport
      }
    });
  }
  revalidatePath('/snt-akun');
}

export async function updateExpense(
  id: string, 
  data: {
    rabItemId: string,
    amount: number,
    description: string,
    fasilitatorId?: string,
    date?: Date,
    receiptUrl?: string
  }
) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return { error: authError };

  const expense = await prisma.expenseRequest.findUnique({
    where: { id }
  });

  if (!expense) return { error: 'Expense not found' };

  try {
    const updated = await prisma.expenseRequest.update({
      where: { id },
      data: {
        rabItemId: data.rabItemId,
        amount: data.amount,
        description: data.description,
        fasilitatorId: data.fasilitatorId || null,
        ...(data.date ? { date: data.date } : {}),
        ...(data.receiptUrl ? { receiptUrl: data.receiptUrl, paymentReceiptUrl: data.receiptUrl } : {})
      },
      include: {
        rabItem: true,
        fasilitator: true
      }
    });

    revalidatePath('/dashboard-rab');
    revalidatePath('/laporan-pengeluaran');
    revalidatePath('/pengeluaran');
    return { success: true, expense: updated };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createRabCategory(name: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) return { error: authError };

  const project = await prisma.rabProject.findFirst();
  if (!project) return { error: 'Project RAB tidak ditemukan' };

  try {
    const cat = await prisma.rabCategory.create({
      data: {
        name,
        projectId: project.id
      }
    });
    revalidatePath('/dashboard-rab');
    return { success: true, category: cat };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createRabItem(data: {
  categoryId: string,
  code: string,
  name: string,
  volume?: string,
  unitPrice?: number,
  totalBudget: number
}) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) return { error: authError };

  try {
    const category = await prisma.rabCategory.findUnique({
      where: { id: data.categoryId },
      include: { project: true }
    });
    if (!category) return { error: 'Kategori RAB tidak ditemukan' };

    const item = await prisma.rabItem.create({
      data: {
        categoryId: data.categoryId,
        code: data.code,
        name: data.name,
        volume: data.volume || null,
        unitPrice: Number(data.unitPrice) || 0,
        totalBudget: Number(data.totalBudget) || 0
      }
    });

    if (category.project) {
      const allItems = await prisma.rabItem.findMany({
        where: { category: { projectId: category.project.id } }
      });
      const newTotal = allItems.reduce((sum, it) => sum + it.totalBudget, 0);
      await prisma.rabProject.update({
        where: { id: category.project.id },
        data: { totalBudget: newTotal }
      });
    }

    revalidatePath('/dashboard-rab');
    revalidatePath('/pengeluaran');
    revalidatePath('/laporan-pengeluaran');
    return { success: true, item };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateRabItem(
  id: string,
  data: {
    code?: string,
    name?: string,
    volume?: string,
    unitPrice?: number,
    totalBudget?: number,
    categoryId?: string
  }
) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'KORWIL']);
  if (authError) return { error: authError };

  try {
    const item = await prisma.rabItem.findUnique({
      where: { id },
      include: { category: { include: { project: true } } }
    });
    if (!item) return { error: 'Item RAB tidak ditemukan' };

    const updated = await prisma.rabItem.update({
      where: { id },
      data: {
        ...(data.code ? { code: data.code } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.volume !== undefined ? { volume: data.volume } : {}),
        ...(data.unitPrice !== undefined ? { unitPrice: Number(data.unitPrice) } : {}),
        ...(data.totalBudget !== undefined ? { totalBudget: Number(data.totalBudget) } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {})
      }
    });

    const projectId = item.category?.project?.id;
    if (projectId) {
      const allItems = await prisma.rabItem.findMany({
        where: { category: { projectId } }
      });
      const newTotal = allItems.reduce((sum, it) => sum + it.totalBudget, 0);
      await prisma.rabProject.update({
        where: { id: projectId },
        data: { totalBudget: newTotal }
      });
    }

    revalidatePath('/dashboard-rab');
    revalidatePath('/pengeluaran');
    revalidatePath('/laporan-pengeluaran');
    return { success: true, item: updated };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteRabItem(id: string) {
  const { error: authError } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError) return { error: authError };

  try {
    const item = await prisma.rabItem.findUnique({
      where: { id },
      include: { expenses: true, category: { include: { project: true } } }
    });
    if (!item) return { error: 'Item RAB tidak ditemukan' };

    if (item.expenses.length > 0) {
      return { error: 'Tidak dapat menghapus item RAB yang sudah memiliki riwayat pengeluaran.' };
    }

    const projectId = item.category?.project?.id;
    await prisma.rabItem.delete({ where: { id } });

    if (projectId) {
      const allItems = await prisma.rabItem.findMany({
        where: { category: { projectId } }
      });
      const newTotal = allItems.reduce((sum, it) => sum + it.totalBudget, 0);
      await prisma.rabProject.update({
        where: { id: projectId },
        data: { totalBudget: newTotal }
      });
    }

    revalidatePath('/dashboard-rab');
    revalidatePath('/pengeluaran');
    revalidatePath('/laporan-pengeluaran');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }

}
