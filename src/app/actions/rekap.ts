"use server";
import { sendEmail } from '@/lib/email';
import { getTransportLunasEmailHtml, getHonorLunasEmailHtml } from '@/lib/email-templates';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth } from '@/lib/auth-check';
import { hitungTotalTransportRekap } from '@/lib/transport';


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

  const totalJPIntra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPIntra || 0), 0);
  const totalJPEkstra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPEkstra || 0), 0);
  const totalJP = totalJPIntra + totalJPEkstra;
  const totalHonor = totalJP * 65000;

  const rekap = await prisma.rekapHonorarium.create({
    data: {
      fasilitatorId,
      bulan,
      totalJP,
      totalJPIntra,
      totalJPEkstra,
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


export async function createRekapManual(fasilitatorId: string, bulan: string, totalJP: number, totalHonor: number, jumlahSesi: number, totalJPIntra?: number, totalJPEkstra?: number) {
  const session = await getServerSession(authOptions);
  
  // Create RekapHonorarium directly with SUBMITTED status
  // so admin can generate invoice immediately.
  const rekap = await prisma.rekapHonorarium.create({
    data: {
      fasilitatorId,
      bulan,
      totalJP,
      totalJPIntra: totalJPIntra || 0,
      totalJPEkstra: totalJPEkstra || 0,
      jumlahSesi,
      totalHonor,
      status: 'SUBMITTED',
    }
  });

  // Otomatis tautkan laporan mingguan pada bulan ini yang belum tertaut
  const [y, m] = bulan.split('-');
  const startDate = new Date(parseInt(y), parseInt(m) - 1, 1);
  const endDate = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);

  await prisma.laporanKegiatan.updateMany({
    where: {
      fasilitatorId,
      date: { gte: startDate, lte: endDate },
      rekapHonorariumId: null
    },
    data: {
      rekapHonorariumId: rekap.id
    }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/portal/rekap');
  return rekap;
}


export async function deleteRekap(id: string) {
  const session = await getServerSession(authOptions);
  
  const rekap = await prisma.rekapHonorarium.findUnique({ where: { id } });
  if (!rekap) throw new Error('Rekap tidak ditemukan');

  // Unlink LaporanKegiatan if any
  await prisma.laporanKegiatan.updateMany({
    where: { rekapHonorariumId: id },
    data: { rekapHonorariumId: null }
  });

  // Delete ExpenseRequest if any
  await prisma.expenseRequest.deleteMany({
    where: { receiptUrl: rekap.filePdf } // the only way we linked them previously
  });

  await prisma.rekapHonorarium.delete({
    where: { id }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/portal/rekap');
}




export async function generateKwitansiHonor(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };

  // Check if it already exists locally
  const existing = await prisma.kwitansiRecord.findFirst({ where: { rekapId, tipeKwitansi: 'HONOR' } });
  
  // Get the rekap
  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true }
  });
  
  if (!rekap) return { error: "Rekap not found" };
  
  const perihal = `Honorarium Fasilitator ${rekap.fasilitator.namaLengkap} - Bulan ${rekap.bulan}`;
  
  // If we already have a record and the user is NOT providing new inputs to overwrite, return existing.
  // But wait, the user wants to input it. If they input it, they expect a new number!
  // So if inputNoUrut is provided, we should probably ignore 'existing' check and fetch a new one?
  // Let's just always call webhook if they provide inputs, or return existing if not.
  let finalNoUrut = inputNoUrut || "";
  if (!inputNoUrut) {
    if (existing) {
      if (existing.noKwitansi.includes('TEMP') || existing.noKwitansi === "") {
        finalNoUrut = existing.noUrut.toString().padStart(3, '0');
      } else {
        return JSON.parse(JSON.stringify(existing));
      }
    } else {
      const lastRecord = await prisma.kwitansiRecord.findFirst({ orderBy: { noUrut: 'desc' } });
      finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
    }
  }

  // Call Google Apps Script Webhook
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  const noUrut = finalNoUrut;
  const d = inputTanggal ? new Date(inputTanggal) : new Date();
  const tanggalFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ perihal, noUrut: noUrut, tanggal: tanggalFormatted }),
      redirect: 'follow',
    });
    
    console.log('[KwitansiHonor] Response status:', response.status, 'redirected:', response.redirected);
    
    const responseText = await response.text();
    console.log('[KwitansiHonor] Raw response:', responseText.substring(0, 500));
    
    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[KwitansiHonor] Failed to parse JSON:', parseErr);
      return { error: "Gagal parse response dari Google Sheets. Response: " + responseText.substring(0, 200) };
    }
    
    if (result.error) {
      return { error: result.error };
    }
    
    let noKwitansiSheet = result.noSeri || result.noKwitansi || '';
    console.log('[KwitansiHonor] noKwitansiSheet:', noKwitansiSheet);
    
    if (!noKwitansiSheet) {
      const parts = tanggalFormatted.split('/');
      if (parts.length === 3) {
        noKwitansiSheet = `KWC/MTC/${parts[2]}.${parts[1]}.${parts[0]}.${noUrut.toString().padStart(3, '0')}`;
        console.log('[KwitansiHonor] Constructed manually:', noKwitansiSheet);
      } else {
        noKwitansiSheet = 'KWT/TEMP/' + Date.now();
      }
    }
    
    const checkConflict = await prisma.kwitansiRecord.findUnique({ where: { noKwitansi: noKwitansiSheet } });
    if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
      noKwitansiSheet = noKwitansiSheet + '-' + Math.floor(Math.random() * 10000);
    }
    
    // Save to local database
    let kwitansi;
    if (existing) {
      kwitansi = await prisma.kwitansiRecord.update({
        where: { id: existing.id },
        data: {
          noKwitansi: noKwitansiSheet,
          tanggal: d
        }
      });
    } else {
      kwitansi = await prisma.kwitansiRecord.create({
        data: {
          noKwitansi: noKwitansiSheet,
          perihal: perihal,
          nominal: rekap.totalHonor,
          rekapId: rekap.id,
          tanggal: d
        }
      });
    }
    
    console.log('[KwitansiHonor] Saved:', kwitansi.id, kwitansi.noKwitansi);
    return JSON.parse(JSON.stringify(kwitansi));
    
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return { error: "Gagal mengambil nomor kwitansi dari Google Sheets: " + error.message };
  }

  } catch (error: any) {
    console.error('Error in generateKwitansiHonor:', error);
    return { error: error.message || 'Unknown error in generateKwitansiHonor' };
  }
}

