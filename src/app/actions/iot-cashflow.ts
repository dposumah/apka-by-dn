"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkAuth } from '@/lib/auth-check'

const PROJECT_NAME = "Pengadaan Starter Kit IoT 100 Kit"

/**
 * Helper to get or generate the next sequential Journal Entry Number (e.g. JU-2026-0860)
 */
async function getNextJournalEntryNumber(): Promise<string> {
  const lastEntry = await prisma.journalEntry.findFirst({
    where: { entryNumber: { startsWith: 'JU-2026-' } },
    orderBy: { entryNumber: 'desc' }
  })

  let nextSeq = 860
  if (lastEntry) {
    const parts = lastEntry.entryNumber.split('-')
    const num = parseInt(parts[parts.length - 1] || '0', 10)
    if (!isNaN(num)) nextSeq = Math.max(nextSeq, num + 1)
  }

  return `JU-2026-${String(nextSeq).padStart(4, '0')}`
}

/**
 * Ensure default CashflowProject exists and seed SP2D + Belanja 100 Kit if not present
 */
async function ensureIoTCashflowProjectAndSeed(userId?: string) {
  let project = await prisma.cashflowProject.findUnique({
    where: { name: PROJECT_NAME }
  })

  if (!project) {
    project = await prisma.cashflowProject.create({
      data: {
        name: PROJECT_NAME,
        description: "Buku Kas Keluar-Masuk Proyek Pengadaan Starter Kit IoT 100 Kit (5 Wilayah) terintegrasi Akuntansi Utama"
      }
    })
  }

  // Check if initial SP2D exists
  const existingSP2D1 = await prisma.cashflowTransaction.findFirst({
    where: {
      projectId: project.id,
      description: { contains: '260880000135881' }
    }
  })

  const bcaAccount = await prisma.account.findUnique({ where: { code: '111.11.101' } })
  const pendAccount = await prisma.account.findUnique({ where: { code: '400.10.105' } }) || await prisma.account.findUnique({ where: { code: '400.10.102' } })
  const bebanAccount = await prisma.account.findUnique({ where: { code: '600.10.034' } })
  const period = await prisma.fiscalPeriod.findFirst({ where: { name: '2026' } })

  // Seed SP2D 1 (Rp 140.267.400)
  if (!existingSP2D1) {
    const trx1 = await prisma.cashflowTransaction.create({
      data: {
        projectId: project.id,
        date: new Date('2026-11-05T00:00:00.000Z'),
        type: 'INCOME',
        amount: 140267400,
        category: 'Penerimaan SP2D Kemendikbud',
        description: 'Penerimaan SP2D No. 260880000135881 - Kontrak 0717a/PPK1.3/PR/2026 & BAST 0901a/PPK1.3/PR/2026 (SPM Bruto Rp 158.874.300, Pajak Rp 18.606.900, Netto Rp 140.267.400)',
        paymentMethod: 'Bank BCA (111.11.101)',
        receiptUrl: '/documents/sp2d/sp2d-158-jully.pdf',
        status: 'COMPLETED',
        createdById: userId || null
      }
    })

    // Create matching JournalEntry in Akuntansi Utama
    if (bcaAccount && pendAccount) {
      const entryNum = await getNextJournalEntryNumber()
      await prisma.journalEntry.create({
        data: {
          entryNumber: entryNum,
          date: trx1.date,
          description: `[Uang Masuk SP2D IoT 100 Kit] Kontrak 0717a & BAST 0901a - SP2D 260880000135881`,
          reference: `SP2D-260880000135881`,
          attachmentUrl: trx1.receiptUrl,
          status: 'POSTED',
          totalDebit: trx1.amount,
          totalCredit: trx1.amount,
          fiscalPeriodId: period?.id || null,
          createdById: userId || null,
          lines: {
            create: [
              {
                accountId: bcaAccount.id,
                debit: trx1.amount,
                credit: 0,
                description: `Penerimaan Kas/Bank SP2D No. 260880000135881 Ditjen PAUD Dikdas Dikmen`
              },
              {
                accountId: pendAccount.id,
                debit: 0,
                credit: trx1.amount,
                description: `Pendapatan Proyek Pengadaan Starter Kit IoT 100 Kit (SP2D 260880000135881)`
              }
            ]
          }
        }
      })
    }
  }

  // Seed SP2D 2 (Rp 93.511.600)
  const existingSP2D2 = await prisma.cashflowTransaction.findFirst({
    where: {
      projectId: project.id,
      description: { contains: '260880000135880' }
    }
  })

  if (!existingSP2D2) {
    const trx2 = await prisma.cashflowTransaction.create({
      data: {
        projectId: project.id,
        date: new Date('2026-11-05T00:00:00.000Z'),
        type: 'INCOME',
        amount: 93511600,
        category: 'Penerimaan SP2D Kemendikbud',
        description: 'Penerimaan SP2D No. 260880000135880 - Kontrak 0717b/PPK1.3/PR/2026 & BAST 0901b/PPK1.3/PR/2026 (SPM Bruto Rp 105.916.200, Pajak Rp 12.404.600, Netto Rp 93.511.600)',
        paymentMethod: 'Bank BCA (111.11.101)',
        receiptUrl: '/documents/sp2d/sp2d-105-jully.pdf',
        status: 'COMPLETED',
        createdById: userId || null
      }
    })

    if (bcaAccount && pendAccount) {
      const entryNum = await getNextJournalEntryNumber()
      await prisma.journalEntry.create({
        data: {
          entryNumber: entryNum,
          date: trx2.date,
          description: `[Uang Masuk SP2D IoT 100 Kit] Kontrak 0717b & BAST 0901b - SP2D 260880000135880`,
          reference: `SP2D-260880000135880`,
          attachmentUrl: trx2.receiptUrl,
          status: 'POSTED',
          totalDebit: trx2.amount,
          totalCredit: trx2.amount,
          fiscalPeriodId: period?.id || null,
          createdById: userId || null,
          lines: {
            create: [
              {
                accountId: bcaAccount.id,
                debit: trx2.amount,
                credit: 0,
                description: `Penerimaan Kas/Bank SP2D No. 260880000135880 Ditjen PAUD Dikdas Dikmen`
              },
              {
                accountId: pendAccount.id,
                debit: 0,
                credit: trx2.amount,
                description: `Pendapatan Proyek Pengadaan Starter Kit IoT 100 Kit (SP2D 260880000135880)`
              }
            ]
          }
        }
      })
    }
  }

  // Seed 4 Pos Belanja Realisasi Starter Kit 100 (Total Rp 101.986.940) if no expense exists yet
  const existingExpenses = await prisma.cashflowTransaction.count({
    where: {
      projectId: project.id,
      type: 'EXPENSE'
    }
  })

  if (existingExpenses === 0) {
    const posBelanjaList = [
      {
        ref: 'IOT-EXP-POS-A',
        category: 'A. IoT CORE KIT',
        amount: 63279000,
        description: 'Belanja Pos A. IoT CORE KIT (25 item lengkap starter kit IoT 100 unit: ESP32, Solder, Sensor, dll)'
      },
      {
        ref: 'IOT-EXP-POS-B',
        category: 'B. PERANGKAT PENDUKUNG',
        amount: 30457500,
        description: 'Belanja Pos B. PERANGKAT PENDUKUNG (10 item: Komponen mekanik, rangka, obeng, tang, dll)'
      },
      {
        ref: 'IOT-EXP-POS-C',
        category: 'C. KEMASAN & KELENGKAPAN / QC',
        amount: 7040000,
        description: 'Belanja Pos C. KEMASAN & KELENGKAPAN / QC (8 item: Box Kontainer 15L, sablon logo, modul cetak, QC perakitan)'
      },
      {
        ref: 'IOT-EXP-POS-D',
        category: 'D. TAMBAHAN & ONGKIR',
        amount: 1210440,
        description: 'Belanja Pos D. TAMBAHAN & ONGKIR PENGIRIMAN (3 item: Ekstra charger baterai 18650 & ongkos kirim)'
      }
    ]

    for (const pos of posBelanjaList) {
      const expTrx = await prisma.cashflowTransaction.create({
        data: {
          projectId: project.id,
          date: new Date('2026-11-06T00:00:00.000Z'),
          type: 'EXPENSE',
          amount: pos.amount,
          category: pos.category,
          description: pos.description,
          paymentMethod: 'Bank BCA (111.11.101)',
          status: 'COMPLETED',
          createdById: userId || null
        }
      })

      if (bcaAccount && bebanAccount) {
        const entryNum = await getNextJournalEntryNumber()
        await prisma.journalEntry.create({
          data: {
            entryNumber: entryNum,
            date: expTrx.date,
            description: `[Pengeluaran Belanja 100 Kit] ${pos.description}`,
            reference: pos.ref,
            status: 'POSTED',
            totalDebit: expTrx.amount,
            totalCredit: expTrx.amount,
            fiscalPeriodId: period?.id || null,
            createdById: userId || null,
            lines: {
              create: [
                {
                  accountId: bebanAccount.id,
                  debit: expTrx.amount,
                  credit: 0,
                  description: `Beban Belanja Proyek IoT: ${pos.category}`
                },
                {
                  accountId: bcaAccount.id,
                  debit: 0,
                  credit: expTrx.amount,
                  description: `Kas Keluar BCA untuk ${pos.description}`
                }
              ]
            }
          }
        })
      }
    }
  }

  return project
}

