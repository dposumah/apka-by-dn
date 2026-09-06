const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/rekap/page.tsx', 'utf8')

const target = `const rekaps = await prisma.rekapHonorarium.findMany({
    where: { fasilitatorId: fasilitator.id },
    orderBy: { bulan: 'desc' },
    include: {
      laporan: true
    }
  })`

const replacement = `const rekapsData = await prisma.rekapHonorarium.findMany({
    where: { fasilitatorId: fasilitator.id },
    orderBy: { bulan: 'desc' },
    include: {
      laporan: true
    }
  })
  
  // Ambil ExpenseRequests untuk mengecek status pembayaran Honorarium
  const expenses = await prisma.expenseRequest.findMany({
    where: { fasilitatorId: fasilitator.id, receiptUrl: { in: rekapsData.map(r => r.filePdf).filter(Boolean) as string[] } }
  })
  
  const rekaps = rekapsData.map(r => {
    const expense = expenses.find(e => e.receiptUrl === r.filePdf)
    return { ...r, expense }
  })`

code = code.replace(target, replacement)
fs.writeFileSync('src/app/(snt)/portal/rekap/page.tsx', code)