export async function generateKwitansiExpense(expenseId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };

    const existing = await prisma.kwitansiRecord.findFirst({ where: { expenseId } });

    const expense = await prisma.expenseRequest.findUnique({
      where: { id: expenseId },
      include: { rabItem: true, fasilitator: true }
    });

    if (!expense) return { error: "Expense not found" };

    const perihal = `${expense.description} - ${expense.rabItem.name}`;

    let finalNoUrut = inputNoUrut || "";
    if (!inputNoUrut) {
      if (existing) {
        if (existing.noKwitansi.includes('TEMP') || existing.noKwitansi === "") {
          finalNoUrut = existing.noUrut.toString().padStart(3, '0');
        } else {
          return JSON.parse(JSON.stringify(existing));
        }
      } else {
        const lastRecord = await prisma.kwitansiRecord.findFirst({ orderBy: { noUrut: 'desc' } });
        finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
      }
    }

    const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
    const noUrut = finalNoUrut;
    const d = inputTanggal ? new Date(inputTanggal) : new Date();
    const tanggalFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

    console.log('[KwitansiExpense] Calling webhook with:', { perihal, noUrut, tanggal: tanggalFormatted });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted }),
        redirect: 'follow',
      });

      console.log('[KwitansiExpense] Response status:', response.status, 'redirected:', response.redirected, 'url:', response.url);

      const responseText = await response.text();
      console.log('[KwitansiExpense] Raw response text:', responseText.substring(0, 500));

      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[KwitansiExpense] Failed to parse JSON response:', parseErr);
        return { error: "Gagal parse response dari Google Sheets. Response: " + responseText.substring(0, 200) };
      }

      console.log('[KwitansiExpense] Parsed result:', JSON.stringify(result));

      if (result.error) {
        return { error: result.error };
      }

      let noKwitansiSheet = result.noSeri || result.noKwitansi || '';
      console.log('[KwitansiExpense] noKwitansiSheet extracted:', noKwitansiSheet);

      if (!noKwitansiSheet) {
        // Fallback: construct it manually if Apps Script returned empty string due to formula calculation delay
        const parts = tanggalFormatted.split('/'); // DD/MM/YYYY
        if (parts.length === 3) {
          noKwitansiSheet = `KWC/MTC/${parts[2]}.${parts[1]}.${parts[0]}.${noUrut.toString().padStart(3, '0')}`;
          console.log('[KwitansiExpense] Constructed manually:', noKwitansiSheet);
        } else {
          noKwitansiSheet = 'KWT/TEMP/' + Date.now();
        }
      }

      const checkConflict = await prisma.kwitansiRecord.findUnique({ where: { noKwitansi: noKwitansiSheet } });
      if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
        noKwitansiSheet = noKwitansiSheet + '-' + Math.floor(Math.random() * 10000);
      }

      let kwitansi;
      if (existing) {
        kwitansi = await prisma.kwitansiRecord.update({
          where: { id: existing.id },
          data: { noKwitansi: noKwitansiSheet, tanggal: d }
        });
      } else {
        kwitansi = await prisma.kwitansiRecord.create({
          data: {
            noKwitansi: noKwitansiSheet,
            perihal,
            nominal: expense.amount,
            expenseId: expense.id,
            tanggal: d
          }
        });
      }
      console.log('[KwitansiExpense] Saved kwitansi:', kwitansi.id, 'noKwitansi:', kwitansi.noKwitansi);
      return JSON.parse(JSON.stringify(kwitansi));
    } catch (error: any) {
      console.error("[KwitansiExpense] Webhook Error:", error);
      return { error: "Gagal mengambil nomor kwitansi dari Google Sheets: " + error.message };
    }
  } catch (error: any) {
    console.error('[KwitansiExpense] Error:', error);
    return { error: error.message || 'Unknown error in generateKwitansiExpense' };
  }
}