/**
 * Fetch all cashflow data for IoT 100 Kits with balance summary and linked journal entries
 */
export async function getIoTCashflowData() {
  try {
    const auth = await checkAuth().catch(() => null)
    const project = await ensureIoTCashflowProjectAndSeed(auth?.userId)

    const transactions = await prisma.cashflowTransaction.findMany({
      where: { projectId: project.id },
      orderBy: { date: 'desc' }
    })

    // Fetch matching journal entries to show journal codes (JU-2026-xxxx)
    const journalRefs = [
      'SP2D-260880000135881',
      'SP2D-260880000135880',
      'IOT-EXP-POS-A',
      'IOT-EXP-POS-B',
      'IOT-EXP-POS-C',
      'IOT-EXP-POS-D',
      ...transactions.map(t => `IOT-CASH-${t.id}`)
    ]

    const journals = await prisma.journalEntry.findMany({
      where: { reference: { in: journalRefs } },
      select: {
        id: true,
        entryNumber: true,
        reference: true,
        status: true,
        totalDebit: true
      }
    })

    const journalMap: Record<string, any> = {}
    for (const j of journals) {
      if (j.reference) {
        journalMap[j.reference] = j
      }
    }

    let totalMasuk = 0
    let totalKeluar = 0

    // Format transactions with running balances and journal info
    // Sort ascending for accurate running balance calculation
    const sortedAsc = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let currentBalance = 0

    const enrichedWithBalance = sortedAsc.map((t, idx) => {
      if (t.type === 'INCOME') {
        totalMasuk += t.amount
        currentBalance += t.amount
      } else {
        totalKeluar += t.amount
        currentBalance -= t.amount
      }

      // Check linked journal
      let refKey = `IOT-CASH-${t.id}`
      if (t.description.includes('260880000135881')) refKey = 'SP2D-260880000135881'
      else if (t.description.includes('260880000135880')) refKey = 'SP2D-260880000135880'
      else if (t.category.includes('CORE KIT')) refKey = 'IOT-EXP-POS-A'
      else if (t.category.includes('PERANGKAT PENDUKUNG')) refKey = 'IOT-EXP-POS-B'
      else if (t.category.includes('KEMASAN')) refKey = 'IOT-EXP-POS-C'
      else if (t.category.includes('TAMBAHAN')) refKey = 'IOT-EXP-POS-D'

      const linkedJournal = journalMap[refKey] || null

      return {
        ...t,
        runningBalance: currentBalance,
        journalEntryNumber: linkedJournal?.entryNumber || null,
        journalStatus: linkedJournal?.status || 'POSTED'
      }
    })

    // Return in reverse (newest first) for user-friendly table
    const resultList = [...enrichedWithBalance].reverse()

    return {
      success: true,
      projectId: project.id,
      projectName: project.name,
      totalMasuk,
      totalKeluar,
      sisaSaldo: totalMasuk - totalKeluar,
      transactions: resultList
    }
  } catch (error: any) {
    console.error("Failed to get IoT cashflow data:", error)
    return {
      success: false,
      error: error.message,
      totalMasuk: 0,
      totalKeluar: 0,
      sisaSaldo: 0,
      transactions: []
    }
  }
}

