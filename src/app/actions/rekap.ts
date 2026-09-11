"use server";
import { sendEmail } from '@/lib/email';
import { getTransportLunasEmailHtml, getHonorLunasEmailHtml } from '@/lib/email-templates';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth } from '@/lib/auth-check';


export async function getAvailableMonths(fasilitatorId: string) {
  const laporan = await prisma.laporanKegiatan.findMany({
    where: { fasilitatorId },
    select: { date: true, rekapHonorariumId: true }
  });

  const monthsMap = new Map<string, { total: number, unbilled: number }>();
  
  for (const lap of laporan) {
    const d = new Date(lap.date);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthsMap.has(monthStr)) {
      monthsMap.set(monthStr, { total: 0, unbilled: 0 });
    }
    const current = monthsMap.get(monthStr)!;
    current.total += 1;
    if (!lap.rekapHonorariumId) {
      current.unbilled += 1;
    }
  }

  return Array.from(monthsMap.entries()).map(([month, data]) => ({
    month,
    ...data
  })).sort((a, b) => b.month.localeCompare(a.month));
}

export async function createRekapBulanan(fasilitatorId: string, bulan: string) {
  // bulan = 'YYYY-MM'
  const [year, month] = bulan.split('-');
  
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  // Cari semua laporan di bulan ini yang belum direkap
  const laporan = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitatorId,
      rekapHonorariumId: null,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  if (laporan.length === 0) {
    throw new Error('Tidak ada laporan yang bisa direkap untuk bulan ini');
  }

  const totalJP = laporan.reduce((sum, lap) => sum + (lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0), 0);
  const totalHonor = totalJP * 65000;

  const rekap = await prisma.rekapHonorarium.create({
    data: {
      fasilitatorId,
      bulan,
      totalJP,
      totalHonor,
      status: 'DRAFT',
    }
  });

  // Hubungkan laporan ke rekap
  await prisma.laporanKegiatan.updateMany({
    where: {
      id: { in: laporan.map(l => l.id) }
    },
    data: {
      rekapHonorariumId: rekap.id
    }
  });

  revalidatePath('/portal/rekap');
  return rekap;
}

export async function submitRekapBulanan(rekapId: string, fileUrl: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true }
  });

  if (!rekap) throw new Error('Rekap tidak ditemukan');



  const updated = await prisma.rekapHonorarium.update({
    where: { id: rekapId },
    data: {
      filePdf: fileUrl,
      status: 'SUBMITTED'
    }
  });

  revalidatePath('/portal/rekap');
  revalidatePath('/dashboard-rab');
  return updated;
}



export async function getAdminTransportRecap() {
  const laporanList = await prisma.laporanKegiatan.findMany({
    where: {
      OR: [
        { biayaTransport: { gt: 0 } },
        { biayaTransportLaut: { gt: 0 } }
      ],
      statusTransport: 'PENDING'
    },
    include: {
      fasilitator: true
    },
    orderBy: { date: 'asc' }
  });

  return laporanList;
}

export async function markTransportPaid(laporanId: string, buktiUrl: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const lap = await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: { 
      statusTransport: 'PAID',
      buktiTransferTransport: buktiUrl 
    }
  });

  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Bantuan Sewa Rumah Fasilitator', mode: 'insensitive' } }
  });

  if (rabItem) {
    await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: (lap.biayaTransport || 0) + (lap.biayaTransportLaut || 0),
        description: `Transport Mengajar Fasilitator - ${lap.topic}`,
        receiptUrl: buktiUrl,
        status: 'APPROVED',
        createdById: userId,
        fasilitatorId: lap.fasilitatorId,
      }
    });
  }

  revalidatePath('/fasilitator/transport');
}

export async function adminGenerateInvoiceHonor(rekapId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'unknown';

  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true }
  });

  if (!rekap) throw new Error('Rekap tidak ditemukan');
  
  if (rekap.status === 'APPROVED') {
    return rekap; // Already approved
  }

  const rabItem = await prisma.rabItem.findFirst({
    where: { name: { contains: 'Honor', mode: 'insensitive' } }
  });

  if (rabItem) {
    await prisma.expenseRequest.create({
      data: {
        rabItemId: rabItem.id,
        amount: rekap.totalHonor,
        description: `Honor Pengajar - Bulan ${rekap.bulan} (${rekap.totalJP} JP)`,
        receiptUrl: rekap.filePdf,
        status: 'PENDING',
        createdById: userId,
        fasilitatorId: rekap.fasilitatorId,
      }
    });
  }

  const updated = await prisma.rekapHonorarium.update({
    where: { id: rekapId },
    data: {
      status: 'APPROVED'
    }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/dashboard-rab');
  return updated;
}

export async function cancelTransportPaid(laporanId: string) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
  if (authError || !session?.user?.id) throw new Error('Unauthorized');

  const lap = await prisma.laporanKegiatan.findUnique({
    where: { id: laporanId }
  });

  if (!lap) throw new Error('Laporan tidak ditemukan');

  if (lap.statusTransport === 'PAID') {
    // Attempt to delete associated expense request if any
    if (lap.buktiTransferTransport) {
      await prisma.expenseRequest.deleteMany({
        where: {
          fasilitatorId: lap.fasilitatorId,
          receiptUrl: lap.buktiTransferTransport,
          description: { contains: 'Transport Mengajar' }
        }
      });
    }

    await prisma.laporanKegiatan.update({
      where: { id: laporanId },
      data: {
        statusTransport: 'PENDING',
        buktiTransferTransport: null
      }
    });

    revalidatePath('/', 'layout');
    return { success: true };
  }
  return { error: 'Status bukan PAID' };
}