export async function generateKwitansiTransportBulanan(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };

  const existing = await prisma.kwitansiRecord.findFirst({
    where: { rekapId, tipeKwitansi: 'TRANSPORT' }
  });
  
  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId },
    include: { fasilitator: true, laporan: true }
  });
  
  if (!rekap) return { error: "Rekap tidak ditemukan" };
  
  // Calculate total transport with proper receipt + standard breakdown
  const totalTransport = hitungTotalTransportRekap(rekap);

  if (totalTransport <= 0) return { error: "Total transport adalah 0, tidak bisa generate kwitansi." };
  
  const perihal = "Transport Mengajar Fasilitator - Bulan ";
  
  let finalNoUrut = inputNoUrut || "";
  if (!inputNoUrut) {
    if (existing) {
      if (existing.noKwitansi.includes('TEMP') || existing.noKwitansi === "") {
        finalNoUrut = existing.noUrut.toString().padStart(3, '0');
      } else {
        return JSON.parse(JSON.stringify(existing));
      }
    } else {
      const lastRecord = await prisma.kwitansiRecord.findFirst({ orderBy: { noUrut: 'desc' } });
      finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
    }
  }
  
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  const noUrut = finalNoUrut;
  const d = inputTanggal ? new Date(inputTanggal) : new Date();
  const tanggalFormatted = ``//``;
  
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted }),
      redirect: 'follow',
    });
    
    console.log('[TransportBulanan] Response status:', response.status);
    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[TransportBulanan] Failed to parse:', e);
      return { error: "Gagal parse response: " + responseText.substring(0, 100) };
    }
    
    if (result.error) return { error: result.error };
    
    let noKwitansiSheet = result.noSeri || result.noKwitansi || '';
    if (!noKwitansiSheet) {
      const parts = tanggalFormatted.split('/');
      if (parts.length === 3) {
        noKwitansiSheet = `KWC/MTC/${parts[2]}.${parts[1]}.${parts[0]}.${noUrut.toString().padStart(3, '0')}`;
      } else {
        noKwitansiSheet = 'KWT/TEMP/' + Date.now();
      }
    }
    const checkConflict = await prisma.kwitansiRecord.findUnique({ where: { noKwitansi: noKwitansiSheet } });
    if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
      noKwitansiSheet = noKwitansiSheet + '-' + Math.floor(Math.random() * 10000);
    }

    
    let kwitansi;
    if (existing) {
      kwitansi = await prisma.kwitansiRecord.update({
        where: { id: existing.id },
        data: { noKwitansi: noKwitansiSheet, tanggal: d, nominal: totalTransport }
      });
    } else {
      kwitansi = await prisma.kwitansiRecord.create({
        data: {
          noKwitansi: noKwitansiSheet,
          perihal,
          nominal: totalTransport,
          rekapId: rekap.id,
          tanggal: d,
          tipeKwitansi: 'TRANSPORT'
        }
      });
    }
    return JSON.parse(JSON.stringify(kwitansi));
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return { error: "Gagal mengambil nomor kwitansi dari Google Sheets: " + error.message };
  }

  } catch (error: any) {
    console.error('Error in generateKwitansiTransportBulanan:', error);
    return { error: error.message || 'Unknown error in generateKwitansiTransportBulanan' };
  }
}