/**
 * Create a simple Cash In or Cash Out transaction for IoT 100 Kits
 * Automatically syncs to Main Accounting Journal Entry
 */
export async function createIoTCashTransaction(data: {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  category: string
  date?: string
  paymentMethod?: string
  receiptUrl?: string
}) {
  try {
    const auth = await checkAuth().catch(() => null)
    const userId = auth?.userId

    const project = await prisma.cashflowProject.upsert({
      where: { name: PROJECT_NAME },
      update: {},
      create: { name: PROJECT_NAME, description: "Buku Kas Proyek IoT 100 Kit" }
    })

    const trxDate = data.date ? new Date(data.date) : new Date()

    const transaction = await prisma.cashflowTransaction.create({
      data: {
        projectId: project.id,
        date: trxDate,
        type: data.type,
        amount: Math.abs(Number(data.amount)),
        category: data.category || (data.type === 'INCOME' ? 'Penerimaan Proyek' : 'Belanja Operasional'),
        description: data.description,
        paymentMethod: data.paymentMethod || 'Bank BCA (111.11.101)',
        receiptUrl: data.receiptUrl || null,
        status: 'COMPLETED',
        createdById: userId || null
      }
    })

    // Automatically synchronize into Akuntansi Utama (JournalEntry & Lines)
    try {
      const bcaAccount = await prisma.account.findUnique({ where: { code: '111.11.101' } })
      const pendAccount = await prisma.account.findUnique({ where: { code: '400.10.105' } }) || await prisma.account.findUnique({ where: { code: '400.10.102' } })
      const bebanAccount = await prisma.account.findUnique({ where: { code: '600.10.034' } })
      const period = await prisma.fiscalPeriod.findFirst({ where: { name: '2026' } })

      if (bcaAccount && ((data.type === 'INCOME' && pendAccount) || (data.type === 'EXPENSE' && bebanAccount))) {
        const entryNum = await getNextJournalEntryNumber()
        const isIncome = data.type === 'INCOME'

        await prisma.journalEntry.create({
          data: {
            entryNumber: entryNum,
            date: trxDate,
            description: `[Buku Kas IoT 100 Kit] ${data.description}`,
            reference: `IOT-CASH-${transaction.id}`,
            attachmentUrl: data.receiptUrl || null,
            status: 'POSTED',
            totalDebit: transaction.amount,
            totalCredit: transaction.amount,
            fiscalPeriodId: period?.id || null,
            createdById: userId || null,
            lines: {
              create: isIncome
                ? [
                    {
                      accountId: bcaAccount.id,
                      debit: transaction.amount,
                      credit: 0,
                      description: `Penerimaan Kas/Bank BCA: ${data.description}`
                    },
                    {
                      accountId: pendAccount!.id,
                      debit: 0,
                      credit: transaction.amount,
                      description: `Pendapatan Proyek IoT 100 Kit: ${data.description}`
                    }
                  ]
                : [
                    {
                      accountId: bebanAccount!.id,
                      debit: transaction.amount,
                      credit: 0,
                      description: `Beban Belanja Proyek IoT: ${data.description}`
                    },
                    {
                      accountId: bcaAccount.id,
                      debit: 0,
                      credit: transaction.amount,
                      description: `Kas Keluar BCA untuk ${data.description}`
                    }
                  ]
            }
          }
        })
      }
    } catch (jErr) {
      console.error("Non-blocking journal sync error in IoT cashflow:", jErr)
    }

    revalidatePath('/alat-bahan-iot')
    revalidatePath('/jurnal')
    return { success: true, transaction }
  } catch (error: any) {
    console.error("Failed to create IoT cash transaction:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a cash transaction and clean up its corresponding journal entry
 */
export async function deleteIoTCashTransaction(id: string) {
  try {
    const trx = await prisma.cashflowTransaction.findUnique({ where: { id } })
    if (!trx) throw new Error("Transaksi tidak ditemukan")

    // Determine reference
    let refKey = `IOT-CASH-${id}`
    if (trx.description.includes('260880000135881')) refKey = 'SP2D-260880000135881'
    else if (trx.description.includes('260880000135880')) refKey = 'SP2D-260880000135880'
    else if (trx.category.includes('CORE KIT')) refKey = 'IOT-EXP-POS-A'
    else if (trx.category.includes('PERANGKAT PENDUKUNG')) refKey = 'IOT-EXP-POS-B'
    else if (trx.category.includes('KEMASAN')) refKey = 'IOT-EXP-POS-C'
    else if (trx.category.includes('TAMBAHAN')) refKey = 'IOT-EXP-POS-D'

    // Clean up JournalEntry in Akuntansi Utama
    try {
      const journal = await prisma.journalEntry.findFirst({
        where: { reference: refKey }
      })
      if (journal) {
        await prisma.journalEntryLine.deleteMany({
          where: { journalEntryId: journal.id }
        })
        await prisma.journalEntry.delete({
          where: { id: journal.id }
        })
      }
    } catch (jErr) {
      console.error("Error removing journal entry:", jErr)
    }

    // Delete transaction
    await prisma.cashflowTransaction.delete({
      where: { id }
    })

    revalidatePath('/alat-bahan-iot')
    revalidatePath('/jurnal')
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete IoT cash transaction:", error)
    return { success: false, error: error.message }
  }
}