export async function generateInvoiceExpense(expenseId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };

    const existing = await prisma.invoiceRecord.findFirst({ where: { expenseId } });
    
    const expense = await prisma.expenseRequest.findUnique({
      where: { id: expenseId },
      include: { rabItem: true, fasilitator: true }
    });
    
    if (!expense) return { error: "Expense not found" };
    
    const perihal = `${expense.description} - ${expense.rabItem.name}`;
    
    let finalNoUrut = inputNoUrut || "";
    if (!inputNoUrut) {
      if (existing) {
        if (existing.noInvoice.includes('TEMP') || existing.noInvoice === "") {
          finalNoUrut = existing.noUrut.toString().padStart(3, '0');
        } else {
          return JSON.parse(JSON.stringify(existing));
        }
      } else {
        const lastRecord = await prisma.invoiceRecord.findFirst({ orderBy: { noUrut: 'desc' } });
        finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
      }
    }

    const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
    const noUrut = finalNoUrut;
    const d = inputTanggal ? new Date(inputTanggal) : new Date();
    const tanggalFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    
    
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted, sheetName: 'Invoice' }),
          redirect: 'follow',
        });
        
        console.log('[InvoiceExpense] Response status:', response.status);
        const responseText = await response.text();
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('[InvoiceExpense] Failed to parse:', e);
          return { error: "Gagal parse response: " + responseText.substring(0, 100) };
        }
        
        if (result.error) return { error: result.error };
        
        let noInvoiceSheet = result.noInvoice || result.noSeri || result.noKwitansi || '';
        if (!noInvoiceSheet) {
          const parts = tanggalFormatted.split('/');
          if (parts.length === 3) {
            noInvoiceSheet = `INV/MTC/${parts[2]}.${parts[1]}.${parts[0]}.${noUrut.toString().padStart(3, '0')}`;
          } else {
            noInvoiceSheet = 'INV/TEMP/' + Date.now();
          }
        }
        const checkConflict = await prisma.invoiceRecord.findUnique({ where: { noInvoice: noInvoiceSheet } });
        if (checkConflict && (!existing || checkConflict.id !== existing.id)) {
          noInvoiceSheet = noInvoiceSheet + '-' + Math.floor(Math.random() * 10000);
        }

      
      let inv;
      if (existing) {
        inv = await prisma.invoiceRecord.update({
          where: { id: existing.id },
          data: { noInvoice: noInvoiceSheet, tanggal: d }
        });
      } else {
        inv = await prisma.invoiceRecord.create({
          data: {
            noInvoice: noInvoiceSheet,
            perihal,
            nominal: expense.amount,
            expenseId: expense.id,
            tanggal: d
          }
        });
      }
      return JSON.parse(JSON.stringify(inv));
      
    } catch (error: any) {
      console.error("Webhook Error:", error);
      return { error: "Gagal mengambil nomor invoice dari Google Sheets: " + error.message };
    }
  } catch (error: any) {
    console.error('Error in generateInvoiceExpense:', error);
    return { error: error.message || 'Unknown error in generateInvoiceExpense' };
  }
}


export async function uploadBuktiRekap(rekapId: string, urlHonor?: string, urlTransport?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error('Unauthorized');
    
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!currentUser) throw new Error('User not found');

    const rekap = await prisma.rekapHonorarium.findUnique({
      where: { id: rekapId },
      include: { fasilitator: true, laporan: true }
    });
    
    if (!rekap) throw new Error("Rekap tidak ditemukan");

    // Lakukan update URL bukti di RekapHonorarium
    const updateData: any = {};
    if (urlHonor) updateData.buktiPembayaranHonor = urlHonor;
    if (urlTransport) updateData.buktiPembayaranTransport = urlTransport;
    
    await prisma.rekapHonorarium.update({
      where: { id: rekapId },
      data: updateData
    });

    // Otomatis buat Pengeluaran Lapangan (ExpenseRequest) untuk memotong RAB
    // 1. Potong RAB Honorarium Fasilitator Koding & KA
    if (urlHonor) {
      const honorRabItem = await prisma.rabItem.findFirst({
        where: { name: { contains: 'Fasilitator Koding & KA', mode: 'insensitive' } }
      });
      
      if (honorRabItem) {
        // Cek apakah sudah pernah dipotong
        const descText = `Honorarium ${rekap.fasilitator.namaLengkap} - Bulan ${rekap.bulan} (RekapID: ${rekap.id})`;
        const existingExpense = await prisma.expenseRequest.findFirst({
          where: { description: descText }
        });
        
        if (!existingExpense) {
          await prisma.expenseRequest.create({
            data: {
              rabItemId: honorRabItem.id,
              amount: rekap.totalHonor,
              description: descText,
              paymentReceiptUrl: urlHonor,
              status: 'APPROVED',
              createdById: currentUser.id,
              approvedById: currentUser.id,
              fasilitatorId: rekap.fasilitatorId,
              date: new Date()
            }
          });
        } else {
          // Update receipt url if it already existed
          await prisma.expenseRequest.update({
            where: { id: existingExpense.id },
            data: { paymentReceiptUrl: urlHonor }
          });
        }
      }
    }

    // 2. Potong RAB Sewa Rumah untuk Transport
    if (urlTransport) {
      const totalTransport = hitungTotalTransportRekap(rekap);
      
      if (totalTransport > 0) {
        const transportRabItem = await prisma.rabItem.findFirst({
          where: { name: { contains: 'Bantuan Sewa Rumah Fasilitator', mode: 'insensitive' } }
        });
        
        if (transportRabItem) {
          const descText = `Transportasi ${rekap.fasilitator.namaLengkap} - Bulan ${rekap.bulan} (RekapID: ${rekap.id})`;
          const existingExpense = await prisma.expenseRequest.findFirst({
            where: { description: descText }
          });
          
          if (!existingExpense) {
            await prisma.expenseRequest.create({
              data: {
                rabItemId: transportRabItem.id,
                amount: totalTransport,
                description: descText,
                paymentReceiptUrl: urlTransport,
                status: 'APPROVED',
                createdById: currentUser.id,
                approvedById: currentUser.id,
                fasilitatorId: rekap.fasilitatorId,
                date: new Date()
              }
            });
          } else {
            await prisma.expenseRequest.update({
              where: { id: existingExpense.id },
              data: { paymentReceiptUrl: urlTransport }
            });
          }
        }
      }
    }

    revalidatePath('/fasilitator/rekap-honor');
    revalidatePath('/dashboard-rab');
    return { success: true };
  } catch (error: any) {
    console.error('Error in uploadBuktiRekap:', error);
    return { error: error.message };
  }
}


export async function adminUpdateTransportAmount(laporanId: string, biayaTransport: number, biayaTransportLaut: number) {
  const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN', 'KORWIL']);
  if (authError || !session) throw new Error(authError || "Unauthorized");

  const updated = await prisma.laporanKegiatan.update({
    where: { id: laporanId },
    data: {
      biayaTransport: parseFloat(biayaTransport.toString()) || 0,
      biayaTransportLaut: parseFloat(biayaTransportLaut.toString()) || 0,
    }
  });

  revalidatePath('/fasilitator/laporan');
  return updated;
}

export async function getFasilitatorJpForMonth(fasilitatorId: string, bulan: string) {
  if (!fasilitatorId || !bulan) return { totalJPIntra: 0, totalJPEkstra: 0, sesi: 0 };
  const [year, month] = bulan.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  const laporan = await prisma.laporanKegiatan.findMany({
    where: {
      fasilitatorId,
      date: { gte: startDate, lte: endDate }
    }
  });

  const totalJPIntra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPIntra || 0), 0);
  const totalJPEkstra = laporan.reduce((sum, lap) => sum + (lap.jumlahJPEkstra || 0), 0);
  const sesi = laporan.length;

  return { totalJPIntra, totalJPEkstra, sesi };
}

export async function getRekapTargetJp(bulanTahun?: string) {
  // bulanTahun: 'YYYY-MM', default to current month
  let targetYear: number, targetMonth: number;
  if (bulanTahun) {
    const [y, m] = bulanTahun.split('-');
    targetYear = parseInt(y);
    targetMonth = parseInt(m);
  } else {
    const d = new Date();
    targetYear = d.getFullYear();
    targetMonth = d.getMonth() + 1;
  }

  const startDateBulan = new Date(targetYear, targetMonth - 1, 1);
  const endDateBulan = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // For 4 months logic (Sept - Dec 2026) -> we can just sum ALL Laporan for the "Realisasi Total"
  // Assuming the project started in Sept 2026.

  const fasilitators = await prisma.fasilitator.findMany({
    where: { isActive: true },
    orderBy: { namaLengkap: 'asc' }
  });

  // Fetch all laporan grouped by fasilitator
  const allLaporan = await prisma.laporanKegiatan.findMany({
    select: {
      fasilitatorId: true,
      date: true,
      jumlahJPIntra: true,
      jumlahJPEkstra: true
    }
  });

  const rekapData = fasilitators.map(f => {
    const targetBulan = f.targetJPBulan || 32;
    const targetTotal = f.targetJPTotal || 128;

    let realisasiBulan = 0;
    let realisasiTotal = 0;

    for (const lap of allLaporan) {
      if (lap.fasilitatorId === f.id) {
        const jp = (lap.jumlahJPIntra || 0) + (lap.jumlahJPEkstra || 0);
        realisasiTotal += jp;

        const d = new Date(lap.date);
        if (d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth) {
          realisasiBulan += jp;
        }
      }
    }

    return {
      fasilitator: f,
      targetBulan,
      realisasiBulan,
      sisaBulan: Math.max(0, targetBulan - realisasiBulan),
      targetTotal,
      realisasiTotal,
      sisaTotal: Math.max(0, targetTotal - realisasiTotal),
      persenBulan: targetBulan > 0 ? Math.round((realisasiBulan / targetBulan) * 100) : 0,
      persenTotal: targetTotal > 0 ? Math.round((realisasiTotal / targetTotal) * 100) : 0
    };
  });

  return rekapData;
}

export async function updateTargetJpFasilitator(id: string, targetBulan: number, targetTotal: number) {
  await prisma.fasilitator.update({
    where: { id },
    data: {
      targetJPBulan: targetBulan,
      targetJPTotal: targetTotal
    }
  })
}

export async function syncLaporanToRekap(rekapId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const rekap = await prisma.rekapHonorarium.findUnique({
    where: { id: rekapId }
  });

  if (!rekap) throw new Error("Rekap tidak ditemukan");

  const [y, m] = rekap.bulan.split('-');
  const startDate = new Date(parseInt(y), parseInt(m) - 1, 1);
  const endDate = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);

  const updated = await prisma.laporanKegiatan.updateMany({
    where: {
      fasilitatorId: rekap.fasilitatorId,
      date: {
        gte: startDate,
        lte: endDate
      },
      rekapHonorariumId: null
    },
    data: {
      rekapHonorariumId: rekap.id
    }
  });

  revalidatePath('/fasilitator/rekap-honor');
  revalidatePath('/portal');
  revalidatePath('/portal/rekap');
  
  return updated.count;
}

export async function generateInvoiceHonorRecord(rekapId: string, inputNoUrut?: string, inputTanggal?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Unauthorized: Anda harus login untuk melakukan aksi ini." };

    const existing = await prisma.invoiceRecord.findFirst({ where: { rekapId } });
    
    const rekap = await prisma.rekapHonorarium.findUnique({
      where: { id: rekapId },
      include: { fasilitator: true, laporan: true }
    });
    
    if (!rekap) return { error: "Rekap not found" };

    const totalTransport = hitungTotalTransportRekap(rekap);

    const totalTagihan = (rekap.totalHonor || 0) + totalTransport;
    const perihal = totalTransport > 0 
      ? `Honorarium & Transport Fasilitator ${rekap.fasilitator.namaLengkap} - Bulan ${rekap.bulan}`
      : `Honorarium Fasilitator ${rekap.fasilitator.namaLengkap} - Bulan ${rekap.bulan}`;
    
    let finalNoUrut = inputNoUrut || "";
    if (!inputNoUrut) {
      if (existing) {
        if (existing.noInvoice.includes('TEMP') || existing.noInvoice === "") {
          finalNoUrut = existing.noUrut.toString().padStart(3, '0');
        } else {
          return JSON.parse(JSON.stringify(existing));
        }
      } else {
        const lastRecord = await prisma.invoiceRecord.findFirst({ orderBy: { noUrut: 'desc' } });
        finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
      }
    }

    const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
    const noUrut = finalNoUrut;
    const d = inputTanggal ? new Date(inputTanggal) : new Date();
    const tanggalFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perihal, noUrut, tanggal: tanggalFormatted, sheetName: 'Invoice' }),
        redirect: 'follow',
      });
      
      console.log('[InvoiceHonor] Response status:', response.status);
      const responseText = await response.text();
      
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('[InvoiceHonor] Failed to parse:', e);
        return { error: "Gagal parse response: " + responseText.substring(0, 100) };
      }
      
      if (result.error) return { error: result.error };
      
      let noInvoiceSheet = result.noInvoice || result.noSeri || result.noKwitansi || '';
      if (!noInvoiceSheet) {
        const parts = tanggalFormatted.split('/');
        if (parts.length === 3) {
          noInvoiceSheet = `INV/MTC/${parts[2]}.${parts[1]}.${parts[0]}.${noUrut.toString().padStart(3, '0')}`;
        } else {
          noInvoiceSheet = 'INV/TEMP/' + Date.now();
        }
      }
      
      let invoice;
      if (existing) {
        invoice = await prisma.invoiceRecord.update({
          where: { id: existing.id },
          data: { noInvoice: noInvoiceSheet, tanggal: d, perihal: perihal, nominal: totalTagihan }
        });
      } else {
        invoice = await prisma.invoiceRecord.create({
          data: {
            noInvoice: noInvoiceSheet,
            perihal: perihal,
            nominal: totalTagihan,
            rekapId: rekap.id,
            tanggal: d
          }
        });
      }
      
      return JSON.parse(JSON.stringify(invoice));
      
    } catch (error: any) {
      return { error: "Gagal memanggil webhook: " + error.message };
    }
  } catch (error: any) {
    console.error('Error in generateInvoiceHonorRecord:', error);
    return { error: error.message || 'Unknown error' };
  }
}

export async function updateRekapTransport(rekapId: string, totalTransport: number | null) {
  try {
    const { error: authError, session } = await checkAuth(['ADMIN', 'SUPER_ADMIN']);
    if (authError || !session) return { error: authError || "Unauthorized" };

    const dataToUpdate: any = {};
    if (totalTransport === null || totalTransport === undefined) {
      dataToUpdate.totalTransport = null;
    } else {
      dataToUpdate.totalTransport = parseFloat(totalTransport.toString()) || 0;
    }

    const updated = await prisma.rekapHonorarium.update({
      where: { id: rekapId },
      data: dataToUpdate,
      include: { fasilitator: true, laporan: true }
    });

    revalidatePath('/fasilitator/rekap-honor');
    revalidatePath('/portal/rekap');
    return { success: true, rekap: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('Error in updateRekapTransport:', error);
    return { error: error.message || 'Unknown error' };
  }
}
